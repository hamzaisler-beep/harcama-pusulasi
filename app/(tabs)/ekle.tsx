import React, { useState } from "react";
import { router } from "expo-router";
import { AppText, Screen } from "@/components/ui";
import { TransactionForm } from "@/components/TransactionForm";
import { useReadySession } from "@/context/SessionContext";
import { addTransaction } from "@/lib/transactions";

export default function EkleScreen() {
  const { user, household } = useReadySession();
  // Kayıttan sonra formu sıfırlamak için anahtar.
  const [formKey, setFormKey] = useState(0);

  return (
    <Screen testID="screen-ekle">
      <AppText variant="display" accessibilityRole="header">
        Yeni işlem
      </AppText>
      <TransactionForm
        key={formKey}
        submitLabel="Kaydet"
        onSubmit={async (input) => {
          await addTransaction(household.id, user.uid, input);
          setFormKey((k) => k + 1);
          router.navigate("/");
        }}
      />
    </Screen>
  );
}
