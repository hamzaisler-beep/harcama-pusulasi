// src/screens/CurrencyScreen.tsx
import React, { useEffect, useState, useMemo, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../theme/constants";
import { formatNumber } from "../utils/format";

// Base USD üzerinden çekilir; her para biriminin TRY karşılığı hesaplanır.
const API_URL = "https://open.er-api.com/v6/latest/USD";

// Bağlantı yoksa gösterilecek kaba tahmini kurlar (1 birim = X TL).
const FALLBACK_TRY: Record<string, number> = { USD: 40, EUR: 43, GBP: 50, TRY: 1 };

const CURRENCIES = [
  { code: "USD", label: "Amerikan Doları", flag: "🇺🇸" },
  { code: "EUR", label: "Euro", flag: "🇪🇺" },
  { code: "GBP", label: "İngiliz Sterlini", flag: "🇬🇧" },
  { code: "TRY", label: "Türk Lirası", flag: "🇹🇷" },
];

export default function CurrencyScreen() {
  // tryValue[code] = 1 birim code kaç TL eder
  const [tryValue, setTryValue] = useState<Record<string, number>>(FALLBACK_TRY);
  const [loading, setLoading] = useState(true);
  const [offline, setOffline] = useState(false);
  const [updatedAt, setUpdatedAt] = useState<string | null>(null);

  // Çevirici
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState("USD");
  const [to, setTo] = useState("TRY");

  const loadRates = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(API_URL);
      const data = await res.json();
      if (data?.result !== "success" || !data.rates?.TRY) throw new Error("bad data");
      const r = data.rates;
      const map: Record<string, number> = { TRY: 1 };
      ["USD", "EUR", "GBP"].forEach((c) => {
        // r[c] = c per USD, r.TRY = TRY per USD  =>  1 c = r.TRY / r[c] TL
        if (r[c]) map[c] = r.TRY / r[c];
      });
      map.USD = r.TRY; // 1 USD = r.TRY TL
      setTryValue(map);
      setOffline(false);
      setUpdatedAt(data.time_last_update_utc || new Date().toUTCString());
    } catch (e) {
      setOffline(true);
      setTryValue(FALLBACK_TRY);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRates();
  }, [loadRates]);

  const converted = useMemo(() => {
    const amt = Number(amount) || 0;
    const fromVal = tryValue[from] || 0;
    const toVal = tryValue[to] || 1;
    return (amt * fromVal) / toVal;
  }, [amount, from, to, tryValue]);

  const swap = () => {
    setFrom(to);
    setTo(from);
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollInside} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>Döviz & Kur</Text>
          <Text style={styles.subtitle}>
            {loading ? "Kurlar güncelleniyor..." : offline ? "⚠️ Bağlantı yok — tahmini kurlar" : `Güncel · ${updatedAt ? updatedAt.replace(" (UTC)", "") : ""}`}
          </Text>
        </View>
        <TouchableOpacity style={styles.refreshBtn} onPress={loadRates} disabled={loading}>
          {loading ? <ActivityIndicator color={COLORS.primary} size="small" /> : <MaterialIcons name="refresh" size={20} color={COLORS.primary} />}
        </TouchableOpacity>
      </View>

      {/* Rate cards */}
      <View style={styles.cardsRow}>
        {["USD", "EUR", "GBP"].map((code) => {
          const c = CURRENCIES.find((x) => x.code === code)!;
          return (
            <View key={code} style={styles.rateCard}>
              <Text style={styles.flag}>{c.flag}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.rateCode}>{code}/TRY</Text>
                <Text style={styles.rateLabel}>{c.label}</Text>
              </View>
              <Text style={styles.rateValue}>₺{formatNumber(tryValue[code] || 0, true)}</Text>
            </View>
          );
        })}
      </View>

      {/* Converter */}
      <View style={styles.converter}>
        <Text style={styles.convTitle}>ÇEVİRİCİ</Text>

        <Text style={styles.fieldLabel}>Tutar</Text>
        <TextInput style={styles.amountInput} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textMuted} />

        <View style={styles.selectorsRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Kaynak</Text>
            <CurrencyPicker value={from} onChange={setFrom} />
          </View>
          <TouchableOpacity style={styles.swapBtn} onPress={swap}>
            <MaterialIcons name="swap-horiz" size={22} color="#fff" />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.fieldLabel}>Hedef</Text>
            <CurrencyPicker value={to} onChange={setTo} />
          </View>
        </View>

        <View style={styles.resultBox}>
          <Text style={styles.resultLabel}>
            {formatNumber(Number(amount) || 0, true)} {from} =
          </Text>
          <Text style={styles.resultValue}>
            {formatNumber(converted, true)} {to}
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const CurrencyPicker = ({ value, onChange }: { value: string; onChange: (v: string) => void }) => (
  <View style={styles.pickerRow}>
    {CURRENCIES.map((c) => (
      <TouchableOpacity key={c.code} style={[styles.pickerChip, value === c.code && styles.pickerChipActive]} onPress={() => onChange(c.code)}>
        <Text style={[styles.pickerChipText, value === c.code && { color: "#fff" }]}>{c.code}</Text>
      </TouchableOpacity>
    ))}
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollInside: { padding: 32 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  refreshBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },

  cardsRow: { flexDirection: "row", flexWrap: "wrap", gap: 16, marginBottom: 24 },
  rateCard: { flexDirection: "row", alignItems: "center", gap: 14, minWidth: 240, flex: 1, backgroundColor: COLORS.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border },
  flag: { fontSize: 30 },
  rateCode: { color: "#fff", fontSize: 15, fontWeight: "800" },
  rateLabel: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  rateValue: { color: COLORS.income, fontSize: 20, fontWeight: "900", fontFamily: Platform.OS === "web" ? "monospace" : undefined },

  converter: { backgroundColor: COLORS.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.border, maxWidth: 620 },
  convTitle: { fontSize: 11, color: COLORS.textMuted, fontWeight: "700", letterSpacing: 1.2, marginBottom: 20 },
  fieldLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 8 },
  amountInput: { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 16, color: "#fff", fontSize: 24, fontWeight: "800", borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  selectorsRow: { flexDirection: "row", alignItems: "flex-end", gap: 12 },
  swapBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginBottom: 4 },
  pickerRow: { flexDirection: "row", gap: 6 },
  pickerChip: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: COLORS.border },
  pickerChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  pickerChipText: { color: COLORS.textMuted, fontWeight: "700", fontSize: 12 },
  resultBox: { marginTop: 24, padding: 20, borderRadius: 14, backgroundColor: "rgba(108,99,255,0.08)", borderWidth: 1, borderColor: "rgba(108,99,255,0.2)" },
  resultLabel: { color: COLORS.textSecondary, fontSize: 13 },
  resultValue: { color: "#fff", fontSize: 28, fontWeight: "900", marginTop: 6, fontFamily: Platform.OS === "web" ? "monospace" : undefined },
});
