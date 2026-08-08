// src/components/Sidebar.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { auth } from "../services/firebase";
import { APP_VERSION, COLORS } from "../theme/constants";

export type NavItem = { icon: any; label: string; target: string };

export const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "ANA MENÜ",
    items: [
      { icon: "dashboard", label: "Dashboard", target: "Dashboard" },
      { icon: "swap-vert", label: "İşlemler", target: "İşlemler" },
      { icon: "account-balance", label: "Hesaplar", target: "Hesaplar" },
      { icon: "pie-chart", label: "Bütçe", target: "Bütçe" },
      { icon: "receipt", label: "Faturalar", target: "Faturalar" },
    ],
  },
  {
    title: "YATIRIM & HEDEF",
    items: [
      { icon: "trending-up", label: "Yatırımlar", target: "Yatırımlar" },
      { icon: "flag", label: "Hedefler", target: "Hedefler" },
      { icon: "handshake", label: "Borç / Alacak", target: "Borç / Alacak" },
      { icon: "currency-exchange", label: "Döviz & Kur", target: "Döviz & Kur" },
      { icon: "list-alt", label: "Vergi", target: "Vergi" },
    ],
  },
  {
    title: "ANALİZ",
    items: [{ icon: "bar-chart", label: "Raporlar", target: "Raporlar" }],
  },
];

type Props = {
  activeTab: string;
  onSelect: (target: string) => void;
  onProfilePress: () => void;
};

export default function Sidebar({ activeTab, onSelect, onProfilePress }: Props) {
  const displayName =
    auth.currentUser?.displayName || auth.currentUser?.email?.split("@")[0] || "Kullanıcı";
  const initials = (auth.currentUser?.displayName || auth.currentUser?.email || "K")
    .substring(0, 2)
    .toUpperCase();

  return (
    <View style={styles.sidebar}>
      <View style={styles.sidebarHeader}>
        <TouchableOpacity style={styles.userCardTop} onPress={onProfilePress}>
          <View style={styles.avatar}>
            <Text style={{ color: "#000", fontWeight: "700" }}>{initials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName} numberOfLines={1}>
              {displayName}
            </Text>
            <Text style={styles.settingsLinkText}>Hesap ve Profil</Text>
          </View>
          <MaterialIcons name="more-vert" size={20} color={COLORS.textMuted} />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {NAV_SECTIONS.map((section) => (
          <View key={section.title} style={styles.navSection}>
            <Text style={styles.navSectionTitle}>{section.title}</Text>
            {section.items.map((item) => {
              const active = activeTab === item.target;
              return (
                <TouchableOpacity
                  key={item.target}
                  onPress={() => onSelect(item.target)}
                  style={[styles.navItem, active && styles.navItemActive]}
                >
                  <MaterialIcons name={item.icon} size={20} color={active ? "#10b981" : COLORS.textSecondary} />
                  <Text style={[styles.navItemLabel, active && styles.activeNavLabel]}>{item.label}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}

        <Text style={styles.version}>Sürüm {APP_VERSION}</Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: { width: 260, backgroundColor: "#0b0d12", paddingVertical: 24, borderRightWidth: 1, borderColor: COLORS.border, flex: 1 },
  sidebarHeader: { paddingHorizontal: 16, marginBottom: 24 },
  userCardTop: { flexDirection: "row", alignItems: "center", gap: 10, padding: 12, borderRadius: 12, backgroundColor: "rgba(255,255,255,0.04)", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: "#78dcc8", alignItems: "center", justifyContent: "center" },
  userName: { color: "#fff", fontSize: 14, fontWeight: "700" },
  settingsLinkText: { color: "#10b981", fontSize: 11, fontWeight: "600" },
  navSection: { marginBottom: 28 },
  navSectionTitle: { fontSize: 10, color: COLORS.textMuted, letterSpacing: 1.2, fontWeight: "700", marginBottom: 14, paddingHorizontal: 24 },
  navItem: { flexDirection: "row", alignItems: "center", paddingVertical: 12, paddingHorizontal: 24, marginBottom: 4, gap: 14 },
  navItemActive: { backgroundColor: "rgba(16, 185, 129, 0.08)", borderLeftWidth: 4, borderLeftColor: "#10b981" },
  navItemLabel: { color: COLORS.textSecondary, fontSize: 14, fontWeight: "600" },
  activeNavLabel: { color: "#10b981" },
  version: { color: COLORS.textMuted, fontSize: 10, paddingHorizontal: 24, paddingBottom: 8, opacity: 0.7 },
});
