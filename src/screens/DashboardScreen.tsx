// src/screens/DashboardScreen.tsx
import React, { useState, useEffect, useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Platform 
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { store } from "../store";
import { COLORS } from "../theme/constants";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web" || width > 1024;

export default function DashboardScreen() {
  const [tick, setTick] = useState(0);

  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    store.listeners.add(fn);
    return () => { store.listeners.delete(fn); };
  }, []);

  const stats = useMemo(() => {
    const income = store.transactions
        .filter(t => t.type === "income")
        .reduce((s, t) => s + Number(t.amount || 0), 0);
    const expense = store.transactions
        .filter(t => t.type === "expense")
        .reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0);
    return { income, expense, balance: income - expense };
  }, [store.transactions]);

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.header}>
            <View>
                <Text style={styles.greeting}>Hoş Geldin 👋</Text>
                <Text style={styles.subGreeting}>Finansal durumun bugun harika.</Text>
            </View>
            <TouchableOpacity style={styles.profileBtn}>
                <MaterialIcons name="person-outline" size={24} color="#fff" />
            </TouchableOpacity>
        </View>

        {/* Global Balance Card (Glassmorphism inspired) */}
        <View style={styles.balanceCard}>
            <Text style={styles.balanceLabel}>TOPLAM VARLIK</Text>
            <Text style={styles.balanceValue}>
                {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(stats.balance)}
            </Text>
            
            <View style={styles.statsRow}>
                <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: COLORS.income + "20" }]}>
                        <MaterialIcons name="north-east" size={14} color={COLORS.income} />
                    </View>
                    <View>
                        <Text style={styles.statLabel}>Gelir</Text>
                        <Text style={[styles.statValue, { color: COLORS.income }]}>
                            {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(stats.income)}
                        </Text>
                    </View>
                </View>
                <View style={styles.statItem}>
                    <View style={[styles.statIcon, { backgroundColor: COLORS.expense + "20" }]}>
                        <MaterialIcons name="south-west" size={14} color={COLORS.expense} />
                    </View>
                    <View>
                        <Text style={styles.statLabel}>Gider</Text>
                        <Text style={[styles.statValue, { color: COLORS.expense }]}>
                            {new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(stats.expense)}
                        </Text>
                    </View>
                </View>
            </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.section}>
            <Text style={styles.sectionTitle}>Hızlı İşlemler</Text>
            <View style={styles.actionRow}>
                {[
                    { id: 'add', icon: 'add', label: 'Ekle', color: COLORS.primary },
                    { id: 'transfer', icon: 'swap-horiz', label: 'Transfer', color: COLORS.accent },
                    { id: 'savings', icon: 'savings', label: 'Birikim', color: COLORS.secondary },
                    { id: 'more', icon: 'more-horiz', label: 'Daha', color: COLORS.cardSecondary },
                ].map(item => (
                    <TouchableOpacity key={item.id} style={styles.actionItem}>
                        <View style={[styles.actionIcon, { backgroundColor: item.color + "20" }]}>
                            <MaterialIcons name={item.icon as any} size={24} color={item.color} />
                        </View>
                        <Text style={styles.actionLabel}>{item.label}</Text>
                    </TouchableOpacity>
                ))}
            </View>
        </View>

        {/* Recent Transactions */}
        <View style={styles.section}>
            <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>Son İşlemler</Text>
                <TouchableOpacity><Text style={styles.seeAll}>Tümü</Text></TouchableOpacity>
            </View>
            {store.transactions.length === 0 ? (
                <View style={styles.emptyCard}>
                    <MaterialIcons name="history" size={40} color={COLORS.textMuted} />
                    <Text style={styles.emptyText}>Henüz işlem bulunmuyor.</Text>
                </View>
            ) : (
                store.transactions.slice(0, 5).map(tx => (
                    <View key={tx.id} style={styles.txRow}>
                        <View style={styles.txIconBox}>
                            <MaterialIcons 
                                name={tx.type === "income" ? "arrow-upward" : "shopping-bag"} 
                                size={20} 
                                color={tx.type === "income" ? COLORS.income : COLORS.text} 
                            />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.txDesc}>{tx.description}</Text>
                            <Text style={styles.txMeta}>{tx.category} • {tx.date}</Text>
                        </View>
                        <Text style={[styles.txAmount, { color: tx.type === "income" ? COLORS.income : COLORS.text }]}>
                            {tx.type === "income" ? "+" : "-"}{new Intl.NumberFormat("tr-TR", { style: "currency", currency: "TRY" }).format(tx.amount)}
                        </Text>
                    </View>
                ))
            )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 100 },
  header: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 30 },
  greeting: { fontSize: 24, fontWeight: "800", color: "#fff" },
  subGreeting: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  profileBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border },
  balanceCard: { backgroundColor: COLORS.card, padding: 24, borderRadius: 32, borderWidth: 1, borderColor: COLORS.border, marginBottom: 30 },
  balanceLabel: { fontSize: 11, color: COLORS.textMuted, letterSpacing: 1.5, fontWeight: "700" },
  balanceValue: { fontSize: 36, fontWeight: "900", color: "#fff", marginTop: 8 },
  statsRow: { flexDirection: "row", marginTop: 24, gap: 20 },
  statItem: { flex: 1, flexDirection: "row", alignItems: "center", gap: 12 },
  statIcon: { width: 32, height: 32, borderRadius: 10, alignItems: "center", justifyContent: "center" },
  statLabel: { fontSize: 10, color: COLORS.textMuted, fontWeight: "700" },
  statValue: { fontSize: 14, fontWeight: "800" },
  section: { marginBottom: 30 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#fff" },
  seeAll: { color: COLORS.primary, fontSize: 13, fontWeight: "700" },
  actionRow: { flexDirection: "row", justifyContent: "space-between" },
  actionItem: { alignItems: "center", gap: 8 },
  actionIcon: { width: 60, height: 60, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  actionLabel: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600" },
  txRow: { flexDirection: "row", alignItems: "center", gap: 16, marginBottom: 16, backgroundColor: COLORS.card + "50", padding: 12, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  txIconBox: { width: 48, height: 48, borderRadius: 16, backgroundColor: COLORS.cardSecondary, alignItems: "center", justifyContent: "center" },
  txDesc: { fontSize: 15, fontWeight: "700", color: "#fff" },
  txMeta: { fontSize: 12, color: COLORS.textMuted, marginTop: 2 },
  txAmount: { fontSize: 16, fontWeight: "800" },
  emptyCard: { padding: 40, alignItems: "center", gap: 16, backgroundColor: COLORS.card + "30", borderRadius: 24, borderStyle: "dashed", borderWidth: 2, borderColor: COLORS.border },
  emptyText: { color: COLORS.textMuted, fontSize: 14 },
});
