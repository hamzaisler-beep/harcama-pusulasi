// src/screens/FamilyScreen.tsx
import React, { useState, useEffect, useMemo } from "react";
import { subDays } from "date-fns";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { COLORS } from "../types";
import { createFamily, joinFamily, getUserFamily, Family } from "../services/familyService";
import { useFamilyTransactions } from "../store/useStore";
import { calculateFamilyReport, TimePeriod } from "../utils/familyStats";
import { formatCurrency, formatDate } from "../utils/format";
import { seedFamilyTransactions } from "../utils/seedData";

const { width } = Dimensions.get("window");

export default function FamilyScreen() {
  const [loading, setLoading] = useState(true);
  const [family, setFamily] = useState<Family | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [code, setCode] = useState("");
  const [familyName, setFamilyName] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  
  const [period, setPeriod] = useState<TimePeriod>("monthly");
  const { familyTransactions } = useFamilyTransactions();

  useEffect(() => {
    fetchFamily();
  }, []);

  // GHOST SEEDING - RUNS ONCE IN BACKGROUND
  useEffect(() => {
    const runGhostSeed = async () => {
      if (family && !localStorage.getItem(`hp_seeded_${family.id}`)) {
        console.log("Ghost Seeding triggered for family:", family.id);
        try {
          const { auth } = await import("../services/firebase");
          if (auth.currentUser) {
            await seedFamilyTransactions(family.id, auth.currentUser.uid, auth.currentUser.displayName || "Hamza Can");
            localStorage.setItem(`hp_seeded_${family.id}`, "true");
            console.log("Ghost Seeding successful!");
          }
        } catch (e: any) {
          console.error("Ghost Seeding failed", e);
          if (e.message.includes("permission")) {
            console.warn("LÜTFEN DİKKAT: Firebase Kuralları (Rules) yazma izni vermiyor. Seeding yapılamadı.");
          }
        }
      }
    };
    runGhostSeed();
  }, [family]);

  const fetchFamily = async () => {
    setLoading(true);
    try {
      const data = await getUserFamily();
      setFamily(data);
    } catch (error) {
      console.error("Fetch family error", error);
    } finally {
      setLoading(false);
    }
  };

  const report = useMemo(() => {
    return calculateFamilyReport(familyTransactions, period);
  }, [familyTransactions, period]);

  const handleCreate = async () => {
    if (!familyName) {
      Alert.alert("Hata", "Lütfen bir aile ismi girin.");
      return;
    }
    setActionLoading(true);
    try {
      console.log("Calling createFamily...");
      const res = await createFamily(familyName);
      console.log("createFamily success", res);
      if (typeof window !== "undefined") {
        window.alert("Aileniz Oluşturuldu! Kodunuz: " + res.invitationCode);
      }
      setIsCreating(false);
      await fetchFamily();
    } catch (error: any) {
      console.error("FamilyScreen handleCreate error", error);
      // Alert/window.alert is handled inside service but just in case:
      Alert.alert("Hata", error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!code) {
      Alert.alert("Hata", "Lütfen bir aile kodu girin.");
      return;
    }
    setActionLoading(true);
    try {
      await joinFamily(code);
      Alert.alert("Başarılı", "Aileye katıldınız!");
      setIsJoining(false);
      fetchFamily();
    } catch (error: any) {
      Alert.alert("Hata", error.message);
    } finally {
      setActionLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  if (!family && !isJoining && !isCreating) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <View style={styles.header}>
            <MaterialIcons name="family-restroom" size={64} color={COLORS.primary} />
            <Text style={styles.title}>Aile Finans Merkezi</Text>
            <Text style={styles.subtitle}>Bütçenizi tüm aileyle birlikte yönetin, harcamaları anlık takip edin.</Text>
          </View>
          <View style={styles.options}>
            <TouchableOpacity style={styles.optionBtn} onPress={() => setIsCreating(true)}>
              <MaterialIcons name="add-circle-outline" size={24} color="#fff" />
              <Text style={styles.optionBtnText}>Aile Oluştur</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.optionBtn, styles.secondaryBtn]} onPress={() => setIsJoining(true)}>
              <MaterialIcons name="group-add" size={24} color={COLORS.primary} />
              <Text style={[styles.optionBtnText, styles.secondaryBtnText]}>Kod ile Katıl</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (isCreating || isJoining) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.container}>
          <TouchableOpacity onPress={() => { setIsCreating(false); setIsJoining(false); }} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={24} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.formTitle}>{isCreating ? "Yeni Aile" : "Aileye Katıl"}</Text>
          <TextInput
            style={styles.input}
            placeholder={isCreating ? "Aile İsmi (Örn: Demir Ailesi)" : "6 Haneli Kod (Örn: HPX192)"}
            value={isCreating ? familyName : code}
            onChangeText={isCreating ? setFamilyName : setCode}
            autoCapitalize={isCreating ? "words" : "characters"}
          />
          <TouchableOpacity style={styles.submitBtn} onPress={isCreating ? handleCreate : handleJoin} disabled={actionLoading}>
            {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>{isCreating ? "Oluştur" : "Katıl"}</Text>}
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <View style={styles.familyHeader}>
          <View>
            <Text style={styles.familyName}>{family.name}</Text>
            <Text style={styles.familySub}>Aile Finans Özeti</Text>
          </View>
          <TouchableOpacity 
            style={styles.codeBadge} 
            onPress={() => Share.share({ message: `Harcama Pusulası ailemize katıl! Kod: ${family.invitationCode}` })}
          >
            <Text style={styles.codeText}>{family.invitationCode}</Text>
            <MaterialIcons name="share" size={14} color={COLORS.primary} />
          </TouchableOpacity>
        </View>

        {/* Period Selector */}
        <View style={styles.periodRow}>
          {[
            { id: "weekly", label: "Haftalık" },
            { id: "monthly", label: "Aylık" },
            { id: "3months", label: "3 Ay" },
            { id: "yearly", label: "Yıllık" },
          ].map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.periodBtn, period === p.id && styles.periodBtnActive]}
              onPress={() => setPeriod(p.id as TimePeriod)}
            >
              <Text style={[styles.periodBtnText, period === p.id && styles.periodBtnTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Overview Cards */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.expenseLight }]}>
            <Text style={[styles.summaryLabel, { color: COLORS.expense }]}>Toplam Gider</Text>
            <Text style={[styles.summaryValue, { color: COLORS.expense }]}>{formatCurrency(report.totalExpense)}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.incomeLight }]}>
            <Text style={[styles.summaryLabel, { color: COLORS.income }]}>Toplam Gelir</Text>
            <Text style={[styles.summaryValue, { color: COLORS.income }]}>{formatCurrency(report.totalIncome)}</Text>
          </View>
        </View>

        {/* Chart */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Zaman Çizelgesi</Text>
          <LineChart
            data={{
              labels: report.chartData.labels,
              datasets: [
                { data: report.chartData.expenseData, color: () => COLORS.expense, strokeWidth: 2 },
                { data: report.chartData.incomeData, color: () => COLORS.income, strokeWidth: 2 }
              ],
              legend: ["Gider", "Gelir"]
            }}
            width={width - 56}
            height={180}
            chartConfig={{
              backgroundColor: "#fff",
              backgroundGradientFrom: "#fff",
              backgroundGradientTo: "#fff",
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              labelColor: () => COLORS.textSecondary,
              style: { borderRadius: 16 },
              propsForDots: { r: "3" }
            }}
            bezier
            style={{ borderRadius: 16, marginTop: 12 }}
            withInnerLines={false}
          />
        </View>

        {/* Member Breakdown */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Üye Bazlı Harcama</Text>
          {report.memberBreakdown.map((m, i) => (
            <View key={i} style={styles.memberRow}>
              <View style={styles.memberAvatar}>
                <Text style={styles.avatarText}>{m.name[0].toUpperCase()}</Text>
              </View>
              <View style={styles.memberInfo}>
                <View style={styles.memberDetails}>
                  <Text style={styles.memberName}>{m.name}</Text>
                  <Text style={styles.memberVal}>{formatCurrency(m.amount)}</Text>
                </View>
                <View style={styles.progressBg}>
                  <View style={[styles.progressFill, { width: `${m.percentage}%` }]} />
                </View>
              </View>
            </View>
          ))}
          {report.memberBreakdown.length === 0 && <Text style={styles.emptyText}>Henüz üye verisi yok.</Text>}
        </View>

        {/* Recent Family Transactions */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Son Aile İşlemleri</Text>
          {familyTransactions.slice(0, 5).map((t, i) => (
            <View key={i} style={styles.txRow}>
              <View style={[styles.txIcon, { backgroundColor: t.type === "income" ? COLORS.incomeLight : COLORS.expenseLight }]}>
                <MaterialIcons name={t.type === "income" ? "arrow-upward" : "arrow-downward"} size={16} color={t.type === "income" ? COLORS.income : COLORS.expense} />
              </View>
              <View style={styles.txInfo}>
                <Text style={styles.txDesc}>{t.description}</Text>
                <Text style={styles.txMeta}>{t.userName} • {formatDate(t.date)}</Text>
              </View>
              <Text style={[styles.txAmount, { color: t.type === "income" ? COLORS.income : COLORS.textPrimary }]}>
                {t.type === "income" ? "+" : "-"}{formatCurrency(Math.abs(t.amount))}
              </Text>
            </View>
          ))}
          {familyTransactions.length === 0 && <Text style={styles.emptyText}>Henüz işlem yok.</Text>}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, padding: 24, justifyContent: "center" },
  scroll: { padding: 16 },
  header: { alignItems: "center", marginBottom: 32 },
  title: { fontSize: 26, fontWeight: "800", color: COLORS.textPrimary, marginTop: 16 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: "center", marginTop: 8, paddingHorizontal: 20 },
  options: { gap: 16 },
  optionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.primary, padding: 18, borderRadius: 16, gap: 10 },
  secondaryBtn: { backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.primary },
  optionBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryBtnText: { color: COLORS.primary },
  backBtn: { marginBottom: 20 },
  formTitle: { fontSize: 24, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 8 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 20 },
  submitBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: "center" },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  familyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingHorizontal: 4 },
  familyName: { fontSize: 24, fontWeight: "800", color: COLORS.textPrimary },
  familySub: { fontSize: 13, color: COLORS.textSecondary },
  codeBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  codeText: { fontSize: 14, fontWeight: "800", color: COLORS.primary },
  periodRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  periodBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border },
  periodBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  periodBtnText: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary },
  periodBtnTextActive: { color: "#fff" },
  summaryRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  summaryCard: { flex: 1, padding: 16, borderRadius: 16, gap: 8 },
  summaryLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  summaryValue: { fontSize: 18, fontWeight: "800" },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 4 },
  memberRow: { flexDirection: "row", alignItems: "center", marginTop: 16 },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { color: COLORS.primary, fontWeight: "800", fontSize: 14 },
  memberInfo: { flex: 1 },
  memberDetails: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  memberName: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  memberVal: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  progressBg: { height: 6, backgroundColor: COLORS.background, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, backgroundColor: COLORS.primary, borderRadius: 3 },
  txRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: COLORS.border },
  txIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 12 },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  txMeta: { fontSize: 11, color: COLORS.textSecondary, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: "800" },
  emptyText: { textAlign: "center", color: COLORS.textMuted, fontSize: 13, marginTop: 20 },
});
