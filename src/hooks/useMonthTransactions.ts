import { useEffect, useMemo, useState } from "react";
import { Timestamp, collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { monthRange } from "../lib/money";
import type { TxLite } from "../lib/budgetMath";
import type { Transaction } from "../types";

interface Result {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

/** [start, end) aralığındaki işlemleri canlı dinler (eşin eklediği kayıt anında gelir). Yeniden eskiye sıralı. */
export function useRangeTransactions(householdId: string, start: Date, end: Date): Result {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const startMs = start.getTime();
  const endMs = end.getTime();

  useEffect(() => {
    setLoading(true);
    setError(null);
    const q = query(
      collection(db, "households", householdId, "transactions"),
      where("date", ">=", Timestamp.fromMillis(startMs)),
      where("date", "<", Timestamp.fromMillis(endMs)),
      orderBy("date", "desc"),
    );
    return onSnapshot(
      q,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }) as Transaction);
        // Aynı gün içinde son eklenen üstte.
        rows.sort((a, b) => {
          const byDate = b.date.toMillis() - a.date.toMillis();
          if (byDate !== 0) return byDate;
          return (b.createdAt?.toMillis() ?? Date.now()) - (a.createdAt?.toMillis() ?? Date.now());
        });
        setTransactions(rows);
        setLoading(false);
      },
      (err) => {
        console.warn("İşlemler okunamadı", err);
        setError("İşlemler yüklenemedi. İnternet bağlantını kontrol et.");
        setLoading(false);
      },
    );
  }, [householdId, startMs, endMs]);

  return { transactions, loading, error };
}

/** Seçili ayın işlemleri. */
export function useMonthTransactions(householdId: string, month: Date): Result {
  const { start, end } = useMemo(() => monthRange(month), [month.getFullYear(), month.getMonth()]); // eslint-disable-line react-hooks/exhaustive-deps
  return useRangeTransactions(householdId, start, end);
}

export function useTotals(transactions: Transaction[]) {
  return useMemo(() => {
    let income = 0;
    let expense = 0;
    for (const t of transactions) {
      if (t.type === "income") income += t.amountKurus;
      else expense += t.amountKurus;
    }
    return { income, expense, balance: income - expense };
  }, [transactions]);
}

/** Hesap fonksiyonları için sade biçim. */
export function toLite(transactions: Transaction[]): TxLite[] {
  return transactions.map((t) => ({
    type: t.type,
    amountKurus: t.amountKurus,
    categoryId: t.categoryId,
    createdBy: t.createdBy,
    date: t.date.toDate(),
  }));
}
