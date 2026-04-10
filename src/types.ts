// src/types.ts

export const CATEGORIES = [
  "Gıda & Yemek",
  "Ulaşım",
  "Kira & Faturalar",
  "Alışveriş",
  "Eğlence",
  "Sağlık",
  "Maaş",
  "Yatırım",
  "Diğer",
];

export type TransactionType = "income" | "expense";
export type SavingType = "ALTIN" | "USD" | "EUR";

export interface Transaction {
  id: string;
  date: string;
  description: string;
  amount: number;
  category: string;
  type: TransactionType;
  isManualEntry: boolean;
}

export interface Saving {
  id: string;
  type: SavingType;
  amount: number;
  createdAt: string;
}

export const RATES = {
  ALTIN: 3820,
  USD: 38.5,
  EUR: 41.2,
};

export const CATEGORY_ICONS: Record<string, string> = {
  "Gıda & Yemek": "restaurant",
  "Ulaşım": "directions-car",
  "Kira & Faturalar": "home",
  "Alışveriş": "shopping-bag",
  "Eğlence": "movie",
  "Sağlık": "local-hospital",
  "Maaş": "account-balance-wallet",
  "Yatırım": "trending-up",
  "Diğer": "category",
};

export const COLORS = {
  primary: "#185FA5",
  primaryLight: "#E6F1FB",
  primaryDark: "#0C447C",
  income: "#3B6D11",
  incomeLight: "#EAF3DE",
  expense: "#A32D2D",
  expenseLight: "#FCEBEB",
  amber: "#854F0B",
  amberLight: "#FAEEDA",
  background: "#F4F7FB",
  card: "#FFFFFF",
  border: "#E2E8F0",
  textPrimary: "#1A202C",
  textSecondary: "#718096",
  textMuted: "#A0AEC0",
};
