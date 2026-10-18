// src/screens/DebtsScreen.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { store } from "../store";
import { COLORS, MONO, Debt } from "../theme/constants";
import { formatTRY } from "../utils/format";

export default function DebtsScreen() {
  const [tick, setTick] = useState(0);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState("");
  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<"owe" | "owed">("owed");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    store.listeners.add(fn);
    return () => { store.listeners.delete(fn); };
  }, []);

  const activeDebts = store.debts.filter(d => !d.isSettled);

  const totals = useMemo(() => {
    const owe = activeDebts.filter(d => d.type === "owe").reduce((s, d) => s + (Number(d.amount) || 0), 0);
    const owed = activeDebts.filter(d => d.type === "owed").reduce((s, d) => s + (Number(d.amount) || 0), 0);
    return { owe, owed };
  }, [store.debts, tick]);

  const openAdd = () => { setEditId(""); setPerson(""); setAmount(""); setType("owed"); setDescription(""); setDueDate(""); setModal(true); };
  const openEdit = (d: Debt) => { setEditId(d.id); setPerson(d.person); setAmount(String(d.amount)); setType(d.type); setDescription(d.description || ""); setDueDate(d.dueDate || ""); setModal(true); };
  const closeModal = () => setModal(false);

  const handleSave = async () => {
    if (!person.trim() || !amount) return;
    setBusy(true);
    try {
      const amt = parseFloat(amount.replace(",", ".")) || 0;
      if (editId) {
        await store.updateDebt(editId, { person: person.trim(), amount: amt, type, description: description.trim(), dueDate: dueDate || undefined });
      } else {
        await store.addDebt({ person: person.trim(), amount: amt, type, description: description.trim(), dueDate: dueDate || undefined, isSettled: false, createdAt: new Date().toISOString() });
      }
      closeModal();
    } finally { setBusy(false); }
  };

  const handleSettle = (id: string) => store.updateDebt(id, { isSettled: true });

  const handleDelete = (id: string, personName: string) => {
    Alert.alert("Kaydı Sil", `"${personName}" kaydını silmek istiyor musunuz?`, [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => store.deleteDebt(id) },
    ]);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={[s.scroll, { paddingBottom: 80 }]}>
      <View style={s.header}>
        <Text style={s.pageTitle}>Borç / Alacak</Text>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}>
          <MaterialIcons name="add" size={16} color="#000" />
          <Text style={s.addBtnText}>+ Kayıt</Text>
        </TouchableOpacity>
      </View>

      {/* 2 KPI Cards */}
      <View style={s.kpiRow}>
        <View style={[s.kpiCard, { borderTopWidth: 3, borderTopColor: COLORS.expense }]}>
          <Text style={s.kpiLbl}>Vereceğim (Borç)</Text>
          <Text style={[s.kpiVal, { color: COLORS.expense }]}>{formatTRY(totals.owe)}</Text>
          <Text style={s.kpiSub}>Ödenmemiş</Text>
          <Text style={s.kpiEmoji}>📕</Text>
        </View>
        <View style={[s.kpiCard, { borderTopWidth: 3, borderTopColor: COLORS.income }]}>
          <Text style={s.kpiLbl}>Alacağım</Text>
          <Text style={[s.kpiVal, { color: COLORS.income }]}>{formatTRY(totals.owed)}</Text>
          <Text style={s.kpiSub}>Tahsil edilmemiş</Text>
          <Text style={s.kpiEmoji}>📗</Text>
        </View>
      </View>

      {/* Debt List */}
      {activeDebts.length === 0 ? (
        <View style={s.emptyWrap}>
          <Text style={s.emptyIcon}>🤝</Text>
          <Text style={s.emptyText}>Aktif borç / alacak kaydı yok.</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={openAdd}>
            <Text style={s.emptyBtnText}>Kayıt Ekle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.listCard}>
          {activeDebts.map((d) => (
            <View key={d.id} style={s.debtRow}>
              <View style={[s.debtAvatar, { backgroundColor: d.type === "owed" ? "rgba(16,185,129,0.15)" : "rgba(248,113,113,0.15)" }]}>
                <Text style={{ fontSize: 18 }}>{d.type === "owed" ? "📗" : "📕"}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.debtPerson}>{d.person}</Text>
                <Text style={s.debtMeta}>
                  {d.type === "owed" ? "Alacağım" : "Vereceğim"}
                  {d.dueDate ? ` · Vade ${d.dueDate}` : ""}
                  {d.description ? ` · ${d.description}` : ""}
                </Text>
              </View>
              <Text style={[s.debtAmt, { color: d.type === "owed" ? COLORS.income : COLORS.expense }]}>
                {formatTRY(d.amount)}
              </Text>
              <TouchableOpacity onPress={() => handleSettle(d.id)} style={s.iconBtn}>
                <MaterialIcons name="check-circle-outline" size={18} color={COLORS.income} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openEdit(d)} style={s.iconBtn}><Text>✏️</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(d.id, d.person)} style={s.iconBtn}>
                <MaterialIcons name="delete-outline" size={16} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>
          ))}
        </View>
      )}

      <Modal visible={modal} transparent animationType="fade">
        <View style={s.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeModal} />
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>{editId ? "Kaydı Düzenle" : "Yeni Kayıt"}</Text>
            <Text style={s.lbl}>Tür</Text>
            <View style={s.typeRow}>
              <TouchableOpacity style={[s.typeBtn, type === "owed" && s.typeBtnActive]} onPress={() => setType("owed")}>
                <Text style={[s.typeBtnText, type === "owed" && { color: COLORS.income }]}>📗 Alacağım</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.typeBtn, type === "owe" && s.typeBtnActiveRed]} onPress={() => setType("owe")}>
                <Text style={[s.typeBtnText, type === "owe" && { color: COLORS.expense }]}>📕 Vereceğim</Text>
              </TouchableOpacity>
            </View>
            <Text style={s.lbl}>Kişi Adı</Text>
            <TextInput style={s.input} value={person} onChangeText={setPerson} placeholder="Ad Soyad" placeholderTextColor={COLORS.textMuted} />
            <Text style={s.lbl}>Tutar (₺)</Text>
            <TextInput style={s.input} value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" placeholderTextColor={COLORS.textMuted} />
            <Text style={s.lbl}>Açıklama (isteğe bağlı)</Text>
            <TextInput style={s.input} value={description} onChangeText={setDescription} placeholder="Borç para, kira..." placeholderTextColor={COLORS.textMuted} />
            <Text style={s.lbl}>Vade Tarihi (isteğe bağlı)</Text>
            <TextInput style={s.input} value={dueDate} onChangeText={setDueDate} placeholder="2026-12-31" placeholderTextColor={COLORS.textMuted} />
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
  kpiRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  kpiCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 12, padding: 18, borderWidth: 1, borderColor: COLORS.border, position: "relative" },
  kpiLbl: { color: COLORS.textMuted, fontSize: 11, fontWeight: "600", marginBottom: 8 },
  kpiVal: { fontSize: 22, fontWeight: "800", fontFamily: MONO, marginBottom: 4 },
  kpiSub: { color: COLORS.textMuted, fontSize: 11 },
  kpiEmoji: { position: "absolute", right: 14, top: 14, fontSize: 22 },
  listCard: { backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, overflow: "hidden" },
  debtRow: { flexDirection: "row", alignItems: "center", padding: 14, borderBottomWidth: 1, borderColor: COLORS.border, gap: 10 },
  debtAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  debtPerson: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  debtMeta: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  debtAmt: { fontSize: 14, fontWeight: "800", fontFamily: MONO },
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
  typeRow: { flexDirection: "row", gap: 10, marginBottom: 14 },
  typeBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.cardSecondary },
  typeBtnActive: { borderColor: COLORS.income, backgroundColor: "rgba(16,185,129,0.1)" },
  typeBtnActiveRed: { borderColor: COLORS.expense, backgroundColor: "rgba(248,113,113,0.1)" },
  typeBtnText: { color: COLORS.textSecondary, fontWeight: "700" },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10, backgroundColor: COLORS.cardSecondary, borderWidth: 1, borderColor: COLORS.border },
  cancelText: { color: COLORS.textSecondary, fontWeight: "700" },
  saveBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10, backgroundColor: COLORS.primary },
  saveText: { color: "#000", fontWeight: "800" },
});
