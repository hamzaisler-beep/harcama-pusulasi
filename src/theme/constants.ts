// src/theme/index.ts
import { Platform } from "react-native";

// Platformlar arası tutarlı monospace font (rakam hizalaması için).
// Web CSS'teki "Space Mono, monospace" sözdizimi native'de geçersizdir.
export const MONO = Platform.select({ ios: "Menlo", android: "monospace", default: "monospace" });

// Kenar menüde gösterilir. Hangi sürümün yayında olduğunu bir bakışta
// anlamak için (tarayıcı önbelleği / yayın gecikmesi teşhisi) kullanılır.
export const APP_VERSION = "2.1.0";

export const COLORS = {
  background: "#0A0D14",   // --bg  (FinFlow dark)
  sidebar: "#0D1018",      // sidebar bg
  card: "#131820",         // --bg2 (Panel, Card)
  cardSecondary: "#1A2030", // --bg3 (Hover, Inputs)
  track: "#1E2535",        // --bg4 (Progress track)
  primary: "#00C9A7",      // --accent (Teal)
  income: "#10b981",       // --green
  expense: "#F87171",      // --red
  warning: "#FBBF24",      // --yellow
  info: "#60A5FA",         // --blue
  accent2: "#F472B6",      // --pink
  text: "#E2E8F0",         // --text
  textSecondary: "#94A3B8", // --text2
  textMuted: "#64748B",    // --text3
  border: "rgba(255,255,255,0.06)",
  accent: "#00C9A7",
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
  familyId?: string;
  createdAt?: string;
}

export interface Goal {
  id: string;
  title: string;
  targetAmount: number;
  currentAmount: number;
  deadline?: string; // ISO
  icon?: string;
  color?: string;
  createdAt: string;
  familyId?: string;
}

// type: "owe" = ben borçluyum (verecek), "owed" = bana borçlu (alacak)
export interface Debt {
  id: string;
  person: string;
  amount: number;
  type: "owe" | "owed";
  description?: string;
  dueDate?: string; // ISO
  isSettled?: boolean;
  createdAt: string;
  familyId?: string;
}

export interface Customer {
  id: string;
  name: string;
  company?: string;
  email?: string;
  phone?: string;
  status: "active" | "lead" | "inactive";
  totalRevenue?: number;
  notes?: string;
  tags?: string[];
  createdAt: string;
  familyId?: string;
}

export interface Task {
  id: string;
  title: string;
  description?: string;
  priority: "high" | "medium" | "low";
  status: "pending" | "completed";
  dueDate?: string;
  customerId?: string;
  customerName?: string;
  createdAt: string;
  familyId?: string;
}
