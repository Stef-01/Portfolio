/* ============================================================
   CARE PERSONAS — DotField
   A scroll-driven, procedural unit-dot theatre in the persona-
   explainer tradition: every dot is a person (or a bundle of
   appointments); dots take their persona colours under a scan,
   amalgamate into clusters, then into the segmented bar, and the
   camera zooms in and out of the story.

   Design contract (the clutter budget, enforced here):
   - fully user-paced: nothing moves unless the reader scrolls
   - one idea per scene; one focus text block on screen at a time
   - neutral ink until the scan scene; max 5 persona hues + ink after
   - no gridlines, borders, or chrome inside the stage — dots,
     ≤6 labels, one text block
   - dwell 60% / travel 40% of each scene's scroll span
   - prefers-reduced-motion: a single static composed frame
   ============================================================ */
(function () {
  'use strict';

  var RM = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- tiny utilities ---------- */
  function clamp(v, lo, hi) { return v < lo ? lo : v > hi ? hi : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function ease(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
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

  /* ============================================================ */
  window.DotField = function (opts) {
    var theatre = typeof opts.theatre === 'string' ? document.querySelector(opts.theatre) : opts.theatre;
    var canvas = typeof opts.canvas === 'string' ? document.querySelector(opts.canvas) : opts.canvas;
    if (!theatre || !canvas) return null;

    var ctx = canvas.getContext('2d');
    var N = opts.count || 200;
    var shares = opts.shares;
    var palette = opts.palette.map(hexRgb);
    var neutral = hexRgb(opts.neutral || '#c3cad8');
    var ink = opts.ink || '#1b2846';
    var ink2 = opts.ink2 || '#4a5674';
    var accent = opts.accent || '#eb6834';
    var scenes = opts.scenes;
    var labels = opts.labels || [];
    var splitLeft = opts.splitLeft || [0, 1];
    var anchorsLabels = opts.anchorsLabels || [];
    var SC = scenes.length;

    /* ---------- dot roster: group per dot, stable shuffle ---------- */
    var groups = [];
    (function () {
      var counts = [], sum = 0, i, k;
      for (k = 0; k < shares.length; k++) { counts[k] = Math.round(shares[k] * N / 100); sum += counts[k]; }
      counts[shares.length - 1] += N - sum;
      for (k = 0; k < counts.length; k++) for (i = 0; i < counts[k]; i++) groups.push(k);
    })();
    var groupCounts = shares.map(function (s, k) { return groups.filter(function (g) { return g === k; }).length; });
    // index of each dot within its group (for packing)
    var idxInGroup = []; (function () { var c = shares.map(function(){return 0;}); groups.forEach(function (g) { idxInGroup.push(c[g]++); }); })();

    var rand = mulberry32(20260809);
    var jit = []; for (var i0 = 0; i0 < N; i0++) jit.push([rand() * 2 - 1, rand() * 2 - 1, rand()]);

    /* ---------- geometry ---------- */
    var W = 0, H = 0, DPR = 1, dotR = 3.5;
    var layouts = {};   // name -> [ [x,y], ... ]
    var meta = {};      // name -> {labels:[{x,y,text}], anchors:...}

    function phyllo(cx, cy, R, count, startI) {
      var out = [], golden = 2.399963;
      for (var i = 0; i < count; i++) {
        var rr = R * Math.sqrt((i + 0.5) / count);
        var th = (i + (startI || 0)) * golden;
        out.push([cx + rr * Math.cos(th), cy + rr * Math.sin(th)]);
      }
      return out;
    }

    function buildLayouts() {
      var m = Math.min(W, H);
      dotR = clamp(m * 0.0085, 2.6, 4.4);

      // cloud & spread
      var cl = phyllo(W * 0.5, H * 0.46, m * 0.34, N, 0);
      var sp = phyllo(W * 0.5, H * 0.46, m * 0.42, N, 7);
      for (var i = 0; i < N; i++) {
        cl[i] = [cl[i][0] + jit[i][0] * m * 0.035, cl[i][1] + jit[i][1] * m * 0.035];
        sp[i] = [sp[i][0] + jit[i][0] * m * 0.06, sp[i][1] + jit[i][1] * m * 0.06];
      }
      layouts.cloud = cl; layouts.spread = sp;
      meta.cloud = { labels: [] }; meta.spread = { labels: [] };

      // clusters — anchor slots (responsive), radius ∝ sqrt(share)
      var narrow = W < 680;
      var slots = narrow
        ? [[0.30, 0.16], [0.72, 0.28], [0.32, 0.46], [0.72, 0.64], [0.34, 0.80]]
        : [[0.15, 0.36], [0.32, 0.66], [0.53, 0.36], [0.73, 0.66], [0.88, 0.34]];
      var kR = (narrow ? 0.30 : 0.30) * m;
      var clu = new Array(N), cluLabels = [];
      for (var g = 0; g < shares.length; g++) {
        var cx = slots[g][0] * W, cy = slots[g][1] * H;
        var R = Math.sqrt(groupCounts[g] / N) * kR + dotR * 2;
        var pts = phyllo(cx, cy, R, groupCounts[g], g * 13);
        var gi = 0;
        for (var d = 0; d < N; d++) if (groups[d] === g) clu[d] = pts[gi++];
        cluLabels.push({ x: cx, y: cy + R + (narrow ? 16 : 20), text: labels[g] + ' · ' + shares[g] + '%' });
      }
      layouts.clusters = clu; meta.clusters = { labels: cluLabels };

      // bar — dots grid-packed into 5 adjacent segments (the amalgamation)
      var rows = 8, rowH = dotR * 2.6;
      var bw = W * 0.84, bx = W * 0.08, by = H * 0.46 - rows * rowH / 2;
      var gap = Math.max(2, W * 0.006);
      var bar = new Array(N), barLabels = [], x0 = bx;
      for (g = 0; g < shares.length; g++) {
        var gw = bw * shares[g] / 100 - gap;
        var cols = Math.ceil(groupCounts[g] / rows);
        var cw = gw / cols;
        gi = 0;
        for (d = 0; d < N; d++) if (groups[d] === g) {
          var c = Math.floor(gi / rows), r = gi % rows;
          bar[d] = [x0 + cw * (c + 0.5), by + rowH * (r + 0.5)];
          gi++;
        }
        barLabels.push({ x: x0 + gw / 2, y: by - (W < 680 ? 14 : 18), text: (W < 680 ? '' : labels[g] + ' · ') + shares[g] + '%' });
        x0 += gw + gap;
      }
      layouts.bar = bar; meta.bar = { labels: barLabels, top: by, bot: by + rows * rowH };

      // split — two destinations (the handover)
      var la = narrow ? [0.5 * W, 0.68 * H] : [0.27 * W, 0.58 * H];
      var ra = narrow ? [0.5 * W, 0.26 * H] : [0.73 * W, 0.40 * H];
      var leftCount = 0;
      for (d = 0; d < N; d++) if (splitLeft.indexOf(groups[d]) >= 0) leftCount++;
      var lp = phyllo(la[0], la[1], Math.sqrt(leftCount / N) * kR + dotR * 2, leftCount, 3);
      var rp = phyllo(ra[0], ra[1], Math.sqrt((N - leftCount) / N) * kR + dotR * 2, N - leftCount, 9);
      var sl = new Array(N), li = 0, ri = 0;
      for (d = 0; d < N; d++) {
        if (splitLeft.indexOf(groups[d]) >= 0) sl[d] = lp[li++]; else sl[d] = rp[ri++];
      }
      layouts.split = sl;
      var lR = Math.sqrt(leftCount / N) * kR + dotR * 2, rR = Math.sqrt((N - leftCount) / N) * kR + dotR * 2;
      meta.split = {
        labels: [
          { x: la[0], y: la[1] + lR + 22, text: anchorsLabels[0] || '' },
          { x: ra[0], y: ra[1] + rR + 22, text: anchorsLabels[1] || '' }
        ],
        la: la, ra: ra, lR: lR, rR: rR
      };

      // doctor node for the match/outbound extras
      meta.doc = narrow ? [0.5 * W, 0.22 * H] : [0.80 * W, 0.34 * H];
    }

    /* ---------- colours ---------- */
    function dotColor(d, scene, tt) {
      if (!scene) return neutral;
      if (scene.scan) {
        var sx = (tt * 1.25 - 0.1) * W;
        var f = smooth((sx - layouts[scene.key][d][0]) / 60 + 0.5);
        return mixRgb(neutral, palette[groups[d]], f);
      }
      return scene.colored ? palette[groups[d]] : neutral;
    }
    function dotAlpha(d, scene) {
      if (!scene) return 1;
      var a = scene.key === 'spread' ? 0.55 : 1;
      if (scene.dim) a = scene.dim.keep.indexOf(groups[d]) >= 0 ? 1 : scene.dim.to;
      return a;
    }

    /* ---------- camera ---------- */
    function camOf(scene) {
      var c = (scene && scene.cam) || { z: 1, x: 0.5, y: 0.46 };
      return [c.z, c.x * W, c.y * H];
    }
    function project(p, cam) {
      return [(p[0] - cam[1]) * cam[0] + W * 0.5, (p[1] - cam[2]) * cam[0] + H * 0.46];
    }

    /* ---------- extras (scene-specific choreography, scroll-paced, camera-projected) ---------- */
    function drawExtras(scene, tt, alpha, cam) {
      if (!scene || !scene.extra || alpha <= 0.02) return;
      ctx.save(); ctx.globalAlpha = alpha;
      var narrow = W < 680, z = cam[0];
      function P(x, y) { return project([x, y], cam); }
      if (scene.extra === 'split' && meta.split) {
        var A = meta.split.la, B = meta.split.ra;
        var ax = A[0], ay = A[1] - meta.split.lR - 8, bx = B[0], by = B[1] + meta.split.rR + 8;
        var qx = (ax + bx) / 2, qy = Math.min(ay, by) - 40;
        var a2 = P(ax, ay), b2 = P(bx, by), q2 = P(qx, qy);
        ctx.strokeStyle = 'rgba(138,147,168,.55)'; ctx.lineWidth = 1.5 * z;
        ctx.beginPath(); ctx.moveTo(a2[0], a2[1]); ctx.quadraticCurveTo(q2[0], q2[1], b2[0], b2[1]); ctx.stroke();
        // eConsult packet travels back and forth with scroll
        var u = tt * 2 % 2; u = u > 1 ? 2 - u : u; u = smooth(u);
        var px = (1 - u) * (1 - u) * ax + 2 * (1 - u) * u * qx + u * u * bx;
        var py = (1 - u) * (1 - u) * ay + 2 * (1 - u) * u * qy + u * u * by;
        var pp = P(px, py);
        ctx.fillStyle = accent;
        ctx.beginPath(); ctx.arc(pp[0], pp[1], 5 * z, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
        ctx.fillStyle = ink2; ctx.font = '600 12px Inter, system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('eConsult · ≤72 h', q2[0], q2[1] + (narrow ? -8 : -10));
      }
      if (scene.extra === 'match') {
        // one dot travels from its segment to the doctor node
        var D = meta.doc, start = layouts.bar[0];
        var u2 = smooth(clamp((tt - 0.15) / 0.7, 0, 1));
        var qx2 = (start[0] + D[0]) / 2, qy2 = Math.min(start[1], D[1]) - H * 0.12;
        var hx = (1 - u2) * (1 - u2) * start[0] + 2 * (1 - u2) * u2 * qx2 + u2 * u2 * D[0];
        var hy = (1 - u2) * (1 - u2) * start[1] + 2 * (1 - u2) * u2 * qy2 + u2 * u2 * D[1];
        var Dp = P(D[0], D[1]), hp = P(hx, hy);
        ctx.strokeStyle = 'rgba(138,147,168,.8)'; ctx.lineWidth = 2 * z;
        ctx.beginPath(); ctx.arc(Dp[0], Dp[1], 22 * z, 0, 6.2832); ctx.stroke();
        ctx.fillStyle = ink2; ctx.font = '700 11px Inter, system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('GP', Dp[0], Dp[1] + 4);
        var rr = lerp(dotR, dotR * 2.6, u2) * z;
        ctx.fillStyle = 'rgb(' + palette[groups[0]].join(',') + ')';
        ctx.beginPath(); ctx.arc(hp[0], hp[1], rr, 0, 6.2832); ctx.fill();
        ctx.strokeStyle = '#ffffff'; ctx.lineWidth = 2; ctx.stroke();
        if (u2 > 0.96) { // handshake ring
          ctx.strokeStyle = accent; ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(Dp[0], Dp[1], 30 * z, 0, 6.2832); ctx.stroke();
        }
      }
      if (scene.extra === 'outbound') {
        // pulse rings emanating from the doctor node, paced by scroll
        var D2 = meta.doc, Dq = P(D2[0], D2[1]);
        ctx.strokeStyle = 'rgba(138,147,168,.8)'; ctx.lineWidth = 2 * z;
        ctx.beginPath(); ctx.arc(Dq[0], Dq[1], 22 * z, 0, 6.2832); ctx.stroke();
        ctx.fillStyle = ink2; ctx.font = '700 11px Inter, system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('GP', Dq[0], Dq[1] + 4);
        for (var ri2 = 0; ri2 < 3; ri2++) {
          var pt = (tt * 1.2 + ri2 / 3) % 1;
          var rad = (26 + pt * Math.min(W, H) * 0.28) * z;
          ctx.strokeStyle = 'rgba(235,104,52,' + (0.5 * (1 - pt)).toFixed(3) + ')';
          ctx.lineWidth = 2;
          ctx.beginPath(); ctx.arc(Dq[0], Dq[1], rad, 0, 6.2832); ctx.stroke();
        }
      }
      ctx.restore();
    }

    /* ---------- labels ---------- */
    function drawLabels(scene, alpha, cam) {
      if (!scene || !scene.labels || alpha <= 0.02) return;
      var L = (meta[scene.key] || {}).labels || [];
      var grouped = scene.key === 'clusters' || scene.key === 'bar';
      ctx.save();
      ctx.font = '600 ' + (W < 680 ? 11 : 13) + 'px Inter, system-ui, sans-serif';
      ctx.textAlign = 'center'; ctx.fillStyle = ink;
      for (var i = 0; i < L.length; i++) {
        if (!L[i].text) continue;
        var la = alpha;
        if (grouped && scene.dim) la *= scene.dim.keep.indexOf(i) >= 0 ? 1 : scene.dim.to;
        ctx.globalAlpha = la;
        var p = project([L[i].x, L[i].y], cam);
        ctx.fillText(L[i].text, p[0], p[1]);
      }
      ctx.restore();
    }

    /* ---------- render one frame at continuous progress p ---------- */
    var lastP = -1;
    function render(p) {
      p = clamp(p, 0, SC - 1);
      lastP = p;
      var si = Math.min(Math.floor(p), SC - 2);
      var t = p - si;
      var DWELL = 0.67; // dwell:travel ≥ 2:1 per the scrollytelling clutter budget
      var m = t < DWELL ? 0 : ease((t - DWELL) / (1 - DWELL));   // morph amount to next scene
      if (RM) m = t < DWELL ? 0 : 1;
      var A = scenes[si], B = scenes[si + 1];
      var layA = layouts[A.key], layB = layouts[B.key];
      var camA = camOf(A), camB = camOf(B);
      var cam = [lerp(camA[0], camB[0], m), lerp(camA[1], camB[1], m), lerp(camA[2], camB[2], m)];
      var tt = t; // within-scene pacing for extras/scan (dwell included)

      ctx.clearRect(0, 0, W, H);
      for (var d = 0; d < N; d++) {
        var pa = layA[d], pb = layB[d];
        var x = lerp(pa[0], pb[0], m), y = lerp(pa[1], pb[1], m);
        var q = project([x, y], cam);
        if (q[0] < -20 || q[0] > W + 20 || q[1] < -20 || q[1] > H + 20) continue;
        var ca = dotColor(d, A, tt), cb = dotColor(d, B, 0);
        var col = m === 0 ? ca : mixRgb(ca, cb, m);
        var al = lerp(dotAlpha(d, A), dotAlpha(d, B), m);
        ctx.globalAlpha = al;
        ctx.fillStyle = 'rgb(' + col[0] + ',' + col[1] + ',' + col[2] + ')';
        ctx.beginPath(); ctx.arc(q[0], q[1], dotR * cam[0], 0, 6.2832); ctx.fill();
      }
      ctx.globalAlpha = 1;
      drawLabels(A, 1 - m, cam); drawLabels(B, m, cam);
      drawExtras(A, tt, 1 - m, cam); drawExtras(B, 0, m, cam);

      // step text + stats opacity — windows narrow enough that two texts never co-exist
      for (var s = 0; s < steps.length; s++) {
        var dist = Math.abs(p - s);
        steps[s].style.opacity = clamp(1 - Math.max(0, dist - 0.25) / 0.17, 0, 1).toFixed(3);
      }
      if (hintEl) hintEl.style.opacity = clamp(1 - p / 0.5, 0, 1).toFixed(3);
      if (statsEl) {
        var so = clamp((p - (SC - 1.30)) / 0.30, 0, 1);
        statsEl.style.opacity = so.toFixed(3);
        if (so > 0.5) fireCountups();
      }
    }

    /* ---------- count-ups in the stats overlay ---------- */
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

    /* ---------- scroll & resize wiring ---------- */
    var steps = [].slice.call(theatre.querySelectorAll('.df-step'));
    var stage = theatre.querySelector('.df-stage');
    var hintEl = theatre.querySelector('.df-hint');
    var override = null; // for audits: __dfSet

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
      if (raf) return;
      raf = requestAnimationFrame(function () { raf = null; render(progress()); });
    }

    if (RM) {
      // single static composed frame: the coloured, labelled bar
      theatre.classList.add('df-static');
      sizes();
      var barIdx = 0;
      for (var s2 = 0; s2 < SC; s2++) if (scenes[s2].key === 'bar' && scenes[s2].labels) { barIdx = s2; break; }
      render(barIdx);
      if (statsEl) { statsEl.style.opacity = 1; fireCountups(); }
      steps.forEach(function (el, i) { el.style.opacity = i === 0 ? 1 : 0; });
      window.addEventListener('resize', function () { sizes(); render(barIdx); });
    } else {
      theatre.style.height = (SC * 100) + 'vh';
      sizes(); render(0);
      window.addEventListener('scroll', schedule, { passive: true });
      window.addEventListener('resize', function () { sizes(); schedule(); });
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
