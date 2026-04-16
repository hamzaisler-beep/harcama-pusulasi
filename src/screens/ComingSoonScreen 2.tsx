import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { COLORS } from "../types";

export default function ComingSoonScreen({ route }: any) {
  const name = route?.name || "Özellik";

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.iconCircle}>
          <MaterialIcons name="auto-awesome" size={48} color={COLORS.primary} />
        </View>
        <Text style={styles.title}>{name} Yakında!</Text>
        <Text style={styles.subtitle}>
          Bu harika özelliği sizin için geliştiriyoruz. Çok yakında finansal süreçlerinizi daha da kolaylaştıracak.
        </Text>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>YOL HARİTASINDA</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: "#000" },
  container: { flex: 1, alignItems: "center", justifyContent: "center", padding: 40 },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "rgba(255,255,255,0.05)",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textMuted,
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 32,
  },
  badge: {
    backgroundColor: COLORS.primary + "15",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.primary + "30",
  },
  badgeText: {
    color: COLORS.primary,
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 1,
  },
});
