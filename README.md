# 💰 Harcama Pusulası — React Native

Kişisel finans takip uygulaması. Expo ile iOS ve Android'de çalışır.

## Ekranlar

| Ekran | Özellikler |
|---|---|
| **Dashboard** | Bakiye kartı, 7 günlük grafik, kategori özeti, son işlemler |
| **İşlemler** | Arama, filtre (gelir/gider), silme |
| **İşlem Ekle** | Miktar, açıklama, tarih, kategori, gelir/gider tipi |
| **Birikimler** | Altın (gr), USD, EUR takibi — demo kurlarla TL hesabı |
| **Raporlar** | AI analizi, kategori dağılımı, öneriler |

## Kurulum

### 1. Node.js ve Expo CLI kurulumu

```bash
npm install -g expo-cli
```

### 2. Bağımlılıkları yükle

```bash
cd HarcamaPusulasi
npm install
```

### 3. Uygulamayı başlat

```bash
npx expo start
```

Terminalde QR kodu çıkacak:
- **iOS**: Kamera ile QR kodu tara → Expo Go'da açılır
- **Android**: Expo Go uygulamasından QR kodu tara
- **Emülatör**: `i` (iOS) veya `a` (Android) tuşuna bas

### 4. Expo Go İndir

- iOS: [App Store](https://apps.apple.com/app/expo-go/id982107779)
- Android: [Google Play](https://play.google.com/store/apps/details?id=host.exp.exponent)

## Gerçek AI Analizi Eklemek

`ReportsScreen.tsx` içindeki `generateInsights` fonksiyonunu Anthropic API ile değiştir:

```typescript
import Anthropic from "@anthropic-ai/sdk";

const client = new Anthropic({ apiKey: "sk-ant-..." });

const response = await client.messages.create({
  model: "claude-sonnet-4-20250514",
  max_tokens: 1024,
  messages: [{
    role: "user",
    content: `Bu işlemleri analiz et: ${JSON.stringify(transactions)}`
  }]
});
```

## Proje Yapısı

```
HarcamaPusulasi/
├── App.tsx                          # Giriş noktası
├── src/
│   ├── types.ts                     # Tipler, sabitler, renkler
│   ├── utils/format.ts              # Para formatı, tarih yardımcıları
│   ├── store/useStore.ts            # AsyncStorage veri katmanı
│   ├── navigation/AppNavigator.tsx  # Tab + Stack navigatör
│   └── screens/
│       ├── DashboardScreen.tsx      # Ana sayfa
│       ├── TransactionsScreen.tsx   # İşlem listesi
│       ├── AddTransactionScreen.tsx # İşlem ekleme formu
│       ├── SavingsScreen.tsx        # Birikimler
│       └── ReportsScreen.tsx        # Raporlar + AI analiz
└── package.json
```

## Teknolojiler

- **React Native** + **Expo** — cross-platform mobil
- **React Navigation** — tab ve stack navigasyon
- **AsyncStorage** — cihazda kalıcı veri
- **react-native-chart-kit** — grafik
- **@expo/vector-icons** — ikonlar (Material Icons)
- **TypeScript** — tip güvenliği
