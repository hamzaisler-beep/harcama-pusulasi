import React from "react";
import { Pressable, View } from "react-native";
import { Tabs } from "expo-router";
import { BarsIcon, HomeIcon, ListIcon, PieIcon, PlusIcon } from "@/components/icons";
import { colors, fonts } from "@/theme";

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.accent,
        tabBarInactiveTintColor: colors.muted,
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 12 },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.line,
          height: 72,
          paddingTop: 6,
        },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: "Ana Sayfa", tabBarIcon: ({ color }) => <HomeIcon color={color} /> }}
      />
      <Tabs.Screen
        name="islemler"
        options={{ title: "İşlemler", tabBarIcon: ({ color }) => <ListIcon color={color} /> }}
      />
      <Tabs.Screen
        name="ekle"
        options={{
          title: "Ekle",
          tabBarLabel: () => null,
          tabBarAccessibilityLabel: "İşlem ekle",
          tabBarButton: ({ onPress, accessibilityState }) => (
            <Pressable
              onPress={onPress}
              accessibilityRole="button"
              accessibilityLabel="İşlem ekle"
              accessibilityState={accessibilityState}
              style={{ flex: 1, alignItems: "center" }}
            >
              <View
                style={{
                  width: 58,
                  height: 58,
                  marginTop: -22,
                  borderRadius: 29,
                  backgroundColor: colors.accent,
                  alignItems: "center",
                  justifyContent: "center",
                  shadowColor: colors.accent,
                  shadowOpacity: 0.35,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 6 },
                  elevation: 6,
                }}
              >
                <PlusIcon color={colors.white} size={28} strokeWidth={2.4} />
              </View>
            </Pressable>
          ),
        }}
      />
      <Tabs.Screen
        name="butce"
        options={{ title: "Bütçe", tabBarIcon: ({ color }) => <PieIcon color={color} /> }}
      />
      <Tabs.Screen
        name="raporlar"
        options={{ title: "Raporlar", tabBarIcon: ({ color }) => <BarsIcon color={color} /> }}
      />
    </Tabs>
  );
}
