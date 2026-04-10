// src/utils/familyStats.ts
import { subDays, startOfDay, endOfDay, isWithinInterval, subMonths, isSameDay } from "date-fns";
import { formatCurrency } from "./format";

export type TimePeriod = "weekly" | "monthly" | "3months" | "yearly";

export interface FamilyReport {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  categoryBreakdown: { category: string; amount: number; percentage: number }[];
  memberBreakdown: { name: string; amount: number; percentage: number }[];
  chartData: { labels: string[]; incomeData: number[]; expenseData: number[] };
}

export const calculateFamilyReport = (transactions: any[], period: TimePeriod): FamilyReport => {
  const now = new Date();
  let startDate: Date;

  switch (period) {
    case "weekly": startDate = subDays(now, 7); break;
    case "monthly": startDate = subDays(now, 30); break;
    case "3months": startDate = subDays(now, 90); break;
    case "yearly": startDate = subDays(now, 365); break;
    default: startDate = subDays(now, 30);
  }

  const filtered = transactions.filter(t => {
    const d = new Date(t.date);
    return d >= startOfDay(startDate) && d <= endOfDay(now);
  });

  let income = 0;
  let expense = 0;
  const cats: Record<string, number> = {};
  const members: Record<string, number> = {};

  filtered.forEach(t => {
    const amt = Number(t.amount);
    if (t.type === "income") {
      income += amt;
    } else {
      expense += Math.abs(amt);
      cats[t.category] = (cats[t.category] || 0) + Math.abs(amt);
      const name = t.userName || "Diğer";
      members[name] = (members[name] || 0) + Math.abs(amt);
    }
  });

  // Category Breakdown
  const categoryBreakdown = Object.entries(cats)
    .sort((a, b) => b[1] - a[1])
    .map(([category, amount]) => ({
      category,
      amount,
      percentage: expense > 0 ? Math.round((amount / expense) * 100) : 0
    }));

  // Member Breakdown
  const memberBreakdown = Object.entries(members)
    .sort((a, b) => b[1] - a[1])
    .map(([name, amount]) => ({
      name,
      amount,
      percentage: expense > 0 ? Math.round((amount / expense) * 100) : 0
    }));

  // Chart Data (7 items for the period)
  const labels: string[] = [];
  const incomeData: number[] = [];
  const expenseData: number[] = [];
  
  const segments = 7;
  const daysPerSegment = period === "weekly" ? 1 : 
                        period === "monthly" ? 4 : 
                        period === "3months" ? 12 : 52;

  for (let i = segments - 1; i >= 0; i--) {
    const d = subDays(now, i * daysPerSegment);
    labels.push(d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" }));
    
    // Simple window for the segment
    const segStart = startOfDay(subDays(d, daysPerSegment));
    const segEnd = endOfDay(d);
    
    const segTxs = filtered.filter(t => {
      const td = new Date(t.date);
      return td >= segStart && td <= segEnd;
    });

    incomeData.push(segTxs.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount), 0));
    expenseData.push(segTxs.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(Number(t.amount)), 0));
  }

  return {
    totalIncome: income,
    totalExpense: expense,
    balance: income - expense,
    categoryBreakdown,
    memberBreakdown,
    chartData: { labels, incomeData, expenseData }
  };
};
