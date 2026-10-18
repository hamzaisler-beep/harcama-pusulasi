import React, { useEffect, useState } from "react";
import { ActivityIndicator, StyleSheet, TextInput, View } from "react-native";
import { router } from "expo-router";
import { AppText, Button, Card, ErrorNote, Screen } from "@/components/ui";
import { ScreenHeader } from "@/components/ScreenHeader";
import { CategoryIcon } from "@/components/CategoryIcon";
import { useReadySession } from "@/context/SessionContext";
import { saveBudgetLimits, useBudgetLimits } from "@/lib/budget";
import { categoriesFor } from "@/lib/categories";
import { kurusToInput, parseAmountToKurus } from "@/lib/money";
import { friendlyError } from "@/lib/auth";
import { formatKurus } from "@/lib/format";
import { colors, fonts } from "@/theme";

const expenseCategories = categoriesFor("expense");

export default function ButceDuzenleScreen() {
  const { household } = useReadySession();
  const { limits, loading } = useBudgetLimits(household.id);
  const [values, setValues] = useState<Record<string, string>>({});
  const [initialized, setInitialized] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mevcut limitleri forma bir kez doldur (sonraki canlı güncellemeler yazdığını ezmesin).
  useEffect(() => {
    if (loading || initialized) return;
    const v: Record<string, string> = {};
    for (const [k, kurus] of Object.entries(limits)) v[k] = kurusToInput(kurus);
    setValues(v);
    setInitialized(true);
  }, [loading, initialized, limits]);

  const total = expenseCategories.reduce((sum, c) => sum + (parseAmountToKurus(values[c.id] ?? "") ?? 0), 0);

  const save = async () => {
    setError(null);
    const parsed: Record<string, number | null> = {};
    for (const c of expenseCategories) {
      const raw = (values[c.id] ?? "").trim();
      if (!raw) continue;
      const k = parseAmountToKurus(raw);
      if (k === null) {
        setError(`${c.name} için tutarı anlayamadım. Örnek: 8000 ya da 8.000`);
        return;
      }
      parsed[c.id] = k;
    }
    setBusy(true);
    try {
      await saveBudgetLimits(household.id, parsed);
      router.canGoBack() ? router.back() : router.replace("/butce");
    } catch (e) {
      setError(friendlyError(e));
      setBusy(false);
    }
  };

  return (
    <Screen testID="screen-butce-duzenle">
      <ScreenHeader title="Aylık limitler" />
      <AppText variant="small" style={{ lineHeight: 21 }}>
        Limit koymak istediğin kategorilere aylık tutarı yaz. Boş bıraktıkların limitsiz olur. Limitler her ay
        için geçerlidir.
      </AppText>

      {loading || !initialized ? (
        <View style={{ paddingVertical: 32 }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : (
        <>
          <Card style={{ paddingVertical: 4 }}>
            {expenseCategories.map((c, i) => (
              <View key={c.id} style={[styles.row, i < expenseCategories.length - 1 && styles.divider]}>
                <CategoryIcon category={c} size={34} iconSize={18} />
                <AppText style={{ flex: 1 }}>{c.name}</AppText>
                <View style={styles.inputWrap}>
                  <TextInput
                    accessibilityLabel={`${c.name} limiti`}
                    value={values[c.id] ?? ""}
                    onChangeText={(t) => setValues((v) => ({ ...v, [c.id]: t.replace(/[^\d.,]/g, "") }))}
                    keyboardType="decimal-pad"
                    inputMode="decimal"
                    placeholder="Limitsiz"
                    placeholderTextColor="#8A9893"
                    style={styles.input}
                  />
                  <AppText style={{ color: colors.muted }}>₺</AppText>
                </View>
              </View>
            ))}
          </Card>

          <AppText variant="small" style={{ textAlign: "center" }}>
            Toplam aylık limit: <AppText style={{ fontFamily: fonts.semibold }}>{formatKurus(total)}</AppText>
          </AppText>

          <ErrorNote message={error} />
          <Button title="Kaydet" onPress={save} loading={busy} testID="save-budget" />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  divider: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: colors.surfaceMuted,
  },
  input: {
    width: 96,
    height: 40,
    textAlign: "right",
    fontFamily: fonts.medium,
    fontSize: 15,
    color: colors.ink,
  },
});
