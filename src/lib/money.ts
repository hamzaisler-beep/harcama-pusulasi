// Saf yardımcılar: Firebase'e bağımlı değil, tek başına test edilebilir.

/** Günün öğlen saati: saat dilimi kaymalarında tarih bir gün kaymasın. */
export function normalizeDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(12, 0, 0, 0);
  return d;
}

/**
 * Kullanıcının yazdığı tutarı kuruşa çevirir. Türkçe biçimleri anlar:
 * "1250" → 125000, "1.250" → 125000, "1250,5" → 125050, "1.250,50" → 125050,
 * "12.5" → 1250 (nokta + 1-2 hane ondalık sayılır). Anlaşılmazsa null.
 */
export function parseAmountToKurus(raw: string): number | null {
  let s = raw.replace(/\s|₺|TL/gi, "");
  if (!s) return null;

  if (s.includes(",")) {
    // Virgül ondalık, noktalar binlik ayıracı.
    s = s.replace(/\./g, "").replace(",", ".");
  } else if (s.includes(".")) {
    const parts = s.split(".");
    const last = parts[parts.length - 1];
    // "1.250" ya da "1.250.000" → binlik; "12.5" / "12.50" → ondalık
    if (parts.length > 2 || last.length === 3) s = parts.join("");
  }

  if (!/^\d+(\.\d{1,2})?$/.test(s)) return null;
  const value = Math.round(parseFloat(s) * 100);
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** 125050 → "1250,50" (form alanında düzenlemek için) */
export function kurusToInput(kurus: number): string {
  const lira = Math.floor(kurus / 100);
  const k = kurus % 100;
  return k === 0 ? String(lira) : `${lira},${String(k).padStart(2, "0")}`;
}

export function monthRange(month: Date): { start: Date; end: Date } {
  const start = new Date(month.getFullYear(), month.getMonth(), 1, 0, 0, 0, 0);
  const end = new Date(month.getFullYear(), month.getMonth() + 1, 1, 0, 0, 0, 0);
  return { start, end };
}
