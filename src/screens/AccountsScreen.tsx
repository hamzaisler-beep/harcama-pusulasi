// src/screens/AccountsScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert, Platform
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { store } from "../store";
import { COLORS, MONO, Account } from "../theme/constants";
import { formatTRY } from "../utils/format";

const ACCOUNT_TYPES = [
  { value: "BANK", label: "Banka", icon: "account-balance", emoji: "🏦" },
  { value: "CASH", label: "Nakit", icon: "payments", emoji: "💵" },
  { value: "CARD", label: "Kredi Kartı", icon: "credit-card", emoji: "💳" },
];

export default function AccountsScreen() {
  const [tick, setTick] = useState(0);
  const [modal, setModal] = useState<"add" | "edit" | null>(null);
  const [editId, setEditId] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState<"BANK" | "CASH" | "CARD">("BANK");
  const [balance, setBalance] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    store.listeners.add(fn);
    return () => { store.listeners.delete(fn); };
  }, []);

  const totalBalance = store.accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0);

  const openAdd = () => { setName(""); setType("BANK"); setBalance(""); setModal("add"); };
  const openEdit = (acc: Account) => { setEditId(acc.id); setName(acc.name); setType(acc.type); setBalance(String(acc.balance)); setModal("edit"); };
  const closeModal = () => setModal(null);

  const handleSave = async () => {
    if (!name.trim()) return;
    setBusy(true);
    try {
      const bal = parseFloat(balance.replace(",", ".")) || 0;
      if (modal === "add") {
        await store.addAccount({ name: name.trim(), type, balance: bal, color: COLORS.primary });
      } else {
        await store.updateAccount(editId, { name: name.trim(), type, balance: bal });
      }
      closeModal();
    } finally { setBusy(false); }
  };

  const handleDelete = (id: string, accName: string) => {
    Alert.alert("Hesabı Sil", `"${accName}" hesabını silmek istediğinizden emin misiniz?`, [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => store.deleteAccount(id) },
    ]);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={[s.scroll, { paddingBottom: 80 }]}>
      {/* Header */}
      <View style={s.header}>
        <Text style={s.pageTitle}>Hesaplar</Text>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}>
          <MaterialIcons name="add" size={16} color="#000" />
          <Text style={s.addBtnText}>+ Hesap</Text>
        </TouchableOpacity>
      </View>

      {/* Total Balance Hero */}
      <View style={s.heroCard}>
        <Text style={s.heroLabel}>Toplam Bakiye</Text>
        <Text style={[s.heroValue, { color: totalBalance < 0 ? COLORS.expense : COLORS.text }]}>
          {totalBalance < 0 ? "-" : ""}{formatTRY(Math.abs(totalBalance))}
        </Text>
      </View>

      {/* Account Cards Grid */}
      {store.accounts.length === 0 ? (
        <View style={s.emptyWrap}>
          <Text style={s.emptyIcon}>🏦</Text>
          <Text style={s.emptyText}>Henüz hesap eklenmedi.</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={openAdd}>
            <Text style={s.emptyBtnText}>İlk Hesabı Ekle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.grid}>
          {store.accounts.map((acc) => {
            const accType = ACCOUNT_TYPES.find(t => t.value === acc.type);
            return (
              <View key={acc.id} style={s.accCard}>
                <View style={s.accCardTop}>
                  <Text style={s.accEmoji}>{accType?.emoji || "🏦"}</Text>
                  <View style={s.accActions}>
                    <TouchableOpacity onPress={() => openEdit(acc)} style={s.actionBtn}>
                      <Text style={s.editIcon}>✏️</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(acc.id, acc.name)} style={s.actionBtn}>
                      <MaterialIcons name="delete-outline" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={s.accName}>{acc.name}</Text>
                <Text style={s.accTypeLbl}>{accType?.label || acc.type}</Text>
                <Text style={[s.accBalance, { color: acc.balance < 0 ? COLORS.expense : COLORS.text }]}>
                  {acc.balance < 0 ? "-" : ""}{formatTRY(Math.abs(acc.balance))}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Add/Edit Modal */}
      <Modal visible={modal !== null} transparent animationType="fade">
        <View style={s.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeModal} />
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>{modal === "add" ? "Yeni Hesap" : "Hesabı Düzenle"}</Text>

            <Text style={s.lbl}>Hesap Adı</Text>
            <TextInput style={s.input} value={name} onChangeText={setName} placeholder="Hesap adı" placeholderTextColor={COLORS.textMuted} />

            <Text style={s.lbl}>Tür</Text>
            <View style={s.typeRow}>
              {ACCOUNT_TYPES.map(t => (
                <TouchableOpacity key={t.value} style={[s.typeChip, type === t.value && s.typeChipActive]} onPress={() => setType(t.value as any)}>
                  <Text style={s.typeChipText}>{t.emoji} {t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={s.lbl}>Bakiye (₺)</Text>
            <TextInput style={s.input} value={balance} onChangeText={setBalance} placeholder="0.00" placeholderTextColor={COLORS.textMuted} keyboardType="decimal-pad" />

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

  heroCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: COLORS.border },
  heroLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: "600", marginBottom: 8 },
  heroValue: { fontSize: 32, fontWeight: "800", fontFamily: MONO },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  accCard: { flex: 1, minWidth: 140, maxWidth: "100%", backgroundColor: COLORS.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  accCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 12 },
  accEmoji: { fontSize: 24 },
  accActions: { flexDirection: "row", gap: 6 },
  actionBtn: { padding: 4 },
  editIcon: { fontSize: 14 },
  accName: { color: COLORS.text, fontSize: 14, fontWeight: "700", marginBottom: 2 },
  accTypeLbl: { color: COLORS.textMuted, fontSize: 11, marginBottom: 10 },
  accBalance: { fontSize: 20, fontWeight: "800", fontFamily: MONO },

  emptyWrap: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyIcon: { fontSize: 40 },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
  emptyBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  emptyBtnText: { color: "#000", fontWeight: "700", fontSize: 13 },

  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalBox: { width: "100%", maxWidth: 400, backgroundColor: "#1a1f2e", borderRadius: 16, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 20 },
  lbl: { color: COLORS.textMuted, fontSize: 11, fontWeight: "700", marginBottom: 6 },
  input: { backgroundColor: COLORS.cardSecondary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: "#fff", fontSize: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14 },
  typeRow: { flexDirection: "row", gap: 8, marginBottom: 14, flexWrap: "wrap" },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.cardSecondary },
  typeChipActive: { backgroundColor: "rgba(0,201,167,0.15)", borderColor: COLORS.primary },
  typeChipText: { color: COLORS.text, fontSize: 12, fontWeight: "600" },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10, backgroundColor: COLORS.cardSecondary, borderWidth: 1, borderColor: COLORS.border },
  cancelText: { color: COLORS.textSecondary, fontWeight: "700" },
  saveBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10, backgroundColor: COLORS.primary },
  saveText: { color: "#000", fontWeight: "800" },
});
