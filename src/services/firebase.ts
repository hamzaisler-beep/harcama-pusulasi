// src/services/firebase.ts
import { Platform } from "react-native";
import { initializeApp } from "firebase/app";
import { Auth, getAuth, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Yapılandırma öncelikle ortam değişkenlerinden (Vercel / .env) okunur.
// Ayarlanmadıysa mevcut projeye ait değerlere geri döner; böylece
// yerel geliştirme .env olmadan da çalışmaya devam eder.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyCIL0ApkltTk93KEWJsglCF4P7mqPzM1x4",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "studio-7493381372-419d9.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "studio-7493381372-419d9",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "studio-7493381372-419d9.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "83073158884",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:83073158884:web:c606dbb5a6711066c8e6f1",
};

const app = initializeApp(firebaseConfig);

// Auth başlatma:
// - Web'de getAuth (tarayıcı yerel kalıcılığı otomatik).
// - Native'de AsyncStorage ile initializeAuth → oturum uygulama kapansa
//   bile korunur. getReactNativePersistence yalnızca Metro'nun react-native
//   girişinde bulunduğu için dinamik require ile alınır ve web'i etkilemez.
let authInstance: Auth;
if (Platform.OS === "web") {
  authInstance = getAuth(app);
} else {
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getReactNativePersistence } = require("firebase/auth");
    authInstance = initializeAuth(app, {
      persistence: getReactNativePersistence(AsyncStorage),
    });
  } catch {
    // Beklenmedik bir durumda (ör. persistence bulunamazsa) yine de çalış.
    authInstance = getAuth(app);
  }
}

export const auth = authInstance;
export const db = getFirestore(app);
export const storage = (() => {
  const { getStorage } = require("firebase/storage");
  return getStorage(app);
})();
export default app;
