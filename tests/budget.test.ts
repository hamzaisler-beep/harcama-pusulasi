import { test } from "node:test";
import assert from "node:assert/strict";
import {
  budgetState,
  cleanLimits,
  expenseBreakdown,
  expenseByMember,
  monthlyTotals,
  summarizeBudget,
  type TxLite,
} from "../src/lib/budgetMath";

const d = (y: number, m: number, day = 10) => new Date(y, m, day, 12);
const tx = (
  type: "expense" | "income",
  amountKurus: number,
  categoryId: string,
  createdBy = "a",
  date = d(2026, 9),
): TxLite => ({ type, amountKurus, categoryId, createdBy, date });

test("bütçe durumu: %80 uyarı, %100 üstü aşıldı", () => {
  assert.equal(budgetState(0, 100), "ok");
  assert.equal(budgetState(79, 100), "ok");
  assert.equal(budgetState(80, 100), "warn");
  assert.equal(budgetState(100, 100), "warn"); // tam limitte: uyarı, aşılmadı
  assert.equal(budgetState(101, 100), "over");
  assert.equal(budgetState(50, 0), "ok"); // limitsiz
});

test("bütçe özeti: gelirler sayılmaz, sıralama aşılan-uyarı-normal", () => {
  const txs = [
    tx("expense", 736000, "market"),
    tx("expense", 390000, "yemek"),
    tx("expense", 100000, "ulasim"),
    tx("expense", 50000, "hediye"), // limitsiz
    tx("income", 5800000, "maas"),
  ];
  const s = summarizeBudget(txs, { market: 800000, yemek: 350000, ulasim: 500000, kira: 1200000 });
  assert.deepEqual(
    s.categories.map((c) => [c.categoryId, c.state]),
    [
      ["yemek", "over"],
      ["market", "warn"],
      ["ulasim", "ok"],
      ["kira", "ok"],
    ],
  );
  const yemek = s.categories[0];
  assert.equal(yemek.remaining, -40000);
  assert.equal(s.totalLimit, 2850000);
  assert.equal(s.totalSpentBudgeted, 1226000);
  assert.deepEqual(s.unbudgeted, [{ categoryId: "hediye", spent: 50000 }]);
  assert.equal(s.totalState, "ok");
});

test("bütçe özeti: limit yoksa boş", () => {
  const s = summarizeBudget([tx("expense", 100, "market")], {});
  assert.equal(s.categories.length, 0);
  assert.equal(s.totalLimit, 0);
  assert.equal(s.unbudgeted.length, 1);
});

test("limit temizleme: sıfır/boş/kesirli atılır", () => {
  assert.deepEqual(cleanLimits({ a: 100, b: 0, c: null, d: undefined, e: 1.5, f: -5 }), { a: 100 });
});

test("dağılım: büyükten küçüğe, paylar toplamı 1", () => {
  const b = expenseBreakdown([
    tx("expense", 300, "a"),
    tx("expense", 100, "b"),
    tx("expense", 600, "c"),
    tx("income", 9999, "maas"),
  ]);
  assert.deepEqual(
    b.map((x) => x.categoryId),
    ["c", "a", "b"],
  );
  assert.ok(Math.abs(b.reduce((s, x) => s + x.share, 0) - 1) < 1e-9);
  assert.deepEqual(expenseBreakdown([]), []);
});

test("aylık toplamlar: yıl geçişi ve aralık dışı", () => {
  const txs = [
    tx("expense", 100, "x", "a", d(2025, 11)), // Aralık 2025
    tx("expense", 200, "x", "a", d(2026, 0)), // Ocak 2026
    tx("income", 1000, "maas", "a", d(2026, 0)),
    tx("expense", 999, "x", "a", d(2025, 5)), // aralık dışı
  ];
  const m = monthlyTotals(txs, new Date(2026, 1, 1), 3); // Ara, Oca, Şub
  assert.deepEqual(
    m.map((x) => [x.month.getFullYear(), x.month.getMonth(), x.expense, x.income]),
    [
      [2025, 11, 100, 0],
      [2026, 0, 200, 1000],
      [2026, 1, 0, 0],
    ],
  );
});

test("kişiye göre: harcaması olmayan üye de listede", () => {
  const r = expenseByMember([tx("expense", 300, "x", "a"), tx("expense", 100, "x", "a")], ["a", "b"]);
  assert.deepEqual(
    r.map((x) => [x.uid, x.spent]),
    [
      ["a", 400],
      ["b", 0],
    ],
  );
  assert.equal(r[0].share, 1);
});
