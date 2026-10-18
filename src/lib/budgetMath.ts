// Bütçe ve rapor hesapları. Saf fonksiyonlar: Firebase'e bağımlı değil, test edilebilir.

/** Hesap için gereken işlem alanları (Timestamp yerine düz tarih). */
export interface TxLite {
  type: "expense" | "income";
  amountKurus: number;
  categoryId: string;
  createdBy: string;
  date: Date;
}

export type BudgetState = "ok" | "warn" | "over";

/** %80 ve üstü uyarı, %100'ü geçince aşıldı. */
export const WARN_RATIO = 0.8;

export interface CategoryBudget {
  categoryId: string;
  spent: number;
  limit: number;
  /** 0..∞ (1 = %100) */
  ratio: number;
  state: BudgetState;
  remaining: number;
}

export function budgetState(spent: number, limit: number): BudgetState {
  if (limit <= 0) return "ok";
  if (spent > limit) return "over";
  if (spent >= limit * WARN_RATIO) return "warn";
  return "ok";
}

export function spentByCategory(txs: TxLite[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of txs) {
    if (t.type !== "expense") continue;
    m.set(t.categoryId, (m.get(t.categoryId) ?? 0) + t.amountKurus);
  }
  return m;
}

export interface BudgetSummary {
  /** Limiti olan kategoriler: önce aşılanlar, sonra doluluk oranına göre. */
  categories: CategoryBudget[];
  /** Limiti olmayan ama harcama olan kategoriler (büyükten küçüğe). */
  unbudgeted: { categoryId: string; spent: number }[];
  totalLimit: number;
  /** Sadece limitli kategorilerdeki harcama */
  totalSpentBudgeted: number;
  totalState: BudgetState;
}

export function summarizeBudget(txs: TxLite[], limits: Record<string, number>): BudgetSummary {
  const spent = spentByCategory(txs);
  const categories: CategoryBudget[] = [];
  let totalLimit = 0;
  let totalSpentBudgeted = 0;

  for (const [categoryId, limit] of Object.entries(limits)) {
    if (!(limit > 0)) continue;
    const s = spent.get(categoryId) ?? 0;
    totalLimit += limit;
    totalSpentBudgeted += s;
    categories.push({
      categoryId,
      spent: s,
      limit,
      ratio: s / limit,
      state: budgetState(s, limit),
      remaining: limit - s,
    });
  }
  const rank: Record<BudgetState, number> = { over: 0, warn: 1, ok: 2 };
  categories.sort((a, b) => rank[a.state] - rank[b.state] || b.ratio - a.ratio);

  const unbudgeted = Array.from(spent.entries())
    .filter(([id]) => !(limits[id] > 0))
    .map(([categoryId, s]) => ({ categoryId, spent: s }))
    .sort((a, b) => b.spent - a.spent);

  return {
    categories,
    unbudgeted,
    totalLimit,
    totalSpentBudgeted,
    totalState: budgetState(totalSpentBudgeted, totalLimit),
  };
}

/* ---------- Raporlar ---------- */

export function expenseBreakdown(txs: TxLite[]): { categoryId: string; spent: number; share: number }[] {
  const spent = spentByCategory(txs);
  const total = Array.from(spent.values()).reduce((a, b) => a + b, 0);
  return Array.from(spent.entries())
    .map(([categoryId, s]) => ({ categoryId, spent: s, share: total > 0 ? s / total : 0 }))
    .sort((a, b) => b.spent - a.spent);
}

export interface MonthTotals {
  /** Ayın ilk günü */
  month: Date;
  income: number;
  expense: number;
}

/** endMonth dahil, geriye doğru `count` ay; eskiden yeniye sıralı. */
export function monthlyTotals(txs: TxLite[], endMonth: Date, count: number): MonthTotals[] {
  const out: MonthTotals[] = [];
  for (let i = count - 1; i >= 0; i--) {
    out.push({ month: new Date(endMonth.getFullYear(), endMonth.getMonth() - i, 1), income: 0, expense: 0 });
  }
  const index = new Map(out.map((m, i) => [`${m.month.getFullYear()}-${m.month.getMonth()}`, i]));
  for (const t of txs) {
    const i = index.get(`${t.date.getFullYear()}-${t.date.getMonth()}`);
    if (i === undefined) continue;
    if (t.type === "income") out[i].income += t.amountKurus;
    else out[i].expense += t.amountKurus;
  }
  return out;
}

export function expenseByMember(txs: TxLite[], members: string[]): { uid: string; spent: number; share: number }[] {
  const m = new Map(members.map((uid) => [uid, 0]));
  for (const t of txs) {
    if (t.type !== "expense") continue;
    m.set(t.createdBy, (m.get(t.createdBy) ?? 0) + t.amountKurus);
  }
  const total = Array.from(m.values()).reduce((a, b) => a + b, 0);
  return Array.from(m.entries()).map(([uid, spent]) => ({ uid, spent, share: total > 0 ? spent / total : 0 }));
}

/** Tutar girişi olmayan/sıfır limitleri temizler (kaydetmeden önce). */
export function cleanLimits(limits: Record<string, number | null | undefined>): Record<string, number> {
  const out: Record<string, number> = {};
  for (const [k, v] of Object.entries(limits)) {
    if (typeof v === "number" && Number.isInteger(v) && v > 0) out[k] = v;
  }
  return out;
}
