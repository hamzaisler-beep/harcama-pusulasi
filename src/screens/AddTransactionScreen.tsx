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
import { useTransactions, useAccounts } from "../store/useStore";
import { CATEGORIES, COLORS, TransactionType } from "../types";
import { formatCurrency, todayISO } from "../utils/format";

export default function AddTransactionScreen({ navigation }: any) {
  const { addTransaction } = useTransactions();
  const { accounts } = useAccounts();
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [date, setDate] = useState(todayISO());
  const [type, setType] = useState<TransactionType>("expense");
  const [accountId, setAccountId] = useState(accounts[0]?.id || "");

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
    if (!accountId) {
      Alert.alert("Eksik Bilgi", "Lütfen bir hesap seçin.");
      return;
    }
    const finalAmount = Math.abs(parsedAmount);
    const added = addTransaction({ 
        description: description.trim(), 
        amount: finalAmount, 
        category, 
        date, 
        type, 
        accountId 
    }, true);

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

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
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

          {/* Account Selector */}
          <View style={styles.field}>
            <Text style={styles.label}>Hesap Seçin</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.accScroll}>
                {accounts.map(acc => (
                    <TouchableOpacity 
                        key={acc.id} 
                        style={[styles.accBtn, accountId === acc.id && { borderColor: acc.color, backgroundColor: acc.color + "15" }]}
                        onPress={() => setAccountId(acc.id)}
                    >
                        <Text style={[styles.accBtnText, accountId === acc.id && { color: acc.color }]}>{acc.name}</Text>
                        <Text style={styles.accBtnBal}>{formatCurrency(acc.balance)}</Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>
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
  safe: { flex: 1, backgroundColor: "#000" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#111",
    borderBottomWidth: 1,
    borderBottomColor: "rgba(255,255,255,0.05)",
  },
  backBtn: { width: 38, height: 38, borderRadius: 19, alignItems: "center", justifyContent: "center" },
  title: { flex: 1, textAlign: "center", fontSize: 17, fontWeight: "700", color: "#fff" },
  content: { padding: 20, gap: 20 },
  typeToggle: { flexDirection: "row", backgroundColor: "#111", borderRadius: 14, padding: 4, gap: 4 },
  typeBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 6, paddingVertical: 12, borderRadius: 10 },
  typeBtnExpense: { backgroundColor: COLORS.expenseLight },
  typeBtnIncome: { backgroundColor: COLORS.incomeLight },
  typeBtnText: { fontSize: 14, fontWeight: "600", color: COLORS.textSecondary },
  amountCard: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  amountLabel: { fontSize: 12, color: COLORS.textSecondary, marginBottom: 8, fontWeight: "600" },
  amountRow: { flexDirection: "row", alignItems: "center" },
  currency: { fontSize: 32, fontWeight: "800", marginRight: 6 },
  amountInput: { fontSize: 48, fontWeight: "800", minWidth: 120, textAlign: "center" },
  field: { gap: 10 },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.textSecondary },
  accScroll: { paddingVertical: 4 },
  accBtn: { padding: 12, borderRadius: 12, backgroundColor: "#111", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", marginRight: 10, minWidth: 100 },
  accBtnText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: "700" },
  accBtnBal: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  input: {
    backgroundColor: "#111",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  catGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  catChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#111",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  catChipActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catChipText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "600" },
  catChipTextActive: { color: "#fff" },
  submitBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 16,
    paddingVertical: 16,
    gap: 8,
    marginTop: 10,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  submitText: { fontSize: 16, fontWeight: "800", color: "#fff" },
});
