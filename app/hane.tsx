import React, { useState } from "react";
import { Pressable, View } from "react-native";
import { AppText, Button, Card, ErrorNote, Screen, TextField } from "@/components/ui";
import { useSession } from "@/context/SessionContext";
import { createHousehold, INVITE_CODE_LENGTH, joinHousehold, normalizeCode } from "@/lib/household";
import { friendlyError, signOut } from "@/lib/auth";
import { colors } from "@/theme";

export default function HaneScreen() {
  const { user } = useSession();
  const [name, setName] = useState("Ev Bütçemiz");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState<"create" | "join" | null>(null);
  const [error, setError] = useState<string | null>(null);

  if (!user) return null;

  const create = async () => {
    setError(null);
    setBusy("create");
    try {
      await createHousehold(user, name);
      // Oturum dinleyicisi haneyi görünce uygulama otomatik Ana Sayfa'ya geçer.
    } catch (e) {
      setError(friendlyError(e));
      setBusy(null);
    }
  };

  const join = async () => {
    setError(null);
    setBusy("join");
    try {
      await joinHousehold(user, code);
    } catch (e) {
      setError(friendlyError(e));
      setBusy(null);
    }
  };

  return (
    <Screen contentStyle={{ paddingTop: 40 }}>
      <View style={{ gap: 6 }}>
        <AppText variant="display" accessibilityRole="header">
          Hanen hazır mı?
        </AppText>
        <AppText variant="small" style={{ fontSize: 15, lineHeight: 22 }}>
          Tüm harcamalar bir haneye bağlı. Ya yeni bir hane kur ya da eşinin gönderdiği kodla katıl.
        </AppText>
      </View>

      <ErrorNote message={error} />

      <Card highlighted>
        <View style={{ gap: 4 }}>
          <AppText variant="title">Yeni hane oluştur</AppText>
          <AppText variant="small">Sen kurarsın, eşine davet kodu gönderirsin.</AppText>
        </View>
        <TextField label="Hane adı" value={name} onChangeText={setName} maxLength={40} />
        <Button title="Haneyi kur" onPress={create} loading={busy === "create"} disabled={busy !== null} />
      </Card>

      <Card>
        <View style={{ gap: 4 }}>
          <AppText variant="title">Davet koduyla katıl</AppText>
          <AppText variant="small">Eşinin gönderdiği {INVITE_CODE_LENGTH} karakterli kodu gir.</AppText>
        </View>
        <TextField
          label="Davet kodu"
          value={code}
          onChangeText={(t) => setCode(normalizeCode(t))}
          autoCapitalize="characters"
          autoCorrect={false}
          maxLength={INVITE_CODE_LENGTH}
          placeholder="Örn. K7P2QX"
          style={{ letterSpacing: 3 }}
        />
        <Button
          title="Katıl"
          variant="dark"
          onPress={join}
          loading={busy === "join"}
          disabled={busy !== null || code.length !== INVITE_CODE_LENGTH}
        />
      </Card>

      <Pressable accessibilityRole="button" onPress={signOut} style={{ alignSelf: "center", padding: 12 }}>
        <AppText variant="small" style={{ color: colors.accent }}>
          {user.email} · Çıkış yap
        </AppText>
      </Pressable>
    </Screen>
  );
}
