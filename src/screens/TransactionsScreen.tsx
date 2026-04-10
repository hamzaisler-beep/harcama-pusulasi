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
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";
import { parseBankStatement, ImportedTransaction } from "../services/ImportService";
import { useTransactions, useAccounts } from "../store/useStore";
import { COLORS, Transaction } from "../types";
import { formatCurrency, formatDate } from "../utils/format";

export default function TransactionsScreen({ navigation }: any) {
  const { transactions, deleteTransaction, addTransactionsBulk } = useTransactions();
  const { accounts } = useAccounts();
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "income" | "expense">("all");
  const { width } = useWindowDimensions();
  const isWeb = width > 1024;
  
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
        t.description?.toLowerCase().includes(search.toLowerCase()) ||
        t.category.toLowerCase().includes(search.toLowerCase());
      const matchFilter = filter === "all" || t.type === filter;
      return matchSearch && matchFilter;
    });
  }, [transactions, search, filter]);

  const confirmDelete = (id: string, description: string) => {
    Alert.alert("İşlemi Sil", `"${description}" işlemini silmek istiyor musunuz?`, [
      { text: "İptal", style: "cancel" },
      { text: "Sil", style: "destructive", onPress: () => deleteTransaction(id) },
    ]);
  };

  const renderHeader = () => {
    if (!isWeb) return null;
    return (
        <View style={styles.tableHeader}>
            <Text style={[styles.columnHeader, { flex: 2 }]}>AÇIKLAMA</Text>
            <Text style={[styles.columnHeader, { flex: 1 }]}>KATEGORİ</Text>
            <Text style={[styles.columnHeader, { flex: 1 }]}>HESAP</Text>
            <Text style={[styles.columnHeader, { flex: 1 }]}>TARİH</Text>
            <Text style={[styles.columnHeader, { flex: 1, textAlign: "right" }]}>TUTAR</Text>
            <View style={{ width: 40 }} />
        </View>
    );
  };

  const renderItem = ({ item }: { item: Transaction }) => {
    const account = accounts.find(a => a.id === item.accountId);
    
    return (
        <View style={[styles.txRow, isWeb && styles.webTxRow]}>
          <View style={[styles.txIconBox, { backgroundColor: item.type === "income" ? COLORS.income + "15" : COLORS.expense + "15" }]}>
            <MaterialIcons 
                name={item.type === "income" ? "arrow-downward" : "arrow-upward"} 
                size={16} 
                color={item.type === "income" ? COLORS.income : COLORS.expense} 
            />
          </View>
          
          <View style={{ flex: 2 }}>
            <Text style={styles.txDesc} numberOfLines={1}>{item.description}</Text>
            {!isWeb && <Text style={styles.txMeta}>{formatDate(item.date)} • {account?.name || "Banka"}</Text>}
          </View>

          {isWeb && (
            <>
                <View style={{ flex: 1 }}>
                    <Text style={styles.txLabelText}>{item.category}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={[styles.txLabelText, account && { color: account.color }]}>{account?.name || "-"}</Text>
                </View>
                <View style={{ flex: 1 }}>
                    <Text style={styles.txMetaText}>{formatDate(item.date)}</Text>
                </View>
            </>
          )}

          <View style={[styles.txRight, { flex: 1 }]}>
            <Text style={[styles.txAmount, { color: item.type === "income" ? COLORS.income : COLORS.expense }]}>
              {item.type === "income" ? "+" : "-"}{formatCurrency(Math.abs(item.amount))}
            </Text>
            <TouchableOpacity onPress={() => confirmDelete(item.id, item.description)} style={styles.delBtn}>
              <MaterialIcons name="delete-outline" size={16} color={COLORS.textMuted} />
            </TouchableOpacity>
          </View>
        </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={[styles.container, isWeb && styles.webContainer]}>
        <View style={styles.header}>
            <View>
                <Text style={styles.title}>İşlemler</Text>
                <Text style={styles.subtitle}>{transactions.length} toplam kayıt</Text>
            </View>
            <View style={styles.headerActions}>
                <TouchableOpacity style={styles.importBtn} onPress={handleImport} disabled={importing}>
                    {importing ? <ActivityIndicator size="small" color={COLORS.primary} /> : (
                        <>
                            <MaterialIcons name="file-upload" size={16} color={COLORS.primary} />
                            <Text style={styles.importText}>İçe Aktar</Text>
                        </>
                    )}
                </TouchableOpacity>
                <TouchableOpacity style={styles.addBtn} onPress={() => navigation.navigate("AddTransaction")}>
                    <MaterialIcons name="add" size={18} color="#fff" />
                    <Text style={styles.addText}>İşlem Ekle</Text>
                </TouchableOpacity>
            </View>
        </View>

        <View style={styles.tools}>
            <View style={styles.searchBar}>
                <MaterialIcons name="search" size={18} color={COLORS.textMuted} />
                <TextInput 
                    style={styles.searchInput} 
                    placeholder="Ara..." 
                    placeholderTextColor={COLORS.textMuted}
                    value={search}
                    onChangeText={setSearch}
                />
            </View>
            <View style={styles.filterRow}>
                {(["all", "income", "expense"] as const).map(f => (
                    <TouchableOpacity 
                        key={f} 
                        style={[styles.filterBtn, filter === f && styles.filterBtnActive]}
                        onPress={() => setFilter(f)}
                    >
                        <Text style={[styles.filterText, filter === f && styles.filterTextActive]}>
                            {f === "all" ? "Tümü" : f === "income" ? "Gelir" : "Gider"}
                        </Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>

        {renderHeader()}
        
        <FlatList
          data={filtered}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <View style={styles.emptyBox}>
                <MaterialIcons name="receipt-long" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>Herhangi bir işlem bulunamadı.</Text>
            </View>
          }
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  container: { flex: 1, padding: 20 },
  webContainer: { padding: 32 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 24 },
  title: { fontSize: 24, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  headerActions: { flexDirection: "row", gap: 12 },
  importBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "#111", paddingHorizontal: 14, paddingVertical: 10, borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  importText: { color: COLORS.primary, fontWeight: "700", fontSize: 13 },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addText: { color: "#fff", fontWeight: "800", fontSize: 13 },
  tools: { flexDirection: "row", gap: 16, marginBottom: 20 },
  searchBar: { flex: 1, flexDirection: "row", alignItems: "center", backgroundColor: "#111", borderRadius: 12, paddingHorizontal: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", gap: 12 },
  searchInput: { flex: 1, color: "#fff", height: 44, fontSize: 14 },
  filterRow: { flexDirection: "row", gap: 8 },
  filterBtn: { paddingHorizontal: 16, height: 44, borderRadius: 12, backgroundColor: "#111", alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { color: COLORS.textMuted, fontSize: 13, fontWeight: "600" },
  filterTextActive: { color: "#fff" },
  tableHeader: { flexDirection: "row", paddingHorizontal: 24, paddingVertical: 12, backgroundColor: "#111", borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  columnHeader: { color: COLORS.textMuted, fontSize: 10, fontWeight: "800", letterSpacing: 1 },
  list: { paddingBottom: 40 },
  txRow: { flexDirection: "row", alignItems: "center", backgroundColor: "#111", padding: 16, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.03)" },
  webTxRow: { paddingHorizontal: 24 },
  txIconBox: { width: 36, height: 36, borderRadius: 10, alignItems: "center", justifyContent: "center", marginRight: 16 },
  txDesc: { color: "#fff", fontSize: 14, fontWeight: "700" },
  txMeta: { color: COLORS.textMuted, fontSize: 11, marginTop: 4 },
  txLabelText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: "600" },
  txMetaText: { color: COLORS.textMuted, fontSize: 13 },
  txRight: { alignItems: "flex-end", gap: 4 },
  txAmount: { fontSize: 15, fontWeight: "800", letterSpacing: -0.5 },
  delBtn: { padding: 4, marginTop: 4 },
  emptyBox: { alignItems: "center", justifyContent: "center", paddingVertical: 100, gap: 16 },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
});

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: 20 },
  webContainer: { padding: 32 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: { fontSize: 24, fontWeight: "800", color: COLORS.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  headerBtns: { flexDirection: "row", gap: 12 },
  importBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  importBtnText: { color: COLORS.primary, fontSize: 13, fontWeight: "600" },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    gap: 6,
  },
  addBtnText: { color: "#fff", fontSize: 13, fontWeight: "600" },
  tools: { gap: 16, marginBottom: 20 },
  webTools: { flexDirection: "row", alignItems: "center" },
  searchBar: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: 8,
  },
  searchInput: { flex: 1, fontSize: 14, color: COLORS.textPrimary },
  filterRow: { flexDirection: "row", gap: 8 },
  filterBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  filterBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  filterText: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "600" },
  filterTextActive: { color: "#fff" },
  list: { paddingBottom: 40 },
  txRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  webTxRow: { paddingHorizontal: 24 },
  txStatus: { width: 4, height: 24, borderRadius: 2, marginRight: 16 },
  txMainInfo: { flex: 2, gap: 4 },
  txDesc: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  txDate: { fontSize: 12, color: COLORS.textMuted },
  txCategoryContainer: { flex: 1, alignItems: "flex-start" },
  txCategory: { fontSize: 12, color: COLORS.textSecondary, backgroundColor: COLORS.background, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, overflow: "hidden" },
  txRight: { flex: 1, alignItems: "flex-end", gap: 4 },
  txAmount: { fontSize: 16, fontWeight: "800" },
  delBtn: { padding: 4, marginTop: 4 },
  emptyState: { alignItems: "center", paddingVertical: 100, gap: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: COLORS.textPrimary },
  emptyText: { fontSize: 14, color: COLORS.textSecondary, textAlign: "center" },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", padding: 20 },
  modalContent: { backgroundColor: COLORS.card, borderRadius: 24, padding: 24, maxHeight: "85%", borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: 20, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 8 },
  modalSub: { fontSize: 14, color: COLORS.textSecondary, marginBottom: 20 },
  previewList: { marginBottom: 24 },
  previewRow: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  previewInfo: { gap: 4 },
  previewDesc: { fontSize: 14, fontWeight: "700", color: COLORS.textPrimary },
  previewDate: { fontSize: 12, color: COLORS.textMuted },
  previewAmount: { fontSize: 15, fontWeight: "800" },
  modalBtns: { flexDirection: "row", gap: 12 },
  cancelBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: "center", backgroundColor: COLORS.background },
  cancelBtnText: { color: COLORS.textSecondary, fontWeight: "700" },
  confirmBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: "center", backgroundColor: COLORS.primary },
  confirmBtnText: { color: "#fff", fontWeight: "700" },
});

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
