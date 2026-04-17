// src/screens/BillsScreen.tsx
import React, { useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions 
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { format, startOfMonth, endOfMonth, isWithinInterval, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { store } from "../store";
import { COLORS } from "../theme/constants";

const { width } = Dimensions.get("window");

// Define expected recurring bills (The user can manage these later)
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
    const transactions = store.transactions || [];
    const now = new Date();
    const start = startOfMonth(now);
    const end = endOfMonth(now);

    // Filter transactions for this month and category "Faturalar" (or matching recurrent titles)
    const billTransactions = useMemo(() => {
        return transactions.filter(t => {
            const txDate = parseISO(t.date);
            const isInMonth = isWithinInterval(txDate, { start, end });
            const isBillCategory = t.category === "Faturalar";
            // Also match by recurring titles just in case
            const isRecurringMatch = RECURRING_BILLS.some(rb => t.description.toLowerCase().includes(rb.title.toLowerCase()));
            return isInMonth && (isBillCategory || isRecurringMatch);
        });
    }, [transactions, start, end]);

    // Merge Recurring Bills with actual payments
    const mergedBills = useMemo(() => {
        return RECURRING_BILLS.map(rb => {
            const payment = billTransactions.find(t => t.description.toLowerCase().includes(rb.title.toLowerCase()) || (t.category === "Faturalar" && t.amount === rb.amount));
            const isPaid = !!payment;
            const remainingDays = rb.day - now.getDate();
            
            let status = "Bekliyor";
            if (isPaid) status = "Ödendi";
            else if (remainingDays < 0) status = "Gecikti";
            else if (remainingDays === 0) status = "Bugün";
            else status = `${remainingDays} gün kaldı`;

            return {
                ...rb,
                isPaid,
                status,
                paidAmount: payment?.amount,
                paidDate: payment?.date,
                upcoming: !isPaid && remainingDays >= 0 && remainingDays <= 7
            };
        });
    }, [billTransactions, now]);

    const totalExpected = RECURRING_BILLS.reduce((acc, b) => acc + b.amount, 0);
    const paidAmount = billTransactions.reduce((acc, t) => acc + t.amount, 0);
    const paidCount = mergedBills.filter(b => b.isPaid).length;

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollInside} showsVerticalScrollIndicator={false}>
            {/* Top Stat Row */}
            <View style={styles.statRow}>
                <BillStatBox title="Aylık Beklenen" value={`₺${new Intl.NumberFormat("tr-TR").format(totalExpected)}`} color={COLORS.text} icon="description" />
                <BillStatBox title="Bu Ay Ödendi" value={`₺${new Intl.NumberFormat("tr-TR").format(paidAmount)}`} color={COLORS.income} icon="check-circle" />
                <BillStatBox title="Ödeme Durumu" value={`${paidCount}/${RECURRING_BILLS.length}`} color={COLORS.warning} icon="pie-chart" />
            </View>

            <View style={styles.grid}>
                {/* Left: Upcoming Bills */}
                <View style={[styles.panel, { flex: 1 }]}>
                    <Text style={styles.panelTitle}>YAKLAŞAN ÖDEMELER</Text>
                    {mergedBills.filter(b => b.upcoming && !b.isPaid).length === 0 ? (
                        <View style={styles.emptyState}>
                            <MaterialIcons name="done-all" size={40} color={COLORS.income} opacity={0.3} />
                            <Text style={styles.emptyText}>Bu hafta ödemeniz bulunmuyor.</Text>
                        </View>
                    ) : (
                        mergedBills.filter(b => b.upcoming && !b.isPaid).map(b => (
                            <View key={b.id} style={styles.upcomingCard}>
                                <View style={styles.billIconBoxLarge}>
                                    <MaterialIcons name={b.icon as any} size={28} color={COLORS.textSecondary} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.billTitleLarge}>{b.title}</Text>
                                    <Text style={styles.billMetaLarge}>
                                        Her ayın {b.day}. günü • <Text style={{ color: COLORS.warning, fontWeight: '700' }}>{b.status}</Text>
                                    </Text>
                                </View>
                                <View style={{ alignItems: 'flex-end' }}>
                                    <Text style={styles.billAmountLarge}>₺{new Intl.NumberFormat("tr-TR").format(b.amount)}</Text>
                                </View>
                            </View>
                        ))
                    )}
                </View>

                {/* Right: All Bills Details from Transactions */}
                <View style={[styles.panel, { flex: 1.2 }]}>
                    <Text style={styles.panelTitle}>FATURA TÜM DETAYLARI</Text>
                    <View style={styles.billList}>
                        {mergedBills.map(b => (
                            <View key={b.id} style={[styles.billRow, b.isPaid && { borderColor: COLORS.income + '40' }]}>
                                <View style={[styles.billIconBoxSmall, b.isPaid && { backgroundColor: COLORS.income + '10' }]}>
                                    <MaterialIcons name={b.icon as any} size={18} color={b.isPaid ? COLORS.income : COLORS.textMuted} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.billHeaderRow}>
                                        <Text style={styles.billTitleSmall}>{b.title}</Text>
                                        <Text style={[styles.billAmountSmall, b.isPaid && { color: COLORS.income }]}>
                                            ₺{new Intl.NumberFormat("tr-TR").format(b.isPaid ? b.paidAmount : b.amount)}
                                        </Text>
                                    </View>
                                    <View style={styles.billInfoRow}>
                                        <Text style={styles.billMetaSmall}>
                                            {b.isPaid ? `Ödenen: ${format(parseISO(b.paidDate!), "d MMM", { locale: tr })}` : `Beklenen: Her ayın ${b.day}. günü`}
                                        </Text>
                                        <View style={[styles.statusPill, { backgroundColor: b.isPaid ? COLORS.income + '20' : COLORS.expense + '20' }]}>
                                            <Text style={[styles.statusText, { color: b.isPaid ? COLORS.income : COLORS.expense }]}>
                                                {b.status}
                                            </Text>
                                        </View>
                                    </View>
                                </View>
                            </View>
                        ))}

                        {/* Additional Manual Bill Transactions from 'Faturalar' category that don't match recurring */}
                        {billTransactions.filter(bt => !RECURRING_BILLS.some(rb => bt.description.toLowerCase().includes(rb.title.toLowerCase()))).map((bt, idx) => (
                            <View key={`manual-${idx}`} style={[styles.billRow, { borderColor: COLORS.income + '40' }]}>
                                <View style={[styles.billIconBoxSmall, { backgroundColor: COLORS.income + '10' }]}>
                                    <MaterialIcons name="receipt" size={18} color={COLORS.income} />
                                </View>
                                <View style={{ flex: 1 }}>
                                    <View style={styles.billHeaderRow}>
                                        <Text style={styles.billTitleSmall}>{bt.description}</Text>
                                        <Text style={[styles.billAmountSmall, { color: COLORS.income }]}>₺{new Intl.NumberFormat("tr-TR").format(bt.amount)}</Text>
                                    </View>
                                    <View style={styles.billInfoRow}>
                                        <Text style={styles.billMetaSmall}>Eklendi: {format(parseISO(bt.date), "d MMM", { locale: tr })}</Text>
                                        <View style={[styles.statusPill, { backgroundColor: COLORS.income + '20' }]}><Text style={[styles.statusText, { color: COLORS.income }]}>Ödendi</Text></View>
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

const BillStatBox = ({ title, value, color, icon }: any) => (
    <View style={styles.statBox}>
        <View style={{ flex: 1 }}>
            <Text style={styles.statBoxTitle}>{title}</Text>
            <Text style={[styles.statBoxValue, { color }]}>{value}</Text>
        </View>
        <View style={styles.statIconCircle}>
            <MaterialIcons name={icon} size={20} color={color} />
        </View>
    </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollInside: { padding: 32 },
  statRow: { flexDirection: "row", gap: 16, marginBottom: 32 },
  statBox: { flex: 1, backgroundColor: COLORS.card, borderRadius: 16, padding: 20, flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  statBoxTitle: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600", marginBottom: 6 },
  statBoxValue: { fontSize: 22, fontWeight: "900", fontFamily: "Space Mono, monospace" },
  statIconCircle: { width: 40, height: 40, borderRadius: 20, backgroundColor: "rgba(255,255,255,0.03)", alignItems: "center", justifyContent: "center" },
  grid: { flexDirection: "row", gap: 24 },
  panel: { backgroundColor: COLORS.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  panelTitle: { fontSize: 11, color: COLORS.textMuted, fontWeight: "700", letterSpacing: 1.2, marginBottom: 24 },
  upcomingCard: { flexDirection: "row", alignItems: "center", backgroundColor: "rgba(255,255,255,0.02)", padding: 20, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", gap: 16, marginBottom: 12 },
  billIconBoxLarge: { width: 52, height: 52, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.03)", alignItems: "center", justifyContent: "center" },
  billTitleLarge: { color: "#fff", fontSize: 16, fontWeight: "700" },
  billMetaLarge: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  billAmountLarge: { color: COLORS.warning, fontSize: 18, fontWeight: "900", fontFamily: "Space Mono, monospace" },
  billList: { gap: 12 },
  billRow: { flexDirection: "row", alignItems: "center", padding: 16, backgroundColor: "rgba(255,255,255,0.02)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.03)", gap: 16 },
  billIconBoxSmall: { width: 36, height: 36, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.03)", alignItems: "center", justifyContent: "center" },
  billHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 4 },
  billTitleSmall: { color: "#fff", fontSize: 14, fontWeight: "600" },
  billAmountSmall: { color: COLORS.expense, fontSize: 14, fontWeight: "800", fontFamily: "Space Mono, monospace" },
  billInfoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  billMetaSmall: { fontSize: 11, color: COLORS.textMuted },
  statusPill: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4 },
  statusText: { fontSize: 10, fontWeight: "700" },
  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 40 },
  emptyText: { color: COLORS.textMuted, fontSize: 13, marginTop: 12 },
});
