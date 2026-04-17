// src/screens/InvestmentsScreen.tsx
import React, { useState, useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Platform,
  Modal,
  TextInput,
  KeyboardAvoidingView,
  TouchableWithoutFeedback
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import Svg, { Circle } from "react-native-svg";
import { store } from "../store";
import { COLORS, Investment } from "../theme/constants";

const { width } = Dimensions.get("window");

const ASSET_TYPES = [
    { label: "Hisse", icon: "analytics" },
    { label: "Kripto", icon: "currency-bitcoin" },
    { label: "Altın", icon: "adjust" },
    { label: "Döviz", icon: "attach-money" },
    { label: "Fon", icon: "pie-chart" },
];

export default function InvestmentsScreen() {
    const [tick, setTick] = React.useState(0);
    const [isEditModalVisible, setIsEditModalVisible] = React.useState(false);
    const [selectedAsset, setSelectedAsset] = React.useState<Investment | null>(null);

    React.useEffect(() => {
        const fn = () => setTick(t => t + 1);
        store.listeners.add(fn);
        return () => { store.listeners.delete(fn); };
    }, []);

    // Form States
    const [name, setName] = React.useState("");
    const [type, setType] = React.useState("Hisse");
    const [amount, setAmount] = React.useState("");
    const [buyPrice, setBuyPrice] = React.useState("");
    const [currentPrice, setCurrentPrice] = React.useState("");
    const [date, setDate] = React.useState("");

    const assets = store.investments;

    const stats = useMemo(() => {
        let totalCost = 0;
        let totalValue = 0;
        assets.forEach(a => {
            const cost = Number(a.amount || 0) * Number(a.buyPrice || 0);
            const value = Number(a.amount || 0) * Number(a.currentPrice || 0);
            totalCost += isNaN(cost) ? 0 : cost;
            totalValue += isNaN(value) ? 0 : value;
        });
        const profit = totalValue - totalCost;
        const profitPercent = totalCost > 0 ? (profit / totalCost) * 100 : 0;
        return { 
            totalCost: isNaN(totalCost) ? 0 : totalCost, 
            totalValue: isNaN(totalValue) ? 0 : totalValue, 
            profit: isNaN(profit) ? 0 : profit, 
            profitPercent: isNaN(profitPercent) ? 0 : profitPercent 
        };
    }, [assets, tick]);

    const handleEdit = (asset: Investment) => {
        setSelectedAsset(asset);
        setName(asset.symbol);
        setType(asset.type);
        setAmount(asset.amount.toString());
        setBuyPrice(asset.buyPrice.toString());
        setCurrentPrice(asset.currentPrice.toString());
        setDate(asset.date);
        setIsEditModalVisible(true);
    };

    const handleAddNew = () => {
        setSelectedAsset(null);
        setName("");
        setType("Hisse");
        setAmount("");
        setBuyPrice("");
        setCurrentPrice("");
        setDate(new Date().toLocaleDateString("tr-TR"));
        setIsEditModalVisible(true);
    };

    const handleSave = async () => {
        const icon = ASSET_TYPES.find(t => t.label === type)?.icon || "analytics";
        const data = {
            symbol: name,
            type: type,
            amount: Number(amount),
            buyPrice: Number(buyPrice),
            currentPrice: Number(currentPrice),
            date: date,
            icon: icon
        };

        if (selectedAsset) {
            await store.updateInvestment(selectedAsset.id, data);
        } else {
            await store.addInvestment(data);
        }
        setIsEditModalVisible(false);
    };

    const handleDelete = async () => {
        if (selectedAsset) {
            await store.deleteInvestment(selectedAsset.id);
            setIsEditModalVisible(false);
        }
    };

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.scrollInside} showsVerticalScrollIndicator={false}>
            {/* Header Area */}
            <View style={styles.headerRow}>
                <Text style={styles.title}>Varlıklarım</Text>
                <TouchableOpacity style={styles.addBtn} onPress={handleAddNew}>
                    <MaterialIcons name="add" size={20} color="#000" />
                    <Text style={styles.addBtnText}>Varlık Ekle</Text>
                </TouchableOpacity>
            </View>

            {/* Header Stats */}
            <View style={styles.statRow}>
                <InvestmentStatBox title="Toplam Maliyet" value={stats.totalCost} color={COLORS.primary} icon="work" />
                <InvestmentStatBox title="Güncel Değer" value={stats.totalValue} color={COLORS.info} icon="trending-up" />
                <InvestmentStatBox title="Kar / Zarar" value={stats.profit} color={COLORS.income} sub={`(%${stats.profitPercent.toFixed(1)})`} icon="auto-graph" />
            </View>

            {/* Charts Row */}
            <View style={styles.chartsRow}>
                <View style={[styles.panel, { flex: 0.8 }]}>
                    <Text style={styles.panelTitle}>PORTFÖY DAĞILIMI</Text>
                    <PortfolioDoughnut data={assets} />
                </View>
                <View style={[styles.panel, { flex: 1.2 }]}>
                    <Text style={styles.panelTitle}>PERFORMANS (₺)</Text>
                    <PerformanceChart data={assets} />
                </View>
            </View>

            {/* Portfolio Table */}
            <View style={styles.panel}>
                <Text style={styles.panelTitle}>PORTFÖY DETAYI</Text>
                <View style={styles.tableHeader}>
                    <Text style={[styles.th, { flex: 1.5 }]}>VARLIK</Text>
                    <Text style={[styles.th, { flex: 1 }]}>TÜR</Text>
                    <Text style={[styles.th, { flex: 0.8 }]}>MİKTAR</Text>
                    <Text style={[styles.th, { flex: 1.2 }]}>ALIŞ FİYATI</Text>
                    <Text style={[styles.th, { flex: 1.2 }]}>GÜNCEL FİYAT</Text>
                    <Text style={[styles.th, { flex: 1.2 }]}>DEĞER</Text>
                    <Text style={[styles.th, { flex: 1.5 }]}>KAR/ZARAR</Text>
                    <View style={{ width: 24 }} />
                </View>
                {assets.map((asset, idx) => {
                    const rowCost = asset.amount * asset.buyPrice;
                    const rowValue = asset.amount * asset.currentPrice;
                    const rowProfit = rowValue - rowCost;
                    const rowProfitP = rowCost > 0 ? (rowProfit / rowCost) * 100 : 0;
                    
                    return (
                        <View key={idx} style={styles.tableRow}>
                            <Text style={[styles.td, styles.tdSymbol, { flex: 1.5 }]}>{asset.symbol}</Text>
                            <View style={[styles.td, { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }]}>
                                <MaterialIcons name={asset.icon as any} size={14} color={COLORS.textMuted} />
                                <Text style={styles.tdLabel}>{asset.type}</Text>
                            </View>
                            <Text style={[styles.td, { flex: 0.8 }]}>{asset.amount}</Text>
                            <Text style={[styles.td, { flex: 1.2 }]}>₺{new Intl.NumberFormat("tr-TR").format(asset.buyPrice)}</Text>
                            <Text style={[styles.td, { flex: 1.2, fontWeight: '700', color: COLORS.info }]}>₺{new Intl.NumberFormat("tr-TR").format(asset.currentPrice)}</Text>
                            <Text style={[styles.td, { flex: 1.2, fontWeight: '700' }]}>₺{new Intl.NumberFormat("tr-TR").format(rowValue)}</Text>
                            <View style={[styles.td, { flex: 1.5 }]}>
                                <Text style={{ color: rowProfit >= 0 ? COLORS.income : COLORS.expense, fontWeight: '700', fontSize: 13 }}>
                                    {rowProfit >= 0 ? '+' : ''}₺{new Intl.NumberFormat("tr-TR").format(rowProfit)}
                                </Text>
                                <Text style={{ color: rowProfit >= 0 ? COLORS.income : COLORS.expense, fontSize: 11 }}>
                                    (%{rowProfitP.toFixed(1)})
                                </Text>
                            </View>
                            <TouchableOpacity onPress={() => handleEdit(asset)}>
                                <MaterialIcons name="edit" size={18} color={COLORS.textMuted} />
                            </TouchableOpacity>
                        </View>
                    );
                })}
            </View>

            {/* Edit Modal */}
            <Modal visible={isEditModalVisible} transparent animationType="fade">
                <View style={styles.modalOverlay}>
                    <TouchableWithoutFeedback onPress={() => setIsEditModalVisible(false)}><View style={StyleSheet.absoluteFill} /></TouchableWithoutFeedback>
                    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Yatırımı Düzenle</Text>
                        
                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>VARLIK ADI *</Text>
                            <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={COLORS.textMuted} />
                        </View>

                        <View style={styles.formRow}>
                            <View style={[styles.formGroup, { flex: 1 }]}>
                                <Text style={styles.formLabel}>TÜR</Text>
                                <View style={styles.pickerContainer}>
                                    <MaterialIcons name={ASSET_TYPES.find(t=>t.label===type)?.icon as any} size={18} color={COLORS.text} style={{ marginRight: 8 }} />
                                    <Text style={{ color: COLORS.text, fontSize: 14 }}>{type}</Text>
                                    <MaterialIcons name="keyboard-arrow-down" size={18} color={COLORS.textMuted} style={{ marginLeft: 'auto' }} />
                                </View>
                            </View>
                            <View style={[styles.formGroup, { flex: 1 }]}>
                                <Text style={styles.formLabel}>MİKTAR *</Text>
                                <TextInput style={styles.input} value={amount} onChangeText={setAmount} keyboardType="numeric" placeholderTextColor={COLORS.textMuted} />
                            </View>
                        </View>

                        <View style={styles.formRow}>
                            <View style={[styles.formGroup, { flex: 1 }]}>
                                <Text style={styles.formLabel}>ALIŞ FİYATI (₺) *</Text>
                                <TextInput style={styles.input} value={buyPrice} onChangeText={setBuyPrice} keyboardType="numeric" placeholderTextColor={COLORS.textMuted} />
                            </View>
                            <View style={[styles.formGroup, { flex: 1 }]}>
                                <Text style={styles.formLabel}>GÜNCEL FİYAT (₺)</Text>
                                <TextInput style={styles.input} value={currentPrice} onChangeText={setCurrentPrice} keyboardType="numeric" placeholderTextColor={COLORS.textMuted} />
                            </View>
                        </View>

                        <View style={styles.formGroup}>
                            <Text style={styles.formLabel}>ALIŞ TARİHİ</Text>
                            <View style={styles.inputWithIcon}>
                                <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} value={date} onChangeText={setDate} placeholder="GG.AA.YYYY" placeholderTextColor={COLORS.textMuted} />
                                <MaterialIcons name="calendar-today" size={18} color={COLORS.textMuted} style={styles.innerIcon} />
                            </View>
                        </View>

                        <View style={styles.modalFooter}>
                            <TouchableOpacity style={styles.deleteBtn} onPress={handleDelete}>
                                <Text style={styles.deleteBtnText}>Sil</Text>
                            </TouchableOpacity>
                            <View style={{ flexDirection: 'row', gap: 12 }}>
                                <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditModalVisible(false)}>
                                    <Text style={styles.cancelBtnText}>İptal</Text>
                                </TouchableOpacity>
                                <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                                    <Text style={styles.saveBtnText}>Kaydet</Text>
                                </TouchableOpacity>
                            </View>
                        </View>
                    </KeyboardAvoidingView>
                </View>
            </Modal>
        </ScrollView>
    );
}

