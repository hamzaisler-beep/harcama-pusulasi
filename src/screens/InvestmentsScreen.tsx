// src/screens/InvestmentsScreen.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { store } from "../store";
import { COLORS, MONO, Investment } from "../theme/constants";
import { formatTRY } from "../utils/format";

const INV_TYPES = [
  { value: "Hisse", label: "Hisse", emoji: "📊" },
  { value: "Kripto", label: "Kripto", emoji: "₿" },
  { value: "Altın", label: "Altın", emoji: "🥇" },
  { value: "Döviz", label: "Döviz", emoji: "💱" },
  { value: "Fon", label: "Fon", emoji: "📈" },
  { value: "Diğer", label: "Diğer", emoji: "💼" },
];

export default function InvestmentsScreen() {
  const [tick, setTick] = useState(0);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editId, setEditId] = useState("");
  const [symbol, setSymbol] = useState("");
  const [type, setType] = useState("Hisse");
  const [amount, setAmount] = useState("");
  const [buyPrice, setBuyPrice] = useState("");
  const [currentPrice, setCurrentPrice] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    store.listeners.add(fn);
    return () => { store.listeners.delete(fn); };
  }, []);

  const data = useMemo(() => {
    let portfolioValue = 0, cost = 0;
    store.investments.forEach(inv => {
      portfolioValue += (Number(inv.amount) || 0) * (Number(inv.currentPrice) || 0);
      cost += (Number(inv.amount) || 0) * (Number(inv.buyPrice) || 0);
    });
    const profit = portfolioValue - cost;
    const profitPct = cost > 0 ? (profit / cost) * 100 : 0;
    return { portfolioValue, cost, profit, profitPct };
  }, [store.investments, tick]);

  const openAdd = () => { setEditId(""); setSymbol(""); setType("Hisse"); setAmount(""); setBuyPrice(""); setCurrentPrice(""); setModal("add"); };
  const openEdit = (inv: Investment) => { setEditId(inv.id); setSymbol(inv.symbol); setType(inv.type); setAmount(String(inv.amount)); setBuyPrice(String(inv.buyPrice)); setCurrentPrice(String(inv.currentPrice)); setModal("edit"); };
  const closeModal = () => setModal(null);

  const handleSave = async () => {
    if (!symbol.trim() || !amount || !buyPrice || !currentPrice) return;
    setBusy(true);
    try {
      const invType = INV_TYPES.find(t => t.value === type);
      const invData = {
        symbol: symbol.trim().toUpperCase(),
        type,
        amount: parseFloat(amount.replace(",", ".")) || 0,
        buyPrice: parseFloat(buyPrice.replace(",", ".")) || 0,
        currentPrice: parseFloat(currentPrice.replace(",", ".")) || 0,
        date: new Date().toISOString(),
        icon: invType?.emoji || "💼",
      };
      if (modal === "add") await store.addInvestment(invData);
      else await store.updateInvestment(editId, invData);
      closeModal();
    } finally { setBusy(false); }
  };

  const handleDelete = (id: string, sym: string) => {
    Alert.alert("Yatırımı Sil", `"${sym}" yatırımını silmek istiyor musunuz?`, [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => store.deleteInvestment(id) },
    ]);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={[s.scroll, { paddingBottom: 80 }]}>
      <View style={s.header}>
        <Text style={s.pageTitle}>Yatırımlar</Text>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}>
          <MaterialIcons name="add" size={16} color="#000" />
          <Text style={s.addBtnText}>+ Yatırım</Text>
        </TouchableOpacity>
      </View>

      {/* 3 KPI Cards */}
      <View style={s.kpiRow}>
        <View style={s.kpiCard}>
          <View style={s.kpiTop}><Text style={s.kpiLbl}>Portföy Değeri</Text><Text style={s.kpiEmoji}>📋</Text></View>
          <Text style={s.kpiVal}>{formatTRY(data.portfolioValue)}</Text>
        </View>
        <View style={s.kpiCard}>
          <View style={s.kpiTop}><Text style={s.kpiLbl}>Maliyet</Text><Text style={s.kpiEmoji}>💵</Text></View>
          <Text style={s.kpiVal}>{formatTRY(data.cost)}</Text>
        </View>
        <View style={s.kpiCard}>
          <View style={s.kpiTop}><Text style={s.kpiLbl}>Kar / Zarar</Text>
            <View style={[s.dot, { backgroundColor: data.profit >= 0 ? COLORS.income : COLORS.expense }]} />
          </View>
          <Text style={[s.kpiVal, { color: data.profit >= 0 ? COLORS.income : COLORS.expense }]}>
            {data.profit >= 0 ? "+" : ""}{formatTRY(data.profit)}
          </Text>
          <Text style={[s.kpiSub, { color: data.profit >= 0 ? COLORS.income : COLORS.expense }]}>
            %{Math.abs(data.profitPct).toFixed(1)}
          </Text>
        </View>
      </View>

      {/* Investment List */}
      {store.investments.length === 0 ? (
        <View style={s.emptyWrap}>
          <Text style={s.emptyIcon}>📈</Text>
          <Text style={s.emptyText}>Henüz yatırım eklenmedi.</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={openAdd}>
            <Text style={s.emptyBtnText}>İlk Yatırımı Ekle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.listCard}>
          {store.investments.map((inv) => {
            const value = (Number(inv.amount) || 0) * (Number(inv.currentPrice) || 0);
            const cost = (Number(inv.amount) || 0) * (Number(inv.buyPrice) || 0);
            const profit = value - cost;
            const profitPct = cost > 0 ? (profit / cost) * 100 : 0;
            const invType = INV_TYPES.find(t => t.value === inv.type);
            return (
              <View key={inv.id} style={s.invRow}>
                <View style={s.invIcon}>
                  <Text style={{ fontSize: 20 }}>{inv.icon || invType?.emoji || "💼"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.invSymbol}>{inv.symbol}</Text>
                  <Text style={s.invMeta}>
                    {inv.amount} adet · Alış {formatTRY(inv.buyPrice)} · Güncel {formatTRY(inv.currentPrice)}
                  </Text>
                </View>
                <View style={{ alignItems: "flex-end" }}>
                  <Text style={s.invValue}>{formatTRY(value)}</Text>
                  <Text style={[s.invProfit, { color: profit >= 0 ? COLORS.income : COLORS.expense }]}>
                    {profit >= 0 ? "+" : ""}{formatTRY(profit)} (%{Math.abs(profitPct).toFixed(1)})
                  </Text>
                </View>
                <TouchableOpacity onPress={() => openEdit(inv)} style={s.iconBtn}><Text>✏️</Text></TouchableOpacity>
                <TouchableOpacity onPress={() => handleDelete(inv.id, inv.symbol)} style={s.iconBtn}>
                  <MaterialIcons name="delete-outline" size={16} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            );
          })}
        </View>
      )}

      <Modal visible={modal !== null} transparent animationType="fade">
        <View style={s.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeModal} />
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>{modal === "add" ? "Yeni Yatırım" : "Yatırımı Düzenle"}</Text>
            <Text style={s.lbl}>Tür</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {INV_TYPES.map(t => (
                  <TouchableOpacity key={t.value} style={[s.chip, type === t.value && s.chipActive]} onPress={() => setType(t.value)}>
                    <Text style={s.chipText}>{t.emoji} {t.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <Text style={s.lbl}>Sembol / Ad</Text>
            <TextInput style={s.input} value={symbol} onChangeText={setSymbol} placeholder="THYAO, BTC..." placeholderTextColor={COLORS.textMuted} autoCapitalize="characters" />
            <Text style={s.lbl}>Adet</Text>
            <TextInput style={s.input} value={amount} onChangeText={setAmount} placeholder="0" keyboardType="decimal-pad" placeholderTextColor={COLORS.textMuted} />
            <Text style={s.lbl}>Alış Fiyatı (₺)</Text>
            <TextInput style={s.input} value={buyPrice} onChangeText={setBuyPrice} placeholder="0.00" keyboardType="decimal-pad" placeholderTextColor={COLORS.textMuted} />
            <Text style={s.lbl}>Güncel Fiyat (₺)</Text>
            <TextInput style={s.input} value={currentPrice} onChangeText={setCurrentPrice} placeholder="0.00" keyboardType="decimal-pad" placeholderTextColor={COLORS.textMuted} />
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
  kpiTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  kpiLbl: { color: COLORS.textMuted, fontSize: 11, fontWeight: "600" },
  kpiEmoji: { fontSize: 18 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  kpiVal: { fontSize: 18, fontWeight: "800", fontFamily: MONO, color: COLORS.text },
  kpiSub: { fontSize: 11, marginTop: 2 },
  listCard: { backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  invRow: { flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, borderColor: COLORS.border, gap: 10 },
  invIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.cardSecondary, alignItems: "center", justifyContent: "center" },
  invSymbol: { color: COLORS.text, fontSize: 14, fontWeight: "800" },
  invMeta: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  invValue: { color: COLORS.text, fontSize: 14, fontWeight: "700", fontFamily: MONO },
  invProfit: { fontSize: 11, fontWeight: "600", marginTop: 2 },
  iconBtn: { padding: 4 },
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
