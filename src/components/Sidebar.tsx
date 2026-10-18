// src/components/Sidebar.tsx
import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { auth } from "../services/firebase";
import { APP_VERSION, COLORS } from "../theme/constants";

export type NavItem = { icon: any; label: string; target: string; emoji?: string };

export const NAV_SECTIONS: { title: string; items: NavItem[] }[] = [
  {
    title: "YÖNETİM",
    items: [
      { icon: "dashboard", label: "Panel", target: "Dashboard" },
      { icon: "swap-vert", label: "İşlemler", target: "İşlemler" },
      { icon: "account-balance", label: "Hesaplar", target: "Hesaplar" },
      { icon: "pie-chart", label: "Bütçe", target: "Bütçe" },
      { icon: "receipt", label: "Faturalar", target: "Faturalar" },
    ],
  },
  {
    title: "PLANLAMA",
    items: [
      { icon: "emoji-events", label: "Hedefler", target: "Hedefler" },
      { icon: "trending-up", label: "Yatırımlar", target: "Yatırımlar" },
      { icon: "handshake", label: "Borç / Alacak", target: "Borç / Alacak" },
    ],
  },
  {
    title: "DİĞER",
    items: [
      { icon: "family-restroom", label: "Aile", target: "Aile" },
      { icon: "bar-chart", label: "Raporlar", target: "Raporlar" },
      { icon: "settings", label: "Ayarlar", target: "Ayarlar" },
    ],
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
      {/* Logo */}
      <View style={styles.logoArea}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoIconText}>FF</Text>
        </View>
        <View style={styles.logoTextRow}>
          <Text style={styles.logoFin}>Harcama</Text>
          <Text style={styles.logoFlow}> Pusulası</Text>
        </View>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
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
                  activeOpacity={0.7}
                >
                  <MaterialIcons
                    name={item.icon}
                    size={18}
                    color={active ? COLORS.primary : COLORS.textMuted}
                  />
                  <Text style={[styles.navItemLabel, active && styles.activeNavLabel]}>
                    {item.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </ScrollView>

      {/* User Area */}
      <TouchableOpacity style={styles.userCard} onPress={onProfilePress} activeOpacity={0.7}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.userName} numberOfLines={1}>{displayName}</Text>
          <Text style={styles.userEmail} numberOfLines={1}>
            {auth.currentUser?.email || ""}
          </Text>
        </View>
        <MaterialIcons name="more-vert" size={18} color={COLORS.textMuted} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: 240,
    backgroundColor: COLORS.sidebar,
    paddingVertical: 0,
    borderRightWidth: 1,
    borderColor: COLORS.border,
    flex: 1,
  },
  logoArea: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderColor: COLORS.border,
    marginBottom: 16,
  },
  logoIcon: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  logoIconText: { color: "#000", fontWeight: "900", fontSize: 11 },
  logoTextRow: { flexDirection: "row", alignItems: "center" },
  logoFin: { color: "#fff", fontWeight: "800", fontSize: 15 },
  logoFlow: { color: COLORS.primary, fontWeight: "800", fontSize: 15 },

  navSection: { marginBottom: 24, paddingHorizontal: 12 },
  navSectionTitle: {
    fontSize: 10,
    color: COLORS.textMuted,
    letterSpacing: 1.4,
    fontWeight: "700",
    marginBottom: 8,
    paddingHorizontal: 8,
  },
  navItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 2,
    gap: 10,
  },
  navItemActive: {
    backgroundColor: "rgba(0,201,167,0.1)",
  },
  navItemLabel: { color: COLORS.textSecondary, fontSize: 13, fontWeight: "600" },
  activeNavLabel: { color: COLORS.primary },

  userCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    margin: 12,
    padding: 10,
    borderRadius: 10,
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: { color: "#000", fontWeight: "800", fontSize: 13 },
  userName: { color: "#fff", fontSize: 13, fontWeight: "700" },
  userEmail: { color: COLORS.textMuted, fontSize: 10, marginTop: 1 },
});
