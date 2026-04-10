// src/screens/DashboardScreen.tsx
import React, { useMemo } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { useTransactions } from "../store/useStore";
import { useAuth } from "../store/useAuthStore";
import { logout } from "../services/authService";
import { COLORS } from "../types";
import { formatCurrency, formatDate } from "../utils/format";

const { width } = Dimensions.get("window");

export default function DashboardScreen({ navigation }: any) {
  const { transactions } = useTransactions();
  const { user } = useAuth();

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

  const recentTx = transactions.slice(0, 5);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Hoş Geldin, {user?.displayName || "Misafir"} 👋</Text>
            <Text style={styles.subGreeting}>Finansal durumuna genel bakış</Text>
          </View>
          <View style={styles.headerBtnRow}>
            <TouchableOpacity
              style={styles.logoutBtn}
              onPress={() => logout()}
            >
              <MaterialIcons name="logout" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.addBtn}
              onPress={() => navigation.navigate("AddTransaction")}
            >
              <MaterialIcons name="add" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Net Bakiye</Text>
          <Text style={styles.balanceValue}>{formatCurrency(balance)}</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <View style={[styles.dot, { backgroundColor: COLORS.incomeLight }]}>
                <MaterialIcons name="trending-up" size={16} color={COLORS.income} />
              </View>
              <View>
                <Text style={styles.balanceItemLabel}>Gelir</Text>
                <Text style={[styles.balanceItemValue, { color: COLORS.income }]}>
                  {formatCurrency(income)}
                </Text>
              </View>
            </View>
            <View style={styles.separator} />
            <View style={styles.balanceItem}>
              <View style={[styles.dot, { backgroundColor: COLORS.expenseLight }]}>
                <MaterialIcons name="trending-down" size={16} color={COLORS.expense} />
              </View>
              <View>
                <Text style={styles.balanceItemLabel}>Gider</Text>
                <Text style={[styles.balanceItemValue, { color: COLORS.expense }]}>
                  {formatCurrency(expense)}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Chart */}
        {transactions.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Son 7 Gün</Text>
            <LineChart
              data={{
                labels: chartData.labels,
                datasets: [
                  { data: chartData.expenseData, color: () => COLORS.primary, strokeWidth: 2 },
                  { data: chartData.incomeData, color: () => COLORS.income, strokeWidth: 2 },
                ],
                legend: ["Gider", "Gelir"],
              }}
              width={width - 64}
              height={160}
              chartConfig={{
                backgroundColor: COLORS.card,
                backgroundGradientFrom: COLORS.card,
                backgroundGradientTo: COLORS.card,
                decimalPlaces: 0,
                color: (opacity = 1) => `rgba(24, 95, 165, ${opacity})`,
                labelColor: () => COLORS.textSecondary,
                style: { borderRadius: 12 },
                propsForDots: { r: "3" },
              }}
              bezier
              style={{ borderRadius: 8, marginTop: 8 }}
              withInnerLines={false}
              withOuterLines={false}
            />
          </View>
        )}

        {/* Categories */}
        {categoryTotals.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>En Yüksek Giderler</Text>
            {categoryTotals.map(([cat, val], i) => {
              const pct = expense > 0 ? Math.round((val / expense) * 100) : 0;
              return (
                <View key={i} style={styles.catRow}>
                  <View style={styles.catInfo}>
                    <Text style={styles.catName}>{cat}</Text>
                    <Text style={styles.catPct}>%{pct}</Text>
                  </View>
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: `${pct}%` }]} />
                  </View>
                  <Text style={styles.catVal}>{formatCurrency(val)}</Text>
                </View>
              );
            })}
          </View>
        )}

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
              <MaterialIcons name="receipt-long" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Henüz işlem yok</Text>
              <TouchableOpacity
                style={styles.emptyBtn}
                onPress={() => navigation.navigate("AddTransaction")}
              >
                <Text style={styles.emptyBtnText}>İşlem Ekle</Text>
              </TouchableOpacity>
            </View>
          ) : (
            recentTx.map((t) => (
              <View key={t.id} style={styles.txRow}>
                <View
                  style={[
                    styles.txIcon,
                    {
                      backgroundColor:
                        t.type === "income" ? COLORS.incomeLight : COLORS.expenseLight,
                    },
                  ]}
                >
                  <MaterialIcons
                    name={t.type === "income" ? "arrow-upward" : "arrow-downward"}
                    size={18}
                    color={t.type === "income" ? COLORS.income : COLORS.expense}
                  />
                </View>
                <View style={styles.txInfo}>
                  <Text style={styles.txDesc} numberOfLines={1}>
                    {t.description}
                  </Text>
                  <Text style={styles.txDate}>{formatDate(t.date)}</Text>
                </View>
                <Text
                  style={[
                    styles.txAmount,
                    { color: t.type === "income" ? COLORS.income : COLORS.textPrimary },
                  ]}
                >
                  {t.type === "income" ? "+" : "-"}
                  {formatCurrency(Math.abs(t.amount))}
                </Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

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
