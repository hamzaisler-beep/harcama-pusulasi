const tl = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 });

/** 12450 → "12.450 ₺" */
export function formatTL(amount: number): string {
  return `${tl.format(amount)} ₺`;
}

/** "Ekim 2026" */
export function formatMonth(date: Date): string {
  const s = date.toLocaleDateString("tr-TR", { month: "long", year: "numeric" });
  return s.charAt(0).toLocaleUpperCase("tr-TR") + s.slice(1);
}
