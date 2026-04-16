// src/services/firebase.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCIL0ApkltTk93KEWJsglCF4P7mqPzM1x4",
  authDomain: "studio-7493381372-419d9.firebaseapp.com",
  projectId: "studio-7493381372-419d9",
  storageBucket: "studio-7493381372-419d9.firebasestorage.app",
  messagingSenderId: "83073158884",
  appId: "1:83073158884:web:c606dbb5a6711066c8e6f1"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;
