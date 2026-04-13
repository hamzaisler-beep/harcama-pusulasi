import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Transaction, Saving, Account, Budget } from "../types";
import { syncTransactionToCloud, subscribeToFamilyTransactions } from "../services/SharedTransactionService";
import { getUserFamily } from "../services/familyService";
import { auth } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Safe storage helper for Web/Native compatibility
const getStorage = () => {
  try {
    if (typeof AsyncStorage !== "undefined" && AsyncStorage && AsyncStorage.getItem) {
      return AsyncStorage;
    }
  } catch (e) {}
  if (typeof window !== "undefined" && window.localStorage) {
    return window.localStorage;
  }
  return null;
};

const TX_KEY = "hp_transactions";
const SV_KEY = "hp_savings";
const AC_KEY = "hp_accounts";
const BD_KEY = "hp_budgets";

// Global Store State
let _transactions: Transaction[] = [];
let _familyTransactions: any[] = [];
let _savings: Saving[] = [];
let _accounts: Account[] = [];
let _budgets: Budget[] = [];
let _familyId: string | null = null;
let _listeners: (() => void)[] = [];
let _isSynced = false;

function notify() {
  _listeners.forEach((fn) => fn());
}

async function loadAll() {
  try {
    const storage = getStorage();
    if (!storage) return;

    const txRaw = await storage.getItem(TX_KEY);
    const svRaw = await storage.getItem(SV_KEY);
    const acRaw = await storage.getItem(AC_KEY);
    const bdRaw = await storage.getItem(BD_KEY);

    _transactions = txRaw ? JSON.parse(txRaw) : [];
    _savings = svRaw ? JSON.parse(svRaw) : [];
    _accounts = acRaw ? JSON.parse(acRaw) : [];
    _budgets = bdRaw ? JSON.parse(bdRaw) : [];
    
    // Default data if empty (for demo feel)
    if (_accounts.length === 0) {
        _accounts = [
            { id: "acc1", name: "Nakit", type: "CASH", balance: 1200, color: "#22c55e" },
            { id: "acc2", name: "Banka", type: "BANK", balance: 45000, color: "#3b82f6" },
            { id: "acc3", name: "Kredi Kartı", type: "CARD", balance: -5400, color: "#f43f5e" },
        ];
    }

    notify();
  } catch (e) {
    console.error("Store load error", e);
  }
}

async function saveTx() {
  const storage = getStorage();
  if (storage) await storage.setItem(TX_KEY, JSON.stringify(_transactions));
}
async function saveAc() {
  const storage = getStorage();
  if (storage) await storage.setItem(AC_KEY, JSON.stringify(_accounts));
}
async function saveSv() {
  const storage = getStorage();
  if (storage) await storage.setItem(SV_KEY, JSON.stringify(_savings));
}
async function saveBd() {
  const storage = getStorage();
  if (storage) await storage.setItem(BD_KEY, JSON.stringify(_budgets));
}

// Initial storage load
loadAll();

/**
 * Global Synchronization Logic
 * Runs when auth state changes to ensure data is fetched from cloud
 */
const startGlobalSync = () => {
    onAuthStateChanged(auth, async (user) => {
        if (user && !_isSynced) {
            console.log("Global Sync Started for user:", user.uid);
            try {
                const family = await getUserFamily();
                if (family) {
                    _familyId = family.id;
                    console.log("Syncing with familyId:", _familyId);
                    
                    // Sync local to cloud once
                    _transactions.forEach(tx => syncTransactionToCloud(tx, family.id));

                    // Subscribe to real-time updates
                    subscribeToFamilyTransactions(family.id, (txs) => {
                        console.log("Cloud data received:", txs.length, "items");
                        _familyTransactions = txs;
                        // PRIMARY FIX: Update both lists so Dashboard and Transactions show data
                        _transactions = txs;
                        _isSynced = true;
                        saveTx();
                        notify();
                    });
                }
            } catch (err) {
                console.error("Global Sync Error", err);
            }
        } else if (!user) {
            _isSynced = false;
            _familyId = null;
            _familyTransactions = [];
        }
    });
};

