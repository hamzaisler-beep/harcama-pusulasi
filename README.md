# HarcamaPusulası v3 (yeni sürüm)

Eşlerin birlikte kullandığı kişisel finans uygulaması. Expo (React Native + Expo Router) ile tek koddan web, iOS ve Android.
Veriler kişiye değil **haneye** bağlı: davet koduyla katılan herkes aynı verileri anında görür.

Bu `v2` dalı sıfırdan yazılan yeni sürümdür. Eski sürüm `main` dalında duruyor ve canlıdaki site ondan yayınlanıyor.

## Durum

| Aşama | İçerik | Durum |
| --- | --- | --- |
| 1 · Temel | Giriş (e-posta, web'de Google), hane kurma, davet koduyla katılma, güvenlik kuralları | Hazır |
| 2 · Gelir ve gider | İşlem ekleme/düzenleme/silme, liste, arama, kişi filtresi, Ana Sayfa özeti, hane adı | Hazır |
| 3 · Bütçe ve raporlar | Aylık kategori limitleri, %80/aşım uyarıları, kategori/ay/kişi raporları | Hazır |
| 4 · Taksit, borç, abonelik, hesaplar, PDF ekstre | | |
| 5 · Mobil ve herkese açılış | EAS build, bildirimler, mağaza | |

## Çalıştırma

```bash
npm install
npm run web        # tarayıcıda açar
npm run typecheck  # tip kontrolü
npm test           # birim testleri (tutar, tarih, bütçe hesapları)
npm run build:e2e && python3 e2e/run.py   # sahte Firebase ile uçtan uca test
npm run build:web  # dist/ klasörüne web çıktısı
```

Firebase ayarları `.env` dosyasından (`.env.example`'a bak) ya da Vercel ortam değişkenlerinden okunur. Ayarlanmazsa eski sürümün Firebase projesi kullanılır.

## Firebase'de bir kez yapılacaklar

1. **Authentication > Sign-in method:** "E-posta/Şifre" ve "Google" açık olmalı.
2. **Authentication > Settings > Authorized domains:** Vercel adresi (örn. `harcama-pusulasi-v2.vercel.app`) eklenmeli; yoksa Google girişi çalışmaz.
3. **Firestore > Rules:** `firestore.rules` dosyasının tamamı yapıştırılıp yayınlanmalı. Eski sürümün kuralı da içinde, onu bozmaz.

## Veri yapısı

```
users/{uid}           → displayName, email, householdId, joinCode?
households/{hid}      → name, ownerId, members[], memberNames{uid: ad}, inviteCode
  /transactions/{id}  → type, amountKurus, categoryId, date, note, paymentMethod, createdBy
  /meta/budget        → limits{kategoriId: kuruş}
invites/{code}        → householdId
```

## Klasörler

```
app/            ekranlar (Expo Router: dosya adı = adres)
  giris.tsx     giriş / kayıt
  hane.tsx      hane kur / katıl
  (tabs)/       alt menülü ekranlar
  ayarlar.tsx   profil ve hane ayarları
src/
  lib/          firebase, giriş, hane işlemleri, biçimlendirme
  context/      oturum durumu (kullanıcı + profil + hane)
  components/   ortak arayüz parçaları
  theme.ts      renkler, yazı tipleri, boşluklar
firestore.rules güvenlik kuralları
```
