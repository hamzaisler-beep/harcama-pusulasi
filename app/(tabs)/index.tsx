import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import { Link, router } from "expo-router";
import { AppText, Avatar, Button, Card, ErrorNote, Screen } from "@/components/ui";
import { InviteCard } from "@/components/InviteCard";
import { MonthSwitcher, PersonFilter, startOfMonth } from "@/components/filters";
import { TransactionRow } from "@/components/TransactionRow";
import { useReadySession } from "@/context/SessionContext";
import { useMonthTransactions, useTotals } from "@/hooks/useMonthTransactions";
import { formatKurus } from "@/lib/format";
import { colors, fonts, memberColors, radius } from "@/theme";

const RECENT_COUNT = 5;

export default function AnaSayfa() {
  const { user, household } = useReadySession();
  const [month, setMonth] = useState(startOfMonth());
  const [person, setPerson] = useState("all");

  const { transactions, loading, error } = useMonthTransactions(household.id, month);
  const visible = useMemo(
    () => (person === "all" ? transactions : transactions.filter((t) => t.createdBy === person)),
    [transactions, person],
  );
  const { income, expense, balance } = useTotals(visible);

  const members = household.members.map((uid, i) => ({
    uid,
    name: household.memberNames[uid] ?? "Üye",
    color: memberColors[i % memberColors.length],
  }));

  return (
    <Screen testID="screen-ana">
      <View style={styles.header}>
        <View style={{ gap: 2, flexShrink: 1 }}>
          <AppText variant="small">{household.name}</AppText>
          <MonthSwitcher month={month} onChange={setMonth} />
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
        <AppText style={{ color: colors.onAccentMuted, fontSize: 14 }}>
          {person === "all" ? "Bu ay kalan" : "Bu ay kalan (filtreli)"}
        </AppText>
        <AppText style={styles.balanceAmount} testID="balance-amount">
          {formatKurus(balance)}
        </AppText>
        <View style={{ flexDirection: "row", gap: 12 }}>
          <View style={styles.balanceTile}>
            <AppText style={{ color: colors.onAccentMuted, fontSize: 13 }}>Gelir</AppText>
            <AppText style={styles.tileAmount} testID="income-amount">
              {formatKurus(income)}
            </AppText>
          </View>
          <View style={styles.balanceTile}>
            <AppText style={{ color: colors.onAccentMuted, fontSize: 13 }}>Gider</AppText>
            <AppText style={styles.tileAmount} testID="expense-amount">
              {formatKurus(expense)}
            </AppText>
          </View>
        </View>
      </View>

      <PersonFilter household={household} myUid={user.uid} value={person} onChange={setPerson} />

      {household.members.length < 2 && <InviteCard household={household} />}

      <ErrorNote message={error} />

      <View style={{ gap: 10 }}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
          <AppText variant="title" accessibilityRole="header">
            Son işlemler
          </AppText>
          {visible.length > RECENT_COUNT && (
            <Pressable accessibilityRole="link" onPress={() => router.navigate("/islemler")} hitSlop={8}>
              <AppText style={{ color: colors.accent, fontFamily: fonts.medium, fontSize: 14 }}>Tümü</AppText>
            </Pressable>
          )}
        </View>

        {loading ? (
          <View style={{ paddingVertical: 24 }}>
            <ActivityIndicator color={colors.accent} />
          </View>
        ) : visible.length === 0 ? (
          <Card>
            <AppText variant="small" style={{ lineHeight: 21 }}>
              Bu ay henüz işlem yok. Alttaki yeşil + ile ilk gelirini ya da giderini ekle.
            </AppText>
            <Button title="İşlem ekle" onPress={() => router.navigate("/ekle")} />
          </Card>
        ) : (
          <Card style={{ paddingVertical: 4 }}>
            {visible.slice(0, RECENT_COUNT).map((t, i, arr) => (
              <TransactionRow key={t.id} tx={t} household={household} last={i === arr.length - 1} />
            ))}
          </Card>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12 },
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
});
