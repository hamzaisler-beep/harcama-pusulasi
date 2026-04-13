import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Transaction, Saving, Account, Budget } from "../types";
import { syncTransactionToCloud, subscribeToFamilyTransactions } from "../services/SharedTransactionService";
import { getUserFamily } from "../services/familyService";
import { auth } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Safe storage helper
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

// GLOBAL STATE - EVERYTHING POINTS TO THE FAMILY CLOUD POOL
let _transactions: Transaction[] = []; 
let _savings: Saving[] = [];
let _accounts: Account[] = [];
let _budgets: Budget[] = [];
let _familyId: string | null = null;
let _listeners: (() => void)[] = [];
let _isSubscribed = false;

function notify() {
  _listeners.forEach((fn) => fn());
}

async function loadLocalMeta() {
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

async function saveLocalMeta() {
  const storage = getStorage();
  if (storage) {
    await storage.setItem(SV_KEY, JSON.stringify(_savings));
    await storage.setItem(AC_KEY, JSON.stringify(_accounts));
    await storage.setItem(BD_KEY, JSON.stringify(_budgets));
  }
}

// THE CENTRAL SYNC ENGINE
onAuthStateChanged(auth, async (user) => {
    if (user) {
        console.log("Auth stabilized, initiating cloud sync...");
        const family = await getUserFamily();
        if (family && !_isSubscribed) {
            _familyId = family.id;
            _isSubscribed = true;
            
            // Overwrite EVERYTHING with Family Cloud Data
            subscribeToFamilyTransactions(family.id, (cloudTxs) => {
                console.log("Cloud Pool Sync:", cloudTxs.length, "transactions found.");
                _transactions = cloudTxs.filter(t => t.userName !== "Ayşe (Test)");
                notify();
                
                // Keep a local copy for offline view
                const storage = getStorage();
                if (storage) storage.setItem(TX_KEY, JSON.stringify(_transactions));
            });
        }
    } else {
        _isSubscribed = false;
        _familyId = null;
        _transactions = [];
        notify();
    }
});

loadLocalMeta();

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
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2,4);
      const newTx = { ...t, id, isManualEntry: isManual };
      
      // OPTIMISTIC UPDATE
      _transactions = [newTx, ..._transactions];
      notify();

      // PUSH TO CLOUD POOL IMMEDIATELY
      if (_familyId) {
          syncTransactionToCloud(newTx, _familyId);
      } else {
          // If not in family, still save locally
          const storage = getStorage();
          if (storage) storage.setItem(TX_KEY, JSON.stringify(_transactions));
      }
      return true;
    },
    addTransactionsBulk: (txs: any[]) => {
      txs.forEach(t => {
        const id = Date.now().toString(36) + Math.random().toString(36).slice(2,4);
        const newTx = { ...t, id, isManualEntry: false };
        if (_familyId) syncTransactionToCloud(newTx, _familyId);
      });
      return txs.length;
    },
    deleteTransaction: (id: string) => {
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
  return { accounts: _accounts, addAccount: (a:any)=>{_accounts=[..._accounts, {...a, id:Date.now().toString(36)}]; saveLocalMeta(); notify();}, deleteAccount: (id:string)=>{_accounts=_accounts.filter(a=>a.id!==id); saveLocalMeta(); notify();} };
}

export function useBudgets() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter((l) => l !== fn); };
  }, []);
  return { budgets: _budgets, setBudget: (b:any)=>{const idx=_budgets.findIndex(x=>x.category===b.category); if(idx>-1)_budgets[idx]={...b, id:_budgets[idx].id}; else _budgets=[..._budgets, {...b, id:Date.now().toString(36)}]; saveLocalMeta(); notify();} };
}

export function useSavings() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter((l) => l !== fn); };
  }, []);
  return { savings: _savings, addSaving: (s:any)=>{_savings=[{...s, id:Date.now().toString(36), createdAt:new Date().toISOString()}, ..._savings]; saveLocalMeta(); notify();}, deleteSaving: (id:string)=>{_savings=_savings.filter(s=>s.id!==id); saveLocalMeta(); notify();}};
}

export function useFamilyTransactions() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter((l) => l !== fn); };
  }, []);
  return { familyId: _familyId, familyTransactions: _transactions }; // Using common pool
}
