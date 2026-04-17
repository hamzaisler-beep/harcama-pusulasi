// src/screens/DashboardScreen.tsx
import React, { useState, useEffect, useMemo } from "react";
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Dimensions, 
  Platform,
  Modal,
  TouchableWithoutFeedback
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import Svg, { Circle, Rect } from "react-native-svg";
import { store } from "../store";
import { auth } from "../services/firebase";
import { COLORS, RADII, Transaction } from "../theme/constants";

// Import Placeholder Screens
import TransactionsScreen from "./TransactionsScreen";
import AccountsScreen from "./AccountsScreen";
import BudgetScreen from "./BudgetScreen";
import BillsScreen from "./BillsScreen";
import InvestmentsScreen from "./InvestmentsScreen";
import GoalsScreen from "./GoalsScreen";
import DebtsScreen from "./DebtsScreen";
import CurrencyScreen from "./CurrencyScreen";
import TaxScreen from "./TaxScreen";
import ReportsScreen from "./ReportsScreen";

const { width } = Dimensions.get("window");
const isWeb = Platform.OS === "web" || width > 1024;

export default function DashboardScreen() {
  const [tick, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);

  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    store.listeners.add(fn);
    return () => { store.listeners.delete(fn); };
  }, []);

  const handleLogout = () => {
    auth.signOut();
  };

  const stats = useMemo(() => {
    const income = store.transactions
        .filter(t => t.type === "income")
        .reduce((s, t) => s + Number(t.amount || 0), 0);
    const expense = store.transactions
        .filter(t => t.type === "expense")
        .reduce((s, t) => s + Math.abs(Number(t.amount || 0)), 0);
    const balance = income - expense;
    return { income, expense, balance, savings: 177500 }; 
  }, [store.transactions, tick]);

  const Sidebar = () => (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <TouchableOpacity style={styles.userCardTop} onPress={() => setIsProfileModalVisible(true)}>
            <View style={styles.avatar}>
                <Text style={{ color: "#000", fontWeight: "700" }}>
                  {(auth.currentUser?.displayName || auth.currentUser?.email || "K").substring(0, 2).toUpperCase()}
                </Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.userName} numberOfLines={1}>
                  {auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0] || "Kullanıcı"}
                </Text>
                <Text style={styles.settingsLinkText}>Hesap ve Profil</Text>
            </View>
            <MaterialIcons name="more-vert" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>
      <View style={styles.navSection}>
        <Text style={styles.navSectionTitle}>ANA MENÜ</Text>
        <SidebarItem icon="dashboard" label="Dashboard" target="Dashboard" />
        <SidebarItem icon="swap-vert" label="İşlemler" target="İşlemler" />
        <SidebarItem icon="account-balance" label="Hesaplar" target="Hesaplar" />
        <SidebarItem icon="pie-chart" label="Bütçe" target="Bütçe" />
        <SidebarItem icon="receipt" label="Faturalar" target="Faturalar" />
      </View>

      <View style={styles.navSection}>
        <Text style={styles.navSectionTitle}>YATIRIM & HEDEF</Text>
        <SidebarItem icon="trending-up" label="Yatırımlar" target="Yatırımlar" />
        <SidebarItem icon="flag" label="Hedefler" target="Hedefler" />
        <SidebarItem icon="handshake" label="Borç / Alacak" target="Borç / Alacak" />
        <SidebarItem icon="currency-exchange" label="Döviz & Kur" target="Döviz & Kur" />
        <SidebarItem icon="list-alt" label="Vergi" target="Vergi" />
      </View>

      <View style={styles.navSection}>
        <Text style={styles.navSectionTitle}>ANALİZ</Text>
        <SidebarItem icon="bar-chart" label="Raporlar" target="Raporlar" />
      </View>
    </View>
  );

  const SidebarItem = ({ icon, label, target }: any) => {
    const active = activeTab === target;
    return (
        <TouchableOpacity 
            onPress={() => setActiveTab(target)}
            style={[styles.navItem, active && styles.navItemActive]}
        >
            <MaterialIcons name={icon} size={20} color={active ? "#10b981" : COLORS.textSecondary} />
            <Text style={[styles.navItemLabel, active && styles.activeNavLabel]}>{label}</Text>
        </TouchableOpacity>
    );
  };

  const renderContent = () => {
    switch (activeTab) {
        case "İşlemler": return <TransactionsScreen />;
        case "Hesaplar": return <AccountsScreen />;
        case "Bütçe": return <BudgetScreen />;
        case "Faturalar": return <BillsScreen />;
        case "Yatırımlar": return <InvestmentsScreen />;
        case "Hedefler": return <GoalsScreen />;
        case "Borç / Alacak": return <DebtsScreen />;
        case "Döviz & Kur": return <CurrencyScreen />;
        case "Vergi": return <TaxScreen />;
        case "Raporlar": return <ReportsScreen />;
        default: return <DashboardMain stats={stats} transactions={store.transactions} />;
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        {isWeb && <Sidebar />}
        <View style={styles.mainContentContainer}>
            {renderContent()}
        </View>
      </View>

      {/* Profile Settings Modal */}
      <Modal visible={isProfileModalVisible} transparent animationType="fade">
          <View style={styles.profileModalOverlay}>
              <TouchableWithoutFeedback onPress={() => setIsProfileModalVisible(false)}>
                  <View style={StyleSheet.absoluteFill} />
              </TouchableWithoutFeedback>
              <View style={styles.profileModalContent}>
                  <View style={styles.profileModalHeader}>
                      <View style={styles.largeAvatar}>
                          <Text style={styles.largeAvatarText}>
                              {(auth.currentUser?.displayName || auth.currentUser?.email || "K").substring(0, 2).toUpperCase()}
                          </Text>
                      </View>
                      <Text style={styles.modalUserName}>{auth.currentUser?.displayName || auth.currentUser?.email?.split('@')[0]}</Text>
                      <Text style={styles.modalUserEmail}>{auth.currentUser?.email}</Text>
                  </View>

                  <View style={styles.modalMenu}>
                      <ProfileMenuItem icon="person-outline" label="Profil Bilgileri" onPress={() => {}} />
                      <ProfileMenuItem icon="lock-outline" label="Şifre Değiştir" onPress={() => {}} />
                      <ProfileMenuItem icon="camera-alt" label="Profil Fotoğrafı Ekle" onPress={() => {}} />
                      <ProfileMenuItem icon="notifications-none" label="Bildirim Ayarları" onPress={() => {}} />
                  </View>

                  <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                      <MaterialIcons name="logout" size={20} color={COLORS.expense} />
                      <Text style={styles.logoutText}>Çıkış Yap</Text>
                  </TouchableOpacity>
              </View>
          </View>
      </Modal>
    </SafeAreaView>
  );
}

