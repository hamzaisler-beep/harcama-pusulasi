// src/services/SharedTransactionService.ts
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  Timestamp,
  doc,
  setDoc,
  deleteDoc
} from "firebase/firestore";
import { db, auth } from "./firebase";
import { Transaction, Account, Saving, Budget } from "../types";

// TRANSACTIONS
export const syncTransactionToCloud = async (tx: Transaction, familyId: string) => {
  if (!familyId) return;
  try {
    const docRef = doc(db, "transactions", tx.id);
    await setDoc(docRef, {
      ...tx,
      familyId,
      userId: auth.currentUser?.uid,
      userName: auth.currentUser?.displayName || "Aile Üyesi",
      uploadedAt: Timestamp.now(),
    }, { merge: true });
  } catch (error) {
    console.error("Transaction cloud sync error", error);
  }
};

export const subscribeToFamilyTransactions = (familyId: string, callback: (txs: Transaction[]) => void) => {
  if (!familyId) return () => {};
  // REMOVED orderBy to avoid Firebase Index requirement. Sorting is done on client.
  const q = query(
    collection(db, "transactions"),
    where("familyId", "==", familyId)
  );
  return onSnapshot(q, (snapshot) => {
    const txs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Transaction);
    // Client-side sort: Newest first
    txs.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    callback(txs.slice(0, 500));
  });
};

// ACCOUNTS
export const syncAccountToCloud = async (acc: Account, familyId: string) => {
  if (!familyId) return;
  try {
    const docRef = doc(db, "accounts", acc.id);
    await setDoc(docRef, { ...acc, familyId, updatedAt: Timestamp.now() }, { merge: true });
  } catch (error) { console.error("Account cloud sync error", error); }
};

export const subscribeToFamilyAccounts = (familyId: string, callback: (accs: Account[]) => void) => {
  if (!familyId) return () => {};
  const q = query(collection(db, "accounts"), where("familyId", "==", familyId));
  return onSnapshot(q, (snapshot) => {
    const accs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Account);
    callback(accs);
  });
};

// SAVINGS
export const syncSavingToCloud = async (sav: Saving, familyId: string) => {
  if (!familyId) return;
  try {
    const docRef = doc(db, "savings", sav.id);
    await setDoc(docRef, { ...sav, familyId, updatedAt: Timestamp.now() }, { merge: true });
  } catch (error) { console.error("Saving cloud sync error", error); }
};

export const subscribeToFamilySavings = (familyId: string, callback: (savs: Saving[]) => void) => {
  if (!familyId) return () => {};
  // REMOVED orderBy to avoid Firebase Index requirement.
  const q = query(collection(db, "savings"), where("familyId", "==", familyId));
  return onSnapshot(q, (snapshot) => {
    const savs = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Saving);
    savs.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    callback(savs);
  });
};

// BUDGETS
export const syncBudgetToCloud = async (bud: Budget, familyId: string) => {
  if (!familyId) return;
  try {
    const docRef = doc(db, "budgets", bud.id);
    await setDoc(docRef, { ...bud, familyId, updatedAt: Timestamp.now() }, { merge: true });
  } catch (error) { console.error("Budget cloud sync error", error); }
};

export const subscribeToFamilyBudgets = (familyId: string, callback: (buds: Budget[]) => void) => {
  if (!familyId) return () => {};
  const q = query(collection(db, "budgets"), where("familyId", "==", familyId));
  return onSnapshot(q, (snapshot) => {
    const buds = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }) as Budget);
    callback(buds);
  });
};

// DELETE HELPERS
export const deleteCloudDoc = async (col: string, id: string) => {
  try { await deleteDoc(doc(db, col, id)); } catch (e) { console.error("Delete error", col, id, e); }
};
