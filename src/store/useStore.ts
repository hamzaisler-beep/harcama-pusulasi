import { useState, useEffect, useCallback } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Transaction, Saving } from "../types";
import { syncTransactionToCloud, subscribeToFamilyTransactions } from "../services/SharedTransactionService";
import { getUserFamily } from "../services/familyService";

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

let _transactions: Transaction[] = [];
let _familyTransactions: any[] = [];
let _savings: Saving[] = [];
let _familyId: string | null = null;
let _listeners: (() => void)[] = [];

function notify() {
  _listeners.forEach((fn) => fn());
}

async function loadAll() {
  try {
    const storage = getStorage();
    if (!storage) return;

    const txRaw = await storage.getItem(TX_KEY);
    const svRaw = await storage.getItem(SV_KEY);
    _transactions = txRaw ? JSON.parse(txRaw) : [];
    _savings = svRaw ? JSON.parse(svRaw) : [];
    
    notify();
  } catch (e) {
    console.error("Store load error", e);
  }
}

async function saveTx() {
  const storage = getStorage();
  if (storage) {
    await storage.setItem(TX_KEY, JSON.stringify(_transactions));
  }
}
async function saveSv() {
  const storage = getStorage();
  if (storage) {
    await storage.setItem(SV_KEY, JSON.stringify(_savings));
  }
}

loadAll();

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
      
      // Cloud sync if in family
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
    _transactions = _transactions.filter((t) => t.id !== id);
    saveTx();
    notify();
  }, []);

  const clearAll = useCallback(async () => {
    _transactions = [];
    await saveTx();
    notify();
  }, []);

  return {
    transactions: _transactions,
    addTransaction,
    addTransactionsBulk,
    deleteTransaction,
    clearAll,
  };
}

export function useFamilyTransactions() {
  const [, setTick] = useState(0);

  const init = useCallback(async () => {
    if (!_familyId) {
      const family = await getUserFamily();
      if (family) {
        _familyId = family.id;
        
        // SYNC LOCAL ONCE
        _transactions.forEach(tx => syncTransactionToCloud(tx, family.id));

        subscribeToFamilyTransactions(family.id, (txs) => {
          _familyTransactions = txs;
          notify();
        });
      }
    }
  }, []);

  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    _listeners.push(fn);

    init();

    return () => {
      _listeners = _listeners.filter((l) => l !== fn);
    };
  }, [init]);

  return {
    familyId: _familyId,
    familyTransactions: _familyTransactions,
  };
}

export function useSavings() {
  const [, setTick] = useState(0);

  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    _listeners.push(fn);
    return () => {
      _listeners = _listeners.filter((l) => l !== fn);
    };
  }, []);

  const addSaving = useCallback((s: Omit<Saving, "id" | "createdAt">) => {
    const newSv: Saving = {
      ...s,
      id: Date.now().toString(36),
      createdAt: new Date().toISOString(),
    };
    _savings = [newSv, ..._savings];
    saveSv();
    notify();
  }, []);

  const deleteSaving = useCallback((id: string) => {
    _savings = _savings.filter((s) => s.id !== id);
    saveSv();
    notify();
  }, []);

  return {
    savings: _savings,
    addSaving,
    deleteSaving,
  };
}
