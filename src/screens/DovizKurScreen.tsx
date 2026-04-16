import React, { useState, useEffect, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { fetchMarketRates, MarketRate } from "../services/api";
import { COLORS, RATES } from "../types";
import { formatCurrency } from "../utils/format";

const CURRENCIES = [
  { id: "USD", name: "Amerikan Doları", symbol: "USD", flag: "🇺🇸", color: "#3b82f6" },
  { id: "EUR", name: "Euro", symbol: "EUR", flag: "🇪🇺", color: "#22c55e" },
  { id: "GBP", name: "Sterlin", symbol: "GBP", flag: "🇬🇧", color: "#ef4444" },
  { id: "CHF", name: "İsviçre Frangı", symbol: "CHF", flag: "🇨🇭", color: "#f59e0b" },
  { id: "JPY", name: "Japon Yeni", symbol: "JPY", flag: "🇯🇵", color: "#a855f7" },
  { id: "SAR", name: "Suudi Riyali", symbol: "SAR", flag: "🇸🇦", color: "#10b981" },
  { id: "AED", name: "Dirhem", symbol: "AED", flag: "🇦🇪", color: "#6366f1" },
  { id: "ALTIN", name: "Altın (ons)", symbol: "XAU", flag: "🥇", color: "#eab308" },
];

export default function DovizKurScreen() {
  const [rates, setRates] = useState<any>(RATES);
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState("10.04.2026 20:36:21");
  const { width } = useWindowDimensions();
  const isWeb = width > 1024;

  const [convertAmount, setConvertAmount] = useState("1");
  const [convertSource, setConvertSource] = useState("TRY");
  const [convertTarget, setConvertTarget] = useState("USD");

  const getRates = async () => {
    setLoading(true);
    try {
      const data = await fetchMarketRates();
      setRates(data);
      const now = new Date();
      setLastUpdate(now.toLocaleDateString("tr-TR") + " " + now.toLocaleTimeString("tr-TR"));
    } catch (e) {
      setRates(RATES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRates();
  }, []);

  const convertResult = useMemo(() => {
    const amount = parseFloat(convertAmount) || 0;
    if (convertSource === "TRY") {
      const rate = rates[convertTarget] || 1;
      return (amount / rate).toFixed(6);
    } else {
      const rate = rates[convertSource] || 1;
      return (amount * rate).toFixed(2);
    }
  }, [convertAmount, convertSource, convertTarget, rates]);

  return (
    <View style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.content, isWeb && styles.webContent]} showsVerticalScrollIndicator={false}>
        {/* Header Ribbon */}
        <View style={styles.header}>
            <View style={styles.headerLeft}>
                <View style={[styles.dot, { backgroundColor: loading ? COLORS.amber : COLORS.primary }]} />
                <Text style={styles.lastUpdate}>
                    Son güncelleme: {lastUpdate} · Kaynak: collectapi.com
                </Text>
            </View>
            <TouchableOpacity onPress={getRates} disabled={loading} style={styles.refreshBtn}>
                <MaterialIcons name="refresh" size={16} color="#fff" />
                <Text style={styles.refreshText}>{loading ? "..." : "Güncelle"}</Text>
            </TouchableOpacity>
        </View>

        {/* Rates Grid */}
        <View style={[styles.grid, isWeb && styles.gridWeb]}>
            {CURRENCIES.map((c) => (
                <View key={c.id} style={[styles.card, isWeb && styles.cardWeb]}>
                    <Text style={styles.flag}>{c.flag}</Text>
                    <Text style={styles.curName}>{c.name}</Text>
                    <Text style={styles.curValue}>₺{rates[c.id].toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</Text>
                    <Text style={styles.curSub}>1 {c.symbol} = ₺{rates[c.id]}</Text>
                </View>
            ))}
        </View>

        <View style={[styles.bottomGrid, isWeb && styles.bottomGridWeb]}>
            {/* Currency Converter */}
            <View style={[styles.panel, isWeb && { flex: 1.5 }]}>
                <Text style={styles.panelTitle}>DÖVİZ ÇEVİRİCİ</Text>
                <View style={styles.converterGrid}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>TUTAR</Text>
                        <View style={styles.inputBox}>
                            <TextInput 
                                style={styles.textInput} 
                                value={convertAmount} 
                                onChangeText={setConvertAmount} 
                                keyboardType="numeric"
                                placeholderTextColor="#444" 
                            />
                        </View>
                    </View>

                    <View style={styles.arrowBox}>
                        <MaterialIcons name="arrow-forward" size={20} color={COLORS.textMuted} />
                    </View>

                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>SONUÇ</Text>
                        <View style={[styles.inputBox, styles.inputBoxResult]}>
                            <Text style={styles.resultText}>
                                {convertTarget === "USD" ? "$" : "₺"}{convertResult}
                            </Text>
                        </View>
                    </View>
                </View>

                <View style={[styles.converterGrid, { marginTop: 16 }]}>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>KAYNAK</Text>
                        <TouchableOpacity style={styles.selectBox}>
                            <Text style={styles.selectText}>₺ TRY</Text>
                            <MaterialIcons name="keyboard-arrow-down" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>
                    <View style={styles.inputGroup}>
                        <Text style={styles.inputLabel}>HEDEF</Text>
                        <TouchableOpacity style={styles.selectBox}>
                            <Text style={styles.selectText}>$ USD</Text>
                            <MaterialIcons name="keyboard-arrow-down" size={18} color="#fff" />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>

            {/* Portfolio Value */}
            <View style={[styles.panel, isWeb && { flex: 1 }]}>
                <Text style={styles.panelTitle}>PORTFÖY DEĞERİ (GÜNCEL KUR)</Text>
                <View style={styles.portfolioList}>
                    <View style={styles.portfolioItem}>
                        <Text style={styles.portfolioLabel}>Altın (gr)</Text>
                        <Text style={styles.portfolioValue}>₺4.565.945.101,54</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.portfolioItem}>
                        <Text style={styles.portfolioLabel}>USD</Text>
                        <Text style={styles.portfolioValue}>₺740.906,05</Text>
                    </View>
                </View>
            </View>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, gap: 24, paddingBottom: 40 },
  webContent: { padding: 32 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  lastUpdate: { color: COLORS.textMuted, fontSize: 11, fontWeight: "500" },
  refreshBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(255,255,255,0.08)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  refreshText: { color: COLORS.textPrimary, fontWeight: "700", fontSize: 12 },
  
  grid: { gap: 16 },
  gridWeb: { flexDirection: "row", flexWrap: "wrap" },
  card: { backgroundColor: "#0a0a0b", padding: 24, borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.03)", gap: 8, alignItems: "center" },
  cardWeb: { width: "23.8%" },
  flag: { fontSize: 28, marginBottom: 8 },
  curName: { color: COLORS.textMuted, fontSize: 12, fontWeight: "600" },
  curValue: { color: COLORS.primary, fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  curSub: { color: COLORS.textMuted, fontSize: 11 },

  bottomGrid: { gap: 24 },
  bottomGridWeb: { flexDirection: "row" },
  panel: { backgroundColor: "#0a0a0b", padding: 28, borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  panelTitle: { color: COLORS.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1, marginBottom: 20 },
  
  converterGrid: { flexDirection: "row", alignItems: "flex-end", gap: 16 },
  inputGroup: { flex: 1, gap: 10 },
  inputLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: "800" },
  inputBox: { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", height: 48, paddingHorizontal: 16, justifyContent: "center" },
  inputBoxResult: { borderColor: "rgba(34, 197, 94, 0.2)" },
  textInput: { color: COLORS.textPrimary, fontSize: 15, fontWeight: "700" },
  resultText: { color: COLORS.primary, fontSize: 15, fontWeight: "700" },
  arrowBox: { height: 48, justifyContent: "center" },
  selectBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", height: 48, paddingHorizontal: 16 },
  selectText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: "700" },

  portfolioList: { gap: 12 },
  portfolioItem: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 8 },
  portfolioLabel: { color: COLORS.textPrimary, fontSize: 14, fontWeight: "700" },
  portfolioValue: { color: COLORS.primary, fontSize: 14, fontWeight: "800" },
  divider: { height: 1, backgroundColor: "rgba(255,255,255,0.03)" },
});

