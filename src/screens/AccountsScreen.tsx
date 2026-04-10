import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useAccounts } from "../store/useStore";
import { COLORS, AccountType } from "../types";
import { formatCurrency } from "../utils/format";

const ACCOUNT_TYPES: { value: AccountType; label: string; icon: string }[] = [
  { value: "CASH", label: "Nakit", icon: "payments" },
  { value: "BANK", label: "Banka", icon: "account-balance" },
  { value: "CARD", label: "Kredi Kartı", icon: "credit-card" },
];

export default function AccountsScreen() {
  const { accounts, addAccount, deleteAccount } = useAccounts();
  const [name, setName] = useState("");
  const [type, setType] = useState<AccountType>("BANK");
  const [balance, setBalance] = useState("");
  const { width } = useWindowDimensions();
  const isWeb = width > 1024;

  const handleAdd = () => {
    if (!name || !balance) {
      Alert.alert("Hata", "Lütfen tüm alanları doldurun.");
      return;
    }
    addAccount({
      name,
      type,
      balance: parseFloat(balance),
      color: type === "BANK" ? "#3b82f6" : type === "CASH" ? "#22c55e" : "#f43f5e",
    });
    setName("");
    setBalance("");
    Alert.alert("Başarılı", "Hesap oluşturuldu.");
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.content, isWeb && styles.webContent]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.title}>Hesaplarım</Text>
          <Text style={styles.subtitle}>Tüm varlıklarınızı tek bir yerden yönetin</Text>
        </View>

        <View style={[styles.mainGrid, isWeb && styles.mainGridWeb]}>
          {/* Account List */}
          <View style={styles.listSection}>
            {accounts.map((acc) => (
              <View key={acc.id} style={styles.accountCard}>
                <View style={[styles.iconBox, { backgroundColor: acc.color + "15" }]}>
                  <MaterialIcons 
                    name={ACCOUNT_TYPES.find(t => t.value === acc.type)?.icon as any || "account-balance"} 
                    size={24} 
                    color={acc.color} 
                  />
                </View>
                <View style={styles.accInfo}>
                  <Text style={styles.accName}>{acc.name}</Text>
                  <Text style={styles.accType}>{ACCOUNT_TYPES.find(t => t.value === acc.type)?.label}</Text>
                </View>
                <View style={styles.accRight}>
                    <Text style={[styles.accBalance, { color: acc.balance < 0 ? COLORS.expense : "#fff" }]}>
                        {formatCurrency(acc.balance)}
                    </Text>
                    <TouchableOpacity onPress={() => deleteAccount(acc.id)}>
                        <MaterialIcons name="delete-outline" size={18} color={COLORS.textMuted} />
                    </TouchableOpacity>
                </View>
              </View>
            ))}
          </View>

          {/* Add Account Form */}
          <View style={styles.formSection}>
            <View style={styles.card}>
              <Text style={styles.cardTitle}>Yeni Hesap Ekle</Text>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Hesap Adı</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Örn: Garanti Bankası"
                  placeholderTextColor={COLORS.textMuted}
                  value={name}
                  onChangeText={setName}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Hesap Türü</Text>
                <View style={styles.typeRow}>
                  {ACCOUNT_TYPES.map((t) => (
                    <TouchableOpacity
                      key={t.value}
                      style={[styles.typeChip, type === t.value && styles.typeChipActive]}
                      onPress={() => setType(t.value)}
                    >
                      <Text style={[styles.typeChipText, type === t.value && styles.typeChipTextActive]}>
                        {t.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Başlangıç Bakiyesi</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.00"
                  placeholderTextColor={COLORS.textMuted}
                  value={balance}
                  onChangeText={setBalance}
                  keyboardType="decimal-pad"
                />
              </View>
              <TouchableOpacity style={styles.addBtn} onPress={handleAdd}>
                <Text style={styles.addBtnText}>Hesabı Oluştur</Text>
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
  listSection: { flex: 1.5, gap: 16 },
  formSection: { flex: 1 },
  accountCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#111",
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  iconBox: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 16,
  },
  accInfo: { flex: 1 },
  accName: { color: "#fff", fontSize: 16, fontWeight: "700" },
  accType: { color: COLORS.textMuted, fontSize: 12, marginTop: 2 },
  accRight: { alignItems: "flex-end", gap: 8 },
  accBalance: { fontSize: 18, fontWeight: "800" },
  card: {
    backgroundColor: "#111",
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
    gap: 20,
  },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  inputGroup: { gap: 8 },
  label: { color: COLORS.textSecondary, fontSize: 12, fontWeight: "600" },
  input: {
    backgroundColor: "#000",
    borderRadius: 12,
    padding: 14,
    color: "#fff",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  typeRow: { flexDirection: "row", gap: 8 },
  typeChip: {
    flex: 1,
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    backgroundColor: "#000",
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.1)",
  },
  typeChipActive: {
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    borderColor: COLORS.primary,
  },
  typeChipText: { color: COLORS.textMuted, fontSize: 12, fontWeight: "600" },
  typeChipTextActive: { color: COLORS.primary },
  addBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginTop: 8,
  },
  addBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