const InvestmentStatBox = ({ title, value, color, sub, icon }: any) => (
    <View style={styles.statBox}>
        <Text style={styles.statLabel}>{title}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
            <Text style={[styles.statValue, { color }]}>₺{new Intl.NumberFormat("tr-TR").format(value)}</Text>
            {sub && <Text style={{ color, fontSize: 14, fontWeight: '600' }}>{sub}</Text>}
        </View>
        <View style={styles.statIconBox}><MaterialIcons name={icon} size={24} color={color} style={{ opacity: 0.2 }} /></View>
    </View>
);

const PortfolioDoughnut = ({ data }: any) => {
    return (
        <View style={styles.doughnutWrapper}>
            <View style={styles.doughnutContainer}>
                <Svg viewBox="0 0 100 100" style={styles.svg}>
                    <Circle cx="50" cy="50" r="38" fill="transparent" stroke={COLORS.info} strokeWidth="10" strokeDasharray="25 75" rotation="-90" origin="50,50" />
                    <Circle cx="50" cy="50" r="38" fill="transparent" stroke={COLORS.primary} strokeWidth="10" strokeDasharray="30 70" strokeDashoffset="-25" rotation="-90" origin="50,50" />
                    <Circle cx="50" cy="50" r="38" fill="transparent" stroke={COLORS.warning} strokeWidth="10" strokeDasharray="20 80" strokeDashoffset="-55" rotation="-90" origin="50,50" />
                    <Circle cx="50" cy="50" r="38" fill="transparent" stroke={COLORS.income} strokeWidth="10" strokeDasharray="25 75" strokeDashoffset="-75" rotation="-90" origin="50,50" />
                </Svg>
                <View style={styles.doughnutCenter}><MaterialIcons name="pie-chart" size={32} color={COLORS.textMuted} style={{ opacity: 0.3 }} /></View>
            </View>
        </View>
    );
};

