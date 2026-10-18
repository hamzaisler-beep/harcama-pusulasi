import React, { useMemo, useRef, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { AppText, Button, ErrorNote, TextField } from "./ui";
import { CategoryGlyph } from "./CategoryIcon";
import { Chip } from "./filters";
import { categoriesFor, getCategory } from "../lib/categories";
import {
  PAYMENT_METHODS,
  kurusToInput,
  parseAmountToKurus,
  type TransactionInput,
} from "../lib/transactions";
import { formatNumericDate, isSameDay, parseNumericDate } from "../lib/format";
import { friendlyError } from "../lib/auth";
import { colors, fonts, radius } from "../theme";
import type { PaymentMethod, Transaction, TransactionType } from "../types";

type DayChoice = "today" | "yesterday" | "other";

function yesterday(): Date {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d;
}

function dayChoiceOf(date: Date): DayChoice {
  if (isSameDay(date, new Date())) return "today";
  if (isSameDay(date, yesterday())) return "yesterday";
  return "other";
}

const DEFAULT_CATEGORY: Record<TransactionType, string> = { expense: "market", income: "maas" };

export function TransactionForm({
  initial,
  submitLabel,
  onSubmit,
  onDelete,
}: {
  initial?: Transaction;
  submitLabel: string;
  onSubmit: (input: TransactionInput) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const initialDate = initial ? initial.date.toDate() : new Date();

  const [type, setType] = useState<TransactionType>(initial?.type ?? "expense");
  const [amountText, setAmountText] = useState(initial ? kurusToInput(initial.amountKurus) : "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId ?? DEFAULT_CATEGORY.expense);
  const [dayChoice, setDayChoice] = useState<DayChoice>(dayChoiceOf(initialDate));
  const [otherDateText, setOtherDateText] = useState(formatNumericDate(initialDate));
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initial?.paymentMethod ?? "kart");
  const [note, setNote] = useState(initial?.note ?? "");
  const [busy, setBusy] = useState<"save" | "delete" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const amountRef = useRef<TextInput>(null);

  const categories = useMemo(() => categoriesFor(type), [type]);

  const changeType = (t: TransactionType) => {
    setType(t);
    if (getCategory(categoryId).type !== t) setCategoryId(DEFAULT_CATEGORY[t]);
  };

  const resolveDate = (): Date | null => {
    if (dayChoice === "today") return new Date();
    if (dayChoice === "yesterday") return yesterday();
    return parseNumericDate(otherDateText);
  };

  const submit = async () => {
    setError(null);
    const amountKurus = parseAmountToKurus(amountText);
    if (amountKurus === null) {
      setError("Tutarı anlayamadım. Örnek: 850 ya da 1.250,50");
      amountRef.current?.focus();
      return;
    }
    const date = resolveDate();
    if (!date) {
      setError("Tarihi GG.AA.YYYY şeklinde yaz. Örnek: 05.10.2026");
      return;
    }
    setBusy("save");
    try {
      await onSubmit({ type, amountKurus, categoryId, date, note, paymentMethod });
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(null);
    }
  };

  const remove = async () => {
    if (!onDelete) return;
    setError(null);
    setBusy("delete");
    try {
      await onDelete();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <View style={{ gap: 18 }}>
      {/* Gelir / gider */}
      <View style={styles.segment} accessibilityRole="tablist">
        {(["expense", "income"] as const).map((t) => {
          const active = type === t;
          return (
            <Pressable
              key={t}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => changeType(t)}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
            >
              <AppText
                style={{
                  fontFamily: active ? fonts.semibold : fonts.regular,
                  color: active ? colors.ink : colors.muted,
                }}
              >
                {t === "expense" ? "Gider" : "Gelir"}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      {/* Tutar */}
      <View style={{ alignItems: "center", gap: 2 }}>
        <AppText variant="label">Tutar</AppText>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <TextInput
            ref={amountRef}
            accessibilityLabel="Tutar"
            testID="amount-input"
            value={amountText}
            onChangeText={(t) => setAmountText(t.replace(/[^\d.,]/g, ""))}
            keyboardType="decimal-pad"
            inputMode="decimal"
            placeholder="0"
            placeholderTextColor="#B9C5BF"
            autoFocus={!initial}
            style={styles.amountInput}
            onSubmitEditing={submit}
          />
          <AppText style={styles.currency}>₺</AppText>
        </View>
      </View>

      {/* Kategori */}
      <View style={{ gap: 10 }}>
        <AppText variant="bodyStrong" style={{ fontSize: 14 }}>
          Kategori
        </AppText>
        <View style={styles.grid}>
          {categories.map((c) => {
            const selected = c.id === categoryId;
            return (
              <Pressable
                key={c.id}
                accessibilityRole="button"
                accessibilityState={{ selected }}
                accessibilityLabel={`Kategori: ${c.name}`}
                onPress={() => setCategoryId(c.id)}
                style={[styles.categoryBtn, selected ? styles.categoryOn : styles.categoryOff]}
              >
                <CategoryGlyph category={c} />
                <AppText
                  numberOfLines={1}
                  style={{
                    fontSize: 12,
                    fontFamily: selected ? fonts.semibold : fonts.regular,
                    color: selected ? colors.accentDark : colors.ink,
                  }}
                >
                  {c.name}
                </AppText>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Tarih */}
      <View style={{ gap: 10 }}>
        <AppText variant="bodyStrong" style={{ fontSize: 14 }}>
          Tarih
        </AppText>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          <Chip label="Bugün" selected={dayChoice === "today"} onPress={() => setDayChoice("today")} />
          <Chip label="Dün" selected={dayChoice === "yesterday"} onPress={() => setDayChoice("yesterday")} />
          <Chip label="Başka gün" selected={dayChoice === "other"} onPress={() => setDayChoice("other")} />
        </View>
        {dayChoice === "other" && (
          <TextField
            label="Tarih (GG.AA.YYYY)"
            value={otherDateText}
            onChangeText={setOtherDateText}
            keyboardType="numbers-and-punctuation"
            placeholder="05.10.2026"
            maxLength={10}
          />
        )}
      </View>

      {/* Ödeme yöntemi */}
      <View style={{ gap: 10 }}>
        <AppText variant="bodyStrong" style={{ fontSize: 14 }}>
          {type === "expense" ? "Nasıl ödendi?" : "Nereye geldi?"}
        </AppText>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {PAYMENT_METHODS.filter((p) => type === "expense" || p.id !== "kart").map((p) => (
            <Chip
              key={p.id}
              label={p.label}
              selected={paymentMethod === p.id}
              onPress={() => setPaymentMethod(p.id)}
            />
          ))}
        </View>
      </View>

      <TextField label="Not (isteğe bağlı)" value={note} onChangeText={setNote} maxLength={120} placeholder="Örn. Migros haftalık" />

      <ErrorNote message={error} />

      <Button
        title={submitLabel}
        onPress={submit}
        loading={busy === "save"}
        disabled={busy !== null}
        testID="save-transaction"
      />
      {onDelete && (
        <Button
          title="Sil"
          variant="danger"
          onPress={remove}
          loading={busy === "delete"}
          disabled={busy !== null}
          testID="delete-transaction"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  segment: {
    flexDirection: "row",
    backgroundColor: colors.line,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  segmentItem: { flex: 1, height: 42, borderRadius: 11, alignItems: "center", justifyContent: "center" },
  segmentItemActive: { backgroundColor: colors.surface },
  amountInput: {
    minWidth: 120,
    maxWidth: 260,
    textAlign: "right",
    fontFamily: fonts.display,
    fontSize: 48,
    color: colors.ink,
    paddingVertical: 4,
  },
  currency: { fontFamily: fonts.displaySemi, fontSize: 34, color: colors.muted },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  categoryBtn: {
    width: "22.5%",
    minHeight: 72,
    borderRadius: radius.md,
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    paddingHorizontal: 4,
  },
  categoryOn: { borderWidth: 2, borderColor: colors.accent, backgroundColor: colors.accentSoft },
  categoryOff: { borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface },
});