const ProfileMenuItem = ({ icon, label, onPress }: any) => (
    <TouchableOpacity style={styles.profileMenuItem} onPress={onPress}>
        <MaterialIcons name={icon} size={22} color={COLORS.textSecondary} />
        <Text style={styles.profileMenuLabel}>{label}</Text>
        <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
    </TouchableOpacity>
);

const DashboardMain = ({ stats, transactions }: { stats: any, transactions: Transaction[] }) => {
    return (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollInside}>
            {/* Top Stat Row */}
            <View style={styles.statRow}>
                <StatBox title="Bu Ay Gelir" value={stats.income} color={COLORS.income} sub="+31% geçen ay" icon="payments" />
                <StatBox title="Bu Ay Gider" value={stats.expense} color={COLORS.expense} sub="+96% geçen ay" icon="shopping-cart" />
                <StatBox title="Net Bakiye" value={stats.balance} color={COLORS.warning} sub="Olumlu" icon="account-balance-wallet" />
                <StatBox title="Toplam Birikim" value={stats.savings} color={COLORS.primary} sub="4 aktif hedef" icon="savings" />
            </View>

            {/* Charts Row */}
            <View style={styles.chartsRow}>
                <View style={[styles.panel, { flex: 1 }]}>
                    <Text style={styles.panelTitle}>AYLIK GELİR / GİDER</Text>
                    <CustomBarChart income={stats.income} expense={stats.expense} />
                </View>
                <View style={[styles.panel, { flex: 0.8 }]}>
                    <Text style={styles.panelTitle}>KATEGORİ DAĞILIMI</Text>
                    <CustomDoughnut 
                        data={[
                            { label: "Market", value: 2800, color: COLORS.expense },
                            { label: "Giyim", value: 1800, color: COLORS.info },
                            { label: "Ulaşım", value: 1200, color: COLORS.income },
                            { label: "Faturalar", value: 680, color: COLORS.warning },
                            { label: "Restoran", value: 450, color: COLORS.accent2 },
                        ]} 
                    />
                </View>
            </View>

            {/* Bottom Panels */}
            <View style={styles.panelGrid}>
                <View style={[styles.panel, { flex: 1 }]}>
                    <Text style={styles.panelTitle}>SON İŞLEMLER</Text>
                    <View style={styles.txnList}>
                        {transactions.slice(0, 6).map((tx) => (
                            <TxnItem key={tx.id} tx={tx} />
                        ))}
                    </View>
                </View>

                <View style={[styles.panel, { flex: 0.8 }]}>
                    <Text style={styles.panelTitle}>BÜTÇE DURUMU</Text>
                    <BudgetProgress label="Market" current={2800} total={3000} color={COLORS.expense} />
                    <BudgetProgress label="Restoran" current={450} total={1500} color={COLORS.income} />
                    <BudgetProgress label="Ulaşım" current={1200} total={2000} color={COLORS.info} />
                    <BudgetProgress label="Eğlence" current={139} total={1000} color={COLORS.accent2} />
                    <BudgetProgress label="Giyim" current={1800} total={2000} color={COLORS.expense} />
                </View>
            </View>
        </ScrollView>
    );
};

