/* CARE PERSONAS — shared behaviour: reveal-on-scroll, tooltips, scroll-to-persona */
(function () {
  document.documentElement.classList.add('js');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Reveal on scroll
  var reveals = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.08 });
    reveals.forEach(function (el) { io.observe(el); });
  }

  // Tooltip for [data-tip] (hover + keyboard focus; enhances, never gates — table views carry the same values)
  var tip = document.getElementById('tip');
  if (tip) {
    var show = function (html) { tip.innerHTML = html; tip.style.display = 'block'; tip.setAttribute('aria-hidden', 'false'); };
    var move = function (x, y) {
      var w = tip.offsetWidth, h = tip.offsetHeight;
      var nx = Math.min(x + 14, window.innerWidth - w - 10);
      var ny = y - h - 12; if (ny < 8) ny = y + 18;
      tip.style.left = nx + 'px'; tip.style.top = ny + 'px';
    };
    var hide = function () { tip.style.display = 'none'; tip.setAttribute('aria-hidden', 'true'); };
    document.querySelectorAll('[data-tip]').forEach(function (el) {
      el.addEventListener('pointerenter', function (ev) { show(el.getAttribute('data-tip')); move(ev.clientX, ev.clientY); });
      el.addEventListener('pointermove', function (ev) { move(ev.clientX, ev.clientY); });
      el.addEventListener('pointerleave', hide);
      el.addEventListener('focus', function () { var r = el.getBoundingClientRect(); show(el.getAttribute('data-tip')); move(r.left + r.width / 2, r.top); });
      el.addEventListener('blur', hide);
    });
  }

  // Comparison bars grow to their value on first reveal (skipped under reduced motion)
  if (!reduce) {
    document.querySelectorAll('.bfill').forEach(function (el) {
      var w = el.style.width;
      if (!w) return;
      el.setAttribute('data-w', w);
      el.style.width = '0%';
      el.style.transition = 'width .9s cubic-bezier(.25,.7,.3,1)';
    });
    var grow = function (scope) {
      scope.querySelectorAll('.bfill[data-w]').forEach(function (el) {
        el.style.width = el.getAttribute('data-w');
        el.removeAttribute('data-w');
      });
    };
    if ('IntersectionObserver' in window) {
      var gio = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
          if (e.isIntersecting) { grow(e.target); gio.unobserve(e.target); }
        });
      }, { threshold: 0.35 });
      document.querySelectorAll('.brow').forEach(function (el) { gio.observe(el); });
      // print must never show empty bars
      window.addEventListener('beforeprint', function () { grow(document); });
    } else { grow(document); }
  }

  // Segment / chip → scroll to persona card with a brief highlight
  document.querySelectorAll('[data-target]').forEach(function (el) {
    el.addEventListener('click', function () {
      var t = document.getElementById(el.getAttribute('data-target'));
      if (!t) return;
      t.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' });
      t.style.outline = '3px solid var(--accent)'; t.style.outlineOffset = '3px';
      setTimeout(function () { t.style.outline = 'none'; }, 1600);
    });
  });
})();
