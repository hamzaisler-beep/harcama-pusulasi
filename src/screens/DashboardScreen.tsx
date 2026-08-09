// src/screens/DashboardScreen.tsx
import React, { useState, useEffect, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Modal, TouchableWithoutFeedback, TextInput, ActivityIndicator,
  useWindowDimensions, Platform,
} from "react-native";
import {
  updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider,
} from "firebase/auth";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import Svg, { Circle, Line, Polyline, Text as SvgText } from "react-native-svg";
import { format, subMonths, startOfMonth, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { store } from "../store";
import { auth } from "../services/firebase";
import { COLORS, MONO, Transaction } from "../theme/constants";
import { formatTRY } from "../utils/format";
import Sidebar from "../components/Sidebar";

import TransactionsScreen from "./TransactionsScreen";
import AccountsScreen from "./AccountsScreen";
import BudgetScreen from "./BudgetScreen";
import BillsScreen from "./BillsScreen";
import InvestmentsScreen from "./InvestmentsScreen";
import GoalsScreen from "./GoalsScreen";
import DebtsScreen from "./DebtsScreen";
import ReportsScreen from "./ReportsScreen";
import SettingsScreen from "./SettingsScreen";
import FamilyScreen from "./FamilyScreen";

const monthKey = (d: string) => {
  try { return format(d.includes("T") ? parseISO(d) : new Date(d), "yyyy-MM"); }
  catch { return ""; }
};

const BOTTOM_TABS = [
  { icon: "dashboard", label: "Panel", target: "Dashboard" },
  { icon: "swap-vert", label: "İşlemler", target: "İşlemler" },
  { icon: "account-balance", label: "Hesaplar", target: "Hesaplar" },
  { icon: "pie-chart", label: "Bütçe", target: "Bütçe" },
  { icon: "menu", label: "Menü", target: "__menu__" },
];

export default function DashboardScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [tick, setTick] = useState(0);
  const [activeTab, setActiveTab] = useState("Dashboard");
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isProfileModalVisible, setIsProfileModalVisible] = useState(false);
  const [profileView, setProfileView] = useState<"menu" | "name" | "password">("menu");
  const [nameInput, setNameInput] = useState("");
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [profileBusy, setProfileBusy] = useState(false);
  const [profileError, setProfileError] = useState("");
  const [profileOk, setProfileOk] = useState("");

  useEffect(() => {
    const fn = () => setTick(t => t + 1);
    store.listeners.add(fn);
    return () => { store.listeners.delete(fn); };
  }, []);

  const handleLogout = () => auth.signOut();

  const openProfile = () => {
    setProfileView("menu"); setProfileError(""); setProfileOk(""); setIsProfileModalVisible(true);
  };
  const goProfileView = (v: "menu" | "name" | "password") => {
    setProfileError(""); setProfileOk("");
    if (v === "name") setNameInput(auth.currentUser?.displayName || "");
    if (v === "password") { setCurrentPw(""); setNewPw(""); setNewPw2(""); }
    setProfileView(v);
  };
  const handleSaveName = async () => {
    const user = auth.currentUser; if (!user || !nameInput.trim()) return;
    setProfileBusy(true); setProfileError("");
    try {
      await updateProfile(user, { displayName: nameInput.trim() });
      setProfileOk("Adınız güncellendi."); setTick(t => t + 1); setProfileView("menu");
    } catch (e: any) { setProfileError(authErrorText(e?.code)); }
    finally { setProfileBusy(false); }
  };
  const handleChangePassword = async () => {
    const user = auth.currentUser; if (!user?.email) return;
    if (newPw.length < 6) { setProfileError("Yeni şifre en az 6 karakter olmalı."); return; }
    if (newPw !== newPw2) { setProfileError("Şifreler eşleşmiyor."); return; }
    setProfileBusy(true); setProfileError("");
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      setProfileOk("Şifreniz değiştirildi."); setProfileView("menu");
    } catch (e: any) { setProfileError(authErrorText(e?.code)); }
    finally { setProfileBusy(false); }
  };

  const data = useMemo(() => {
    const txs = store.transactions;
    const now = new Date();
    const thisKey = format(now, "yyyy-MM");

    let incThis = 0, expThis = 0;
    const catTotals: Record<string, number> = {};

    txs.forEach((t) => {
      const val = Math.abs(Number(t.amount) || 0);
      if (isNaN(val)) return;
      const k = monthKey(t.date);
      if (t.type === "income") { if (k === thisKey) incThis += val; }
      else {
        if (k === thisKey) expThis += val;
        const cat = t.category || "Diğer";
        catTotals[cat] = (catTotals[cat] || 0) + val;
      }
    });

    const netVarlik = store.accounts.reduce((s, a) => s + (Number(a.balance) || 0), 0);
    const CAT_COLORS = [COLORS.expense, COLORS.info, COLORS.income, COLORS.warning, COLORS.accent2, COLORS.primary];
    const categories = Object.entries(catTotals)
      .map(([label, value]) => ({ label, value }))
      .sort((a, b) => b.value - a.value).slice(0, 6)
      .map((c, i) => ({ ...c, color: CAT_COLORS[i % CAT_COLORS.length] }));
    const expenseTotal = Object.values(catTotals).reduce((s, v) => s + v, 0);

    const budgetStatus = store.budgets.map((b) => {
      const spent = txs
        .filter((t) => t.type === "expense" && t.category === b.category && monthKey(t.date) === thisKey)
        .reduce((s, t) => s + Math.abs(Number(t.amount) || 0), 0);
      return { label: b.category, current: spent, total: b.limit, over: spent > b.limit };
    });

    return { incThis, expThis, netVarlik, netThis: incThis - expThis, categories, expenseTotal, budgetStatus };
  }, [store.transactions, store.accounts, store.budgets, tick]);

  const handleSelect = (target: string) => {
    if (target === "__menu__") { setDrawerOpen(true); return; }
    setActiveTab(target);
    setDrawerOpen(false);
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
      case "Raporlar": return <ReportsScreen />;
      case "Aile": return <FamilyScreen />;
      case "Ayarlar": return <SettingsScreen onLogout={handleLogout} />;
      default: return <DashboardMain data={data} transactions={store.transactions} accounts={store.accounts} isDesktop={isDesktop} />;
    }
  };

  const screenTitle = activeTab === "Dashboard" ? "Panel" : activeTab;
  const initials = (auth.currentUser?.displayName || auth.currentUser?.email || "K").substring(0, 2).toUpperCase();

  return (
    <SafeAreaView style={s.safe}>
      {/* Demo Banner */}
      <View style={s.demoBanner}>
        <Text style={s.demoText}>🚀 Demo modundasınız — değişiklikler kaydedilmez.</Text>
        <TouchableOpacity style={s.registerBtn}>
          <Text style={s.registerBtnText}>Ücretsiz Kayıt Ol</Text>
        </TouchableOpacity>
      </View>

      <View style={s.body}>
        {isDesktop && (
          <Sidebar activeTab={activeTab} onSelect={handleSelect} onProfilePress={openProfile} />
        )}
        <View style={s.main}>
          {/* Top bar */}
          <View style={s.topBar}>
            {!isDesktop && (
              <TouchableOpacity onPress={() => setDrawerOpen(true)} style={s.menuBtn}>
                <MaterialIcons name="menu" size={22} color={COLORS.text} />
              </TouchableOpacity>
            )}
            <Text style={s.topBarTitle}>{screenTitle}</Text>
            <View style={{ flex: 1 }} />
            <TouchableOpacity style={s.addBtn}>
              <MaterialIcons name="add" size={16} color="#000" />
              <Text style={s.addBtnText}>+ İşlem</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.avatarBtn} onPress={openProfile}>
              <Text style={s.avatarBtnText}>{initials.charAt(0)}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={openProfile}>
              <Text style={s.demoLabel}>Demo</Text>
            </TouchableOpacity>
          </View>

          {renderContent()}
        </View>
      </View>

      {/* Mobile Bottom Tabs */}
      {!isDesktop && (
        <View style={s.bottomTabs}>
          {BOTTOM_TABS.map((tab) => {
            const active = activeTab === tab.target;
            return (
              <TouchableOpacity key={tab.target} style={s.tabItem} onPress={() => handleSelect(tab.target)}>
                <MaterialIcons name={tab.icon as any} size={22} color={active ? COLORS.primary : COLORS.textMuted} />
                <Text style={[s.tabLabel, active && { color: COLORS.primary }]}>{tab.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}

      {/* Mobile Drawer */}
      {!isDesktop && (
        <Modal visible={drawerOpen} transparent animationType="slide" onRequestClose={() => setDrawerOpen(false)}>
          <View style={s.drawerOverlay}>
            <View style={s.drawerPanel}>
              <Sidebar activeTab={activeTab} onSelect={handleSelect} onProfilePress={() => { setDrawerOpen(false); openProfile(); }} />
            </View>
            <TouchableWithoutFeedback onPress={() => setDrawerOpen(false)}>
              <View style={s.drawerBackdrop} />
            </TouchableWithoutFeedback>
          </View>
        </Modal>
      )}

      {/* Profile Modal */}
      <Modal visible={isProfileModalVisible} transparent animationType="fade">
        <View style={s.modalOverlay}>
          <TouchableWithoutFeedback onPress={() => setIsProfileModalVisible(false)}>
            <View style={StyleSheet.absoluteFill} />
          </TouchableWithoutFeedback>
          <View style={s.modalContent}>
            <View style={s.modalHeader}>
              <View style={s.modalAvatar}>
                <Text style={s.modalAvatarText}>{initials}</Text>
              </View>
              <Text style={s.modalName}>{auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0]}</Text>
              <Text style={s.modalEmail}>{auth.currentUser?.email}</Text>
            </View>
            {!!profileOk && <Text style={s.okText}>{profileOk}</Text>}
            {!!profileError && <Text style={s.errText}>{profileError}</Text>}
            {profileView === "menu" && (
              <>
                <TouchableOpacity style={s.menuRow} onPress={() => goProfileView("name")}>
                  <MaterialIcons name="person-outline" size={20} color={COLORS.textSecondary} />
                  <Text style={s.menuRowLabel}>Profil Bilgileri</Text>
                  <MaterialIcons name="chevron-right" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity style={s.menuRow} onPress={() => goProfileView("password")}>
                  <MaterialIcons name="lock-outline" size={20} color={COLORS.textSecondary} />
                  <Text style={s.menuRowLabel}>Şifre Değiştir</Text>
                  <MaterialIcons name="chevron-right" size={18} color={COLORS.textMuted} />
                </TouchableOpacity>
                <TouchableOpacity style={s.logoutRow} onPress={handleLogout}>
                  <MaterialIcons name="logout" size={18} color={COLORS.expense} />
                  <Text style={s.logoutText}>Çıkış Yap</Text>
                </TouchableOpacity>
              </>
            )}
            {profileView === "name" && (
              <View>
                <Text style={s.fieldLabel}>Görünen ad</Text>
                <TextInput style={s.fieldInput} value={nameInput} onChangeText={setNameInput} placeholder="Adınız" placeholderTextColor={COLORS.textMuted} autoFocus />
                <View style={s.btnRow}>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => goProfileView("menu")}><Text style={s.cancelText}>Vazgeç</Text></TouchableOpacity>
                  <TouchableOpacity style={s.saveBtn} onPress={handleSaveName} disabled={profileBusy}>
                    {profileBusy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveText}>Kaydet</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}
            {profileView === "password" && (
              <View>
                <Text style={s.fieldLabel}>Mevcut şifre</Text>
                <TextInput style={s.fieldInput} value={currentPw} onChangeText={setCurrentPw} secureTextEntry placeholder="••••••" placeholderTextColor={COLORS.textMuted} />
                <Text style={s.fieldLabel}>Yeni şifre</Text>
                <TextInput style={s.fieldInput} value={newPw} onChangeText={setNewPw} secureTextEntry placeholder="En az 6 karakter" placeholderTextColor={COLORS.textMuted} />
                <Text style={s.fieldLabel}>Yeni şifre (tekrar)</Text>
                <TextInput style={s.fieldInput} value={newPw2} onChangeText={setNewPw2} secureTextEntry placeholder="••••••" placeholderTextColor={COLORS.textMuted} />
                <View style={s.btnRow}>
                  <TouchableOpacity style={s.cancelBtn} onPress={() => goProfileView("menu")}><Text style={s.cancelText}>Vazgeç</Text></TouchableOpacity>
                  <TouchableOpacity style={s.saveBtn} onPress={handleChangePassword} disabled={profileBusy}>
                    {profileBusy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.saveText}>Değiştir</Text>}
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const authErrorText = (code?: string) => {
  switch (code) {
    case "auth/wrong-password": case "auth/invalid-credential": return "Mevcut şifre hatalı.";
    case "auth/weak-password": return "Şifre çok zayıf (min 6 karakter).";
    case "auth/requires-recent-login": return "Güvenlik için çıkış yapıp tekrar giriş yapın.";
    case "auth/too-many-requests": return "Çok fazla deneme, biraz sonra tekrar deneyin.";
    default: return "İşlem tamamlanamadı.";
  }
};

// ─── Dashboard Main ─────────────────────────────────────────────────────────
const DashboardMain = ({ data, transactions, accounts, isDesktop }: any) => {
  const col = !isDesktop;
  return (
    <ScrollView style={s.content} contentContainerStyle={[s.scroll, !isDesktop && { padding: 16, paddingBottom: 80 }]}>
      {/* 4 KPI Cards */}
      <View style={[s.kpiRow, col && { flexDirection: "column" }]}>
        <KpiCard title="Net Varlık" value={data.netVarlik} sub="Tüm hesaplar" icon="💎" color={COLORS.info} />
        <KpiCard title="Bu Ay Gelir" value={data.incThis} sub="Bu ay" icon="📥" color={COLORS.income} />
        <KpiCard title="Bu Ay Gider" value={data.expThis} sub="Bu ay" icon="📤" color={COLORS.expense} />
        <KpiCard title="Bu Ay Net" value={data.netThis} sub="Gelir - Gider" icon="📋" color={data.netThis >= 0 ? COLORS.income : COLORS.expense} />
      </View>

      {/* Charts Row */}
      <View style={[s.chartsRow, col && { flexDirection: "column" }]}>
        <View style={[s.panel, { flex: 1.2 }, col && s.panelFull]}>
          <View style={s.panelHeader}>
            <Text style={s.panelTitle}>Gider Dağılımı</Text>
            <Text style={s.panelSub}>{format(new Date(), "MMM yyyy", { locale: tr })}</Text>
          </View>
          <DonutChart data={data.categories} total={data.expenseTotal} />
        </View>
        <View style={[s.panel, { flex: 1 }, col && s.panelFull]}>
          <View style={s.panelHeader}>
            <Text style={s.panelTitle}>Bütçe Durumu</Text>
            <TouchableOpacity><Text style={s.linkText}>Tümü →</Text></TouchableOpacity>
          </View>
          {data.budgetStatus.length === 0 ? (
            <Text style={s.empty}>Bütçe tanımlanmadı.</Text>
          ) : (
            data.budgetStatus.map((b: any) => (
              <BudgetBar key={b.label} label={b.label} current={b.current} total={b.total} over={b.over} />
            ))
          )}
        </View>
      </View>

      {/* Bottom Row */}
      <View style={[s.chartsRow, col && { flexDirection: "column" }]}>
        <View style={[s.panel, { flex: 1.2 }, col && s.panelFull]}>
          <View style={s.panelHeader}>
            <Text style={s.panelTitle}>Son İşlemler</Text>
            <TouchableOpacity><Text style={s.linkText}>Tümü →</Text></TouchableOpacity>
          </View>
          {transactions.length === 0 ? (
            <Text style={s.empty}>Henüz işlem yok.</Text>
          ) : (
            transactions.slice(0, 6).map((tx: Transaction) => <TxRow key={tx.id} tx={tx} />)
          )}
        </View>
        <View style={[s.panel, { flex: 1 }, col && s.panelFull]}>
          <View style={s.panelHeader}>
            <Text style={s.panelTitle}>Hesaplar</Text>
            <TouchableOpacity><Text style={s.linkText}>Yönet →</Text></TouchableOpacity>
          </View>
          {accounts.length === 0 ? (
            <Text style={s.empty}>Hesap eklenmedi.</Text>
          ) : (
            accounts.map((acc: any) => <AccountRow key={acc.id} acc={acc} />)
          )}
        </View>
      </View>
    </ScrollView>
  );
};

const KpiCard = ({ title, value, sub, icon, color }: any) => (
  <View style={[s.kpiCard, { flex: 1 }]}>
    <View style={s.kpiTop}>
      <Text style={s.kpiTitle}>{title}</Text>
      <Text style={s.kpiIcon}>{icon}</Text>
    </View>
    <Text style={[s.kpiValue, { color }]}>{formatTRY(value)}</Text>
    <Text style={s.kpiSub}>{sub}</Text>
  </View>
);

const DonutChart = ({ data, total }: any) => {
  if (!data || data.length === 0) return <View style={s.donutWrap}><Text style={s.empty}>Gider kaydı yok.</Text></View>;
  const sum = data.reduce((s: number, i: any) => s + i.value, 0) || 1;
  let startAngle = 0;
  return (
    <View style={s.donutWrap}>
      <View style={s.donutRow}>
        <View style={s.donutCircle}>
          <Svg viewBox="0 0 100 100" style={{ width: 120, height: 120 }}>
            {data.map((item: any) => {
              const pct = (item.value / sum) * 100;
              const dash = `${pct} ${100 - pct}`;
              const offset = -startAngle;
              startAngle += pct;
              return (
                <Circle key={item.label} cx="50" cy="50" r="40" fill="transparent"
                  stroke={item.color} strokeWidth="10" strokeDasharray={dash}
                  strokeDashoffset={offset} rotation="-90" origin="50, 50" />
              );
            })}
          </Svg>
          <View style={s.donutCenter}>
            <Text style={s.donutTotal}>{formatTRY(total)}</Text>
          </View>
        </View>
        <View style={s.donutLegend}>
          {data.map((item: any) => (
            <View key={item.label} style={s.legendRow}>
              <View style={[s.dot, { backgroundColor: item.color }]} />
              <Text style={s.legendText}>{item.label}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
};

const BudgetBar = ({ label, current, total, over }: any) => {
  const pct = total > 0 ? Math.min((current / total) * 100, 100) : 0;
  return (
    <View style={s.budgetRow}>
      <View style={s.budgetTopRow}>
        <Text style={s.budgetLabel}>{label}</Text>
        <Text style={[s.budgetAmt, over && { color: COLORS.expense }]}>{formatTRY(current)} / {formatTRY(total)}</Text>
      </View>
      <View style={s.barTrack}>
        <View style={[s.barFill, { width: `${pct}%` as any, backgroundColor: over ? COLORS.expense : COLORS.primary }]} />
      </View>
    </View>
  );
};

const CATEGORY_ICONS: Record<string, string> = {
  "Maaş": "payments", "Market": "shopping-cart", "Faturalar": "bolt", "Restoran": "restaurant",
  "Ulaşım": "directions-car", "Eğlence": "videogame-asset", "Sağlık": "fitness-center",
  "Giyim": "checkroom", "Freelance": "laptop", "Kira Geliri": "home", "Diğer": "category",
};

const TxRow = ({ tx }: { tx: Transaction }) => (
  <View style={s.txRow}>
    <View style={s.txIcon}>
      <MaterialIcons name={(CATEGORY_ICONS[tx.category] || "receipt") as any} size={18} color={COLORS.textSecondary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={s.txTitle} numberOfLines={1}>{tx.description}</Text>
      <Text style={s.txMeta}>{tx.category} · {tx.date}</Text>
    </View>
    <Text style={[s.txAmt, { color: tx.type === "income" ? COLORS.income : COLORS.expense }]}>
      {tx.type === "income" ? "+" : "-"}{formatTRY(tx.amount)}
    </Text>
  </View>
);

const ACC_ICONS: Record<string, any> = { BANK: "account-balance", CASH: "payments", CARD: "credit-card" };
const AccountRow = ({ acc }: { acc: any }) => (
  <View style={s.accRow}>
    <View style={s.accIcon}>
      <MaterialIcons name={ACC_ICONS[acc.type] || "account-balance"} size={18} color={COLORS.textSecondary} />
    </View>
    <View style={{ flex: 1 }}>
      <Text style={s.accName}>{acc.name}</Text>
      <Text style={s.accType}>{acc.type === "BANK" ? "Banka" : acc.type === "CASH" ? "Nakit" : "Kredi Kartı"}</Text>
    </View>
    <Text style={[s.accAmt, { color: acc.balance < 0 ? COLORS.expense : COLORS.text }]}>
      {acc.balance < 0 ? "-" : ""}{formatTRY(Math.abs(acc.balance))}
    </Text>
  </View>
);

// ─── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  demoBanner: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    paddingVertical: 8, paddingHorizontal: 16, gap: 12,
    backgroundColor: "#6C63FF",
  },
  demoText: { color: "rgba(255,255,255,0.85)", fontSize: 12 },
  registerBtn: { backgroundColor: "#fff", borderRadius: 6, paddingHorizontal: 12, paddingVertical: 4 },
  registerBtnText: { color: "#000", fontWeight: "700", fontSize: 12 },

  body: { flex: 1, flexDirection: "row" },
  main: { flex: 1 },

  topBar: {
    flexDirection: "row", alignItems: "center", gap: 10,
    paddingHorizontal: 20, height: 56,
    borderBottomWidth: 1, borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  menuBtn: { padding: 4 },
  topBarTitle: { color: "#fff", fontSize: 16, fontWeight: "800" },
  addBtn: {
    flexDirection: "row", alignItems: "center", gap: 4,
    backgroundColor: COLORS.primary, borderRadius: 8,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  addBtnText: { color: "#000", fontWeight: "700", fontSize: 12 },
  avatarBtn: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center",
  },
  avatarBtnText: { color: "#000", fontWeight: "800", fontSize: 12 },
  demoLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: "600" },

  // Bottom tabs
  bottomTabs: {
    flexDirection: "row", backgroundColor: COLORS.sidebar,
    borderTopWidth: 1, borderColor: COLORS.border,
    paddingBottom: Platform.OS === "ios" ? 16 : 4, paddingTop: 4,
  },
  tabItem: { flex: 1, alignItems: "center", paddingVertical: 6, gap: 2 },
  tabLabel: { color: COLORS.textMuted, fontSize: 10, fontWeight: "600" },

  // Drawer
  drawerOverlay: { flex: 1, flexDirection: "row" },
  drawerPanel: { width: 260, maxWidth: "80%", height: "100%" },
  drawerBackdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.6)" },

  content: { flex: 1 },
  scroll: { padding: 24, gap: 16 },

  kpiRow: { flexDirection: "row", gap: 12 },
  kpiCard: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 18,
    borderWidth: 1, borderColor: COLORS.border,
  },
  kpiTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  kpiTitle: { color: COLORS.textMuted, fontSize: 11, fontWeight: "600" },
  kpiIcon: { fontSize: 20 },
  kpiValue: { fontSize: 22, fontWeight: "800", fontFamily: MONO, marginBottom: 4 },
  kpiSub: { color: COLORS.textMuted, fontSize: 11 },

  chartsRow: { flexDirection: "row", gap: 12 },
  panel: {
    backgroundColor: COLORS.card, borderRadius: 12, padding: 20,
    borderWidth: 1, borderColor: COLORS.border,
  },
  panelFull: { width: "100%" },
  panelHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 16 },
  panelTitle: { color: COLORS.text, fontSize: 14, fontWeight: "700" },
  panelSub: { color: COLORS.textMuted, fontSize: 12 },
  linkText: { color: COLORS.primary, fontSize: 12, fontWeight: "600" },
  empty: { color: COLORS.textMuted, fontSize: 13, textAlign: "center", paddingVertical: 20 },

  donutWrap: { alignItems: "center" },
  donutRow: { flexDirection: "row", alignItems: "center", gap: 20 },
  donutCircle: { position: "relative", width: 120, height: 120, alignItems: "center", justifyContent: "center" },
  donutCenter: { position: "absolute", alignItems: "center" },
  donutTotal: { color: COLORS.textSecondary, fontSize: 10, fontWeight: "700" },
  donutLegend: { gap: 6 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { color: COLORS.textSecondary, fontSize: 11 },

  budgetRow: { marginBottom: 14 },
  budgetTopRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 6 },
  budgetLabel: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  budgetAmt: { color: COLORS.textMuted, fontSize: 11 },
  barTrack: { height: 6, backgroundColor: COLORS.track, borderRadius: 3, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 3 },

  txRow: { flexDirection: "row", alignItems: "center", paddingVertical: 10, borderBottomWidth: 1, borderColor: COLORS.border, gap: 10 },
  txIcon: { width: 34, height: 34, borderRadius: 8, backgroundColor: COLORS.cardSecondary, alignItems: "center", justifyContent: "center" },
  txTitle: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  txMeta: { color: COLORS.textMuted, fontSize: 11, marginTop: 2 },
  txAmt: { fontSize: 13, fontWeight: "700", fontFamily: MONO },

  accRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderColor: COLORS.border, gap: 10 },
  accIcon: { width: 34, height: 34, borderRadius: 8, backgroundColor: COLORS.cardSecondary, alignItems: "center", justifyContent: "center" },
  accName: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  accType: { color: COLORS.textMuted, fontSize: 11, marginTop: 1 },
  accAmt: { fontSize: 14, fontWeight: "700", fontFamily: MONO },

  // Profile Modal
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.4)" },
  modalContent: {
    position: "absolute", top: 70, right: 16, width: 280,
    backgroundColor: "#1a1f2e", borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: COLORS.border,
    ...Platform.select({ web: { boxShadow: "0 10px 40px rgba(0,0,0,0.5)" } as any }),
  },
  modalHeader: { alignItems: "flex-start", marginBottom: 16, paddingBottom: 14, borderBottomWidth: 1, borderColor: COLORS.border },
  modalAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center", marginBottom: 10 },
  modalAvatarText: { color: "#000", fontWeight: "800", fontSize: 15 },
  modalName: { color: "#fff", fontSize: 14, fontWeight: "700", marginBottom: 2 },
  modalEmail: { color: COLORS.textMuted, fontSize: 11 },
  menuRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, gap: 10 },
  menuRowLabel: { flex: 1, color: COLORS.text, fontSize: 13, fontWeight: "600" },
  logoutRow: { flexDirection: "row", alignItems: "center", paddingTop: 12, gap: 8, borderTopWidth: 1, borderColor: COLORS.border, marginTop: 4 },
  logoutText: { color: COLORS.expense, fontSize: 13, fontWeight: "700" },
  okText: { color: COLORS.income, fontSize: 12, marginBottom: 10 },
  errText: { color: COLORS.expense, fontSize: 12, marginBottom: 10 },
  fieldLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: "700", marginBottom: 6 },
  fieldInput: {
    backgroundColor: COLORS.cardSecondary, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10,
    color: "#fff", fontSize: 13, borderWidth: 1, borderColor: COLORS.border, marginBottom: 10,
  },
  btnRow: { flexDirection: "row", gap: 8, marginTop: 4 },
  cancelBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8, backgroundColor: COLORS.cardSecondary, borderWidth: 1, borderColor: COLORS.border },
  cancelText: { color: COLORS.textSecondary, fontWeight: "700", fontSize: 13 },
  saveBtn: { flex: 1, paddingVertical: 10, alignItems: "center", borderRadius: 8, backgroundColor: COLORS.primary },
  saveText: { color: "#000", fontWeight: "800", fontSize: 13 },
});
