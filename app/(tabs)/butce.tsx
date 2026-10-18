import React, { useMemo, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { router } from "expo-router";
import { AppText, Button, Card, ErrorNote, Screen } from "@/components/ui";
import { MonthSwitcher, startOfMonth } from "@/components/filters";
import { CategoryIcon } from "@/components/CategoryIcon";
import { BudgetRing, BudgetStatusText, ProgressBar } from "@/components/budget";
import { useReadySession } from "@/context/SessionContext";
import { toLite, useMonthTransactions } from "@/hooks/useMonthTransactions";
import { useBudgetLimits } from "@/lib/budget";
import { summarizeBudget } from "@/lib/budgetMath";
import { getCategory } from "@/lib/categories";
import { formatKurus } from "@/lib/format";
import { colors, fonts } from "@/theme";

function daysLeftInMonth(month: Date): number | null {
  const now = new Date();
  if (now.getFullYear() !== month.getFullYear() || now.getMonth() !== month.getMonth()) return null;
  const last = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  return last - now.getDate();
}

export default function ButceScreen() {
  const { household } = useReadySession();
  const [month, setMonth] = useState(startOfMonth());
  const { transactions, loading: txLoading, error } = useMonthTransactions(household.id, month);
  const { limits, loading: budgetLoading } = useBudgetLimits(household.id);

  const summary = useMemo(() => summarizeBudget(toLite(transactions), limits), [transactions, limits]);
  const loading = txLoading || budgetLoading;
  const daysLeft = daysLeftInMonth(month);
  const hasLimits = summary.categories.length > 0;

  return (
    <Screen testID="screen-butce">
      <View style={{ flexDirection: "row", alignItems: "flex-end", justifyContent: "space-between", gap: 12 }}>
        <View style={{ gap: 2, flexShrink: 1 }}>
          <AppText variant="small">Bütçe</AppText>
          <MonthSwitcher month={month} onChange={setMonth} />
        </View>
        {hasLimits && (
          <Button
            title="Limitler"
            variant="dark"
            onPress={() => router.push("/butce-duzenle")}
            style={{ minHeight: 40, paddingHorizontal: 14 }}
          />
        )}
      </View>

      <ErrorNote message={error} />

      {loading ? (
        <View style={{ paddingVertical: 32 }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : !hasLimits ? (
        <Card>
          <AppText variant="title">Henüz limit koymadın</AppText>
          <AppText variant="small" style={{ lineHeight: 21 }}>
            Market, yemek gibi kategorilere aylık limit koy. %80'e gelince ve limit aşılınca ikiniz de burada
            ve Ana Sayfa'da uyarı görürsünüz. Limitler her ay geçerli olur.
          </AppText>
          <Button title="Limit koy" onPress={() => router.push("/butce-duzenle")} />
        </Card>
      ) : (
        <>
          <Card style={{ flexDirection: "row", alignItems: "center", gap: 16 }}>
            <BudgetRing
              ratio={summary.totalLimit ? summary.totalSpentBudgeted / summary.totalLimit : 0}
              state={summary.totalState}
            />
            <View style={{ flex: 1, gap: 2 }}>
              <AppText variant="small">Harcanan / toplam limit</AppText>
              <AppText style={{ fontFamily: fonts.display, fontSize: 22 }} testID="budget-total">
                {formatKurus(summary.totalSpentBudgeted)}
                <AppText style={{ fontFamily: fonts.semibold, fontSize: 15, color: colors.muted }}>
                  {" "}/ {formatKurus(summary.totalLimit)}
                </AppText>
              </AppText>
              <AppText variant="caption">
                {summary.totalLimit - summary.totalSpentBudgeted >= 0
                  ? `${formatKurus(summary.totalLimit - summary.totalSpentBudgeted)} kaldı`
                  : `${formatKurus(summary.totalSpentBudgeted - summary.totalLimit)} aşıldı`}
                {daysLeft !== null ? ` · ay sonuna ${daysLeft} gün` : ""}
              </AppText>
            </View>
          </Card>

          <View style={{ gap: 10 }}>
            {summary.categories.map((c) => {
              const cat = getCategory(c.categoryId);
              return (
                <Card
                  key={c.categoryId}
                  style={{
                    gap: 10,
                    borderWidth: c.state === "over" ? 1.5 : 0,
                    borderColor: "#E7B9A0",
                  }}
                >
                  <View
                    style={{ flexDirection: "row", alignItems: "center", gap: 12 }}
                    accessibilityLabel={`${cat.name}: ${formatKurus(c.spent)} / ${formatKurus(c.limit)}`}
                  >
                    <CategoryIcon category={cat} size={34} iconSize={18} />
                    <AppText variant="bodyStrong" style={{ flex: 1 }}>
                      {cat.name}
                    </AppText>
                    <AppText style={{ fontSize: 14 }}>
                      <AppText style={{ fontFamily: fonts.semibold, fontSize: 14 }}>{formatKurus(c.spent)}</AppText>
                      <AppText style={{ fontSize: 14, color: colors.muted }}> / {formatKurus(c.limit)}</AppText>
                    </AppText>
                  </View>
                  <ProgressBar ratio={c.ratio} state={c.state} />
                  <BudgetStatusText state={c.state} spent={c.spent} limit={c.limit} />
                </Card>
              );
            })}
          </View>

          {summary.unbudgeted.length > 0 && (
            <View style={{ gap: 8 }}>
              <AppText variant="section">Limitsiz harcamalar</AppText>
              <Card style={{ paddingVertical: 4 }}>
                {summary.unbudgeted.map((u, i) => {
                  const cat = getCategory(u.categoryId);
                  return (
                    <View
                      key={u.categoryId}
                      style={{
                        flexDirection: "row",
                        alignItems: "center",
                        gap: 12,
                        paddingVertical: 10,
                        borderBottomWidth: i < summary.unbudgeted.length - 1 ? 1 : 0,
                        borderBottomColor: colors.lineSoft,
                      }}
                    >
                      <CategoryIcon category={cat} size={32} iconSize={17} />
                      <AppText style={{ flex: 1 }}>{cat.name}</AppText>
                      <AppText variant="bodyStrong">{formatKurus(u.spent)}</AppText>
                    </View>
                  );
                })}
              </Card>
            </View>
          )}
        </>
      )}
    </Screen>
  );
}
