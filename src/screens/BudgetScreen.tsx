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
  Platform,
  useWindowDimensions,
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
  const { width } = useWindowDimensions();
  const mob = width < 600;

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
    const categoryStats = budgets.map((b) => {
      const spent = transactions
        .filter((t) => t.type === "expense" && t.category === b.category)
        .reduce((acc, t) => acc + Math.abs(t.amount), 0);
      totalSpent += spent;
      return { ...b, spent, percent: b.limit > 0 ? (spent / b.limit) * 100 : 0 };
    });
    return { totalLimit, totalSpent, remaining: totalLimit - totalSpent, percent: totalLimit > 0 ? (totalSpent / totalLimit) * 100 : 0, categoryStats };
  }, [budgets, transactions]);

  const pad = mob ? 16 : 32;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: pad }} showsVerticalScrollIndicator={false}>
      {/* Header */}
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={[styles.title, mob && { fontSize: 22 }]}>Bütçe</Text>
          {!mob && <Text style={styles.subtitle}>Harcanan vs bütçe limitiniz</Text>}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <MaterialIcons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>{mob ? "Ekle" : "Bütçe Ekle"}</Text>
        </TouchableOpacity>
      </View>

      {/* Summary card (full width on mobile) */}
      <View style={[styles.summaryCard, mob && { marginBottom: 16 }]}>
        <Text style={styles.cardTitle}>BU AY BÜTÇE ÖZETİ</Text>
        <View style={styles.summaryCenter}>
          <Text style={[styles.bigPercent, mob && { fontSize: 40 }]}>{Math.round(stats.percent)}%</Text>
          <Text style={styles.summaryValues}>
            <Text style={{ color: COLORS.text }}>₺{new Intl.NumberFormat("tr-TR").format(stats.totalSpent)}</Text>
            <Text style={{ color: COLORS.textMuted }}> / ₺{new Intl.NumberFormat("tr-TR").format(stats.totalLimit)}</Text>
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

      {/* Category List */}
      <View style={[styles.card, { marginBottom: 20 }]}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>KATEGORİ LİMİTLERİ</Text>
          <TouchableOpacity onPress={openAdd}><Text style={styles.editLink}>+ Ekle</Text></TouchableOpacity>
        </View>
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
                    <Text style={styles.catSpent}>₺{cat.spent.toLocaleString("tr-TR")}</Text>
                    <Text style={styles.catLimit}>Limit: ₺{cat.limit.toLocaleString("tr-TR")}</Text>
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
      </View>

      {/* Comparison chart */}
      {stats.categoryStats.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>LİMİT VS HARCAMA</Text>
          <View style={styles.chartContainer}>
            <SideBySideBarChart data={stats.categoryStats} />
          </View>
        </View>
      )}

      {/* Modal */}
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
  const items = data.slice(0, 6);
  const maxVal = Math.max(...items.map((i: any) => Math.max(i.spent, i.limit)), 1000);
  return (
    <View style={styles.sbsChartContainer}>
      <View style={styles.sbsDrawArea}>
        {items.map((item: any, idx: number) => (
          <View key={idx} style={styles.sbsGroup}>
            <View style={styles.sbsBars}>
              <View style={[styles.sbsBar, { height: `${(item.limit / maxVal) * 100}%`, backgroundColor: "rgba(255,255,255,0.05)", borderColor: "rgba(255,255,255,0.1)", borderWidth: 1 }]} />
              <View style={[styles.sbsBar, styles.sbsBarActive, { height: `${(item.spent / maxVal) * 100}%`, backgroundColor: item.spent > item.limit ? COLORS.expense : COLORS.primary }]} />
            </View>
            <Text style={styles.sbsLabel} numberOfLines={1}>{item.category.substring(0, 5)}</Text>
          </View>
        ))}
      </View>
      <View style={styles.sbsLegend}>
        <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: "rgba(255,255,255,0.1)" }]} /><Text style={styles.legendText}>Limit</Text></View>
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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  summaryCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20, justifyContent: "space-between" },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: 11, color: COLORS.textMuted, fontWeight: "700", letterSpacing: 1.2, marginBottom: 16 },

  summaryCenter: { alignItems: "center", marginVertical: 12 },
  bigPercent: { fontSize: 52, fontWeight: "900", color: "#fff", letterSpacing: -2 },
  summaryValues: { fontSize: 14, fontWeight: "600", marginTop: 6 },

  thickTrack: { height: 10, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 5, overflow: "hidden", marginVertical: 16 },
  thickFill: { height: "100%", borderRadius: 5 },

  summaryFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  footerLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: "700", marginBottom: 4 },
  footerValue: { fontSize: 18, fontWeight: "800", fontFamily: MONO },

  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  editLink: { fontSize: 12, color: COLORS.primary, fontWeight: "600" },
  catRow: { marginBottom: 18 },
  catInfo: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  catIconBox: { width: 34, height: 34, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.03)", alignItems: "center", justifyContent: "center", marginTop: 2 },
  catLabelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "baseline", marginBottom: 6 },
  catName: { fontSize: 13, color: "#fff", fontWeight: "600", flex: 1 },
  catPercent: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600" },
  thinTrack: { height: 4, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 2, overflow: "hidden", marginBottom: 6 },
  thinFill: { height: "100%", borderRadius: 2 },
  catValues: { flexDirection: "row", justifyContent: "space-between" },
  catSpent: { fontSize: 12, color: COLORS.text, fontWeight: "700" },
  catLimit: { fontSize: 11, color: COLORS.textMuted },
  rowActions: { flexDirection: "row", alignItems: "center" },
  iconMini: { padding: 6 },

  emptyText: { color: COLORS.textMuted, textAlign: "center", marginTop: 24, marginBottom: 12 },

  chartContainer: { height: 220, marginTop: 16 },
  sbsChartContainer: { flex: 1 },
  sbsDrawArea: { flex: 1, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", paddingBottom: 16 },
  sbsGroup: { alignItems: "center", width: 50 },
  sbsBars: { flexDirection: "row", alignItems: "flex-end", gap: 4, height: 160 },
  sbsBar: { width: 12, borderRadius: 4 },
  sbsBarActive: { position: "absolute", bottom: 0 },
  sbsLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 8 },
  sbsLegend: { flexDirection: "row", justifyContent: "center", gap: 24, marginTop: 12 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: COLORS.textSecondary },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", padding: 16 },
  modalContent: { width: "100%", maxWidth: 460, backgroundColor: COLORS.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: 19, fontWeight: "800", color: "#fff", marginBottom: 18 },
  fieldLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 8, marginTop: 8 },
  catChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: COLORS.border },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipText: { color: COLORS.textMuted, fontWeight: "700", fontSize: 12 },
  modalInput: { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 16, color: "#fff", fontSize: 20, fontWeight: "800", borderWidth: 1, borderColor: COLORS.border },
  modalSaveBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 24 },
  modalSaveText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
