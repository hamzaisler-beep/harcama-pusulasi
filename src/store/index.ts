// src/store/index.ts
// Basit gözlemci (observer) desenli global veri deposu.
// Firestore koleksiyonlarını canlı dinler ve değişimlerde abonelere haber verir.
import {
  onSnapshot,
  collection,
  query,
  where,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  writeBatch,
  Timestamp,
} from "firebase/firestore";
import { db, auth } from "../services/firebase";
import {
  Transaction,
  Account,
  Saving,
  Budget,
  Investment,
  Goal,
  Debt,
} from "../theme/constants";

const byDateDesc = (a: { date?: string }, b: { date?: string }) =>
  new Date(b.date || 0).getTime() - new Date(a.date || 0).getTime();
const byCreatedDesc = (a: { createdAt?: string }, b: { createdAt?: string }) =>
  new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime();

class GlobalStore {
  transactions: Transaction[] = [];
  accounts: Account[] = [];
  savings: Saving[] = [];
  investments: Investment[] = [];
  budgets: Budget[] = [];
  goals: Goal[] = [];
  debts: Debt[] = [];

  familyId: string | null = null;
  ready = false;

  listeners: Set<() => void> = new Set();
  unsubs: (() => void)[] = [];

  constructor() {
    this.init();
  }

  async init() {
    auth.onAuthStateChanged(async (user) => {
      this.stopSync();
      if (user) {
        this.startSync(`personal_${user.uid}`);
      } else {
        this.clearData();
      }
    });
  }

  notify() {
    this.listeners.forEach((fn) => fn());
  }

  clearData() {
    this.transactions = [];
    this.accounts = [];
    this.savings = [];
    this.investments = [];
    this.budgets = [];
    this.goals = [];
    this.debts = [];
    this.familyId = null;
    this.ready = false;
    this.notify();
  }

  stopSync() {
    this.unsubs.forEach((u) => u());
    this.unsubs = [];
  }

  /** Bir koleksiyonu familyId'ye göre canlı dinler. */
  private sync<T>(
    name: string,
    id: string,
    assign: (rows: T[]) => void,
    sortFn?: (a: any, b: any) => number
  ) {
    const q = query(collection(db, name), where("familyId", "==", id));
    const unsub = onSnapshot(
      q,
      (snap) => {
        let rows = snap.docs.map((d) => ({ ...d.data(), id: d.id })) as T[];
        if (sortFn) rows = rows.sort(sortFn);
        assign(rows);
        this.notify();
      },
      (err) => {
        console.warn(`[store] "${name}" senkron hatası:`, err?.message || err);
      }
    );
    this.unsubs.push(unsub);
  }

  startSync(id: string) {
    this.familyId = id;
    this.ready = true;

    this.sync<Transaction>("transactions", id, (r) => (this.transactions = r), byDateDesc);
    this.sync<Account>("accounts", id, (r) => (this.accounts = r));
    this.sync<Saving>("savings", id, (r) => (this.savings = r), byCreatedDesc);
    this.sync<Investment>("investments", id, (r) => (this.investments = r));
    this.sync<Budget>("budgets", id, (r) => (this.budgets = r), byCreatedDesc);
    this.sync<Goal>("goals", id, (r) => (this.goals = r), byCreatedDesc);
    this.sync<Debt>("debts", id, (r) => (this.debts = r), byCreatedDesc);
  }

  // --- Genel yardımcılar ---
  private newId() {
    return Date.now().toString(36) + Math.random().toString(36).substring(2, 6);
  }

  private async create(coll: string, data: any) {
    const id = this.newId();
    await setDoc(doc(db, coll, id), {
      ...data,
      id,
      familyId: this.familyId,
      createdAt: data.createdAt || new Date().toISOString(),
    });
    return id;
  }

  private async patch(coll: string, id: string, data: any) {
    await setDoc(doc(db, coll, id), data, { merge: true });
  }

  private async remove(coll: string, id: string) {
    await deleteDoc(doc(db, coll, id));
  }

  // --- İşlemler ---
  async addTransaction(tx: Omit<Transaction, "id">) {
    const id = this.newId();
    await setDoc(doc(db, "transactions", id), {
      ...tx,
      id,
      familyId: this.familyId,
      createdAt: Timestamp.now(),
    });
    return id;
  }
  deleteTransaction(id: string) {
    return this.remove("transactions", id);
  }

  // --- Hesaplar ---
  addAccount(a: Omit<Account, "id">) {
    return this.create("accounts", a);
  }
  updateAccount(id: string, a: Partial<Account>) {
    return this.patch("accounts", id, a);
  }
  deleteAccount(id: string) {
    return this.remove("accounts", id);
  }

  // --- Bütçeler ---
  addBudget(b: Omit<Budget, "id">) {
    return this.create("budgets", b);
  }
  updateBudget(id: string, b: Partial<Budget>) {
    return this.patch("budgets", id, b);
  }
  deleteBudget(id: string) {
    return this.remove("budgets", id);
  }

  // --- Hedefler ---
  addGoal(g: Omit<Goal, "id" | "createdAt"> & { createdAt?: string }) {
    return this.create("goals", g);
  }
  updateGoal(id: string, g: Partial<Goal>) {
    return this.patch("goals", id, g);
  }
  deleteGoal(id: string) {
    return this.remove("goals", id);
  }

  // --- Borç / Alacak ---
  addDebt(d: Omit<Debt, "id" | "createdAt"> & { createdAt?: string }) {
    return this.create("debts", d);
  }
  updateDebt(id: string, d: Partial<Debt>) {
    return this.patch("debts", id, d);
  }
  deleteDebt(id: string) {
    return this.remove("debts", id);
  }

  // --- Tüm kullanıcı verisini sil ---
  async deleteAllUserData() {
    if (!this.familyId) return;
    const colls = ["transactions", "accounts", "savings", "investments", "budgets", "goals", "debts"];
    const CHUNK = 490;
    let pending: ReturnType<typeof doc>[] = [];

    const flush = async () => {
      if (pending.length === 0) return;
      const batch = writeBatch(db);
      pending.forEach((ref) => batch.delete(ref));
      await batch.commit();
      pending = [];
    };

    for (const coll of colls) {
      const q = query(collection(db, coll), where("familyId", "==", this.familyId));
      const snap = await getDocs(q);
      for (const d of snap.docs) {
        pending.push(d.ref as any);
        if (pending.length >= CHUNK) await flush();
      }
    }
    await flush();
  }

  // --- Yatırımlar ---
  async addInvestment(inv: Omit<Investment, "id">) {
    const id = this.newId();
    await setDoc(doc(db, "investments", id), {
      ...inv,
      id,
      familyId: this.familyId,
    });
    return id;
  }
  updateInvestment(id: string, inv: Partial<Investment>) {
    return this.patch("investments", id, inv);
  }
  deleteInvestment(id: string) {
    return this.remove("investments", id);
  }
}

export const store = new GlobalStore();
