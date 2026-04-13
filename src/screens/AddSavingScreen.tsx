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
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useSavings } from "../store/useStore";
import { COLORS, InvestmentCategory } from "../types";

const CATEGORIES: InvestmentCategory[] = ["Hisse", "Kripto", "Altın", "Döviz"];

export default function AddSavingScreen({ navigation }: any) {
  const { addSaving } = useSavings();
  const [symbol, setSymbol] = useState("");
  const [amount, setAmount] = useState("");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [category, setCategory] = useState<InvestmentCategory>("Hisse");

  const handleAdd = () => {
    if (!symbol.trim()) {
      Alert.alert("Eksik Bilgi", "Varlık sembolü (örn: THYAO, BTC) zorunludur.");
      return;
    }
    const parsedAmount = parseFloat(amount.replace(",", "."));
    const parsedPrice = parseFloat(purchasePrice.replace(",", "."));

    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      Alert.alert("Geçersiz Miktar", "Lütfen geçerli bir miktar girin.");
      return;
    }
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert("Geçersiz Fiyat", "Lütfen geçerli bir alış fiyatı girin.");
      return;
    }

    addSaving({
      symbol: symbol.trim().toUpperCase(),
      category,
      amount: parsedAmount,
      purchasePrice: parsedPrice,
      type: "USD", // Legacy field support
    });

    Alert.alert("Başarılı", "Varlık portföye eklendi.", [
      { text: "Tamam", onPress: () => navigation.goBack() },
    ]);
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.title}>Yeni Varlık Ekle</Text>
          <View style={{ width: 40 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.infoCard}>
            <MaterialIcons name="info-outline" size={16} color={COLORS.primary} />
            <Text style={styles.infoText}>
              Eklediğiniz varlıklar güncel piyasa verileriyle otomatik olarak değerlenecektir.
            </Text>
          </View>

          {/* Symbol */}
          <View style={styles.field}>
            <Text style={styles.label}>Varlık Sembolü / Adı</Text>
            <TextInput
              style={styles.input}
              placeholder="BTC, THYAO, Altın (gr) vb."
              placeholderTextColor={COLORS.textMuted}
              value={symbol}
              onChangeText={setSymbol}
              autoCapitalize="characters"
            />
          </View>

          {/* Category */}
          <View style={styles.field}>
            <Text style={styles.label}>Kategori</Text>
            <View style={styles.catRow}>
                {CATEGORIES.map(cat => (
                    <TouchableOpacity 
                        key={cat} 
                        style={[styles.catBtn, category === cat && styles.catBtnActive]}
                        onPress={() => setCategory(cat)}
                    >
                        <FontAwesome5 
                            name={cat === 'Hisse' ? 'chart-line' : cat === 'Kripto' ? 'bitcoin' : 'coins'} 
                            size={12} 
                            color={category === cat ? "#fff" : COLORS.textSecondary} 
                        />
                        <Text style={[styles.catBtnText, category === cat && { color: "#fff" }]}>{cat}</Text>
                    </TouchableOpacity>
                ))}
            </View>
          </View>

          <View style={styles.row}>
            {/* Amount */}
            <View style={[styles.field, { flex: 1 }]}>
                <Text style={styles.label}>Miktar</Text>
                <TextInput
                style={styles.input}
                placeholder="1.50"
                placeholderTextColor={COLORS.textMuted}
                value={amount}
                onChangeText={setAmount}
                keyboardType="decimal-pad"
                />
            </View>

            {/* Purchase Price */}
            <View style={[styles.field, { flex: 1.5 }]}>
                <Text style={styles.label}>Birim Alış Fiyatı (₺)</Text>
                <TextInput
                style={styles.input}
                placeholder="0.00"
                placeholderTextColor={COLORS.textMuted}
                value={purchasePrice}
                onChangeText={setPurchasePrice}
                keyboardType="decimal-pad"
                />
            </View>
          </View>

          <TouchableOpacity style={styles.submitBtn} onPress={handleAdd}>
            <Text style={styles.submitText}>Portföye Ekle</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", padding: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  backBtn: { padding: 8 },
  title: { fontSize: 18, fontWeight: "800", color: "#fff" },
  content: { padding: 24, gap: 24 },
  infoCard: { flexDirection: 'row', gap: 10, padding: 16, backgroundColor: COLORS.primary + "10", borderRadius: 12, borderWidth: 1, borderColor: COLORS.primary + "20" },
  infoText: { flex: 1, color: COLORS.textSecondary, fontSize: 12, lineHeight: 18 },
  field: { gap: 10 },
  label: { fontSize: 13, fontWeight: "700", color: COLORS.textMuted, letterSpacing: 0.5 },
  input: { backgroundColor: COLORS.card, borderRadius: 14, padding: 16, color: "#fff", fontSize: 15, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  catRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  catBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, backgroundColor: COLORS.card, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  catBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  catBtnText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: '700' },
  row: { flexDirection: "row", gap: 16 },
  submitBtn: { backgroundColor: COLORS.primary, padding: 18, borderRadius: 16, alignItems: "center", marginTop: 20, shadowColor: COLORS.primary, shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.3, shadowRadius: 20 },
  submitText: { color: "#fff", fontSize: 16, fontWeight: "900" },
});
