import type { TransactionType } from "../types";

export type CategoryIconName =
  | "cart"
  | "home"
  | "bolt"
  | "fuel"
  | "food"
  | "heart"
  | "bag"
  | "card"
  | "school"
  | "gift"
  | "paw"
  | "dots"
  | "wallet"
  | "plus-circle"
  | "trend";

export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: CategoryIconName;
  /** Simge rengi */
  color: string;
  /** Simge arka planı */
  tint: string;
}

// Varsayılan kategoriler. Kimlikler (id) kalıcıdır; isimler değişebilir.
// Hanenin kendi kategorileri sonraki aşamada eklenecek.
export const DEFAULT_CATEGORIES: Category[] = [
  { id: "market", name: "Market", type: "expense", icon: "cart", color: "#B4470F", tint: "#FBEDE3" },
  { id: "kira", name: "Kira", type: "expense", icon: "home", color: "#0E6B5A", tint: "#E3F1EC" },
  { id: "faturalar", name: "Faturalar", type: "expense", icon: "bolt", color: "#8A6A00", tint: "#FBF3D9" },
  { id: "ulasim", name: "Ulaşım", type: "expense", icon: "fuel", color: "#2F5A8A", tint: "#E8EEF6" },
  { id: "yemek", name: "Yemek", type: "expense", icon: "food", color: "#9A3A0B", tint: "#F8E4D9" },
  { id: "saglik", name: "Sağlık", type: "expense", icon: "heart", color: "#A23B5A", tint: "#F7E4EA" },
  { id: "alisveris", name: "Alışveriş", type: "expense", icon: "bag", color: "#6B4E9B", tint: "#EEE8F6" },
  { id: "egitim", name: "Eğitim", type: "expense", icon: "school", color: "#1F6B8A", tint: "#E1F0F6" },
  { id: "evcil", name: "Evcil hayvan", type: "expense", icon: "paw", color: "#7A5A2E", tint: "#F3EBDF" },
  { id: "hediye", name: "Hediye", type: "expense", icon: "gift", color: "#A23B5A", tint: "#F7E4EA" },
  { id: "diger-gider", name: "Diğer", type: "expense", icon: "dots", color: "#5B6B64", tint: "#EDF1EF" },

  { id: "maas", name: "Maaş", type: "income", icon: "wallet", color: "#0E6B5A", tint: "#E3F1EC" },
  { id: "ek-gelir", name: "Ek gelir", type: "income", icon: "plus-circle", color: "#2F5A8A", tint: "#E8EEF6" },
  { id: "yatirim", name: "Yatırım", type: "income", icon: "trend", color: "#6B4E9B", tint: "#EEE8F6" },
  { id: "hediye-gelir", name: "Hediye", type: "income", icon: "gift", color: "#A23B5A", tint: "#F7E4EA" },
  { id: "diger-gelir", name: "Diğer", type: "income", icon: "dots", color: "#5B6B64", tint: "#EDF1EF" },
];

const byId = new Map(DEFAULT_CATEGORIES.map((c) => [c.id, c]));

const UNKNOWN: Category = {
  id: "bilinmiyor",
  name: "Kategorisiz",
  type: "expense",
  icon: "dots",
  color: "#5B6B64",
  tint: "#EDF1EF",
};

export function getCategory(id: string): Category {
  return byId.get(id) ?? UNKNOWN;
}

export function categoriesFor(type: TransactionType): Category[] {
  return DEFAULT_CATEGORIES.filter((c) => c.type === type);
}
