import React, { useEffect, useRef } from "react";
import { ActivityIndicator, Platform, View } from "react-native";
import { Stack, router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useFonts } from "expo-font";
import {
  Figtree_400Regular,
  Figtree_500Medium,
  Figtree_600SemiBold,
} from "@expo-google-fonts/figtree";
import {
  BricolageGrotesque_600SemiBold,
  BricolageGrotesque_700Bold,
} from "@expo-google-fonts/bricolage-grotesque";
import { SessionProvider, useSession, type SessionStatus } from "@/context/SessionContext";
import { colors } from "@/theme";

function Loading() {
  return (
    <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: colors.bg }}>
      <ActivityIndicator color={colors.accent} size="large" />
    </View>
  );
}

function RootNavigator() {
  const { status: liveStatus } = useSession();
  // İlk açılıştan sonraki kısa "yükleniyor" anlarında ekranı sökme;
  // son bilinen durumda kal. Böylece açık ekranlardaki hata mesajları kaybolmaz.
  const lastSettled = useRef<Exclude<SessionStatus, "loading"> | null>(null);
  if (liveStatus !== "loading") lastSettled.current = liveStatus;
  const status = liveStatus === "loading" ? lastSettled.current : liveStatus;

  // Web'de sayfa /islemler gibi bir adreste yenilenirse, oturum yüklenene kadar
  // adres kaybolup Ana Sayfa'ya düşülüyordu. İlk adresi saklayıp geri dön.
  const initialPath = useRef<string | null>(
    Platform.OS === "web" && typeof window !== "undefined"
      ? window.location.pathname + window.location.search
      : null,
  );
  useEffect(() => {
    if (status !== "ready" || !initialPath.current) return;
    const target = initialPath.current;
    initialPath.current = null;
    if (target !== "/" && !target.startsWith("/giris") && !target.startsWith("/hane")) {
      router.replace(target as never);
    }
  }, [status]);

  if (status === null) return <Loading />;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg } }}>
      <Stack.Protected guard={status === "signedOut"}>
        <Stack.Screen name="giris" />
      </Stack.Protected>
      <Stack.Protected guard={status === "needsHousehold"}>
        <Stack.Screen name="hane" />
      </Stack.Protected>
      <Stack.Protected guard={status === "ready"}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="ayarlar" />
        <Stack.Screen name="islem/[id]" />
        <Stack.Screen name="butce-duzenle" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Figtree_400Regular,
    Figtree_500Medium,
    Figtree_600SemiBold,
    BricolageGrotesque_600SemiBold,
    BricolageGrotesque_700Bold,
  });

  return (
    <SafeAreaProvider>
      <StatusBar style="dark" />
      {fontsLoaded ? (
        <SessionProvider>
          <RootNavigator />
        </SessionProvider>
      ) : (
        <Loading />
      )}
    </SafeAreaProvider>
  );
}
