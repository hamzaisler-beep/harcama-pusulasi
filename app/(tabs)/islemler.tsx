import React, { useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import { AppText, Button, Card, ErrorNote, Screen, TextField } from "@/components/ui";
import { Chip, MonthSwitcher, PersonFilter, startOfMonth } from "@/components/filters";
import { TransactionRow } from "@/components/TransactionRow";
import { useReadySession } from "@/context/SessionContext";
import { useMonthTransactions, useTotals } from "@/hooks/useMonthTransactions";
import { getCategory } from "@/lib/categories";
import { formatDayHeading, formatKurus } from "@/lib/format";
import { colors } from "@/theme";
import type { Transaction } from "@/types";

type TypeFilter = "all" | "expense" | "income";

function normalize(s: string): string {
  return s.toLocaleLowerCase("tr-TR").trim();
}

export default function IslemlerScreen() {
  const { user, household } = useReadySession();
  const [month, setMonth] = useState(startOfMonth());
  const [person, setPerson] = useState("all");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("all");
  const [search, setSearch] = useState("");

  const { transactions, loading, error } = useMonthTransactions(household.id, month);

  const filtered = useMemo(() => {
    const q = normalize(search);
    return transactions.filter((t) => {
      if (person !== "all" && t.createdBy !== person) return false;
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (q) {
        const haystack = normalize(`${getCategory(t.categoryId).name} ${t.note}`);
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [transactions, person, typeFilter, search]);

  const totals = useTotals(filtered);

  // Güne göre grupla (liste zaten yeniden eskiye sıralı).
  const groups = useMemo(() => {
    const out: { key: string; date: Date; items: Transaction[] }[] = [];
    for (const t of filtered) {
      const d = t.date.toDate();
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      const last = out[out.length - 1];
      if (last && last.key === key) last.items.push(t);
      else out.push({ key, date: d, items: [t] });
    }
    return out;
  }, [filtered]);

  return (
    <Screen testID="screen-islemler">
      <View style={{ gap: 2 }}>
        <AppText variant="small">İşlemler</AppText>
        <MonthSwitcher month={month} onChange={setMonth} />
      </View>

      <TextField
        label="Ara"
        value={search}
        onChangeText={setSearch}
        placeholder="Kategori ya da not"
        autoCorrect={false}
      />

      <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
        <Chip label="Tümü" selected={typeFilter === "all"} onPress={() => setTypeFilter("all")} />
        <Chip label="Giderler" selected={typeFilter === "expense"} onPress={() => setTypeFilter("expense")} />
        <Chip label="Gelirler" selected={typeFilter === "income"} onPress={() => setTypeFilter("income")} />
      </View>
      <PersonFilter household={household} myUid={user.uid} value={person} onChange={setPerson} />

      <Card style={{ flexDirection: "row", justifyContent: "space-between" }}>
        <View style={{ gap: 2 }}>
          <AppText variant="caption">Gelir</AppText>
          <AppText variant="bodyStrong" style={{ color: colors.accent }}>
            {formatKurus(totals.income)}
          </AppText>
        </View>
        <View style={{ gap: 2, alignItems: "center" }}>
          <AppText variant="caption">Gider</AppText>
          <AppText variant="bodyStrong">{formatKurus(totals.expense)}</AppText>
        </View>
        <View style={{ gap: 2, alignItems: "flex-end" }}>
          <AppText variant="caption">Fark</AppText>
          <AppText
            variant="bodyStrong"
            style={{ color: totals.balance < 0 ? colors.warnDeep : colors.ink }}
          >
            {formatKurus(totals.balance)}
          </AppText>
        </View>
      </Card>

      <ErrorNote message={error} />

      {loading ? (
        <View style={{ paddingVertical: 32 }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : groups.length === 0 ? (
        <Card style={{ alignItems: "flex-start" }}>
          <AppText variant="title">
            {transactions.length === 0 ? "Bu ay henüz işlem yok" : "Bu filtreye uyan işlem yok"}
          </AppText>
          {transactions.length === 0 && (
            <Button title="İlk işlemi ekle" onPress={() => router.navigate("/ekle")} style={{ alignSelf: "stretch" }} />
          )}
        </Card>
      ) : (
        groups.map((g) => (
          <View key={g.key} style={{ gap: 8 }}>
            <AppText variant="section">{formatDayHeading(g.date)}</AppText>
            <Card style={{ paddingVertical: 4 }}>
              {g.items.map((t, i) => (
                <TransactionRow
                  key={t.id}
                  tx={t}
                  household={household}
                  showDate={false}
                  last={i === g.items.length - 1}
                />
              ))}
            </Card>
          </View>
        ))
      )}
    </Screen>
  );
}
