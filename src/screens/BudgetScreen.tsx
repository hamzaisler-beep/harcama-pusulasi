import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  useWindowDimensions,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useTransactions, useBudgets } from "../store/useStore";
import { COLORS, CATEGORIES } from "../types";
import { formatCurrency } from "../utils/format";

export default function BudgetScreen() {
  const { transactions } = useTransactions();
  const { budgets, setBudget } = useBudgets();
  const [selectedCat, setSelectedCat] = useState(CATEGORIES[0]);
  const [limit, setLimit] = useState("");
  const { width } = useWindowDimensions();
  const isWeb = width > 1024;

  const currentMonthExpenses = transactions.filter(t => t.type === "expense");

  const getExpensesForCategory = (cat: string) => {
    return Math.abs(currentMonthExpenses.filter(t => t.category === cat).reduce((s, t) => s + t.amount, 0));
  };

  const handleSetBudget = () => {
    if (!limit) return;
    setBudget({
        category: selectedCat,
        limit: parseFloat(limit),
        period: "monthly"
    });
    setLimit("");
    Alert.alert("Başarılı", `${selectedCat} bütçesi güncellendi.`);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.content, isWeb && styles.webContent]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Bütçe Planlama</Text>
          <Text style={styles.subtitle}>Harcamalarınızı kontrol altında tutun</Text>
        </View>

        <View style={[styles.mainGrid, isWeb && styles.mainGridWeb]}>
          {/* Budget List */}
          <View style={styles.listSection}>
            <View style={styles.card}>
                <Text style={styles.cardTitle}>Aktif Bütçeler</Text>
                <View style={styles.budgetList}>
                    {CATEGORIES.map(cat => {
                        const budget = budgets.find(b => b.category === cat);
                        const spent = getExpensesForCategory(cat);
                        const limitVal = budget?.limit || 0;
                        const pct = limitVal > 0 ? Math.min((spent / limitVal) * 100, 100) : 0;
                        const isOver = spent > limitVal && limitVal > 0;

                        if (!budget && spent === 0) return null;

                        return (
                            <View key={cat} style={styles.budgetRow}>
                                <View style={styles.budgetInfo}>
                                    <Text style={styles.catName}>{cat}</Text>
                                    <Text style={[styles.spentText, isOver && { color: COLORS.expense }]}>
                                        {formatCurrency(spent)} / {limitVal > 0 ? formatCurrency(limitVal) : "Limit Yok"}
                                    </Text>
                                </View>
                                <View style={styles.progressContainer}>
                                    <View style={styles.progressBg}>
                                        <View style={[styles.progressFill, { width: `${pct}%`, backgroundColor: isOver ? COLORS.expense : COLORS.primary }]} />
                                    </View>
                                    <Text style={styles.pctText}>%{Math.round(pct)}</Text>
                                </View>
                            </View>
                        );
                    })}
                </View>
            </View>
          </View>

          {/* Set Budget Form */}
          <View style={styles.formSection}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Bütçe Belirle</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Kategori Seçin</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                    {CATEGORIES.map(cat => (
                        <TouchableOpacity 
                            key={cat} 
                            style={[styles.catChip, selectedCat === cat && styles.catChipActive]}
                            onPress={() => setSelectedCat(cat)}
                        >
                            <Text style={[styles.catChipText, selectedCat === cat && styles.catChipTextActive]}>{cat}</Text>
                        </TouchableOpacity>
                    ))}
                </ScrollView>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Aylık Limit (₺)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="2000"
                  placeholderTextColor={COLORS.textMuted}
                  value={limit}
                  onChangeText={setLimit}
                  keyboardType="decimal-pad"
                />
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={handleSetBudget}>
                <Text style={styles.addBtnText}>Bütçeyi Kaydet</Text>
              </TouchableOpacity>
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
  header: { marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "900", color: "#fff" },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  mainGrid: { gap: 24 },
  mainGridWeb: { flexDirection: "row" },
  listSection: { flex: 1.5 },
  formSection: { flex: 1 },
  budgetList: { gap: 24 },
  budgetRow: { gap: 12 },
  budgetInfo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  catName: { color: "#fff", fontSize: 15, fontWeight: "700" },
  spentText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: "600" },
  progressContainer: { flexDirection: "row", alignItems: "center", gap: 12 },
  progressBg: { flex: 1, height: 8, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 4, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 4 },
  pctText: { color: COLORS.textMuted, fontSize: 11, fontWeight: "700", width: 30 },
  card: {
    backgroundColor: "#111",
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    gap: 20,
  },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "800", marginBottom: 8 },
  inputGroup: { gap: 10 },
  label: { color: COLORS.textSecondary, fontSize: 12, fontWeight: "600" },
  catScroll: { paddingVertical: 4 },
  catChip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 10, backgroundColor: "#000", marginRight: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  catChipActive: { backgroundColor: "rgba(34, 197, 94, 0.1)", borderColor: COLORS.primary },
  catChipText: { color: COLORS.textMuted, fontSize: 12, fontWeight: "600" },
  catChipTextActive: { color: COLORS.primary },
  input: {
    backgroundColor: "#000",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  addBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
