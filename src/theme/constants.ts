// src/theme/index.ts
export const COLORS = {
  primary: "#6366f1", // Indigo
  secondary: "#a855f7", // Purple
  background: "#0a0a0c", // Deep Night
  card: "#121216", // Dark Card
  cardSecondary: "#1c1c24",
  text: "#ffffff",
  textMuted: "#8e8e93",
  income: "#22c55e",
  expense: "#f43f5e",
  border: "rgba(255,255,255,0.06)",
  accent: "#38bdf8", // Sky Blue
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// src/types/index.ts
export type TransactionType = "income" | "expense";

export interface Transaction {
  id: string;
  description: string;
  amount: number;
  category: string;
  date: string; // ISO
  type: TransactionType;
  accountId?: string;
  familyId?: string;
  userId?: string;
  userName?: string;
}

export interface Account {
  id: string;
  name: string;
  type: "CASH" | "BANK" | "CARD";
  balance: number;
  color: string;
}

export interface Saving {
  id: string;
  type: "ALTIN" | "USD" | "EUR";
  amount: number;
  createdAt: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  period: "monthly";
}
