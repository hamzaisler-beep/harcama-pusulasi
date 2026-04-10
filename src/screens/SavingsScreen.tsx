import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useSavings } from "../store/useStore";
import { COLORS, RATES, SavingType, Saving } from "../types";
import { formatCurrency } from "../utils/format";
import { fetchMarketRates, MarketRate } from "../services/api";

const SAVING_TYPES: { value: SavingType; label: string; symbol: string; color: string }[] = [
  { value: "ALTIN", label: "Altın", symbol: "gr", color: COLORS.amber },
  { value: "USD", label: "Dolar", symbol: "$", color: COLORS.income },
  { value: "EUR", label: "Euro", symbol: "€", color: COLORS.primary },
];

export default function SavingsScreen() {
  const { savings, addSaving, deleteSaving } = useSavings();
  const [selectedType, setSelectedType] = useState<SavingType>("ALTIN");
  const [amount, setAmount] = useState("");
  const [liveRates, setLiveRates] = useState<MarketRate | null>(null);
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isWeb = width > 1024;

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
    Alert.alert("Birikimi Sil", `${s.amount} ${s.type} birikimini silmek istiyor musunuz?`, [
      { text: "İptal", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => deleteSaving(s.id) },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.content, isWeb && styles.webContent]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
            <View>
                <Text style={styles.title}>Birikim ve Varlıklar</Text>
                <Text style={styles.subtitle}>Net değerinizi ve birikimlerinizi takip edin</Text>
            </View>
            <TouchableOpacity onPress={getRates} disabled={loading} style={styles.refreshBtn}>
                <MaterialIcons name="refresh" size={18} color={COLORS.primary} />
                <Text style={styles.refreshText}>{loading ? "..." : "Güncelle"}</Text>
            </TouchableOpacity>
        </View>

        <View style={[styles.mainGrid, isWeb && styles.mainGridWeb]}>
            <View style={styles.leftCol}>
                {/* Total Value Card */}
                <View style={styles.totalCard}>
                    <View style={styles.totalHeader}>
                        <View style={styles.totalIconBox}>
                            <MaterialIcons name="account-balance-wallet" size={24} color={COLORS.primary} />
                        </View>
                        <Text style={styles.totalLabel}>TOPLAM NET DEĞER</Text>
                    </View>
                    <Text style={styles.totalValue}>{formatCurrency(totalTL)}</Text>
                    <View style={styles.totalFooter}>
                        <View style={[styles.tag, { backgroundColor: liveRates ? COLORS.income + "15" : COLORS.amber + "15" }]}>
                            <View style={[styles.dot, { backgroundColor: liveRates ? COLORS.income : COLORS.amber }]} />
                            <Text style={[styles.tagText, { color: liveRates ? COLORS.income : COLORS.amber }]}>
                                {liveRates ? "Canlı Piyasa" : "Statik Kurlar"}
                            </Text>
                        </View>
                    </View>
                </View>

                {/* Individual Asset Cards */}
                <View style={styles.assetRow}>
                    {SAVING_TYPES.map(st => (
                        <View key={st.value} style={styles.assetCard}>
                            <View style={styles.assetHeader}>
                                <Text style={[styles.assetTag, { color: st.color, backgroundColor: st.color + "15" }]}>
                                    {st.value === "ALTIN" ? "AU" : st.symbol}
                                </Text>
                                <Text style={styles.assetName}>{st.label}</Text>
                            </View>
                            <Text style={styles.assetPrice}>{formatCurrency(currentRates[st.value])}</Text>
                            <Text style={styles.assetHeld}>{totalByType(st.value).toFixed(2)} {st.symbol}</Text>
                        </View>
                    ))}
                </View>

                {/* Add Form */}
                <View style={styles.card}>
                    <Text style={styles.cardTitle}>Yeni Varlık Ekle</Text>
                    <View style={styles.typeSelector}>
                        {SAVING_TYPES.map(st => (
                            <TouchableOpacity 
                                key={st.value}
                                style={[styles.typeBtn, selectedType === st.value && { backgroundColor: st.color, borderColor: st.color }]}
                                onPress={() => setSelectedType(st.value)}
                            >
                                <Text style={[styles.typeBtnText, selectedType === st.value && { color: "#000" }]}>{st.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                    <View style={styles.inputRow}>
                        <TextInput 
                            style={styles.input}
                            placeholder="Miktar (gr, $, €)"
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
            </View>

            <View style={styles.rightCol}>
                <View style={styles.card}>
                    <View style={styles.cardTitleRow}>
                        <Text style={styles.cardTitle}>Varlık Geçmişi</Text>
                        <Text style={styles.itemCount}>{savings.length} kalem</Text>
                    </View>
                    {savings.length === 0 ? (
                        <View style={styles.emptyBox}>
                            <MaterialIcons name="savings" size={48} color={COLORS.textMuted} />
                            <Text style={styles.emptyText}>Henüz birikim bulunmuyor.</Text>
                        </View>
                    ) : (
                        savings.map(s => {
                            const st = SAVING_TYPES.find(x => x.value === s.type)!;
                            return (
                                <View key={s.id} style={styles.savingRow}>
                                    <View style={[styles.savingIconBox, { backgroundColor: st.color + "15" }]}>
                                        <Text style={[styles.savingIconText, { color: st.color }]}>{s.type === 'ALTIN' ? 'AU' : s.type}</Text>
                                    </View>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.savingMain}>{s.amount} {st.symbol}</Text>
                                        <Text style={styles.savingTL}>{formatCurrency(s.amount * currentRates[s.type])}</Text>
                                    </View>
                                    <TouchableOpacity onPress={() => confirmDelete(s)} style={styles.delBtn}>
                                        <MaterialIcons name="delete-outline" size={18} color={COLORS.textMuted} />
                                    </TouchableOpacity>
                                </View>
                            );
                        })
                    )}
                </View>
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  content: { padding: 20, gap: 24, paddingBottom: 40 },
  webContent: { padding: 32 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "900", color: "#fff" },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  refreshBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#111", paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  refreshText: { color: COLORS.primary, fontWeight: "700", fontSize: 13 },
  mainGrid: { gap: 24 },
  mainGridWeb: { flexDirection: "row" },
  leftCol: { flex: 1.5, gap: 24 },
  rightCol: { flex: 1 },
  totalCard: { backgroundColor: "#111", padding: 24, borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  totalHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 16 },
  totalIconBox: { width: 44, height: 44, borderRadius: 14, backgroundColor: "#000", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  totalLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: "800", letterSpacing: 1.5 },
  totalValue: { color: "#fff", fontSize: 36, fontWeight: "900", letterSpacing: -1 },
  totalFooter: { marginTop: 16 },
  tag: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  tagText: { fontSize: 11, fontWeight: "800" },
  assetRow: { flexDirection: "row", gap: 12 },
  assetCard: { flex: 1, backgroundColor: "#111", padding: 16, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", gap: 6 },
  assetHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  assetTag: { paddingHorizontal: 6, paddingVertical: 3, borderRadius: 6, fontSize: 10, fontWeight: "900", minWidth: 28, textAlign: "center" },
  assetName: { color: COLORS.textSecondary, fontSize: 12, fontWeight: "600" },
  assetPrice: { color: "#fff", fontSize: 15, fontWeight: "800" },
  assetHeld: { color: COLORS.textMuted, fontSize: 12, fontWeight: "600" },
  card: { backgroundColor: "#111", padding: 24, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", gap: 16 },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  cardTitleRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  itemCount: { color: COLORS.textMuted, fontSize: 12 },
  typeSelector: { flexDirection: "row", gap: 8 },
  typeBtn: { flex: 1, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", backgroundColor: "#000", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  typeBtnText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: "700" },
  inputRow: { flexDirection: "row", gap: 10 },
  input: { flex: 1, height: 50, backgroundColor: "#000", borderRadius: 14, paddingHorizontal: 16, color: "#fff", fontSize: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 20, borderRadius: 14 },
  addBtnText: { color: "#fff", fontWeight: "800" },
  emptyBox: { padding: 40, alignItems: "center", gap: 16 },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
  savingRow: { flexDirection: "row", alignItems: "center", gap: 16, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.02)" },
  savingIconBox: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  savingIconText: { fontSize: 12, fontWeight: "900" },
  savingMain: { color: "#fff", fontSize: 15, fontWeight: "700" },
  savingTL: { color: COLORS.textMuted, fontSize: 13, marginTop: 2 },
  delBtn: { padding: 6 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40, gap: 24 },
  webContent: { padding: 32 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 24, fontWeight: "800", color: COLORS.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  refreshBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.card, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border },
  refreshText: { fontSize: 13, fontWeight: "600", color: COLORS.primary },
  mainLayout: { gap: 24 },
  webMainLayout: { flexDirection: "row" },
  leftCol: { flex: 1.5, gap: 24 },
  rightCol: { flex: 1 },
  totalCard: {
    backgroundColor: COLORS.card,
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  totalHeader: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 16 },
  totalLabel: { fontSize: 14, color: COLORS.textSecondary, fontWeight: "600" },
  totalValue: { fontSize: 32, fontWeight: "800", color: COLORS.textPrimary, letterSpacing: -1 },
  totalFooter: { marginTop: 16, flexDirection: "row" },
  statusTag: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 11, fontWeight: "700" },
  rateGrid: { flexDirection: "row", gap: 12 },
  rateCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border, gap: 8 },
  rateHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  rateCircle: { width: 32, height: 32, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  rateTag: { fontSize: 11, fontWeight: "800" },
  rateName: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  rateVal: { fontSize: 16, fontWeight: "800", color: COLORS.textPrimary },
  rateStats: { marginTop: 4 },
  rateHeld: { fontSize: 12, fontWeight: "600", color: COLORS.textMuted },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 16,
  },
  cardHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary },
  cardSub: { fontSize: 12, color: COLORS.textMuted },
  typeRow: { flexDirection: "row", gap: 10 },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  typeChipText: { fontSize: 12, fontWeight: "700", color: COLORS.textSecondary },
  inputRow: { flexDirection: "row", gap: 10 },
  input: {
    flex: 1,
    backgroundColor: COLORS.background,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingHorizontal: 20,
    gap: 6,
  },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  empty: { alignItems: "center", paddingVertical: 40, gap: 12 },
  emptyText: { fontSize: 14, color: COLORS.textMuted },
  savingRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  savingIcon: { width: 44, height: 44, borderRadius: 12, alignItems: "center", justifyContent: "center", marginRight: 16 },
  savingIconText: { fontSize: 12, fontWeight: "800" },
  savingInfo: { flex: 1, gap: 4 },
  savingMain: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  savingTL: { fontSize: 13, color: COLORS.textMuted },
  delBtn: { padding: 6 },
});

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
