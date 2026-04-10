// src/screens/AddTransactionScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useTransactions } from "../store/useStore";
import { CATEGORIES, COLORS, TransactionType } from "../types";
import { formatCurrency, todayISO } from "../utils/format";

export default function AddTransactionScreen({ navigation }: any) {
  const { addTransaction } = useTransactions();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(todayISO());
  const [type, setType] = useState<TransactionType>("expense");

  const handleAdd = () => {
    if (!description.trim()) {
      Alert.alert("Eksik Bilgi", "Açıklama alanı zorunludur.");
      return;
    }
    const parsedAmount = parseFloat(amount.replace(",", "."));
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Geçersiz Miktar", "Lütfen geçerli bir tutar girin.");
      return;
    }
    const finalAmount = type === "expense" ? -Math.abs(parsedAmount) : Math.abs(parsedAmount);
    const added = addTransaction({ description: description.trim(), amount: finalAmount, category, date, type }, true);
    if (added) {
      Alert.alert("Başarılı", "İşlem eklendi.", [
        { text: "Tamam", onPress: () => navigation.goBack() },
      ]);
    } else {
      Alert.alert("Mükerrer İşlem", "Bu işlem zaten kayıtlı.");
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="arrow-back" size={22} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.title}>Yeni İşlem</Text>
          <View style={{ width: 38 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          {/* Type Toggle */}
          <View style={styles.typeToggle}>
            <TouchableOpacity
              style={[styles.typeBtn, type === "expense" && styles.typeBtnExpense]}
              onPress={() => setType("expense")}
            >
              <MaterialIcons name="arrow-downward" size={16} color={type === "expense" ? COLORS.expense : COLORS.textSecondary} />
              <Text style={[styles.typeBtnText, type === "expense" && { color: COLORS.expense }]}>Gider</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeBtn, type === "income" && styles.typeBtnIncome]}
              onPress={() => setType("income")}
            >
              <MaterialIcons name="arrow-upward" size={16} color={type === "income" ? COLORS.income : COLORS.textSecondary} />
              <Text style={[styles.typeBtnText, type === "income" && { color: COLORS.income }]}>Gelir</Text>
            </TouchableOpacity>
          </View>

          {/* Amount */}
          <View style={styles.amountCard}>
            <Text style={styles.amountLabel}>Miktar</Text>
            <View style={styles.amountRow}>
              <Text style={[styles.currency, { color: type === "expense" ? COLORS.expense : COLORS.income }]}>₺</Text>
              <TextInput
                style={[styles.amountInput, { color: type === "expense" ? COLORS.expense : COLORS.income }]}
                placeholder="0,00"
                placeholderTextColor={COLORS.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                autoFocus
              />
            </View>
          </View>

          {/* Description */}
          <View style={styles.field}>
            <Text style={styles.label}>Açıklama</Text>
            <TextInput
              style={styles.input}
              placeholder="Market, Kira, Maaş vb."
              placeholderTextColor={COLORS.textMuted}
              value={description}
              onChangeText={setDescription}
            />
          </View>

          {/* Date */}
          <View style={styles.field}>
            <Text style={styles.label}>Tarih</Text>
            <TextInput
              style={styles.input}
              placeholder="YYYY-AA-GG"
              placeholderTextColor={COLORS.textMuted}
              value={date}
              onChangeText={setDate}
            />
          </View>

          {/* Category */}
          <View style={styles.field}>
            <Text style={styles.label}>Kategori</Text>
            <View style={styles.catGrid}>
              {CATEGORIES.map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.catChip, category === cat && styles.catChipActive]}
                  onPress={() => setCategory(cat)}
                >
                  <Text style={[styles.catChipText, category === cat && styles.catChipTextActive]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Summary */}
          {description.trim() && parseFloat(amount) > 0 && (
            <View style={[styles.summary, { borderColor: type === "expense" ? COLORS.expense : COLORS.income, borderLeftColor: type === "expense" ? COLORS.expense : COLORS.income }]}>
              <Text style={styles.summaryText}>
                {type === "expense" ? "Gider: " : "Gelir: "}
                <Text style={{ fontWeight: "700", color: type === "expense" ? COLORS.expense : COLORS.income }}>
                  {formatCurrency(parseFloat(amount.replace(",", ".")) || 0)}
                </Text>
                {" — "}{description}
              </Text>
            </View>
          )}

          {/* Submit */}
          <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
            <MaterialIcons name="check" size={20} color="#fff" />
            <Text style={styles.submitText}>İşlemi Kaydet</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: COLORS.card,
    borderBottomWidth: 0.5,
    borderBottomColor: COLORS.border,
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "600", color: COLORS.textPrimary },
  content: { padding: 20, gap: 16 },
  typeToggle: { flexDirection: "row", backgroundColor: COLORS.card, borderRadius: 14, padding: 4, gap: 4 },
  typeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 10 },
  typeBtnExpense: { backgroundColor: COLORS.expenseLight },
  typeBtnIncome: { backgroundColor: COLORS.incomeLight },
  typeBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
  amountCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  amountLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8, fontWeight: "500" },
  amountRow: { flexDirection: "row", alignItems: "center" },
  currency: { fontSize: 32, fontWeight: "700", marginRight: 4 },
  amountInput: { fontSize: 48, fontWeight: "700", minWidth: 120, textAlign: "center" },
  field: { gap: 8 },
  label: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "500" },
  catChipTextActive: { color: "#fff" },
  summary: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 12,
    borderLeftWidth: 3,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  summaryText: { fontSize: 13, color: COLORS.textSecondary },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    marginTop: 4,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  submitText: { fontSize: 16, fontWeight: "700", color: "#fff" },
});