// --- Custom Components (Cross-Platform Safe) ---

const CustomBarChart = ({ income, expense }: any) => {
    const months = ["Eylül", "Ekim", "Kasım", "Aralık", "Ocak", "Şubat"];
    const maxVal = Math.max(income, expense, 50000);

    return (
        <View style={styles.barChartContainer}>
            <View style={styles.barChartDrawArea}>
                {months.map((m, i) => {
                    const isCurrent = m === "Şubat";
                    const incH = i === 5 ? (income / maxVal) * 100 : (20 + Math.random() * 50);
                    const expH = i === 5 ? (expense / maxVal) * 100 : (10 + Math.random() * 40);
                    
                    return (
                        <View key={m} style={styles.barGroup}>
                            <View style={styles.barsContainer}>
                                <View style={[styles.bar, { height: `${incH}%`, backgroundColor: COLORS.income, opacity: isCurrent ? 1 : 0.3 }]} />
                                <View style={[styles.bar, { height: `${expH}%`, backgroundColor: COLORS.expense, opacity: isCurrent ? 1 : 0.3 }]} />
                            </View>
                            <Text style={styles.barLabel}>{m.substring(0, 3)}</Text>
                        </View>
                    );
                })}
            </View>
            <View style={styles.barLegend}>
                <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: COLORS.income }]} /><Text style={styles.legendText}>Gelir</Text></View>
                <View style={styles.legendItem}><View style={[styles.dot, { backgroundColor: COLORS.expense }]} /><Text style={styles.legendText}>Gider</Text></View>
            </View>
        </View>
    );
};

const CustomDoughnut = ({ data }: any) => {
    const total = data.reduce((s: any, i: any) => s + i.value, 0);
    let startAngle = 0;

    return (
        <View style={styles.doughnutContainer}>
            <View style={styles.doughnutRelative}>
                <Svg viewBox="0 0 100 100" style={styles.svg}>
                    {data.map((item: any, i: number) => {
                        const percentage = (item.value / total) * 100;
                        const dashArray = `${percentage} ${100 - percentage}`;
                        const dashOffset = -startAngle;
                        startAngle += percentage;

                        return (
                            <Circle
                                key={item.label}
                                cx="50" cy="50" r="40"
                                fill="transparent"
                                stroke={item.color}
                                strokeWidth="8"
                                strokeDasharray={dashArray}
                                strokeDashoffset={dashOffset}
                                rotation="-90"
                                origin="50, 50"
                            />
                        );
                    })}
                </Svg>
                <View style={styles.doughnutCenter}>
                    <Text style={styles.doughnutCenterText}>Faturalar</Text>
                    <Text style={styles.doughnutCenterSub}>₺680</Text>
                </View>
            </View>
            <View style={styles.doughnutLegend}>
                {data.map((item: any) => (
                    <View key={item.label} style={styles.legendItem}>
                        <View style={[styles.dot, { backgroundColor: item.color }]} />
                        <Text style={styles.legendText}>{item.label}</Text>
                    </View>
                ))}
            </View>
        </View>
    );
};

