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
4. **Environment Variables** bölümüne `.env` dosyanızdaki tüm değişkenleri ekleyin (EXPO_PUBLIC_ ile başlayanlar).

## ✨ Özellikler
- **Premium Dashboard**: SVG tabanlı animasyonlu grafikler.
- **İşlemler**: Tarih aralığı filtreli, Excel/CSV ekstre yükleme destekli.
- **Yatırımlar**: Portföy dağılımı ve performans takibi.
- **Faturalar**: Dinamik işlem takipli fatura yönetim paneli.
- **Firebase Sync**: Tüm verileriniz bulutta güvende.

## 🛠️ Yerel Geliştirme
```bash
npm install
npm run web
```