const PerformanceChart = ({ data }: any) => {
    const top6 = data.slice(0, 6);
    const maxVal = Math.max(...top6.map((d: any) => d.amount * d.currentPrice), 1000);
    return (
        <View style={styles.perfContainer}>
            <View style={styles.perfDrawArea}>
                {top6.map((d: any, idx: number) => (
                    <View key={idx} style={styles.perfColumn}>
                        <View style={styles.perfBarGroup}>
                            <View style={[styles.perfBar, { height: `${((d.amount * d.buyPrice) / maxVal) * 100}%`, backgroundColor: COLORS.primary + '60' }]} />
                            <View style={[styles.perfBar, { height: `${((d.amount * d.currentPrice) / maxVal) * 100}%`, backgroundColor: COLORS.income + '90' }]} />
                        </View>
                        <Text style={styles.perfLabel}>{d.symbol.substring(0, 4)}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scrollInside: { padding: 32 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 },
  title: { fontSize: 24, fontWeight: '800', color: '#fff' },
  addBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: COLORS.income, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  addBtnText: { color: '#000', fontWeight: '800', fontSize: 14 },
  statRow: { flexDirection: "row", gap: 16, marginBottom: 32 },
  statBox: { flex: 1, backgroundColor: COLORS.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: COLORS.border, position: 'relative', overflow: 'hidden' },
  statLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: "700", letterSpacing: 1, marginBottom: 12 },
  statValue: { fontSize: 26, fontWeight: "900", fontFamily: "Space Mono, monospace" },
  statIconBox: { position: 'absolute', right: -10, bottom: -10 },
  chartsRow: { flexDirection: "row", gap: 24, marginBottom: 32 },
  panel: { backgroundColor: COLORS.card, borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  panelTitle: { fontSize: 11, color: COLORS.textMuted, fontWeight: "700", letterSpacing: 1.2, marginBottom: 24 },
  doughnutWrapper: { alignItems: "center" },
  doughnutContainer: { width: 140, height: 140, position: "relative" },
  svg: { width: "100%", height: "100%" },
  doughnutCenter: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  perfContainer: { height: 200 },
  perfDrawArea: { flex: 1, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", paddingBottom: 16 },
  perfColumn: { alignItems: "center", width: 40 },
  perfBarGroup: { flexDirection: "row", alignItems: "flex-end", gap: 3, height: 140 },
  perfBar: { width: 10, borderRadius: 3 },
  perfLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 8, fontWeight: "700" },
  tableHeader: { flexDirection: "row", paddingHorizontal: 16, paddingBottom: 16, borderBottomWidth: 1, borderColor: COLORS.border },
  th: { color: COLORS.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 0.5 },
  tableRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 16, paddingVertical: 16, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  td: { color: COLORS.textSecondary, fontSize: 13, fontWeight: "500" },
  tdSymbol: { color: "#fff", fontWeight: "800", fontSize: 14 },
  tdLabel: { color: COLORS.textMuted, fontSize: 12 },

  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.85)", justifyContent: "center", alignItems: "center", padding: 20 },
  modalContent: { width: "100%", maxWidth: 500, backgroundColor: "#111827", borderRadius: 24, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#fff", marginBottom: 32 },
  formGroup: { marginBottom: 20 },
  formRow: { flexDirection: "row", gap: 16 },
  formLabel: { fontSize: 11, color: COLORS.textMuted, fontWeight: "700", marginBottom: 8, letterSpacing: 0.5 },
  input: { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 14, color: COLORS.text, fontSize: 15, borderWidth: 1, borderColor: COLORS.border },
  inputWithIcon: { position: 'relative' },
  innerIcon: { position: 'absolute', right: 14, top: 16 },
  pickerContainer: { backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 14, borderWidth: 1, borderColor: COLORS.border, flexDirection: 'row', alignItems: 'center' },
  modalFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 12 },
  deleteBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, borderWidth: 1, borderColor: "rgba(239, 68, 68, 0.2)", backgroundColor: "rgba(239, 68, 68, 0.05)" },
  deleteBtnText: { color: "#ef4444", fontWeight: "700", fontSize: 14 },
  cancelBtn: { paddingVertical: 12, paddingHorizontal: 20, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.03)" },
  cancelBtnText: { color: COLORS.textSecondary, fontWeight: "700", fontSize: 14 },
  saveBtn: { paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12, backgroundColor: COLORS.income },
  saveBtnText: { color: "#000", fontWeight: "800", fontSize: 14 },
});