const StatBox = ({ title, value, color, sub, icon }: any) => (
    <View style={[styles.statBox, { borderTopColor: color }]}>
        <Text style={styles.statBoxTitle}>{title}</Text>
        <Text style={[styles.statBoxValue, { color: title === "Bu Ay Gider" ? COLORS.expense : color }]}>
            ₺{new Intl.NumberFormat("tr-TR").format(value)}
        </Text>
        <Text style={styles.statBoxSub}>{sub}</Text>
        <View style={styles.statBoxIcon}>
            <MaterialIcons name={icon} size={32} color={color} style={{ opacity: 0.15 }} />
        </View>
    </View>
);

const TxnItem = ({ tx }: { tx: Transaction }) => (
    <View style={styles.txRow}>
        <View style={styles.txIconBox}>
             <MaterialIcons name="receipt" size={20} color={COLORS.textSecondary} />
        </View>
        <View style={{ flex: 1 }}>
            <Text style={styles.txTitle}>{tx.description}</Text>
            <Text style={styles.txMeta}>{tx.date}</Text>
        </View>
        <Text style={[styles.txAmount, { color: tx.type === 'income' ? COLORS.income : COLORS.expense }]}>
            {tx.type === 'income' ? '+' : '-'}₺{new Intl.NumberFormat("tr-TR").format(tx.amount)}
        </Text>
    </View>
);

