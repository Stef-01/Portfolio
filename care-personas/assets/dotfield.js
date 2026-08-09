/* ============================================================
   CARE PERSONAS — DotField v2 ("people, not dots")
   A scroll-driven, procedural unit-PERSON theatre in the persona-
   explainer tradition. Every unit is a small human figure — head,
   hair, shoulders, and (when the camera zooms close enough) a face.
   Figures take persona colours under a scan, amalgamate between
   pools/clusters/bars, and the camera zooms in and out of the story.

   Clutter budget (enforced): fully user-paced (nothing moves unless
   the reader scrolls) · one caption at a time · ≤5 persona hues +
   neutral · no chrome on stage · dwell:travel 2:1 · reduced motion
   gets one static composed frame.
   ============================================================ */
(function () {
  'use strict';

  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- utilities ---------- */
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function smooth(t) { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); }
  function mulberry32(a) {
    return function () {
      a |= 0; a = a + 0x6D2B79F5 | 0;
      var t = Math.imul(a ^ a >>> 15, 1 | a);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function hexRgb(hex) {
    var h = hex.replace('#', '');
    return [parseInt(h.substr(0, 2), 16), parseInt(h.substr(2, 2), 16), parseInt(h.substr(4, 2), 16)];
  }
  function mixRgb(a, b, t) {
    return [Math.round(lerp(a[0], b[0], t)), Math.round(lerp(a[1], b[1], t)), Math.round(lerp(a[2], b[2], t))];
  }
  function css(rgb) { return 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')'; }

  var SKINS = ['#f2c9a0', '#eeb98d', '#d29a6b', '#c68b59', '#a06a3f', '#8c5a33', '#5c3b21'].map(hexRgb);
  var HAIRS = ['#201209', '#201209', '#3a2a1c', '#3a2a1c', '#5a3b23', '#7a3b1e', '#8d8d95', '#e6e9f0'].map(hexRgb);

  /* ============================================================ */
  window.DotField = function (opts) {
    var theatre = typeof opts.theatre === 'string' ? document.querySelector(opts.theatre) : opts.theatre;
    var canvas = typeof opts.canvas === 'string' ? document.querySelector(opts.canvas) : opts.canvas;
    if (!theatre || !canvas) return null;

    var ctx = canvas.getContext('2d');
    var counts = opts.counts;
    var N = counts.reduce(function (a, b) { return a + b; }, 0);
    var G = counts.length;
    var groupColors = opts.groupColors.map(function (c) { return c ? hexRgb(c) : null; });
    var neutral = hexRgb(opts.neutral || '#b6c0cf');
    var ink = opts.ink || '#1b2846';
    var ink2 = opts.ink2 || '#4a5674';
    var accent = opts.accent || '#eb6834';
    var scenes = opts.scenes;
    var SC = scenes.length;

    /* ---------- roster ---------- */
    var groups = [], idxInGroup = [];
    (function () {
      for (var g = 0; g < G; g++) for (var i = 0; i < counts[g]; i++) { groups.push(g); idxInGroup.push(i); }
    })();
    var rand = mulberry32(20260809);
    var skin = [], hair = [], jit = [];
    for (var i0 = 0; i0 < N; i0++) {
      skin.push(SKINS[Math.floor(rand() * SKINS.length)]);
      hair.push(HAIRS[Math.floor(rand() * HAIRS.length)]);
      jit.push([rand() * 2 - 1, rand() * 2 - 1]);
    }

    /* ---------- geometry ---------- */
    var W = 0, H = 0, DPR = 1, U = 9; // U = base unit (figure) size in px
    var layouts = {}, meta = {};

    function phyllo(cx, cy, count, pitch, startI) {
      var out = [], golden = 2.399963;
      var R = pitch * Math.sqrt(count) * 0.62;
      for (var i = 0; i < count; i++) {
        var rr = R * Math.sqrt((i + 0.5) / count);
        var th = (i + (startI || 0)) * golden;
        out.push([cx + rr * Math.cos(th), cy + rr * Math.sin(th)]);
      }
      out.radius = R;
      return out;
    }

    // built-in layout builders (custom builders come via opts.layouts)
    function builtinCloud(spreadK, seed) {
      var m = Math.min(W, H);
      var pts = phyllo(W * 0.5, H * 0.46, N, U * (1.55 * spreadK), seed || 0);
      for (var i = 0; i < N; i++) {
        pts[i] = [pts[i][0] + jit[i][0] * m * 0.03 * spreadK, pts[i][1] + jit[i][1] * m * 0.03 * spreadK];
      }
      return { pos: pts, meta: { labels: [] } };
    }
    function builtinClusters() {
      var narrow = W < 680;
      var slots = narrow
        ? [[0.30, 0.32], [0.72, 0.42], [0.32, 0.57], [0.72, 0.71], [0.34, 0.85]]
        : [[0.15, 0.35], [0.32, 0.66], [0.53, 0.35], [0.73, 0.66], [0.88, 0.33]];
      var pos = new Array(N), L = [];
      for (var g = 0; g < G; g++) {
        var cx = slots[g % slots.length][0] * W, cy = slots[g % slots.length][1] * H;
        var pts = phyllo(cx, cy, counts[g], U * 1.55, g * 13);
        var gi = 0;
        for (var d = 0; d < N; d++) if (groups[d] === g) pos[d] = pts[gi++];
        L.push({ x: cx, y: cy + pts.radius + (narrow ? 16 : 22), text: (opts.labels[g] || '') + ' · ' + Math.round(counts[g] * 100 / N) + '%' });
      }
      return { pos: pos, meta: { labels: L } };
    }
    function builtinBar() {
      var rows = 8, rowH = U * 1.9, colW = U * 1.35;
      var bw = W * 0.84, bx = W * 0.08, by = H * 0.46 - rows * rowH / 2;
      var gap = Math.max(2, W * 0.006);
      var pos = new Array(N), L = [], x0 = bx;
      for (var g = 0; g < G; g++) {
        var gw = bw * counts[g] / N - gap;
        var cols = Math.ceil(counts[g] / rows);
        var cw = Math.min(gw / cols, colW * 1.6);
        var gi = 0;
        for (var d = 0; d < N; d++) if (groups[d] === g) {
          var c = Math.floor(gi / rows), r = gi % rows;
          pos[d] = [x0 + cw * (c + 0.5), by + rowH * (r + 0.5)];
          gi++;
        }
        L.push({ x: x0 + gw / 2, y: by - (W < 680 ? 14 : 20), text: (W < 680 ? '' : (opts.labels[g] || '') + ' · ') + Math.round(counts[g] * 100 / N) + '%' });
        x0 += gw + gap;
      }
      var doc = W < 680 ? [0.5 * W, 0.72 * H] : [0.80 * W, 0.28 * H];
      return { pos: pos, meta: { labels: L, doc: doc } };
    }

    var builderCtx = null;
    function buildLayouts() {
      var m = Math.min(W, H);
      U = clamp(m * 0.013, 6.5, 11);
      builderCtx = {
        W: W, H: H, N: N, U: U, narrow: W < 680,
        groups: groups, counts: counts, idxInGroup: idxInGroup,
        phyllo: phyllo, jit: jit
      };
      var defs = {
        cloud: function () { return builtinCloud(1, 0); },
        spread: function () { return builtinCloud(1.25, 7); },
        clusters: builtinClusters,
        bar: builtinBar
      };
      if (opts.layouts) for (var k in opts.layouts) defs[k] = opts.layouts[k];
      layouts = {}; meta = {};
      // only build layouts referenced by scenes (plus 'bar' if extras need it)
      var needed = {};
      scenes.forEach(function (s) { needed[s.key] = 1; });
      for (var name in needed) {
        var out = defs[name](builderCtx);
        layouts[name] = out.pos;
        meta[name] = out.meta || {};
      }
    }

    /* ---------- colour & alpha ---------- */
    function clothingOf(d, scene, tt) {
      if (!scene) return neutral;
      var g = groups[d];
      var col = groupColors[g];
      if (!col) return neutral;
      var on = scene.colorGroups && (scene.colorGroups === 'all' || scene.colorGroups.indexOf(g) >= 0);
      if (!on) return neutral;
      if (scene.scan && (scene.scan.groups === 'all' || scene.scan.groups.indexOf(g) >= 0)) {
        var P = layouts[scene.key][d];
        var f;
        if (scene.scan.axis === 'y') {
          var sy = (tt * 1.3 - 0.15) * H;
          f = smooth((sy - P[1]) / 60 + 0.5);
        } else {
          var sx = (tt * 1.3 - 0.15) * W;
          f = smooth((sx - P[0]) / 60 + 0.5);
        }
        return mixRgb(neutral, col, f);
      }
      return col;
    }
    function alphaOf(d, scene) {
      if (!scene) return 1;
      var a = scene.key === 'spread' ? 0.6 : 1;
      if (scene.dim) a = scene.dim.keep.indexOf(groups[d]) >= 0 ? 1 : scene.dim.to;
      return a;
    }

    /* ---------- camera ---------- */
    function camOf(scene) {
      var c = (scene && scene.cam) || { z: 1, x: 0.5, y: 0.46 };
      if (scene && scene.camNarrow && W < 680) c = scene.camNarrow;
      return [c.z, c.x * W, c.y * H];
    }
    function project(p, cam) {
      return [(p[0] - cam[1]) * cam[0] + W * 0.5, (p[1] - cam[2]) * cam[0] + H * 0.46];
    }

    /* ---------- the person glyph ---------- */
    function drawPerson(x, y, s, clothing, d, alpha) {
      // s = figure unit size on screen; total height ≈ 1.7s
      ctx.globalAlpha = alpha;
      // shoulders / bust
      ctx.fillStyle = css(clothing);
      ctx.beginPath();
      ctx.arc(x, y + 0.62 * s, 0.5 * s, Math.PI, 0);
      ctx.lineTo(x + 0.5 * s, y + 1.06 * s);
      ctx.lineTo(x - 0.5 * s, y + 1.06 * s);
      ctx.closePath();
      ctx.fill();
      // head
      ctx.fillStyle = css(skin[d]);
      ctx.beginPath(); ctx.arc(x, y - 0.14 * s, 0.36 * s, 0, 6.2832); ctx.fill();
      // hair cap
      ctx.fillStyle = css(hair[d]);
      ctx.beginPath();
      ctx.arc(x, y - 0.14 * s, 0.37 * s, Math.PI, 0);
      ctx.arc(x, y - 0.06 * s, 0.29 * s, 0, Math.PI, true);
      ctx.closePath(); ctx.fill();
      // face appears when the camera is close enough to meet their eyes
      if (s > 15) {
        var fa = clamp((s - 15) / 8, 0, 1) * alpha;
        ctx.globalAlpha = fa;
        ctx.fillStyle = '#201209';
        ctx.beginPath(); ctx.arc(x - 0.12 * s, y - 0.15 * s, 0.045 * s, 0, 6.2832); ctx.fill();
        ctx.beginPath(); ctx.arc(x + 0.12 * s, y - 0.15 * s, 0.045 * s, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = '#201209'; ctx.lineWidth = Math.max(1, 0.04 * s); ctx.lineCap = 'round';
        ctx.beginPath(); ctx.arc(x, y - 0.06 * s, 0.13 * s, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
        ctx.globalAlpha = alpha;
      }
    }

    /* ---------- clinician figure (bigger, pale coat, stethoscope, always a face) ---------- */
    function drawClinician(x, y, s, spec, alpha) {
      ctx.globalAlpha = alpha;
      var sk = SKINS[spec.skin % SKINS.length], hr = HAIRS[spec.hair % HAIRS.length];
      // coat
      ctx.fillStyle = '#f4f7fb';
      ctx.strokeStyle = 'rgba(27,40,70,.38)';
      ctx.lineWidth = Math.max(1, 0.05 * s);
      ctx.beginPath();
      ctx.arc(x, y + 0.62 * s, 0.52 * s, Math.PI, 0);
      ctx.lineTo(x + 0.52 * s, y + 1.08 * s);
      ctx.lineTo(x - 0.52 * s, y + 1.08 * s);
      ctx.closePath(); ctx.fill(); ctx.stroke();
      // stethoscope
      ctx.strokeStyle = '#16244a'; ctx.lineWidth = Math.max(1, 0.055 * s); ctx.lineCap = 'round';
      ctx.beginPath(); ctx.arc(x, y + 0.52 * s, 0.30 * s, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
      ctx.fillStyle = '#16244a';
      ctx.beginPath(); ctx.arc(x - 0.24 * s, y + 0.74 * s, 0.075 * s, 0, 6.2832); ctx.fill();
      // head + hair + face
      ctx.fillStyle = css(sk);
      ctx.beginPath(); ctx.arc(x, y - 0.14 * s, 0.36 * s, 0, 6.2832); ctx.fill();
      ctx.fillStyle = css(hr);
      ctx.beginPath();
      ctx.arc(x, y - 0.14 * s, 0.37 * s, Math.PI, 0);
      ctx.arc(x, y - 0.06 * s, 0.29 * s, 0, Math.PI, true);
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#201209';
      ctx.beginPath(); ctx.arc(x - 0.12 * s, y - 0.15 * s, 0.05 * s, 0, 6.2832); ctx.fill();
      ctx.beginPath(); ctx.arc(x + 0.12 * s, y - 0.15 * s, 0.05 * s, 0, 6.2832); ctx.fill();
      ctx.strokeStyle = '#201209'; ctx.lineWidth = Math.max(1, 0.04 * s);
      ctx.beginPath(); ctx.arc(x, y - 0.06 * s, 0.13 * s, 0.2 * Math.PI, 0.8 * Math.PI); ctx.stroke();
      if (spec.label) {
        ctx.fillStyle = ink2; ctx.textAlign = 'center';
        ctx.font = '700 ' + Math.max(10, Math.round(0.5 * s)) + 'px Poppins, Inter, system-ui, sans-serif';
        ctx.fillText(spec.label, x, y + 1.5 * s);
      }
    }
    function drawClinicians(scene, alpha, cam) {
      if (!scene || alpha <= 0.02) return;
      var C = (meta[scene.key] || {}).clinicians || [];
      for (var i = 0; i < C.length; i++) {
        var p = project([C[i].x, C[i].y], cam);
        if (p[0] < -60 || p[0] > W + 60 || p[1] < -60 || p[1] > H + 60) continue;
        drawClinician(p[0], p[1], U * 2.1 * cam[0], C[i], alpha);
      }
      ctx.globalAlpha = 1;
    }

    /* ---------- zones (soft pool backdrops) ---------- */
    function drawZones(scene, alpha, cam) {
      if (!scene || alpha <= 0.02) return;
      var Z = (meta[scene.key] || {}).zones || [];
      for (var i = 0; i < Z.length; i++) {
        var p = project([Z[i].x, Z[i].y], cam);
        ctx.globalAlpha = alpha * (Z[i].alpha || 0.06);
        ctx.fillStyle = Z[i].color || '#2a78d6';
        ctx.beginPath(); ctx.arc(p[0], p[1], Z[i].r * cam[0], 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
    }

    /* ---------- labels ---------- */
    function drawLabels(scene, alpha, cam) {
      if (!scene || !scene.labels || alpha <= 0.02) return;
      var L = (meta[scene.key] || {}).labels || [];
      var grouped = scene.key === 'clusters' || scene.key === 'bar';
      ctx.save();
      ctx.textAlign = 'center';
      for (var i = 0; i < L.length; i++) {
        if (!L[i].text) continue;
        var la = alpha;
        if (grouped && scene.dim) la *= scene.dim.keep.indexOf(i) >= 0 ? 1 : scene.dim.to;
        if (L[i].dimWith != null && scene.dim) la *= scene.dim.keep.indexOf(L[i].dimWith) >= 0 ? 1 : scene.dim.to;
        ctx.globalAlpha = la;
        ctx.fillStyle = L[i].muted ? ink2 : ink;
        ctx.font = (L[i].big ? '700 ' + (W < 680 ? 13 : 15) : '600 ' + (W < 680 ? 11 : 13)) + 'px Poppins, Inter, system-ui, sans-serif';
        var p = project([L[i].x, L[i].y], cam);
        ctx.fillText(L[i].text, p[0], p[1]);
      }
      ctx.restore();
    }

    /* ---------- extras ---------- */
    function drawExtras(scene, tt, alpha, cam) {
      if (!scene || !scene.extra || alpha <= 0.02) return;
      var M = meta[scene.key] || {};
      ctx.save(); ctx.globalAlpha = alpha;
      var z = cam[0];
      function P(x, y) { return project([x, y], cam); }

      if (scene.extra === 'link' && M.link) {
        var A = M.link.a, B = M.link.b;
        var qx = (A[0] + B[0]) / 2, qy = Math.min(A[1], B[1]) - H * 0.16;
        var a2 = P(A[0], A[1]), b2 = P(B[0], B[1]), q2 = P(qx, qy);
        ctx.strokeStyle = 'rgba(138,147,168,.55)'; ctx.lineWidth = 1.5 * z;
        ctx.beginPath(); ctx.moveTo(a2[0], a2[1]); ctx.quadraticCurveTo(q2[0], q2[1], b2[0], b2[1]); ctx.stroke();
        var u = tt * 2 % 2; u = u > 1 ? 2 - u : u; u = smooth(u);
        var px = (1 - u) * (1 - u) * A[0] + 2 * (1 - u) * u * qx + u * u * B[0];
        var py = (1 - u) * (1 - u) * A[1] + 2 * (1 - u) * u * qy + u * u * B[1];
        var pp = P(px, py);
        ctx.fillStyle = accent;
        ctx.beginPath(); ctx.arc(pp[0], pp[1], 5 * z, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
        if (scene.linkLabel) {
          ctx.fillStyle = ink2; ctx.font = '600 12px Inter, system-ui, sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(scene.linkLabel, q2[0], q2[1] - 10);
        }
      }
      if (scene.extra === 'match' && M.doc) {
        var D = M.doc, start = M.matchFrom || layouts[scene.key][0];
        var u2 = smooth(clamp((tt - 0.15) / 0.7, 0, 1));
        var qx2 = (start[0] + D[0]) / 2, qy2 = Math.min(start[1], D[1]) - H * 0.12;
        var hx = (1 - u2) * (1 - u2) * start[0] + 2 * (1 - u2) * u2 * qx2 + u2 * u2 * D[0];
        var hy = (1 - u2) * (1 - u2) * start[1] + 2 * (1 - u2) * u2 * qy2 + u2 * u2 * D[1];
        var Dp = P(D[0], D[1]), hp = P(hx, hy);
        drawClinician(Dp[0], Dp[1], U * 2.1 * z, { skin: 4, hair: 0, label: 'their GP' }, alpha);
        drawPerson(hp[0], hp[1], lerp(U, U * 2.2, u2) * z, groupColors[0] || neutral, 0, 1);
        if (u2 > 0.96) {
          ctx.strokeStyle = accent; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(Dp[0], Dp[1], U * 3.2 * z, 0, 6.2832); ctx.stroke();
        }
      }
      if (scene.extra === 'outbound' && M.doc) {
        var D2 = M.doc, Dq = P(D2[0], D2[1]);
        drawClinician(Dq[0], Dq[1], U * 2.1 * z, { skin: 4, hair: 0, label: 'their GP' }, alpha);
        for (var ri = 0; ri < 3; ri++) {
          var pt = (tt * 1.2 + ri / 3) % 1;
          var rad = (U * 3 + pt * Math.min(W, H) * 0.28) * z;
          ctx.strokeStyle = 'rgba(235,104,52,' + (0.5 * (1 - pt)).toFixed(3) + ')';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(Dq[0], Dq[1], rad, 0, 6.2832); ctx.stroke();
        }
      }
      ctx.restore();
    }

    /* ---------- render ---------- */
    var lastP = -1;
    function render(p) {
      p = clamp(p, 0, SC - 1);
      lastP = p;
      var si = Math.min(Math.floor(p), SC - 2);
      var t = p - si;
      var DWELL = 0.67; // dwell:travel ≥ 2:1
      var m = t < DWELL ? 0 : ease((t - DWELL) / (1 - DWELL));
      if (RM) m = t < DWELL ? 0 : 1;
      var A = scenes[si], B = scenes[si + 1];
      var layA = layouts[A.key], layB = layouts[B.key];
      var camA = camOf(A), camB = camOf(B);
      var cam = [lerp(camA[0], camB[0], m), lerp(camA[1], camB[1], m), lerp(camA[2], camB[2], m)];
      var tt = t;

      ctx.clearRect(0, 0, W, H);
      drawZones(A, 1 - m, cam); drawZones(B, m, cam);

      var s = U * cam[0];
      for (var d = 0; d < N; d++) {
        var pa = layA[d], pb = layB[d];
        var x = lerp(pa[0], pb[0], m), y = lerp(pa[1], pb[1], m);
        var q = project([x, y], cam);
        if (q[0] < -30 || q[0] > W + 30 || q[1] < -30 || q[1] > H + 30) continue;
        var ca = clothingOf(d, A, tt), cb = clothingOf(d, B, 0);
        var col = m === 0 ? ca : mixRgb(ca, cb, m);
        var al = lerp(alphaOf(d, A), alphaOf(d, B), m);
        drawPerson(q[0], q[1], s, col, d, al);
      }
      ctx.globalAlpha = 1;
      drawClinicians(A, 1 - m, cam); drawClinicians(B, m, cam);
      drawLabels(A, 1 - m, cam); drawLabels(B, m, cam);
      drawExtras(A, tt, 1 - m, cam); drawExtras(B, 0, m, cam);

      if (staticMode) return; // overlays are pinned by the static composition

      // one caption at a time — windows never overlap; the final caption
      // yields to the stats overlay as it fades in
      var so = statsEl ? clamp((p - (SC - 1.30)) / 0.30, 0, 1) : 0;
      for (var st = 0; st < steps.length; st++) {
        var dist = Math.abs(p - st);
        var op = clamp(1 - Math.max(0, dist - 0.25) / 0.17, 0, 1);
        if (st === SC - 1) op *= 1 - so;
        steps[st].style.opacity = op.toFixed(3);
      }
      if (hintEl) hintEl.style.opacity = clamp(1 - p / 0.5, 0, 1).toFixed(3);
      if (statsEl) {
        statsEl.style.opacity = so.toFixed(3);
        if (so > 0.5) fireCountups();
      }
    }

    /* ---------- count-ups ---------- */
    var statsEl = theatre.querySelector('.df-stats');
    var countFired = false;
    function fireCountups() {
      if (countFired || !statsEl) return;
      countFired = true;
      statsEl.querySelectorAll('[data-countup]').forEach(function (el) {
        var target = parseFloat(el.getAttribute('data-countup'));
        var dec = (el.getAttribute('data-dec') || '0') | 0;
        var pre = el.getAttribute('data-pre') || '', suf = el.getAttribute('data-suf') || '';
        if (RM) { el.textContent = pre + target.toFixed(dec) + suf; return; }
        var t0 = null;
        function tick(ts) {
          if (!t0) t0 = ts;
          var u = clamp((ts - t0) / 900, 0, 1);
          el.textContent = pre + (target * ease(u)).toFixed(dec) + suf;
          if (u < 1) requestAnimationFrame(tick);
        }
        requestAnimationFrame(tick);
      });
    }

    /* ---------- wiring ---------- */
    var steps = [].slice.call(theatre.querySelectorAll('.df-step'));
    var stage = theatre.querySelector('.df-stage');
    var hintEl = theatre.querySelector('.df-hint');
    var override = null;
    var staticMode = false;

    function sizes() {
      var r = stage.getBoundingClientRect();
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = r.width; H = r.height;
      canvas.width = Math.round(W * DPR); canvas.height = Math.round(H * DPR);
      canvas.style.width = W + 'px'; canvas.style.height = H + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      buildLayouts();
    }

    function progress() {
      if (override !== null) return override;
      var vh = stage.clientHeight || window.innerHeight;
      var top = theatre.getBoundingClientRect().top;
      var span = theatre.offsetHeight - vh;
      return span > 0 ? clamp(-top / span, 0, 1) * (SC - 1) : 0;
    }

    var raf = null;
    function schedule() {
      if (override !== null) return;
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = null; render(progress()); });
    }

    if (RM) {
      // one static composed frame: the scene visual + the final stats; captions
      // stay hidden (the sections below carry the full narrative)
      staticMode = true;
      theatre.classList.add('df-static');
      sizes();
      var rmScene = opts.rmScene != null ? opts.rmScene : SC - 2;
      render(rmScene);
      steps.forEach(function (el) { el.style.opacity = 0; });
      if (hintEl) hintEl.style.opacity = 0;
      if (statsEl) { statsEl.style.opacity = 1; fireCountups(); }
      window.addEventListener('resize', function () { sizes(); render(rmScene); });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { render(rmScene); });
    } else {
      theatre.style.height = (SC * 100) + 'vh';
      sizes(); render(0);
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', function () { sizes(); if (override === null) schedule(); else render(override); });
      // repaint canvas typography once the webfonts arrive
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
        if (override !== null) render(override); else render(progress());
      });
    }

    var api = {
      set: function (p) { override = p; render(p); },
      release: function () { override = null; schedule(); },
      progress: function () { return lastP; },
      scenes: SC,
      canvas: canvas
    };
    (window.__dotfields = window.__dotfields || []).push(api);
    return api;
  };
})();
