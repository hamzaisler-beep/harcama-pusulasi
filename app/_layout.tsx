import React, { useRef } from "react";
import { ActivityIndicator, View } from "react-native";
import { Stack } from "expo-router";
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