const BudgetProgress = ({ label, current, total, color }: any) => (
    <View style={styles.budgetRow}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 }}>
            <Text style={{ color: '#E2E8F0', fontSize: 13, fontWeight: '600' }}>{label}</Text>
            <Text style={{ color: '#718096', fontSize: 11 }}>₺{current} / ₺{total}</Text>
        </View>
        <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
            <View style={{ 
                height: '100%', 
                width: `${Math.min((current/total)*100, 100)}%`, 
                backgroundColor: color, 
                borderRadius: 3
            }} />
        </View>
    </View>
);

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, flexDirection: "row" },
  mainContentContainer: { flex: 1 },
  sidebar: { width: 260, backgroundColor: "#0b0d12", paddingVertical: 24, borderRightWidth: 1, borderColor: COLORS.border },
  sidebarHeader: { paddingHorizontal: 16, marginBottom: 32 },
  userCardTop: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#78dcc8", alignItems: "center", justifyContent: "center" },
  userName: { color: "#fff", fontSize: 14, fontWeight: "700" },
  settingsLink: { marginTop: 2 },
  settingsLinkText: { color: "#10b981", fontSize: 11, fontWeight: "600" },
  navSection: { marginBottom: 32 },
  navSectionTitle: { fontSize: 10, color: COLORS.textMuted, letterSpacing: 1.2, fontWeight: "700", marginBottom: 16, paddingHorizontal: 24 },
  navItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 24, marginBottom: 4, gap: 14 },
  navItemActive: { backgroundColor: "rgba(16, 185, 129, 0.08)", borderLeftWidth: 4, borderLeftColor: "#10b981" },
  navItemLabel: { color: COLORS.textSecondary, fontSize: 14, fontWeight: "600" },
  activeNavLabel: { color: "#10b981" },

  content: { flex: 1 },
  scrollInside: { padding: 32 },
  statRow: { flexDirection: "row", gap: 16, marginBottom: 24 },
  statBox: { flex: 1, backgroundColor: COLORS.card, borderRadius: 10, padding: 20, borderTopWidth: 3, position: "relative", minHeight: 120 },
  statBoxTitle: { fontSize: 12, color: COLORS.textMuted, fontWeight: "600", marginBottom: 10 },
  statBoxValue: { fontSize: 26, fontWeight: "800", marginBottom: 6, fontFamily: "monospace" },
  statBoxSub: { fontSize: 11, color: COLORS.textMuted },
  statBoxIcon: { position: "absolute", right: 16, bottom: 16 },

  chartsRow: { flexDirection: "row", gap: 16, marginBottom: 24 },
  panel: { backgroundColor: COLORS.card, borderRadius: 12, padding: 24, borderWidth: 1, borderColor: COLORS.border },
  panelTitle: { fontSize: 11, color: COLORS.textMuted, fontWeight: "700", letterSpacing: 1.2, marginBottom: 24 },

  panelGrid: { flexDirection: "row", gap: 16 },
  txnList: { gap: 1 },
  txRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  txIconBox: { width: 36, height: 36, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.03)", alignItems: "center", justifyContent: "center", marginRight: 12 },
  txTitle: { color: COLORS.text, fontSize: 14, fontWeight: "600" },
  txMeta: { fontSize: 11, color: COLORS.textMuted, marginTop: 2 },
  txAmount: { fontSize: 14, fontWeight: "700", fontFamily: "monospace" },

  barChartContainer: { height: 260, justifyContent: "space-between" },
  barChartDrawArea: { flex: 1, flexDirection: "row", alignItems: "flex-end", justifyContent: "space-around", paddingBottom: 10 },
  barGroup: { alignItems: "center", width: 40 },
  barsContainer: { flexDirection: "row", alignItems: "flex-end", gap: 4, height: "100%", width: "100%", justifyContent: "center" },
  bar: { width: 6, borderRadius: 3 },
  barLabel: { fontSize: 10, color: COLORS.textMuted, marginTop: 8, fontWeight: "600" },
  barLegend: { flexDirection: "row", justifyContent: "center", gap: 20 },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontSize: 11, color: COLORS.textSecondary, fontWeight: "500" },

  doughnutContainer: { minHeight: 260, alignItems: "center", justifyContent: "center" },
  doughnutRelative: { width: 140, height: 140, position: "relative" },
  svg: { width: 140, height: 140 },
  doughnutCenter: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, alignItems: "center", justifyContent: "center" },
  doughnutCenterText: { color: COLORS.text, fontSize: 12, fontWeight: "700" },
  doughnutCenterSub: { color: COLORS.textSecondary, fontSize: 11, marginTop: 2 },
  doughnutLegend: { flexDirection: "row", flexWrap: "wrap", justifyContent: "center", gap: 12, marginTop: 24 },

  budgetRow: { marginBottom: 20 },

  // Profile Modal Styles
  profileModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.8)", justifyContent: "center", alignItems: "flex-end", paddingRight: width > 1200 ? (width - 1200)/2 + 20 : 20 },
  profileModalContent: { width: 320, backgroundColor: "#1c1f2b", borderRadius: 20, padding: 24, borderWidth: 1, borderColor: COLORS.border, shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 },
  profileModalHeader: { alignItems: "center", marginBottom: 32 },
  largeAvatar: { width: 80, height: 80, borderRadius: 40, backgroundColor: "#78dcc8", alignItems: "center", justifyContent: "center", marginBottom: 16 },
  largeAvatarText: { fontSize: 24, fontWeight: "800", color: "#000" },
  modalUserName: { fontSize: 18, fontWeight: "700", color: "#fff", marginBottom: 4 },
  modalUserEmail: { fontSize: 13, color: COLORS.textMuted },
  modalMenu: { marginBottom: 32 },
  profileMenuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 14, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.03)" },
  profileMenuLabel: { flex: 1, marginLeft: 16, color: COLORS.text, fontSize: 14, fontWeight: "600" },
  logoutBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 16, borderRadius: 12, backgroundColor: "rgba(252, 129, 129, 0.1)", borderWidth: 1, borderColor: "rgba(252, 129, 129, 0.2)" },
  logoutText: { color: COLORS.expense, fontSize: 14, fontWeight: "700" },
});
