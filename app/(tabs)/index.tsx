import React, { useMemo, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { Link } from "expo-router";
import { AppText, Avatar, Card, Screen } from "@/components/ui";
import { ChevronLeft, ChevronRight } from "@/components/icons";
import { InviteCard } from "@/components/InviteCard";
import { useReadySession } from "@/context/SessionContext";
import { formatMonth, formatTL } from "@/lib/format";
import { colors, fonts, memberColors, radius } from "@/theme";

export default function AnaSayfa() {
  const { household } = useReadySession();
  const [monthOffset, setMonthOffset] = useState(0);

  const month = useMemo(() => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + monthOffset);
    return d;
  }, [monthOffset]);

  // 2. aşamada işlemlerden hesaplanacak.
  const income = 0;
  const expense = 0;

  const members = household.members.map((uid, i) => ({
    uid,
    name: household.memberNames[uid] ?? "Üye",
    color: memberColors[i % memberColors.length],
  }));

  return (
    <Screen>
      <View style={styles.header}>
        <View style={{ gap: 2, flexShrink: 1 }}>
          <AppText variant="small">{household.name}</AppText>
          <View style={{ flexDirection: "row", alignItems: "center", gap: 2 }}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Önceki ay"
              onPress={() => setMonthOffset((m) => m - 1)}
              hitSlop={8}
              style={styles.monthBtn}
            >
              <ChevronLeft color={colors.ink} size={20} />
            </Pressable>
            <AppText variant="display" style={{ fontSize: 24 }} accessibilityRole="header">
              {formatMonth(month)}
            </AppText>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Sonraki ay"
              onPress={() => setMonthOffset((m) => m + 1)}
              hitSlop={8}
              style={styles.monthBtn}
            >
              <ChevronRight color={colors.ink} size={20} />
            </Pressable>
          </View>
        </View>
        <Link href="/ayarlar" asChild>
          <Pressable accessibilityRole="button" accessibilityLabel="Profil ve ayarlar" style={{ flexDirection: "row" }}>
            {members.slice(0, 3).map((m, i) => (
              <View key={m.uid} style={[styles.avatarRing, i > 0 && { marginLeft: -12 }]}>
                <Avatar name={m.name} color={m.color} />
              </View>
            ))}
          </Pressable>
        </Link>
      </View>

      <View style={styles.balance} accessibilityLabel="Bu ayın özeti">
        <AppText style={{ color: colors.onAccentMuted, fontSize: 14 }}>Bu ay kalan</AppText>
        <AppText style={styles.balanceAmount}>{formatTL(income - expense)}</AppText>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={styles.balanceTile}>
            <AppText style={{ color: colors.onAccentMuted, fontSize: 13 }}>Gelir</AppText>
            <AppText style={styles.tileAmount}>{formatTL(income)}</AppText>
          </View>
          <View style={styles.balanceTile}>
            <AppText style={{ color: colors.onAccentMuted, fontSize: 13 }}>Gider</AppText>
            <AppText style={styles.tileAmount}>{formatTL(expense)}</AppText>
          </View>
        </View>
      </View>

      {household.members.length < 2 && <InviteCard household={household} />}

      <Card>
        <AppText variant="title">Henüz işlem yok</AppText>
        <AppText variant="small" style={{ lineHeight: 21 }}>
          Gelir ve gider eklemek bir sonraki aşamada açılacak. Şimdilik hane kurulumu ve eşinin katılımı hazır.
        </AppText>
      </Card>

      <View style={{ gap: 8 }}>
        <AppText variant="section">Hane üyeleri</AppText>
        <Card style={{ paddingVertical: 4 }}>
          {members.map((m, i) => (
            <View
              key={m.uid}
              style={[styles.memberRow, i < members.length - 1 && styles.rowDivider]}
            >
              <Avatar name={m.name} color={m.color} size={34} />
              <AppText style={{ flex: 1 }}>{m.name}</AppText>
              {m.uid === household.ownerId && <AppText variant="caption">Kurucu</AppText>}
            </View>
          ))}
        </Card>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
  monthBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  avatarRing: { borderWidth: 2, borderColor: colors.bg, borderRadius: 22 },
  balance: {
    backgroundColor: colors.accentDark,
    borderRadius: radius.xl,
    padding: 22,
    gap: 14,
  },
  balanceAmount: {
    color: colors.white,
    fontFamily: fonts.display,
    fontSize: 40,
    marginTop: -10,
  },
  balanceTile: {
    flex: 1,
    backgroundColor: "rgba(255,255,255,0.08)",
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    gap: 2,
  },
  tileAmount: { color: colors.white, fontFamily: fonts.semibold, fontSize: 18 },
  memberRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
});
