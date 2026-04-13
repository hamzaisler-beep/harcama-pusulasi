import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Alert,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons, FontAwesome5 } from "@expo/vector-icons";
import { useDebts } from "../store/useStore";
import { COLORS } from "../types";
import { formatCurrency } from "../utils/format";

export default function DebtScreen() {
  const { debts, addDebt, deleteDebt, toggleDebtStatus, isLoaded } = useDebts();
  const { width } = useWindowDimensions();
  const isWeb = width > 1024;

  const [showAdd, setShowAdd] = useState<{ type: 'DEBT' | 'RECEIVABLE' | null }>({ type: null });
  const [person, setPerson] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState("");

  if (!isLoaded) {
    return (
        <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
    );
  }

  // Calculations
  const totalDebt = debts.filter(d => d.type === 'DEBT' && d.status === 'PENDING').reduce((acc, d) => acc + d.amount, 0);
  const totalRec = debts.filter(d => d.type === 'RECEIVABLE' && d.status === 'PENDING').reduce((acc, d) => acc + d.amount, 0);
  const netStatus = totalRec - totalDebt;
  
  const overdueCount = debts.filter(d => d.status === 'PENDING' && new Date(d.dueDate) < new Date()).length;

  const debtsList = debts.filter(d => d.type === 'DEBT');
  const recList = debts.filter(d => d.type === 'RECEIVABLE');

  const handleAdd = () => {
    const parsed = parseFloat(amount.replace(",", "."));
    if (!person || isNaN(parsed) || parsed <= 0) {
        Alert.alert("Hata", "Lütfen geçerli isim ve miktar girin.");
        return;
    }
    addDebt({
        person,
        amount: parsed,
        type: showAdd.type!,
        dueDate: date || new Date().toISOString()
    });
    setPerson("");
    setAmount("");
    setDate("");
    setShowAdd({ type: null });
  };

  const renderEmpty = (type: string) => (
    <View style={styles.emptyContainer}>
        <View style={[styles.marble, { backgroundColor: type === 'DEBT' ? '#991b1b' : '#166534' }]} />
        <Text style={styles.emptyText}>{type === 'DEBT' ? 'Borç yok' : 'Alacak yok'}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.content, isWeb && styles.webContent]} showsVerticalScrollIndicator={false}>
        
        {/* Top Summary Stats */}
        <View style={styles.statsRow}>
            <View style={styles.statCard}>
                <View style={styles.statHeader}>
                    <Text style={styles.statLabel}>Toplam Borcum</Text>
                    <View style={[styles.indicator, { backgroundColor: '#991b1b' }]} />
                </View>
                <Text style={[styles.statValue, { color: COLORS.expense }]}>{formatCurrency(totalDebt)}</Text>
            </View>
            <View style={styles.statCard}>
                <View style={styles.statHeader}>
                    <Text style={styles.statLabel}>Toplam Alacağım</Text>
                    <View style={[styles.indicator, { backgroundColor: '#166534' }]} />
                </View>
                <Text style={[styles.statValue, { color: COLORS.income }]}>{formatCurrency(totalRec)}</Text>
            </View>
            <View style={styles.statCard}>
                <View style={styles.statHeader}>
                    <Text style={styles.statLabel}>Net Durum</Text>
                    <FontAwesome5 name="balance-scale" size={14} color="#333" />
                </View>
                <Text style={[styles.statValue, { color: netStatus >= 0 ? COLORS.income : COLORS.expense }]}>
                    {formatCurrency(netStatus)}
                </Text>
            </View>
        </View>

        {/* Overdue Card */}
        <View style={[styles.statCard, styles.overdueCard]}>
            <View style={styles.statHeader}>
                <Text style={styles.statLabel}>Vadesi Geçmiş</Text>
                <MaterialIcons name="alarm" size={18} color="#f59e0b" style={{ opacity: 0.5 }} />
            </View>
            <Text style={[styles.statValue, { color: '#f59e0b' }]}>{overdueCount} kayıt</Text>
        </View>

        {/* Main Grid */}
        <View style={[styles.mainGrid, isWeb && styles.mainGridWeb]}>
            
            {/* Borçlarım Column */}
            <View style={styles.column}>
                <View style={styles.columnHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={[styles.dot, { backgroundColor: COLORS.expense }]} />
                        <Text style={styles.sectionTitle}>BORÇLARIM</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowAdd({ type: 'DEBT' })} style={styles.addSmallBtn}>
                        <Text style={styles.addSmallBtnText}>+ Borç Ekle</Text>
                    </TouchableOpacity>
                </View>
                
                <View style={styles.listCard}>
                    {debtsList.length === 0 ? renderEmpty('DEBT') : (
                        debtsList.map(item => (
                            <DebtItem key={item.id} item={item} onToggle={() => toggleDebtStatus(item.id)} onDelete={() => deleteDebt(item.id)} />
                        ))
                    )}
                </View>
            </View>

            {/* Alacaklarım Column */}
            <View style={styles.column}>
                <View style={styles.columnHeader}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                        <View style={[styles.dot, { backgroundColor: COLORS.income }]} />
                        <Text style={styles.sectionTitle}>ALACAKLARIM</Text>
                    </View>
                    <TouchableOpacity onPress={() => setShowAdd({ type: 'RECEIVABLE' })} style={styles.addSmallBtn}>
                        <Text style={styles.addSmallBtnText}>+ Alacak Ekle</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.listCard}>
                    {recList.length === 0 ? renderEmpty('RECEIVABLE') : (
                        recList.map(item => (
                            <DebtItem key={item.id} item={item} onToggle={() => toggleDebtStatus(item.id)} onDelete={() => deleteDebt(item.id)} />
                        ))
                    )}
                </View>
            </View>
        </View>
      </ScrollView>

      {/* Add Modal Placeholder / Simple Form */}
      {showAdd.type && (
          <View style={styles.modalBackdrop}>
              <View style={styles.formCard}>
                  <Text style={styles.modalTitle}>{showAdd.type === 'DEBT' ? 'Yeni Borç Ekle' : 'Yeni Alacak Ekle'}</Text>
                  <TextInput 
                    style={styles.input} 
                    placeholder="Kişi / Kurum" 
                    placeholderTextColor="#555" 
                    value={person}
                    onChangeText={setPerson}
                  />
                  <TextInput 
                    style={styles.input} 
                    placeholder="Miktar" 
                    placeholderTextColor="#555" 
                    keyboardType="numeric"
                    value={amount}
                    onChangeText={setAmount}
                  />
                  <View style={styles.formActions}>
                      <TouchableOpacity onPress={() => setShowAdd({ type: null })} style={styles.cancelBtn}>
                          <Text style={styles.cancelBtnText}>İptal</Text>
                      </TouchableOpacity>
                      <TouchableOpacity onPress={handleAdd} style={styles.submitBtn}>
                          <Text style={styles.submitBtnText}>Kaydet</Text>
                      </TouchableOpacity>
                  </View>
              </View>
          </View>
      )}

    </SafeAreaView>
  );
}

