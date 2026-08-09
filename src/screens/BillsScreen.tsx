// src/screens/BillsScreen.tsx
import React, { useMemo } from "react";
import { View, Text, StyleSheet, ScrollView, useWindowDimensions } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { store } from "../store";
import { COLORS, MONO } from "../theme/constants";

const RECURRING_BILLS = [
  { id: "sigorta", title: "Sigorta", day: 1, amount: 1200, icon: "security" },
  { id: "elektrik", title: "Elektrik", day: 4, amount: 680, icon: "bolt" },
  { id: "dogalgaz", title: "Doğalgaz", day: 5, amount: 920, icon: "local-fire-department" },
  { id: "netflix", title: "Netflix", day: 8, amount: 139, icon: "movie" },
  { id: "su", title: "Su", day: 10, amount: 180, icon: "opacity" },
  { id: "internet", title: "İnternet", day: 15, amount: 399, icon: "router" },
  { id: "spotify", title: "Spotify", day: 20, amount: 59, icon: "music-note" },
];

export default function BillsScreen() {
  const { width } = useWindowDimensions();
  const mob = width < 600;

  const transactions = store.transactions || [];
  const now = new Date();
  const start = startOfMonth(now);
  const end = endOfMonth(now);

  const billTransactions = useMemo(() => {
    return transactions.filter((t) => {
      try {
        const txDate = parseISO(t.date);
        const isInMonth = isWithinInterval(txDate, { start, end });
        const isBillCategory = t.category === "Faturalar";
        const isRecurringMatch = RECURRING_BILLS.some((rb) =>
          t.description.toLowerCase().includes(rb.title.toLowerCase())
        );
        return isInMonth && (isBillCategory || isRecurringMatch);
      } catch {
        return false;
      }
    });
  }, [transactions]);

  const mergedBills = useMemo(() => {
    return RECURRING_BILLS.map((rb) => {
      const payment = billTransactions.find(
        (t) =>
          t.description.toLowerCase().includes(rb.title.toLowerCase()) ||
          (t.category === "Faturalar" && t.amount === rb.amount)
      );
      const isPaid = !!payment;
      const remainingDays = rb.day - now.getDate();
      let status = "Bekliyor";
      if (isPaid) status = "Ödendi";
      else if (remainingDays < 0) status = "Gecikti";
      else if (remainingDays === 0) status = "Bugün";
      else status = `${remainingDays} gün`;
      return { ...rb, isPaid, status, paidAmount: payment?.amount, paidDate: payment?.date, upcoming: !isPaid && remainingDays >= 0 && remainingDays <= 7 };
    });
  }, [billTransactions]);

  const totalExpected = RECURRING_BILLS.reduce((acc, b) => acc + b.amount, 0);
  const paidAmount = billTransactions.reduce((acc, t) => acc + t.amount, 0);
  const paidCount = mergedBills.filter((b) => b.isPaid).length;

  const pad = mob ? 16 : 32;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: pad }} showsVerticalScrollIndicator={false}>
      {/* Top Stat Row */}
      <View style={[styles.statRow, mob && { flexDirection: "column", gap: 10 }]}>
        <BillStatBox title="Aylık Beklenen" value={`₺${new Intl.NumberFormat("tr-TR").format(totalExpected)}`} color={COLORS.text} icon="description" mob={mob} />
        <BillStatBox title="Bu Ay Ödendi" value={`₺${new Intl.NumberFormat("tr-TR").format(paidAmount)}`} color={COLORS.income} icon="check-circle" mob={mob} />
        <BillStatBox title="Ödeme Durumu" value={`${paidCount}/${RECURRING_BILLS.length}`} color={COLORS.warning} icon="pie-chart" mob={mob} />
      </View>

      <View style={[styles.grid, mob && { flexDirection: "column", gap: 16 }]}>
        {/* Yaklaşan Ödemeler */}
        <View style={[styles.panel, { flex: 1 }, mob && { minWidth: 0 }]}>
          <Text style={styles.panelTitle}>YAKLAŞAN ÖDEMELER</Text>
          {mergedBills.filter((b) => b.upcoming && !b.isPaid).length === 0 ? (
            <View style={styles.emptyState}>
              <MaterialIcons name="done-all" size={36} color={COLORS.income} opacity={0.3} />
              <Text style={styles.emptyText}>Bu hafta ödemeniz bulunmuyor.</Text>
            </View>
          ) : (
            mergedBills.filter((b) => b.upcoming && !b.isPaid).map((b) => (
              <View key={b.id} style={styles.upcomingCard}>
                <View style={styles.billIconBoxLarge}>
                  <MaterialIcons name={b.icon as any} size={24} color={COLORS.textSecondary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.billTitleLarge}>{b.title}</Text>
                  <Text style={styles.billMetaLarge}>
                    Her ayın {b.day}. günü · <Text style={{ color: COLORS.warning, fontWeight: "700" }}>{b.status}</Text>
                  </Text>
                </View>
                <Text style={styles.billAmountLarge}>₺{new Intl.NumberFormat("tr-TR").format(b.amount)}</Text>
              </View>
            ))
          )}
        </View>

        {/* Fatura Detayları */}
        <View style={[styles.panel, { flex: 1.2 }, mob && { minWidth: 0 }]}>
          <Text style={styles.panelTitle}>FATURA DETAYLARI</Text>
          <View style={styles.billList}>
            {mergedBills.map((b) => (
              <View key={b.id} style={[styles.billRow, b.isPaid && { borderColor: COLORS.income + "40" }]}>
                <View style={[styles.billIconBoxSmall, b.isPaid && { backgroundColor: COLORS.income + "10" }]}>
                  <MaterialIcons name={b.icon as any} size={16} color={b.isPaid ? COLORS.income : COLORS.textMuted} />
                </View>
                <View style={{ flex: 1, minWidth: 0 }}>
                  <View style={styles.billHeaderRow}>
                    <Text style={styles.billTitleSmall} numberOfLines={1}>{b.title}</Text>
                    <Text style={[styles.billAmountSmall, b.isPaid && { color: COLORS.income }]}>
                      ₺{new Intl.NumberFormat("tr-TR").format(b.isPaid ? (b.paidAmount ?? 0) : b.amount)}
                    </Text>
                  </View>
                  <View style={styles.billInfoRow}>
                    <Text style={styles.billMetaSmall} numberOfLines={1}>
                      {b.isPaid
                        ? `Ödendi: ${format(parseISO(b.paidDate!), "d MMM", { locale: tr })}`
                        : `Her ayın ${b.day}. günü`}
                    </Text>
                    <View style={[styles.statusPill, { backgroundColor: b.isPaid ? COLORS.income + "20" : COLORS.expense + "20" }]}>
                      <Text style={[styles.statusText, { color: b.isPaid ? COLORS.income : COLORS.expense }]}>{b.status}</Text>
                    </View>
                  </View>
                </View>
              </View>
            ))}
            {billTransactions
              .filter((bt) => !RECURRING_BILLS.some((rb) => bt.description.toLowerCase().includes(rb.title.toLowerCase())))
              .map((bt, idx) => (
                <View key={`manual-${idx}`} style={[styles.billRow, { borderColor: COLORS.income + "40" }]}>
                  <View style={[styles.billIconBoxSmall, { backgroundColor: COLORS.income + "10" }]}>
                    <MaterialIcons name="receipt" size={16} color={COLORS.income} />
                  </View>
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <View style={styles.billHeaderRow}>
                      <Text style={styles.billTitleSmall} numberOfLines={1}>{bt.description}</Text>
                      <Text style={[styles.billAmountSmall, { color: COLORS.income }]}>₺{new Intl.NumberFormat("tr-TR").format(bt.amount)}</Text>
                    </View>
                    <View style={styles.billInfoRow}>
                      <Text style={styles.billMetaSmall}>{format(parseISO(bt.date), "d MMM", { locale: tr })}</Text>
                      <View style={[styles.statusPill, { backgroundColor: COLORS.income + "20" }]}><Text style={[styles.statusText, { color: COLORS.income }]}>Ödendi</Text></View>
                    </View>
                  </View>
                </View>
              ))}
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const BillStatBox = ({ title, value, color, icon, mob }: any) => (
  <View style={[styles.statBox, mob && { flexDirection: "row", padding: 14, alignItems: "center" }]}>
    <View style={{ flex: 1 }}>
      <Text style={styles.statBoxTitle}>{title}</Text>
      <Text style={[styles.statBoxValue, { color }, mob && { fontSize: 18 }]}>{value}</Text>
    </View>
    <View style={styles.statIconCircle}>
      <MaterialIcons name={icon} size={18} color={color} />
    </View>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  statRow: { flexDirection: "row", gap: 14, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: COLORS.card, borderRadius: 14, padding: 18, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  statBoxTitle: { fontSize: 11, color: COLORS.textMuted, fontWeight: "600", marginBottom: 4 },
  statBoxValue: { fontSize: 20, fontWeight: "900", fontFamily: MONO },
  statIconCircle: { width: 36, height: 36, borderRadius: 18, backgroundColor: "rgba(255,255,255,0.03)", alignItems: "center", justifyContent: "center" },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 20 },
  panel: { minWidth: 300, backgroundColor: COLORS.card, borderRadius: 18, padding: 20, borderWidth: 1, borderColor: COLORS.border },
  panelTitle: { fontSize: 11, color: COLORS.textMuted, fontWeight: "700", letterSpacing: 1.2, marginBottom: 20 },
  upcomingCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.02)", padding: 16, borderRadius: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", gap: 12, marginBottom: 10 },
  billIconBoxLarge: { width: 44, height: 44, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.03)", alignItems: "center", justifyContent: "center" },
  billTitleLarge: { color: "#fff", fontSize: 14, fontWeight: "700" },
  billMetaLarge: { fontSize: 11, color: COLORS.textMuted, marginTop: 3 },
  billAmountLarge: { color: COLORS.warning, fontSize: 16, fontWeight: "900", fontFamily: MONO },
  billList: { gap: 10 },
  billRow: { flexDirection: "row", alignItems: "center", padding: 14, backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.03)", gap: 12 },
  billIconBoxSmall: { width: 32, height: 32, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.03)", alignItems: "center", justifyContent: "center" },
  billHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 3, gap: 8 },
  billTitleSmall: { color: "#fff", fontSize: 13, fontWeight: "600", flex: 1 },
  billAmountSmall: { color: COLORS.expense, fontSize: 13, fontWeight: "800", fontFamily: MONO },
  billInfoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  billMetaSmall: { fontSize: 11, color: COLORS.textMuted, flex: 1 },
  statusPill: { paddingHorizontal: 7, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: "700" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 32 },
  emptyText: { color: COLORS.textMuted, fontSize: 12, marginTop: 10 },
});
