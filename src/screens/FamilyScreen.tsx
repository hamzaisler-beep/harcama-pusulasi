// src/screens/FamilyScreen.tsx
import React, { useState, useEffect, useMemo } from "react";
import { subDays } from "date-fns";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Share,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { LineChart } from "react-native-chart-kit";
import { COLORS } from "../types";
import { createFamily, joinFamily, getUserFamily, Family } from "../services/familyService";
import { useFamilyTransactions, useTransactions } from "../store/useStore";
import { calculateFamilyReport, TimePeriod } from "../utils/familyStats";
import { formatCurrency, formatDate } from "../utils/format";
import { seedFamilyTransactions } from "../utils/seedData";

const SCREEN_WIDTH = Dimensions.get("window").width;

export default function FamilyScreen() {
  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [view, setView] = useState<"options" | "create" | "join">("options");
  
  // Form states
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [period, setPeriod] = useState<TimePeriod>("thisMonth");

  const { familyTransactions } = useFamilyTransactions();
  const { clearAll } = useTransactions();

  useEffect(() => {
    loadFamily();
  }, []);

  const loadFamily = async () => {
    setLoading(true);
    try {
      const f = await getUserFamily();
      setFamily(f);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!familyName.trim()) return;
    setActionLoading(true);
    try {
      const res = await createFamily(familyName.trim());
      await loadFamily();
    } catch (e: any) {
      Alert.alert("Hata", e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setActionLoading(true);
    try {
      await joinFamily(inviteCode.trim());
      await loadFamily();
    } catch (e: any) {
      Alert.alert("Hata", e.message);
    } finally {
      setActionLoading(false);
    }
  };

  const shareCode = () => {
    if (!family) return;
    Share.share({
      message: `Harcama Pusulası aile grubumuza katıl! Davet Kodu: ${family.invitationCode}`,
    });
  };

  const stats = useMemo(() => {
    return calculateFamilyReport(familyTransactions, period);
  }, [familyTransactions, period]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.primary} size="large" />
      </View>
    );
  }

  // --- RENDERING ---

  const renderInitial = () => (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialIcons name="groups" size={80} color={COLORS.primary} />
        <Text style={styles.title}>Aile Alanı</Text>
        <Text style={styles.subtitle}>
          Bütçenizi ailenizle birlikte yönetin, harcamalarınızı şeffaf hale getirin.
        </Text>
      </View>

      <View style={styles.options}>
        <TouchableOpacity style={styles.optionBtn} onPress={() => setView("create")}>
          <MaterialIcons name="add-business" size={24} color="#fff" />
          <Text style={styles.optionBtnText}>Yeni Aile Grubu Kur</Text>
        </TouchableOpacity>

        <TouchableOpacity style={[styles.optionBtn, styles.secondaryBtn]} onPress={() => setView("join")}>
          <MaterialIcons name="group-add" size={24} color={COLORS.primary} />
          <Text style={[styles.optionBtnText, styles.secondaryBtnText]}>Bir Gruba Katıl</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderCreate = () => (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setView("options")} style={styles.backBtn}>
        <MaterialIcons name="arrow-back" size={28} color={COLORS.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.formTitle}>Aile Grubu Kur</Text>
      <TextInput
        style={styles.input}
        placeholder="Aile Adı (örn: İşler Ailesi)"
        value={familyName}
        onChangeText={setFamilyName}
        autoFocus
      />
      <TouchableOpacity 
        style={styles.submitBtn} 
        onPress={handleCreate}
        disabled={actionLoading}
      >
        {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Kur ve Başla</Text>}
      </TouchableOpacity>
    </View>
  );

  const renderJoin = () => (
    <View style={styles.container}>
      <TouchableOpacity onPress={() => setView("options")} style={styles.backBtn}>
        <MaterialIcons name="arrow-back" size={28} color={COLORS.textPrimary} />
      </TouchableOpacity>
      <Text style={styles.formTitle}>Gruba Katıl</Text>
      <TextInput
        style={styles.input}
        placeholder="Davet Kodu (örn: HP-XXXX)"
        value={inviteCode}
        onChangeText={setInviteCode}
        autoFocus
        autoCapitalize="characters"
      />
      <TouchableOpacity 
        style={styles.submitBtn} 
        onPress={handleJoin}
        disabled={actionLoading}
      >
        {actionLoading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Gruba Dahil Ol</Text>}
      </TouchableOpacity>
    </View>
  );

  const renderDashboard = () => (
    <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
      <View style={styles.familyHeader}>
        <View>
          <Text style={styles.familyName}>{family?.name}</Text>
          <Text style={styles.familySub}>{family?.members.length} Üye Etkin</Text>
        </View>
        <TouchableOpacity style={styles.codeBadge} onPress={shareCode}>
          <Text style={styles.codeText}>{family?.invitationCode}</Text>
          <MaterialIcons name="share" size={14} color={COLORS.primary} />
        </TouchableOpacity>
      </View>

      {/* Period Selector */}
      <View style={styles.periodRow}>
        {(['thisMonth', 'lastMonth', 'allTime'] as TimePeriod[]).map(p => (
           <TouchableOpacity 
            key={p} 
            style={[styles.periodBtn, period === p && styles.periodBtnActive]}
            onPress={() => setPeriod(p)}
           >
             <Text style={[styles.periodBtnText, period === p && styles.periodBtnTextActive]}>
                {p === 'thisMonth' ? 'Bu Ay' : p === 'lastMonth' ? 'Geçen Ay' : 'Tümü'}
             </Text>
           </TouchableOpacity>
        ))}
      </View>

      {/* Report Cards */}
      <View style={styles.summaryRow}>
        <View style={[styles.summaryCard, { backgroundColor: COLORS.income + "15" }]}>
          <Text style={[styles.summaryLabel, { color: COLORS.income }]}>Toplam Gelir</Text>
          <Text style={[styles.summaryValue, { color: COLORS.income }]}>{formatCurrency(stats.totalIncome)}</Text>
        </View>
        <View style={[styles.summaryCard, { backgroundColor: COLORS.expense + "15" }]}>
          <Text style={[styles.summaryLabel, { color: COLORS.expense }]}>Toplam Gider</Text>
          <Text style={[styles.summaryValue, { color: COLORS.expense }]}>{formatCurrency(stats.totalExpense)}</Text>
        </View>
      </View>

      {/* Member Breakdown */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Üye Bazlı Harcamalar</Text>
        {stats.memberStats.map(m => (
          <View key={m.userId} style={styles.memberRow}>
            <View style={styles.memberAvatar}>
              <Text style={styles.avatarText}>{m.userName.charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: "700", color: COLORS.textPrimary }}>{m.userName}</Text>
              <Text style={{ fontSize: 12, color: COLORS.textSecondary }}>{m.transactionCount} işlem</Text>
            </View>
            <View style={{ alignItems: "flex-end" }}>
              <Text style={{ fontWeight: "800", color: COLORS.expense }}>{formatCurrency(m.totalExpense)}</Text>
              <Text style={{ fontSize: 10, color: COLORS.textMuted }}>%{m.percentage.toFixed(0)}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Recent Activity */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Son Aile Hareketleri</Text>
        {familyTransactions.slice(0, 5).map(tx => (
          <View key={tx.id} style={{ flexDirection: "row", justifyContent: "space-between", paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#f0f0f0" }}>
             <View>
               <Text style={{ fontSize: 13, fontWeight: "600" }}>{tx.description}</Text>
               <Text style={{ fontSize: 11, color: COLORS.textMuted }}>{tx.userName} • {formatDate(tx.date)}</Text>
             </View>
             <Text style={{ fontWeight: "700", color: tx.type === 'income' ? COLORS.income : COLORS.expense }}>
               {tx.type === 'income' ? '+' : '-'}{formatCurrency(tx.amount)}
             </Text>
          </View>
        ))}
        {familyTransactions.length === 0 && <Text style={styles.emptyText}>Henüz işlem yok.</Text>}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.safe}>
      {family ? renderDashboard() : view === "create" ? renderCreate() : view === "join" ? renderJoin() : renderInitial()}
      
      {/* GLOBAL WIPE BUTTON (ALWAYS VISIBLE AT THE BOTTOM) */}
      <View style={styles.wipeContainer}>
          <TouchableOpacity 
            style={styles.wipeBtn} 
            onPress={async () => {
              Alert.alert(
                "VERİTABANINI SIFIRLA?", 
                "Tüm işlemleriniz ve hesaplarınız kalıcı olarak silinecektir. Emin misiniz?",
                [
                  { text: "Vazgeç", style: "cancel" },
                  { 
                    text: "SİL", 
                    style: "destructive", 
                    onPress: async () => {
                      setActionLoading(true);
                      try {
                        await clearAll();
                        Alert.alert("Başarılı", "Tüm veritabanı temizlendi.");
                      } catch (e: any) {
                        Alert.alert("Hata", e.message);
                      } finally {
                        setActionLoading(false);
                      }
                    } 
                  }
                ]
              );
            }}
          >
            <MaterialIcons name="delete-forever" size={20} color="#fff" />
            <Text style={styles.wipeBtnText}>TÜM VERİLERİ TEMİZLE</Text>
          </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  container: { flex: 1, padding: 24, justifyContent: "center" },
  scroll: { padding: 16, flex: 1 },
  header: { alignItems: "center", marginBottom: 32 },
  title: { fontSize: 26, fontWeight: "800", color: COLORS.textPrimary, marginTop: 16 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: "center", marginTop: 8, paddingHorizontal: 20 },
  options: { gap: 16 },
  optionBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", backgroundColor: COLORS.primary, padding: 18, borderRadius: 16, gap: 10 },
  secondaryBtn: { backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.primary },
  optionBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  secondaryBtnText: { color: COLORS.primary },
  backBtn: { marginBottom: 20 },
  formTitle: { fontSize: 24, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 8 },
  input: { backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border, borderRadius: 12, padding: 16, fontSize: 16, marginBottom: 20 },
  submitBtn: { backgroundColor: COLORS.primary, padding: 16, borderRadius: 12, alignItems: "center" },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  familyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16, paddingHorizontal: 4 },
  familyName: { fontSize: 24, fontWeight: "800", color: COLORS.textPrimary },
  familySub: { fontSize: 13, color: COLORS.textSecondary },
  codeBadge: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  codeText: { fontSize: 14, fontWeight: "800", color: COLORS.primary },
  periodRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 16 },
  periodBtn: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 20, backgroundColor: "#fff", borderWidth: 1, borderColor: COLORS.border },
  periodBtnActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  periodBtnText: { fontSize: 12, fontWeight: "600", color: COLORS.textSecondary },
  periodBtnTextActive: { color: "#fff" },
  summaryRow: { flexDirection: "row", gap: 12, marginBottom: 16 },
  summaryCard: { flex: 1, padding: 16, borderRadius: 16, gap: 8 },
  summaryLabel: { fontSize: 11, fontWeight: "700", textTransform: "uppercase" },
  summaryValue: { fontSize: 18, fontWeight: "800" },
  card: { backgroundColor: "#fff", borderRadius: 20, padding: 16, marginBottom: 16, shadowColor: "#000", shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 10, elevation: 3 },
  cardTitle: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary, marginBottom: 12 },
  memberRow: { flexDirection: "row", alignItems: "center", marginBottom: 16 },
  memberAvatar: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.primaryLight, alignItems: "center", justifyContent: "center", marginRight: 12 },
  avatarText: { color: COLORS.primary, fontWeight: "800", fontSize: 14 },
  emptyText: { textAlign: "center", color: COLORS.textMuted, marginTop: 20 },
  wipeContainer: { padding: 20, backgroundColor: COLORS.background, borderTopWidth: 1, borderTopColor: "#eee" },
  wipeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, backgroundColor: "#f43f5e", padding: 14, borderRadius: 12 },
  wipeBtnText: { color: "#fff", fontWeight: "800", fontSize: 13 },
});
