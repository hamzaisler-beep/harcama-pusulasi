// src/screens/BudgetScreen.tsx
import React, { useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Platform 
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { store } from "../store";
import { COLORS } from "../theme/constants";

const { width } = Dimensions.get("window");

export default function BudgetScreen() {
    const budgets = store.budgets || [];
    const transactions = store.transactions || [];

    const stats = useMemo(() => {
        let totalLimit = budgets.reduce((acc, b) => acc + (b.limit || 0), 0);
        let totalSpent = 0;

        const categoryStats = budgets.map(b => {
            const spent = transactions
                .filter(t => t.type === "expense" && t.category === b.category)
                .reduce((acc, t) => acc + Math.abs(t.amount), 0);
            totalSpent += spent;
            return {
                ...b,
                spent,
                percent: b.limit > 0 ? (spent / b.limit) * 100 : 0
            };
        });

        return {
            totalLimit,
            totalSpent,
            remaining: totalLimit - totalSpent,
            percent: totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0,
            categoryStats
        };
    }, [budgets, transactions]);

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollInside} showsVerticalScrollIndicator={false}>
            {/* Header Section */}
            <View style={styles.header}>
                <View>
                    <Text style={styles.title}>Bütçe Yönetimi</Text>
                    <Text style={styles.subtitle}>Harcanan vs Bütçe limitleriniz</Text>
                </View>
                <TouchableOpacity style={styles.addBtn}>
                    <MaterialIcons name="add" size={20} color="#fff" />
                    <Text style={styles.addBtnText}>Bütçe Ekle</Text>
                </TouchableOpacity>
            </View>

            {/* Comparison Grid */}
            <View style={styles.grid}>
                {/* Left: Summary Card */}
                <View style={[styles.card, styles.summaryCard]}>
                    <Text style={styles.cardTitle}>BU AY BÜTÇE ÖZETİ</Text>
                    <View style={styles.summaryCenter}>
                        <Text style={styles.bigPercent}>{Math.round(stats.percent)}%</Text>
                        <Text style={styles.summaryValues}>
                            <Text style={{color: COLORS.text}}>₺{new Intl.NumberFormat("tr-TR").format(stats.totalSpent)}</Text>
                            <Text style={{color: COLORS.textMuted}}> / ₺{new Intl.NumberFormat("tr-TR").format(stats.totalLimit)}</Text>
                        </Text>
                    </View>
                    <View style={styles.thickTrack}>
                        <View style={[styles.thickFill, { width: `${Math.min(stats.percent, 100)}%`, backgroundColor: stats.percent > 90 ? COLORS.expense : COLORS.primary }]} />
                    </View>
                    <View style={styles.summaryFooter}>
                        <View>
                            <Text style={styles.footerLabel}>KALAN BÜTÇE</Text>
                            <Text style={[styles.footerValue, { color: stats.remaining < 0 ? COLORS.expense : COLORS.income }]}>
                                ₺{new Intl.NumberFormat("tr-TR").format(stats.remaining)}
                            </Text>
                        </View>
                        <MaterialIcons name="trending-up" size={24} color={COLORS.income} opacity={0.6} />
                    </View>
                </View>

                {/* Right: Category List Card */}
                <View style={[styles.card, { flex: 1.5 }]}>
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>KATEGORİ LİMİTLERİ</Text>
                        <TouchableOpacity><Text style={styles.editLink}>Düzenle</Text></TouchableOpacity>
                    </View>
                    <ScrollView style={styles.catList} showsVerticalScrollIndicator={false}>
                        {stats.categoryStats.length === 0 ? (
                            <Text style={styles.emptyText}>Henüz bir bütçe tanımlanmadı.</Text>
                        ) : (
                            stats.categoryStats.map((cat, idx) => (
                                <View key={idx} style={styles.catRow}>
                                    <View style={styles.catInfo}>
                                        <View style={styles.catIconBox}>
                                            <MaterialIcons name={getIconName(cat.category)} size={18} color={cat.percent > 90 ? COLORS.expense : COLORS.primary} />
                                        </View>
                                        <View style={{ flex: 1 }}>
                                            <View style={styles.catLabelRow}>
                                                <Text style={styles.catName}>{cat.category}</Text>
                                                <Text style={styles.catPercent}>%{Math.round(cat.percent)}</Text>
                                            </View>
                                            <View style={styles.thinTrack}>
                                                <View style={[styles.thinFill, { width: `${Math.min(cat.percent, 100)}%`, backgroundColor: cat.percent > 90 ? COLORS.expense : (cat.percent > 70 ? COLORS.warning : COLORS.income) }]} />
                                            </View>
                                            <View style={styles.catValues}>
                                                <Text style={styles.catSpent}>₺{cat.spent}</Text>
                                                <Text style={styles.catLimit}>Limit: ₺{cat.limit}</Text>
                                            </View>
                                        </View>
                                    </View>
                                </View>
                            ))
                        )}
                    </ScrollView>
                </View>
            </View>

            {/* Bottom: Comparison Chart */}
            <View style={[styles.card, { marginTop: 24 }]}>
                <Text style={styles.cardTitle}>AYLIK KARŞILAŞTIRMA (LİMİT VS HARCAMA)</Text>
                <View style={styles.chartContainer}>
                    <SideBySideBarChart data={stats.categoryStats} />
                </View>
            </View>
        </ScrollView>
    );
}

