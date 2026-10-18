import { test } from "node:test";
import assert from "node:assert/strict";
import { kurusToInput, monthRange, normalizeDay, parseAmountToKurus } from "../src/lib/money";
import {
  formatDayHeading,
  formatKurus,
  formatMonth,
  formatNumericDate,
  formatSigned,
  parseNumericDate,
} from "../src/lib/format";
import { normalizeCode } from "../src/lib/inviteCode";
import { DEFAULT_CATEGORIES, categoriesFor, getCategory } from "../src/lib/categories";

test("tutar: Türkçe yazımlar doğru kuruşa çevrilir", () => {
  const cases: [string, number | null][] = [
    ["850", 85000],
    ["1250", 125000],
    ["1.250", 125000],
    ["1.250.000", 125000000],
    ["1250,5", 125050],
    ["1250,50", 125050],
    ["1.250,50", 125050],
    ["0,99", 99],
    ["12.5", 1250],
    ["12.50", 1250],
    ["229,99", 22999],
    [" 850 ₺", 85000],
    ["850 TL", 85000],
    ["", null],
    ["0", null],
    ["0,00", null],
    ["abc", null],
    ["12,345", null], // 3 haneli kuruş anlamsız
    ["1,2,3", null],
  ];
  for (const [input, expected] of cases) {
    assert.equal(parseAmountToKurus(input), expected, `girdi: "${input}"`);
  }
});

test("tutar: kayan nokta hatası yok", () => {
  assert.equal(parseAmountToKurus("0,29"), 29);
  assert.equal(parseAmountToKurus("1,15"), 115);
  assert.equal(parseAmountToKurus("19,99"), 1999);
  assert.equal(parseAmountToKurus("4,35"), 435);
});

test("tutar: forma geri yazma ve tekrar okuma aynı sonucu verir", () => {
  for (const k of [1, 99, 100, 85000, 125050, 22999, 100000000]) {
    assert.equal(parseAmountToKurus(kurusToInput(k)), k, `kuruş: ${k}`);
  }
  assert.equal(kurusToInput(125050), "1250,50");
  assert.equal(kurusToInput(85000), "850");
});

test("tutar: ekranda TL biçimi", () => {
  assert.equal(formatKurus(1245000), "12.450 ₺");
  assert.equal(formatKurus(125050), "1.250,50 ₺");
  assert.equal(formatKurus(-125050), "-1.250,50 ₺");
  assert.equal(formatKurus(99), "0,99 ₺");
  assert.equal(formatKurus(0), "0 ₺");
  assert.equal(formatSigned(85000, "expense"), "−850 ₺");
  assert.equal(formatSigned(5800000, "income"), "+58.000 ₺");
});

test("tarih: GG.AA.YYYY okuma", () => {
  const d = parseNumericDate("05.10.2026")!;
  assert.equal(d.getFullYear(), 2026);
  assert.equal(d.getMonth(), 9);
  assert.equal(d.getDate(), 5);
  assert.ok(parseNumericDate("5/10/26"));
  assert.ok(parseNumericDate("29.02.2028")); // artık yıl
  assert.equal(parseNumericDate("29.02.2026"), null);
  assert.equal(parseNumericDate("31.04.2026"), null);
  assert.equal(parseNumericDate("2026-10-05"), null);
  assert.equal(parseNumericDate(""), null);
  assert.equal(formatNumericDate(new Date(2026, 0, 7)), "07.01.2026");
});

test("tarih: gün öğlene sabitlenir, ay aralığı doğru", () => {
  const n = normalizeDay(new Date(2026, 9, 31, 23, 59));
  assert.equal(n.getDate(), 31);
  assert.equal(n.getHours(), 12);

  const { start, end } = monthRange(new Date(2026, 11, 15));
  assert.equal(start.getTime(), new Date(2026, 11, 1).getTime());
  assert.equal(end.getTime(), new Date(2027, 0, 1).getTime()); // yıl geçişi
  // Ayın son günü öğlen kaydedilen işlem aralığa girer, ertesi ayın ilki girmez.
  const lastDay = normalizeDay(new Date(2026, 11, 31));
  assert.ok(lastDay >= start && lastDay < end);
  assert.ok(!(normalizeDay(new Date(2027, 0, 1)) < end));
});

test("tarih: başlıklar", () => {
  const now = new Date(2026, 9, 18, 15);
  assert.equal(formatDayHeading(new Date(2026, 9, 18, 12), now), "Bugün");
  assert.equal(formatDayHeading(new Date(2026, 9, 17, 12), now), "Dün");
  assert.equal(formatDayHeading(new Date(2026, 9, 1, 12), now), "1 Ekim Perşembe");
  assert.equal(formatMonth(new Date(2026, 9, 1)), "Ekim 2026");
});

test("davet kodu: temizleme", () => {
  assert.equal(normalizeCode(" k7p-2qx "), "K7P2QX");
  assert.equal(normalizeCode("ab cd ef"), "ABCDEF");
});

test("kategoriler: kimlikler benzersiz, her türde 'Diğer' var", () => {
  const ids = DEFAULT_CATEGORIES.map((c) => c.id);
  assert.equal(new Set(ids).size, ids.length);
  assert.ok(categoriesFor("expense").some((c) => c.name === "Diğer"));
  assert.ok(categoriesFor("income").some((c) => c.name === "Diğer"));
  assert.equal(getCategory("yok-boyle").name, "Kategorisiz");
});
