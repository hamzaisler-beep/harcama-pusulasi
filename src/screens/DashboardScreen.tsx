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
import { BarChart, PieChart } from "react-native-chart-kit";
import { useTransactions, useSavings, useBudgets } from "../store/useStore";
import { COLORS } from "../types";
import { formatCurrency } from "../utils/format";
import { startOfMonth, endOfMonth, isWithinInterval, subMonths, format } from "date-fns";
import { tr } from "date-fns/locale";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function DashboardScreen({ navigation }: any) {
  const { transactions } = useTransactions();
  const { savings } = useSavings();
  const { budgets } = useBudgets();
  const { width } = useWindowDimensions();
  const isWeb = width > 1024;

  const now = new Date();
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const { monthIncome, monthExpense, totalBalance } = useMemo(() => {
    const monthTxs = transactions.filter(t => {
        const d = new Date(t.date);
        return isWithinInterval(d, { start: monthStart, end: monthEnd });
    });

    const mInc = monthTxs
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const mExp = monthTxs
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0);
    
    const totalInc = transactions
      .filter((t) => t.type === "income")
      .reduce((s, t) => s + Number(t.amount || 0), 0);
    const totalExp = transactions
      .filter((t) => t.type === "expense")
      .reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0);

    return { 
      monthIncome: mInc, 
      monthExpense: mExp, 
      totalBalance: totalInc - totalExp 
    };
  }, [transactions]);

  const totalSavings = useMemo(() => {
    return savings.reduce((sum, s) => sum + Number(s.amount || 0) * 32, 0); // Mock rate
  }, [savings]);

  const recentTx = useMemo(() => transactions.slice(0, 6), [transactions]);

  // CATEGORY DATA FOR PIE CHART
  const categoryData = useMemo(() => {
    const cats: Record<string, number> = {};
    const monthTxs = transactions.filter(t => {
        const d = new Date(t.date);
        return isWithinInterval(d, { start: monthStart, end: monthEnd }) && t.type === "expense";
    });

    monthTxs.forEach(t => {
        cats[t.category] = (cats[t.category] || 0) + Math.abs(Number(t.amount || 0));
    });

    const colors = [COLORS.expense, COLORS.primary, COLORS.amber, "#6366f1", "#a855f7", "#ec4899"];
    return Object.entries(cats)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([name, amount], i) => ({
            name,
            amount,
            color: colors[i % colors.length],
            legendFontColor: "#7F7F7F"
        }));
  }, [transactions]);

  // BAR DATA FOR LAST 6 MONTHS
  const barData = useMemo(() => {
    const labels = [];
    const incomeData = [];
    const expenseData = [];

    for (let i = 5; i >= 0; i--) {
        const d = subMonths(now, i);
        labels.push(format(d, "MMM", { locale: tr }));
        const s = startOfMonth(d);
        const e = endOfMonth(d);

        const rangeTxs = transactions.filter(t => {
            const td = new Date(t.date);
            return isWithinInterval(td, { start: s, end: e });
        });

        incomeData.push(rangeTxs.filter(t => t.type === "income").reduce((acc, t) => acc + Number(t.amount || 0), 0));
        expenseData.push(rangeTxs.filter(t => t.type === "expense").reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0));
    }

    return {
        labels,
        datasets: [
            { data: incomeData, color: (opacity = 1) => `rgba(34, 197, 94, ${opacity})` },
            { data: expenseData, color: (opacity = 1) => `rgba(244, 63, 94, ${opacity})` }
        ],
    };
  }, [transactions]);


  const chartConfig = {
    backgroundGradientFrom: "#111",
    backgroundGradientTo: "#111",
    color: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
    strokeWidth: 2,
    barPercentage: 0.6,
    useShadowColorFromDataset: false,
    decimalPlaces: 0,
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, isWeb && styles.webScrollContent]}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
            <View>
                <Text style={styles.pageTitle}>Dashboard</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: '#22c55e' }} />
                    <Text style={{ fontSize: 11, color: '#22c55e', fontWeight: '800' }}>v1.4 - CANLI AKTIF</Text>
                </View>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity style={styles.headerIconBtn}>
                    <MaterialIcons name="notifications-none" size={20} color={COLORS.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity 
                    style={styles.addBtn}
                    onPress={() => navigation.navigate("AddTransaction")}
                >
                    <MaterialIcons name="add" size={18} color="#fff" />
                    <Text style={styles.addBtnText}>Ekle</Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* Main Balance Card */}
        <View style={styles.mainCard}>
          <Text style={styles.mainCardLabel}>GÜNCEL TOPLAM BAKİYE</Text>
          <Text style={styles.mainCardValue}>{formatCurrency(totalBalance)}</Text>
          
          <View style={styles.divider} />
          
          <View style={styles.miniStatsRow}>
            <View style={styles.miniStat}>
              <View style={[styles.miniIcon, { backgroundColor: COLORS.income + "20" }]}>
                <MaterialIcons name="trending-up" size={12} color={COLORS.income} />
              </View>
              <View>
                <Text style={styles.miniLabel}>Bu Ay Gelir</Text>
                <Text style={[styles.miniValue, { color: COLORS.income }]}>{formatCurrency(monthIncome)}</Text>
              </View>
            </View>
            <View style={styles.miniStat}>
              <View style={[styles.miniIcon, { backgroundColor: COLORS.expense + "20" }]}>
                <MaterialIcons name="trending-down" size={12} color={COLORS.expense} />
              </View>
              <View>
                <Text style={styles.miniLabel}>Bu Ay Gider</Text>
                <Text style={[styles.miniValue, { color: COLORS.expense }]}>{formatCurrency(monthExpense)}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Top Stats Row */}
        <View style={[styles.statRow, isWeb && styles.statRowWeb]}>
          <StatCard 
            title="Toplam Birikim" 
            value={totalSavings} 
            icon="track-changes" 
            color="#a855f7" 
            change="Aktif hedefler" 
          />
        </View>

        {/* Charts Row */}
        <View style={[styles.mainGrid, isWeb && styles.mainGridWeb]}>
          <View style={[styles.card, { flex: 1.2 }]}>
            <Text style={styles.cardTitle}>AYLIK GELİR / GİDER</Text>
            <BarChart
              style={styles.chart}
              data={barData}
              width={isWeb ? (width - 320) * 0.53 : SCREEN_WIDTH - 40}
              height={220}
              yAxisLabel="₺"
              yAxisSuffix=""
              chartConfig={chartConfig}
              verticalLabelRotation={0}
              fromZero
              showBarTops={false}
              withInnerLines={false}
            />
          </View>
          <View style={[styles.card, { flex: 1 }]}>
            {categoryData.length > 0 ? (
              <PieChart
                data={categoryData}
                width={isWeb ? (width - 320) * 0.4 : SCREEN_WIDTH - 40}
                height={220}
                chartConfig={chartConfig}
                accessor={"amount"}
                backgroundColor={"transparent"}
                paddingLeft={"15"}
                center={[10, 0]}
                absolute
                hasLegend={true}
              />
            ) : (
                <View style={[styles.emptyBox, { height: 220, justifyContent: 'center' }]}>
                    <Text style={styles.emptyText}>Veri yok</Text>
                </View>
            )}
          </View>
        </View>

        {/* Bottom Row */}
        <View style={[styles.mainGrid, isWeb && styles.mainGridWeb]}>
          {/* Son İşlemler */}
          <View style={[styles.card, { flex: 1.2 }]}>
            <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>SON İŞLEMLER</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Transactions")}>
                    <Text style={styles.viewAll}>Tümünü Gör</Text>
                </TouchableOpacity>
            </View>
            <View style={styles.transactionList}>
              {recentTx.length > 0 ? recentTx.map((t) => (
                <View key={t.id} style={styles.tRow}>
                  <View style={styles.tIconBox}>
                    <MaterialIcons 
                        name={t.type === "income" ? "arrow-downward" : "arrow-upward"} 
                        size={16} 
                        color={t.type === "income" ? COLORS.income : COLORS.expense} 
                    />
                  </View>
                  <View style={styles.tInfo}>
                    <Text style={styles.tName} numberOfLines={1}>{t.description || t.title}</Text>
                    <Text style={styles.tMeta}>{t.category} • {t.userName || "Ben"}</Text>
                  </View>
                  <Text style={[styles.tAmount, { color: t.type === "income" ? COLORS.income : COLORS.expense }]}>
                    {t.type === "income" ? "+" : "-"}{formatCurrency(Math.abs(t.amount))}
                  </Text>
                </View>
              )) : (
                <View style={styles.emptyBox}>
                    <Text style={styles.emptyText}>Henüz işlem yok.</Text>
                </View>
              )}
            </View>
          </View>

          {/* Bütçe Durumu */}
          <View style={[styles.card, { flex: 1 }]}>
            <Text style={styles.cardTitle}>BÜTÇE DURUMU</Text>
            <View style={styles.budgetList}>
                {budgets.length > 0 ? budgets.slice(0, 5).map(b => {
                    const current = transactions
                        .filter(t => t.category === b.category && t.type === 'expense' && isWithinInterval(new Date(t.date), { start: monthStart, end: monthEnd }))
                        .reduce((acc, t) => acc + Math.abs(Number(t.amount || 0)), 0);
                    return (
                        <BudgetProgress key={b.id} label={b.category} current={current} limit={b.limit} color={current > b.limit ? COLORS.expense : COLORS.primary} />
                    );
                }) : (
                    <>
                        <BudgetProgress label="Market" current={0} limit={3000} color={COLORS.expense} />
                        <BudgetProgress label="Fatura" current={0} limit={1500} color={COLORS.primary} />
                        <Text style={[styles.emptyText, { marginTop: 10 }]}>Bütçe tanımlanmamış.</Text>
                    </>
                )}
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatCard({ title, value, icon, color, change, isBalance }: any) {
  return (
    <View style={styles.statCard}>
      <View style={styles.statHeader}>
        <Text style={styles.statTitle}>{title}</Text>
        <MaterialIcons name={icon} size={20} color={color} />
      </View>
      <Text style={[styles.statValue, isBalance && { color: COLORS.amber }]}>{formatCurrency(value)}</Text>
      <Text style={styles.statChange}>{change}</Text>
    </View>
  );
}

