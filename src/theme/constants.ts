// src/theme/index.ts
export const COLORS = {
  background: "#0F1117", // --bg
  card: "#171A24",       // --bg2 (Panel, Sidebar, Card)
  cardSecondary: "#1E2130", // --bg3 (Hover, Inputs)
  track: "#252A3A",      // --bg4 (Progress track)
  primary: "#6C63FF",    // --accent (Mor)
  income: "#48BB78",     // --green
  expense: "#FC8181",    // --red
  warning: "#F6E05E",    // --yellow
  info: "#63B3ED",       // --blue
  accent2: "#F687B3",    // --pink
  text: "#E2E8F0",       // --text
  textSecondary: "#A0Aec0", // --text2
  textMuted: "#718096",  // --text3
  border: "rgba(255,255,255,0.07)",
  accent: "#6C63FF",
};

export const RADII = {
  default: 12,
  sm: 9,
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

export interface Investment {
  id: string;
  symbol: string;
  type: string;
  amount: number;
  buyPrice: number;
  currentPrice: number;
  date: string;
  icon: string;
  familyId?: string;
}

export interface Budget {
  id: string;
  category: string;
  limit: number;
  period: "monthly";
}
