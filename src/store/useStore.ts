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
let _transactions: Transaction[] = []; // This will be our primary source of truth (synced with cloud)
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

async function loadLocalOnly() {
  try {
    const storage = getStorage();
    if (!storage) return;
    const svRaw = await storage.getItem(SV_KEY);
    const acRaw = await storage.getItem(AC_KEY);
    const bdRaw = await storage.getItem(BD_KEY);
    _savings = svRaw ? JSON.parse(svRaw) : [];
    _accounts = acRaw ? JSON.parse(acRaw) : [];
    _budgets = bdRaw ? JSON.parse(bdRaw) : [];
    
    if (_accounts.length === 0) {
        _accounts = [
            { id: "acc1", name: "Nakit", type: "CASH", balance: 1200, color: "#22c55e" },
            { id: "acc2", name: "Banka", type: "BANK", balance: 45000, color: "#3b82f6" },
            { id: "acc3", name: "Kredi Kartı", type: "CARD", balance: -5400, color: "#f43f5e" },
        ];
    }
    notify();
  } catch (e) {}
}

async function saveLocalOnly() {
  const storage = getStorage();
  if (storage) {
    await storage.setItem(SV_KEY, JSON.stringify(_savings));
    await storage.setItem(AC_KEY, JSON.stringify(_accounts));
    await storage.setItem(BD_KEY, JSON.stringify(_budgets));
  }
}

async function saveTransactionsLocally(txs: Transaction[]) {
    const storage = getStorage();
    if (storage) await storage.setItem(TX_KEY, JSON.stringify(txs));
}

// Initial storage load for non-synced items
loadLocalOnly();

/**
 * HEART OF SYNC: Ensures data is identical on all platforms
 */
onAuthStateChanged(auth, async (user) => {
    if (user) {
        try {
            const family = await getUserFamily();
            if (family) {
                _familyId = family.id;
                // Listen to cloud as source of truth
                subscribeToFamilyTransactions(family.id, (cloudTxs) => {
                    // Filter out "Ayşe (Test)" data if it somehow comes through
                    const realTxs = cloudTxs.filter(t => t.userName !== "Ayşe (Test)");
                    
                    _transactions = realTxs;
                    _familyTransactions = realTxs;
                    _isSynced = true;
                    
                    saveTransactionsLocally(realTxs);
                    notify();
                });
            }
        } catch (err) {
            console.error("Sync Critical Error:", err);
        }
    } else {
        _isSynced = false;
        _familyId = null;
        _transactions = [];
        notify();
    }
});

export function useTransactions() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter((l) => l !== fn); };
  }, []);

  return {
    transactions: _transactions,
    addTransaction: (t: any, isManual = true) => {
      const id = Date.now().toString(36);
      const newTx = { ...t, id, isManualEntry: isManual };
      _transactions = [newTx, ..._transactions];
      if (_familyId) syncTransactionToCloud(newTx, _familyId);
      notify();
      return true;
    },
    addTransactionsBulk: (txs: any[]) => {
      txs.forEach(t => {
        const id = Date.now().toString(36) + Math.random();
        const newTx = { ...t, id, isManualEntry: false };
        if (_familyId) syncTransactionToCloud(newTx, _familyId);
      });
      return txs.length;
    },
    deleteTransaction: (id: string) => {
       // Cloud sync service would need a delete method, but for now we filter local and it re-syncs
       _transactions = _transactions.filter(t => t.id !== id);
       notify();
    },
    clearAll: async () => { _transactions = []; notify(); }
  };
}

export function useAccounts() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter((l) => l !== fn); };
  }, []);
  return { 
    accounts: _accounts, 
    addAccount: (a: any) => { _accounts = [..._accounts, { ...a, id: Date.now().toString(36) }]; saveLocalOnly(); notify(); },
    deleteAccount: (id: string) => { _accounts = _accounts.filter(a => a.id !== id); saveLocalOnly(); notify(); }
  };
}

export function useBudgets() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter((l) => l !== fn); };
  }, []);
  return { 
    budgets: _budgets, 
    setBudget: (b: any) => { 
        const idx = _budgets.findIndex(x => x.category === b.category);
        if (idx > -1) _budgets[idx] = { ...b, id: _budgets[idx].id };
        else _budgets = [..._budgets, { ...b, id: Date.now().toString(36) }];
        saveLocalOnly(); notify(); 
    } 
  };
}

export function useSavings() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter((l) => l !== fn); };
  }, []);
  return { 
    savings: _savings, 
    addSaving: (s: any) => { _savings = [{ ...s, id: Date.now().toString(36), createdAt: new Date().toISOString() }, ..._savings]; saveLocalOnly(); notify(); },
    deleteSaving: (id: string) => { _savings = _savings.filter((s) => s.id !== id); saveLocalOnly(); notify(); }
  };
}

export function useFamilyTransactions() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter((l) => l !== fn); };
  }, []);
  return { familyId: _familyId, familyTransactions: _familyTransactions };
}
