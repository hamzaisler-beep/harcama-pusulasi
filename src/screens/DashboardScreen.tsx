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
import { format, subMonths, startOfMonth, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { store } from "../store";
import { auth } from "../services/firebase";
import { COLORS, RADII, Transaction } from "../theme/constants";
import { formatTRY } from "../utils/format";

const monthKey = (d: string) => {
  try {
    return format(d.includes("T") ? parseISO(d) : new Date(d), "yyyy-MM");
  } catch {
    return "";
  }
};

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

  const data = useMemo(() => {
    const txs = store.transactions;
    const now = new Date();
    const thisKey = format(now, "yyyy-MM");
    const lastKey = format(subMonths(now, 1), "yyyy-MM");

    let incThis = 0, expThis = 0, incLast = 0, expLast = 0, incAll = 0, expAll = 0;
    const catTotals: Record<string, number> = {};

    txs.forEach((t) => {
      const val = Math.abs(Number(t.amount) || 0);
      if (isNaN(val)) return;
      const k = monthKey(t.date);
      if (t.type === "income") {
        incAll += val;
        if (k === thisKey) incThis += val;
        if (k === lastKey) incLast += val;
      } else {
        expAll += val;
        if (k === thisKey) expThis += val;
        if (k === lastKey) expLast += val;
        const cat = t.category || "Diğer";
        catTotals[cat] = (catTotals[cat] || 0) + val;
      }
    });

    // Son 6 ay
    const monthly: { key: string; label: string; income: number; expense: number }[] = [];
    for (let i = 5; i >= 0; i--) {
      const d = startOfMonth(subMonths(now, i));
      monthly.push({ key: format(d, "yyyy-MM"), label: format(d, "MMM", { locale: tr }), income: 0, expense: 0 });
    }
    const mmap = new Map(monthly.map((m) => [m.key, m]));
    txs.forEach((t) => {
      const m = mmap.get(monthKey(t.date));
      if (!m) return;
      const val = Math.abs(Number(t.amount) || 0);
      if (t.type === "income") m.income += val;
      else m.expense += val;
    });

    // Kategori dağılımı (ilk 5 gider)
    const CAT_COLORS = [COLORS.expense, COLORS.info, COLORS.income, COLORS.warning, COLORS.accent2];
    const categories = Object.entries(catTotals)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5)
      .map((c, i) => ({ ...c, color: CAT_COLORS[i % CAT_COLORS.length] }));
    const expenseTotal = Object.values(catTotals).reduce((s, v) => s + v, 0);

    // Bu ay bütçe durumu
    const budgetStatus = store.budgets.map((b) => {
      const spent = txs
        .filter((t) => t.type === "expense" && t.category === b.category && monthKey(t.date) === thisKey)
        .reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0);
      return { label: b.category, current: spent, total: b.limit, color: spent > b.limit ? COLORS.expense : COLORS.primary };
    });

    // Toplam birikim = hedefler + yatırım değeri
    const goalsTotal = store.goals.reduce((s, g) => s + (Number(g.currentAmount) || 0), 0);
    const invValue = store.investments.reduce((s, inv) => s + (Number(inv.amount) || 0) * (Number(inv.currentPrice) || 0), 0);

    const pct = (cur: number, prev: number) => (prev > 0 ? Math.round(((cur - prev) / prev) * 100) : cur > 0 ? 100 : 0);

    return {
      income: incThis,
      expense: expThis,
      balance: incAll - expAll,
      savings: goalsTotal + invValue,
      incomeDelta: pct(incThis, incLast),
      expenseDelta: pct(expThis, expLast),
      monthly,
      categories,
      expenseTotal,
      budgetStatus,
      goalsCount: store.goals.length,
    };
  }, [store.transactions, store.budgets, store.goals, store.investments, tick]);

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
        default: return <DashboardMain data={data} transactions={store.transactions} />;
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

const DashboardMain = ({ data, transactions }: { data: any, transactions: Transaction[] }) => {
    const deltaText = (d: number) => (d === 0 ? "Değişim yok" : `${d > 0 ? "+" : ""}${d}% geçen ay`);
    return (
        <ScrollView style={styles.content} contentContainerStyle={styles.scrollInside}>
            {/* Top Stat Row */}
            <View style={styles.statRow}>
                <StatBox title="Bu Ay Gelir" value={data.income} color={COLORS.income} sub={deltaText(data.incomeDelta)} icon="payments" />
                <StatBox title="Bu Ay Gider" value={data.expense} color={COLORS.expense} sub={deltaText(data.expenseDelta)} icon="shopping-cart" />
                <StatBox title="Net Bakiye" value={data.balance} color={COLORS.warning} sub={data.balance >= 0 ? "Olumlu" : "Negatif"} icon="account-balance-wallet" />
                <StatBox title="Toplam Birikim" value={data.savings} color={COLORS.primary} sub={`${data.goalsCount} aktif hedef`} icon="savings" />
            </View>

            {/* Charts Row */}
            <View style={styles.chartsRow}>
                <View style={[styles.panel, { flex: 1 }]}>
                    <Text style={styles.panelTitle}>AYLIK GELİR / GİDER</Text>
                    <CustomBarChart monthly={data.monthly} />
                </View>
                <View style={[styles.panel, { flex: 0.8 }]}>
                    <Text style={styles.panelTitle}>KATEGORİ DAĞILIMI</Text>
                    <CustomDoughnut data={data.categories} total={data.expenseTotal} />
                </View>
            </View>

            {/* Bottom Panels */}
            <View style={styles.panelGrid}>
                <View style={[styles.panel, { flex: 1 }]}>
                    <Text style={styles.panelTitle}>SON İŞLEMLER</Text>
                    <View style={styles.txnList}>
                        {transactions.length === 0 ? (
                            <Text style={styles.emptyHint}>Henüz işlem yok.</Text>
                        ) : (
                            transactions.slice(0, 6).map((tx) => <TxnItem key={tx.id} tx={tx} />)
                        )}
                    </View>
                </View>

                <View style={[styles.panel, { flex: 0.8 }]}>
                    <Text style={styles.panelTitle}>BÜTÇE DURUMU (BU AY)</Text>
                    {data.budgetStatus.length === 0 ? (
                        <Text style={styles.emptyHint}>Bütçe tanımlanmadı. "Bütçe" sekmesinden ekleyebilirsiniz.</Text>
                    ) : (
                        data.budgetStatus.map((b: any) => (
                            <BudgetProgress key={b.label} label={b.label} current={b.current} total={b.total} color={b.color} />
                        ))
                    )}
                </View>
            </View>
        </ScrollView>
    );
};

