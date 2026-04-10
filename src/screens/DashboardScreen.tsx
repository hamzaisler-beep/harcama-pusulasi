import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { useTransactions } from "../store/useStore";
import { useAuth } from "../store/useAuthStore";
import { logout } from "../services/authService";
import { COLORS } from "../types";
import { formatCurrency, formatDate } from "../utils/format";

export default function DashboardScreen({ navigation }: any) {
  const { transactions } = useTransactions();
  const { user } = useAuth();
  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  const { income, expense, balance } = useMemo(() => {
    const income = transactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + t.amount, 0);
    const expense = Math.abs(
      transactions
        .filter((t) => t.type === "expense")
        .reduce((s, t) => s + t.amount, 0)
    );
    return { income, expense, balance: income - expense };
  }, [transactions]);

  const chartData = useMemo(() => {
    const days = 7;
    const labels: string[] = [];
    const incomeData: number[] = [];
    const expenseData: number[] = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const ds = d.toISOString().split("T")[0];
      labels.push(
        d.toLocaleDateString("tr-TR", { day: "numeric", month: "short" })
      );
      incomeData.push(
        transactions
          .filter((t) => t.date === ds && t.type === "income")
          .reduce((s, t) => s + t.amount, 0)
      );
      expenseData.push(
        Math.abs(
          transactions
            .filter((t) => t.date === ds && t.type === "expense")
            .reduce((s, t) => s + t.amount, 0)
        )
      );
    }
    return { labels, incomeData, expenseData };
  }, [transactions]);

  const categoryTotals = useMemo(() => {
    const cats: Record<string, number> = {};
    transactions
      .filter((t) => t.type === "expense")
      .forEach((t) => {
        cats[t.category] = (cats[t.category] || 0) + Math.abs(t.amount);
      });
    return Object.entries(cats)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4);
  }, [transactions]);

  const recentTx = transactions.slice(0, 6);

  const StatCard = ({ title, value, type, icon }: any) => (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <View style={[styles.statIcon, { backgroundColor: type === "income" ? COLORS.incomeLight : COLORS.expenseLight }]}>
          <MaterialIcons name={icon} size={20} color={type === "income" ? COLORS.income : COLORS.expense} />
        </View>
        <Text style={styles.statTitle}>{title}</Text>
      </View>
      <Text style={[styles.statValue, { color: type === "income" ? COLORS.income : COLORS.textPrimary }]}>
        {formatCurrency(value)}
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[styles.scrollContent, isWeb && styles.webScrollContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Dashboard</Text>
            <Text style={styles.subGreeting}>Hoş geldin, {user?.displayName || "Kullanıcı"}</Text>
          </View>
          <View style={styles.headerBtnRow}>
            {!isWeb && (
              <TouchableOpacity style={styles.logoutBtn} onPress={() => logout()}>
                <MaterialIcons name="logout" size={20} color={COLORS.textSecondary} />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate("AddTransaction")}
            >
              <MaterialIcons name="add" size={24} color="#fff" />
              <Text style={styles.addBtnText}>İşlem Ekle</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Grid */}
        <View style={[styles.statsGrid, isWeb && styles.webStatsGrid]}>
          <StatCard title="Net Bakiye" value={balance} type="balance" icon="account-balance" />
          <StatCard title="Aylık Gelir" value={income} type="income" icon="arrow-upward" />
          <StatCard title="Aylık Gider" value={expense} type="expense" icon="arrow-downward" />
        </View>

        {/* Main Content Layout */}
        <View style={[styles.mainLayout, isWeb && styles.webMainLayout]}>
          <View style={styles.leftCol}>
            {/* Chart Card */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Harcama Analizi</Text>
                <Text style={styles.cardSub}>Son 7 Günlük Veri</Text>
              </View>
              {transactions.length > 0 ? (
                <LineChart
                  data={{
                    labels: chartData.labels,
                    datasets: [
                      { data: chartData.expenseData, color: () => COLORS.expense, strokeWidth: 3 },
                      { data: chartData.incomeData, color: () => COLORS.income, strokeWidth: 2, withDots: false },
                    ],
                  }}
                  width={isWeb ? width - 360 : width - 40}
                  height={220}
                  chartConfig={{
                    backgroundGradientFrom: COLORS.card,
                    backgroundGradientTo: COLORS.card,
                    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                    labelColor: () => COLORS.textSecondary,
                    strokeWidth: 2,
                    barPercentage: 0.5,
                    useShadowColorFromDataset: false,
                    decimalPlaces: 0,
                    propsForDots: { r: "4", strokeWidth: "2", stroke: COLORS.card },
                  }}
                  bezier
                  style={styles.chart}
                  withInnerLines={false}
                />
              ) : (
                <View style={[styles.emptyState, { height: 200 }]}>
                    <Text style={styles.emptyText}>Veri bulunamadı</Text>
                </View>
              )}
            </View>

            {/* Quick Actions (Web Only or as widget) */}
            {isWeb && (
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Hızlı İşlemler</Text>
                    <View style={styles.quickActions}>
                        {["Gıda", "Ulaşım", "Kira", "Market"].map(cat => (
                            <TouchableOpacity key={cat} style={styles.quickActionBtn}>
                                <Text style={styles.quickActionText}>{cat}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                </View>
            )}
          </View>

          <View style={styles.rightCol}>
            {/* Recent Transactions */}
            <View style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>Son İşlemler</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Transactions")}>
                  <Text style={styles.seeAll}>Tümünü Gör</Text>
                </TouchableOpacity>
              </View>
              {recentTx.length === 0 ? (
                <View style={styles.emptyState}>
                  <Text style={styles.emptyText}>Henüz işlem yok</Text>
                </View>
              ) : (
                recentTx.map((t) => (
                  <View key={t.id} style={styles.txRow}>
                    <View style={[styles.txDot, { backgroundColor: t.type === "income" ? COLORS.incomeLight : COLORS.expenseLight }]} />
                    <View style={styles.txInfo}>
                      <Text style={styles.txDesc} numberOfLines={1}>{t.description}</Text>
                      <Text style={styles.txDate}>{formatDate(t.date)}</Text>
                    </View>
                    <Text style={[styles.txAmount, { color: t.type === "income" ? COLORS.income : COLORS.textPrimary }]}>
                      {t.type === "income" ? "+" : "-"}{formatCurrency(Math.abs(t.amount))}
                    </Text>
                  </View>
                ))
              )}
            </View>

            {/* Categories */}
            {categoryTotals.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Kategori Bazlı</Text>
                <View style={styles.catList}>
                  {categoryTotals.map(([cat, val], i) => {
                    const pct = expense > 0 ? Math.round((val / expense) * 100) : 0;
                    return (
                      <View key={i} style={styles.catRow}>
                        <View style={styles.catHeader}>
                          <Text style={styles.catName}>{cat}</Text>
                          <Text style={styles.catVal}>{formatCurrency(val)}</Text>
                        </View>
                        <View style={styles.progressBg}>
                          <View style={[styles.progressFill, { width: `${pct}%` }]} />
                        </View>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  webScrollContent: { padding: 32 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 32,
  },
  greeting: { fontSize: 24, fontWeight: "800", color: COLORS.textPrimary, letterSpacing: -0.5 },
  subGreeting: { fontSize: 14, color: COLORS.textSecondary, marginTop: 4 },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
    gap: 8,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  headerBtnRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoutBtn: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statsGrid: { gap: 16, marginBottom: 24 },
  webStatsGrid: { flexDirection: "row" },
  statCard: {
    flex: 1,
    backgroundColor: COLORS.card,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  statHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  statIcon: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statTitle: { fontSize: 14, color: COLORS.textSecondary, fontWeight: "500" },
  statValue: { fontSize: 22, fontWeight: "800", letterSpacing: -0.5 },
  mainLayout: { gap: 24 },
  webMainLayout: { flexDirection: "row" },
  leftCol: { flex: 2, gap: 24 },
  rightCol: { flex: 1, gap: 24 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardHeader: { marginBottom: 20 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary },
  cardSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  chart: { marginTop: 16, marginLeft: -16 },
  txRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  txDot: { width: 8, height: 8, borderRadius: 4, marginRight: 16 },
  txInfo: { flex: 1, gap: 4 },
  txDesc: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  txDate: { fontSize: 12, color: COLORS.textMuted },
  txAmount: { fontSize: 15, fontWeight: "700" },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: "600" },
  catList: { gap: 16 },
  catRow: { gap: 8 },
  catHeader: { flexDirection: "row", justifyContent: "space-between" },
  catName: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  catVal: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  progressBg: { height: 6, backgroundColor: COLORS.background, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, backgroundColor: COLORS.primary, borderRadius: 3 },
  emptyState: { alignItems: "center", justifyContent: "center" },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
  quickActions: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 8 },
  quickActionBtn: { backgroundColor: COLORS.background, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border },
  quickActionText: { color: COLORS.textSecondary, fontSize: 12, fontWeight: "500" },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flex: 1 },
  scrollContent: { padding: 20, paddingBottom: 32 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  greeting: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary },
  subGreeting: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBtnRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  logoutBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  balanceCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
  },
  balanceLabel: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  balanceValue: { fontSize: 32, fontWeight: "700", color: "#fff", marginTop: 4, marginBottom: 16 },
  balanceRow: { flexDirection: "row", alignItems: "center" },
  balanceItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  separator: { width: 1, height: 36, backgroundColor: "rgba(255,255,255,0.2)", marginHorizontal: 12 },
  balanceItemLabel: { fontSize: 11, color: "rgba(255,255,255,0.6)" },
  balanceItemValue: { fontSize: 14, fontWeight: "700", marginTop: 1 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: COLORS.textPrimary, marginBottom: 4 },
  seeAll: { fontSize: 13, color: COLORS.primary, fontWeight: "500" },
  catRow: { marginBottom: 12 },
  catInfo: { flexDirection: "row", justifyContent: "space-between", marginBottom: 4 },
  catName: { fontSize: 13, color: COLORS.textPrimary, fontWeight: "500" },
  catPct: { fontSize: 12, color: COLORS.textSecondary },
  progressBg: { height: 5, backgroundColor: COLORS.background, borderRadius: 3, overflow: "hidden", marginBottom: 2 },
  progressFill: { height: 5, backgroundColor: COLORS.primary, borderRadius: 3 },
  catVal: { fontSize: 11, color: COLORS.textSecondary, textAlign: "right" },
  txRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  txIcon: { width: 38, height: 38, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, fontWeight: "500", color: COLORS.textPrimary },
  txDate: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: "700" },
  emptyState: { alignItems: "center", paddingVertical: 24 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8, marginBottom: 12 },
  emptyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: 20, paddingVertical: 10, borderRadius: 20 },
  emptyBtnText: { color: "#fff", fontWeight: "600", fontSize: 13 },
});
