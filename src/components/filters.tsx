import React from "react";
import { Pressable, ScrollView, StyleSheet, View } from "react-native";
import { AppText } from "./ui";
import { ChevronLeft, ChevronRight } from "./icons";
import { formatMonth } from "../lib/format";
import { colors, fonts } from "../theme";
import type { Household } from "../types";

/* ---------- Ay seçici ---------- */

export function addMonths(date: Date, delta: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + delta, 1);
}

export function startOfMonth(date = new Date()): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

export function MonthSwitcher({
  month,
  onChange,
  size = 24,
}: {
  month: Date;
  onChange: (m: Date) => void;
  size?: number;
}) {
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Önceki ay"
        onPress={() => onChange(addMonths(month, -1))}
        hitSlop={8}
        style={styles.monthBtn}
      >
        <ChevronLeft color={colors.ink} size={20} />
      </Pressable>
      <AppText variant="display" style={{ fontSize: size }} accessibilityRole="header">
        {formatMonth(month)}
      </AppText>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Sonraki ay"
        onPress={() => onChange(addMonths(month, 1))}
        hitSlop={8}
        style={styles.monthBtn}
      >
        <ChevronRight color={colors.ink} size={20} />
      </Pressable>
    </View>
  );
}

/* ---------- Kişi filtresi ---------- */

/** "all" ya da bir üyenin uid'i */
export type PersonFilterValue = string;

export function PersonFilter({
  household,
  myUid,
  value,
  onChange,
}: {
  household: Household;
  myUid: string;
  value: PersonFilterValue;
  onChange: (v: PersonFilterValue) => void;
}) {
  // Tek üye varken filtreye gerek yok.
  if (household.members.length < 2) return null;

  const options = [
    { id: "all", label: "Hepsi" },
    { id: myUid, label: "Ben" },
    ...household.members
      .filter((uid) => uid !== myUid)
      .map((uid) => ({ id: uid, label: household.memberNames[uid] ?? "Üye" })),
  ];

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
      {options.map((o) => (
        <Chip key={o.id} label={o.label} selected={value === o.id} onPress={() => onChange(o.id)} />
      ))}
    </ScrollView>
  );
}

export function Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      style={[styles.chip, selected ? styles.chipOn : styles.chipOff]}
    >
      <AppText
        style={{
          fontSize: 14,
          fontFamily: selected ? fonts.semibold : fonts.regular,
          color: selected ? colors.white : colors.ink,
        }}
      >
        {label}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  monthBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  chip: { height: 36, paddingHorizontal: 16, borderRadius: 18, justifyContent: "center" },
  chipOn: { backgroundColor: colors.ink },
  chipOff: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
});
