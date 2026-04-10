// src/navigation/RootNavigator.tsx
import React from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { useAuth } from "../store/useAuthStore";
import AppNavigator from "./AppNavigator";
import AuthNavigator from "./AuthNavigator";
import { COLORS } from "../types";

export default function RootNavigator() {
  const { user, loading, initialized } = useAuth();

  if (!initialized || loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  return user ? <AppNavigator /> : <AuthNavigator />;
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
});
