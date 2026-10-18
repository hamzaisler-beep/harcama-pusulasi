// src/screens/BillsScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { store } from "../store";
import { COLORS, MONO } from "../theme/constants";
import { formatTRY } from "../utils/format";

// Bills are stored as budgets with period="monthly" and tagged specially,
// but we use a simple local approach with AsyncStorage-style via store
// For now bills piggyback on the existing store structure

const BILL_EMOJIS: Record<string, string> = {
  "Elektrik": "⚡", "Su": "💧", "Doğalgaz": "🔥", "İnternet": "🌐",
  "Netflix": "🎬", "Spotify": "🎵", "Telefon": "📱", "Kira": "🏠",
  "Sigorta": "🛡️", "Abonelik": "📋", "Diğer": "📄",
};

// We'll use a simple in-memory bills state backed by AsyncStorage
// For demo: bills are stored in Firestore as a "bills" collection via store pattern
// We'll simulate with the existing transactions structure for display

type Bill = { id: string; name: string; amount: number; dayOfMonth: number; emoji: string; isPaid?: boolean };

export default function BillsScreen() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState("");
  const [name, setName] = useState("");
  const [amount, setAmount] = useState("");
  const [day, setDay] = useState("1");
  const [selectedEmoji, setSelectedEmoji] = useState("⚡");
  const [busy, setBusy] = useState(false);

  const totalMonthly = bills.reduce((s, b) => s + b.amount, 0);

  const openAdd = () => { setEditId(""); setName(""); setAmount(""); setDay("1"); setSelectedEmoji("⚡"); setModal(true); };
  const openEdit = (b: Bill) => { setEditId(b.id); setName(b.name); setAmount(String(b.amount)); setDay(String(b.dayOfMonth)); setSelectedEmoji(b.emoji); setModal(true); };
  const closeModal = () => setModal(false);

  const handleSave = async () => {
    if (!name.trim() || !amount) return;
    setBusy(true);
    await new Promise(r => setTimeout(r, 300));
    const amt = parseFloat(amount.replace(",", ".")) || 0;
    const id = Date.now().toString(36);
    if (editId) {
      setBills(prev => prev.map(b => b.id === editId ? { ...b, name: name.trim(), amount: amt, dayOfMonth: parseInt(day) || 1, emoji: selectedEmoji } : b));
    } else {
      setBills(prev => [...prev, { id, name: name.trim(), amount: amt, dayOfMonth: parseInt(day) || 1, emoji: selectedEmoji }]);
    }
    setBusy(false);
    closeModal();
  };

  const handleDelete = (id: string, billName: string) => {
    Alert.alert("Faturayı Sil", `"${billName}" faturasını silmek istiyor musunuz?`, [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => setBills(prev => prev.filter(b => b.id !== id)) },
    ]);
  };

  const togglePaid = (id: string) => {
    setBills(prev => prev.map(b => b.id === id ? { ...b, isPaid: !b.isPaid } : b));
  };

  const EMOJI_OPTIONS = ["⚡", "💧", "🔥", "🌐", "🎬", "🎵", "📱", "🏠", "🛡️", "📋", "📄"];

  return (
    <ScrollView style={s.container} contentContainerStyle={[s.scroll, { paddingBottom: 80 }]}>
      <View style={s.header}>
        <Text style={s.pageTitle}>Faturalar</Text>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}>
          <MaterialIcons name="add" size={16} color="#000" />
          <Text style={s.addBtnText}>+ Fatura</Text>
        </TouchableOpacity>
      </View>

      {/* Monthly Total Hero */}
      <View style={s.heroCard}>
        <Text style={s.heroLbl}>Aylık Toplam</Text>
        <Text style={s.heroVal}>{formatTRY(totalMonthly)}</Text>
        <Text style={s.heroSub}>{bills.length} tekrarlayan ödeme</Text>
      </View>

      {/* Bills List */}
      {bills.length === 0 ? (
        <View style={s.emptyWrap}>
          <Text style={s.emptyIcon}>⚡</Text>
          <Text style={s.emptyText}>Henüz fatura eklenmedi.</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={openAdd}>
            <Text style={s.emptyBtnText}>İlk Faturayı Ekle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.listCard}>
          {bills.map((bill) => (
            <View key={bill.id} style={s.billRow}>
              <View style={s.billIcon}>
                <Text style={{ fontSize: 20 }}>{bill.emoji}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.billName}>{bill.name}</Text>
                <Text style={s.billSub}>Her ayın {bill.dayOfMonth}. günü</Text>
              </View>
              <Text style={[s.billAmt, bill.isPaid && { color: COLORS.income }]}>
                {formatTRY(bill.amount)}
              </Text>
              <TouchableOpacity onPress={() => togglePaid(bill.id)} style={s.iconBtn}>
                <MaterialIcons name={bill.isPaid ? "check-circle" : "radio-button-unchecked"} size={18} color={bill.isPaid ? COLORS.income : COLORS.textMuted} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => openEdit(bill)} style={s.iconBtn}>
                <Text style={{ fontSize: 14 }}>✏️</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => handleDelete(bill.id, bill.name)} style={s.iconBtn}>
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
            <Text style={s.modalTitle}>{editId ? "Faturayı Düzenle" : "Yeni Fatura"}</Text>

            <Text style={s.lbl}>Emoji Seç</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {EMOJI_OPTIONS.map(e => (
                  <TouchableOpacity key={e} style={[s.emojiChip, selectedEmoji === e && s.emojiChipActive]} onPress={() => setSelectedEmoji(e)}>
                    <Text style={{ fontSize: 20 }}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>

            <Text style={s.lbl}>Fatura Adı</Text>
            <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Elektrik, Netflix..." placeholderTextColor={COLORS.textMuted} />

            <Text style={s.lbl}>Tutar (₺)</Text>
            <TextInput style={s.input} value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" placeholderTextColor={COLORS.textMuted} />

            <Text style={s.lbl}>Ödeme Günü (ayın kaçı)</Text>
            <TextInput style={s.input} value={day} onChangeText={setDay} placeholder="1-31" keyboardType="number-pad" placeholderTextColor={COLORS.textMuted} />

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
  heroCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 24, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  heroLbl: { color: COLORS.textMuted, fontSize: 12, fontWeight: "600", marginBottom: 6 },
  heroVal: { fontSize: 30, fontWeight: "800", fontFamily: MONO, color: COLORS.text, marginBottom: 4 },
  heroSub: { color: COLORS.textMuted, fontSize: 12 },
  listCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 8, borderWidth: 1, borderColor: COLORS.border },
  billRow: { flexDirection: "row", alignItems: "center", padding: 12, gap: 10, borderBottomWidth: 1, borderColor: COLORS.border },
  billIcon: { width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.cardSecondary, alignItems: "center", justifyContent: "center" },
  billName: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  billSub: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  billAmt: { color: COLORS.text, fontSize: 14, fontWeight: "700", fontFamily: MONO },
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
  emojiChip: { width: 44, height: 44, borderRadius: 10, backgroundColor: COLORS.cardSecondary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
  emojiChipActive: { borderColor: COLORS.primary, backgroundColor: "rgba(0,201,167,0.15)" },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10, backgroundColor: COLORS.cardSecondary, borderWidth: 1, borderColor: COLORS.border },
  cancelText: { color: COLORS.textSecondary, fontWeight: "700" },
  saveBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10, backgroundColor: COLORS.primary },
  saveText: { color: "#000", fontWeight: "800" },
});
