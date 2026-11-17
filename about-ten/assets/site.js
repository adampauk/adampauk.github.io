/* about ten. / body count. preview website: menu, drawers, forms, photo picker, preview switch */
(function () {
  var $ = function (s, r) { return (r || document).querySelector(s); };
  var $$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };
  var store = {
    get: function (k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  var scrim = $('.scrim');
  var openEl = null, opener = null;

  function setOpen(el, on) {
    el.classList.toggle('open', on);
    el.setAttribute('aria-hidden', on ? 'false' : 'true');
    if (on) el.removeAttribute('inert'); else el.setAttribute('inert', '');
  }
  function open(el, from) {
    if (openEl) close(true);
    openEl = el; opener = from || document.activeElement;
    if (el.classList.contains('drawer')) {           // a fresh form every time it opens
      el.classList.remove('sent');
      var f = $('form', el); if (f) { f.reset(); $$('[aria-invalid]', f).forEach(function (i) { i.removeAttribute('aria-invalid'); }); $$('.err', f).forEach(function (e) { e.textContent = ''; }); }
    }
    setOpen(el, true);
    if (scrim) scrim.classList.add('open');
    document.documentElement.classList.add('lock');
    if (opener && opener.hasAttribute('aria-controls')) opener.setAttribute('aria-expanded', 'true');
    setTimeout(function () { var t = $('input', el) || $('.x', el); if (t) t.focus({ preventScroll: true }); }, 60);
  }
  function close(quiet) {
    if (!openEl) return;
    setOpen(openEl, false);
    if (scrim) scrim.classList.remove('open');
    document.documentElement.classList.remove('lock');
    if (opener && opener.hasAttribute('aria-controls')) opener.setAttribute('aria-expanded', 'false');
    var back = opener; openEl = null; opener = null;
    if (!quiet && back && back.focus) back.focus({ preventScroll: true });
  }

  document.addEventListener('click', function (e) {
    var o = e.target.closest('[data-open]');
    if (o) { var el = document.getElementById(o.getAttribute('data-open')); if (el) { e.preventDefault(); open(el, o); } return; }
    if (e.target.closest('[data-close]')) { e.preventDefault(); close(); return; }
    var a = e.target.closest('.mnav a'); if (a) close(true);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && openEl) { e.preventDefault(); close(); }
    if (e.key === 'Tab' && openEl) {                 // keep the keyboard inside the open panel
      var f = $$('a[href],button:not([disabled]),input,select,textarea', openEl).filter(function (x) { return x.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });

  // forms: checked here, nothing is sent anywhere
  var EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
  $$('form[data-form]').forEach(function (f) {
    f.setAttribute('novalidate', '');
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var firstBad = null;
      $$('input', f).forEach(function (i) {
        var v = i.value.trim(), msg = '';
        if (i.required && !v) msg = f.getAttribute('data-need');
        else if (i.type === 'email' && v && !EMAIL.test(v)) msg = f.getAttribute('data-bad');
        i.setAttribute('aria-invalid', msg ? 'true' : 'false');
        var er = document.getElementById(i.getAttribute('aria-describedby'));
        if (er) er.textContent = msg;
        if (msg && !firstBad) firstBad = i;
      });
      if (firstBad) { firstBad.focus(); return; }
      var d = f.closest('.drawer');
      if (d) { d.classList.add('sent'); var h = $('.done .ttl', d); if (h) h.focus(); }
    });
  });

  // the box: photo picker
  $$('[data-thumb]').forEach(function (b) {
    b.addEventListener('click', function () {
      var n = b.getAttribute('data-thumb');
      $$('[data-thumb]').forEach(function (x) { x.setAttribute('aria-pressed', x === b ? 'true' : 'false'); });
      $$('[data-panel]').forEach(function (p) { p.hidden = p.getAttribute('data-panel') !== n; });
    });
  });

  // the preview switch can shrink to a dot, remembered per browser
  var sw = $('.pv-sw');
  if (sw) {
    var hd = $('.hd', sw);
    var paint = function (min) {
      sw.classList.toggle('min', min);
      hd.setAttribute('aria-label', min ? 'show the preview switch' : 'hide the preview switch');
      hd.setAttribute('title', min ? 'show the preview switch' : 'hide the preview switch');
    };
    paint(store.get('pv-min') === '1');
    hd.addEventListener('click', function () { var m = !sw.classList.contains('min'); paint(m); store.set('pv-min', m ? '1' : '0'); });
  }
})();
