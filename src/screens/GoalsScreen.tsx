// src/screens/GoalsScreen.tsx
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
import { parseISO, differenceInCalendarDays } from "date-fns";
import { store } from "../store";
import { useStore } from "../hooks/useStore";
import { COLORS, MONO, Goal } from "../theme/constants";
import { formatTRY } from "../utils/format";

const ICONS = ["savings", "flight", "home", "directions-car", "school", "phone-iphone", "favorite", "beach-access"];
const COLOR_CHOICES = [COLORS.primary, COLORS.income, COLORS.info, COLORS.warning, COLORS.accent2];

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

export default function GoalsScreen() {
  const { width } = useWindowDimensions();
  const mob = width < 600;

  const s = useStore();
  const goals = s.goals;

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState<Goal | null>(null);
  const [title, setTitle] = useState("");
  const [target, setTarget] = useState("");
  const [current, setCurrent] = useState("");
  const [deadline, setDeadline] = useState("");
  const [icon, setIcon] = useState(ICONS[0]);
  const [color, setColor] = useState(COLORS.primary);
  const [saving, setSaving] = useState(false);

  const [contribGoal, setContribGoal] = useState<Goal | null>(null);
  const [contribAmount, setContribAmount] = useState("");

  const totals = useMemo(() => {
    const saved = goals.reduce((acc, g) => acc + (Number(g.currentAmount) || 0), 0);
    const tgt = goals.reduce((acc, g) => acc + (Number(g.targetAmount) || 0), 0);
    return { saved, target: tgt, percent: tgt > 0 ? (saved / tgt) * 100 : 0 };
  }, [goals]);

  const openAdd = () => {
    setEditing(null);
    setTitle("");
    setTarget("");
    setCurrent("");
    setDeadline("");
    setIcon(ICONS[0]);
    setColor(COLORS.primary);
    setModalOpen(true);
  };

  const openEdit = (g: Goal) => {
    setEditing(g);
    setTitle(g.title);
    setTarget(String(g.targetAmount));
    setCurrent(String(g.currentAmount));
    setDeadline(g.deadline ? g.deadline.substring(0, 10) : "");
    setIcon(g.icon || ICONS[0]);
    setColor(g.color || COLORS.primary);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!title.trim() || !target) return;
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        targetAmount: Number(target) || 0,
        currentAmount: Number(current) || 0,
        deadline: deadline ? new Date(deadline).toISOString() : "",
        icon,
        color,
      };
      if (editing) await store.updateGoal(editing.id, payload);
      else await store.addGoal(payload);
      setModalOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleContribute = async () => {
    if (!contribGoal || !contribAmount) return;
    const add = Number(contribAmount) || 0;
    const next = Math.max(0, (Number(contribGoal.currentAmount) || 0) + add);
    await store.updateGoal(contribGoal.id, { currentAmount: next });
    setContribGoal(null);
    setContribAmount("");
  };

  const pad = mob ? 16 : 32;

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: pad }} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View style={{ flex: 1, marginRight: 12 }}>
          <Text style={[styles.title, mob && { fontSize: 22 }]}>Hedefler</Text>
          {!mob && <Text style={styles.subtitle}>Birikim hedeflerinizi takip edin</Text>}
        </View>
        <TouchableOpacity style={styles.addBtn} onPress={openAdd}>
          <MaterialIcons name="add" size={18} color="#fff" />
          <Text style={styles.addBtnText}>{mob ? "Ekle" : "Hedef Ekle"}</Text>
        </TouchableOpacity>
      </View>

      <View style={[styles.summaryCard, mob && { padding: 16 }]}>
        <View style={{ flex: 1 }}>
          <Text style={styles.netLabel}>TOPLAM BİRİKİM</Text>
          <Text style={[styles.netValue, mob && { fontSize: 22 }]}>{formatTRY(totals.saved)}</Text>
          <Text style={styles.netSub}>Hedef: {formatTRY(totals.target)}</Text>
        </View>
        <View style={[styles.bigPercentBox, mob && { width: 64, height: 64, borderRadius: 32 }]}>
          <Text style={[styles.bigPercent, mob && { fontSize: 16 }]}>{Math.round(totals.percent)}%</Text>
        </View>
      </View>

      {goals.length === 0 ? (
        <View style={styles.emptyState}>
          <MaterialIcons name="flag" size={48} color={COLORS.textMuted} style={{ opacity: 0.4 }} />
          <Text style={styles.emptyText}>Henüz bir hedef yok. Hayalini planla!</Text>
        </View>
      ) : (
        <View style={[styles.grid, mob && { flexDirection: "column" }]}>
          {goals.map((g) => {
            const pct = g.targetAmount > 0 ? Math.min((g.currentAmount / g.targetAmount) * 100, 100) : 0;
            const done = pct >= 100;
            const daysLeft = g.deadline ? differenceInCalendarDays(parseISO(g.deadline), new Date()) : null;
            const gColor = g.color || COLORS.primary;
            return (
              <View key={g.id} style={[styles.goalCard, mob && { width: "100%" }]}>
                <View style={styles.goalTop}>
                  <View style={[styles.goalIcon, { backgroundColor: gColor + "22" }]}>
                    <MaterialIcons name={(g.icon || "savings") as any} size={22} color={gColor} />
                  </View>
                  <View style={styles.goalActions}>
                    <TouchableOpacity onPress={() => openEdit(g)} style={styles.iconMini}>
                      <MaterialIcons name="edit" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => confirmDelete(`"${g.title}" hedefini silmek istiyor musunuz?`, () => store.deleteGoal(g.id))}
                      style={styles.iconMini}
                    >
                      <MaterialIcons name="delete-outline" size={16} color={COLORS.textMuted} />
                    </TouchableOpacity>
                  </View>
                </View>

                <Text style={styles.goalTitle}>{g.title}</Text>
                <Text style={styles.goalAmounts}>
                  <Text style={{ color: COLORS.text, fontWeight: "800" }}>{formatTRY(g.currentAmount)}</Text>
                  <Text style={{ color: COLORS.textMuted }}> / {formatTRY(g.targetAmount)}</Text>
                </Text>

                <View style={styles.track}>
                  <View style={[styles.fill, { width: `${pct}%`, backgroundColor: done ? COLORS.income : gColor }]} />
                </View>

                <View style={styles.goalFooter}>
                  <Text style={[styles.pctText, { color: done ? COLORS.income : COLORS.textSecondary }]}>
                    {done ? "🎉 Tamamlandı" : `%${Math.round(pct)}`}
                  </Text>
                  {daysLeft !== null && (
                    <Text style={[styles.daysText, { color: daysLeft < 0 ? COLORS.expense : COLORS.textMuted }]}>
                      {daysLeft < 0 ? "Süre doldu" : `${daysLeft} gün`}
                    </Text>
                  )}
                </View>

                {!done && (
                  <TouchableOpacity
                    style={styles.contribBtn}
                    onPress={() => { setContribGoal(g); setContribAmount(""); }}
                  >
                    <MaterialIcons name="add" size={16} color={gColor} />
                    <Text style={[styles.contribBtnText, { color: gColor }]}>Para Ekle</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          })}
        </View>
      )}

      {/* Ekle / Düzenle */}
      <Modal visible={modalOpen} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setModalOpen(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalContent}>
            <Text style={styles.modalTitle}>{editing ? "Hedefi Düzenle" : "Yeni Hedef"}</Text>
            <TextInput style={styles.input} placeholder="Hedef adı (örn. Tatil)" placeholderTextColor={COLORS.textMuted} value={title} onChangeText={setTitle} />
            <View style={{ flexDirection: "row", gap: 12 }}>
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Hedef ₺" placeholderTextColor={COLORS.textMuted} value={target} onChangeText={setTarget} keyboardType="numeric" />
              <TextInput style={[styles.input, { flex: 1 }]} placeholder="Mevcut ₺" placeholderTextColor={COLORS.textMuted} value={current} onChangeText={setCurrent} keyboardType="numeric" />
            </View>
            <TextInput style={styles.input} placeholder="Son tarih (YYYY-AA-GG)" placeholderTextColor={COLORS.textMuted} value={deadline} onChangeText={setDeadline} />

            <Text style={styles.fieldLabel}>İkon</Text>
            <View style={styles.iconRow}>
              {ICONS.map((ic) => (
                <TouchableOpacity key={ic} onPress={() => setIcon(ic)} style={[styles.iconChoice, icon === ic && styles.iconChoiceActive]}>
                  <MaterialIcons name={ic as any} size={20} color={icon === ic ? "#fff" : COLORS.textMuted} />
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Renk</Text>
            <View style={styles.colorRow}>
              {COLOR_CHOICES.map((c) => (
                <TouchableOpacity key={c} onPress={() => setColor(c)} style={[styles.colorDot, { backgroundColor: c }, color === c && styles.colorDotActive]} />
              ))}
            </View>

            <TouchableOpacity style={[styles.saveBtn, saving && { opacity: 0.7 }]} onPress={handleSave} disabled={saving}>
              {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>{editing ? "Güncelle" : "Kaydet"}</Text>}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </Modal>

      {/* Para ekleme */}
      <Modal visible={!!contribGoal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setContribGoal(null)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Para Ekle · {contribGoal?.title}</Text>
            <Text style={styles.hintText}>Eklemek için pozitif, çıkarmak için negatif tutar girin.</Text>
            <TextInput style={styles.input} placeholder="Tutar ₺" placeholderTextColor={COLORS.textMuted} value={contribAmount} onChangeText={setContribAmount} keyboardType="numeric" autoFocus />
            <TouchableOpacity style={styles.saveBtn} onPress={handleContribute}>
              <Text style={styles.saveBtnText}>Uygula</Text>
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
  addBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.primary, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },

  summaryCard: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  netLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: "700", letterSpacing: 1.2 },
  netValue: { fontSize: 28, fontWeight: "900", color: COLORS.income, marginTop: 6, fontFamily: MONO },
  netSub: { fontSize: 12, color: COLORS.textMuted, marginTop: 4 },
  bigPercentBox: { width: 80, height: 80, borderRadius: 40, borderWidth: 3, borderColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  bigPercent: { fontSize: 20, fontWeight: "900", color: "#fff" },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 16 },
  goalCard: { width: 280, backgroundColor: COLORS.card, borderRadius: 16, padding: 18, borderWidth: 1, borderColor: COLORS.border },
  goalTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  goalIcon: { width: 40, height: 40, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  goalActions: { flexDirection: "row", gap: 2 },
  iconMini: { padding: 6 },
  goalTitle: { color: "#fff", fontSize: 15, fontWeight: "700" },
  goalAmounts: { fontSize: 13, marginTop: 6 },
  track: { height: 7, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden", marginTop: 12 },
  fill: { height: "100%", borderRadius: 4 },
  goalFooter: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginTop: 10 },
  pctText: { fontSize: 12, fontWeight: "700" },
  daysText: { fontSize: 11 },
  contribBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, marginTop: 14, paddingVertical: 10, borderRadius: 10, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: COLORS.border },
  contribBtnText: { fontWeight: "700", fontSize: 13 },

  emptyState: { alignItems: "center", justifyContent: "center", paddingVertical: 60 },
  emptyText: { color: COLORS.textMuted, fontSize: 14, marginTop: 16 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", padding: 16 },
  modalScroll: { width: "100%", maxWidth: 460, maxHeight: "90%" },
  modalContent: { width: "100%", maxWidth: 460, backgroundColor: COLORS.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: 19, fontWeight: "800", color: "#fff", marginBottom: 16 },
  hintText: { color: COLORS.textMuted, fontSize: 12, marginBottom: 12 },
  input: { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 14, color: "#fff", fontSize: 15, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  fieldLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: "700", marginTop: 4, marginBottom: 8 },
  iconRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  iconChoice: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: COLORS.border },
  iconChoiceActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  colorRow: { flexDirection: "row", gap: 12 },
  colorDot: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: "transparent" },
  colorDotActive: { borderColor: "#fff" },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center", marginTop: 18 },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
