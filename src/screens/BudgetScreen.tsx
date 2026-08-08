// src/screens/BudgetScreen.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
  Platform
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { store } from "../store";
import { useStore } from "../hooks/useStore";
import { COLORS, MONO, Budget } from "../theme/constants";

const BUDGET_CATEGORIES = ["Market", "Restoran", "Ulaşım", "Faturalar", "Eğlence", "Giyim", "Sağlık", "Diğer"];

const confirmDelete = (msg: string, onYes: () => void) => {
  if (Platform.OS === "web") {
    if (window.confirm(msg)) onYes();
  } else {
    Alert.alert("Sil", msg, [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: onYes },
    ]);
  }
};

export default function BudgetScreen() {
    const s = useStore();
    const budgets = s.budgets || [];
    const transactions = s.transactions || [];

    const [modalOpen, setModalOpen] = useState(false);
    const [editing, setEditing] = useState<Budget | null>(null);
    const [category, setCategory] = useState(BUDGET_CATEGORIES[0]);
    const [limit, setLimit] = useState("");
    const [saving, setSaving] = useState(false);

    const openAdd = () => {
        setEditing(null);
        setCategory(BUDGET_CATEGORIES[0]);
        setLimit("");
        setModalOpen(true);
    };

    const openEdit = (b: Budget) => {
        setEditing(b);
        setCategory(b.category);
        setLimit(String(b.limit));
        setModalOpen(true);
    };

    const handleSave = async () => {
        if (!category || !limit) return;
        setSaving(true);
        try {
            const payload = { category, limit: Number(limit) || 0, period: "monthly" as const };
            if (editing) await store.updateBudget(editing.id, payload);
            else await store.addBudget(payload);
            setModalOpen(false);
        } finally {
            setSaving(false);
        }
    };

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
                <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
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
                        <TouchableOpacity onPress={openAdd}><Text style={styles.editLink}>+ Ekle</Text></TouchableOpacity>
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
                                        <View style={styles.rowActions}>
                                            <TouchableOpacity onPress={() => openEdit(cat)} style={styles.iconMini}>
                                                <MaterialIcons name="edit" size={16} color={COLORS.textMuted} />
                                            </TouchableOpacity>
                                            <TouchableOpacity onPress={() => confirmDelete(`"${cat.category}" bütçesini silmek istiyor musunuz?`, () => store.deleteBudget(cat.id))} style={styles.iconMini}>
                                                <MaterialIcons name="delete-outline" size={16} color={COLORS.textMuted} />
                                            </TouchableOpacity>
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

            {/* Ekle / Düzenle Modal */}
            <Modal visible={modalOpen} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback onPress={() => setModalOpen(false)}>
                        <View style={StyleSheet.absoluteFill} />
                    </TouchableWithoutFeedback>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>{editing ? "Bütçeyi Düzenle" : "Yeni Bütçe"}</Text>

                        <Text style={styles.fieldLabel}>Kategori</Text>
                        <View style={styles.catChips}>
                            {BUDGET_CATEGORIES.map((c) => (
                                <TouchableOpacity key={c} style={[styles.catChip, category === c && styles.catChipActive]} onPress={() => setCategory(c)} disabled={!!editing}>
                                    <Text style={[styles.catChipText, category === c && { color: "#fff" }]}>{c}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>

                        <Text style={styles.fieldLabel}>Aylık Limit (₺)</Text>
                        <TextInput style={styles.modalInput} value={limit} onChangeText={setLimit} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textMuted} />

                        <TouchableOpacity style={[styles.modalSaveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
                            {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.modalSaveText}>{editing ? "Güncelle" : "Kaydet"}</Text>}
                        </TouchableOpacity>
                    </View>
                </View>
            </Modal>
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

const getIconName = (cat: string): any => {
    const c = cat.toLowerCase();
    if (c.includes("market")) return "shopping-cart";
    if (c.includes("restoran") || c.includes("yemek")) return "restaurant";
    if (c.includes("ulaşım") || c.includes("akaryakıt")) return "directions-car";
    if (c.includes("giyim")) return "checkroom";
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

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 24 },
  card: { minWidth: 300, backgroundColor: COLORS.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  summaryCard: { flex: 1, justifyContent: "space-between", minHeight: 300 },
  cardTitle: { fontSize: 11, color: COLORS.textMuted, fontWeight: "700", letterSpacing: 1.2, marginBottom: 24 },
  
  summaryCenter: { alignItems: "center", marginVertical: 20 },
  bigPercent: { fontSize: 56, fontWeight: "900", color: "#fff", letterSpacing: -2 },
  summaryValues: { fontSize: 15, fontWeight: "600", marginTop: 8 },
  
  thickTrack: { height: 12, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 6, overflow: "hidden", marginVertical: 24 },
  thickFill: { height: "100%", borderRadius: 6 },
  
  summaryFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  footerLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: "700", marginBottom: 4 },
  footerValue: { fontSize: 20, fontWeight: "800", fontFamily: MONO },

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
  rowActions: { flexDirection: "row", alignItems: "center" },
  iconMini: { padding: 6 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { width: "100%", maxWidth: 460, backgroundColor: COLORS.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#fff", marginBottom: 20 },
  fieldLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 8, marginTop: 8 },
  catChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: COLORS.border },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipText: { color: COLORS.textMuted, fontWeight: "700", fontSize: 12 },
  modalInput: { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 16, color: "#fff", fontSize: 20, fontWeight: "800", borderWidth: 1, borderColor: COLORS.border },
  modalSaveBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 24 },
  modalSaveText: { color: "#fff", fontSize: 15, fontWeight: "800" },

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
