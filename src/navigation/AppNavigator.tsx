import React from "react";
import { View, useWindowDimensions, TouchableOpacity, Text, StyleSheet, ScrollView } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../types";

import DashboardScreen from "../screens/DashboardScreen";
import TransactionsScreen from "../screens/TransactionsScreen";
import AccountsScreen from "../screens/AccountsScreen";
import BudgetScreen from "../screens/BudgetScreen";
import SavingsScreen from "../screens/SavingsScreen";
import ReportsScreen from "../screens/ReportsScreen";
import DovizKurScreen from "../screens/DovizKurScreen";
import AddTransactionScreen from "../screens/AddTransactionScreen";
import ComingSoonScreen from "../screens/ComingSoonScreen";
import FamilyScreen from "../screens/FamilyScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

const MENU_GROUPS = [
  {
    title: "ANA MENÜ",
    items: [
      { name: "Dashboard", label: "Dashboard", icon: "grid-view" },
      { name: "Transactions", label: "İşlemler", icon: "swap-horiz" },
      { name: "Accounts", label: "Hesaplar", icon: "account-balance" },
      { name: "Budget", label: "Bütçe", icon: "track-changes" },
      { name: "Bills", label: "Faturalar", icon: "description" },
    ],
  },
  {
    title: "YATIRIM \u0026 HEDEF",
    items: [
      { name: "Savings", label: "Yatırımlar", icon: "show-chart" },
      { name: "Goals", label: "Hedefler", icon: "stars" },
      { name: "Debt", label: "Borç / Alacak", icon: "people-outline" },
      { name: "Rates", label: "Döviz \u0026 Kur", icon: "currency-exchange" },
      { name: "Tax", label: "Vergi", icon: "calculate" },
    ],
  },
  {
    title: "ANALİZ",
    items: [
      { name: "Reports", label: "Raporlar", icon: "bar-chart" },
    ],
  },
];

