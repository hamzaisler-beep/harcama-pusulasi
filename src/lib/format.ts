const tlWhole = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });
const tlCents = new Intl.NumberFormat("tr-TR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** 12450 → "12.450 ₺", 1250.5 → "1.250,50 ₺" (kuruş varsa her zaman iki hane) */
export function formatTL(amount: number): string {
  const isWhole = Math.abs(Math.round(amount * 100)) % 100 === 0;
  return `${(isWhole ? tlWhole : tlCents).format(amount)} ₺`;
}

/** Kuruş → "12.450 ₺" / "12,50 ₺" */
export function formatKurus(kurus: number): string {
  return formatTL(kurus / 100);
}

/** İşaretli gösterim: gider "−850 ₺", gelir "+58.000 ₺" */
export function formatSigned(kurus: number, type: "expense" | "income"): string {
  return `${type === "expense" ? "−" : "+"}${formatKurus(kurus)}`;
}

function capitalize(s: string): string {
  return s.charAt(0).toLocaleUpperCase("tr-TR") + s.slice(1);
}

/** "Ekim 2026" */
export function formatMonth(date: Date): string {
  return capitalize(date.toLocaleDateString("tr-TR", { month: "long", year: "numeric" }));
}

/** "18 Eki 2026" */
export function formatShortDate(date: Date): string {
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

/** "18.10.2026" */
export function formatNumericDate(date: Date): string {
  const d = String(date.getDate()).padStart(2, "0");
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${d}.${m}.${date.getFullYear()}`;
}

/** "18.10.2026" / "18/10/2026" / "18-10-26" → Date; geçersizse null */
export function parseNumericDate(input: string): Date | null {
  const m = input.trim().match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{2}|\d{4})$/);
  if (!m) return null;
  const day = Number(m[1]);
  const month = Number(m[2]);
  let year = Number(m[3]);
  if (year < 100) year += 2000;
  const d = new Date(year, month - 1, day, 12);
  if (d.getFullYear() !== year || d.getMonth() !== month - 1 || d.getDate() !== day) return null;
  return d;
}

export function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
  );
}

/** Liste başlıkları için: "Bugün", "Dün" ya da "16 Ekim Cuma" */
export function formatDayHeading(date: Date, now = new Date()): string {
  if (isSameDay(date, now)) return "Bugün";
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (isSameDay(date, y)) return "Dün";
  return capitalize(date.toLocaleDateString("tr-TR", { day: "numeric", month: "long", weekday: "long" }));
}

/** Satır altı için kısa gün: "Bugün", "Dün", "16 Eki" */
export function formatDayShort(date: Date, now = new Date()): string {
  if (isSameDay(date, now)) return "Bugün";
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (isSameDay(date, y)) return "Dün";
  return date.toLocaleDateString("tr-TR", { day: "numeric", month: "short" });
}
