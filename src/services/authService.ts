// src/services/authService.ts
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  sendPasswordResetEmail,
  confirmPasswordReset,
  updateProfile,
  User
} from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export const login = (email: string, pass: string) => {
  return signInWithEmailAndPassword(auth, email, pass);
};

export const resetPassword = (email: string) => {
  return sendPasswordResetEmail(auth, email);
};

export const completePasswordReset = (code: string, newPass: string) => {
  return confirmPasswordReset(auth, code, newPass);
};

export const register = async (name: string, email: string, pass: string) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, pass);
  await updateProfile(userCredential.user, { displayName: name });
  
  // Initialize user document in Firestore
  await setDoc(doc(db, "users", userCredential.user.uid), {
    name: name,
    email: email,
    createdAt: new Date().toISOString()
  });

  return userCredential;
};

export const logout = () => {
  return signOut(auth);
};

export const subscribeToAuthChanges = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};
