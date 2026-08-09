// src/screens/DebtsScreen.tsx
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
  useWindowDimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { format, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { store } from "../store";
import { useStore } from "../hooks/useStore";
import { COLORS, MONO, Debt } from "../theme/constants";
import { formatTRY } from "../utils/format";

type DebtType = "owe" | "owed";

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

export default function DebtsScreen() {
  const { width } = useWindowDimensions();
  const mob = width < 600;

  const s = useStore();
  const debts = s.debts;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Debt | null>(null);
  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [type, setType] = useState<DebtType>("owe");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [saving, setSaving] = useState(false);

  const { owe, owed, totals } = useMemo(() => {
    const active = debts.filter((d) => !d.isSettled);
    const owe = debts.filter((d) => d.type === "owe");
    const owed = debts.filter((d) => d.type === "owed");
    const totalOwe = active.filter((d) => d.type === "owe").reduce((a, d) => a + (Number(d.amount) || 0), 0);
    const totalOwed = active.filter((d) => d.type === "owed").reduce((a, d) => a + (Number(d.amount) || 0), 0);
    return { owe, owed, totals: { totalOwe, totalOwed, net: totalOwed - totalOwe } };
  }, [debts]);

  const openAdd = (t: DebtType) => {
    setEditing(null);
    setPerson("");
    setAmount("");
    setType(t);
    setDescription("");
    setDueDate("");
    setModalOpen(true);
  };

  const openEdit = (d: Debt) => {
    setEditing(d);
    setPerson(d.person);
    setAmount(String(d.amount));
    setType(d.type);
    setDescription(d.description || "");
    setDueDate(d.dueDate ? d.dueDate.substring(0, 10) : "");
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!person.trim() || !amount) return;
    setSaving(true);
    try {
      const payload = {
        person: person.trim(),
        amount: Number(amount) || 0,
        type,
        description: description.trim(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : "",
        isSettled: editing?.isSettled || false,
      };
      if (editing) await store.updateDebt(editing.id, payload);
      else await store.addDebt(payload);
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const toggleSettled = (d: Debt) => store.updateDebt(d.id, { isSettled: !d.isSettled });

  const renderList = (items: Debt[], t: DebtType) => {
    const accent = t === "owe" ? COLORS.expense : COLORS.income;
    if (items.length === 0) {
      return <Text style={styles.emptyText}>Kayıt yok.</Text>;
    }
    return items.map((d) => (
      <View key={d.id} style={[styles.debtRow, d.isSettled && styles.debtRowSettled]}>
        <View style={[styles.avatar, { backgroundColor: accent + "22" }]}>
          <Text style={[styles.avatarText, { color: accent }]}>{d.person.substring(0, 1).toUpperCase()}</Text>
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Text style={[styles.person, d.isSettled && styles.strike]} numberOfLines={1}>{d.person}</Text>
          <Text style={styles.meta} numberOfLines={1}>
            {d.description ? d.description : t === "owe" ? "Vereceğim" : "Alacağım"}
            {d.dueDate ? ` • ${format(parseISO(d.dueDate), "d MMM", { locale: tr })}` : ""}
          </Text>
        </View>
        <View style={{ alignItems: "flex-end", marginRight: 4 }}>
          <Text style={[styles.amount, { color: d.isSettled ? COLORS.textMuted : accent }]}>{formatTRY(d.amount)}</Text>
          {d.isSettled && <Text style={styles.settledTag}>Kapandı</Text>}
        </View>
        <TouchableOpacity onPress={() => toggleSettled(d)} style={styles.iconMini}>
          <MaterialIcons name={d.isSettled ? "undo" : "check-circle-outline"} size={18} color={d.isSettled ? COLORS.textMuted : COLORS.income} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => openEdit(d)} style={styles.iconMini}>
          <MaterialIcons name="edit" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
        <TouchableOpacity onPress={() => confirmDelete(`"${d.person}" kaydını silmek istiyor musunuz?`, () => store.deleteDebt(d.id))} style={styles.iconMini}>
          <MaterialIcons name="delete-outline" size={16} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    ));
  };

  const pad = mob ? 16 : 32;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: pad }} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, mob && { fontSize: 22 }]}>Borç / Alacak</Text>
          {!mob && <Text style={styles.subtitle}>Kime borçlusun, kim sana borçlu?</Text>}
        </View>
      </View>

      {/* Stat row */}
      <View style={[styles.statRow, mob && { gap: 10 }]}>
        <View style={[styles.statBox, mob && { padding: 14 }]}>
          <Text style={styles.statLabel}>VERECEĞİM</Text>
          <Text style={[styles.statValue, { color: COLORS.expense }, mob && { fontSize: 16 }]}>{formatTRY(totals.totalOwe)}</Text>
        </View>
        <View style={[styles.statBox, mob && { padding: 14 }]}>
          <Text style={styles.statLabel}>ALACAĞIM</Text>
          <Text style={[styles.statValue, { color: COLORS.income }, mob && { fontSize: 16 }]}>{formatTRY(totals.totalOwed)}</Text>
        </View>
        <View style={[styles.statBox, mob && { padding: 14 }]}>
          <Text style={styles.statLabel}>NET</Text>
          <Text style={[styles.statValue, { color: totals.net >= 0 ? COLORS.income : COLORS.expense }, mob && { fontSize: 16 }]}>
            {totals.net >= 0 ? "+" : ""}{formatTRY(totals.net)}
          </Text>
        </View>
      </View>

      <View style={[styles.grid, mob && { flexDirection: "column", gap: 16 }]}>
        {/* Vereceklerim */}
        <View style={[styles.panel, { flex: 1 }, mob && { minWidth: 0 }]}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>VERECEKLERİM</Text>
            <TouchableOpacity style={styles.smallAdd} onPress={() => openAdd("owe")}>
              <MaterialIcons name="add" size={16} color={COLORS.expense} />
              <Text style={[styles.smallAddText, { color: COLORS.expense }]}>Ekle</Text>
            </TouchableOpacity>
          </View>
          {renderList(owe, "owe")}
        </View>

        {/* Alacaklarım */}
        <View style={[styles.panel, { flex: 1 }, mob && { minWidth: 0 }]}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>ALACAKLARIM</Text>
            <TouchableOpacity style={styles.smallAdd} onPress={() => openAdd("owed")}>
              <MaterialIcons name="add" size={16} color={COLORS.income} />
              <Text style={[styles.smallAddText, { color: COLORS.income }]}>Ekle</Text>
            </TouchableOpacity>
          </View>
          {renderList(owed, "owed")}
        </View>
      </View>

      {/* Modal */}
      <Modal visible={modalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setModalOpen(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{editing ? "Kaydı Düzenle" : "Yeni Kayıt"}</Text>

            <View style={styles.typeRow}>
              <TouchableOpacity style={[styles.typeBtn, type === "owe" && { backgroundColor: COLORS.expense, borderColor: COLORS.expense }]} onPress={() => setType("owe")}>
                <Text style={[styles.typeBtnText, type === "owe" && { color: "#fff" }]}>Vereceğim</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.typeBtn, type === "owed" && { backgroundColor: COLORS.income, borderColor: COLORS.income }]} onPress={() => setType("owed")}>
                <Text style={[styles.typeBtnText, type === "owed" && { color: "#fff" }]}>Alacağım</Text>
              </TouchableOpacity>
            </View>

            <TextInput style={styles.input} placeholder="Kişi / kurum" placeholderTextColor={COLORS.textMuted} value={person} onChangeText={setPerson} />
            <TextInput style={styles.input} placeholder="Tutar ₺" placeholderTextColor={COLORS.textMuted} value={amount} onChangeText={setAmount} keyboardType="numeric" />
            <TextInput style={styles.input} placeholder="Açıklama (opsiyonel)" placeholderTextColor={COLORS.textMuted} value={description} onChangeText={setDescription} />
            <TextInput style={styles.input} placeholder="Vade (YYYY-AA-GG, opsiyonel)" placeholderTextColor={COLORS.textMuted} value={dueDate} onChangeText={setDueDate} />

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
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },

  statRow: { flexDirection: "row", gap: 14, marginBottom: 20 },
  statBox: { flex: 1, backgroundColor: COLORS.card, borderRadius: 14, padding: 18, borderWidth: 1, borderColor: COLORS.border },
  statLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: "700", letterSpacing: 0.8 },
  statValue: { fontSize: 20, fontWeight: "900", marginTop: 6, fontFamily: MONO },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 20 },
  panel: { minWidth: 300, backgroundColor: COLORS.card, borderRadius: 20, padding: 20, borderWidth: 1, borderColor: COLORS.border },
  panelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  panelTitle: { fontSize: 11, color: COLORS.textMuted, fontWeight: "700", letterSpacing: 1.2 },
  smallAdd: { flexDirection: "row", alignItems: "center", gap: 4 },
  smallAddText: { fontSize: 12, fontWeight: "700" },

  debtRow: { flexDirection: "row", alignItems: "center", paddingVertical: 11, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  debtRowSettled: { opacity: 0.55 },
  avatar: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", marginRight: 10 },
  avatarText: { fontWeight: "800", fontSize: 14 },
  person: { color: "#fff", fontSize: 14, fontWeight: "700" },
  strike: { textDecorationLine: "line-through" },
  meta: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  amount: { fontSize: 14, fontWeight: "800", fontFamily: MONO },
  settledTag: { fontSize: 9, color: COLORS.textMuted, marginTop: 2 },
  iconMini: { padding: 5 },
  emptyText: { color: COLORS.textMuted, fontSize: 13, textAlign: "center", paddingVertical: 20 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", padding: 16 },
  modalContent: { width: "100%", maxWidth: 460, backgroundColor: COLORS.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: 19, fontWeight: "800", color: "#fff", marginBottom: 18 },
  typeRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  typeBtn: { flex: 1, paddingVertical: 12, alignItems: "center", borderRadius: 10, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: COLORS.border },
  typeBtnText: { color: COLORS.textMuted, fontWeight: "700", fontSize: 13 },
  input: { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 14, color: "#fff", fontSize: 15, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 10 },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
