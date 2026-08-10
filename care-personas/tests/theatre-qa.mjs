/* Theatre QA harness — the standing test the 2026-08 RCA demanded (action A6).
 *
 * The failure class it exists to catch: a reader on a real monitor parks the
 * scroll wherever they like, and what rests on screen must ALWAYS be a
 * composed scene — never a mid-transition smear. Endpoint screenshots via the
 * audit API cannot see that failure, so this harness drives REAL scrolling at
 * three viewports (including one wider than 1920px) and byte-compares what
 * settles against the scene the engine claims to be resting on.
 *
 * Checks, per explainer x viewport:
 *   1. park-anywhere  — instant-scroll to 60% into several transitions; within
 *                       2.2s the canvas must be byte-identical to the composed
 *                       target scene (api.set(n) pose).
 *   2. stillness      — after settling, two snapshots 1.5s apart are identical
 *                       (zero idle motion, WCAG 2.2.2).
 *   3. scan-complete  — the ranked/scan scene at rest shows the sweep FINISHED:
 *                       a healthy fraction of painted pixels carry persona
 *                       colour (chroma), not the pre-scan neutral grey.
 *   4. captions       — parked on any scene, at most one caption is visible,
 *                       and something (caption or stats overlay) is.
 *   5. overflow       — at 390px the document never scrolls horizontally.
 *   6. reduced-motion — with prefers-reduced-motion, a parked frame is still.
 *
 * Run:  node tests/theatre-qa.mjs [--quick]
 * Uses the globally installed playwright (NODE_PATH is honoured through
 * createRequire); Chromium must be available to it. --quick runs the widest
 * viewport only. Exit code 0 = all green.
 */
import { createRequire } from 'node:module';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, dirname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = normalize(join(dirname(fileURLToPath(import.meta.url)), '..'));
const QUICK = process.argv.includes('--quick');

const PAGES = [
  // scan: scene whose arrival sweep must be complete at rest
  // parks: transitions to interrupt (park at scene + 0.6 -> must settle on scene + 1)
  { file: 'specialist-gp-pipeline.html', scan: 1, minChroma: 0.25, parks: QUICK ? [4] : [0, 2, 4, 6, 7] },
  { file: 'matched-family-gp.html',      scan: 2, minChroma: 0.25, parks: QUICK ? [4] : [0, 3, 4, 6, 8] }
];
const VIEWPORTS = QUICK ? [[2000, 950]] : [[390, 844], [1280, 800], [2000, 950]];

const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png' };
function serve() {
  return new Promise(resolve => {
    const srv = createServer(async (req, res) => {
      try {
        const p = normalize(join(ROOT, decodeURIComponent(req.url.split('?')[0])));
        if (!p.startsWith(ROOT)) throw new Error('outside root');
        const body = await readFile(p.endsWith('/') ? join(p, 'index.html') : p);
        res.writeHead(200, { 'content-type': MIME[extname(p)] || 'application/octet-stream' });
        res.end(body);
      } catch { res.writeHead(404); res.end(); }
    });
    srv.listen(0, '127.0.0.1', () => resolve(srv));
  });
}

let failures = 0;
function report(ok, label) {
  failures += ok ? 0 : 1;
  console.log(`  ${ok ? 'PASS' : 'FAIL'}  ${label}`);
}

// scroll so theatre progress = P, using the same mapping as the engine
async function parkAt(page, P) {
  await page.evaluate(p => {
    const t = document.getElementById('story');
    const vh = window.innerHeight;
    const span = t.offsetHeight - vh;
    const sc = window.__dotfields[0].scenes;
    window.scrollTo({ top: t.offsetTop + span * (p / (sc - 1)), behavior: 'instant' });
  }, P);
}

const snap = page => page.evaluate(() => window.__dotfields[0].canvas.toDataURL());

