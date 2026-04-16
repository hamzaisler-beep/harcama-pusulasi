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

// THE CENTRAL SYNC ENGINE
async function initCloudSync(user: any) {
    if (!user) {
        _unsubs.forEach(u => u());
        _unsubs = [];
        _isSubscribed = false;
        _familyId = null;
        _transactions = [];
        _savings = [];
        _accounts = [];
        _budgets = [];
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
            
            // TRANSACTIONS
            _unsubs.push(subscribeToFamilyTransactions(family.id, (txs) => {
                _transactions = txs;
                notify();
            }));

            // ACCOUNTS
            _unsubs.push(subscribeToFamilyAccounts(family.id, (accs) => {
                if (accs.length > 0) {
                    _accounts = accs;
                    notify();
                }
            }));

            // SAVINGS
            _unsubs.push(subscribeToFamilySavings(family.id, (savs) => {
                _savings = savs;
                notify();
            }));

            // BUDGETS
            _unsubs.push(subscribeToFamilyBudgets(family.id, (buds) => {
                _budgets = buds;
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
       deleteCloudDoc("transactions", id);
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
      if (_familyId) syncAccountToCloud(newAcc, _familyId);
      else { _accounts = [..._accounts, newAcc]; notify(); }
    }, 
    deleteAccount: (id:string)=>{
      if (_familyId) deleteCloudDoc("accounts", id);
      else { _accounts = _accounts.filter(a=>a.id!==id); notify(); }
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
      if (_familyId) syncBudgetToCloud(newBud, _familyId);
      else {
          const idx=_budgets.findIndex(x=>x.category===b.category); 
          if(idx>-1) _budgets[idx]=newBud; 
          else _budgets=[..._budgets, newBud]; 
          notify();
      }
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
      if (_familyId) syncSavingToCloud(newSav, _familyId);
      else { _savings = [newSav, ..._savings]; notify(); }
    }, 
    deleteSaving: (id:string)=>{
      if (_familyId) deleteCloudDoc("savings", id);
      else { _savings = _savings.filter(s=>s.id!==id); notify(); }
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
