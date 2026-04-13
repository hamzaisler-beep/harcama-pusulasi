// src/screens/ResetPasswordScreen.tsx
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { completePasswordReset } from "../services/authService";
import { COLORS } from "../types";

export default function ResetPasswordScreen({ route, navigation }: any) {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [success, setSuccess] = useState(false);

  // oobCode normally comes from deep link params
  const { oobCode } = route.params || {};

  useEffect(() => {
    if (!oobCode) {
      setErrorMessage("Geçersiz veya süresi dolmuş sıfırlama kodu.");
    }
  }, [oobCode]);

  const handleReset = async () => {
    if (!password || !confirmPassword) {
      setErrorMessage("Lütfen tüm alanları doldurun.");
      return;
    }
    if (password.length < 6) {
      setErrorMessage("Şifre en az 6 karakter olmalıdır.");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("Şifreler eşleşmiyor.");
      return;
    }

    setLoading(true);
    setErrorMessage("");

    try {
      await completePasswordReset(oobCode, password);
      setSuccess(true);
      setTimeout(() => {
        navigation.navigate("Login");
      }, 3000);
    } catch (error: any) {
      console.error("Complete reset error", error);
      let msg = "Şifre sıfırlama başarısız. Bağlantı geçersiz veya süresi dolmuş olabilir.";
      if (error.code === "auth/invalid-action-code") msg = "Geçersiz veya kullanılmış sıfırlama kodu.";
      else if (error.code === "auth/expired-action-code") msg = "Sıfırlama kodunun süresi dolmuş.";
      else if (error.code === "auth/weak-password") msg = "Şifre çok zayıf.";
      
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.successView}>
          <MaterialIcons name="check-circle" size={80} color={COLORS.income} />
          <Text style={styles.successTitle}>Şifreniz Güncellendi!</Text>
          <Text style={styles.successText}>Yeni şifrenizle giriş yapabilirsiniz. Yönlendiriliyorsunuz...</Text>
          <TouchableOpacity 
            style={styles.loginBtn} 
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.loginBtnText}>Hemen Giriş Yap</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.container}
      >
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <MaterialIcons name="arrow-back" size={24} color={COLORS.textPrimary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <MaterialIcons name="vpn-key" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Yeni Şifre Belirle</Text>
          <Text style={styles.subtitle}>Güvenliğiniz için güçlü bir şifre seçin.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Yeni Şifre</Text>
            <View style={[styles.inputWrapper, errorMessage && !password ? styles.inputError : null]}>
              <MaterialIcons name="lock" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errorMessage) setErrorMessage("");
                }}
                secureTextEntry
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>Şifre Tekrar</Text>
            <View style={[styles.inputWrapper, errorMessage && confirmPassword !== password ? styles.inputError : null]}>
              <MaterialIcons name="lock-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                value={confirmPassword}
                onChangeText={(text) => {
                  setConfirmPassword(text);
                  if (errorMessage) setErrorMessage("");
                }}
                secureTextEntry
              />
            </View>
          </View>

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={18} color={COLORS.expense} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.resetBtn, (loading || !oobCode) && styles.resetBtnDisabled]}
            onPress={handleReset}
            disabled={loading || !oobCode}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.resetBtnText}>Şifreyi Güncelle</Text>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: 24, justifyContent: "center" },
  backBtn: { position: "absolute", top: 20, left: 20, width: 40, height: 40, justifyContent: "center", zIndex: 10 },
  header: { alignItems: "center", marginBottom: 32 },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: "#fff",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  title: { fontSize: 26, fontWeight: "800", color: COLORS.textPrimary, marginBottom: 8 },
  subtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: "center" },
  form: { gap: 16 },
  inputGroup: { gap: 8 },
  label: { fontSize: 14, fontWeight: "600", color: COLORS.textPrimary, marginLeft: 4 },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
  },
  inputError: { borderColor: COLORS.expense },
  inputIcon: { marginRight: 8 },
  input: { flex: 1, paddingVertical: 14, fontSize: 16, color: COLORS.textPrimary },
  errorContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.expenseLight,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.expense,
  },
  errorText: { color: COLORS.expense, fontSize: 14, marginLeft: 8, fontWeight: "500" },
  resetBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 4,
  },
  resetBtnDisabled: { opacity: 0.7 },
  resetBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  successView: { flex: 1, justifyContent: "center", alignItems: "center", padding: 24 },
  successTitle: { fontSize: 24, fontWeight: "800", color: COLORS.textPrimary, marginTop: 24, marginBottom: 12 },
  successText: { fontSize: 16, color: COLORS.textSecondary, textAlign: "center", marginBottom: 32 },
  loginBtn: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: "center",
  },
  loginBtnText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