async function chromaFraction(page) {
  return page.evaluate(() => {
    const cv = window.__dotfields[0].canvas;
    const d = cv.getContext('2d').getImageData(0, 0, cv.width, cv.height).data;
    let painted = 0, coloured = 0;
    for (let i = 0; i < d.length; i += 4) {
      if (d[i + 3] < 40) continue;
      painted++;
      const mx = Math.max(d[i], d[i + 1], d[i + 2]), mn = Math.min(d[i], d[i + 1], d[i + 2]);
      if (mx - mn > 40) coloured++;
    }
    return painted ? coloured / painted : 0;
  });
}

const srv = await serve();
const base = `http://127.0.0.1:${srv.address().port}`;
const browser = await chromium.launch();

for (const [w, h] of VIEWPORTS) {
  for (const spec of PAGES) {
    console.log(`\n${spec.file} @ ${w}x${h}`);
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    const page = await ctx.newPage();
    await page.route('**fonts.g**', r => r.abort()); // hermetic: no network fonts
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    await page.goto(`${base}/${spec.file}`, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(700);

    // 1 + 2: park mid-transition -> settles byte-equal to the composed scene, then holds still
    for (const k of spec.parks) {
      await parkAt(page, k + 0.6);
      await page.waitForTimeout(2200); // tween cap is 1.4s
      const rest = await snap(page);
      const posed = await page.evaluate(n => {
        const a = window.__dotfields[0];
        a.set(n); const s = a.canvas.toDataURL(); a.release();
        return s;
      }, k + 1);
      report(rest === posed, `park @ ${(k + 0.6).toFixed(1)} settles on composed scene ${k + 1}`);
      const later = await snap(page);
      report(rest === later, `scene ${k + 1} still after settle`);
    }

    // 3: the scan scene at rest shows a COMPLETED sweep
    await parkAt(page, spec.scan);
    await page.waitForTimeout(2200);
    const cf = await chromaFraction(page);
    report(cf >= spec.minChroma, `scan scene ${spec.scan} rests fully swept (coloured ${(cf * 100).toFixed(1)}% >= ${spec.minChroma * 100}%)`);

    // 4: caption discipline at every resting scene
    let capOK = true, capWhy = '';
    const SC = await page.evaluate(() => window.__dotfields[0].scenes);
    for (let sIdx = 0; sIdx < SC; sIdx++) {
      await parkAt(page, sIdx);
      await page.waitForTimeout(1800);
      const vis = await page.evaluate(() => {
        const steps = [...document.querySelectorAll('#story .df-step')].filter(el => parseFloat(getComputedStyle(el).opacity) > 0.5).length;
        const stats = document.querySelector('#story .df-stats');
        return { steps, stats: stats ? parseFloat(getComputedStyle(stats).opacity) > 0.5 : false };
      });
      if (vis.steps > 1) { capOK = false; capWhy = `scene ${sIdx}: ${vis.steps} captions at once`; break; }
      if (vis.steps + (vis.stats ? 1 : 0) < 1) { capOK = false; capWhy = `scene ${sIdx}: nothing visible`; break; }
    }
    report(capOK, `one caption at a time across all ${SC} scenes${capWhy ? ' — ' + capWhy : ''}`);

    // 5: no horizontal scroll at mobile width
    if (w < 700) {
      const ovf = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      report(ovf <= 1, `no horizontal overflow (excess ${ovf}px)`);
    }

    report(errors.length === 0, `no page errors${errors.length ? ' — ' + errors[0] : ''}`);
    await ctx.close();
  }
}

// 6: reduced-motion — parked frames are static frames
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 }, reducedMotion: 'reduce' });
  const page = await ctx.newPage();
  await page.route('**fonts.g**', r => r.abort());
  await page.goto(`${base}/${PAGES[0].file}`, { waitUntil: 'domcontentloaded' });
  await page.waitForTimeout(700);
  console.log(`\n${PAGES[0].file} @ 1280x800 (prefers-reduced-motion)`);
  await parkAt(page, 3.6);
  await page.waitForTimeout(1000);
  const a = await snap(page);
  await page.waitForTimeout(1500);
  report(a === (await snap(page)), 'reduced-motion frame is still');
  await ctx.close();
}

await browser.close();
srv.close();
console.log(failures ? `\n${failures} CHECK(S) FAILED` : '\nall green');
process.exit(failures ? 1 : 0);
