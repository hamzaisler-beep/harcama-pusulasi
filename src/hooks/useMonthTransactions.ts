import { useEffect, useMemo, useState } from "react";
import { Timestamp, collection, onSnapshot, orderBy, query, where } from "firebase/firestore";
import { db } from "../lib/firebase";
import { monthRange } from "../lib/transactions";
import type { Transaction } from "../types";

interface Result {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
}

/** Seçili ayın işlemlerini canlı dinler (eşin eklediği kayıt anında gelir). Yeniden eskiye sıralı. */
export function useMonthTransactions(householdId: string, month: Date): Result {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const key = `${month.getFullYear()}-${month.getMonth()}`;

  useEffect(() => {
    const { start, end } = monthRange(month);
    setLoading(true);
    setError(null);
    const q = query(
      collection(db, "households", householdId, "transactions"),
      where("date", ">=", Timestamp.fromDate(start)),
      where("date", "<", Timestamp.fromDate(end)),
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [householdId, key]);

  return { transactions, loading, error };
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
