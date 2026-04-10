// src/screens/TransactionsScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  ActivityIndicator,
  Modal,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { parseBankStatement, ImportedTransaction } from "../services/ImportService";
import { useTransactions } from "../store/useStore";
import { COLORS, Transaction } from "../types";
import { formatCurrency, formatDate } from "../utils/format";

export default function TransactionsScreen({ navigation }: any) {
  const { transactions, deleteTransaction, addTransactionsBulk } = useTransactions();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  
  // Import States
  const [importing, setImporting] = useState(false);
  const [previewData, setPreviewData] = useState<ImportedTransaction[]>([]);
  const [showPreview, setShowPreview] = useState(false);

  const handleImport = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "text/csv", "application/vnd.ms-excel"],
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      setImporting(true);
      const parsed = await parseBankStatement(result.assets[0].uri);
      
      if (parsed.length === 0) {
        Alert.alert("Hata", "Dosyada işlem bulunamadı veya format desteklenmiyor.");
      } else {
        setPreviewData(parsed);
        setShowPreview(true);
      }
    } catch (e) {
      console.error("Import error", e);
      Alert.alert("Hata", "Dosya okunurken bir hata oluştu.");
    } finally {
      setImporting(false);
    }
  };

  const confirmImport = () => {
    const count = addTransactionsBulk(previewData);
    setShowPreview(false);
    setPreviewData([]);
    Alert.alert("Başarılı", `${count} işlem başarıyla içeri aktarıldı.`);
  };

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const matchSearch =
        t.description.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || t.type === filter;
      return matchSearch && matchFilter;
    });
  }, [transactions, search, filter]);

  const confirmDelete = (id: string, description: string) => {
    Alert.alert("İşlemi Sil", `"${description}" işlemini silmek istiyor musunuz?`, [
      { text: "İptal", style: "cancel" },
      {
        text: "Sil",
        style: "destructive",
        onPress: () => deleteTransaction(id),
      },
    ]);
  };

  const renderItem = ({ item }: { item: Transaction }) => (
    <View style={styles.txRow}>
      <View
        style={[
          styles.txIcon,
          {
            backgroundColor:
              item.type === "income" ? COLORS.incomeLight : COLORS.expenseLight,
          },
        ]}
      >
        <MaterialIcons
          name={item.type === "income" ? "arrow-upward" : "arrow-downward"}
          size={18}
          color={item.type === "income" ? COLORS.income : COLORS.expense}
        />
      </View>
      <View style={styles.txInfo}>
        <Text style={styles.txDesc} numberOfLines={1}>
          {item.description}
        </Text>
        <View style={styles.txMeta}>
          <Text style={styles.txCat}>{item.category}</Text>
          <Text style={styles.txDot}>·</Text>
          <Text style={styles.txDate}>{formatDate(item.date)}</Text>
          {!item.isManualEntry && (
            <>
              <Text style={styles.txDot}>·</Text>
              <Text style={styles.txExtre}>Ekstre</Text>
            </>
          )}
        </View>
      </View>
      <View style={styles.txRight}>
        <Text
          style={[
            styles.txAmount,
            { color: item.type === "income" ? COLORS.income : COLORS.textPrimary },
          ]}
        >
          {item.type === "income" ? "+" : "-"}
          {formatCurrency(Math.abs(item.amount))}
        </Text>
        <TouchableOpacity
          onPress={() => confirmDelete(item.id, item.description)}
          style={styles.delBtn}
        >
          <MaterialIcons name="delete-outline" size={18} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <Text style={styles.title}>İşlem Geçmişi</Text>
        <View style={styles.headerBtns}>
          <TouchableOpacity
            style={[styles.importBtn, importing && { opacity: 0.6 }]}
            onPress={handleImport}
            disabled={importing}
          >
            {importing ? (
              <ActivityIndicator size="small" color={COLORS.primary} />
            ) : (
              <MaterialIcons name="file-upload" size={24} color={COLORS.primary} />
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.addBtn}
            onPress={() => navigation.navigate("AddTransaction")}
          >
            <MaterialIcons name="add" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.searchBar}>
        <MaterialIcons name="search" size={18} color={COLORS.textMuted} style={{ marginRight: 8 }} />
        <TextInput
          style={styles.searchInput}
          placeholder="İşlem veya kategori ara..."
          placeholderTextColor={COLORS.textMuted}
          value={search}
          onChangeText={setSearch}
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")}>
            <MaterialIcons name="close" size={18} color={COLORS.textMuted} />
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.filterRow}>
        {(["all", "income", "expense"] as const).map((f) => (
          <TouchableOpacity
            key={f}
            style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
            onPress={() => setFilter(f)}
          >
            <Text
              style={[styles.filterText, filter === f && styles.filterTextActive]}
            >
              {f === "all" ? "Tümü" : f === "income" ? "Gelir" : "Gider"}
            </Text>
          </TouchableOpacity>
        ))}
        <Text style={styles.countText}>{filtered.length} işlem</Text>
      </View>

      <FlatList
        data={filtered}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <MaterialIcons name="inbox" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyText}>
              {search ? "Arama sonucu bulunamadı." : "Henüz işlem yok."}
            </Text>
          </View>
        }
      />

      <Modal visible={showPreview} animationType="slide" transparent={true}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>İçeri Aktarma Önizleme</Text>
            <Text style={styles.modalSub}>{previewData.length} işlem bulundu.</Text>
            
            <ScrollView style={styles.previewList}>
              {previewData.map((item, idx) => (
                <View key={idx} style={styles.previewRow}>
                  <View style={styles.previewInfo}>
                    <Text style={styles.previewDesc} numberOfLines={1}>{item.description}</Text>
                    <Text style={styles.previewDate}>{item.date}</Text>
                  </View>
                  <Text style={[styles.previewAmount, { color: item.type === 'income' ? COLORS.income : COLORS.textPrimary }]}>
                    {item.type === 'income' ? '+' : '-'}{formatCurrency(Math.abs(item.amount))}
                  </Text>
                </View>
              ))}
            </ScrollView>

            <View style={styles.modalBtns}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowPreview(false)}>
                <Text style={styles.cancelBtnText}>İptal</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.confirmBtn} onPress={confirmImport}>
                <Text style={styles.confirmBtnText}>Onayla ve Kaydet</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  headerBtns: { flexDirection: "row", alignItems: "center", gap: 12 },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary },
  importBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  addBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    marginHorizontal: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary },
  filterRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    marginBottom: 10,
    alignItems: "center",
    gap: 8,
  },
  filterBtn: {
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    borderWidth: 0.5,
    borderColor: COLORS.border,
  },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "500" },
  filterTextActive: { color: "#fff" },
  countText: { fontSize: 12, color: COLORS.textMuted, marginLeft: "auto" },
  list: { paddingHorizontal: 20, paddingBottom: 32 },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 14,
    padding: 12,
    marginBottom: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  txInfo: { flex: 1 },
  txDesc: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary },
  txMeta: { flexDirection: "row", alignItems: "center", marginTop: 3, flexWrap: "wrap" },
  txCat: { fontSize: 11, color: COLORS.textSecondary },
  txDot: { fontSize: 11, color: COLORS.textMuted, marginHorizontal: 4 },
  txDate: { fontSize: 11, color: COLORS.textMuted },
  txExtre: { fontSize: 10, color: COLORS.primary, fontWeight: "600" },
  txRight: { alignItems: "flex-end", gap: 4 },
  txAmount: { fontSize: 14, fontWeight: "700" },
  delBtn: { padding: 2 },
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, marginTop: 10 },
  
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: "80%",
  },
  modalTitle: { fontSize: 18, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 4 },
  modalSub: { fontSize: 13, color: COLORS.textSecondary, marginBottom: 16 },
  previewList: { marginBottom: 20 },
  previewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderColor: COLORS.border,
  },
  previewInfo: { flex: 1, marginRight: 12 },
  previewDesc: { fontSize: 14, fontWeight: "500", color: COLORS.textPrimary },
  previewDate: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  previewAmount: { fontSize: 14, fontWeight: "700" },
  modalBtns: { flexDirection: "row", gap: 12 },
  cancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelBtnText: { color: COLORS.textPrimary, fontWeight: "600" },
  confirmBtn: {
    flex: 2,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    backgroundColor: COLORS.primary,
  },
  confirmBtnText: { color: "#fff", fontWeight: "700" },
});
