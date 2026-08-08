# Harcama Pusulası v2.0 - Premium Finansal Dashboard

Modern, karanlık temalı ve yüksek performanslı finansal yönetim uygulaması. Expo (React Native Web) ile geliştirilmiştir.

## 🚀 Canlı Yayın (Deployment) Adımları

Bu projeyi **Vercel** üzerinden yayına almak için aşağıdaki adımları takip edebilirsiniz:

### 1. GitHub'a Yükleme
Öncelikle projenizi GitHub'a gönderin:

```bash
git init
git add .
git commit -m "feat: premium dashboard v2.0 update"
# GitHub'tan yeni bir repo oluşturun ve aşağıdaki satırı kendi linkinizle değiştirin
git remote add origin https://github.com/KULLANICI_ADINIZ/HarcamaPusulasi.git
git push -u origin main
```

### 2. Vercel Bağlantısı
1. [Vercel](https://vercel.com) hesabınıza gidin.
2. **"New Project"** butonuna tıklayın ve GitHub deponuzu seçin.
3. **Build & Output Settings** kısmının şu şekilde olduğundan emin olun (Otomatik gelmeli):
   - **Build Command:** `npx expo export -p web`
   - **Output Directory:** `dist`
4. **Environment Variables** bölümüne aşağıdaki Firebase değişkenlerini ekleyin (opsiyonel — ayarlanmazsa kod içindeki varsayılan projeye düşer):

```
EXPO_PUBLIC_FIREBASE_API_KEY=...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=...
EXPO_PUBLIC_FIREBASE_PROJECT_ID=...
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=...
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=...
EXPO_PUBLIC_FIREBASE_APP_ID=...
```

## ✨ Özellikler
- **Dashboard**: Gerçek verilere dayalı SVG grafikler — son 6 ay gelir/gider, kategori dağılımı, bu ayki bütçe durumu, birikim özeti.
- **İşlemler**: Tarih aralığı filtreli, Excel/CSV ekstre yükleme destekli.
- **Hesaplar**: Nakit/banka/kart bakiyeleri, toplam varlık, ekle-düzenle-sil.
- **Bütçe**: Kategori limitleri, harcama karşılaştırması.
- **Faturalar**: Dinamik işlem takipli fatura yönetim paneli.
- **Yatırımlar**: Portföy dağılımı ve performans takibi.
- **Hedefler**: Birikim hedefleri ve ilerleme takibi.
- **Borç / Alacak**: Verecek/alacak kayıtları, kapatma ve net durum.
- **Döviz & Kur**: Canlı kurlar (open.er-api.com) ve para birimi çevirici.
- **Vergi**: KDV ve gelir vergisi hesaplayıcıları.
- **Raporlar**: İşlem geçmişine dayalı trend ve kategori analizi.
- **Firebase Sync**: Tüm verileriniz bulutta, gerçek zamanlı senkron.
- **Responsive**: Masaüstünde sabit kenar menü, mobilde kayan drawer navigasyon.

## 📱 Mobil Uygulama (iOS & Android)

Uygulama Expo/React Native ile yazıldığı için web'in yanı sıra gerçek bir mobil uygulama olarak da çalışır.

### Hızlı test — Expo Go
Telefonunuza **Expo Go** uygulamasını kurun, ardından:
```bash
npm install
npm start          # QR kod çıkar; Expo Go ile taratın
# veya
npm run android    # bağlı Android cihaz/emülatör
npm run ios        # macOS + iOS simülatör
```

### Kurulabilir uygulama (APK / App Store) — EAS Build
Bağımsız `.apk`/`.aab` veya mağaza derlemesi için [EAS Build](https://docs.expo.dev/build/introduction/) kullanılır (ücretsiz Expo hesabı yeterlidir):
```bash
npm install -g eas-cli
eas login
eas build:configure

# Android — doğrudan kurulabilen APK
npm run build:android      # eas build -p android --profile preview

# iOS — TestFlight/App Store (Apple Developer hesabı gerekir)
npm run build:ios
```
Derleme profilleri `eas.json` içindedir: `preview` (kurulabilir APK), `production` (Play Store AAB / App Store).

> **Not:** Uygulama kimliği `com.harcamapusulasi.app` (hem Android package hem iOS bundle). Kendi mağaza hesabınız için `app.json` içinden değiştirebilirsiniz. Firebase Authentication çalışması için Firebase konsolunda bu paket adını/SHA'yı ekleyin.

## 🛠️ Yerel Geliştirme
```bash
npm install
npm run web        # web'de çalıştır
npx tsc --noEmit   # tip kontrolü
npm run build:web  # üretim web derlemesi (dist/)
npm run doctor     # proje sağlık kontrolü (expo-doctor)
```

## 📁 Proje Yapısı
```
src/
  components/   Sidebar (paylaşılan navigasyon)
  hooks/        useStore (reaktif store aboneliği)
  navigation/   RootNavigator (auth yönlendirmesi)
  screens/      Tüm ekranlar
  services/     firebase.ts (env tabanlı config)
  store/        Firestore canlı senkron + CRUD
  theme/        Renkler ve tipler
  utils/        format.ts (para/ikon yardımcıları)
```