// Start sync process
startGlobalSync();

export function useTransactions() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    _listeners.push(fn);
    return () => {
      _listeners = _listeners.filter((l) => l !== fn);
    };
  }, []);

  const addTransaction = useCallback(
    (t: Omit<Transaction, "id" | "isManualEntry">, isManual = true): boolean => {
      const dup = _transactions.some(
        (ex) =>
          ex.date === t.date &&
          ex.description.trim().toLowerCase() === t.description.trim().toLowerCase() &&
          ex.amount === t.amount
      );
      if (dup) return false;
      const newTx: Transaction = {
        ...t,
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        isManualEntry: isManual,
      };
      _transactions = [newTx, ..._transactions];
      saveTx();
      
      if (t.accountId) {
          const acc = _accounts.find(a => a.id === t.accountId);
          if (acc) {
              acc.balance += (t.type === "income" ? t.amount : -t.amount);
              saveAc();
          }
      }

      if (_familyId) {
        syncTransactionToCloud(newTx, _familyId);
      }
      
      notify();
      return true;
    },
    []
  );

  const addTransactionsBulk = useCallback(
    (txs: Omit<Transaction, "id" | "isManualEntry">[]): number => {
      let count = 0;
      txs.forEach((t) => {
        if (addTransaction(t, false)) count++;
      });
      return count;
    },
    [addTransaction]
  );

  const deleteTransaction = useCallback((id: string) => {
    const tx = _transactions.find(t => t.id === id);
    if (tx && tx.accountId) {
        const acc = _accounts.find(a => a.id === tx.accountId);
        if (acc) {
            acc.balance -= (tx.type === "income" ? tx.amount : -tx.amount);
            saveAc();
        }
    }
    _transactions = _transactions.filter((t) => t.id !== id);
    saveTx();
    notify();
  }, []);

  return {
    transactions: _transactions,
    addTransaction,
    addTransactionsBulk,
    deleteTransaction,
    clearAll: async () => { _transactions = []; await saveTx(); notify(); }
  };
}

export function useAccounts() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter((l) => l !== fn); };
  }, []);

  const addAccount = useCallback((a: Omit<Account, "id">) => {
    _accounts = [..._accounts, { ...a, id: Date.now().toString(36) }];
    saveAc();
    notify();
  }, []);

  const deleteAccount = useCallback((id: string) => {
    _accounts = _accounts.filter(a => a.id !== id);
    saveAc();
    notify();
  }, []);

  return { accounts: _accounts, addAccount, deleteAccount };
}

export function useBudgets() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter((l) => l !== fn); };
  }, []);

  const setBudget = useCallback((b: Omit<Budget, "id">) => {
    const idx = _budgets.findIndex(x => x.category === b.category);
    if (idx > -1) _budgets[idx] = { ...b, id: _budgets[idx].id };
    else _budgets = [..._budgets, { ...b, id: Date.now().toString(36) }];
    saveBd();
    notify();
  }, []);

  return { budgets: _budgets, setBudget };
}

export function useSavings() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter((l) => l !== fn); };
  }, []);

  const addSaving = useCallback((s: Omit<Saving, "id" | "createdAt">) => {
    _savings = [{ ...s, id: Date.now().toString(36), createdAt: new Date().toISOString() }, ..._savings];
    saveSv();
    notify();
  }, []);

  const deleteSaving = useCallback((id: string) => {
    _savings = _savings.filter((s) => s.id !== id);
    saveSv();
    notify();
  }, []);

  return { savings: _savings, addSaving, deleteSaving };
}

export function useFamilyTransactions() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter((l) => l !== fn); };
  }, []);

  return {
    familyId: _familyId,
    familyTransactions: _familyTransactions,
  };
}
