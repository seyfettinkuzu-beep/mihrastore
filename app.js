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
  /* Ürünün tüm fotoğrafları: kapak + ekGorseller */
  function pics(u) {
    var a = [{ g: u.gorsel, k: u.kucuk || u.gorsel }];
    (Array.isArray(u.ekGorseller) ? u.ekGorseller : []).forEach(function (e) { if (e && e.gorsel) a.push({ g: e.gorsel, k: e.kucuk || e.gorsel }); });
    return a;
  }
  /* Fiyat kutusuna "SATILDI" yazılan ürünler */
  function satildi(u) { return /^\s*sat[ıi]ld[ıi]\s*$/i.test(String(u.fiyat || '').replace(/İ/g, 'i').replace(/I/g, 'ı')); }
  /* İndirim: panelde "İndirimli fiyat" kutusu doldurulan ürünler (satılanlar hariç) */
  var IND = 'İndirim';
  function num(v) { var s = String(v || '').replace(/[^\d,]/g, '').replace(',', '.'); return s ? parseFloat(s) : NaN; }
  function indirimde(u) { return !!String(u.indirimli || '').trim() && !satildi(u); }
  function gecerliFiyat(u) { return indirimde(u) ? u.indirimli : (u.fiyat || ''); }
  function yuzde(u) { var a = num(u.fiyat), b = num(u.indirimli); return a > 0 && b > 0 && b < a ? Math.round((1 - b / a) * 100) : 0; }
  /* Ön sipariş: panelde "Ön sipariş" işaretlenen ürünler (satılanlar hariç) başvuru formuyla istenir */
  function onSip(u) { return !!u.onSiparis && !satildi(u); }
  function fiyatHtml(u) {
    if (!indirimde(u)) return esc(u.fiyat);
    return (u.fiyat ? '<s>' + esc(u.fiyat) + '</s> ' : '') + '<ins>' + esc(u.indirimli) + '</ins>';
  }
  /* Arama: Türkçe karakterlerden bağımsız, ürün adı / kodu / kategori içinde */
  function sade(s) {
    return String(s || '').toLocaleLowerCase('tr').replace(/ç/g, 'c').replace(/ğ/g, 'g').replace(/ı/g, 'i').replace(/ö/g, 'o').replace(/ş/g, 's').replace(/ü/g, 'u').replace(/â/g, 'a').replace(/î/g, 'i').replace(/û/g, 'u');
  }
  function samanlik(u) {
    if (!u._s) u._s = sade([u.ad, u.kod, String(u.kod || '').replace(/[^a-z0-9]/gi, ''), grupOf(u), altOf(u)].join(' '));
    return u._s;
  }
  var ara = '', araKod = '';
  /* "kp12", "KP 12", "kp-012" gibi kod aramaları: tam kod eşleşmesi varsa yalnızca o ürün gösterilir */
  function kodAyikla(q) {
    var m = /^([a-z]{2})[\s-]*(\d{1,4})$/.exec(q);
    if (!m) return '';
    var k = m[1] + String(parseInt(m[2], 10)).padStart(3, '0');
    return all.some(function (u) { return sade(u.kod).replace(/[^a-z0-9]/g, '') === k; }) ? k : '';
  }
  function eslesir(u) {
    if (!ara) return true;
    if (araKod) return sade(u.kod).replace(/[^a-z0-9]/g, '') === araKod;
    var h = samanlik(u);
    return ara.split(/\s+/).every(function (w) { return h.indexOf(w) >= 0 || h.indexOf(w.replace(/[^a-z0-9]/g, '')) >= 0; });
  }
  function tamKod(u) { var k = sade(u.kod).replace(/[^a-z0-9]/g, ''); return k && k === ara.replace(/[^a-z0-9]/g, ''); }
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

  /* Beğendiklerim: müşterinin kalp verdiği ürünler yalnızca kendi tarayıcısında saklanır (ürün fotoğrafının yoluyla) */
  var FAV = 'Beğendiklerim', FKEY = 'mihra-begenilen', favs = [];
  try { favs = JSON.parse(localStorage.getItem(FKEY) || '[]'); if (!Array.isArray(favs)) favs = []; } catch (x) { favs = []; }
  favs = favs.filter(function (k) { return all.some(function (u) { return u.gorsel === k; }); });
  function isFav(u) { return favs.indexOf(u.gorsel) >= 0; }
  /* Beğeni sayacı: panelde "Beğeni bağlantısı" girildiyse her beğeni/geri alma isimsiz olarak Google E-Tablo'ya bildirilir */
  var BURL = /^https:\/\/script\.google(usercontent)?\.com\//.test(String(S.begeniAdresi || '')) ? S.begeniAdresi : '';
  function bildir(u, v) {
    if (!BURL) return;
    var body = JSON.stringify({ g: u.gorsel, ad: u.ad || '', grup: grupOf(u), v: v });
    try {
      if (navigator.sendBeacon && navigator.sendBeacon(BURL, new Blob([body], { type: 'text/plain' }))) return;
    } catch (x) {}
    try { fetch(BURL, { method: 'POST', mode: 'no-cors', body: body, keepalive: true }); } catch (x) {}
  }
  /* Ziyaretçi sayacı: her tarayıcı günde bir kez sayılır; açılan ürünler de günde bir kez. Yönetici paneli açılan tarayıcı sayılmaz. */
  function gunKey() { var d = new Date(); return d.getFullYear() + '-' + (d.getMonth() + 1) + '-' + d.getDate(); }
  function lsGet(k) { try { return localStorage.getItem(k); } catch (x) { return null; } }
  function lsSet(k, v) { try { localStorage.setItem(k, v); } catch (x) {} }
  function gonder(o) {
    if (!BURL || lsGet('mihra-yonetici')) return;
    var body = JSON.stringify(o);
    try { if (navigator.sendBeacon && navigator.sendBeacon(BURL, new Blob([body], { type: 'text/plain' }))) return; } catch (x) {}
    try { fetch(BURL, { method: 'POST', mode: 'no-cors', body: body, keepalive: true }); } catch (x) {}
  }
  if (lsGet('mihra-ziyaret') !== gunKey()) { lsSet('mihra-ziyaret', gunKey()); gonder({ t: 'site' }); }
  var bakilan = {}, lbU = null;
  try { var bk = JSON.parse(lsGet('mihra-bakilan') || '{}'); if (bk && bk.g === gunKey() && bk.l) bakilan = bk.l; } catch (x) {}
  function urunBakildi(u) {
    if (!u || bakilan[u.gorsel]) return;
    bakilan[u.gorsel] = 1; lsSet('mihra-bakilan', JSON.stringify({ g: gunKey(), l: bakilan }));
    gonder({ t: 'urun', g: u.gorsel, ad: u.ad || '' });
  }
  function saveFavs() { try { localStorage.setItem(FKEY, JSON.stringify(favs)); } catch (x) {} }
  var HEART = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true"><path d="M12 20.6s-7.6-4.6-9.4-9.3C1.4 8 3.4 4.6 6.9 4.6c2.1 0 3.5 1.1 5.1 3 1.6-1.9 3-3 5.1-3 3.5 0 5.5 3.4 4.3 6.7-1.8 4.7-9.4 9.3-9.4 9.3z"/></svg>';

  /* Kategori sırası: yönetici panelindeki sıra (gruplar), ardından listede olup orada olmayanlar. Ürünü olmayan kategori gösterilmez. */
  var has = {}, groups = [];
  all.forEach(function (u) { has[grupOf(u)] = 1; });
  function buildGroups() {
    groups = ['Tümü'];
    (Array.isArray(S.gruplar) ? S.gruplar : []).forEach(function (g) { if (has[g] && groups.indexOf(g) < 0) groups.push(g); });
    all.forEach(function (u) { var g = grupOf(u); if (g && groups.indexOf(g) < 0) groups.push(g); });
    /* İndirimli ürün varsa ana kategorilerin sonuna "İndirim" düğmesi */
    if (all.some(indirimde) && groups.indexOf(IND) < 0) groups.push(IND);
    if (favs.length) groups.push(FAV);
  }
  buildGroups();
  var cur = 'Tümü', sub = '', fb = '', shown = [], io = null, last = null;

  /* Fiyat aralığı süzgeci: fiyatı "1.250 ₺" gibi yazılmış ürünler; fiyatsız ve satılmış ürünler aralık seçilince gösterilmez. */
  var BANDS = [
    { id: 'a', ad: '1.000 ₺ altı', min: 0, max: 1000 },
    { id: 'b', ad: '1.000 – 2.000 ₺', min: 1000, max: 2000 },
    { id: 'c', ad: '2.000 – 3.000 ₺', min: 2000, max: 3000 },
    { id: 'd', ad: '3.000 ₺ üstü', min: 3000, max: Infinity }
  ];
  function fiyatNum(u) {
    if (satildi(u)) return NaN;
    return num(gecerliFiyat(u));
  }
  function inBand(u, id) {
    var b = BANDS.filter(function (x) { return x.id === id; })[0], n = fiyatNum(u);
    return !b || (n >= b.min && n < b.max);
  }
  function inCat(u) { return cur === 'Tümü' || (cur === FAV ? isFav(u) : cur === IND ? indirimde(u) : (grupOf(u) === cur && (!sub || altOf(u) === sub))); }

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
    f.innerHTML = groups.map(function (c) { return chip(c === FAV ? '♥ ' + FAV + ' (' + favs.length + ')' : c, c, c === cur, 'c'); }).join('');
    var subs = cur === 'Tümü' || cur === IND || cur === FAV ? [] : subsFor(cur);
    /* Tek alt kategori varsa da (ör. Yüzük > Tektaş) diğer ürünler alt kategorisizse süzgeç gösterilir. */
    var loose = subs.length === 1 && all.some(function (u) { return grupOf(u) === cur && !altOf(u); });
    if (subs.length < 2 && !loose) { sf.hidden = true; sf.innerHTML = ''; sub = ''; return; }
    sf.hidden = false;
    sf.innerHTML = chip('Hepsi', '', sub === '', 's') + subs.map(function (s) { return chip(s, s, s === sub, 's'); }).join('');
  }
  /* Yalnızca seçili kategoride ürünü olan fiyat aralıkları gösterilir. */
  function priceChips() {
    var pf = $('pricefilters');
    var inC = all.filter(function (u) { return inCat(u) && eslesir(u); });
    var bs = BANDS.filter(function (b) { return inC.some(function (u) { return inBand(u, b.id); }); });
    if (fb && !bs.some(function (b) { return b.id === fb; })) fb = '';
    if (bs.length < 2) { pf.hidden = true; pf.innerHTML = ''; fb = ''; return; }
    pf.hidden = false;
    pf.innerHTML = '<span class="lbl">Fiyat</span>' + chip('Tümü', '', fb === '', 'f') + bs.map(function (b) { return chip(b.ad, b.id, b.id === fb, 'f'); }).join('');
  }

  function karistir(list) {
    var by = {}, keys = [];
    list.forEach(function (u) { var g = grupOf(u); if (!by[g]) { by[g] = []; keys.push(g); } by[g].push(u); });
    var arr = [];
    keys.forEach(function (g, gi) { var n = by[g].length; by[g].forEach(function (u, i) { arr.push({ u: u, g: g, k: (i + 0.5) / n, gi: gi }); }); });
    arr.sort(function (a, b) { return a.k - b.k || a.gi - b.gi; });
    /* aynı kategoriden iki ürün yan yana geldiyse, ileride farklı kategoriden ilk ürünle yer değiştir */
    for (var i = 1; i < arr.length; i++) {
      if (arr[i].g !== arr[i - 1].g) continue;
      for (var j = i + 1; j < arr.length && j < i + 12; j++) {
        if (arr[j].g !== arr[i - 1].g) { var x = arr[i]; arr[i] = arr[j]; arr[j] = x; break; }
      }
    }
    return arr.map(function (x) { return x.u; });
  }

  function draw() {
    shown = all.filter(function (u) { return inCat(u) && eslesir(u) && (!fb || inBand(u, fb)); });
    /* satılanlar listenin sonuna */
    shown = shown.filter(function (u) { return !satildi(u); }).concat(shown.filter(satildi));
    /* "Tümü"de kategoriler karışık gösterilir: her kategori listeye eşit aralıklarla dağıtılır, kategori içindeki sıra paneldeki gibi kalır */
    if (cur === 'Tümü') shown = karistir(shown.filter(function (u) { return !satildi(u); })).concat(karistir(shown.filter(satildi)));
    /* kodu birebir yazılan ürün en başa */
    if (ara) shown = shown.filter(tamKod).concat(shown.filter(function (u) { return !tamKod(u); }));
    var g = $('grid');
    g.innerHTML = shown.map(function (u, i) {
      var et = etiket(u), np = pics(u).length;
      var sold = satildi(u), ind = indirimde(u), yz = ind ? yuzde(u) : 0;
      var fv = isFav(u);
      return '<div class="cell reveal"><button type="button" class="fav' + (fv ? ' on' : '') + '" data-fav="' + i + '" aria-pressed="' + fv + '" aria-label="' + esc(u.ad || 'Ürün') + (fv ? ' beğenilerden çıkar' : ' beğen') + '">' + HEART + '</button>' +
        '<button type="button" class="tile' + (sold ? ' sold' : '') + (ind ? ' ind' : '') + '" data-i="' + i + '" aria-label="' + esc(u.ad || 'Ürün') + (sold ? ', satıldı' : '') + ' büyüt' + (np > 1 ? ', ' + np + ' fotoğraf' : '') + '">' +
        (np > 1 ? '<span class="multi" aria-hidden="true"><svg viewBox="0 0 16 16" width="12" height="12"><rect x="4.5" y="1.5" width="10" height="10" rx="1.5" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M1.5 4.5v9a1 1 0 0 0 1 1h9" fill="none" stroke="currentColor" stroke-width="1.4"/></svg>' + np + '</span>' : '') +
        (sold ? '<span class="soldtag" aria-hidden="true">Satıldı</span>' : '') +
        (ind ? '<span class="saletag" aria-hidden="true">' + (yz ? '%' + yz + ' İndirim' : 'İndirim') + '</span>' : '') +
        (onSip(u) && !ind ? '<span class="saletag pretag" aria-hidden="true">Ön sipariş</span>' : '') +
        '<img class="pre" src="' + esc(u.kucuk || u.gorsel) + '" alt="' + esc(u.ad || '') + '" loading="' + (i < 6 ? 'eager' : 'lazy') + '" decoding="async">' +
        ((u.ad || et || u.fiyat) ? '<span class="cap"><b>' + esc(u.ad || '') + '</b><span>' + esc(et) + (u.kod ? ' · ' + esc(u.kod) : '') + '</span>' +
          (gecerliFiyat(u) ? '<em class="p">' + (sold ? 'Satıldı' : fiyatHtml(u)) + '</em>' : onSip(u) ? '<em class="p pre-p">Ön sipariş</em>' : '') + '</span>' : '') + '</button></div>';
    }).join('');
    var cn = $('catnote'), cnOn = !ara && cur !== 'Tümü' && cur !== FAV && cur !== IND && shown.some(onSip);
    cn.hidden = !cnOn;
    if (cnOn) cn.textContent = 'Bu ürünler ön siparişle hazırlanır. Beğendiğin ürünü aç, "Ön sipariş başvurusu yap" ile formu doldur; ürünün hazır olunca seninle iletişime geçelim. Teslim elden yapılır.';
    $('empty').textContent = ara ? 'Aramanla eşleşen ürün bulunamadı.' : fb ? 'Bu fiyat aralığında ürün yok.' : 'Bu kategoride henüz ürün yok.';
    var sr = $('sres'); sr.hidden = !ara; sr.textContent = ara ? (shown.length ? shown.length + ' ürün bulundu' : '') : '';
    favBar();
    $('empty').hidden = shown.length > 0;
    Array.prototype.forEach.call(g.querySelectorAll('img'), function (im) {
      var ok = function () { im.classList.remove('pre'); };
      var bad = function () { var t = im.closest('.cell'); if (t) t.style.display = 'none'; };
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

  var araT = null;
  $('q').addEventListener('input', function () {
    var v = this.value;
    clearTimeout(araT);
    araT = setTimeout(function () {
      var yeni = sade(v.trim()).replace(/\s+/g, ' ');
      if (yeni && !ara) { cur = 'Tümü'; sub = ''; fb = ''; } /* aramaya başlayınca tüm ürünlerde ara */
      ara = yeni; araKod = kodAyikla(yeni);
      chips(); priceChips(); draw();
    }, 150);
  });
  $('q').addEventListener('keydown', function (e) { if (e.key === 'Escape' && this.value) { this.value = ''; this.dispatchEvent(new Event('input')); } });

  $('nav').addEventListener('click', function (e) {
    var b = e.target.closest('[data-c],[data-s],[data-f]'); if (!b) return;
    if (b.hasAttribute('data-c')) { cur = b.getAttribute('data-c'); sub = ''; }
    else if (b.hasAttribute('data-s')) sub = b.getAttribute('data-s');
    else fb = b.getAttribute('data-f');
    chips(); priceChips(); draw();
  });

  /* büyük görünüm */
  $('lbfav').addEventListener('click', function () { toggleFav(shown[idx], this); });
  var lb = $('lb'), idx = 0, pidx = 0;
  function show(i, p) {
    if (!shown.length) return;
    idx = (i + shown.length) % shown.length;
    var u = shown[idx], ps = pics(u), n = ps.length;
    if (u !== lbU) { lbU = u; urunBakildi(u); }
    pidx = p == null ? 0 : p < 0 ? n - 1 : Math.min(p, n - 1);
    var ph = ps[pidx];
    resetZoom();
    $('lbi').src = ph.g; $('lbi').alt = (u.ad || '') + (n > 1 ? ' – fotoğraf ' + (pidx + 1) : '');
    $('lbt').textContent = u.ad || ''; $('lbc').textContent = etiket(u) + (u.kod ? ' · Kod: ' + u.kod : '');
    setHeart($('lbfav'), isFav(u)); $('lbfav').classList.remove('pop');
    var sold = satildi(u);
    lb.classList.toggle('sold', sold);
    var yz = yuzde(u);
    $('lbf').innerHTML = sold ? 'Satıldı' : fiyatHtml(u) + (indirimde(u) && yz ? ' <span class="pct">%' + yz + ' İndirim</span>' : ''); $('lbf').hidden = !gecerliFiyat(u);
    var gl = $('lbg');
    gl.hidden = n < 2;
    gl.innerHTML = n < 2 ? '' : ps.map(function (q, j) {
      return '<button type="button" data-p="' + j + '" aria-label="Fotoğraf ' + (j + 1) + '"' + (j === pidx ? ' aria-current="true"' : '') + '><img src="' + esc(q.k) + '" alt=""></button>';
    }).join('');
    var d = $('lbd'); d.textContent = u.aciklama || ''; d.hidden = !u.aciklama;
    var ob = $('lbo'), os = onSip(u); ob.hidden = !os;
    var w = $('lbw'); w.hidden = !wa || os;
    if (wa && !os) {
      w.href = sold
        ? waLink('Merhaba, ' + marka + '\'daki "' + (u.ad || 'ürün') + '"' + (u.kod ? ' [' + u.kod + ']' : '') + ' satılmış. Benzeri var mı?\n' + new URL(ph.g, location.href).href)
        : waLink('Merhaba, ' + marka + '\'daki "' + (u.ad || 'ürün') + '"' + (u.kod ? ' [' + u.kod + ']' : '') + (gecerliFiyat(u) ? ' (' + (indirimde(u) ? 'indirimli ' : '') + gecerliFiyat(u) + ')' : '') + ' ürünüyle ilgileniyorum.\n' + new URL(ph.g, location.href).href);
      w.textContent = sold ? 'Benzerini sor' : gecerliFiyat(u) ? 'WhatsApp\'tan sipariş ver' : 'WhatsApp\'tan fiyat sor';
    }
    $('lbk').textContent = (idx + 1) + ' / ' + shown.length + (n > 1 ? ' · Fotoğraf ' + (pidx + 1) + ' / ' + n : '') + '\n' + zoomHint;
    var multi = shown.length > 1 || n > 1; $('lbp').hidden = !multi; $('lbn').hidden = !multi;
    var nxt = pidx < n - 1 ? ps[pidx + 1].g : pics(shown[(idx + 1) % shown.length])[0].g;
    var pre = new Image(); pre.src = nxt;
  }
  /* ileri/geri: önce ürünün fotoğrafları, sonra bir sonraki ürün */
  function step(d) {
    var n = pics(shown[idx]).length;
    if (d > 0) { if (pidx < n - 1) show(idx, pidx + 1); else show(idx + 1, 0); }
    else { if (pidx > 0) show(idx, pidx - 1); else show(idx - 1, -1); }
  }
  function open(i) {
    last = document.activeElement; show(i);
    lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); document.body.classList.add('lock'); $('lbx').focus();
  }
  function close() {
    lbU = null;
    if (favDirty) { favDirty = false; if (!favs.length && cur === FAV) cur = 'Tümü'; buildGroups(); chips(); priceChips(); draw(); }
    resetZoom();
    lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); document.body.classList.remove('lock');
    if (last && last.focus) last.focus();
  }
  $('grid').addEventListener('click', function (e) {
    var h = e.target.closest('[data-fav]');
    if (h) { toggleFav(shown[Number(h.getAttribute('data-fav'))], h); return; }
    var t = e.target.closest('.tile'); if (t) open(Number(t.getAttribute('data-i')));
  });

  /* kalp: beğen / beğenilerden çıkar */
  function setHeart(b, on, ad) {
    b.classList.toggle('on', on); b.setAttribute('aria-pressed', String(on));
    if (b.id === 'lbfav') b.lastChild.textContent = on ? ' Beğenildi' : ' Beğen';
    else b.setAttribute('aria-label', (ad || 'Ürün') + (on ? ' beğenilerden çıkar' : ' beğen'));
    if (on) { b.classList.remove('pop'); void b.offsetWidth; b.classList.add('pop'); }
  }
  var favDirty = false;
  function toggleFav(u, btn) {
    if (!u) return;
    var on = !isFav(u);
    if (on) favs.push(u.gorsel); else favs.splice(favs.indexOf(u.gorsel), 1);
    saveFavs(); bildir(u, on ? 1 : -1);
    buildGroups();
    if (cur === FAV && !on && btn && btn.id === 'lbfav') { favDirty = true; setHeart(btn, false); chips(); return; } /* liste büyük görünüm kapanınca yenilenir */
    if (cur === FAV && !on) {
      if (!favs.length) cur = 'Tümü';
      chips(); priceChips(); draw(); return;
    }
    if (btn) setHeart(btn, on, u.ad);
    var tb = btn && btn.id === 'lbfav' ? $('grid').querySelector('[data-fav="' + shown.indexOf(u) + '"]') : null;
    if (tb) setHeart(tb, on, u.ad);
    chips();
    favBar();
  }
  function favBar() {
    var b = $('favbar');
    if (cur !== FAV || !favs.length) { b.hidden = true; return; }
    b.hidden = false;
    var list = all.filter(isFav);
    $('favtxt').textContent = list.length + ' ürün beğendin. Listen bu tarayıcıda saklanır.';
    var w = $('favwa'); w.hidden = !wa;
    if (wa) w.href = waLink('Merhaba, ' + marka + '\'da beğendiğim ürünler:\n' + list.map(function (u) {
      return '• ' + (u.ad || 'Ürün') + (satildi(u) ? ' (satıldı)' : gecerliFiyat(u) ? ' – ' + gecerliFiyat(u) : '');
    }).join('\n'));
  }
  $('lbx').addEventListener('click', close);
  $('lbp').addEventListener('click', function () { step(-1); });
  $('lbg').addEventListener('click', function (e) { var b = e.target.closest('[data-p]'); if (b) show(idx, +b.getAttribute('data-p')); });
  $('lbn').addEventListener('click', function () { step(1); });
  lb.addEventListener('click', function (e) {
    if (noClick) { noClick = false; return; }
    if (e.target === lb || e.target.tagName === 'FIGURE') { if (Z.s > 1) zoomTo(1, 0, 0, true); else close(); }
  });
  document.addEventListener('keydown', function (e) {
    if (!lb.classList.contains('open') || osDlg.open) return;
    if (e.key === 'Escape') { if (Z.s > 1) zoomTo(1, 0, 0, true); else close(); }
    else if (e.key === 'ArrowLeft') step(-1); else if (e.key === 'ArrowRight') step(1);
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
      if (Z.s === 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) step(dx < 0 ? 1 : -1);
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

  /* ---------- Ön sipariş başvurusu: form WhatsApp mesajı olarak gönderilir ---------- */
  var osDlg = $('os'), osF = $('osf'), osU = null;
  $('lbo').addEventListener('click', function () {
    osU = shown[idx]; if (!osU) return;
    $('osurun').textContent = (osU.ad || 'Ürün') + (osU.kod ? ' · ' + osU.kod : '');
    $('osyz').hidden = !(osU.yuzuk || altOf(osU) === 'Yüzük');
    $('osok').hidden = true; osF.hidden = false;
    try { var k = JSON.parse(lsGet('mihra-onsiparis') || '{}'); ['ad', 'tel', 'ilce'].forEach(function (n) { if (k[n] && !osF.elements[n].value) osF.elements[n].value = k[n]; }); } catch (x) {}
    if (osDlg.showModal) osDlg.showModal(); else osDlg.setAttribute('open', '');
    osF.elements.ad.focus();
  });
  function osKapat() { if (osDlg.close) osDlg.close(); else osDlg.removeAttribute('open'); }
  $('osx').addEventListener('click', osKapat);
  $('osk').addEventListener('click', osKapat);
  osDlg.addEventListener('click', function (e) { if (e.target === osDlg) osKapat(); });
  osF.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!osU) return;
    var f = osF.elements, v = function (n) { return String(f[n].value || '').trim(); };
    lsSet('mihra-onsiparis', JSON.stringify({ ad: v('ad'), tel: v('tel'), ilce: v('ilce') }));
    var yz = !$('osyz').hidden;
    var satir = [
      'Merhaba, ' + marka + ' ön sipariş başvurusu:',
      'Ürün: ' + (osU.ad || 'Ürün') + (osU.kod ? ' [' + osU.kod + ']' : ''),
      'Ad Soyad: ' + v('ad'),
      'Telefon: ' + v('tel'),
      'İlçe / Semt: ' + v('ilce'),
      'Bebeğin yaşı: ' + v('yas')
    ];
    if (yz) satir.push('Yüzük ölçüsü: ' + v('olcu'));
    satir.push('Adet: ' + (v('adet') || '1'));
    if (v('not')) satir.push('Not: ' + v('not'));
    satir.push(new URL(osU.gorsel, location.href).href);
    var link = waLink(satir.join('\n'));
    var win = null; try { win = window.open(link, '_blank', 'noopener'); } catch (x) {}
    if (!win) location.href = link;
    osF.hidden = true; $('osok').hidden = false; $('osk').focus();
  });

  chips(); priceChips(); draw();
})();
