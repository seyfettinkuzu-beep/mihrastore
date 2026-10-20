# Mihra Store · Showroom sitesi

## İlk kurulum
1. GitHub'da bir repo aç (örn. `showroom`), bu klasörün **içindekileri** yükle (klasörün kendisini değil).
2. Settings → Pages → Branch: `main` / `(root)` → Save. Site birkaç dakika içinde `https://KULLANICI.github.io/showroom/` adresinde açılır.

## Ürünleri yönetmek (yönetici paneli)
Panel adresi: `https://KULLANICI.github.io/showroom/admin.html`

Panelden şunları yapabilirsin:
- Yeni ürün eklemek (fotoğraf seç, ad, grup, alt kategori, fiyat yaz). Fotoğraf otomatik küçültülür, önizleme görseli de otomatik hazırlanır.
- Fiyat eklemek ya da değiştirmek. `1250` yazman yeterli, `1.250 ₺` olarak düzeltilir. Fiyat kutusunda Enter'a basınca bir sonraki ürünün fiyat kutusuna geçer.
- Ürün adını, grubunu, alt kategorisini değiştirmek; fotoğrafını değiştirmek (küçük resme tıkla).
- Ürünü silmek (silince "Geri al" çıkar) ya da silmeden **Gizle**mek (örn. stokta yoksa).
- Sırayı ↑ ↓ ile değiştirmek. Listedeki ilk ürünün fotoğrafı, link paylaşıldığında önizleme görseli olur.
- Marka adı, slogan, açıklama ve WhatsApp numarasını değiştirmek ("Site bilgileri").

### Bir kerelik: GitHub bağlantısı
Panelin "GitHub bağlantısı" bölümüne kullanıcı adını, repo adını ve bir token gir. Token'ın nasıl alınacağı panelde adım adım yazıyor (Contents: Read and write izni yeterli). Bağlandıktan sonra **Kaydet** her şeyi doğrudan siteye yükler; site 1–2 dakika içinde güncellenir.

Token yalnızca senin tarayıcında saklanır. Panel sayfasını herkes açabilir ama token olmadan hiçbir şeyi değiştiremez.

Bağlantı kurmadan da panel çalışır: o zaman Kaydet, `products.js` dosyasını (ve yeni fotoğrafları) indirir; bunları GitHub'a elle yüklersin.

## Elle düzenlemek istersen
Tüm içerik `products.js` dosyasında. Her ürün bir satır:

```
{ gorsel: "images/foto.jpg", kucuk: "images/foto-k.jpg", ad: "Ürün adı", grup: "Kolye", kategori: "İnci", fiyat: "1.250 ₺" }
```

- `grup`: üstteki ana kategori (Kolye, Bileklik, Çocuk…).
- `kategori`: isteğe bağlı alt kategori. Bir grupta en az iki farklı alt kategori varsa sitede ikinci bir süzgeç satırı çıkar.
- `gizli: true` eklersen ürün sitede görünmez.
- Dosya adlarında Türkçe karakter ve boşluk kullanma.
