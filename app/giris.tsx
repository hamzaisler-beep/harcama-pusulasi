import React, { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { AppText, Button, ErrorNote, Screen, TextField } from "@/components/ui";
import { CompassIcon } from "@/components/icons";
import {
  friendlyError,
  googleSignInAvailable,
  signInWithEmail,
  signInWithGoogle,
  signUpWithEmail,
} from "@/lib/auth";
import { colors, fonts, radius } from "@/theme";

type Mode = "giris" | "kayit";

export default function GirisScreen() {
  const [mode, setMode] = useState<Mode>("giris");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState<"email" | "google" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    setError(null);
    if (mode === "kayit" && !name.trim()) {
      setError("Adını yaz; eşin seni bu isimle görecek.");
      return;
    }
    setBusy("email");
    try {
      if (mode === "giris") await signInWithEmail(email, password);
      else await signUpWithEmail(name, email, password);
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(null);
    }
  };

  const google = async () => {
    setError(null);
    setBusy("google");
    try {
      await signInWithGoogle();
    } catch (e) {
      setError(friendlyError(e));
    } finally {
      setBusy(null);
    }
  };

  return (
    <Screen contentStyle={{ paddingTop: 48, gap: 24 }}>
      <View style={{ gap: 14 }}>
        <View style={styles.logo} accessibilityElementsHidden importantForAccessibility="no">
          <CompassIcon color={colors.white} size={30} />
        </View>
        <AppText variant="display" style={{ fontSize: 32 }} accessibilityRole="header">
          HarcamaPusulası
        </AppText>
        <AppText variant="small" style={{ fontSize: 16, lineHeight: 23 }}>
          Evin bütçesini birlikte takip edin. Eşinin eklediği harcama anında senin ekranında da görünür.
        </AppText>
      </View>

      <View style={styles.segment} accessibilityRole="tablist">
        {(["giris", "kayit"] as const).map((m) => {
          const active = mode === m;
          return (
            <Pressable
              key={m}
              accessibilityRole="tab"
              accessibilityState={{ selected: active }}
              onPress={() => {
                setMode(m);
                setError(null);
              }}
              style={[styles.segmentItem, active && styles.segmentItemActive]}
            >
              <AppText
                style={{
                  fontFamily: active ? fonts.semibold : fonts.regular,
                  color: active ? colors.ink : colors.muted,
                }}
              >
                {m === "giris" ? "Giriş yap" : "Hesap oluştur"}
              </AppText>
            </Pressable>
          );
        })}
      </View>

      <View style={{ gap: 14 }}>
        {mode === "kayit" && (
          <TextField
            label="Adın"
            value={name}
            onChangeText={setName}
            autoComplete="name"
            textContentType="name"
            placeholder="Örn. Hamza"
          />
        )}
        <TextField
          label="E-posta"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          placeholder="ornek@mail.com"
        />
        <TextField
          label="Şifre"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoComplete={mode === "giris" ? "current-password" : "new-password"}
          textContentType={mode === "giris" ? "password" : "newPassword"}
          placeholder={mode === "kayit" ? "En az 6 karakter" : undefined}
          onSubmitEditing={submit}
        />
        <ErrorNote message={error} />
        <Button
          title={mode === "giris" ? "Giriş yap" : "Hesap oluştur"}
          onPress={submit}
          loading={busy === "email"}
          disabled={busy !== null}
        />
      </View>

      {googleSignInAvailable && (
        <>
          <View style={styles.divider}>
            <View style={styles.line} />
            <AppText variant="caption">veya</AppText>
            <View style={styles.line} />
          </View>
          <Button
            title="Google ile devam et"
            variant="secondary"
            onPress={google}
            loading={busy === "google"}
            disabled={busy !== null}
          />
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  logo: {
    width: 56,
    height: 56,
    borderRadius: 16,
    backgroundColor: colors.accentDark,
    alignItems: "center",
    justifyContent: "center",
  },
  segment: {
    flexDirection: "row",
    backgroundColor: colors.line,
    borderRadius: radius.md,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    height: 42,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  segmentItemActive: { backgroundColor: colors.surface },
  divider: { flexDirection: "row", alignItems: "center", gap: 12 },
  line: { flex: 1, height: 1, backgroundColor: colors.border },
});
