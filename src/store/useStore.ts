// src/store/useStore.ts
import { useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Transaction, Saving, Account, Budget } from "../types";
import { 
  syncTransactionToCloud, 
  subscribeToFamilyTransactions,
  syncAccountToCloud,
  subscribeToFamilyAccounts,
  syncSavingToCloud,
  subscribeToFamilySavings,
  syncBudgetToCloud,
  subscribeToFamilyBudgets,
  deleteCloudDoc
} from "../services/SharedTransactionService";
import { getUserFamily } from "../services/familyService";
import { auth } from "../services/firebase";
import { onAuthStateChanged } from "firebase/auth";

// Safe storage helper
const getStorage = () => {
  try {
    if (typeof AsyncStorage !== "undefined" && AsyncStorage && typeof AsyncStorage.getItem === 'function') {
      return AsyncStorage;
    }
  } catch (e) {}
  if (typeof window !== "undefined" && window.localStorage) {
    return {
      getItem: (key: string) => Promise.resolve(window.localStorage.getItem(key)),
      setItem: (key: string, val: string) => Promise.resolve(window.localStorage.setItem(key, val)),
      removeItem: (key: string) => Promise.resolve(window.localStorage.removeItem(key)),
    };
  }
  return null;
};

const TX_KEY = "hp_transactions";
const SV_KEY = "hp_savings";
const AC_KEY = "hp_accounts";
const BD_KEY = "hp_budgets";

// GLOBAL STATE
let _transactions: Transaction[] = []; 
let _savings: Saving[] = [];
let _accounts: Account[] = [];
let _budgets: Budget[] = [];
let _familyId: string | null = null;
let _listeners: (() => void)[] = [];
let _isSubscribed = false;
let _unsubs: (() => void)[] = [];

function notify() {
  _listeners.forEach((fn) => fn());
}

async function loadLocalMeta() {
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
    
    if (_accounts.length === 0) {
        _accounts = [
            { id: "acc1", name: "Nakit", type: "CASH", balance: 1200, color: "#22c55e" },
            { id: "acc2", name: "Banka", type: "BANK", balance: 45000, color: "#3b82f6" },
        ];
    }
    notify();
  } catch (e) {}
}

// THE CENTRAL SYNC ENGINE
async function initCloudSync(user: any) {
    if (!user) {
        _unsubs.forEach(u => u());
        _unsubs = [];
        _isSubscribed = false;
        _familyId = null;
        notify();
        return;
    }

    try {
        const family = await getUserFamily();
        if (family && (!_isSubscribed || _familyId !== family.id)) {
            _unsubs.forEach(u => u());
            _unsubs = [];
            _familyId = family.id;
            _isSubscribed = true;
            
            _unsubs.push(subscribeToFamilyTransactions(family.id, (txs) => {
                _transactions = txs;
                const storage = getStorage();
                if (storage) storage.setItem(TX_KEY, JSON.stringify(_transactions));
                notify();
            }));

            _unsubs.push(subscribeToFamilyAccounts(family.id, (accs) => {
                if (accs.length > 0) {
                    _accounts = accs;
                    const storage = getStorage();
                    if (storage) storage.setItem(AC_KEY, JSON.stringify(_accounts));
                    notify();
                }
            }));
            
            _unsubs.push(subscribeToFamilySavings(family.id, (savs) => {
                _savings = savs;
                const storage = getStorage();
                if (storage) storage.setItem(SV_KEY, JSON.stringify(_savings));
                notify();
            }));

            _unsubs.push(subscribeToFamilyBudgets(family.id, (buds) => {
                _budgets = buds;
                const storage = getStorage();
                if (storage) storage.setItem(BD_KEY, JSON.stringify(_budgets));
                notify();
            }));
        }
    } catch (e) {
        console.error("Cloud sync init error", e);
    }
}

onAuthStateChanged(auth, (user) => {
    initCloudSync(user);
});

loadLocalMeta();

export function useTransactions() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    _listeners.push(fn);
    if (auth.currentUser && !_isSubscribed) initCloudSync(auth.currentUser);
    return () => { _listeners = _listeners.filter((l) => l !== fn); };
  }, []);

  return {
    transactions: _transactions,
    addTransaction: (t: any, isManual = true) => {
      const id = Date.now().toString(36) + Math.random().toString(36).slice(2,4);
      const newTx = { ...t, id, isManualEntry: isManual };
      _transactions = [newTx, ..._transactions];
      notify();
      if (_familyId) syncTransactionToCloud(newTx, _familyId);
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
       if (_familyId) deleteCloudDoc("transactions", id);
    },
    clearAll: async () => { _transactions.forEach(t => deleteCloudDoc("transactions", t.id)); }
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
    addAccount: (a:any)=>{
      const newAcc = {...a, id: a.id || Date.now().toString(36)};
      _accounts = [..._accounts, newAcc];
      notify();
      if (_familyId) syncAccountToCloud(newAcc, _familyId);
    }, 
    deleteAccount: (id:string)=>{
      _accounts = _accounts.filter(a=>a.id!==id);
      notify();
      if (_familyId) deleteCloudDoc("accounts", id);
    } 
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
    setBudget: (b:any)=>{
      const id = b.id || Date.now().toString(36);
      const newBud = {...b, id};
      const idx=_budgets.findIndex(x=>x.category===b.category); 
      if(idx>-1) _budgets[idx]=newBud; 
      else _budgets=[..._budgets, newBud]; 
      notify();
      if (_familyId) syncBudgetToCloud(newBud, _familyId);
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
    addSaving: (s:any)=>{
      const newSav = {...s, id: Date.now().toString(36), createdAt: new Date().toISOString()};
      _savings = [newSav, ..._savings];
      notify();
      if (_familyId) syncSavingToCloud(newSav, _familyId);
    }, 
    deleteSaving: (id:string)=>{
      _savings = _savings.filter(s=>s.id!==id);
      notify();
      if (_familyId) deleteCloudDoc("savings", id);
    }
  };
}

export function useFamilyTransactions() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    _listeners.push(fn);
    return () => { _listeners = _listeners.filter((l) => l !== fn); };
  }, []);
  return { familyId: _familyId, familyTransactions: _transactions }; 
}
