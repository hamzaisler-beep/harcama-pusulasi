// src/services/SharedTransactionService.ts
import { 
  collection, 
  addDoc, 
  query, 
  where, 
  getDocs, 
  onSnapshot, 
  orderBy,
  limit,
  Timestamp,
  doc,
  setDoc,
  deleteDoc
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { Transaction } from "../types";

export const syncTransactionToCloud = async (tx: Transaction, familyId: string) => {
  if (!familyId) return;
  try {
    // Use local ID as Firestore document ID to prevent duplicates
    const docRef = doc(db, "transactions", tx.id);
    await setDoc(docRef, {
      ...tx,
      familyId,
      userId: auth.currentUser?.uid,
      userName: auth.currentUser?.displayName || "Aile Üyesi",
      uploadedAt: Timestamp.now(),
    }, { merge: true });
  } catch (error) {
    console.error("Cloud sync error", error);
  }
};

export const subscribeToFamilyTransactions = (familyId: string, callback: (txs: any[]) => void) => {
  if (!familyId) return () => {};

  const q = query(
    collection(db, "transactions"),
    where("familyId", "==", familyId),
    orderBy("date", "desc"),
    limit(200)
  );

  return onSnapshot(q, (snapshot) => {
    const txs = snapshot.docs.map(doc => ({
      ...doc.data(),
      id: doc.id, // Using Firestore ID
      cloudId: doc.id
    }));
    callback(txs);
  }, (err) => {
    console.error("Family subscription error", err);
  });
};
