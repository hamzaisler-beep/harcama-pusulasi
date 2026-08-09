// src/screens/LoginScreen.tsx
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
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { COLORS } from "../theme/constants";

const FEATURES = [
  { icon: "swap-vert" as const, text: "Gelir & gider takibi" },
  { icon: "pie-chart" as const, text: "Bütçe & hedef yönetimi" },
  { icon: "trending-up" as const, text: "Yatırım & tasarruf analizi" },
];

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async () => {
    setError("");
    if (!email.trim()) { setError("E-posta adresinizi giriniz."); return; }
    if (!password) { setError("Şifrenizi giriniz."); return; }
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e: any) {
      const code = e?.code || "";
      if (code.includes("user-not-found") || code.includes("wrong-password") || code.includes("invalid-credential")) {
        setError("E-posta veya şifre hatalı.");
      } else if (code.includes("too-many-requests")) {
        setError("Çok fazla deneme. Lütfen bir süre bekleyin.");
      } else {
        setError("Giriş başarısız, lütfen tekrar deneyin.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Hero */}
          <View style={styles.hero}>
            <View style={styles.logoBox}>
              <MaterialIcons name="account-balance-wallet" size={44} color={COLORS.primary} />
            </View>
            <Text style={styles.appName}>Harcama Pusulası</Text>
            <Text style={styles.tagline}>Paranı daha iyi tanı.</Text>

            <View style={styles.features}>
              {FEATURES.map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <View style={styles.featureIcon}>
                    <MaterialIcons name={f.icon} size={16} color={COLORS.primary} />
                  </View>
                  <Text style={styles.featureText}>{f.text}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Form */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Giriş Yap</Text>

            {!!error && (
              <View style={styles.errorBox}>
                <MaterialIcons name="error-outline" size={16} color={COLORS.expense} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>E-POSTA</Text>
              <View style={styles.inputBox}>
                <MaterialIcons name="alternate-email" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="ornek@email.com"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                  autoCorrect={false}
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.fieldLabel}>ŞİFRE</Text>
                <TouchableOpacity onPress={() => navigation.navigate("ForgotPassword")}>
                  <Text style={styles.forgotLink}>Şifremi Unuttum</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.inputBox}>
                <MaterialIcons name="lock-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Şifreniz"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPw}
                />
                <TouchableOpacity onPress={() => setShowPw(!showPw)} style={styles.eyeBtn}>
                  <MaterialIcons name={showPw ? "visibility-off" : "visibility"} size={20} color={COLORS.textMuted} />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginBtn, loading && { opacity: 0.7 }]}
              onPress={handleLogin}
              disabled={loading}
            >
              {loading
                ? <ActivityIndicator color="#fff" />
                : <Text style={styles.loginBtnText}>Giriş Yap</Text>
              }
            </TouchableOpacity>

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>veya</Text>
              <View style={styles.dividerLine} />
            </View>

            <TouchableOpacity style={styles.registerBtn} onPress={() => navigation.navigate("Register")}>
              <Text style={styles.registerBtnText}>Hesap Oluştur</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scroll: { flexGrow: 1, padding: 24, paddingBottom: 40 },

  hero: { alignItems: "center", paddingTop: 24, paddingBottom: 36 },
  logoBox: {
    width: 88, height: 88, borderRadius: 28,
    backgroundColor: COLORS.primary + "18",
    borderWidth: 1, borderColor: COLORS.primary + "40",
    alignItems: "center", justifyContent: "center",
    marginBottom: 20,
  },
  appName: { fontSize: 28, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  tagline: { fontSize: 15, color: COLORS.textMuted, marginTop: 8, marginBottom: 24 },

  features: { gap: 10, alignSelf: "stretch" },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  featureIcon: {
    width: 30, height: 30, borderRadius: 8,
    backgroundColor: COLORS.primary + "18",
    alignItems: "center", justifyContent: "center",
  },
  featureText: { color: COLORS.textSecondary, fontSize: 14 },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cardTitle: { fontSize: 20, fontWeight: "900", color: "#fff", marginBottom: 20, letterSpacing: -0.3 },

  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.expense + "15",
    borderRadius: 10, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.expense + "30",
  },
  errorText: { color: COLORS.expense, fontSize: 13, flex: 1 },

  fieldGroup: { marginBottom: 16 },
  labelRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 },
  fieldLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: "700", letterSpacing: 0.5 },
  forgotLink: { color: COLORS.primary, fontSize: 12, fontWeight: "600" },

  inputBox: {
    height: 56, backgroundColor: COLORS.background,
    borderRadius: 14, flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.border,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: "#fff", fontSize: 15 },
  eyeBtn: { padding: 4 },

  loginBtn: {
    height: 56, backgroundColor: COLORS.primary,
    borderRadius: 14, alignItems: "center", justifyContent: "center",
    marginTop: 4,
  },
  loginBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginVertical: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: COLORS.border },
  dividerText: { color: COLORS.textMuted, fontSize: 13 },

  registerBtn: {
    height: 56, borderRadius: 14,
    borderWidth: 1.5, borderColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
  },
  registerBtnText: { color: COLORS.primary, fontSize: 16, fontWeight: "800" },
});
