// src/screens/AccountsScreen.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Platform,
  TouchableWithoutFeedback,
  ActivityIndicator,
  Alert,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { store } from "../store";
import { useStore } from "../hooks/useStore";
import { COLORS, Account } from "../theme/constants";
import { formatTRY } from "../utils/format";

type AccType = "CASH" | "BANK" | "CARD";

const ACCOUNT_TYPES: { key: AccType; label: string; icon: any }[] = [
  { key: "CASH", label: "Nakit", icon: "payments" },
  { key: "BANK", label: "Banka", icon: "account-balance" },
  { key: "CARD", label: "Kredi Kartı", icon: "credit-card" },
];

const COLOR_CHOICES = [
  COLORS.primary,
  COLORS.income,
  COLORS.info,
  COLORS.warning,
  COLORS.accent2,
  COLORS.expense,
];

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

export default function AccountsScreen() {
  const s = useStore();
  const accounts = s.accounts;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Account | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState<AccType>("BANK");
  const [balance, setBalance] = useState("");
  const [color, setColor] = useState(COLORS.primary);
  const [saving, setSaving] = useState(false);

  const totalBalance = useMemo(
    () => accounts.reduce((sum, a) => sum + (Number(a.balance) || 0), 0),
    [accounts]
  );

  const openAdd = () => {
    setEditing(null);
    setName("");
    setType("BANK");
    setBalance("");
    setColor(COLORS.primary);
    setModalOpen(true);
  };

  const openEdit = (a: Account) => {
    setEditing(a);
    setName(a.name);
    setType(a.type);
    setBalance(String(a.balance));
    setColor(a.color || COLORS.primary);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        type,
        balance: Number(balance) || 0,
        color,
      };
      if (editing) {
        await store.updateAccount(editing.id, payload);
      } else {
        await store.addAccount(payload);
      }
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const typeMeta = (t: AccType) =>
    ACCOUNT_TYPES.find((x) => x.key === t) || ACCOUNT_TYPES[0];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollInside}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Hesaplar</Text>
          <Text style={styles.subtitle}>Nakit, banka ve kart bakiyeleriniz</Text>
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <MaterialIcons name="add" size={20} color="#fff" />
          <Text style={styles.addBtnText}>Hesap Ekle</Text>
        </TouchableOpacity>
      </View>

      {/* Net worth banner */}
      <View style={styles.netCard}>
        <Text style={styles.netLabel}>TOPLAM VARLIK</Text>
        <Text style={[styles.netValue, { color: totalBalance >= 0 ? COLORS.income : COLORS.expense }]}>
          {formatTRY(totalBalance)}
        </Text>
        <Text style={styles.netSub}>{accounts.length} hesap</Text>
      </View>

      {/* Account cards */}
      {accounts.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="account-balance-wallet" size={48} color={COLORS.textMuted} style={{ opacity: 0.4 }} />
          <Text style={styles.emptyText}>Henüz hesap eklemediniz.</Text>
          <TouchableOpacity style={[styles.addBtn, { marginTop: 16 }]} onPress={openAdd}>
            <MaterialIcons name="add" size={18} color="#fff" />
            <Text style={styles.addBtnText}>İlk hesabını ekle</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.cardsGrid}>
          {accounts.map((a) => {
            const meta = typeMeta(a.type);
            return (
              <View key={a.id} style={[styles.accCard, { borderTopColor: a.color || COLORS.primary }]}>
                <View style={styles.accCardTop}>
                  <View style={[styles.accIcon, { backgroundColor: (a.color || COLORS.primary) + "22" }]}>
                    <MaterialIcons name={meta.icon} size={22} color={a.color || COLORS.primary} />
                  </View>
                  <View style={styles.accActions}>
                    <TouchableOpacity onPress={() => openEdit(a)} style={styles.iconMini}>
                      <MaterialIcons name="edit" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() =>
                        confirmDelete(`"${a.name}" hesabını silmek istiyor musunuz?`, () =>
                          store.deleteAccount(a.id)
                        )
                      }
                      style={styles.iconMini}
                    >
                      <MaterialIcons name="delete-outline" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>
                <Text style={styles.accName}>{a.name}</Text>
                <Text style={styles.accType}>{meta.label}</Text>
                <Text style={[styles.accBalance, { color: a.balance >= 0 ? COLORS.text : COLORS.expense }]}>
                  {formatTRY(a.balance)}
                </Text>
              </View>
            );
          })}
        </View>
      )}

      {/* Add / Edit Modal */}
      <Modal visible={modalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setModalOpen(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editing ? "Hesabı Düzenle" : "Yeni Hesap"}</Text>

            <TextInput
              style={styles.input}
              placeholder="Hesap adı (örn. Ziraat Vadesiz)"
              placeholderTextColor={COLORS.textMuted}
              value={name}
              onChangeText={setName}
            />

            <Text style={styles.fieldLabel}>Tür</Text>
            <View style={styles.typeRow}>
              {ACCOUNT_TYPES.map((t) => (
                <TouchableOpacity
                  key={t.key}
                  style={[styles.typeChip, type === t.key && styles.typeChipActive]}
                  onPress={() => setType(t.key)}
                >
                  <MaterialIcons name={t.icon} size={16} color={type === t.key ? "#fff" : COLORS.textMuted} />
                  <Text style={[styles.typeChipText, type === t.key && { color: "#fff" }]}>{t.label}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Bakiye (₺)</Text>
            <TextInput
              style={styles.input}
              placeholder="0"
              placeholderTextColor={COLORS.textMuted}
              value={balance}
              onChangeText={setBalance}
              keyboardType="numeric"
            />

            <Text style={styles.fieldLabel}>Renk</Text>
            <View style={styles.colorRow}>
              {COLOR_CHOICES.map((c) => (
                <TouchableOpacity
                  key={c}
                  onPress={() => setColor(c)}
                  style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]}
                />
              ))}
            </View>

            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editing ? "Güncelle" : "Kaydet"}</Text>}
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollInside: { padding: 32 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  netCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: COLORS.border, marginBottom: 24 },
  netLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: "700", letterSpacing: 1.2 },
  netValue: { fontSize: 34, fontWeight: "900", marginTop: 8, fontFamily: Platform.OS === "web" ? "monospace" : undefined },
  netSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },

  cardsGrid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  accCard: { width: 240, backgroundColor: COLORS.card, borderRadius: 14, padding: 20, borderWidth: 1, borderColor: COLORS.border, borderTopWidth: 3 },
  accCardTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  accIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  accActions: { flexDirection: "row", gap: 4 },
  iconMini: { padding: 6 },
  accName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  accType: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  accBalance: { fontSize: 22, fontWeight: "800", marginTop: 16, fontFamily: Platform.OS === "web" ? "monospace" : undefined },

  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { color: COLORS.textMuted, fontSize: 14, marginTop: 16 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { width: "100%", maxWidth: 460, backgroundColor: COLORS.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#fff", marginBottom: 20 },
  input: { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 14, color: "#fff", fontSize: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 4 },
  fieldLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  typeRow: { flexDirection: "row", gap: 8 },
  typeChip: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 10, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: COLORS.border },
  typeChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  typeChipText: { color: COLORS.textMuted, fontWeight: "700", fontSize: 12 },
  colorRow: { flexDirection: "row", gap: 12 },
  colorDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 2, borderColor: "transparent" },
  colorDotActive: { borderColor: "#fff" },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 24 },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
