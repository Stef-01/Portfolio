/* ============================================================
   CARE PERSONAS — DotField v3.1 ("people, not dots")
   A scroll-triggered, procedural unit-PERSON theatre in the persona-
   explainer tradition. Every unit is a small human figure — head,
   hair, shoulders, and (when the camera zooms close enough) a face.
   Figures take persona colours under a scan, amalgamate between
   pools/clusters/bars, and the camera zooms in and out of the story.

   Interaction model (see docs/rca-animation-postmortem.md): scroll
   SELECTS a scene; crossing a step threshold fires a timed tween that
   always completes, so the only resting states are the composed scenes.
   Clutter budget: one caption at a time · ≤5 persona hues + neutral ·
   no chrome on stage · zero motion after settle · reduced motion gets
   one static composed frame.
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
  // Colour strings are rebuilt for every figure on every frame otherwise —
  // memoised here so a scroll frame allocates almost no strings.
  var CSS_CACHE = Object.create(null);
  function css(rgb) {
    var k = (rgb[0] << 16) | (rgb[1] << 8) | rgb[2];
    var v = CSS_CACHE[k];
    if (v === undefined) { v = CSS_CACHE[k] = 'rgb(' + rgb[0] + ',' + rgb[1] + ',' + rgb[2] + ')'; }
    return v;
  }

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
    var skin = [], hair = [], jit = [], stag = [], curve = [];
    for (var i0 = 0; i0 < N; i0++) {
      skin.push(SKINS[Math.floor(rand() * SKINS.length)]);
      hair.push(HAIRS[Math.floor(rand() * HAIRS.length)]);
      jit.push([rand() * 2 - 1, rand() * 2 - 1]);
      stag.push(rand());          // when this person starts moving
      curve.push(rand() * 2 - 1); // which way their path bows
    }

    /* ---------- geometry ---------- */
    var W = 0, H = 0, DPR = 1, U = 9; // U = base unit (figure) size in px
    // THE STAGE BOX. The caption owns a column of the stage; the graphic owns
    // the rest. Layouts compose in a plain box.w x box.h rect starting at 0,0
    // and are translated into the box, so no layout ever has to dodge text and
    // no composition is anchored to a viewport edge. (Post-mortem #2: content
    // was pinned to absolute viewport fractions, leaving the top half of wide
    // stages empty and running rings off the bottom edge.)
    var box = { x0: 0, y0: 0, x1: 0, y1: 0, w: 0, h: 0, cx: 0, cy: 0 };
    var layouts = {}, meta = {};
    // ctx.font assignment parses a CSS font string — cache it, it's a hot path
    var curFont = '';
    function setFont(f) { if (f !== curFont) { curFont = f; ctx.font = f; } }
    var F_BIG = '', F_SMALL = '', F_ANNO = '600 12px Inter, system-ui, sans-serif', F_TINY = '700 11px Inter, system-ui, sans-serif';
    var F_CARD = '600 13px Inter, system-ui, sans-serif';
    var F_CARDT = '700 14.5px Poppins, Inter, system-ui, sans-serif';
    var F_CARDS = '600 11px Inter, system-ui, sans-serif';

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
      var m = Math.min(box.w, box.h);
      var pts = phyllo(box.w * 0.5, box.h * 0.5, N, U * (1.55 * spreadK), seed || 0);
      for (var i = 0; i < N; i++) {
        pts[i] = [pts[i][0] + jit[i][0] * m * 0.03 * spreadK, pts[i][1] + jit[i][1] * m * 0.03 * spreadK];
      }
      return { pos: pts, meta: { labels: [] } };
    }
    function builtinClusters() {
      var narrow = W < 680, W_ = box.w, H_ = box.h;
      // desktop: a 3-over-2 grid fills both axes of the box; narrow: a column
      var slots = narrow
        ? [[0.28, 0.10], [0.28, 0.30], [0.28, 0.50], [0.28, 0.70], [0.28, 0.90]]
        : [[0.17, 0.26], [0.50, 0.26], [0.83, 0.26], [0.33, 0.74], [0.67, 0.74]];
      var pos = new Array(N), L = [];
      for (var g = 0; g < G; g++) {
        var cx = slots[g % slots.length][0] * W_, cy = slots[g % slots.length][1] * H_;
        var pts = phyllo(cx, cy, counts[g], U * 1.55, g * 13);
        var gi = 0;
        for (var d = 0; d < N; d++) if (groups[d] === g) pos[d] = pts[gi++];
        L.push({ x: cx, y: cy + pts.radius + (narrow ? 16 : 22), group: g, dy: pts.radius + (narrow ? 16 : 22),
                 text: (opts.labels[g] || '') + ' · ' + Math.round(counts[g] * 100 / N) + '%' });
      }
      return { pos: pos, meta: { labels: L } };
    }
    function builtinBar() {
      var rows = 8, rowH = U * 1.9, colW = U * 1.35;
      var bw = box.w * 0.9, bx = box.w * 0.05, by = box.h * 0.5 - rows * rowH / 2;
      var gap = Math.max(2, box.w * 0.006);
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
      var doc = W < 680 ? [0.5 * box.w, 0.78 * box.h] : [0.82 * box.w, 0.20 * box.h];
      return { pos: pos, meta: { labels: L, doc: doc } };
    }

    var builderCtx = null;
    function buildLayouts() {
      var narrow = W < 680;
      // caption column — must track the .df-step width rule in the stylesheet
      var capW = narrow ? 0 : clamp(W * 0.28, 300, 460);
      var bx0 = narrow ? W * 0.05 : W * 0.055 + capW + W * 0.025;
      var bx1 = W - (narrow ? W * 0.05 : W * 0.05);
      var maxW = 1150;                       // ultrawide gains margin, not sprawl
      if (bx1 - bx0 > maxW) {
        var mid = (bx0 + bx1) / 2;
        bx0 = mid - maxW / 2; bx1 = mid + maxW / 2;
      }
      var by0 = H * (narrow ? 0.32 : 0.085);  // narrow: caption sits on top
      var by1 = H * (narrow ? 0.965 : 0.94);
      box = { x0: bx0, y0: by0, x1: bx1, y1: by1,
              w: bx1 - bx0, h: by1 - by0, cx: (bx0 + bx1) / 2, cy: (by0 + by1) / 2 };
      // legibility target: figure height ~3% of the box's limiting dimension
      U = clamp(Math.min(box.w, box.h) * 0.0175, 6.5, 16);
      builderCtx = {
        W: box.w, H: box.h, N: N, U: U, narrow: narrow,
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
        shiftXY(out, box.x0, box.y0);
        layouts[name] = out.pos;
        meta[name] = out.meta || {};
      }
      focusCache = {};
    }
    // layouts are authored in box-local coordinates; this moves them onto the stage
    function shiftXY(out, dx, dy) {
      var i;
      for (i = 0; i < out.pos.length; i++) if (out.pos[i]) { out.pos[i][0] += dx; out.pos[i][1] += dy; }
      var M = out.meta || {};
      (M.labels || []).forEach(function (l) { l.x += dx; l.y += dy; });
      (M.clinicians || []).forEach(function (c2) { c2.x += dx; c2.y += dy; });
      (M.zones || []).forEach(function (z) {
        if (z.rw) { z.rx += dx; z.ry += dy; } else { z.x += dx; z.y += dy; }
      });
      (M.docs || []).forEach(function (d2) { d2[0] += dx; d2[1] += dy; });
      if (M.doc) { M.doc[0] += dx; M.doc[1] += dy; }
      if (M.link) { M.link.a[0] += dx; M.link.a[1] += dy; M.link.b[0] += dx; M.link.b[1] += dy; }
    }

    /* ---------- colour & alpha ---------- */
    function clothingOf(d, scene, tt) {
      if (!scene) return neutral;
      var g = groups[d];
      var col = groupColors[g];
      if (!col) return neutral;
      var on = scene.colorGroups && (scene.colorGroups === 'all' || scene.colorGroups.indexOf(g) >= 0);
      if (!on) return neutral;
      if (scene.greyDot && scene.greyDot(d, g)) return neutral;
      if (scene.scan && (scene.scan.groups === 'all' || scene.scan.groups.indexOf(g) >= 0)) {
        var P = layouts[scene.key][d];
        var f;
        if (scene.scan.axis === 'y') {
          var sy = box.y0 + (tt * 1.3 - 0.15) * box.h;
          f = smooth((sy - P[1]) / 60 + 0.5);
        } else {
          var sx = box.x0 + (tt * 1.3 - 0.15) * box.w;
          f = smooth((sx - P[0]) / 60 + 0.5);
        }
        // exact endpoints return the shared palette ref, keeping swept-past
        // figures sprite-cacheable instead of allocating an identical blend
        if (f >= 1) return col;
        if (f <= 0) return neutral;
        return mixRgb(neutral, col, f);
      }
      return col;
    }
    function alphaOf(d, scene) {
      if (!scene) return 1;
      var a = scene.key === 'spread' ? 0.6 : 1;
      if (scene.dim) a = scene.dim.keep.indexOf(groups[d]) >= 0 ? 1 : scene.dim.to;
      if (scene.fadeDot && scene.fadeDot(d, groups[d])) a *= (scene.fadeTo != null ? scene.fadeTo : 0.30);
      return a;
    }

    /* ---------- camera ---------- */
    function camOf(scene) {
      var c = (scene && scene.cam) || { z: 1, x: 0.5, y: 0.5 };
      if (scene && scene.camNarrow && W < 680) c = scene.camNarrow;
      // { on: 'focus' } tracks one named person wherever the layout puts them,
      // so a close-up never needs coordinates hand-tuned per viewport
      if (c.on === 'focus' && scene.focus != null) {
        var P = (layouts[scene.key] || [])[dotIndexOf(scene.focus)];
        if (P) return [c.z, P[0] + (c.dx || 0) * U, P[1] + (c.dy || 0) * U];
      }
      return [c.z, box.x0 + c.x * box.w, box.y0 + c.y * box.h];
    }
    function project(p, cam) {
      return [(p[0] - cam[1]) * cam[0] + box.cx, (p[1] - cam[2]) * cam[0] + box.cy];
    }
    // resolve { g, i } (the i-th member of group g) or a raw index to a dot
    var focusCache = {};
    function dotIndexOf(ref) {
      if (ref == null) return 0;
      if (typeof ref === 'number') return ref;
      var k = ref.g + ':' + (ref.i || 0);
      if (focusCache[k] != null) return focusCache[k];
      var seen = 0, out = 0;
      for (var d = 0; d < N; d++) if (groups[d] === ref.g) {
        if (seen === (ref.i || 0)) { out = d; break; }
        seen++;
      }
      return (focusCache[k] = out);
    }

    /* ---------- the person glyph ---------- */
    // body (bust + head + hair) onto any 2d context — shared by the live path
    // and the sprite baker so both produce the same figure
    function paintBody(c2, x, y, s, clothCss, skinCss, hairCss) {
      c2.fillStyle = clothCss;
      c2.beginPath();
      c2.arc(x, y + 0.62 * s, 0.5 * s, Math.PI, 0);
      c2.lineTo(x + 0.5 * s, y + 1.06 * s);
      c2.lineTo(x - 0.5 * s, y + 1.06 * s);
      c2.closePath();
      c2.fill();
      c2.fillStyle = skinCss;
      c2.beginPath(); c2.arc(x, y - 0.14 * s, 0.36 * s, 0, 6.2832); c2.fill();
      c2.fillStyle = hairCss;
      c2.beginPath();
      c2.arc(x, y - 0.14 * s, 0.37 * s, Math.PI, 0);
      c2.arc(x, y - 0.06 * s, 0.29 * s, 0, Math.PI, true);
      c2.closePath(); c2.fill();
    }

    // NOTE (measured 2026-08-10): an offscreen sprite cache for colour-stable
    // figures was built and benchmarked here, and REJECTED. In Chromium's
    // software rasterizer a scaled drawImage of this glyph costs ~3x its three
    // path fills (1.75ms vs 0.60ms per 200 figures), and a native-size blit
    // only reaches parity while adding ~13ms bake spikes per size bucket.
    // The glyph is simply too cheap to out-blit. Keep it on the live path.
    function drawPerson(x, y, s, clothing, d, alpha) {
      // s = figure unit size on screen; total height ≈ 1.7s
      ctx.globalAlpha = alpha;
      paintBody(ctx, x, y, s, css(clothing), css(skin[d]), css(hair[d]));
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
      // declared-focus ring — the colour a patient matches to
      if (spec.ring) {
        ctx.strokeStyle = spec.ring; ctx.lineWidth = Math.max(2, 0.14 * s);
        ctx.beginPath(); ctx.arc(x, y + 0.3 * s, 1.05 * s, 0, 6.2832); ctx.stroke();
      }
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
        setFont('700 ' + clamp(Math.round(0.5 * s), 10, 15) + 'px Poppins, Inter, system-ui, sans-serif');
        // a declared-focus ring extends to 1.35s below centre — drop the name
        // under it instead of through it
        ctx.fillText(spec.label, x, y + (spec.ring ? 1.68 : 1.5) * s);
      }
    }
    // A clinician who exists in both scenes should WALK to their new spot, not
    // ghost-crossfade into a second copy of themselves; same for shared labels.
    function pairUp(listA, listB, key) {
      var used = {}, out = [];
      (listA || []).forEach(function (a, ai) {
        var bi = -1;
        (listB || []).forEach(function (b, j) {
          if (bi < 0 && !used[j] && key(b) && key(b) === key(a)) bi = j;
        });
        if (bi >= 0) { used[bi] = 1; out.push({ a: a, b: listB[bi], ai: ai, bi: bi }); }
        else out.push({ a: a, b: null, ai: ai, bi: -1 });
      });
      (listB || []).forEach(function (b, j) {
        if (!used[j]) out.push({ a: null, b: b, ai: -1, bi: j });
      });
      return out;
    }

    var pairCache = {};
    function drawCliniciansPair(A, B, m, cam, si) {
      var ck = 'c' + si, pairs = pairCache[ck];
      if (!pairs) {
        var CA = (meta[A.key] || {}).clinicians || [];
        var CB = (meta[B.key] || {}).clinicians || [];
        pairs = pairCache[ck] = pairUp(CA, CB, function (c) { return c.label; });
      }
      for (var i = 0; i < pairs.length; i++) {
        var a = pairs[i].a, b = pairs[i].b, spec, x, y, al;
        if (a && b) { spec = a; x = lerp(a.x, b.x, m); y = lerp(a.y, b.y, m); al = 1; }
        else if (a) { spec = a; x = a.x; y = a.y; al = 1 - m; }
        else { spec = b; x = b.x; y = b.y; al = m; }
        // clinicians tied to a persona group recede with it when the scene dims;
        // untied clinicians recede only in dim-EVERYTHING scenes (keep: []),
        // where the stats overlay takes the stage
        if (spec.dimWith != null) {
          var dA = A.dim ? (A.dim.keep.indexOf(spec.dimWith) >= 0 ? 1 : A.dim.to) : 1;
          var dB = B.dim ? (B.dim.keep.indexOf(spec.dimWith) >= 0 ? 1 : B.dim.to) : 1;
          al *= lerp(dA, dB, m);
        } else {
          var eA = A.dim && A.dim.keep.length === 0 ? A.dim.to : 1;
          var eB = B.dim && B.dim.keep.length === 0 ? B.dim.to : 1;
          al *= lerp(eA, eB, m);
        }
        if (al <= 0.02) continue;
        var p = project([x, y], cam);
        if (p[0] < -80 || p[0] > W + 80 || p[1] < -80 || p[1] > H + 80) continue;
        drawClinician(p[0], p[1], U * 2.1 * cam[0], spec, al);
      }
      ctx.globalAlpha = 1;
    }

    /* ---------- zones (soft pool backdrops) ---------- */
    function drawZones(scene, alpha, cam) {
      if (!scene || alpha <= 0.02) return;
      var Z = (meta[scene.key] || {}).zones || [];
      for (var i = 0; i < Z.length; i++) {
        ctx.globalAlpha = alpha * (Z[i].alpha || 0.06);
        ctx.fillStyle = Z[i].color || '#2a78d6';
        if (Z[i].rw) {
          // soft track behind a column of people — the queue's answer to the
          // pools' discs, so every crowd stands on the same kind of ground
          var a2 = project([Z[i].rx, Z[i].ry], cam);
          var w2 = Z[i].rw * cam[0], h2 = Z[i].rh * cam[0];
          roundRect(a2[0], a2[1], w2, h2, Math.min(w2 / 2, Z[i].rad * cam[0] || 12));
          ctx.fill();
        } else {
          var p = project([Z[i].x, Z[i].y], cam);
          ctx.beginPath(); ctx.arc(p[0], p[1], Z[i].r * cam[0], 0, 6.2832); ctx.fill();
        }
      }
      ctx.globalAlpha = 1;
    }

    /* ---------- labels ---------- */
    // live centroids of each group at the currently rendered positions —
    // filled during the dot loop, consumed by group-bound labels
    var centX = new Array(G), centY = new Array(G), centN = new Array(G);
    function labelPos(L, cam) {
      if (L.group != null && centN[L.group]) {
        return project([centX[L.group] / centN[L.group] + (L.dx || 0),
                        centY[L.group] / centN[L.group] + (L.dy || 0)], cam);
      }
      return project([L.x, L.y], cam);
    }
    function labelAlpha(scene, idx, label) {
      if (!scene.labels) return 0;
      var a = 1;
      var grouped = scene.key === 'clusters' || scene.key === 'bar';
      if (grouped && scene.dim) a *= scene.dim.keep.indexOf(idx) >= 0 ? 1 : scene.dim.to;
      if (label.dimWith != null && scene.dim) a *= scene.dim.keep.indexOf(label.dimWith) >= 0 ? 1 : scene.dim.to;
      return a;
    }

    function drawLabelsPair(A, B, m, cam, si) {
      var lk = 'l' + si, pairs = pairCache[lk];
      if (!pairs) {
        var LA = A.labels ? ((meta[A.key] || {}).labels || []) : [];
        var LB = B.labels ? ((meta[B.key] || {}).labels || []) : [];
        pairs = pairCache[lk] = pairUp(LA, LB, function (l) { return l.text; });
      }
      ctx.save();
      ctx.textAlign = 'center';
      for (var i = 0; i < pairs.length; i++) {
        var a = pairs[i].a, b = pairs[i].b, L, x, y, al;
        if (a && b) {
          L = a;
          x = lerp(a.x, b.x, m); y = lerp(a.y, b.y, m);
          al = lerp(labelAlpha(A, pairs[i].ai, a), labelAlpha(B, pairs[i].bi, b), m);
        } else if (a) {
          L = a; x = a.x; y = a.y; al = labelAlpha(A, pairs[i].ai, a) * (1 - m);
        } else {
          L = b; x = b.x; y = b.y; al = labelAlpha(B, pairs[i].bi, b) * m;
        }
        if (!L.text || al <= 0.02) continue;
        ctx.globalAlpha = al;
        ctx.fillStyle = L.muted ? ink2 : ink;
        setFont(L.big ? F_BIG : F_SMALL);
        if ('letterSpacing' in ctx) ctx.letterSpacing = L.big ? '1.4px' : '0px';
        // group-bound labels ride their group's live centroid; unbound ones
        // travel on the lerped anchor exactly as before
        var p;
        if (a && b && a.group != null && a.group === b.group && centN[a.group]) {
          p = project([centX[a.group] / centN[a.group] + lerp(a.dx || 0, b.dx || 0, m),
                       centY[a.group] / centN[a.group] + lerp(a.dy || 0, b.dy || 0, m)], cam);
        } else if (!(a && b) && L.group != null && centN[L.group]) {
          p = labelPos(L, cam);
        } else {
          p = project([x, y], cam);
        }
        ctx.fillText(L.text, p[0], p[1]);
      }
      if ('letterSpacing' in ctx) ctx.letterSpacing = '0px';
      ctx.restore();
    }

    /* ---------- narrative cards ----------
       A card pins plain-language detail to ONE person on stage: what they told
       you, what they got, whether it matched. Rows reveal in sequence during
       the entry tween and are all present at rest. */
    function roundRect(x, y, w, h, r) {
      ctx.beginPath();
      ctx.moveTo(x + r, y);
      ctx.arcTo(x + w, y, x + w, y + h, r);
      ctx.arcTo(x + w, y + h, x, y + h, r);
      ctx.arcTo(x, y + h, x, y, r);
      ctx.arcTo(x, y, x + w, y, r);
      ctx.closePath();
    }
    function wrapText(text, maxW) {
      var words = String(text).split(' '), out = [], cur = '';
      for (var i = 0; i < words.length; i++) {
        var t = cur ? cur + ' ' + words[i] : words[i];
        if (cur && ctx.measureText(t).width > maxW) { out.push(cur); cur = words[i]; }
        else cur = t;
      }
      if (cur) out.push(cur);
      return out;
    }
    var MARKC = { tick: '#0b7d3e', cross: '#c8503f', dot: '#8a93a8', want: '#2a78d6' };
    function drawMark(kind, x, y, r, col) {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      if (kind === 'tick') {
        ctx.strokeStyle = col; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - r, y); ctx.lineTo(x - r * 0.2, y + r * 0.75);
        ctx.lineTo(x + r, y - r * 0.8); ctx.stroke();
      } else if (kind === 'cross') {
        ctx.strokeStyle = col; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(x - r * 0.8, y - r * 0.8); ctx.lineTo(x + r * 0.8, y + r * 0.8);
        ctx.moveTo(x + r * 0.8, y - r * 0.8); ctx.lineTo(x - r * 0.8, y + r * 0.8); ctx.stroke();
      } else {
        ctx.fillStyle = col;
        ctx.beginPath(); ctx.arc(x, y, r * 0.42, 0, 6.2832); ctx.fill();
      }
    }
    function drawCard(spec, tt, alpha, cam) {
      var lay = layouts[spec._key] || [];
      var anchor = spec.at != null ? lay[dotIndexOf(spec.at)] : null;
      if (spec.atXY) anchor = [box.x0 + spec.atXY[0] * box.w, box.y0 + spec.atXY[1] * box.h];
      if (!anchor) return;
      var pos = project(anchor, cam);
      var small = !!spec.small;
      var CW2 = small ? clamp(box.w * 0.20, 140, 210) : clamp(box.w * 0.30, 210, 315);
      var PADX = small ? 10 : 14, PADY = small ? 9 : 13;
      var LH = small ? 15 : 19, GAPR = small ? 3 : 6, MARKW = small ? 13 : 17;
      setFont(small ? F_CARDS : F_CARD);
      var rows = (spec.rows || []).map(function (r) {
        var o = typeof r === 'string' ? { t: r } : r;
        return { t: o.t, mark: o.mark || spec.mark || 'dot', strike: !!o.strike, hi: !!o.hi,
                 lines: wrapText(o.t, CW2 - PADX * 2 - MARKW) };
      });
      // titles and subs wrap too — an unwrapped title overflows a narrow card
      var titleLines = [], subLines = [];
      if (spec.title) { setFont(F_CARDT); titleLines = wrapText(spec.title, CW2 - PADX * 2); }
      if (spec.sub) { setFont(F_CARDS); subLines = wrapText(spec.sub, CW2 - PADX * 2); }
      var titleH = titleLines.length * 19 + subLines.length * 15;
      var bodyH = 0;
      rows.forEach(function (r) { bodyH += r.lines.length * LH + GAPR; });
      var cardH = PADY * 2 + titleH + (titleH ? 6 : 0) + bodyH;

      var s2 = U * cam[0];
      var gap = Math.max(16, 1.4 * s2);
      var x = spec.side === 'left' ? pos[0] - gap - CW2 : pos[0] + gap;
      if (x + CW2 > box.x1 - 2) x = pos[0] - gap - CW2;
      if (x < box.x0 - 6) x = pos[0] + gap;
      x = clamp(x, box.x0 - 6, Math.max(box.x0 - 6, W - CW2 - 8));
      var y = clamp(pos[1] - cardH / 2, box.y0 + 2, Math.max(box.y0 + 2, box.y1 - cardH - 2));

      var ca = alpha * clamp((tt - 0.03) / 0.16, 0, 1);
      if (ca <= 0.02) return;
      // the card settles upward into place, like the page's reveal rhythm
      y += (1 - ease(ca)) * 10;
      ctx.save();
      ctx.globalAlpha = ca;
      // leader line from the person to the card
      ctx.strokeStyle = 'rgba(138,147,168,.7)'; ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(pos[0] + (x > pos[0] ? 0.55 * s2 : -0.55 * s2), pos[1]);
      ctx.lineTo(x > pos[0] ? x : x + CW2, clamp(pos[1], y + 14, y + cardH - 14));
      ctx.stroke();
      // same card language as the page: line-colour border, soft elevation.
      // The blur costs ~sub-ms per frame at real speed (A/B-measured at 12x
      // throttle: medians flat, tails within run noise) — kept constant
      // through the tween for visual continuity rather than gated.
      ctx.shadowColor = 'rgba(15,24,52,0.14)';
      ctx.shadowBlur = 22; ctx.shadowOffsetY = 7;
      ctx.fillStyle = '#ffffff';
      roundRect(x, y, CW2, cardH, small ? 11 : 16); ctx.fill();
      ctx.shadowColor = 'transparent'; ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
      ctx.strokeStyle = '#e3e7f0'; ctx.lineWidth = 1;
      roundRect(x, y, CW2, cardH, small ? 11 : 16); ctx.stroke();

      ctx.textAlign = 'left';
      var ty = y + PADY, ti;
      if (titleLines.length) {
        setFont(F_CARDT); ctx.fillStyle = ink;
        for (ti = 0; ti < titleLines.length; ti++) { ctx.fillText(titleLines[ti], x + PADX, ty + 13); ty += 19; }
      }
      if (subLines.length) {
        setFont(F_CARDS); ctx.fillStyle = ink2;
        for (ti = 0; ti < subLines.length; ti++) { ctx.fillText(subLines[ti], x + PADX, ty + 11); ty += 15; }
      }
      if (titleH) ty += 6;
      setFont(small ? F_CARDS : F_CARD);
      for (var i = 0; i < rows.length; i++) {
        // rows land one after another while the scene arrives
        var ra = clamp((tt - 0.18 - i * 0.13) / 0.2, 0, 1);
        if (spec.instant) ra = 1;
        if (ra <= 0.01) { ty += rows[i].lines.length * LH + GAPR; continue; }
        ctx.globalAlpha = ca * ra;
        var r0 = rows[i], mid = ty + LH * 0.5;
        if (r0.hi) {
          ctx.fillStyle = 'rgba(42,120,214,.10)';
          roundRect(x + PADX - 6, ty - 3, CW2 - PADX * 2 + 12, r0.lines.length * LH + 4, 6); ctx.fill();
        }
        drawMark(r0.mark, x + PADX + 5, mid, small ? 4 : 5.5, MARKC[r0.mark] || MARKC.dot);
        ctx.fillStyle = r0.strike ? '#8a93a8' : (r0.mark === 'tick' ? ink : ink2);
        for (var k = 0; k < r0.lines.length; k++) {
          var lyy = ty + LH * (k + 1) - (small ? 4 : 5);
          ctx.fillText(r0.lines[k], x + PADX + MARKW, lyy);
          if (r0.strike) {
            var wpx = ctx.measureText(r0.lines[k]).width;
            ctx.strokeStyle = 'rgba(138,147,168,.9)'; ctx.lineWidth = 1;
            ctx.beginPath(); ctx.moveTo(x + PADX + MARKW, lyy - 4);
            ctx.lineTo(x + PADX + MARKW + wpx, lyy - 4); ctx.stroke();
          }
        }
        ctx.globalAlpha = ca;
        ty += r0.lines.length * LH + GAPR;
      }
      ctx.restore();
    }

    /* ---------- extras ---------- */
    function drawExtras(scene, tt, alpha, cam) {
      if (!scene || alpha <= 0.02) return;
      var cardList = (W < 680 && scene.cardsNarrow) ? scene.cardsNarrow : scene.cards;
      if (cardList) {
        for (var ci = 0; ci < cardList.length; ci++) {
          cardList[ci]._key = scene.key;
          drawCard(cardList[ci], tt, alpha, cam);
        }
      }
      if (!scene.extra) return;
      var M = meta[scene.key] || {};
      ctx.save(); ctx.globalAlpha = alpha;
      var z = cam[0];
      function P(x, y) { return project([x, y], cam); }

      if (scene.extra === 'link' && M.link) {
        var A = M.link.a, B = M.link.b;
        var qx = (A[0] + B[0]) / 2, qy = Math.min(A[1], B[1]) - box.h * 0.11;
        if (qy < box.y0 + 30) qy = box.y0 + 30;
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
        if (scene.linkLabel && W >= 680) {
          // narrow screens have no free band between caption and pool titles
          // for this annotation — the caption itself carries the eConsult beat
          ctx.fillStyle = ink2; setFont(F_ANNO); ctx.textAlign = 'center';
          ctx.fillText(scene.linkLabel, q2[0], q2[1] - 10);
        }
      }
      if (scene.extra === 'badlink' && M.link) {
        var la = P(M.link.a[0], M.link.a[1]), lb = P(M.link.b[0], M.link.b[1]);
        var app = clamp(tt / 0.5, 0, 1);
        var ex = lerp(la[0], lb[0], app), ey = lerp(la[1], lb[1], app);
        ctx.save();
        ctx.setLineDash([6, 6]);
        ctx.strokeStyle = 'rgba(138,147,168,.9)'; ctx.lineWidth = 1.6;
        ctx.beginPath(); ctx.moveTo(la[0], la[1]); ctx.lineTo(ex, ey); ctx.stroke();
        ctx.restore();
        if (app >= 1) {
          var mx = (la[0] + lb[0]) / 2, my = (la[1] + lb[1]) / 2;
          var ca2 = clamp((tt - 0.5) / 0.3, 0, 1);
          ctx.globalAlpha = alpha * ca2;
          ctx.fillStyle = '#ffffff';
          ctx.beginPath(); ctx.arc(mx, my, 13, 0, 6.2832); ctx.fill();
          ctx.strokeStyle = 'rgba(200,80,63,.9)'; ctx.lineWidth = 1.4; ctx.stroke();
          drawMark('cross', mx, my, 6, '#c8503f');
          ctx.globalAlpha = alpha;
        }
        if (scene.linkLabel) {
          ctx.fillStyle = ink2; setFont(F_ANNO); ctx.textAlign = 'center';
          ctx.fillText(scene.linkLabel, (la[0] + lb[0]) / 2, Math.min(la[1], lb[1]) - 26);
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
      if (scene.extra === 'outbound' && (M.docs || M.doc)) {
        // pulse rings from every doctor; when the layout already draws its
        // clinicians (meta.clinicians), don't draw a duplicate figure here
        var srcs = M.docs || [M.doc];
        if (!M.clinicians && !M.docs) {
          var Dq0 = P(M.doc[0], M.doc[1]);
          drawClinician(Dq0[0], Dq0[1], U * 2.1 * z, { skin: 4, hair: 0, label: 'their GP' }, alpha);
        }
        for (var si2 = 0; si2 < srcs.length; si2++) {
          var Dq = P(srcs[si2][0], srcs[si2][1]);
          for (var ri = 0; ri < 3; ri++) {
            var pt = (tt * 1.2 + ri / 3 + si2 * 0.13) % 1;
            var rad = (U * 3 + pt * Math.min(W, H) * (M.docs ? 0.14 : 0.28)) * z;
            ctx.strokeStyle = 'rgba(235,104,52,' + (0.5 * (1 - pt)).toFixed(3) + ')';
            ctx.lineWidth = 2;
            ctx.beginPath(); ctx.arc(Dq[0], Dq[1], rad, 0, 6.2832); ctx.stroke();
          }
        }
      }
      ctx.restore();
    }

    /* ---------- render ---------- */
    var lastP = -1;
    function render(p, force) {
      p = clamp(p, 0, SC - 1);
      // a sub-pixel scroll delta cannot change the frame — skip the repaint
      if (!force && lastP >= 0 && Math.abs(p - lastP) < 0.0004) return;
      lastP = p;
      var si = Math.min(Math.floor(p), SC - 2);
      var t = p - si;
      // trigger-tween model: p only rests at integers, so the whole unit span is travel
      var u = clamp(t, 0, 1);
      var m = RM ? (t < 0.5 ? 0 : 1) : ease(u);   // scene-level progress (camera, labels, zones)
      var A = scenes[si], B = scenes[si + 1];
      var layA = layouts[A.key], layB = layouts[B.key];
      var camA = camOf(A), camB = camOf(B);
      var cam = [lerp(camA[0], camB[0], m), lerp(camA[1], camB[1], m), lerp(camA[2], camB[2], m)];
      var tt = t;

      ctx.clearRect(0, 0, W, H);
      drawZones(A, 1 - m, cam); drawZones(B, m, cam);

      // People move individually, not as one block: each starts at their own
      // moment within the travel window and walks a slightly bowed path. Every
      // figure is still exactly at rest at u=0 and u=1, so scenes stay static.
      var s = U * cam[0];
      var LAG = RM ? 0 : 0.25;              // fraction of travel spent staggering entries
      var SPAN = 1 - LAG;
      var bowMax = U * 3.5;
      for (var g0 = 0; g0 < G; g0++) { centX[g0] = 0; centY[g0] = 0; centN[g0] = 0; }
      for (var d = 0; d < N; d++) {
        var pa = layA[d], pb = layB[d];
        var lm;
        if (u <= 0) lm = 0;
        else if (u >= 1) lm = 1;
        else lm = ease(clamp((u - stag[d] * LAG) / SPAN, 0, 1));

        var x, y;
        if (lm <= 0) { x = pa[0]; y = pa[1]; }
        else if (lm >= 1) { x = pb[0]; y = pb[1]; }
        else {
          var dx = pb[0] - pa[0], dy = pb[1] - pa[1];
          var len = Math.sqrt(dx * dx + dy * dy);
          if (len > U * 2) {
            // quadratic bezier bowed perpendicular to the direction of travel
            var bow = curve[d] * Math.min(len * 0.16, bowMax);
            var cx = (pa[0] + pb[0]) / 2 - (dy / len) * bow;
            var cy = (pa[1] + pb[1]) / 2 + (dx / len) * bow;
            var iv = 1 - lm;
            x = iv * iv * pa[0] + 2 * iv * lm * cx + lm * lm * pb[0];
            y = iv * iv * pa[1] + 2 * iv * lm * cy + lm * lm * pb[1];
          } else {
            x = lerp(pa[0], pb[0], lm); y = lerp(pa[1], pb[1], lm);
          }
        }

        var gD = groups[d];
        centX[gD] += x; centY[gD] += y; centN[gD]++;
        var q = project([x, y], cam);
        if (q[0] < -30 || q[0] > W + 30 || q[1] < -30 || q[1] > H + 30) continue;
        var ca = clothingOf(d, A, 1), cb = clothingOf(d, B, u);
        var col = (ca === cb || lm === 0) ? ca : lm === 1 ? cb : mixRgb(ca, cb, lm);
        var al = lerp(alphaOf(d, A), alphaOf(d, B), lm);
        drawPerson(q[0], q[1], s, col, d, al);
      }
      ctx.globalAlpha = 1;
      drawCliniciansPair(A, B, m, cam, si);
      drawLabelsPair(A, B, m, cam, si);
      drawExtras(A, 1, 1 - m, cam); drawExtras(B, u, m, cam);

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
      curFont = ''; // canvas state reset by resize
      F_BIG = '700 ' + (W < 680 ? 13 : 15) + 'px Poppins, Inter, system-ui, sans-serif';
      F_SMALL = '600 ' + (W < 680 ? 11 : 13) + 'px Poppins, Inter, system-ui, sans-serif';
      pairCache = {};
      buildLayouts();
    }

    function progress() {
      if (override !== null) return override;
      var vh = stage.clientHeight || window.innerHeight;
      var top = theatre.getBoundingClientRect().top;
      var span = theatre.offsetHeight - vh;
      return span > 0 ? clamp(-top / span, 0, 1) * (SC - 1) : 0;
    }

    // Trigger-tween model (the fix for scrub-smear): scroll SELECTS a scene —
    // crossing a step threshold fires a timed tween that ALWAYS completes, so
    // the only resting states are the composed scenes themselves. Scrolling
    // back triggers the reverse. After settle there is zero motion.
    var raf = null, vp = null, tween = null;
    function sceneFromScroll() { return clamp(Math.round(progress()), 0, SC - 1); }
    function startTween(to) {
      var from = vp === null ? to : vp;
      if (from === to) { tween = null; render(to, true); return; }
      // a long jump plays as ONE clean transition from the neighbouring scene,
      // not a fast-forward through every intermediate morph
      if (Math.abs(to - from) > 2) from = to - (to > from ? 1 : -1);
      tween = { from: from, to: to, t0: performance.now(), dur: Math.min(1400, 850 + 350 * Math.max(0, Math.abs(to - from) - 1)) };
      if (!raf) raf = requestAnimationFrame(tickTween);
    }
    function tickTween(ts) {
      raf = null;
      if (!tween) return;
      var k = clamp((ts - tween.t0) / tween.dur, 0, 1);
      vp = lerp(tween.from, tween.to, k); // per-dot & camera easing live inside render()
      render(vp, true);
      if (k >= 1) { tween = null; vp = Math.round(vp); return; }
      raf = requestAnimationFrame(tickTween);
    }
    function schedule() {
      if (override !== null) return;
      var t = sceneFromScroll();
      if (vp === null) { vp = t; render(t, true); return; }
      if (tween) { if (tween.to !== t) startTween(t); }
      else if (vp !== t) startTween(t);
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
      window.addEventListener('resize', function () { sizes(); render(rmScene, true); });
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { render(rmScene, true); });
    } else {
      theatre.style.height = (SC * 100) + 'vh';
      sizes();
      vp = sceneFromScroll();
      render(vp, true);
      window.addEventListener('scroll', schedule, { passive: true });
      // geometry changed, so the frame must be rebuilt even at the same scroll position
      window.addEventListener('resize', function () {
        sizes();
        if (override !== null) render(override, true);
        else { tween = null; vp = sceneFromScroll(); render(vp, true); }
      });
      // repaint canvas typography once the webfonts arrive
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () {
        render(override !== null ? override : (vp === null ? 0 : vp), true);
      });
    }

    var api = {
      set: function (p) { override = p; tween = null; render(p, true); },
      release: function () { override = null; vp = null; schedule(); },
      progress: function () { return lastP; },
      scenes: SC,
      canvas: canvas
    };
    (window.__dotfields = window.__dotfields || []).push(api);
    return api;
  };
})();
