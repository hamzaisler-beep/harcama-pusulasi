import { initializeApp, getApps, getApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyCIL0ApkltTk93KEWJsglCF4P7mqPzM1x4",
  authDomain: "studio-7493381372-419d9.firebaseapp.com",
  projectId: "studio-7493381372-419d9",
  storageBucket: "studio-7493381372-419d9.firebasestorage.app",
  messagingSenderId: "83073158884",
  appId: "1:83073158884:web:c606dbb5a6711066c8e6f1",
};

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);