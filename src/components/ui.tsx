import React from "react";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type PressableProps,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type TextStyle,
  type ViewStyle,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { colors, fonts, radius, space } from "../theme";

/* ---------- Yazı ---------- */

type TextVariant = "body" | "bodyStrong" | "small" | "caption" | "title" | "display" | "label" | "section";

const textStyles: Record<TextVariant, TextStyle> = {
  body: { fontFamily: fonts.regular, fontSize: 15, color: colors.ink },
  bodyStrong: { fontFamily: fonts.semibold, fontSize: 15, color: colors.ink },
  small: { fontFamily: fonts.regular, fontSize: 14, color: colors.muted },
  caption: { fontFamily: fonts.regular, fontSize: 12, color: colors.muted },
  label: { fontFamily: fonts.medium, fontSize: 13, color: colors.muted },
  title: { fontFamily: fonts.semibold, fontSize: 17, color: colors.ink },
  display: { fontFamily: fonts.display, fontSize: 28, color: colors.ink },
  section: {
    fontFamily: fonts.semibold,
    fontSize: 13,
    color: colors.muted,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
};

export function AppText({
  variant = "body",
  style,
  ...rest
}: TextProps & { variant?: TextVariant }) {
  return <Text {...rest} style={[textStyles[variant], style]} />;
}

/* ---------- Ekran kabı ---------- */

export function Screen({
  children,
  scroll = true,
  contentStyle,
  testID,
}: {
  children: React.ReactNode;
  scroll?: boolean;
  contentStyle?: StyleProp<ViewStyle>;
  /** Otomatik testlerin bu ekranı bulması için */
  testID?: string;
}) {
  const inner = scroll ? (
    <ScrollView
      contentContainerStyle={[styles.screenContent, contentStyle]}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  ) : (
    <View style={[styles.screenContent, { flex: 1 }, contentStyle]}>{children}</View>
  );
  return (
    <SafeAreaView style={styles.screen} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={styles.maxWidth} testID={testID}>
          {inner}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

/* ---------- Kart ---------- */

export function Card({
  children,
  style,
  highlighted,
}: {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  highlighted?: boolean;
}) {
  return <View style={[styles.card, highlighted && styles.cardHighlighted, style]}>{children}</View>;
}

/* ---------- Buton ---------- */

type ButtonVariant = "primary" | "dark" | "secondary" | "danger";

export function Button({
  title,
  onPress,
  variant = "primary",
  loading,
  disabled,
  icon,
  style,
  ...rest
}: Omit<PressableProps, "style" | "children"> & {
  title: string;
  variant?: ButtonVariant;
  loading?: boolean;
  icon?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const v = buttonVariants[variant];
  const isDisabled = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!isDisabled, busy: !!loading }}
      onPress={onPress}
      disabled={isDisabled}
      style={({ pressed }) => [
        styles.button,
        v.container,
        pressed && { opacity: 0.85 },
        isDisabled && { opacity: 0.55 },
        style,
      ]}
      {...rest}
    >
      {loading ? (
        <ActivityIndicator color={v.text.color as string} />
      ) : (
        <>
          {icon}
          <Text style={[styles.buttonText, v.text]}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}

const buttonVariants: Record<ButtonVariant, { container: ViewStyle; text: TextStyle }> = {
  primary: { container: { backgroundColor: colors.accent }, text: { color: colors.white } },
  dark: { container: { backgroundColor: colors.ink }, text: { color: colors.white } },
  secondary: {
    container: { backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.border },
    text: { color: colors.ink },
  },
  danger: {
    container: { backgroundColor: colors.surface, borderWidth: 1, borderColor: "#E7B9A0" },
    text: { color: colors.warnDeep },
  },
};

/* ---------- Giriş alanı ---------- */

export function TextField({
  label,
  style,
  ...rest
}: TextInputProps & { label: string; style?: StyleProp<TextStyle> }) {
  return (
    <View style={{ gap: 6 }}>
      <AppText variant="label">{label}</AppText>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#8A9893"
        style={[styles.input, style]}
        {...rest}
      />
    </View>
  );
}

/* ---------- Hata kutusu ---------- */

export function ErrorNote({ message }: { message: string | null }) {
  if (!message) return null;
  return (
    <View style={styles.error} accessibilityRole="alert">
      <AppText variant="small" style={{ color: colors.warnDeep }}>
        {message}
      </AppText>
    </View>
  );
}

/* ---------- Avatar ---------- */

export function Avatar({ name, color, size = 38 }: { name: string; color: string; size?: number }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: color,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Text style={{ color: colors.white, fontFamily: fonts.semibold, fontSize: size * 0.4 }}>
        {name.trim().charAt(0).toLocaleUpperCase("tr-TR") || "?"}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  maxWidth: { flex: 1, width: "100%", maxWidth: 560, alignSelf: "center" },
  screenContent: { padding: space.xl, gap: space.lg, paddingBottom: 40 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    padding: space.lg,
    gap: space.md,
  },
  cardHighlighted: { borderWidth: 2, borderColor: colors.accent },
  button: {
    minHeight: 50,
    borderRadius: radius.md,
    paddingHorizontal: space.lg,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: space.sm,
  },
  buttonText: { fontFamily: fonts.semibold, fontSize: 16 },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 14,
    fontFamily: fonts.regular,
    fontSize: 16,
    color: colors.ink,
    backgroundColor: colors.surfaceMuted,
  },
  error: {
    backgroundColor: colors.warnSoft,
    borderRadius: 12,
    padding: space.md,
  },
});
