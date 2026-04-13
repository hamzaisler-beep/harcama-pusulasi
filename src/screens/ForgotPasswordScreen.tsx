// src/screens/ForgotPasswordScreen.tsx
import React, { useState } from "react";
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
import { resetPassword } from "../services/authService";
import { COLORS } from "../types";

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  const handleReset = async () => {
    if (!email) {
      setErrorMessage("Lütfen e-posta adresinizi girin.");
      return;
    }

    setLoading(true);
    setErrorMessage("");
    setSuccessMessage("");

    try {
      await resetPassword(email);
      setSuccessMessage("Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.");
    } catch (error: any) {
      console.error("Reset password error", error);
      let msg = "İşlem başarısız. Bilgilerinizi kontrol edin.";
      if (error.code === "auth/user-not-found") msg = "Kullanıcı bulunamadı.";
      else if (error.code === "auth/invalid-email") msg = "Geçersiz e-posta adresi.";
      else if (error.code === "auth/network-request-failed") msg = "İnternet bağlantınızı kontrol edin.";
      
      setErrorMessage(msg);
    } finally {
      setLoading(false);
    }
  };

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
            <MaterialIcons name="lock-reset" size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.title}>Şifremi Unuttum</Text>
          <Text style={styles.subtitle}>E-posta adresinizi girerek şifrenizi sıfırlayabilirsiniz.</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>E-posta</Text>
            <View style={[styles.inputWrapper, errorMessage && !email ? styles.inputError : null]}>
              <MaterialIcons name="email" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="ornek@mail.com"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errorMessage) setErrorMessage("");
                  if (successMessage) setSuccessMessage("");
                }}
                autoCapitalize="none"
                keyboardType="email-address"
              />
            </View>
          </View>

          {errorMessage ? (
            <View style={styles.errorContainer}>
              <MaterialIcons name="error-outline" size={18} color={COLORS.expense} />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          {successMessage ? (
            <View style={styles.successContainer}>
              <MaterialIcons name="check-circle-outline" size={18} color={COLORS.income} />
              <Text style={styles.successText}>{successMessage}</Text>
            </View>
          ) : null}

          <TouchableOpacity
            style={[styles.resetBtn, (loading || !!successMessage) && styles.resetBtnDisabled]}
            onPress={handleReset}
            disabled={loading || !!successMessage}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.resetBtnText}>Sıfırlama Linki Gönder</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity 
            style={styles.footer} 
            onPress={() => navigation.navigate("Login")}
          >
            <Text style={styles.footerLink}>Giriş ekranına dön</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  container: { flex: 1, padding: 24, justifyContent: "center" },
  backBtn: { 
    position: "absolute",
    top: 20,
    left: 20,
    width: 40, 
    height: 40, 
    justifyContent: "center", 
    zIndex: 10 
  },
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
  subtitle: { fontSize: 15, color: COLORS.textSecondary, textAlign: "center", paddingHorizontal: 20 },
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
  successContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.incomeLight,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.income,
  },
  successText: { color: COLORS.income, fontSize: 14, marginLeft: 8, fontWeight: "500" },
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
  footer: { marginTop: 24, alignItems: "center" },
  footerLink: { color: COLORS.primary, fontSize: 14, fontWeight: "700" },
});
