// src/screens/ForgotPasswordScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "../services/firebase";
import { COLORS } from "../theme/constants";

export default function ForgotPasswordScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleReset = async () => {
    setError("");
    if (!email.trim()) { setError("E-posta adresinizi giriniz."); return; }
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email.trim());
      setSent(true);
    } catch (e: any) {
      const code = e?.code || "";
      if (code.includes("user-not-found") || code.includes("invalid-email")) {
        setError("Bu e-posta ile kayıtlı hesap bulunamadı.");
      } else {
        setError("Bir hata oluştu, lütfen tekrar deneyin.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <View style={styles.content}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>

          {!sent ? (
            <>
              <View style={styles.header}>
                <View style={styles.iconBox}>
                  <MaterialIcons name="lock-reset" size={32} color={COLORS.primary} />
                </View>
                <Text style={styles.title}>Şifre Sıfırlama</Text>
                <Text style={styles.subtitle}>
                  Kayıtlı e-posta adresine şifre sıfırlama bağlantısı göndereceğiz.
                </Text>
              </View>

              {!!error && (
                <View style={styles.errorBox}>
                  <MaterialIcons name="error-outline" size={16} color={COLORS.expense} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              )}

              <View style={styles.inputBox}>
                <MaterialIcons name="alternate-email" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="E-posta adresin"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoFocus
                />
              </View>

              <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleReset} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Sıfırlama Maili Gönder</Text>}
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.successBox}>
              <View style={styles.successIconBox}>
                <MaterialIcons name="mark-email-read" size={48} color={COLORS.income} />
              </View>
              <Text style={styles.successTitle}>Mail Gönderildi!</Text>
              <Text style={styles.successText}>
                <Text style={{ color: COLORS.text, fontWeight: "700" }}>{email}</Text>
                {" "}adresine şifre sıfırlama bağlantısı gönderdik.{"\n\n"}Gelen kutunu kontrol et ve bağlantıya tıkla.
              </Text>
              <TouchableOpacity style={styles.backToLoginBtn} onPress={() => navigation.navigate("Login")}>
                <Text style={styles.backToLoginText}>Giriş Sayfasına Dön</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: 24, paddingTop: 12 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginBottom: 16 },
  header: { marginBottom: 28 },
  iconBox: { width: 64, height: 64, borderRadius: 20, backgroundColor: COLORS.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  title: { fontSize: 24, fontWeight: "900", color: "#fff", letterSpacing: -0.5, marginBottom: 10 },
  subtitle: { fontSize: 14, color: COLORS.textMuted, lineHeight: 21 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.expense + "15", borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: COLORS.expense + "30" },
  errorText: { color: COLORS.expense, fontSize: 13, flex: 1 },
  inputBox: { height: 56, backgroundColor: COLORS.card, borderRadius: 14, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: "#fff", fontSize: 15 },
  submitBtn: { height: 56, backgroundColor: COLORS.primary, borderRadius: 14, alignItems: "center", justifyContent: "center" },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  successBox: { flex: 1, justifyContent: "center", alignItems: "center", paddingHorizontal: 8 },
  successIconBox: { width: 100, height: 100, borderRadius: 30, backgroundColor: COLORS.income + "15", alignItems: "center", justifyContent: "center", marginBottom: 24, borderWidth: 1, borderColor: COLORS.income + "30" },
  successTitle: { fontSize: 24, fontWeight: "900", color: "#fff", marginBottom: 16 },
  successText: { fontSize: 14, color: COLORS.textMuted, textAlign: "center", lineHeight: 22, marginBottom: 32 },
  backToLoginBtn: { height: 56, backgroundColor: COLORS.primary, borderRadius: 14, alignItems: "center", justifyContent: "center", paddingHorizontal: 32, width: "100%" },
  backToLoginText: { color: "#fff", fontSize: 15, fontWeight: "800" },
});
