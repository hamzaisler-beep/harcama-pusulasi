// src/screens/ReportsScreen.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, Platform } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { format, subMonths, startOfMonth, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { useStore } from "../hooks/useStore";
import { COLORS, MONO } from "../theme/constants";
import { formatTRY, getCategoryIcon } from "../utils/format";

const CAT_COLORS = [COLORS.expense, COLORS.info, COLORS.income, COLORS.warning, COLORS.accent2, COLORS.primary];

const safeDate = (d: string) => {
  try {
    return d.includes("T") ? parseISO(d) : new Date(d);
  } catch {
    return new Date(0);
  }
};

export default function ReportsScreen() {
  const s = useStore();
  const transactions = s.transactions;

  const monthly = useMemo(() => {
    const buckets: { key: string; label: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = startOfMonth(subMonths(new Date(), i));
      buckets.push({ key: format(d, "yyyy-MM"), label: format(d, "MMM", { locale: tr }), income: 0, expense: 0 });
    }
    const map = new Map(buckets.map((b) => [b.key, b]));
    transactions.forEach((t) => {
      const key = format(safeDate(t.date), "yyyy-MM");
      const b = map.get(key);
      if (!b) return;
      const val = Math.abs(Number(t.amount) || 0);
      if (t.type === "income") b.income += val;
      else b.expense += val;
    });
    return buckets;
  }, [transactions]);

  const categories = useMemo(() => {
    const totals: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        const cat = t.category || "Diğer";
        totals[cat] = (totals[cat] || 0) + Math.abs(Number(t.amount) || 0);
      });
    const arr = Object.entries(totals)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value);
    const sum = arr.reduce((s, x) => s + x.value, 0);
    return { arr, sum };
  }, [transactions]);

  const overall = useMemo(() => {
    const income = transactions.filter((t) => t.type === "income").reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0);
    const expense = transactions.filter((t) => t.type === "expense").reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0);
    const net = income - expense;
    const savingsRate = income > 0 ? (net / income) * 100 : 0;
    return { income, expense, net, savingsRate };
  }, [transactions]);

  const maxMonthly = Math.max(...monthly.map((m) => Math.max(m.income, m.expense)), 1);

  if (transactions.length === 0) {
    return (
      <View style={styles.emptyWrap}>
        <MaterialIcons name="bar-chart" size={48} color={COLORS.textMuted} style={{ opacity: 0.4 }} />
        <Text style={styles.emptyText}>Rapor için henüz işlem yok.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollInside} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.title}>Raporlar</Text>
        <Text style={styles.subtitle}>Tüm işlemlerinize dayalı analiz</Text>
      </View>

      {/* Stat cards */}
      <View style={styles.statRow}>
        <StatCard title="Toplam Gelir" value={formatTRY(overall.income)} color={COLORS.income} icon="south-west" />
        <StatCard title="Toplam Gider" value={formatTRY(overall.expense)} color={COLORS.expense} icon="north-east" />
        <StatCard title="Net" value={formatTRY(overall.net)} color={overall.net >= 0 ? COLORS.income : COLORS.expense} icon="account-balance-wallet" />
        <StatCard title="Tasarruf Oranı" value={`%${overall.savingsRate.toFixed(0)}`} color={COLORS.primary} icon="savings" />
      </View>

      <View style={styles.grid}>
        {/* Monthly trend */}
        <View style={[styles.panel, { flex: 1.3 }]}>
          <Text style={styles.panelTitle}>SON 6 AY · GELİR / GİDER</Text>
          <View style={styles.chart}>
            {monthly.map((m) => (
              <View key={m.key} style={styles.barGroup}>
                <View style={styles.barsWrap}>
                  <View style={[styles.bar, { height: `${(m.income / maxMonthly) * 100}%`, backgroundColor: COLORS.income }]} />
                  <View style={[styles.bar, { height: `${(m.expense / maxMonthly) * 100}%`, backgroundColor: COLORS.expense }]} />
                </View>
                <Text style={styles.barLabel}>{m.label}</Text>
              </View>
            ))}
          </View>
          <View style={styles.legend}>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: COLORS.income }]} /><Text style={styles.legendText}>Gelir</Text></View>
            <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: COLORS.expense }]} /><Text style={styles.legendText}>Gider</Text></View>
          </View>
        </View>

        {/* Category breakdown */}
        <View style={[styles.panel, { flex: 1 }]}>
          <Text style={styles.panelTitle}>GİDER KATEGORİLERİ</Text>
          {categories.arr.length === 0 ? (
            <Text style={styles.smallEmpty}>Gider kaydı yok.</Text>
          ) : (
            categories.arr.slice(0, 7).map((c, i) => {
              const pct = categories.sum > 0 ? (c.value / categories.sum) * 100 : 0;
              const color = CAT_COLORS[i % CAT_COLORS.length];
              return (
                <View key={c.label} style={styles.catRow}>
                  <View style={[styles.catIcon, { backgroundColor: color + "22" }]}>
                    <MaterialIcons name={getCategoryIcon(c.label)} size={16} color={color} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <View style={styles.catTop}>
                      <Text style={styles.catName}>{c.label}</Text>
                      <Text style={styles.catValue}>{formatTRY(c.value)}</Text>
                    </View>
                    <View style={styles.catTrack}>
                      <View style={[styles.catFill, { width: `${pct}%`, backgroundColor: color }]} />
                    </View>
                  </View>
                  <Text style={styles.catPct}>%{pct.toFixed(0)}</Text>
                </View>
              );
            })
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const StatCard = ({ title, value, color, icon }: any) => (
  <View style={[styles.statCard, { borderTopColor: color }]}>
    <View style={styles.statHeader}>
      <Text style={styles.statTitle}>{title}</Text>
      <MaterialIcons name={icon} size={18} color={color} />
    </View>
    <Text style={[styles.statValue, { color }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollInside: { padding: 32 },
  emptyWrap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background, padding: 32 },
  emptyText: { color: COLORS.textMuted, fontSize: 14, marginTop: 16 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },

  statRow: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 24 },
  statCard: { flex: 1, minWidth: 180, backgroundColor: COLORS.card, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: COLORS.border, borderTopWidth: 3 },
  statHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  statTitle: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600" },
  statValue: { fontSize: 22, fontWeight: "900", fontFamily: MONO },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 24 },
  panel: { minWidth: 320, backgroundColor: COLORS.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  panelTitle: { fontSize: 11, color: COLORS.textMuted, fontWeight: "700", letterSpacing: 1.2, marginBottom: 24 },

  chart: { height: 220, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around" },
  barGroup: { alignItems: "center", flex: 1 },
  barsWrap: { flexDirection: "row", alignItems: "flex-end", gap: 4, height: "100%" },
  bar: { width: 12, borderRadius: 3, minHeight: 2 },
  barLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 8, fontWeight: "600" },
  legend: { flexDirection: "row", justifyContent: "center", gap: 20, marginTop: 16 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: COLORS.textSecondary },

  catRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  catIcon: { width: 34, height: 34, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  catTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  catName: { color: "#fff", fontSize: 13, fontWeight: "600" },
  catValue: { color: COLORS.textSecondary, fontSize: 12, fontWeight: "700" },
  catTrack: { height: 5, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" },
  catFill: { height: "100%", borderRadius: 3 },
  catPct: { color: COLORS.textMuted, fontSize: 11, width: 38, textAlign: "right" },
  smallEmpty: { color: COLORS.textMuted, fontSize: 13, paddingVertical: 20, textAlign: "center" },
});