function BudgetProgress({ label, current, limit, color }: any) {
  const pct = Math.min((current / limit) * 100, 100);
  return (
    <View style={styles.budgetRow}>
        <View style={styles.budgetHeader}>
            <Text style={styles.budgetLabel}>{label}</Text>
            <Text style={styles.budgetValue}>{formatCurrency(current)} / {formatCurrency(limit)}</Text>
        </View>
        <View style={styles.progressBarBg}>
            <View style={[styles.progressBarFill, { width: `${pct}%`, backgroundColor: color }]} />
        </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  scrollContent: { padding: 20, gap: 24, paddingBottom: 40 },
  webScrollContent: { padding: 32 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  pageTitle: {
    fontSize: 24,
    fontWeight: "900",
    color: "#fff",
    letterSpacing: -0.5,
  },
  headerActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  headerIconBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: COLORS.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  addBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 13,
  },
  statRow: {
    gap: 16,
  },
  statRowWeb: {
    flexDirection: "row",
  },
  statCard: {
    flex: 1,
    backgroundColor: "#111",
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  statHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  statTitle: {
    color: COLORS.textSecondary,
    fontSize: 13,
    fontWeight: "600",
  },
  statValue: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "900",
    letterSpacing: -1,
  },
  statChange: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 8,
  },
  mainGrid: {
    gap: 20,
  },
  mainGridWeb: {
    flexDirection: "row",
  },
  card: {
    backgroundColor: "#111",
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  cardTitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.5,
    marginBottom: 20,
  },
  viewAll: {
    color: COLORS.primary,
    fontSize: 12,
    fontWeight: "700",
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
    marginLeft: -15,
  },
  transactionList: {
    gap: 4,
  },
  tRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.03)",
  },
  tIconBox: {
    width: 38,
    height: 38,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  tInfo: {
    flex: 1,
  },
  tName: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "700",
  },
  tMeta: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 3,
  },
  tAmount: {
    fontSize: 15,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  budgetList: {
    gap: 22,
  },
  budgetRow: {
    gap: 10,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  budgetLabel: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  budgetValue: {
    color: COLORS.textMuted,
    fontSize: 11,
    fontWeight: "600",
  },
  progressBarBg: {
    height: 6,
    backgroundColor: "rgba(255,255,255,0.05)",
    borderRadius: 3,
    overflow: "hidden",
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 3,
  },
  emptyBox: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    color: COLORS.textMuted,
    fontSize: 13,
  },
});
