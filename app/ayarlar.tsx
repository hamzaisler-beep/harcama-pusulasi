import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { AppText, Avatar, Button, Card, Screen } from "@/components/ui";
import { ChevronLeft } from "@/components/icons";
import { InviteCard } from "@/components/InviteCard";
import { useReadySession } from "@/context/SessionContext";
import { signOut } from "@/lib/auth";
import { colors, memberColors } from "@/theme";

export default function AyarlarScreen() {
  const { user, household, profile } = useReadySession();
  const [signingOut, setSigningOut] = useState(false);
  const myName = profile?.displayName || household.memberNames[user.uid] || "Ben";

  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));

  return (
    <Screen>
      <View style={styles.header}>
        <Pressable accessibilityRole="button" accessibilityLabel="Geri" onPress={goBack} style={styles.back}>
          <ChevronLeft color={colors.ink} size={22} />
        </Pressable>
        <AppText variant="title" accessibilityRole="header">
          Profil ve Ayarlar
        </AppText>
        <View style={{ width: 44 }} />
      </View>

      <Card style={{ flexDirection: "row", alignItems: "center", gap: 14 }}>
        <Avatar name={myName} color={colors.accent} size={56} />
        <View style={{ flex: 1, gap: 2 }}>
          <AppText variant="title">{myName}</AppText>
          <AppText variant="small">{user.email}</AppText>
        </View>
      </Card>

      <View style={{ gap: 8 }}>
        <AppText variant="section">Hane · {household.name}</AppText>
        <Card style={{ paddingVertical: 4 }}>
          {household.members.map((uid, i) => (
            <View key={uid} style={[styles.row, styles.rowDivider]}>
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
          <View style={[styles.row, { justifyContent: "space-between" }]}>
            <View style={{ gap: 1 }}>
              <AppText>Davet kodu</AppText>
              <AppText variant="caption">Yeni üye bu kodla katılır</AppText>
            </View>
          </View>
        </Card>
        <InviteCard household={household} compact />
      </View>

      <View style={{ gap: 8 }}>
        <AppText variant="section">Yakında</AppText>
        <Card>
          <AppText variant="small" style={{ lineHeight: 21 }}>
            Hesaplar ve kartlar, kategoriler, bildirim ayarları, tema ve Excel'e aktarma sonraki aşamalarda buraya eklenecek.
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
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  back: { width: 44, height: 44, justifyContent: "center" },
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  rowDivider: { borderBottomWidth: 1, borderBottomColor: colors.lineSoft },
});
