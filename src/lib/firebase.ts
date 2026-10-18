import { Platform } from "react-native";
import { initializeApp, getApps, getApp } from "firebase/app";
import { Auth, getAuth, initializeAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import AsyncStorage from "@react-native-async-storage/async-storage";

// Değerler önce ortam değişkenlerinden (Vercel / .env) okunur.
// Ayarlanmamışsa eski sürümün kullandığı Firebase projesine düşer.
// Bunlar Firebase'in herkese açık web ayarlarıdır (gizli anahtar değildir);
// asıl koruma firestore.rules dosyasındaki kurallardır.
const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyCIL0ApkltTk93KEWJsglCF4P7mqPzM1x4",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "studio-7493381372-419d9.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "studio-7493381372-419d9",
  storageBucket:
    process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "studio-7493381372-419d9.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "83073158884",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:83073158884:web:c606dbb5a6711066c8e6f1",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

function createAuth(): Auth {
  if (Platform.OS === "web") return getAuth(app);
  try {
    // getReactNativePersistence yalnızca React Native paketinde var; web'i etkilememesi için require.
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const { getReactNativePersistence } = require("firebase/auth");
    return initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });
  } catch {
    return getAuth(app);
  }
}

export const auth = createAuth();
export const db = getFirestore(app);
