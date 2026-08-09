// src/screens/TaxScreen.tsx
import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Platform, useWindowDimensions } from "react-native";
import { COLORS, MONO } from "../theme/constants";
import { formatTRY } from "../utils/format";

// 2025 Gelir Vergisi Tarifesi (genel/ücret dışı) - referans amaçlı
const INCOME_BRACKETS = [
  { limit: 158000, rate: 0.15 },
  { limit: 330000, rate: 0.20 },
  { limit: 800000, rate: 0.27 },
  { limit: 4300000, rate: 0.35 },
  { limit: Infinity, rate: 0.40 },
];

function progressiveTax(base: number) {
  let tax = 0;
  let prev = 0;
  for (const b of INCOME_BRACKETS) {
    if (base <= prev) break;
    const slice = Math.min(base, b.limit) - prev;
    tax += slice * b.rate;
    prev = b.limit;
  }
  return tax;
}

const KDV_RATES = [1, 10, 20];

export default function TaxScreen() {
  const { width } = useWindowDimensions();
  const mob = width < 600;

  // KDV
  const [kdvAmount, setKdvAmount] = useState("1000");
  const [kdvRate, setKdvRate] = useState(20);
  const [kdvIncluded, setKdvIncluded] = useState(false); // false = tutar KDV hariç

  const kdv = useMemo(() => {
    const amt = Number(kdvAmount) || 0;
    const r = kdvRate / 100;
    if (kdvIncluded) {
      const base = amt / (1 + r);
      return { base, tax: amt - base, total: amt };
    }
    const tax = amt * r;
    return { base: amt, tax, total: amt + tax };
  }, [kdvAmount, kdvRate, kdvIncluded]);

  // Gelir Vergisi
  const [income, setIncome] = useState("500000");
  const incomeTax = useMemo(() => {
    const base = Number(income) || 0;
    const tax = progressiveTax(base);
    return { base, tax, net: base - tax, effective: base > 0 ? (tax / base) * 100 : 0 };
  }, [income]);

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ padding: mob ? 16 : 32 }} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <View>
          <Text style={[styles.title, mob && { fontSize: 22 }]}>Vergi Hesaplayıcı</Text>
          <Text style={styles.subtitle}>KDV ve gelir vergisi hesaplamaları</Text>
        </View>
      </View>

      <View style={[styles.grid, mob && { flexDirection: "column" }]}>
        {/* KDV */}
        <View style={[styles.card, mob && { minWidth: 0 }]}>
          <Text style={styles.cardTitle}>KDV HESAPLAMA</Text>

          <Text style={styles.fieldLabel}>Tutar</Text>
          <TextInput style={styles.input} value={kdvAmount} onChangeText={setKdvAmount} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textMuted} />

          <Text style={styles.fieldLabel}>KDV Oranı</Text>
          <View style={styles.chipRow}>
            {KDV_RATES.map((r) => (
              <TouchableOpacity key={r} style={[styles.chip, kdvRate === r && styles.chipActive]} onPress={() => setKdvRate(r)}>
                <Text style={[styles.chipText, kdvRate === r && { color: "#fff" }]}>%{r}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.toggleRow}>
            <TouchableOpacity style={[styles.toggleBtn, !kdvIncluded && styles.toggleActive]} onPress={() => setKdvIncluded(false)}>
              <Text style={[styles.toggleText, !kdvIncluded && { color: "#fff" }]}>KDV Hariç</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.toggleBtn, kdvIncluded && styles.toggleActive]} onPress={() => setKdvIncluded(true)}>
              <Text style={[styles.toggleText, kdvIncluded && { color: "#fff" }]}>KDV Dahil</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.resultList}>
            <ResultRow label="Matrah (Hariç)" value={formatTRY(kdv.base, true)} />
            <ResultRow label={`KDV (%${kdvRate})`} value={formatTRY(kdv.tax, true)} color={COLORS.warning} />
            <ResultRow label="Toplam (Dahil)" value={formatTRY(kdv.total, true)} color={COLORS.income} bold />
          </View>
        </View>

        {/* Gelir Vergisi */}
        <View style={[styles.card, mob && { minWidth: 0 }]}>
          <Text style={styles.cardTitle}>GELİR VERGİSİ (2025)</Text>

          <Text style={styles.fieldLabel}>Yıllık Vergi Matrahı</Text>
          <TextInput style={styles.input} value={income} onChangeText={setIncome} keyboardType="numeric" placeholder="0" placeholderTextColor={COLORS.textMuted} />

          <View style={styles.resultList}>
            <ResultRow label="Hesaplanan Vergi" value={formatTRY(incomeTax.tax)} color={COLORS.expense} bold />
            <ResultRow label="Vergi Sonrası" value={formatTRY(incomeTax.net)} color={COLORS.income} />
            <ResultRow label="Efektif Oran" value={`%${incomeTax.effective.toFixed(1)}`} color={COLORS.info} />
          </View>

          <Text style={styles.bracketTitle}>DİLİMLER</Text>
          {INCOME_BRACKETS.map((b, i) => {
            const prev = i === 0 ? 0 : INCOME_BRACKETS[i - 1].limit;
            const label =
              b.limit === Infinity
                ? `${formatTRY(prev)} üzeri`
                : `${formatTRY(prev)} - ${formatTRY(b.limit)}`;
            return (
              <View key={i} style={styles.bracketRow}>
                <Text style={styles.bracketLabel}>{label}</Text>
                <Text style={styles.bracketRate}>%{b.rate * 100}</Text>
              </View>
            );
          })}
          <Text style={styles.note}>* Genel tarife, referans amaçlıdır. Ücret gelirlerinde dilimler farklılık gösterebilir.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const ResultRow = ({ label, value, color, bold }: any) => (
  <View style={styles.resultRow}>
    <Text style={styles.resultLabel}>{label}</Text>
    <Text style={[styles.resultValue, color && { color }, bold && { fontSize: 18 }]}>{value}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollInside: { padding: 32 },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },

  grid: { flexDirection: "row", flexWrap: "wrap", gap: 24 },
  card: { flex: 1, minWidth: 320, backgroundColor: COLORS.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { fontSize: 11, color: COLORS.textMuted, fontWeight: "700", letterSpacing: 1.2, marginBottom: 20 },
  fieldLabel: { color: COLORS.textMuted, fontSize: 12, fontWeight: "700", marginBottom: 8, marginTop: 8 },
  input: { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 16, color: "#fff", fontSize: 20, fontWeight: "800", borderWidth: 1, borderColor: COLORS.border },
  chipRow: { flexDirection: "row", gap: 8 },
  chip: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: COLORS.border },
  chipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  chipText: { color: COLORS.textMuted, fontWeight: "700", fontSize: 13 },
  toggleRow: { flexDirection: "row", gap: 8, marginTop: 16 },
  toggleBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 10, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: COLORS.border },
  toggleActive: { backgroundColor: COLORS.info, borderColor: COLORS.info },
  toggleText: { color: COLORS.textMuted, fontWeight: "700", fontSize: 12 },

  resultList: { marginTop: 24, gap: 4 },
  resultRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  resultLabel: { color: COLORS.textSecondary, fontSize: 13 },
  resultValue: { color: COLORS.text, fontSize: 15, fontWeight: "800", fontFamily: MONO },

  bracketTitle: { fontSize: 10, color: COLORS.textMuted, fontWeight: "700", letterSpacing: 1, marginTop: 24, marginBottom: 12 },
  bracketRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 6 },
  bracketLabel: { color: COLORS.textSecondary, fontSize: 12 },
  bracketRate: { color: COLORS.primary, fontSize: 12, fontWeight: "700" },
  note: { color: COLORS.textMuted, fontSize: 10, marginTop: 16, lineHeight: 15 },
});
