// src/utils/format.ts
// Para ve kategori ikonu için ortak yardımcılar.

const nf = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 2 });
const nf0 = new Intl.NumberFormat("tr-TR", { maximumFractionDigits: 0 });

/** 12345.6 -> "₺12.345,6" */
export function formatTRY(value: number, decimals = false): string {
  const v = Number(value);
  if (isNaN(v)) return "₺0";
  return "₺" + (decimals ? nf : nf0).format(v);
}

/** Sadece sayı (₺ olmadan) */
export function formatNumber(value: number, decimals = false): string {
  const v = Number(value);
  if (isNaN(v)) return "0";
  return (decimals ? nf : nf0).format(v);
}

/** Kategori adından MaterialIcons ismi türetir. */
export function getCategoryIcon(cat: string): any {
  const c = (cat || "").toLowerCase();
  if (c.includes("maaş") || c.includes("gelir")) return "payments";
  if (c.includes("freelance")) return "laptop";
  if (c.includes("market") || c.includes("gıda")) return "shopping-cart";
  if (c.includes("fatura") || c.includes("elektrik") || c.includes("doğalgaz")) return "bolt";
  if (c.includes("kira")) return "home";
  if (c.includes("akaryakıt") || c.includes("ulaşım")) return "directions-car";
  if (c.includes("restoran") || c.includes("yemek")) return "restaurant";
  if (c.includes("eğlence")) return "videogame-asset";
  if (c.includes("giyim")) return "checkroom";
  if (c.includes("sağlık")) return "fitness-center";
  return "category";
}
