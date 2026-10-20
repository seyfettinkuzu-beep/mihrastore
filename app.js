(function () {
  'use strict';
  var S = window.SHOWROOM || { marka: 'Showroom', urunler: [] };
  var marka = S.marka || 'Showroom';
  var all = (Array.isArray(S.urunler) ? S.urunler : []).filter(function (u) { return u && u.gorsel && !u.gizli; });
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
  var yil = String(new Date().getFullYear());

  /* Ürünün ana grubu (Kolye, Bileklik…) ve alt kategorisi (İnci, Taşlı…).
     Eski biçimdeki dosyalarda yalnızca "kategori" vardır; o zaman grup olarak kullanılır. */
  function grupOf(u) { return u.grup || u.kategori || ''; }
  function altOf(u) { return u.grup ? (u.kategori || '') : ''; }
  function etiket(u) { var g = grupOf(u), k = altOf(u); return k ? g + ' · ' + k : g; }

  document.title = marka + (S.slogan ? ' · ' + S.slogan : '');
  $('brand').textContent = marka;
  $('slogan').textContent = S.slogan || '';
  $('slogan').hidden = !S.slogan;
  $('lead').textContent = S.aciklama || '';
  $('lead').hidden = !S.aciklama;
  var alt = String(S.altYazi || '').replace(/\{yil\}/g, yil);
  $('foot').textContent = alt;
  $('foot').hidden = !alt;

  var wa = String(S.whatsapp || '').replace(/\D/g, '');
  function waLink(txt) { return 'https://wa.me/' + wa + '?text=' + encodeURIComponent(txt); }
  if (wa) { var fab = $('wafab'); fab.href = waLink('Merhaba, ' + marka + ' ürünleri hakkında bilgi almak istiyorum.'); fab.hidden = false; }

  var groups = ['Tümü'];
  all.forEach(function (u) { var g = grupOf(u); if (g && groups.indexOf(g) < 0) groups.push(g); });
  var cur = 'Tümü', sub = '', shown = [], io = null, last = null;

  function subsFor(g) {
    var s = [];
    all.forEach(function (u) { if (grupOf(u) === g) { var k = altOf(u); if (k && s.indexOf(k) < 0) s.push(k); } });
    return s;
  }
  function chip(label, val, on, kind) {
    return '<button class="chip" type="button" data-' + kind + '="' + esc(val) + '" aria-pressed="' + on + '">' + esc(label) + '</button>';
  }
  function chips() {
    var f = $('filters'), sf = $('subfilters'), nav = $('nav');
    if (groups.length < 3) { nav.hidden = true; return; }
    f.innerHTML = groups.map(function (c) { return chip(c, c, c === cur, 'c'); }).join('');
    var subs = cur === 'Tümü' ? [] : subsFor(cur);
    if (subs.length < 2) { sf.hidden = true; sf.innerHTML = ''; sub = ''; return; }
    sf.hidden = false;
    sf.innerHTML = chip('Hepsi', '', sub === '', 's') + subs.map(function (s) { return chip(s, s, s === sub, 's'); }).join('');
  }

  function draw() {
    shown = all.filter(function (u) {
      if (cur === 'Tümü') return true;
      return grupOf(u) === cur && (!sub || altOf(u) === sub);
    });
    var g = $('grid');
    g.innerHTML = shown.map(function (u, i) {
      var et = etiket(u);
      return '<button type="button" class="tile reveal" data-i="' + i + '" aria-label="' + esc(u.ad || 'Ürün') + ' büyüt">' +
        '<img class="pre" src="' + esc(u.kucuk || u.gorsel) + '" alt="' + esc(u.ad || '') + '" loading="' + (i < 6 ? 'eager' : 'lazy') + '" decoding="async">' +
        ((u.ad || et || u.fiyat) ? '<span class="cap"><b>' + esc(u.ad || '') + '</b><span>' + esc(et) + '</span>' +
          (u.fiyat ? '<em class="p">' + esc(u.fiyat) + '</em>' : '') + '</span>' : '') + '</button>';
    }).join('');
    $('empty').hidden = shown.length > 0;
    Array.prototype.forEach.call(g.querySelectorAll('img'), function (im) {
      var ok = function () { im.classList.remove('pre'); };
      var bad = function () { var t = im.closest('.tile'); if (t) t.style.display = 'none'; };
      if (im.complete) { if (im.naturalWidth) ok(); else bad(); }
      else { im.addEventListener('load', ok); im.addEventListener('error', bad); }
    });
    var els = g.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window) {
      if (io) io.disconnect();
      io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }); }, { rootMargin: '0px 0px -6% 0px' });
      Array.prototype.forEach.call(els, function (el) { io.observe(el); });
    } else Array.prototype.forEach.call(els, function (el) { el.classList.add('in'); });
  }

  $('nav').addEventListener('click', function (e) {
    var b = e.target.closest('[data-c],[data-s]'); if (!b) return;
    if (b.hasAttribute('data-c')) { cur = b.getAttribute('data-c'); sub = ''; }
    else sub = b.getAttribute('data-s');
    chips(); draw();
  });

  /* büyük görünüm */
  var lb = $('lb'), idx = 0;
  function show(i) {
    if (!shown.length) return;
    idx = (i + shown.length) % shown.length;
    var u = shown[idx];
    $('lbi').src = u.gorsel; $('lbi').alt = u.ad || '';
    $('lbt').textContent = u.ad || ''; $('lbc').textContent = etiket(u);
    $('lbf').textContent = u.fiyat || ''; $('lbf').hidden = !u.fiyat;
    var w = $('lbw'); w.hidden = !wa;
    if (wa) {
      w.href = waLink('Merhaba, ' + marka + '\'daki "' + (u.ad || 'ürün') + '"' + (u.fiyat ? ' (' + u.fiyat + ')' : '') + ' ürünüyle ilgileniyorum.\n' + new URL(u.gorsel, location.href).href);
      w.textContent = u.fiyat ? 'WhatsApp\'tan sipariş ver' : 'WhatsApp\'tan fiyat sor';
    }
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