function DebtItem({ item, onToggle, onDelete }: { item: any, onToggle: any, onDelete: any }) {
    const isOverdue = item.status === 'PENDING' && new Date(item.dueDate) < new Date();
    return (
        <View style={styles.debtItem}>
            <TouchableOpacity onPress={onToggle} style={[styles.checkBtn, item.status === 'PAID' && styles.checkBtnActive]}>
                {item.status === 'PAID' && <MaterialIcons name="check" size={14} color="#000" />}
            </TouchableOpacity>
            <View style={{ flex: 1 }}>
                <Text style={[styles.itemPerson, item.status === 'PAID' && styles.strike]}>{item.person}</Text>
                <Text style={styles.itemDate}>{new Date(item.dueDate).toLocaleDateString('tr-TR')}</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
                <Text style={[styles.itemAmount, { color: item.type === 'DEBT' ? COLORS.expense : COLORS.income }, item.status === 'PAID' && styles.strike]}>
                    {formatCurrency(item.amount)}
                </Text>
                {isOverdue && <Text style={styles.overdueLabel}>Vadesi Geçmiş</Text>}
            </View>
            <TouchableOpacity onPress={onDelete} style={styles.delBtn}>
                <MaterialIcons name="close" size={16} color="#444" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background, minHeight: '100%' },
  loadingBox: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: COLORS.background },
  content: { padding: 16, gap: 16, paddingBottom: 40 },
  webContent: { padding: 24 },
  
  statsRow: { flexDirection: "row", gap: 12 },
  statCard: { flex: 1, backgroundColor: "#0b0b0b", padding: 20, borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  statHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  statLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: "700" },
  statValue: { fontSize: 28, fontWeight: "900", letterSpacing: -0.5 },
  indicator: { width: 14, height: 14, borderRadius: 7 },
  
  overdueCard: { width: isWeb ? '32.5%' : '100%', marginBottom: 8 },
  
  mainGrid: { gap: 16 },
  mainGridWeb: { flexDirection: "row" },
  column: { flex: 1, gap: 12 },
  columnHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 4 },
  sectionTitle: { color: COLORS.textSecondary, fontSize: 11, fontWeight: "900", letterSpacing: 1 },
  dot: { width: 6, height: 6, borderRadius: 3 },
  
  addSmallBtn: { backgroundColor: 'rgba(255,255,255,0.03)', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  addSmallBtnText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '700' },

  listCard: { backgroundColor: "#0b0b0b", borderRadius: 16, overflow: 'hidden', minHeight: 200 },
  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16, paddingVertical: 60 },
  marble: { width: 32, height: 32, borderRadius: 16, opacity: 0.8 },
  emptyText: { color: COLORS.textMuted, fontSize: 13, fontWeight: '600' },

  debtItem: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.02)' },
  checkBtn: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, borderColor: '#333', alignItems: 'center', justifyContent: 'center' },
  checkBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  itemPerson: { color: COLORS.textPrimary, fontSize: 14, fontWeight: '700' },
  itemDate: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  itemAmount: { fontSize: 15, fontWeight: '900' },
  overdueLabel: { color: '#f59e0b', fontSize: 10, fontWeight: '900', marginTop: 2 },
  strike: { textDecorationLine: 'line-through', opacity: 0.5 },
  delBtn: { marginLeft: 8 },

  modalBackdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', zIndex: 1000 },
  formCard: { backgroundColor: COLORS.card, padding: 24, borderRadius: 24, width: '90%', maxWidth: 400, gap: 16, borderWidth: 1, borderColor: 'rgba(255,255,255,0.05)' },
  modalTitle: { color: COLORS.textPrimary, fontSize: 18, fontWeight: '800', marginBottom: 8 },
  input: { height: 50, backgroundColor: COLORS.background, borderRadius: 12, paddingHorizontal: 16, color: COLORS.textPrimary, fontSize: 14 },
  formActions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  cancelBtn: { flex: 1, height: 50, alignItems: 'center', justifyContent: 'center' },
  cancelBtnText: { color: COLORS.textMuted, fontWeight: '700' },
  submitBtn: { flex: 2, height: 50, backgroundColor: COLORS.primary, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  submitBtnText: { color: COLORS.textPrimary, fontWeight: '800' },
});
