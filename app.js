(function () {
  'use strict';
  var S = window.SHOWROOM || { marka: 'Showroom', urunler: [] };
  var all = Array.isArray(S.urunler) ? S.urunler : [];
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };

  document.title = S.marka + (S.slogan ? ' · ' + S.slogan : '');
  $('brand').textContent = S.marka || '';
  $('slogan').textContent = S.slogan || '';
  $('slogan').hidden = !S.slogan;
  $('lead').textContent = S.aciklama || '';
  $('lead').hidden = !S.aciklama;
  $('foot').textContent = S.altYazi || '';
  $('foot').hidden = !S.altYazi;

  var cats = ['Tümü'];
  all.forEach(function (u) { if (u.kategori && cats.indexOf(u.kategori) < 0) cats.push(u.kategori); });
  var cur = 'Tümü', shown = [], io = null, last = null;

  function chips() {
    var f = $('filters');
    if (cats.length < 3) { f.hidden = true; return; }
    f.innerHTML = cats.map(function (c) { return '<button class="chip" type="button" data-c="' + esc(c) + '" aria-pressed="' + (c === cur) + '">' + esc(c) + '</button>'; }).join('');
  }

  function draw() {
    shown = all.filter(function (u) { return cur === 'Tümü' || u.kategori === cur; });
    var g = $('grid');
    g.innerHTML = shown.map(function (u, i) {
      return '<button type="button" class="tile reveal" data-i="' + i + '" aria-label="' + esc(u.ad || 'Ürün') + ' büyüt">' +
        '<img class="pre" src="' + esc(u.kucuk || u.gorsel) + '" alt="' + esc(u.ad || '') + '" loading="' + (i < 6 ? 'eager' : 'lazy') + '" decoding="async">' +
        ((u.ad || u.kategori) ? '<span class="cap"><b>' + esc(u.ad || '') + '</b><span>' + esc(u.kategori || '') + '</span></span>' : '') + '</button>';
    }).join('');
    $('empty').hidden = shown.length > 0;
    Array.prototype.forEach.call(g.querySelectorAll('img'), function (im) {
      var ok = function () { im.classList.remove('pre'); };
      if (im.complete) ok(); else { im.addEventListener('load', ok); im.addEventListener('error', function () { im.closest('.tile').style.display = 'none'; }); }
    });
    var els = g.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      if (io) io.disconnect();
      io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -6% 0px' });
      Array.prototype.forEach.call(els, function (el) { io.observe(el); });
    } else Array.prototype.forEach.call(els, function (el) { el.classList.add('in'); });
  }

  $('filters').addEventListener('click', function (e) {
    var b = e.target.closest('[data-c]'); if (!b) return;
    cur = b.getAttribute('data-c');
    Array.prototype.forEach.call($('filters').children, function (x) { x.setAttribute('aria-pressed', String(x === b)); });
    draw();
  });

  /* büyük görünüm */
  var lb = $('lb'), idx = 0;
  function show(i) {
    if (!shown.length) return;
    idx = (i + shown.length) % shown.length;
    var u = shown[idx];
    $('lbi').src = u.gorsel; $('lbi').alt = u.ad || '';
    $('lbt').textContent = u.ad || ''; $('lbc').textContent = u.kategori || '';
    $('lbk').textContent = (idx + 1) + ' / ' + shown.length;
    var multi = shown.length > 1; $('lbp').hidden = !multi; $('lbn').hidden = !multi;
    var nx = shown[(idx + 1) % shown.length]; if (nx) { var pre = new Image(); pre.src = nx.gorsel; }
  }
  function open(i) {
    last = document.activeElement; show(i);
    lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); document.body.classList.add('lock'); $('lbx').focus();
  }
  function close() {
    lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); document.body.classList.remove('lock');
    if (last && last.focus) last.focus();
  }
  $('grid').addEventListener('click', function (e) { var t = e.target.closest('.tile'); if (t) open(Number(t.getAttribute('data-i'))); });
  $('lbx').addEventListener('click', close);
  $('lbp').addEventListener('click', function () { show(idx - 1); });
  $('lbn').addEventListener('click', function () { show(idx + 1); });
  lb.addEventListener('click', function (e) { if (e.target === lb || e.target.tagName === 'FIGURE') close(); });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') close(); else if (e.key === 'ArrowLeft') show(idx - 1); else if (e.key === 'ArrowRight') show(idx + 1);
  });
  var sx = null;
  lb.addEventListener('touchstart', function (e) { sx = e.touches.length === 1 ? e.touches[0].clientX : null; }, { passive: true });
  lb.addEventListener('touchend', function (e) {
    if (sx == null) return; var dx = e.changedTouches[0].clientX - sx; sx = null;
    if (Math.abs(dx) > 50) show(idx + (dx < 0 ? 1 : -1));
  }, { passive: true });

  chips(); draw();
})();
