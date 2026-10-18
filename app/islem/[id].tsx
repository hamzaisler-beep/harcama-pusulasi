import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { doc, onSnapshot } from "firebase/firestore";
import { AppText, Card, Screen } from "@/components/ui";
import { ScreenHeader } from "@/components/ScreenHeader";
import { TransactionForm } from "@/components/TransactionForm";
import { useReadySession } from "@/context/SessionContext";
import { db } from "@/lib/firebase";
import { deleteTransaction, updateTransaction } from "@/lib/transactions";
import { confirmAction } from "@/lib/confirm";
import { formatShortDate } from "@/lib/format";
import { colors } from "@/theme";
import type { Transaction } from "@/types";

type LoadState = { status: "loading" } | { status: "missing" } | { status: "ready"; tx: Transaction };

export default function IslemDuzenleScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { household } = useReadySession();
  const [state, setState] = useState<LoadState>({ status: "loading" });
  // Silme sırasında "bulunamadı" ekranı yanıp sönmesin.
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!id) return;
    return onSnapshot(
      doc(db, "households", household.id, "transactions", id),
      (snap) => {
        if (!snap.exists()) setState({ status: "missing" });
        else setState({ status: "ready", tx: { id: snap.id, ...snap.data() } as Transaction });
      },
      () => setState({ status: "missing" }),
    );
  }, [household.id, id]);

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/islemler"));

  return (
    <Screen>
      <ScreenHeader title="İşlemi düzenle" />

      {state.status === "loading" && (
        <View style={{ paddingVertical: 40 }}>
          <ActivityIndicator color={colors.accent} />
        </View>
      )}

      {state.status === "missing" && !deleting && (
        <Card>
          <AppText variant="title">İşlem bulunamadı</AppText>
          <AppText variant="small">Silinmiş olabilir.</AppText>
        </Card>
      )}

      {state.status === "ready" && (
        <>
          <AppText variant="caption">
            {household.memberNames[state.tx.createdBy] ?? "Üye"} ekledi
            {state.tx.createdAt ? ` · ${formatShortDate(state.tx.createdAt.toDate())}` : ""}
          </AppText>
          <TransactionForm
            key={state.tx.id}
            initial={state.tx}
            submitLabel="Değişiklikleri kaydet"
            onSubmit={async (input) => {
              await updateTransaction(household.id, state.tx.id, input);
              goBack();
            }}
            onDelete={async () => {
              const ok = await confirmAction("İşlem silinsin mi?", "Bu işlem iki kullanıcıdan da silinir.");
              if (!ok) return;
              setDeleting(true);
              try {
                await deleteTransaction(household.id, state.tx.id);
                goBack();
              } catch (e) {
                setDeleting(false);
                throw e;
              }
            }}
          />
        </>
      )}
    </Screen>
  );
}