const SideBySideBarChart = ({ data }: any) => {
    // Top 6 category for view
    const items = data.slice(0, 6);
    const maxVal = Math.max(...items.map((i: any) => Math.max(i.spent, i.limit)), 1000);

    return (
        <View style={styles.sbsChartContainer}>
            <View style={styles.sbsDrawArea}>
                {items.map((item: any, idx: number) => (
                    <View key={idx} style={styles.sbsGroup}>
                        <View style={styles.sbsBars}>
                            {/* Limit Bar (Background/Outline) */}
                            <View style={[styles.sbsBar, { height: `${(item.limit/maxVal)*100}%`, backgroundColor: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)', borderWidth: 1 }]} />
                            {/* Spent Bar (Active Color) */}
                            <View style={[styles.sbsBar, styles.sbsBarActive, { height: `${(item.spent/maxVal)*100}%`, backgroundColor: item.spent > item.limit ? COLORS.expense : COLORS.primary }]} />
                        </View>
                        <Text style={styles.sbsLabel} numberOfLines={1}>{item.category.substring(0, 5)}</Text>
                    </View>
                ))}
            </View>
            <View style={styles.sbsLegend}>
                <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: 'rgba(255,255,255,0.1)' }]} /><Text style={styles.legendText}>Limit</Text></View>
                <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: COLORS.primary }]} /><Text style={styles.legendText}>Harcanan</Text></View>
            </View>
        </View>
    );
};

const getIconName = (cat: string) => {
    const c = cat.toLowerCase();
    if (c.includes("market")) return "shopping-cart";
    if (c.includes("restoran") || c.includes("yemek")) return "restaurant";
    if (c.includes("ulaşım") || c.includes("akaryakıt")) return "directions-car";
    if (c.includes("giyim")) return "apparel";
    if (c.includes("eğlence")) return "videogame-asset";
    if (c.includes("fatura")) return "bolt";
    return "category";
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollInside: { padding: 32 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 32 },
  title: { fontSize: 24, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  grid: { flexDirection: "row", gap: 24 },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  summaryCard: { flex: 1, justifyContent: "space-between", minHeight: 300 },
  cardTitle: { fontSize: 11, color: COLORS.textMuted, fontWeight: "700", letterSpacing: 1.2, marginBottom: 24 },
  
  summaryCenter: { alignItems: "center", marginVertical: 20 },
  bigPercent: { fontSize: 56, fontWeight: "900", color: "#fff", letterSpacing: -2 },
  summaryValues: { fontSize: 15, fontWeight: "600", marginTop: 8 },
  
  thickTrack: { height: 12, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 6, overflow: "hidden", marginVertical: 24 },
  thickFill: { height: "100%", borderRadius: 6 },
  
  summaryFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  footerLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: "700", marginBottom: 4 },
  footerValue: { fontSize: 20, fontWeight: "800", fontFamily: "Space Mono, monospace" },

  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  editLink: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },
  catList: { maxHeight: 400 },
  catRow: { marginBottom: 20 },
  catInfo: { flexDirection: "row", gap: 16 },
  catIconBox: { width: 36, height: 36, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.03)", alignItems: "center", justifyContent: "center" },
  catLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 },
  catName: { fontSize: 14, color: "#fff", fontWeight: "600" },
  catPercent: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600" },
  thinTrack: { height: 4, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden", marginBottom: 8 },
  thinFill: { height: "100%", borderRadius: 2 },
  catValues: { flexDirection: "row", justifyContent: "space-between" },
  catSpent: { fontSize: 12, color: COLORS.text, fontWeight: "700" },
  catLimit: { fontSize: 11, color: COLORS.textMuted },

  emptyText: { color: COLORS.textMuted, textAlign: "center", marginTop: 40 },

  chartContainer: { height: 280, marginTop: 24 },
  sbsChartContainer: { flex: 1 },
  sbsDrawArea: { flex: 1, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", paddingBottom: 16 },
  sbsGroup: { alignItems: "center", width: 60 },
  sbsBars: { flexDirection: "row", alignItems: "flex-end", gap: 4, height: 180 },
  sbsBar: { width: 12, borderRadius: 4 },
  sbsBarActive: { position: "absolute", bottom: 0 },
  sbsLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 8 },
  sbsLegend: { flexDirection: "row", justifyContent: "center", gap: 24, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: COLORS.textSecondary },
});
