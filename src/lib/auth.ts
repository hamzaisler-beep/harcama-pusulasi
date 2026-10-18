import { Platform } from "react-native";
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut as fbSignOut,
  updateProfile,
} from "firebase/auth";
import { FirebaseError } from "firebase/app";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import type { User } from "firebase/auth";
import { auth, db } from "./firebase";
import { displayNameOf } from "./household";

/** Google ile giriş şimdilik sadece web'de (mobil için 5. aşamada eklenecek). */
export const googleSignInAvailable = Platform.OS === "web";

/** İlk girişte users/{uid} kaydını oluşturur; varsa dokunmaz. */
export async function ensureUserDoc(user: User): Promise<void> {
  const ref = doc(db, "users", user.uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;
  await setDoc(ref, {
    displayName: displayNameOf(user),
    email: user.email,
    householdId: null,
    createdAt: serverTimestamp(),
  });
}

export async function signInWithEmail(email: string, password: string): Promise<void> {
  await signInWithEmailAndPassword(auth, email.trim(), password);
}

export async function signUpWithEmail(name: string, email: string, password: string): Promise<void> {
  const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const displayName = name.trim();
  if (displayName) {
    await updateProfile(cred.user, { displayName });
  }
  // Oturum dinleyicisi kaydı isimden önce oluşturmuş olabilir; ismi her durumda yaz.
  await setDoc(
    doc(db, "users", cred.user.uid),
    { displayName: displayNameOf(cred.user), email: cred.user.email },
    { merge: true },
  );
}

export async function signInWithGoogle(): Promise<void> {
  const provider = new GoogleAuthProvider();
  provider.setCustomParameters({ prompt: "select_account" });
  await signInWithPopup(auth, provider);
}

export async function signOut(): Promise<void> {
  await fbSignOut(auth);
}

/** Firebase hata kodlarını kullanıcıya gösterilecek Türkçe mesaja çevirir. */
export function friendlyError(err: unknown): string {
  if (err instanceof FirebaseError) {
    switch (err.code) {
      case "auth/invalid-email":
        return "E-posta adresi geçersiz.";
      case "auth/missing-password":
        return "Şifreyi gir.";
      case "auth/weak-password":
        return "Şifre en az 6 karakter olmalı.";
      case "auth/email-already-in-use":
        return "Bu e-posta ile zaten bir hesap var. Giriş yapmayı dene.";
      case "auth/invalid-credential":
      case "auth/wrong-password":
      case "auth/user-not-found":
        return "E-posta ya da şifre hatalı.";
      case "auth/too-many-requests":
        return "Çok fazla deneme yapıldı. Biraz bekleyip tekrar dene.";
      case "auth/popup-closed-by-user":
      case "auth/cancelled-popup-request":
        return "Google girişi iptal edildi.";
      case "auth/popup-blocked":
        return "Tarayıcı açılır pencereyi engelledi. İzin verip tekrar dene.";
      case "auth/operation-not-allowed":
        return "Bu giriş yöntemi Firebase'de kapalı. Firebase Console > Authentication'dan açılmalı.";
      case "auth/unauthorized-domain":
        return "Bu site adresi Firebase'de yetkili değil. Firebase Console > Authentication > Settings > Authorized domains'e eklenmeli.";
      case "auth/network-request-failed":
        return "İnternet bağlantısı yok gibi görünüyor.";
      case "permission-denied":
        return "Bu işlem için yetki yok. Firestore güvenlik kuralları güncel mi?";
      default:
        return `Bir hata oluştu (${err.code}).`;
    }
  }
  if (err instanceof Error) return err.message;
  return "Bilinmeyen bir hata oluştu.";
}
