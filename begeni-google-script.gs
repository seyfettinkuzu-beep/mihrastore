/* Mihra Store – beğeni ve ziyaretçi sayacı (Google Apps Script)
   Bu kodu Google E-Tablolar > Uzantılar > Apps Script içine yapıştırıp
   "Dağıt > Yeni dağıtım > Web uygulaması" olarak yayınla.
   Erişim: "Herkes". Çıkan bağlantıyı yönetim panelindeki
   Site bilgileri > "Beğeni bağlantısı" kutusuna yapıştır.
   Yalnızca isimsiz sayım tutulur; kişisel bilgi kaydedilmez. */

var KAYIT = 'Kayıtlar', OZET = 'Özet', ZIYARET = 'Ziyaretler', TZ = 'Europe/Istanbul';

/* Tabloya bağlı açıldıysa o tabloyu, script.google.com'dan ayrı proje olarak açıldıysa
   ilk çalıştırmada "Mihra Beğeniler" adında yeni bir tablo oluşturup onu kullanır. */
function tablo_() {
  var a = SpreadsheetApp.getActiveSpreadsheet();
  if (a) return a;
  var p = PropertiesService.getScriptProperties(), id = p.getProperty('TABLO');
  if (id) { try { return SpreadsheetApp.openById(id); } catch (x) {} }
  var s = SpreadsheetApp.create('Mihra Beğeniler');
  p.setProperty('TABLO', s.getId());
  return s;
}

function sayfalar_() {
  var ss = tablo_();
  var k = ss.getSheetByName(KAYIT);
  if (!k) {
    k = ss.insertSheet(KAYIT);
    k.appendRow(['Tarih', 'Fotoğraf', 'Ürün', 'Kategori', 'Değişim']);
    k.setFrozenRows(1);
  }
  if (!ss.getSheetByName(OZET)) {
    var o = ss.insertSheet(OZET, 0);
    o.getRange('A1').setFormula("=QUERY('" + KAYIT + "'!C:E,\"select C, D, sum(E) where C <> '' group by C, D order by sum(E) desc label C 'Ürün', D 'Kategori', sum(E) 'Beğeni'\",1)");
  }
  return k;
}

function ziyaretSayfasi_() {
  var ss = tablo_(), z = ss.getSheetByName(ZIYARET);
  if (!z) {
    z = ss.insertSheet(ZIYARET);
    z.appendRow(['Tarih', 'Gün', 'Tür', 'Fotoğraf', 'Ürün']);
    z.setFrozenRows(1);
  }
  return z;
}

function kurulum() {
  sayfalar_();
  ziyaretSayfasi_();
  Logger.log('Kurulum tamam. Tablo: ' + tablo_().getUrl());
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var d = JSON.parse(e.postData.contents || '{}');
    var g = String(d.g || '').slice(0, 300);
    if (d.t === 'site' || d.t === 'urun') {
      if (d.t === 'urun' && !/^images\/[\w\-.]+$/.test(g)) return ContentService.createTextOutput('no');
      var now = new Date();
      ziyaretSayfasi_().appendRow([now, Utilities.formatDate(now, TZ, 'yyyy-MM-dd'), d.t, d.t === 'urun' ? g : '', d.t === 'urun' ? String(d.ad || '').slice(0, 120) : '']);
      return ContentService.createTextOutput('ok');
    }
    var v = Number(d.v) === -1 ? -1 : 1;
    if (!/^images\/[\w\-.]+$/.test(g)) return ContentService.createTextOutput('no');
    sayfalar_().appendRow([new Date(), g, String(d.ad || '').slice(0, 120), String(d.grup || '').slice(0, 60), v]);
    return ContentService.createTextOutput('ok');
  } finally {
    lock.releaseLock();
  }
}

function doGet() {
  var k = sayfalar_(), son = k.getLastRow(), say = {};
  if (son > 1) {
    k.getRange(2, 2, son - 1, 4).getValues().forEach(function (r) {
      if (r[0]) say[r[0]] = (say[r[0]] || 0) + Number(r[3] || 0);
    });
  }
  Object.keys(say).forEach(function (g) { if (say[g] < 0) say[g] = 0; });
  /* ziyaretler: son 60 günün günlük site ziyaretçisi ve son 30 günde en çok açılan ürünler */
  var z = ziyaretSayfasi_(), zs = z.getLastRow(), gunler = {}, urunler = {};
  var sinir60 = Utilities.formatDate(new Date(Date.now() - 60 * 864e5), TZ, 'yyyy-MM-dd');
  var sinir30 = Utilities.formatDate(new Date(Date.now() - 30 * 864e5), TZ, 'yyyy-MM-dd');
  if (zs > 1) {
    z.getRange(2, 2, zs - 1, 3).getValues().forEach(function (r) {
      var gun = r[0] instanceof Date ? Utilities.formatDate(r[0], TZ, 'yyyy-MM-dd') : String(r[0]);
      if (r[1] === 'site' && gun >= sinir60) gunler[gun] = (gunler[gun] || 0) + 1;
      else if (r[1] === 'urun' && r[2] && gun >= sinir30) urunler[r[2]] = (urunler[r[2]] || 0) + 1;
    });
  }
  return ContentService.createTextOutput(JSON.stringify({ sayim: say, ziyaret: { gunler: gunler, urunler: urunler, bugun: Utilities.formatDate(new Date(), TZ, 'yyyy-MM-dd') }, guncel: new Date().toISOString() }))
    .setMimeType(ContentService.MimeType.JSON);
}
