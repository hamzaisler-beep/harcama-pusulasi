// src/screens/TransactionsScreen.tsx
import React, { useState, useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Platform,
  Modal,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Alert,
  ActivityIndicator
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { 
  isWithinInterval, 
  parseISO, 
  format, 
  subDays, 
  startOfMonth, 
  endOfMonth, 
  eachDayOfInterval, 
  isSameDay, 
  addMonths, 
  subMonths,
  getDay,
  isAfter,
  isBefore
} from "date-fns";
import { tr } from "date-fns/locale";
import * as DocumentPicker from "expo-document-picker";
import * as XLSX from "xlsx";
import { store } from "../store";
import { COLORS } from "../theme/constants";

const CATEGORIES = [
    { label: "Maaş", icon: "payments" },
    { label: "Freelance", icon: "laptop" },
    { label: "Market", icon: "shopping-cart" },
    { label: "Faturalar", icon: "bolt" },
    { label: "Restoran", icon: "restaurant" },
    { label: "Ulaşım", icon: "directions-car" },
    { label: "Eğlence", icon: "videogame-asset" },
    { label: "Kira Geliri", icon: "home" },
    { label: "Giyim", icon: "apparel" },
    { label: "Sağlık", icon: "fitness-center" },
    { label: "Diğer", icon: "category" }
];

export default function TransactionsScreen() {
    const [searchTerm, setSearchTerm] = useState("");
    const [isModalVisible, setIsModalVisible] = useState(false);
    const [isRangeModalVisible, setIsRangeModalVisible] = useState(false);
    const [isImportModalVisible, setIsImportModalVisible] = useState(false);
    
    // Filter States
    const [filterType, setFilterType] = useState("Tümü");
    const [filterCategory, setFilterCategory] = useState("Tüm Kategoriler");
    const [dateRange, setDateRange] = useState<{ start: Date | null, end: Date | null }>({
        start: subDays(new Date(), 30),
        end: new Date()
    });

    // Dropdown Visibility
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);

    // New Transaction Form
    const [amount, setAmount] = useState("");
    const [description, setDescription] = useState("");
    const [category, setCategory] = useState("Diğer");
    const [type, setType] = useState<"income" | "expense">("expense");
    const [isSaving, setIsSaving] = useState(false);

    // Import State
    const [importList, setImportList] = useState<any[]>([]);

    const transactions = useMemo(() => {
        let filtered = [...store.transactions];
        if (searchTerm) {
            filtered = filtered.filter(t => 
                t.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                t.category.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        if (filterType === "Gelir") filtered = filtered.filter(t => t.type === "income");
        if (filterType === "Gider") filtered = filtered.filter(t => t.type === "expense");
        if (filterCategory !== "Tüm Kategoriler") filtered = filtered.filter(t => t.category === filterCategory);
        if (dateRange.start && dateRange.end) {
            filtered = filtered.filter(t => {
                try {
                    const txDate = parseISO(t.date);
                    return isWithinInterval(txDate, { start: dateRange.start!, end: dateRange.end! });
                } catch (e) { return true; }
            });
        }
        return filtered;
    }, [store.transactions, searchTerm, filterType, filterCategory, dateRange]);

    const summary = useMemo(() => {
        const income = transactions.filter(t => t.type === "income").reduce((s, t) => s + Number(t.amount || 0), 0);
        const expense = transactions.filter(t => t.type === "expense").reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0);
        return { income, expense, net: income - expense };
    }, [transactions]);

    const handleSave = async () => {
        if (!amount || !description) return;
        setIsSaving(true);
        try {
            await store.addTransaction({
                amount: Number(amount),
                description,
                category,
                type,
                date: new Date().toISOString(),
                userId: store.familyId || ""
            });
            setIsModalVisible(false);
            setAmount("");
            setDescription("");
            setCategory("Diğer");
        } finally { setIsSaving(false); }
    };

    const handleImportFile = async () => {
        try {
            const res = await DocumentPicker.getDocumentAsync({ 
                type: Platform.OS === 'web' ? ".xlsx,.xls,.csv" : ["application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/vnd.ms-excel", "text/csv"] 
            });
            
            if (res.canceled) return;
            
            const fileAsset = res.assets[0];
            if (Platform.OS === 'web') {
                const rawFile = (fileAsset as any).file || fileAsset;
                if (!rawFile) {
                    Alert.alert("Teşhis", "Dosya içeriği okunamadı. Tarayıcı desteğini kontrol edin.");
                    return;
                }

                const reader = new FileReader();
                reader.onload = (e: any) => {
                    try {
                        const data = new Uint8Array(e.target.result);
                        const wb = XLSX.read(data, { type: 'array' });
                        const ws = wb.Sheets[wb.SheetNames[0]];
                        const json = XLSX.utils.sheet_to_json(ws);
                        
                        if (!json || json.length === 0) {
                            Alert.alert("Bilgi", "Seçilen sayfada veri bulunamadı.");
                            return;
                        }
                        processImportData(json);
                    } catch (readErr) {
                        Alert.alert("Hata", "Dosya işleme hatası. Lütfen Excel formatını kontrol edin.");
                    }
                };
                reader.onerror = () => Alert.alert("Hata", "Dosya okuma izni alınamadı.");
                reader.readAsArrayBuffer(rawFile);
            } else { 
                Alert.alert("Bilgi", "İçe aktarma şu an sadece web versiyonunda aktiftir."); 
            }
        } catch (err) { 
            Alert.alert("Hata", "Dosya seçimi sırasında bir hata oluştu.");
        }
    };

    const processImportData = (rawRows: any[]) => {
        // Robustness: Sometimes the first row is NOT the header in bank statements
        // We find the header row by searching for keys
        let dataRows = rawRows;
        let bestHeaderIdx = -1;
        const keywords = ["tutar", "borç", "alacak", "açıklama", "tarih", "işlem", "price", "amount", "date"];

        for (let i = 0; i < Math.min(20, rawRows.length); i++) {
            const keys = Object.keys(rawRows[i]).map(k => k.toLowerCase());
            const matchCount = keywords.filter(w => keys.some(k => k.includes(w))).length;
            if (matchCount >= 2) {
                bestHeaderIdx = i;
                break;
            }
        }

        const mapped = dataRows.map((row, idx) => {
            const keys = Object.keys(row);
            // Turkish characters normalization or flexible regex
            const findKey = (regex: RegExp) => keys.find(k => k.toLowerCase().replace(/ı/g, 'i').replace(/ü/g,'u').replace(/ş/g,'s').replace(/ö/g,'o').replace(/ç/g,'c').replace(/ğ/g,'g').match(regex));

            const amountKey = findKey(/tutar|price|amount|bakiye|borc|alacak/i);
            const descKey = findKey(/aciklama|description|tanim|islem|detay/i);
            const dateKey = findKey(/tarih|date/i);

            if (!amountKey || !descKey) return null;

            let rawVal = row[amountKey]?.toString() || "0";
            // Clean currency symbols and spaces, normalize decimal
            let cleanVal = rawVal.replace(/[^\d.,-]/g, ""); 
            
            // Handle European format (1.234,56) vs US format (1,234.56)
            if (cleanVal.includes(",") && cleanVal.includes(".")) {
                // Determine which is decimal based on last position
                if (cleanVal.lastIndexOf(".") > cleanVal.lastIndexOf(",")) {
                    cleanVal = cleanVal.replace(/,/g, ""); // US
                } else {
                    cleanVal = cleanVal.replace(/\./g, "").replace(",", "."); // EU/TR
                }
            } else if (cleanVal.includes(",")) {
                cleanVal = cleanVal.replace(",", ".");
            }
            
            const amt = parseFloat(cleanVal);
            if (isNaN(amt)) return null;

            let txType: "income" | "expense" = amt > 0 ? "income" : "expense";
            const lowAmtKey = amountKey.toLowerCase();
            if (lowAmtKey.includes("borc")) txType = "expense";
            if (lowAmtKey.includes("alacak")) txType = "income";

            return {
                amount: Math.abs(amt),
                description: row[descKey] || "İsimsiz İşlem",
                date: row[dateKey] || new Date().toISOString(),
                type: txType,
                category: "Faturalar"
            };
        }).filter(Boolean);

        if (mapped.length === 0) {
            Alert.alert("Hata", "Uygun başlıklar (Tutar, Açıklama vb.) bulunamadı. Lütfen Excel başlıklarını kontrol edin.");
            return;
        }
        setImportList(mapped);
        setIsImportModalVisible(true);
    };

    const handleConfirmImport = async () => {
        setIsSaving(true);
        try {
            for (const tx of importList) {
                await store.addTransaction({ ...tx, userId: store.familyId || "" });
            }
            setIsImportModalVisible(false);
            setImportList([]);
            Alert.alert("Başarılı", `${importList.length} işlem yüklendi.`);
        } catch (e) {
            Alert.alert("Hata", "Kaydetme sırasında bir hata oluştu.");
        } finally {
            setIsSaving(false);
        }
    };

    const rangeText = useMemo(() => {
        if (dateRange.start && dateRange.end) {
            return `${format(dateRange.start, "d MMM", { locale: tr })} - ${format(dateRange.end, "d MMM", { locale: tr })}`;
        }
        return "Tarih Seçin";
    }, [dateRange]);

    return (
        <View style={styles.container}>
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>İşlemler</Text>
                <View style={styles.headerActions}>
                    <TouchableOpacity style={styles.iconBtn} onPress={handleImportFile}>
                        <MaterialIcons name="file-upload" size={20} color={COLORS.primary} />
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.addBtn} onPress={() => setIsModalVisible(true)}>
                        <MaterialIcons name="add" size={20} color="#fff" />
                        <Text style={styles.addBtnText}>İşlem</Text>
                    </TouchableOpacity>
                </View>
            </View>

            {/* Filters */}
            <View style={styles.filterBar}>
                <View style={styles.searchBox}>
                    <MaterialIcons name="search" size={20} color={COLORS.textMuted} />
                    <TextInput style={styles.searchInput} placeholder="İşlem ara..." placeholderTextColor={COLORS.textMuted} value={searchTerm} onChangeText={setSearchTerm} />
                </View>
                <View style={styles.filterActions}>
                    <FilterSelect label={filterType} active={filterType !== "Tümü"} onPress={() => setActiveDropdown(activeDropdown === "type" ? null : "type")} />
                    <FilterSelect label={filterCategory} active={filterCategory !== "Tüm Kategoriler"} onPress={() => setActiveDropdown(activeDropdown === "category" ? null : "category")} />
                    <FilterSelect label={rangeText} active={true} onPress={() => setIsRangeModalVisible(true)} />
                </View>
            </View>

            {/* Dropdowns */}
            {activeDropdown === "type" && (
                <DropdownMenu items={["Tümü", "Gelir", "Gider"]} current={filterType} onSelect={(val: any) => {setFilterType(val); setActiveDropdown(null);}} top={145} right={260} />
            )}
            {activeDropdown === "category" && (
                <DropdownMenu items={[{label: "Tüm Kategoriler", icon: "check"}, ...CATEGORIES]} current={filterCategory} onSelect={(c: any) => {setFilterCategory(c.label || c); setActiveDropdown(null);}} top={145} right={120} hasIcons />
            )}

            {/* Summary */}
            <View style={styles.summaryRow}>
                <View style={[styles.summaryPill, { backgroundColor: COLORS.income + "15" }]}>
                    <Text style={[styles.pillText, { color: COLORS.income }]}>+ ₺{new Intl.NumberFormat("tr-TR").format(summary.income)}</Text>
                </View>
                <View style={[styles.summaryPill, { backgroundColor: COLORS.expense + "15" }]}>
                    <Text style={[styles.pillText, { color: COLORS.expense }]}>- ₺{new Intl.NumberFormat("tr-TR").format(summary.expense)}</Text>
                </View>
                <Text style={styles.netLabel}>Net: <Text style={{ color: COLORS.warning, fontWeight: '700' }}>₺{new Intl.NumberFormat("tr-TR").format(summary.net)}</Text></Text>
            </View>

            {/* List */}
            <ScrollView style={styles.listContainer} showsVerticalScrollIndicator={false}>
                {transactions.length === 0 ? (
                    <Text style={styles.emptyText}>İşlem bulunamadı.</Text>
                ) : (
                    transactions.map((tx) => (
                        <View key={tx.id} style={styles.txRow}>
                            <View style={[styles.txIconBox, { backgroundColor: tx.type === 'income' ? COLORS.income + '10' : COLORS.expense + '10' }]}>
                                <MaterialIcons name={getIconName(tx.category)} size={20} color={tx.type === 'income' ? COLORS.income : COLORS.expense} />
                            </View>
                            <View style={styles.txInfo}>
                                <Text style={styles.txTitle}>{tx.description}</Text>
                                <Text style={styles.txMeta}>{tx.date.includes("T") ? format(parseISO(tx.date), "d MMM", { locale: tr }) : tx.date}</Text>
                            </View>
                            <View style={styles.txAmountBox}>
                                <Text style={[styles.txAmount, { color: tx.type === 'income' ? COLORS.income : COLORS.expense }]}>
                                    {tx.type === 'income' ? '+' : '-'}₺{new Intl.NumberFormat("tr-TR").format(tx.amount)}
                                </Text>
                                <Text style={styles.txCategory}>{tx.category}</Text>
                            </View>
                            <TouchableOpacity 
                                style={styles.deleteBtn} 
                                onPress={() => {
                                    if (Platform.OS === 'web') {
                                        if (window.confirm("Bu harcamayı silmek istediğinize emin misiniz?")) {
                                            store.deleteTransaction(tx.id);
                                        }
                                    } else {
                                        Alert.alert(
                                            "İşlemi Sil",
                                            "Bu harcamayı silmek istediğinize emin misiniz?",
                                            [
                                                { text: "Vazgeç", style: "cancel" },
                                                { text: "Sil", style: "destructive", onPress: () => store.deleteTransaction(tx.id) }
                                            ]
                                        );
                                    }
                                }}
                            >
                                <MaterialIcons name="delete-outline" size={18} color={COLORS.textMuted} />
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </ScrollView>

            {/* Range Modal */}
            <Modal visible={isRangeModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback onPress={() => setIsRangeModalVisible(false)}><View style={StyleSheet.absoluteFill} /></TouchableWithoutFeedback>
                    <View style={[styles.modalContent, { maxWidth: 360, padding: 0, overflow: 'hidden' }]}>
                        <CalendarPicker range={dateRange} onSelect={setDateRange} onApply={() => setIsRangeModalVisible(false)} />
                    </View>
                </View>
            </Modal>

            {/* Add Modal */}
            <Modal visible={isModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback onPress={() => setIsModalVisible(false)}><View style={StyleSheet.absoluteFill} /></TouchableWithoutFeedback>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Yeni İşlem</Text>
                        <TextInput style={styles.input} placeholder="Tutar (₺)" value={amount} onChangeText={setAmount} keyboardType="numeric" placeholderTextColor={COLORS.textMuted} />
                        <TextInput style={styles.input} placeholder="Açıklama" value={description} onChangeText={setDescription} placeholderTextColor={COLORS.textMuted} />
                        
                        <View style={styles.typeRow}>
                            <TouchableOpacity style={[styles.typeBtn, type === 'expense' && styles.typeBtnActive]} onPress={() => setType('expense')}><Text style={[styles.typeBtnText, type === 'expense' && {color: '#fff'}]}>Gider</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.typeBtn, type === 'income' && styles.typeBtnActiveIncome]} onPress={() => setType('income')}><Text style={[styles.typeBtnText, type === 'income' && {color: '#fff'}]}>Gelir</Text></TouchableOpacity>
                        </View>

                        <TouchableOpacity style={[styles.saveBtn, isSaving && {opacity: 0.7}]} onPress={handleSave} disabled={isSaving}>
                            {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Kaydet</Text>}
                        </TouchableOpacity>
                    </KeyboardAvoidingView>
                </View>
            </Modal>

            {/* Import Modal */}
            <Modal visible={isImportModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={[styles.modalContent, { maxHeight: '80%' }]}>
                        <Text style={styles.modalTitle}>Ekstre Önizleme ({importList.length} İşlem)</Text>
                        <ScrollView style={{ marginVertical: 16 }}>
                            {importList.map((tx, idx) => (
                                <View key={idx} style={styles.txRow}>
                                    <View style={{ flex: 1 }}>
                                        <Text style={styles.txTitle}>{tx.description}</Text>
                                        <Text style={styles.txMeta}>{tx.date.includes("T") ? format(parseISO(tx.date), "d MMM", { locale: tr }) : tx.date}</Text>
                                    </View>
                                    <Text style={[styles.txAmount, { color: tx.type === 'income' ? COLORS.income : COLORS.expense }]}>
                                        {tx.type === 'income' ? '+' : '-'}₺{tx.amount}
                                    </Text>
                                </View>
                            ))}
                        </ScrollView>
                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={[styles.saveBtn, { flex: 1, backgroundColor: "rgba(255,255,255,0.05)" }]} onPress={() => setIsImportModalVisible(false)}><Text style={[styles.saveBtnText, {color: COLORS.textMuted}]}>Vazgeç</Text></TouchableOpacity>
                            <TouchableOpacity style={[styles.saveBtn, { flex: 1 }]} onPress={handleConfirmImport} disabled={isSaving}>
                                {isSaving ? <ActivityIndicator color="#fff" /> : <Text style={styles.saveBtnText}>Hepsini Aktar</Text>}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const FilterSelect = ({ label, active, onPress }: any) => (
    <TouchableOpacity onPress={onPress} style={[styles.filterBox, active && styles.filterBoxActive]}>
        <Text style={[styles.filterLabel, active && {color: '#fff'}]}>{label}</Text>
        <MaterialIcons name="keyboard-arrow-down" size={18} color={active ? COLORS.primary : COLORS.textMuted} />
    </TouchableOpacity>
);

const DropdownMenu = ({ items, onSelect, current, top, right, hasIcons }: any) => (
    <View style={[styles.dropdown, { top, right }]}>
        <ScrollView style={{ maxHeight: 300 }}>
            {items.map((item: any) => {
                const label = item.label || item;
                const active = current === label;
                return (
                    <TouchableOpacity key={label} onPress={() => onSelect(item)} style={[styles.dropdownItem, active && styles.dropdownItemActive]}>
                        {hasIcons && item.icon && <MaterialIcons name={item.icon} size={18} color={active ? COLORS.primary : COLORS.textMuted} />}
                        <Text style={[styles.dropdownText, active && {color: COLORS.primary, fontWeight: '700'}]}>{label}</Text>
                        {active && <MaterialIcons name="check" size={16} color={COLORS.primary} />}
                    </TouchableOpacity>
                );
            })}
        </ScrollView>
    </View>
);

const CalendarPicker = ({ range, onSelect, onApply }: any) => {
    const [currentMonth, setCurrentMonth] = useState(range.start || new Date());
    const days = eachDayOfInterval({ start: startOfMonth(currentMonth), end: endOfMonth(currentMonth) });
    const firstDayIndex = (getDay(startOfMonth(currentMonth)) + 6) % 7;
    const paddings = Array.from({ length: firstDayIndex });
    const weekDays = ["Pt", "Sa", "Ça", "Pe", "Cu", "Ct", "Pz"];

    const handleDayPress = (day: Date) => {
        if (!range.start || (range.start && range.end)) {
            onSelect({ start: day, end: null });
        } else {
            if (isBefore(day, range.start)) onSelect({ start: day, end: range.start });
            else onSelect({ ...range, end: day });
        }
    };

    return (
        <View style={styles.calendarContainer}>
            <View style={styles.calendarHeader}>
                <TouchableOpacity onPress={() => setCurrentMonth(subMonths(currentMonth, 1))}><MaterialIcons name="chevron-left" size={24} color={COLORS.text} /></TouchableOpacity>
                <Text style={styles.monthLabel}>{format(currentMonth, "MMMM yyyy", { locale: tr })}</Text>
                <TouchableOpacity onPress={() => setCurrentMonth(addMonths(currentMonth, 1))}><MaterialIcons name="chevron-right" size={24} color={COLORS.text} /></TouchableOpacity>
            </View>
            <View style={styles.weekLabels}>{weekDays.map(w => <Text key={w} style={styles.weekText}>{w}</Text>)}</View>
            <View style={styles.daysGrid}>
                {paddings.map((_, i) => <View key={`p-${i}`} style={styles.dayBox} />)}
                {days.map(d => {
                    const selected = isSameDay(d, range.start) || isSameDay(d, range.end);
                    const rangeBg = range.start && range.end && isWithinInterval(d, { start: range.start, end: range.end });
                    return (
                        <TouchableOpacity key={d.toISOString()} style={[styles.dayBox, rangeBg && styles.dayInRange, selected && styles.daySelected]} onPress={() => handleDayPress(d)}>
                            <Text style={[styles.dayText, (selected || rangeBg) && {color: '#fff', fontWeight: '700'}]}>{format(d, "d")}</Text>
                        </TouchableOpacity>
                    );
                })}
            </View>
            <TouchableOpacity style={styles.applyBtn} onPress={onApply}><Text style={styles.applyBtnText}>Uygula</Text></TouchableOpacity>
        </View>
    );
};

const getIconName = (cat: string) => {
    const c = (cat || "Diğer").toLowerCase();
    if (c.includes("maaş") || c.includes("gelir")) return "payments";
    if (c.includes("market")) return "shopping-cart";
    if (c.includes("fatura") || c.includes("elektrik")) return "bolt";
    if (c.includes("kira")) return "home";
    if (c.includes("akaryakıt") || c.includes("ulaşım")) return "directions-car";
    if (c.includes("restoran") || c.includes("yemek")) return "restaurant";
    if (c.includes("eğlence")) return "videogame-asset";
    return "category";
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 32, backgroundColor: COLORS.background },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 32 },
  title: { fontSize: 28, fontWeight: "800", color: "#fff", letterSpacing: -0.5 },
  headerActions: { flexDirection: "row", alignItems: "center", gap: 12 },
  iconBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: COLORS.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
  addBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  filterBar: { flexDirection: "row", gap: 12, marginBottom: 24, position: "relative" },
  searchBox: { flex: 1, height: 44, backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, flexDirection: "row", alignItems: "center", paddingHorizontal: 16 },
  searchInput: { flex: 1, color: "#fff", marginLeft: 8, fontSize: 14 },
  filterActions: { flexDirection: "row", gap: 8 },
  filterBox: { height: 44, paddingHorizontal: 16, backgroundColor: COLORS.card, borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, flexDirection: "row", alignItems: "center", gap: 8 },
  filterBoxActive: { borderColor: COLORS.primary },
  filterLabel: { color: COLORS.textMuted, fontSize: 13, fontWeight: "600" },
  dropdown: { position: "absolute", backgroundColor: "#1c1f2b", borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, minWidth: 180, padding: 8, zIndex: 9999, top: 145 },
  dropdownItem: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10, paddingHorizontal: 12, borderRadius: 8 },
  dropdownItemActive: { backgroundColor: "rgba(108,99,255,0.08)" },
  dropdownText: { color: COLORS.textSecondary, fontSize: 13, flex: 1 },
  summaryRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 32 },
  summaryPill: { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  pillText: { fontSize: 12, fontWeight: "800" },
  netLabel: { color: COLORS.textSecondary, fontSize: 12 },
  listContainer: { flex: 1 },
  txRow: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  txIconBox: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  txInfo: { flex: 1, marginLeft: 16 },
  txTitle: { color: "#fff", fontSize: 15, fontWeight: "600" },
  txMeta: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  txAmountBox: { alignItems: "flex-end", marginRight: 12 },
  txAmount: { fontSize: 15, fontWeight: "800", fontFamily: "Space Mono, monospace" },
  txCategory: { color: COLORS.textMuted, fontSize: 10, marginTop: 2 },
  deleteBtn: { padding: 8, marginLeft: 4 },
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { width: "100%", maxWidth: 500, backgroundColor: COLORS.card, borderRadius: 24, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#fff", marginBottom: 24 },
  input: { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 14, color: "#fff", fontSize: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  typeRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  typeBtn: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 10, backgroundColor: 'rgba(255,255,255,0.03)', borderWidth: 1, borderColor: COLORS.border },
  typeBtnActive: { backgroundColor: COLORS.expense, borderColor: COLORS.expense },
  typeBtnActiveIncome: { backgroundColor: COLORS.income, borderColor: COLORS.income },
  typeBtnText: { color: COLORS.textMuted, fontWeight: '700', fontSize: 13 },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 12, paddingVertical: 16, alignItems: "center" },
  saveBtnText: { color: "#fff", fontSize: 15, fontWeight: "800" },
  modalFooter: { flexDirection: 'row', gap: 12, marginTop: 12 },
  emptyText: { color: COLORS.textMuted, textAlign: 'center', marginTop: 40 },
  calendarContainer: { padding: 20 },
  calendarHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  monthLabel: { color: "#fff", fontSize: 16, fontWeight: "800" },
  weekLabels: { flexDirection: "row", marginBottom: 12 },
  weekText: { flex: 1, textAlign: "center", color: COLORS.textMuted, fontSize: 11, fontWeight: "700" },
  daysGrid: { flexDirection: "row", flexWrap: "wrap" },
  dayBox: { width: `${100/7}%`, height: 42, alignItems: "center", justifyContent: "center", marginBottom: 2 },
  daySelected: { backgroundColor: COLORS.primary, borderRadius: 21 },
  dayInRange: { backgroundColor: COLORS.primary + "15" },
  dayText: { color: COLORS.textSecondary, fontSize: 13, fontWeight: "600" },
  applyBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 24 },
  applyBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
