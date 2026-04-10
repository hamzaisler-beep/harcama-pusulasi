// src/screens/SavingsScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useSavings } from "../store/useStore";
import { COLORS, RATES, SavingType, Saving } from "../types";
import { formatCurrency } from "../utils/format";
import { fetchMarketRates, MarketRate } from "../services/api";

const SAVING_TYPES: { value: SavingType; label: string; symbol: string; color: string; bg: string }[] = [
  { value: "ALTIN", label: "Altın", symbol: "gr", color: COLORS.amber, bg: COLORS.amberLight },
  { value: "USD", label: "Dolar", symbol: "$", color: COLORS.income, bg: COLORS.incomeLight },
  { value: "EUR", label: "Euro", symbol: "€", color: COLORS.primary, bg: COLORS.primaryLight },
];

export default function SavingsScreen() {
  const { savings, addSaving, deleteSaving } = useSavings();
  const [selectedType, setSelectedType] = useState<SavingType>("ALTIN");
  const [amount, setAmount] = useState("");
  const [liveRates, setLiveRates] = useState<MarketRate | null>(null);
  const [loading, setLoading] = useState(false);

  const currentRates = liveRates || RATES;

  useEffect(() => {
    getRates();
  }, []);

  const getRates = async () => {
    setLoading(true);
    try {
      const data = await fetchMarketRates();
      setLiveRates(data);
    } catch (e) {
      console.error("Rates fetch error", e);
      // Fallback to static RATES is already handled by currentRates logic
    } finally {
      setLoading(false);
    }
  };

  const totalTL = savings.reduce((sum, s) => sum + s.amount * currentRates[s.type], 0);

  const totalByType = (type: SavingType) =>
    savings.filter((s) => s.type === type).reduce((sum, s) => sum + s.amount, 0);

  const handleAdd = () => {
    const parsed = parseFloat(amount.replace(",", "."));
    if (isNaN(parsed) || parsed <= 0) {
      Alert.alert("Geçersiz Miktar", "Lütfen geçerli bir miktar girin.");
      return;
    }
    addSaving({ type: selectedType, amount: parsed });
    setAmount("");
    Alert.alert("Başarılı", "Birikim eklendi.");
  };

  const confirmDelete = (s: Saving) => {
    Alert.alert("Birikiimi Sil", `${s.amount} ${s.type} birikimini silmek istiyor musunuz?`, [
      { text: "İptal", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => deleteSaving(s.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Birikimlerim</Text>
          <TouchableOpacity onPress={getRates} disabled={loading} style={styles.refreshBtn}>
            <MaterialIcons name="refresh" size={20} color={COLORS.primary} />
            <Text style={styles.refreshText}>{loading ? "Güncelleniyor..." : "Güncelle"}</Text>
          </TouchableOpacity>
        </View>

        {/* Total Card */}
        <View style={styles.totalCard}>
          <Text style={styles.totalLabel}>Toplam Birikim Değeri</Text>
          <Text style={styles.totalValue}>{formatCurrency(totalTL)}</Text>
          <Text style={styles.totalSub}>
            {liveRates ? "Canlı piyasa verileriyle hesaplandı" : "Demo kurlarıyla hesaplandı"}
          </Text>
        </View>

        {/* Rate Cards */}
        <View style={styles.rateRow}>
          {SAVING_TYPES.map((st) => (
            <View key={st.value} style={[styles.rateCard, { backgroundColor: st.bg }]}>
              <Text style={[styles.rateLabel, { color: st.color }]}>{st.label}</Text>
              <Text style={[styles.rateValue, { color: st.color }]}>
                {formatCurrency(currentRates[st.value])}
              </Text>
              <Text style={[styles.rateHeld, { color: st.color }]}>
                {totalByType(st.value).toFixed(2)} {st.symbol}
              </Text>
            </View>
          ))}
        </View>

        {/* Add Form */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Birikim Ekle</Text>
          <View style={styles.typeRow}>
            {SAVING_TYPES.map((st) => (
              <TouchableOpacity
                key={st.value}
                style={[styles.typeChip, selectedType === st.value && { backgroundColor: st.bg, borderColor: st.color }]}
                onPress={() => setSelectedType(st.value)}
              >
                <Text style={[styles.typeChipText, selectedType === st.value && { color: st.color }]}>
                  {st.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="Miktar girin..."
              placeholderTextColor={COLORS.textMuted}
              value={amount}
              onChangeText={setAmount}
              keyboardType="decimal-pad"
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
              <MaterialIcons name="add" size={20} color="#fff" />
              <Text style={styles.addBtnText}>Ekle</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Savings List */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Varlık Listesi</Text>
          {savings.length === 0 ? (
            <View style={styles.empty}>
              <MaterialIcons name="savings" size={40} color={COLORS.textMuted} />
              <Text style={styles.emptyText}>Henüz birikim yok</Text>
            </View>
          ) : (
            savings.map((s) => {
              const st = SAVING_TYPES.find((x) => x.value === s.type)!;
              const tl = s.amount * currentRates[s.type];
              return (
                <View key={s.id} style={styles.savingRow}>
                  <View style={[styles.savingIcon, { backgroundColor: st.bg }]}>
                    <Text style={[styles.savingIconText, { color: st.color }]}>{s.type === "ALTIN" ? "AU" : s.type}</Text>
                  </View>
                  <View style={styles.savingInfo}>
                    <Text style={styles.savingMain}>
                      {s.amount} {st.symbol === "gr" ? "gram" : st.symbol}
                    </Text>
                    <Text style={styles.savingTL}>{formatCurrency(tl)} TL karşılığı</Text>
                  </View>
                  <TouchableOpacity onPress={() => confirmDelete(s)} style={styles.delBtn}>
                    <MaterialIcons name="delete-outline" size={18} color={COLORS.textMuted} />
                  </TouchableOpacity>
                </View>
              );
            })
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 32, gap: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  refreshBtn: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "#fff", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border },
  refreshText: { fontSize: 12, fontWeight: "600", color: COLORS.primary },
  totalCard: {
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    padding: 20,
  },
  totalLabel: { fontSize: 13, color: "rgba(255,255,255,0.7)", fontWeight: "500" },
  totalValue: { fontSize: 30, fontWeight: "700", color: "#fff", marginTop: 4, marginBottom: 4 },
  totalSub: { fontSize: 11, color: "rgba(255,255,255,0.5)" },
  rateRow: { flexDirection: "row", gap: 10 },
  rateCard: { flex: 1, borderRadius: 14, padding: 12 },
  rateLabel: { fontSize: 11, fontWeight: "600", marginBottom: 2 },
  rateValue: { fontSize: 13, fontWeight: "700" },
  rateHeld: { fontSize: 11, marginTop: 4 },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
    gap: 12,
  },
  cardTitle: { fontSize: 15, fontWeight: "600", color: COLORS.textPrimary },
  typeRow: { flexDirection: "row", gap: 8 },
  typeChip: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  typeChipText: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  inputRow: { flexDirection: "row", gap: 8 },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 4,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  empty: { alignItems: "center", paddingVertical: 24 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 8 },
  savingRow: { flexDirection: "row", alignItems: "center" },
  savingIcon: { width: 42, height: 42, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 12 },
  savingIconText: { fontSize: 13, fontWeight: "700" },
  savingInfo: { flex: 1 },
  savingMain: { fontSize: 15, fontWeight: "600", color: COLORS.textPrimary },
  savingTL: { fontSize: 12, color: COLORS.textSecondary, marginTop: 2 },
  delBtn: { padding: 4 },
});