// --- Custom Components (Cross-Platform Safe) ---

const CustomBarChart = ({ monthly }: any) => {
    const maxVal = Math.max(...monthly.map((m: any) => Math.max(m.income, m.expense)), 1);

    return (
        <View style={styles.barChartContainer}>
            <View style={styles.barChartDrawArea}>
                {monthly.map((m: any, i: number) => {
                    const isCurrent = i === monthly.length - 1;
                    const incH = (m.income / maxVal) * 100;
                    const expH = (m.expense / maxVal) * 100;

                    return (
                        <View key={m.key} style={styles.barGroup}>
                            <View style={styles.barsContainer}>
                                <View style={[styles.bar, { height: `${isNaN(incH) ? 0 : incH}%`, backgroundColor: COLORS.income, opacity: isCurrent ? 1 : 0.4 }]} />
                                <View style={[styles.bar, { height: `${isNaN(expH) ? 0 : expH}%`, backgroundColor: COLORS.expense, opacity: isCurrent ? 1 : 0.4 }]} />
                            </View>
                            <Text style={styles.barLabel}>{m.label}</Text>
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

const CustomDoughnut = ({ data, total }: any) => {
    if (!data || data.length === 0) {
        return (
            <View style={styles.doughnutContainer}>
                <Text style={styles.emptyHint}>Bu ay gider kaydı yok.</Text>
            </View>
        );
    }
    const sum = data.reduce((s: any, i: any) => s + i.value, 0) || 1;
    let startAngle = 0;

    return (
        <View style={styles.doughnutContainer}>
            <View style={styles.doughnutRelative}>
                <Svg viewBox="0 0 100 100" style={styles.svg}>
                    {data.map((item: any) => {
                        const percentage = (item.value / sum) * 100;
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
                    <Text style={styles.doughnutCenterText}>Toplam Gider</Text>
                    <Text style={styles.doughnutCenterSub}>{formatTRY(total)}</Text>
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
            <Text style={{ color: '#718096', fontSize: 11 }}>{formatTRY(current)} / {formatTRY(total)}</Text>
        </View>
        <View style={{ height: 6, backgroundColor: 'rgba(255,255,255,0.05)', borderRadius: 3, overflow: 'hidden' }}>
            <View style={{
                height: '100%',
                width: `${total > 0 ? Math.min((current/total)*100, 100) : 0}%`,
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
  emptyHint: { color: COLORS.textMuted, fontSize: 13, textAlign: "center", paddingVertical: 24, lineHeight: 19 },

  // Profile Modal Styles
  profileModalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.3)" },
  profileModalContent: { 
    position: 'absolute', 
    top: 70, 
    left: 12, 
    width: 280, 
    backgroundColor: "#1c1f2b", 
    borderRadius: 16, 
    padding: 20, 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    ...Platform.select({
        web: { boxShadow: "0px 10px 24px rgba(0,0,0,0.5)" },
        ios: { shadowColor: "#000", shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.5, shadowRadius: 20 },
        android: { elevation: 10 }
    })
  },
  profileModalHeader: { alignItems: "flex-start", marginBottom: 20, paddingBottom: 16, borderBottomWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  largeAvatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: "#78dcc8", alignItems: "center", justifyContent: "center", marginBottom: 12 },
  largeAvatarText: { fontSize: 16, fontWeight: "800", color: "#000" },
  modalUserName: { fontSize: 15, fontWeight: "700", color: "#fff", marginBottom: 2 },
  modalUserEmail: { fontSize: 11, color: COLORS.textMuted },
  modalMenu: { marginBottom: 20 },
  profileMenuItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12 },
  profileMenuLabel: { flex: 1, marginLeft: 12, color: COLORS.text, fontSize: 13, fontWeight: "600" },
  logoutBtn: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 12, borderTopWidth: 1, borderColor: "rgba(255,255,255,0.05)", marginTop: 4 },
  logoutText: { color: COLORS.expense, fontSize: 13, fontWeight: "700" },
});
