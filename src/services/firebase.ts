// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

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
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
