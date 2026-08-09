// src/screens/GoalsScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TextInput, ActivityIndicator, Alert
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { format } from "date-fns";
import { store } from "../store";
import { COLORS, MONO, Goal } from "../theme/constants";
import { formatTRY } from "../utils/format";

const GOAL_EMOJIS = ["🏖️", "📱", "🏠", "🚗", "✈️", "💍", "🎓", "💪", "💻", "🎸", "⚽", "🌍"];

export default function GoalsScreen() {
  const [tick, setTick] = useState(0);
  const [modal, setModal] = useState<"add" | "edit" | "deposit" | "withdraw" | null>(null);
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [emoji, setEmoji] = useState("🏖️");
  const [txAmount, setTxAmount] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    store.listeners.add(fn);
    return () => { store.listeners.delete(fn); };
  }, []);

  const openAdd = () => { setTitle(""); setTarget(""); setCurrent("0"); setDeadline(""); setEmoji("🏖️"); setModal("add"); };
  const openEdit = (g: Goal) => { setSelectedGoal(g); setTitle(g.title); setTarget(String(g.targetAmount)); setCurrent(String(g.currentAmount)); setDeadline(g.deadline || ""); setEmoji(g.icon || "🏖️"); setModal("edit"); };
  const openDeposit = (g: Goal) => { setSelectedGoal(g); setTxAmount(""); setModal("deposit"); };
  const openWithdraw = (g: Goal) => { setSelectedGoal(g); setTxAmount(""); setModal("withdraw"); };
  const closeModal = () => { setModal(null); setSelectedGoal(null); };

  const handleSave = async () => {
    if (!title.trim() || !target) return;
    setBusy(true);
    try {
      const tgt = parseFloat(target.replace(",", ".")) || 0;
      const cur = parseFloat(current.replace(",", ".")) || 0;
      if (modal === "add") {
        await store.addGoal({ title: title.trim(), targetAmount: tgt, currentAmount: cur, deadline: deadline || undefined, icon: emoji, color: COLORS.primary, createdAt: new Date().toISOString() });
      } else if (selectedGoal) {
        await store.updateGoal(selectedGoal.id, { title: title.trim(), targetAmount: tgt, currentAmount: cur, deadline: deadline || undefined, icon: emoji });
      }
      closeModal();
    } finally { setBusy(false); }
  };

  const handleTransaction = async () => {
    if (!selectedGoal || !txAmount) return;
    setBusy(true);
    try {
      const amt = parseFloat(txAmount.replace(",", ".")) || 0;
      const newAmt = modal === "deposit"
        ? selectedGoal.currentAmount + amt
        : Math.max(0, selectedGoal.currentAmount - amt);
      await store.updateGoal(selectedGoal.id, { currentAmount: newAmt });
      closeModal();
    } finally { setBusy(false); }
  };

  const handleDelete = (id: string, goalTitle: string) => {
    Alert.alert("Hedefi Sil", `"${goalTitle}" hedefini silmek istiyor musunuz?`, [
      { text: "Vazgeç", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => store.deleteGoal(id) },
    ]);
  };

  return (
    <ScrollView style={s.container} contentContainerStyle={[s.scroll, { paddingBottom: 80 }]}>
      <View style={s.header}>
        <Text style={s.pageTitle}>Hedefler</Text>
        <TouchableOpacity style={s.addBtn} onPress={openAdd}>
          <MaterialIcons name="add" size={16} color="#000" />
          <Text style={s.addBtnText}>+ Hedef</Text>
        </TouchableOpacity>
      </View>

      {store.goals.length === 0 ? (
        <View style={s.emptyWrap}>
          <Text style={s.emptyIcon}>🏆</Text>
          <Text style={s.emptyText}>Henüz hedef eklenmedi.</Text>
          <TouchableOpacity style={s.emptyBtn} onPress={openAdd}>
            <Text style={s.emptyBtnText}>İlk Hedefini Ekle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={s.grid}>
          {store.goals.map((g) => {
            const pct = g.targetAmount > 0 ? Math.min((g.currentAmount / g.targetAmount) * 100, 100) : 0;
            return (
              <View key={g.id} style={s.goalCard}>
                <View style={s.cardTop}>
                  <View style={s.goalIconWrap}>
                    <Text style={{ fontSize: 24 }}>{g.icon || "🏆"}</Text>
                  </View>
                  <View style={s.cardActions}>
                    <TouchableOpacity onPress={() => openEdit(g)} style={s.iconBtn}><Text>✏️</Text></TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(g.id, g.title)} style={s.iconBtn}>
                      <MaterialIcons name="delete-outline" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={s.goalTitle}>{g.title}</Text>
                {g.deadline && <Text style={s.goalDeadline}>Hedef: {formatTRY(g.targetAmount)} · {g.deadline}</Text>}
                <Text style={s.goalCurrent}>{formatTRY(g.currentAmount)}</Text>
                <Text style={s.goalPct}>%{Math.round(pct)}</Text>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${pct}%` as any }]} />
                </View>
                <View style={s.goalBtns}>
                  <TouchableOpacity style={s.depositBtn} onPress={() => openDeposit(g)}>
                    <Text style={s.depositText}>+ Para Ekle</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={s.withdrawBtn} onPress={() => openWithdraw(g)}>
                    <Text style={s.withdrawText}>Çıkar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          })}
        </View>
      )}

      {/* Add / Edit Modal */}
      <Modal visible={modal === "add" || modal === "edit"} transparent animationType="fade">
        <View style={s.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeModal} />
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>{modal === "add" ? "Yeni Hedef" : "Hedefi Düzenle"}</Text>
            <Text style={s.lbl}>Emoji</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 14 }}>
              <View style={{ flexDirection: "row", gap: 8 }}>
                {GOAL_EMOJIS.map(e => (
                  <TouchableOpacity key={e} style={[s.emojiChip, emoji === e && s.emojiActive]} onPress={() => setEmoji(e)}>
                    <Text style={{ fontSize: 22 }}>{e}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
            <Text style={s.lbl}>Hedef Adı</Text>
            <TextInput style={s.input} value={title} onChangeText={setTitle} placeholder="Yaz Tatili, Yeni Araba..." placeholderTextColor={COLORS.textMuted} />
            <Text style={s.lbl}>Hedef Tutar (₺)</Text>
            <TextInput style={s.input} value={target} onChangeText={setTarget} placeholder="0.00" keyboardType="decimal-pad" placeholderTextColor={COLORS.textMuted} />
            <Text style={s.lbl}>Mevcut Birikim (₺)</Text>
            <TextInput style={s.input} value={current} onChangeText={setCurrent} placeholder="0.00" keyboardType="decimal-pad" placeholderTextColor={COLORS.textMuted} />
            <Text style={s.lbl}>Son Tarih (isteğe bağlı)</Text>
            <TextInput style={s.input} value={deadline} onChangeText={setDeadline} placeholder="2026-12-31" placeholderTextColor={COLORS.textMuted} />
            <View style={s.btnRow}>
              <TouchableOpacity style={s.cancelBtn} onPress={closeModal}><Text style={s.cancelText}>İptal</Text></TouchableOpacity>
              <TouchableOpacity style={s.saveBtn} onPress={handleSave} disabled={busy}>
                {busy ? <ActivityIndicator color="#000" size="small" /> : <Text style={s.saveText}>Kaydet</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Deposit / Withdraw Modal */}
      <Modal visible={modal === "deposit" || modal === "withdraw"} transparent animationType="fade">
        <View style={s.overlay}>
          <TouchableOpacity style={StyleSheet.absoluteFill} onPress={closeModal} />
          <View style={s.modalBox}>
            <Text style={s.modalTitle}>{modal === "deposit" ? "Para Ekle" : "Para Çıkar"}</Text>
            <Text style={s.goalSubInfo}>{selectedGoal?.title}</Text>
            <Text style={s.lbl}>Tutar (₺)</Text>
            <TextInput style={s.input} value={txAmount} onChangeText={setTxAmount} placeholder="0.00" keyboardType="decimal-pad" autoFocus placeholderTextColor={COLORS.textMuted} />
            <View style={s.btnRow}>
              <TouchableOpacity style={s.cancelBtn} onPress={closeModal}><Text style={s.cancelText}>İptal</Text></TouchableOpacity>
              <TouchableOpacity style={[s.saveBtn, modal === "withdraw" && { backgroundColor: COLORS.expense }]} onPress={handleTransaction} disabled={busy}>
                {busy ? <ActivityIndicator color="#000" size="small" /> : <Text style={s.saveText}>{modal === "deposit" ? "Ekle" : "Çıkar"}</Text>}
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
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12 },
  goalCard: { flex: 1, minWidth: 260, backgroundColor: COLORS.card, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: COLORS.border, gap: 8 },
  cardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  goalIconWrap: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.cardSecondary, alignItems: "center", justifyContent: "center" },
  cardActions: { flexDirection: "row", gap: 4 },
  iconBtn: { padding: 4 },
  goalTitle: { color: COLORS.text, fontSize: 16, fontWeight: "800" },
  goalDeadline: { color: COLORS.textMuted, fontSize: 11 },
  goalCurrent: { color: COLORS.primary, fontSize: 22, fontWeight: "800", fontFamily: MONO },
  goalPct: { color: COLORS.textMuted, fontSize: 12, fontWeight: "600", textAlign: "right" },
  barTrack: { height: 6, backgroundColor: COLORS.track, borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3, backgroundColor: COLORS.primary },
  goalBtns: { flexDirection: "row", gap: 10, marginTop: 4 },
  depositBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8, backgroundColor: COLORS.primary },
  depositText: { color: "#000", fontWeight: "800", fontSize: 13 },
  withdrawBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.cardSecondary },
  withdrawText: { color: COLORS.textSecondary, fontWeight: "700", fontSize: 13 },
  emptyWrap: { alignItems: "center", paddingVertical: 48, gap: 12 },
  emptyIcon: { fontSize: 40 },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
  emptyBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 20, paddingVertical: 10 },
  emptyBtnText: { color: "#000", fontWeight: "700", fontSize: 13 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalBox: { width: "100%", maxWidth: 420, backgroundColor: "#1a1f2e", borderRadius: 16, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { color: "#fff", fontSize: 18, fontWeight: "800", marginBottom: 4 },
  goalSubInfo: { color: COLORS.textMuted, fontSize: 13, marginBottom: 16 },
  lbl: { color: COLORS.textMuted, fontSize: 11, fontWeight: "700", marginBottom: 8 },
  input: { backgroundColor: COLORS.cardSecondary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: "#fff", fontSize: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14 },
  emojiChip: { width: 48, height: 48, borderRadius: 10, backgroundColor: COLORS.cardSecondary, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
  emojiActive: { borderColor: COLORS.primary, backgroundColor: "rgba(0,201,167,0.15)" },
  btnRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10, backgroundColor: COLORS.cardSecondary, borderWidth: 1, borderColor: COLORS.border },
  cancelText: { color: COLORS.textSecondary, fontWeight: "700" },
  saveBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10, backgroundColor: COLORS.primary },
  saveText: { color: "#000", fontWeight: "800" },
});
