/* Mihra Store – beğeni sayacı (Google Apps Script)
   Bu kodu Google E-Tablolar > Uzantılar > Apps Script içine yapıştırıp
   "Dağıt > Yeni dağıtım > Web uygulaması" olarak yayınla.
   Erişim: "Herkes". Çıkan bağlantıyı yönetim panelindeki
   Site bilgileri > "Beğeni bağlantısı" kutusuna yapıştır.
   Yalnızca isimsiz sayım tutulur; kişisel bilgi kaydedilmez. */

var KAYIT = 'Kayıtlar', OZET = 'Özet';

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
    o.getRange('A1').setFormula("=QUERY('" + KAYIT + "'!B:E,\"select C, D, sum(E) where B is not null group by B, C, D order by sum(E) desc label C 'Ürün', D 'Kategori', sum(E) 'Beğeni'\",1)");
  }
  return k;
}

function kurulum() {
  sayfalar_();
  Logger.log('Kurulum tamam. Tablo: ' + tablo_().getUrl());
}

function doPost(e) {
  var lock = LockService.getScriptLock();
  lock.tryLock(10000);
  try {
    var d = JSON.parse(e.postData.contents || '{}');
    var g = String(d.g || '').slice(0, 300);
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
  return ContentService.createTextOutput(JSON.stringify({ sayim: say, guncel: new Date().toISOString() }))
    .setMimeType(ContentService.MimeType.JSON);
}
