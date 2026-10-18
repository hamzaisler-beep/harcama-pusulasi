// src/screens/BudgetScreen.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { store } from "../store";
import { COLORS, MONO, Budget } from "../theme/constants";
import { formatTRY } from "../utils/format";

const CAT_EMOJIS: Record<string, string> = {
  "Market": "🛒", "Restoran": "🍽️", "Ulaşım": "🚗", "Eğlence": "🎮",
  "Sağlık": "💊", "Faturalar": "⚡", "Giyim": "👕", "Eğitim": "📚",
  "Kira": "🏠", "Spor": "💪", "Güzellik": "💄", "Diğer": "📦",
};

const monthKey = (d: string) => {
  try { return format(d.includes("T") ? parseISO(d) : new Date(d), "yyyy-MM"); }
  catch { return ""; }
};

export default function BudgetScreen() {
  const [tick, setTick] = useState(0);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState("");
  const [category, setCategory] = useState("Market");
  const [limit, setLimit] = useState("");
  const [busy, setBusy] = useState(false);
  const [customCat, setCustomCat] = useState("");

  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    store.listeners.add(fn);
    return () => { store.listeners.delete(fn); };
  }, []);

  const thisKey = format(new Date(), "yyyy-MM");
  const monthLabel = format(new Date(), "MMM yyyy");

  const budgetData = useMemo(() => {
    return store.budgets.map(b => {
      const spent = store.transactions
        .filter(t => t.type === "expense" && t.category === b.category && monthKey(t.date) === thisKey)
        .reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0);
      return { ...b, spent };
    });
  }, [store.budgets, store.transactions, tick]);

  const totalLimit = budgetData.reduce((s, b) => s + b.limit, 0);
  const totalSpent = budgetData.reduce((s, b) => s + b.spent, 0);
  const remaining = totalLimit - totalSpent;

  const openAdd = () => { setEditId(""); setCategory("Market"); setLimit(""); setModal(true); };
  const openEdit = (b: Budget) => { setEditId(b.id); setCategory(b.category); setLimit(String(b.limit)); setModal(true); };
  const closeModal = () => { setModal(false); setEditId(""); };

  const handleSave = async () => {
    const cat = customCat.trim() || category;
    if (!cat || !limit) return;
    setBusy(true);
    try {
      const lim = parseFloat(limit.replace(",", ".")) || 0;
      if (editId) await store.updateBudget(editId, { category: cat, limit: lim });
      else await store.addBudget({ category: cat, limit: lim, period: "monthly" });
      closeModal();
    } finally { setBusy(false); }
  };

  const handleDelete = (id: string, cat: string) => {
    Alert.alert("Bütçeyi Sil", `"${cat}" bütçesini silmek istiyor musunuz?`, [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => store.deleteBudget(id) },
    ]);
  };

  const PRESET_CATS = ["Market", "Restoran", "Ulaşım", "Eğlence", "Sağlık", "Faturalar", "Giyim", "Eğitim", "Diğer"];

  return (
    <ScrollView style={s.container} contentContainerStyle={[s.scroll, { paddingBottom: 80 }]}>
      <View style={s.header}>
        <Text style={s.pageTitle}>Bütçe</Text>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}>
          <MaterialIcons name="add" size={16} color="#000" />
          <Text style={s.addBtnText}>+ Limit</Text>
        </TouchableOpacity>
      </View>

      {/* 3 KPI Cards */}
      <View style={s.kpiRow}>
        <View style={s.kpiCard}>
          <View style={s.kpiTop}>
            <Text style={s.kpiLbl}>Toplam Limit</Text>
            <Text style={s.kpiEmoji}>❤️</Text>
          </View>
          <Text style={s.kpiVal}>{formatTRY(totalLimit)}</Text>
          <Text style={s.kpiSub}>{monthLabel}</Text>
        </View>
        <View style={s.kpiCard}>
          <View style={s.kpiTop}>
            <Text style={s.kpiLbl}>Harcanan</Text>
            <Text style={s.kpiEmoji}>📤</Text>
          </View>
          <Text style={[s.kpiVal, { color: COLORS.expense }]}>{formatTRY(totalSpent)}</Text>
        </View>
        <View style={s.kpiCard}>
          <View style={s.kpiTop}>
            <Text style={s.kpiLbl}>Kalan</Text>
            <Text style={s.kpiEmoji}>💰</Text>
          </View>
          <Text style={[s.kpiVal, { color: remaining < 0 ? COLORS.expense : COLORS.income }]}>{formatTRY(remaining)}</Text>
        </View>
      </View>

      {/* Budget List */}
      {budgetData.length === 0 ? (
        <View style={s.emptyWrap}>
          <Text style={s.emptyIcon}>📊</Text>
          <Text style={s.emptyText}>Henüz bütçe tanımlanmadı.</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={openAdd}>
            <Text style={s.emptyBtnText}>İlk Limiti Ekle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.listCard}>
          {budgetData.map((b) => {
            const pct = b.limit > 0 ? Math.min((b.spent / b.limit) * 100, 100) : 0;
            const over = b.spent > b.limit;
            const emoji = CAT_EMOJIS[b.category] || "📦";
            return (
              <View key={b.id} style={s.budgetRow}>
                <View style={s.budgetLeft}>
                  <Text style={s.catEmoji}>{emoji}</Text>
                  <Text style={s.catName}>{b.category}</Text>
                </View>
                <Text style={[s.budgetAmt, over && { color: COLORS.expense }]}>
                  {formatTRY(b.spent)} / {formatTRY(b.limit)}
                </Text>
                <TouchableOpacity onPress={() => openEdit(b)} style={s.iconBtn}>
                  <Text>✏️</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(b.id, b.category)} style={s.iconBtn}>
                  <MaterialIcons name="delete-outline" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
                <View style={s.barWrap}>
                  <View style={s.barTrack}>
                    <View style={[s.barFill, { width: `${pct}%` as any, backgroundColor: over ? COLORS.expense : COLORS.primary }]} />
                  </View>
                </View>
              </View>
            );
          })}
        </View>
      )}

      <Modal visible={modal} transparent animationType="fade">
        <View style={s.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeModal} />
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>{editId ? "Bütçeyi Düzenle" : "Yeni Bütçe Limiti"}</Text>
            <Text style={s.lbl}>Kategori</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {PRESET_CATS.map(c => (
                  <TouchableOpacity key={c} style={[s.chip, category === c && s.chipActive]} onPress={() => { setCategory(c); setCustomCat(""); }}>
                    <Text style={s.chipText}>{CAT_EMOJIS[c] || "📦"} {c}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <TextInput style={s.input} value={customCat} onChangeText={setCustomCat} placeholder="Özel kategori adı..." placeholderTextColor={COLORS.textMuted} />
            <Text style={s.lbl}>Aylık Limit (₺)</Text>
            <TextInput style={s.input} value={limit} onChangeText={setLimit} placeholder="0.00" keyboardType="decimal-pad" placeholderTextColor={COLORS.textMuted} />
            <View style={s.btnRow}>
              <TouchableOpacity style={s.cancelBtn} onPress={closeModal}><Text style={s.cancelText}>İptal</Text></TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={busy}>
                {busy ? <ActivityIndicator color="#000" size="small" /> : <Text style={s.saveText}>Kaydet</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  pageTitle: { color: "#fff", fontSize: 22, fontWeight: "800" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: COLORS.primary, borderRadius: 8, paddingHorizontal: 14, paddingVertical: 8 },
  addBtnText: { color: "#000", fontWeight: "700", fontSize: 13 },

  kpiRow: { flexDirection: "row", gap: 10, marginBottom: 14, flexWrap: "wrap" },
  kpiCard: { flex: 1, minWidth: 100, backgroundColor: COLORS.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  kpiTop: { flexDirection: "row", justifyContent: "space-between", marginBottom: 8 },
  kpiLbl: { color: COLORS.textMuted, fontSize: 11, fontWeight: "600" },
  kpiEmoji: { fontSize: 18 },
  kpiVal: { fontSize: 20, fontWeight: "800", fontFamily: MONO, color: COLORS.text, marginBottom: 2 },
  kpiSub: { color: COLORS.textMuted, fontSize: 10 },

  listCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border, gap: 16 },
  budgetRow: { flexWrap: "wrap", gap: 6 },
  budgetLeft: { flexDirection: "row", alignItems: "center", gap: 8, flex: 1 },
  catEmoji: { fontSize: 18 },
  catName: { color: COLORS.text, fontSize: 14, fontWeight: "700", flex: 1 },
  budgetAmt: { color: COLORS.textMuted, fontSize: 13, fontWeight: "600" },
  iconBtn: { padding: 4 },
  barWrap: { width: "100%" },
  barTrack: { height: 6, backgroundColor: COLORS.track, borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },

  emptyWrap: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyIcon: { fontSize: 40 },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
  emptyBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  emptyBtnText: { color: "#000", fontWeight: "700", fontSize: 13 },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalBox: { width: "100%", maxWidth: 420, backgroundColor: "#1a1f2e", borderRadius: 16, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 18 },
  lbl: { color: COLORS.textMuted, fontSize: 11, fontWeight: "700", marginBottom: 8 },
  input: { backgroundColor: COLORS.cardSecondary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: "#fff", fontSize: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.cardSecondary },
  chipActive: { backgroundColor: "rgba(0,201,167,0.15)", borderColor: COLORS.primary },
  chipText: { color: COLORS.text, fontSize: 12, fontWeight: "600" },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10, backgroundColor: COLORS.cardSecondary, borderWidth: 1, borderColor: COLORS.border },
  cancelText: { color: COLORS.textSecondary, fontWeight: "700" },
  saveBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10, backgroundColor: COLORS.primary },
  saveText: { color: "#000", fontWeight: "800" },
});
