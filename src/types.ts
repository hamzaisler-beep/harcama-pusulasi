// src/types.ts

export const CATEGORIES = [
  "Gıda \u0026 Yemek",
  "Ulaşım",
  "Kira \u0026 Faturalar",
  "Alışveriş",
  "Eğlence",
  "Sağlık",
  "Maaş",
  "Yatırım",
  "Diğer",
];

export type TransactionType = "income" | "expense";
export type SavingType = "ALTIN" | "USD" | "EUR";
export type AccountType = "CASH" | "BANK" | "CARD";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: TransactionType;
  isManualEntry: boolean;
  accountId?: string;
}

export interface Saving {
  id: string;
  type: SavingType;
  amount: number;
  createdAt: string;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  balance: number;
  color: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  period: "monthly";
}

export const RATES = {
  ALTIN: 3820,
  USD: 38.5,
  EUR: 41.2,
};

export const CATEGORY_ICONS: Record<string, string> = {
  "Gıda \u0026 Yemek": "restaurant",
  "Ulaşım": "directions-car",
  "Kira \u0026 Faturalar": "home",
  "Alışveriş": "shopping-bag",
  "Eğlence": "movie",
  "Sağlık": "local-hospital",
  "Maaş": "account-balance-wallet",
  "Yatırım": "trending-up",
  "Diğer": "category",
};

export const COLORS = {
  primary: "#22c55e", // Emerald green
  primaryLight: "rgba(34, 197, 94, 0.1)",
  primaryDark: "#16a34a",
  income: "#22c55e",
  incomeLight: "rgba(34, 197, 94, 0.15)",
  expense: "#ef4444", // Pinkish-red
  expenseLight: "rgba(239, 68, 68, 0.15)",
  amber: "#f59e0b",
  amberLight: "rgba(245, 158, 11, 0.15)",
  background: "#000000", // Pure black for V2
  card: "#111111", // Darker card for V2
  cardSecondary: "#18181b",
  border: "rgba(255, 255, 255, 0.05)",
  textPrimary: "#FFFFFF",
  textSecondary: "#A3A3A3",
  textMuted: "#525252",
  glass: "rgba(23, 23, 23, 0.7)",
};
