import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { AppText } from "./ui";
import { CategoryIcon } from "./CategoryIcon";
import { getCategory } from "../lib/categories";
import { formatDayShort, formatSigned } from "../lib/format";
import { colors, fonts } from "../theme";
import type { Household, Transaction } from "../types";

export function TransactionRow({
  tx,
  household,
  showDate = true,
  last,
}: {
  tx: Transaction;
  household: Household;
  showDate?: boolean;
  last?: boolean;
}) {
  const category = getCategory(tx.categoryId);
  const who = household.memberNames[tx.createdBy] ?? "Üye";
  const subtitleParts = [showDate ? formatDayShort(tx.date.toDate()) : null, who, tx.note || null].filter(
    Boolean,
  );
  const amount = formatSigned(tx.amountKurus, tx.type);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${category.name}, ${amount}, ${subtitleParts.join(", ")}. Düzenlemek için dokun.`}
      onPress={() => router.push({ pathname: "/islem/[id]", params: { id: tx.id } })}
      style={({ pressed }) => [styles.row, !last && styles.divider, pressed && { opacity: 0.6 }]}
    >
      <CategoryIcon category={category} />
      <View style={{ flex: 1, gap: 2 }}>
        <AppText style={{ fontFamily: fonts.medium }} numberOfLines={1}>
          {category.name}
        </AppText>
        <AppText variant="small" style={{ fontSize: 13 }} numberOfLines={1}>
          {subtitleParts.join(" · ")}
        </AppText>
      </View>
      <AppText
        style={{
          fontFamily: fonts.semibold,
          color: tx.type === "income" ? colors.accent : colors.ink,
        }}
      >
        {amount}
      </AppText>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
});
