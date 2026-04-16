// src/store/index.ts
import { createContext, useContext } from "react";
// We will use a simple observer pattern for the store
import { 
  onSnapshot, 
  collection, 
  query, 
  where, 
  doc, 
  setDoc, 
  deleteDoc,
  Timestamp 
} from "firebase/firestore";
import { db, auth } from "../services/firebase";
import { Transaction, Account, Saving, Budget } from "../theme/constants";

class GlobalStore {
  transactions: Transaction[] = [];
  accounts: Account[] = [];
  savings: Saving[] = [];
  budgets: Budget[] = [];
  familyId: string | null = null;
  listeners: Set<() => void> = new Set();
  unsubs: (() => void)[] = [];

  constructor() {
    this.init();
  }

  async init() {
    auth.onAuthStateChanged(async (user) => {
      this.stopSync();
      if (user) {
         // Determine space ID (Personal by default)
         // For now, we use personal_${uid} as the pool
         const personalId = `personal_${user.uid}`;
         this.startSync(personalId);
      } else {
         this.clearData();
      }
    });
  }

  notify() {
    this.listeners.forEach(fn => fn());
  }

  clearData() {
    this.transactions = [];
    this.accounts = [];
    this.savings = [];
    this.budgets = [];
    this.familyId = null;
    this.notify();
  }

  stopSync() {
    this.unsubs.forEach(u => u());
    this.unsubs = [];
  }

  startSync(id: string) {
    this.familyId = id;
    
    // Transactions Sync
    const qTx = query(collection(db, "transactions"), where("familyId", "==", id));
    this.unsubs.push(onSnapshot(qTx, snap => {
        this.transactions = snap.docs.map(d => ({...d.data(), id: d.id}) as Transaction)
            .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        this.notify();
    }));

    // Accounts Sync
    const qAcc = query(collection(db, "accounts"), where("familyId", "==", id));
    this.unsubs.push(onSnapshot(qAcc, snap => {
        this.accounts = snap.docs.map(d => ({...d.data(), id: d.id}) as Account);
        this.notify();
    }));

    // Savings Sync
    const qSav = query(collection(db, "savings"), where("familyId", "==", id));
    this.unsubs.push(onSnapshot(qSav, snap => {
        this.savings = snap.docs.map(d => ({...d.data(), id: d.id}) as Saving)
            .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        this.notify();
    }));
  }

  // ACTIONS
  async addTransaction(tx: Omit<Transaction, "id">) {
    const id = Date.now().toString(36);
    const docRef = doc(db, "transactions", id);
    await setDoc(docRef, { ...tx, id, familyId: this.familyId, createdAt: Timestamp.now() });
  }

  async deleteTransaction(id: string) {
    await deleteDoc(doc(db, "transactions", id));
  }
}

export const store = new GlobalStore();
