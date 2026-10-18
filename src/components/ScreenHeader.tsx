import React from "react";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { AppText } from "./ui";
import { ChevronLeft } from "./icons";
import { colors } from "../theme";

/** Geri butonu + ortada başlık. Geçmiş yoksa Ana Sayfa'ya döner. */
export function ScreenHeader({ title, right }: { title: string; right?: React.ReactNode }) {
  const goBack = () => (router.canGoBack() ? router.back() : router.replace("/"));
  return (
    <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between" }}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Geri"
        onPress={goBack}
        style={{ width: 44, height: 44, justifyContent: "center" }}
      >
        <ChevronLeft color={colors.ink} size={22} />
      </Pressable>
      <AppText variant="title" accessibilityRole="header">
        {title}
      </AppText>
      <View style={{ width: 44, alignItems: "flex-end" }}>{right}</View>
    </View>
  );
}