function Sidebar({ navigation, state }: any) {
  // Find current route name to highlight the active menu item
  const currentRouteName = state.routes[state.index].name;

  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <View style={styles.logoContainer}>
            <View style={styles.logoBox}>
                <MaterialIcons name="account-balance" size={20} color={COLORS.primary} />
            </View>
            <Text style={styles.sidebarLogoText}>FinFlow</Text>
        </View>
      </View>

      <ScrollView style={styles.sidebarScroll} showsVerticalScrollIndicator={false}>
        {MENU_GROUPS.map((group) => (
          <View key={group.title} style={styles.sidebarSection}>
            <Text style={styles.sidebarSectionTitle}>{group.title}</Text>
            {group.items.map((item) => {
              const isFocused = currentRouteName === item.name;
              return (
                <TouchableOpacity
                  key={item.name}
                  style={[styles.sidebarItem, isFocused && styles.sidebarItemActive]}
                  onPress={() => navigation.navigate(item.name)}
                >
                  <MaterialIcons
                    name={item.icon as any}
                    size={20}
                    color={isFocused ? COLORS.primary : COLORS.textSecondary}
                  />
                  <Text style={[styles.sidebarItemText, isFocused && styles.sidebarItemTextActive]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      <View style={styles.sidebarFooter}>
        <View style={styles.profileBox}>
            <View style={styles.avatar}>
                <Text style={styles.avatarText}>DK</Text>
            </View>
            <View style={styles.profileInfo}>
                <Text style={styles.profileName}>Demo Kullanıcı</Text>
                <Text style={styles.profileEmail}>demo@finflow.app</Text>
            </View>
            <TouchableOpacity style={styles.profileAction}>
                <MaterialIcons name="more-vert" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
        </View>
        <View style={styles.footerBrand}>
            <Text style={styles.footerBrandText}>YAPIMCI</Text>
            <Text style={styles.footerBrandName}>tumabilisim.com</Text>
        </View>
      </View>
    </View>
  );
}

function MainNavigator() {
  const { width } = useWindowDimensions();
  const isWeb = width > 1024;

  const screens = [
    { name: "Dashboard", component: DashboardScreen },
    { name: "Transactions", component: TransactionsScreen },
    { name: "Accounts", component: AccountsScreen },
    { name: "Budget", component: BudgetScreen },
    { name: "Bills", component: ComingSoonScreen },
    { name: "Savings", component: SavingsScreen },
    { name: "Goals", component: ComingSoonScreen },
    { name: "Debt", component: ComingSoonScreen },
    { name: "Rates", component: DovizKurScreen },
    { name: "Tax", component: ComingSoonScreen },
    { name: "Reports", component: ReportsScreen },
    { name: "Family", component: FamilyScreen },
  ];

  return (
    <View style={{ flex: 1, flexDirection: "row", backgroundColor: COLORS.background }}>
      {isWeb && (
        <Tab.Navigator
          tabBar={(props) => <Sidebar {...props} />}
          screenOptions={{ headerShown: false }}
        >
          {screens.map(s => <Tab.Screen key={s.name} name={s.name} component={s.component} />)}
        </Tab.Navigator>
      )}

      {!isWeb && (
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: COLORS.primary,
            tabBarInactiveTintColor: COLORS.textMuted,
            tabBarStyle: {
              backgroundColor: COLORS.card,
              borderTopWidth: 0,
              paddingBottom: 8,
              paddingTop: 6,
              height: 65,
              position: "absolute",
              bottom: 0,
              left: 0,
              right: 0,
              elevation: 0,
            },
            tabBarLabelStyle: { fontSize: 10, fontWeight: "600" },
          }}
        >
          <Tab.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{
              tabBarLabel: "Panel",
              tabBarIcon: ({ color }) => <MaterialIcons name="grid-view" size={24} color={color} />,
            }}
          />
          <Tab.Screen
            name="Transactions"
            component={TransactionsScreen}
            options={{
              tabBarLabel: "İşlemler",
              tabBarIcon: ({ color }) => <MaterialIcons name="swap-horiz" size={24} color={color} />,
            }}
          />
          <Tab.Screen
            name="Savings"
            component={SavingsScreen}
            options={{
              tabBarLabel: "Yatırım",
              tabBarIcon: ({ color }) => <MaterialIcons name="show-chart" size={24} color={color} />,
            }}
          />
          <Tab.Screen
            name="Reports"
            component={ReportsScreen}
            options={{
              tabBarLabel: "Analiz",
              tabBarIcon: ({ color }) => <MaterialIcons name="bar-chart" size={24} color={color} />,
            }}
          />
        </Tab.Navigator>
      )}
    </View>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, contentStyle: { backgroundColor: COLORS.background } }}>
      <Stack.Screen name="Main" component={MainNavigator} />
      <Stack.Screen
        name="AddTransaction"
        component={AddTransactionScreen}
        options={{
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 280,
    backgroundColor: "#000",
    borderRightWidth: 1,
    borderRightColor: "rgba(255,255,255,0.05)",
    paddingVertical: 20,
  },
  sidebarHeader: {
    paddingHorizontal: 24,
    marginBottom: 32,
  },
  logoContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoBox: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: "rgba(34, 197, 94, 0.1)",
    alignItems: "center",
    justifyContent: "center",
  },
  sidebarLogoText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "900",
    letterSpacing: -1,
  },
  sidebarScroll: {
    flex: 1,
  },
  sidebarSection: {
    marginBottom: 24,
    paddingHorizontal: 16,
  },
  sidebarSectionTitle: {
    color: COLORS.textMuted,
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1.2,
    marginBottom: 12,
    paddingHorizontal: 10,
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 14,
    marginBottom: 2,
  },
  sidebarItemActive: {
    backgroundColor: "rgba(255, 255, 255, 0.04)",
  },
  sidebarItemText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "600",
  },
  sidebarItemTextActive: {
    color: COLORS.primary,
    fontWeight: "700",
  },
  sidebarFooter: {
    paddingHorizontal: 16,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: "rgba(255,255,255,0.05)",
  },
  profileBox: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "rgba(255,255,255,0.03)",
    borderRadius: 12,
    marginBottom: 16,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    color: "#000",
    fontSize: 13,
    fontWeight: "800",
  },
  profileInfo: {
    flex: 1,
    marginLeft: 12,
  },
  profileName: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "700",
  },
  profileEmail: {
    color: COLORS.textMuted,
    fontSize: 11,
    marginTop: 1,
  },
  profileAction: {
    padding: 4,
  },
  footerBrand: {
    paddingHorizontal: 10,
  },
  footerBrandText: {
    color: COLORS.textMuted,
    fontSize: 9,
    fontWeight: "800",
    letterSpacing: 2,
  },
  footerBrandName: {
    color: COLORS.textSecondary,
    fontSize: 11,
    fontWeight: "600",
    marginTop: 4,
  },
});
