import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText, Avatar, Button, Card, ErrorNote, Screen, TextField } from "@/components/ui";
import { ScreenHeader } from "@/components/ScreenHeader";
import { InviteCard } from "@/components/InviteCard";
import { useReadySession } from "@/context/SessionContext";
import { signOut, friendlyError } from "@/lib/auth";
import { renameHousehold } from "@/lib/household";
import { colors, fonts, memberColors } from "@/theme";

function HouseholdNameEditor({ householdId, name }: { householdId: string; name: string }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(name);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!editing) {
    return (
      <View style={[styles.row, styles.rowDivider, { justifyContent: "space-between" }]}>
        <View style={{ gap: 1, flex: 1 }}>
          <AppText variant="caption">Hane adı</AppText>
          <AppText>{name}</AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Hane adını değiştir"
          onPress={() => {
            setValue(name);
            setError(null);
            setEditing(true);
          }}
          hitSlop={8}
        >
          <AppText style={{ color: colors.accent, fontFamily: fonts.medium }}>Değiştir</AppText>
        </Pressable>
      </View>
    );
  }

  const save = async () => {
    setError(null);
    setBusy(true);
    try {
      await renameHousehold(householdId, value);
      setEditing(false);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={[styles.rowDivider, { gap: 10, paddingVertical: 12 }]}>
      <TextField label="Yeni hane adı" value={value} onChangeText={setValue} maxLength={40} autoFocus onSubmitEditing={save} />
      <ErrorNote message={error} />
      <View style={{ flexDirection: "row", gap: 8 }}>
        <Button title="Vazgeç" variant="secondary" onPress={() => setEditing(false)} disabled={busy} style={{ flex: 1 }} />
        <Button title="Kaydet" onPress={save} loading={busy} style={{ flex: 1 }} />
      </View>
    </View>
  );
}

export default function AyarlarScreen() {
  const { user, household, profile } = useReadySession();
  const [signingOut, setSigningOut] = useState(false);
  const myName = profile?.displayName || household.memberNames[user.uid] || "Ben";

  return (
    <Screen>
      <ScreenHeader title="Profil ve Ayarlar" />

      <Card style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <Avatar name={myName} color={colors.accent} size={56} />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="title">{myName}</AppText>
          <AppText variant="small">{user.email}</AppText>
        </View>
      </Card>

      <View style={{ gap: 8 }}>
        <AppText variant="section">Hane</AppText>
        <Card style={{ paddingVertical: 4 }}>
          <HouseholdNameEditor householdId={household.id} name={household.name} />
          {household.members.map((uid, i) => (
            <View
              key={uid}
              style={[styles.row, i < household.members.length - 1 && styles.rowDivider]}
            >
              <Avatar
                name={household.memberNames[uid] ?? "?"}
                color={memberColors[i % memberColors.length]}
                size={34}
              />
              <AppText style={{ flex: 1 }}>
                {household.memberNames[uid] ?? "Üye"}
                {uid === user.uid ? " (sen)" : ""}
              </AppText>
              <AppText variant="caption">{uid === household.ownerId ? "Kurucu" : "Üye"}</AppText>
            </View>
          ))}
        </Card>
        <AppText variant="caption" style={{ marginTop: 4 }}>
          Davet kodu: yeni üye bu kodla katılır
        </AppText>
        <InviteCard household={household} compact />
      </View>

      <View style={{ gap: 8 }}>
        <AppText variant="section">Yakında</AppText>
        <Card>
          <AppText variant="small" style={{ lineHeight: 21 }}>
            Hesaplar ve kartlar, kendi kategorilerin, bildirim ayarları, tema ve Excel'e aktarma sonraki aşamalarda buraya eklenecek.
          </AppText>
        </Card>
      </View>

      <Button
        title="Çıkış yap"
        variant="danger"
        loading={signingOut}
        onPress={async () => {
          setSigningOut(true);
          await signOut();
        }}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
});
