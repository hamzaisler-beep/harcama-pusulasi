// src/screens/ReportsScreen.tsx
import React, { useState, useEffect, useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useWindowDimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Svg, { Polyline, Line, Text as SvgText, Circle } from "react-native-svg";
import { format, subMonths, startOfMonth, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { store } from "../store";
import { COLORS, MONO } from "../theme/constants";
import { formatTRY } from "../utils/format";

const monthKey = (d: string) => {
  try { return format(d.includes("T") ? parseISO(d) : new Date(d), "yyyy-MM"); }
  catch { return ""; }
};

export default function ReportsScreen() {
  const [tick, setTick] = useState(0);
  const { width } = useWindowDimensions();

  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    store.listeners.add(fn);
    return () => { store.listeners.delete(fn); };
  }, []);

  const monthly = useMemo(() => {
    const now = new Date();
    const months = [];
    for (let i = 11; i >= 0; i--) {
      const d = startOfMonth(subMonths(now, i));
      months.push({ key: format(d, "yyyy-MM"), label: format(d, "MMM yy", { locale: tr }), income: 0, expense: 0 });
    }
    const mmap = new Map(months.map(m => [m.key, m]));
    store.transactions.forEach(t => {
      const m = mmap.get(monthKey(t.date));
      if (!m) return;
      const val = Math.abs(Number(t.amount) || 0);
      if (t.type === "income") m.income += val;
      else m.expense += val;
    });
    return months.map(m => ({ ...m, net: m.income - m.expense }));
  }, [store.transactions, tick]);

  const chartW = Math.min(width - 48, 900);
  const chartH = 180;
  const padL = 48, padR = 16, padT = 16, padB = 36;
  const drawW = chartW - padL - padR;
  const drawH = chartH - padT - padB;

  const maxVal = Math.max(...monthly.map(m => Math.max(m.income, m.expense)), 1);
  const toX = (i: number) => padL + (i / (monthly.length - 1)) * drawW;
  const toY = (v: number) => padT + drawH - (v / maxVal) * drawH;

  const incPoints = monthly.map((m, i) => `${toX(i)},${toY(m.income)}`).join(" ");
  const expPoints = monthly.map((m, i) => `${toX(i)},${toY(m.expense)}`).join(" ");

  const yLabels = [0, 0.25, 0.5, 0.75, 1].map(f => ({ val: maxVal * f, y: toY(maxVal * f) }));

  return (
    <ScrollView style={s.container} contentContainerStyle={[s.scroll, { paddingBottom: 80 }]}>
      <View style={s.header}>
        <Text style={s.pageTitle}>Raporlar</Text>
        <TouchableOpacity style={s.pdfBtn}>
          <Text style={s.pdfBtnText}>📋 PDF İndir</Text>
        </TouchableOpacity>
      </View>

      {/* 12 Aylık Trend Chart */}
      <View style={s.chartCard}>
        <Text style={s.cardTitle}>12 Aylık Trend</Text>
        <View style={s.legend}>
          <View style={s.legendItem}><View style={[s.dot, { backgroundColor: COLORS.income }]} /><Text style={s.legendText}>Gelir</Text></View>
          <View style={s.legendItem}><View style={[s.dot, { backgroundColor: COLORS.expense }]} /><Text style={s.legendText}>Gider</Text></View>
        </View>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Svg width={chartW} height={chartH} style={{ marginTop: 8 }}>
            {/* Grid lines */}
            {yLabels.map(({ val, y }, i) => (
              <React.Fragment key={i}>
                <Line x1={padL} y1={y} x2={chartW - padR} y2={y} stroke={COLORS.border} strokeWidth="1" strokeDasharray="4,4" />
                <SvgText x={padL - 4} y={y + 4} fill={COLORS.textMuted} fontSize="9" textAnchor="end">
                  {val >= 1000 ? `₺${(val / 1000).toFixed(0)}k` : `₺${val.toFixed(0)}`}
                </SvgText>
              </React.Fragment>
            ))}
            {/* Income line */}
            <Polyline points={incPoints} fill="none" stroke={COLORS.income} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {/* Expense line */}
            <Polyline points={expPoints} fill="none" stroke={COLORS.expense} strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
            {/* Data points */}
            {monthly.map((m, i) => (
              <React.Fragment key={m.key}>
                <Circle cx={toX(i)} cy={toY(m.income)} r="3" fill={COLORS.income} />
                <Circle cx={toX(i)} cy={toY(m.expense)} r="3" fill={COLORS.expense} />
                {/* X axis labels */}
                <SvgText x={toX(i)} y={chartH - 4} fill={COLORS.textMuted} fontSize="9" textAnchor="middle">
                  {m.label}
                </SvgText>
              </React.Fragment>
            ))}
          </Svg>
        </ScrollView>
      </View>

      {/* Monthly Summary Table */}
      <View style={s.tableCard}>
        <Text style={s.cardTitle}>Aylık Özet</Text>
        {/* Header */}
        <View style={s.tableHeader}>
          <Text style={[s.thCell, { flex: 1.5 }]}>Ay</Text>
          <Text style={[s.thCell, s.thRight]}>Gelir</Text>
          <Text style={[s.thCell, s.thRight]}>Gider</Text>
          <Text style={[s.thCell, s.thRight]}>Net</Text>
        </View>
        {/* Rows (newest first) */}
        {[...monthly].reverse().map((m) => (
          <View key={m.key} style={s.tableRow}>
            <Text style={[s.tdCell, { flex: 1.5 }]}>{m.label}</Text>
            <Text style={[s.tdCell, s.tdRight, { color: m.income > 0 ? COLORS.income : COLORS.textMuted }]}>
              {formatTRY(m.income)}
            </Text>
            <Text style={[s.tdCell, s.tdRight, { color: m.expense > 0 ? COLORS.expense : COLORS.textMuted }]}>
              {formatTRY(m.expense)}
            </Text>
            <Text style={[s.tdCell, s.tdRight, { color: m.net > 0 ? COLORS.income : m.net < 0 ? COLORS.expense : COLORS.textMuted }]}>
              {m.net > 0 ? "+" : ""}{formatTRY(m.net)}
            </Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  pageTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  pdfBtn: { backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  pdfBtnText: { color: "#000", fontWeight: "700", fontSize: 13 },
  chartCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14 },
  cardTitle: { color: COLORS.text, fontSize: 16, fontWeight: "800", marginBottom: 8 },
  legend: { flexDirection: "row", gap: 16, marginBottom: 4 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { color: COLORS.textSecondary, fontSize: 12 },
  tableCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: COLORS.border },
  tableHeader: { flexDirection: "row", paddingBottom: 10, borderBottomWidth: 1, borderColor: COLORS.border, marginBottom: 4 },
  thCell: { flex: 1, color: COLORS.textMuted, fontSize: 11, fontWeight: "700" },
  thRight: { textAlign: "right" },
  tableRow: { flexDirection: "row", paddingVertical: 11, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  tdCell: { flex: 1, color: COLORS.textSecondary, fontSize: 12, fontFamily: MONO },
  tdRight: { textAlign: "right" },
});
