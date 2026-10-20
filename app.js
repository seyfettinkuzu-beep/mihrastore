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
    resetZoom();
    $('lbi').src = u.gorsel; $('lbi').alt = u.ad || '';
    $('lbt').textContent = u.ad || ''; $('lbc').textContent = etiket(u);
    $('lbf').textContent = u.fiyat || ''; $('lbf').hidden = !u.fiyat;
    var w = $('lbw'); w.hidden = !wa;
    if (wa) {
      w.href = waLink('Merhaba, ' + marka + '\'daki "' + (u.ad || 'ürün') + '"' + (u.fiyat ? ' (' + u.fiyat + ')' : '') + ' ürünüyle ilgileniyorum.\n' + new URL(u.gorsel, location.href).href);
      w.textContent = u.fiyat ? 'WhatsApp\'tan sipariş ver' : 'WhatsApp\'tan fiyat sor';
    }
    $('lbk').textContent = (idx + 1) + ' / ' + shown.length + '\n' + zoomHint;
    var multi = shown.length > 1; $('lbp').hidden = !multi; $('lbn').hidden = !multi;
    var nx = shown[(idx + 1) % shown.length]; if (nx) { var pre = new Image(); pre.src = nx.gorsel; }
  }
  function open(i) {
    last = document.activeElement; show(i);
    lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); document.body.classList.add('lock'); $('lbx').focus();
  }
  function close() {
    resetZoom();
    lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); document.body.classList.remove('lock');
    if (last && last.focus) last.focus();
  }
  $('grid').addEventListener('click', function (e) { var t = e.target.closest('.tile'); if (t) open(Number(t.getAttribute('data-i'))); });
  $('lbx').addEventListener('click', close);
  $('lbp').addEventListener('click', function () { show(idx - 1); });
  $('lbn').addEventListener('click', function () { show(idx + 1); });
  lb.addEventListener('click', function (e) {
    if (noClick) { noClick = false; return; }
    if (e.target === lb || e.target.tagName === 'FIGURE') { if (Z.s > 1) zoomTo(1, 0, 0, true); else close(); }
  });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') { if (Z.s > 1) zoomTo(1, 0, 0, true); else close(); }
    else if (e.key === 'ArrowLeft') show(idx - 1); else if (e.key === 'ArrowRight') show(idx + 1);
    else if (e.key === '+' || e.key === '=') zoomCenter(Z.s * 1.5);
    else if (e.key === '-' || e.key === '_') zoomCenter(Z.s / 1.5);
    else if (e.key === '0') zoomTo(1, 0, 0, true);
  });
  /* yakınlaştırma: telefonda iki parmak / çift dokunma, bilgisayarda tıklama / tekerlek; yakınken sürükleyerek gezinme */
  var img = $('lbi'), fig = img.parentNode, MAXZ = 4;
  var Z = { s: 1, x: 0, y: 0 }, ptrs = {}, pinch = null, drag = null, lastTap = null, noClick = false;
  var coarse = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  var zoomHint = coarse ? 'Yakınlaştırmak için çift dokun' : 'Yakınlaştırmak için fotoğrafa tıkla';
  img.setAttribute('draggable', 'false');
  img.addEventListener('dragstart', function (e) { e.preventDefault(); });

  function apply(anim) {
    img.style.transition = anim ? 'transform .28s ease' : 'none';
    img.style.transform = Z.s === 1 ? '' : 'translate(' + Z.x + 'px,' + Z.y + 'px) scale(' + Z.s + ')';
    lb.classList.toggle('zoomed', Z.s > 1);
  }
  function clamp() {
    var mx = Math.max(0, (img.offsetWidth * Z.s - fig.clientWidth) / 2);
    var my = Math.max(0, (img.offsetHeight * Z.s - fig.clientHeight) / 2);
    Z.x = Math.min(mx, Math.max(-mx, Z.x));
    Z.y = Math.min(my, Math.max(-my, Z.y));
  }
  function zoomTo(ns, px, py, anim) {
    ns = Math.max(1, Math.min(MAXZ, ns));
    if (ns < 1.02) { Z.s = 1; Z.x = 0; Z.y = 0; apply(anim); return; }
    var r = img.getBoundingClientRect();
    var cx = r.left + r.width / 2 - Z.x, cy = r.top + r.height / 2 - Z.y;   // yakınlaştırmasız merkez
    var ux = (px - cx - Z.x) / Z.s, uy = (py - cy - Z.y) / Z.s;              // parmağın altındaki nokta
    Z.s = ns; Z.x = px - cx - ux * ns; Z.y = py - cy - uy * ns;
    clamp(); apply(anim);
  }
  function zoomCenter(ns) { var r = fig.getBoundingClientRect(); zoomTo(ns, r.left + r.width / 2, r.top + r.height / 2, true); }
  function resetZoom() { Z.s = 1; Z.x = 0; Z.y = 0; ptrs = {}; pinch = null; drag = null; lastTap = null; apply(false); }
  function two() { var k = Object.keys(ptrs); return k.length === 2 ? [ptrs[k[0]], ptrs[k[1]]] : null; }
  function dist(a, b) { return Math.hypot(a.x - b.x, a.y - b.y) || 1; }

  fig.addEventListener('pointerdown', function (e) {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    noClick = false;
    ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    var p = two();
    if (p) { pinch = { d: dist(p[0], p[1]), s: Z.s }; drag = null; }
    else if (Object.keys(ptrs).length === 1) drag = { x: e.clientX, y: e.clientY, tx: Z.x, ty: Z.y, moved: false };
  });
  window.addEventListener('pointermove', function (e) {
    if (!ptrs[e.pointerId]) return;
    ptrs[e.pointerId] = { x: e.clientX, y: e.clientY };
    var p = two();
    if (pinch && p) {
      zoomTo(pinch.s * dist(p[0], p[1]) / pinch.d, (p[0].x + p[1].x) / 2, (p[0].y + p[1].y) / 2, false);
    } else if (drag) {
      var dx = e.clientX - drag.x, dy = e.clientY - drag.y;
      if (Math.abs(dx) + Math.abs(dy) > 8) drag.moved = true;
      if (Z.s > 1) { Z.x = drag.tx + dx; Z.y = drag.ty + dy; clamp(); apply(false); }
    }
  });
  function up(e) {
    if (!ptrs[e.pointerId]) return;
    delete ptrs[e.pointerId];
    var left = Object.keys(ptrs);
    if (pinch) {
      if (left.length < 2) {
        pinch = null; noClick = true;
        if (left.length === 1) { var q = ptrs[left[0]]; drag = { x: q.x, y: q.y, tx: Z.x, ty: Z.y, moved: true }; }
      }
      return;
    }
    if (!drag || left.length) return;
    var d = drag; drag = null;
    var dx = e.clientX - d.x, dy = e.clientY - d.y;
    if (d.moved) {
      noClick = true;
      if (Z.s === 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) show(idx + (dx < 0 ? 1 : -1));
      return;
    }
    if (e.pointerType === 'mouse') {                    // bilgisayar: fotoğrafa tıkla → yakınlaş / uzaklaş
      if (e.target === img) { noClick = true; if (Z.s > 1) zoomTo(1, 0, 0, true); else zoomTo(2.5, e.clientX, e.clientY, true); }
      return;
    }
    var now = Date.now();                               // telefon: çift dokunma
    if (lastTap && now - lastTap.t < 320 && Math.hypot(e.clientX - lastTap.x, e.clientY - lastTap.y) < 40) {
      lastTap = null; noClick = true;
      if (Z.s > 1) zoomTo(1, 0, 0, true); else zoomTo(2.5, e.clientX, e.clientY, true);
      return;
    }
    lastTap = { t: now, x: e.clientX, y: e.clientY };
    if (e.target !== img) {                             // boşluğa tek dokunuş: çift dokunma değilse kapat / uzaklaş
      noClick = true;
      setTimeout(function () { if (lastTap && lastTap.t === now) { lastTap = null; if (Z.s > 1) zoomTo(1, 0, 0, true); else close(); } }, 330);
    }
  }
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  fig.addEventListener('wheel', function (e) {
    e.preventDefault();
    zoomTo(Z.s * Math.exp(-e.deltaY * (e.ctrlKey ? 0.01 : 0.0025)), e.clientX, e.clientY, false);
  }, { passive: false });
  window.addEventListener('resize', function () { if (Z.s > 1) { clamp(); apply(false); } });

  chips(); draw();
})();
