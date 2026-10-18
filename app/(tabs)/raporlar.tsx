import React, { useMemo, useState } from "react";
import { ActivityIndicator, Pressable, View } from "react-native";
import { AppText, Card, ErrorNote, Screen } from "@/components/ui";
import { addMonths, startOfMonth } from "@/components/filters";
import { HorizontalBars, MonthlyChart, ShareBar } from "@/components/charts";
import { useReadySession } from "@/context/SessionContext";
import { toLite, useRangeTransactions } from "@/hooks/useMonthTransactions";
import { expenseBreakdown, expenseByMember, monthlyTotals } from "@/lib/budgetMath";
import { getCategory } from "@/lib/categories";
import { formatKurus } from "@/lib/format";
import { colors, fonts, memberColors, radius } from "@/theme";

type Period = 1 | 3 | 6;
const PERIODS: { value: Period; label: string }[] = [
  { value: 1, label: "Bu ay" },
  { value: 3, label: "3 ay" },
  { value: 6, label: "6 ay" },
];
const TREND_MONTHS = 6;
const MAX_CATEGORY_ROWS = 7;

const monthShort = (d: Date) => {
  const s = d.toLocaleDateString("tr-TR", { month: "short" });
  return s.charAt(0).toLocaleUpperCase("tr-TR") + s.slice(1).replace(".", "");
};

export default function RaporlarScreen() {
  const { household } = useReadySession();
  const [period, setPeriod] = useState<Period>(1);

  // Tek sorgu: son 6 ay. Seçili dönem bunun içinden süzülür.
  const thisMonth = useMemo(() => startOfMonth(), []);
  const rangeStart = useMemo(() => addMonths(thisMonth, -(TREND_MONTHS - 1)), [thisMonth]);
  const rangeEnd = useMemo(() => addMonths(thisMonth, 1), [thisMonth]);
  const { transactions, loading, error } = useRangeTransactions(household.id, rangeStart, rangeEnd);

  const all = useMemo(() => toLite(transactions), [transactions]);
  const periodStart = useMemo(() => addMonths(thisMonth, -(period - 1)), [thisMonth, period]);
  const inPeriod = useMemo(() => all.filter((t) => t.date >= periodStart), [all, periodStart]);

  const breakdown = useMemo(() => expenseBreakdown(inPeriod), [inPeriod]);
  const totalExpense = breakdown.reduce((s, b) => s + b.spent, 0);
  const totalIncome = inPeriod.filter((t) => t.type === "income").reduce((s, t) => s + t.amountKurus, 0);

  // 7'den fazla kategori varsa kalanı "Diğerleri"nde topla.
  const categoryRows = useMemo(() => {
    const rows = breakdown.map((b) => ({
      key: b.categoryId,
      label: getCategory(b.categoryId).name,
      value: b.spent,
      share: b.share,
    }));
    if (rows.length <= MAX_CATEGORY_ROWS) return rows;
    const head = rows.slice(0, MAX_CATEGORY_ROWS - 1);
    const tail = rows.slice(MAX_CATEGORY_ROWS - 1);
    head.push({
      key: "__diger",
      label: "Diğerleri",
      value: tail.reduce((s, r) => s + r.value, 0),
      share: tail.reduce((s, r) => s + r.share, 0),
    });
    return head;
  }, [breakdown]);

  // Kayıt başlamadan önceki boş aylar çizilmesin (sıfırdan "fırlama" yanıltıcı olur).
  const trend = useMemo(() => {
    const months = monthlyTotals(all, thisMonth, TREND_MONTHS);
    const first = months.findIndex((m) => m.expense > 0 || m.income > 0);
    return (first === -1 ? months.slice(-1) : months.slice(first)).map((m) => ({
      label: monthShort(m.month),
      expense: m.expense,
      income: m.income,
    }));
  }, [all, thisMonth]);

  const byMember = useMemo(
    () =>
      expenseByMember(inPeriod, household.members).map((m, i) => ({
        key: m.uid,
        label: household.memberNames[m.uid] ?? "Üye",
        value: m.spent,
        share: m.share,
        color: memberColors[household.members.indexOf(m.uid) % memberColors.length] ?? memberColors[i % memberColors.length],
      })),
    [inPeriod, household],
  );

  const monthlyAvg = Math.round(totalExpense / period);

  return (
    <Screen testID="screen-raporlar">
      <AppText variant="display" accessibilityRole="header">
        Raporlar
      </AppText>

      <View
        accessibilityRole="tablist"
        style={{ flexDirection: "row", backgroundColor: colors.line, borderRadius: radius.md, padding: 4, gap: 4 }}
      >
        {PERIODS.map((p) => {
          const active = p.value === period;
          return (
            <Pressable
              key={p.value}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => setPeriod(p.value)}
              style={{
                flex: 1,
                height: 38,
                borderRadius: 10,
                alignItems: "center",
                justifyContent: "center",
                backgroundColor: active ? colors.surface : "transparent",
              }}
            >
              <AppText style={{ fontFamily: active ? fonts.semibold : fonts.regular, color: active ? colors.ink : colors.muted }}>
                {p.label}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <ErrorNote message={error} />

      {loading ? (
        <View style={{ paddingVertical: 32 }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <>
          <View style={{ flexDirection: "row", gap: 10 }}>
            <Card style={{ flex: 1, gap: 2 }}>
              <AppText variant="caption">Toplam gider</AppText>
              <AppText style={{ fontFamily: fonts.display, fontSize: 20 }} testID="report-expense">
                {formatKurus(totalExpense)}
              </AppText>
              {period > 1 && <AppText variant="caption">aylık ort. {formatKurus(monthlyAvg)}</AppText>}
            </Card>
            <Card style={{ flex: 1, gap: 2 }}>
              <AppText variant="caption">Toplam gelir</AppText>
              <AppText style={{ fontFamily: fonts.display, fontSize: 20, color: colors.accent }} testID="report-income">
                {formatKurus(totalIncome)}
              </AppText>
              {period > 1 && <AppText variant="caption">fark {formatKurus(totalIncome - totalExpense)}</AppText>}
            </Card>
          </View>

          <Card>
            <AppText variant="title" accessibilityRole="header">
              Nereye gitti?
            </AppText>
            {categoryRows.length === 0 ? (
              <AppText variant="small">Bu dönemde gider yok.</AppText>
            ) : (
              <HorizontalBars rows={categoryRows} />
            )}
          </Card>

          <Card>
            <AppText variant="title" accessibilityRole="header">
              Aylara göre
            </AppText>
            <MonthlyChart data={trend} />
            {trend.length < 2 && (
              <AppText variant="caption">Birkaç ay kayıt girince aylık değişim burada görünecek.</AppText>
            )}
          </Card>

          {household.members.length > 1 && (
            <Card>
              <AppText variant="title" accessibilityRole="header">
                Kim ne harcadı?
              </AppText>
              <ShareBar parts={byMember} />
            </Card>
          )}
        </>
      )}
    </Screen>
  );
}
