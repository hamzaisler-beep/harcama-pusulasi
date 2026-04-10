import React from "react";
import { View, useWindowDimensions, TouchableOpacity, Text, StyleSheet } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../types";

import DashboardScreen from "../screens/DashboardScreen";
import TransactionsScreen from "../screens/TransactionsScreen";
import AddTransactionScreen from "../screens/AddTransactionScreen";
import SavingsScreen from "../screens/SavingsScreen";
import FamilyScreen from "../screens/FamilyScreen";
import ReportsScreen from "../screens/ReportsScreen";

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function Sidebar({ navigation, state }: any) {
  const menuItems = [
    { name: "Dashboard", label: "Dashboard", icon: "grid-view" },
    { name: "Transactions", label: "İşlemler", icon: "receipt-long" },
    { name: "Savings", label: "Birikimler", icon: "account-balance-wallet" },
    { name: "Reports", label: "Analiz \u0026 Raporlar", icon: "bar-chart" },
    { name: "Family", label: "Aile Paylaşımı", icon: "family-restroom" },
  ];

  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarLogo}>
        <MaterialIcons name="account-balance" size={28} color={COLORS.primary} />
        <Text style={styles.sidebarLogoText}>FinFlow</Text>
      </View>
      <View style={styles.sidebarMenu}>
        {menuItems.map((item, idx) => {
          const isFocused = state.index === idx;
          return (
            <TouchableOpacity
              key={item.name}
              style={[styles.sidebarItem, isFocused && styles.sidebarItemActive]}
              onPress={() => navigation.navigate(item.name)}
            >
              <MaterialIcons
                name={item.icon as any}
                size={22}
                color={isFocused ? COLORS.primary : COLORS.textSecondary}
              />
              <Text style={[styles.sidebarItemText, isFocused && styles.sidebarItemTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
      <TouchableOpacity style={styles.sidebarFooter}>
        <MaterialIcons name="logout" size={20} color={COLORS.textMuted} />
        <Text style={styles.sidebarFooterText}>Çıkış Yap</Text>
      </TouchableOpacity>
    </View>
  );
}

function MainNavigator() {
  const { width } = useWindowDimensions();
  const isWeb = width > 768;

  return (
    <View style={{ flex: 1, flexDirection: "row", backgroundColor: COLORS.background }}>
      {isWeb && (
        <Tab.Navigator
          tabBar={(props) => <Sidebar {...props} />}
          screenOptions={{ headerShown: false }}
        >
          <Tab.Screen name="Dashboard" component={DashboardScreen} />
          <Tab.Screen name="Transactions" component={TransactionsScreen} />
          <Tab.Screen name="Savings" component={SavingsScreen} />
          <Tab.Screen name="Reports" component={ReportsScreen} />
          <Tab.Screen name="Family" component={FamilyScreen} />
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
            tabBarLabelStyle: { fontSize: 11, fontWeight: "600" },
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
              tabBarIcon: ({ color }) => <MaterialIcons name="receipt-long" size={24} color={color} />,
            }}
          />
          <Tab.Screen
            name="Reports"
            component={ReportsScreen}
            options={{
              tabBarLabel: "Raporlar",
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
    width: 260,
    backgroundColor: COLORS.card,
    borderRightWidth: 1,
    borderRightColor: COLORS.border,
    padding: 24,
    justifyContent: "space-between",
  },
  sidebarLogo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 40,
  },
  sidebarLogoText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  sidebarMenu: {
    flex: 1,
    gap: 8,
  },
  sidebarItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    gap: 12,
  },
  sidebarItemActive: {
    backgroundColor: "rgba(34, 197, 94, 0.08)",
  },
  sidebarItemText: {
    color: COLORS.textSecondary,
    fontSize: 14,
    fontWeight: "500",
  },
  sidebarItemTextActive: {
    color: COLORS.primary,
    fontWeight: "600",
  },
  sidebarFooter: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginTop: 20,
  },
  sidebarFooterText: {
    color: COLORS.textMuted,
    fontSize: 14,
  },
});
