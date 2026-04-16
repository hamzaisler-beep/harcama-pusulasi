import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { fetchMarketRates, MarketRate } from "../services/api";
import { COLORS, RATES } from "../types";
import { formatCurrency } from "../utils/format";

export default function DovizKurScreen() {
  const [rates, setRates] = useState<MarketRate | null>(null);
  const [loading, setLoading] = useState(false);
  const { width } = useWindowDimensions();
  const isWeb = width > 1024;

  const getRates = async () => {
    setLoading(true);
    try {
      const data = await fetchMarketRates();
      setRates(data);
    } catch (e) {
      setRates(RATES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    getRates();
  }, []);

  const items = [
    { label: "Gram Altın", value: rates?.ALTIN || RATES.ALTIN, icon: "stars", color: "#f59e0b" },
    { label: "ABD Doları", value: rates?.USD || RATES.USD, icon: "payments", color: "#22c55e" },
    { label: "Euro", value: rates?.EUR || RATES.EUR, icon: "euro", color: "#3b82f6" },
  ];

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.content, isWeb && styles.webContent]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
            <View>
                <Text style={styles.title}>Döviz \u0026 Altın</Text>
                <Text style={styles.subtitle}>Canlı piyasa verileri ve kurlar</Text>
            </View>
            <TouchableOpacity onPress={getRates} disabled={loading} style={styles.refreshBtn}>
                <MaterialIcons name="refresh" size={18} color={COLORS.primary} />
                <Text style={styles.refreshText}>{loading ? "Güncelleniyor..." : "Güncelle"}</Text>
            </TouchableOpacity>
        </View>

        <View style={[styles.mainGrid, isWeb && styles.mainGridWeb]}>
            {items.map((item, idx) => (
                <View key={idx} style={styles.rateCard}>
                    <View style={[styles.iconBox, { backgroundColor: item.color + "15" }]}>
                        <MaterialIcons name={item.icon as any} size={24} color={item.color} />
                    </View>
                    <Text style={styles.rateLabel}>{item.label}</Text>
                    <Text style={styles.rateValue}>{formatCurrency(item.value)}</Text>
                    <View style={styles.trendRow}>
                        <MaterialIcons name="trending-up" size={14} color={COLORS.primary} />
                        <Text style={styles.trendText}>+%0.42 bugün</Text>
                    </View>
                </View>
            ))}
        </View>

        <View style={styles.infoBox}>
            <MaterialIcons name="info-outline" size={18} color={COLORS.textMuted} />
            <Text style={styles.infoText}>
                Veriler demoda demo verisi olarak gösterilmektedir. Gerçek hesaplamalar için canlı API kullanılır.
            </Text>
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
  refreshBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: "#111", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  refreshText: { color: COLORS.primary, fontWeight: "700", fontSize: 13 },
  mainGrid: { gap: 16 },
  mainGridWeb: { flexDirection: "row" },
  rateCard: { flex: 1, backgroundColor: "#111", padding: 24, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", alignItems: "center", gap: 12 },
  iconBox: { width: 56, height: 56, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  rateLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: "600" },
  rateValue: { color: "#fff", fontSize: 24, fontWeight: "800" },
  trendRow: { flexDirection: "row", alignItems: "center", gap: 4 },
  trendText: { color: COLORS.primary, fontSize: 11, fontWeight: "700" },
  infoBox: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "#111", padding: 16, borderRadius: 12, marginTop: 12 },
  infoText: { flex: 1, color: COLORS.textMuted, fontSize: 12, lineHeight: 18 },
});
