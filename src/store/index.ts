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
import { Transaction, Account, Saving, Budget, Investment } from "../theme/constants";

class GlobalStore {
  transactions: Transaction[] = [];
  accounts: Account[] = [];
  savings: Saving[] = [];
  investments: Investment[] = [];
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
    this.investments = [];
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

    // Investments Sync
    const qInv = query(collection(db, "investments"), where("familyId", "==", id));
    this.unsubs.push(onSnapshot(qInv, snap => {
        this.investments = snap.docs.map(d => ({...d.data(), id: d.id}) as Investment);
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

  async addInvestment(inv: Omit<Investment, "id">) {
    const id = Date.now().toString(36) + Math.random().toString(36).substring(2, 5);
    const docRef = doc(db, "investments", id);
    await setDoc(docRef, { ...inv, id, familyId: this.familyId });
  }

  async updateInvestment(id: string, inv: Partial<Investment>) {
    const docRef = doc(db, "investments", id);
    await setDoc(docRef, inv, { merge: true });
  }

  async deleteInvestment(id: string) {
    await deleteDoc(doc(db, "investments", id));
  }
}

export const store = new GlobalStore();
