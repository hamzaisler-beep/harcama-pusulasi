// src/screens/RegisterScreen.tsx
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
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "../services/firebase";
import { COLORS } from "../theme/constants";

export default function RegisterScreen({ navigation }: any) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [password2, setPassword2] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    setError("");
    if (!name.trim()) { setError("Ad Soyad giriniz."); return; }
    if (!email.trim()) { setError("E-posta giriniz."); return; }
    if (password.length < 6) { setError("Şifre en az 6 karakter olmalı."); return; }
    if (password !== password2) { setError("Şifreler eşleşmiyor."); return; }

    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      await updateProfile(cred.user, { displayName: name.trim() });
    } catch (e: any) {
      const code = e?.code || "";
      if (code.includes("email-already-in-use")) setError("Bu e-posta zaten kullanımda.");
      else if (code.includes("invalid-email")) setError("Geçerli bir e-posta giriniz.");
      else setError("Kayıt başarısız, lütfen tekrar deneyin.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={{ flex: 1 }}>
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
          <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
            <MaterialIcons name="arrow-back" size={22} color={COLORS.textSecondary} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={styles.title}>Hesap Oluştur</Text>
            <Text style={styles.subtitle}>Birkaç adımda finansal takibe başla</Text>
          </View>

          <View style={styles.form}>
            {!!error && (
              <View style={styles.errorBox}>
                <MaterialIcons name="error-outline" size={16} color={COLORS.expense} />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Ad Soyad</Text>
              <View style={styles.inputBox}>
                <MaterialIcons name="person-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Adın ve soyadın"
                  placeholderTextColor={COLORS.textMuted}
                  value={name}
                  onChangeText={setName}
                  autoCapitalize="words"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>E-posta</Text>
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
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Şifre</Text>
              <View style={styles.inputBox}>
                <MaterialIcons name="lock-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="En az 6 karakter"
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

            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Şifre (Tekrar)</Text>
              <View style={styles.inputBox}>
                <MaterialIcons name="lock-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  placeholder="Şifreyi tekrar gir"
                  placeholderTextColor={COLORS.textMuted}
                  value={password2}
                  onChangeText={setPassword2}
                  secureTextEntry={!showPw}
                />
              </View>
            </View>

            <TouchableOpacity style={[styles.submitBtn, loading && { opacity: 0.7 }]} onPress={handleRegister} disabled={loading}>
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitBtnText}>Hesap Oluştur</Text>}
            </TouchableOpacity>

            <View style={styles.footer}>
              <Text style={styles.footerText}>Zaten hesabın var mı?</Text>
              <TouchableOpacity onPress={() => navigation.navigate("Login")}>
                <Text style={styles.footerLink}>Giriş Yap</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { flexGrow: 1, padding: 24, paddingTop: 12 },
  backBtn: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginBottom: 8 },
  header: { marginBottom: 28 },
  title: { fontSize: 26, fontWeight: "900", color: "#fff", letterSpacing: -0.5 },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 6 },
  form: { gap: 0 },
  errorBox: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.expense + "15", borderRadius: 10, padding: 12, marginBottom: 16, borderWidth: 1, borderColor: COLORS.expense + "30" },
  errorText: { color: COLORS.expense, fontSize: 13, flex: 1 },
  fieldGroup: { marginBottom: 16 },
  fieldLabel: { color: COLORS.textSecondary, fontSize: 12, fontWeight: "700", marginBottom: 8, letterSpacing: 0.3 },
  inputBox: { height: 56, backgroundColor: COLORS.card, borderRadius: 14, flexDirection: "row", alignItems: "center", paddingHorizontal: 16, borderWidth: 1, borderColor: COLORS.border },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: "#fff", fontSize: 15 },
  eyeBtn: { padding: 4 },
  submitBtn: { height: 56, backgroundColor: COLORS.primary, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 8 },
  submitBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  footer: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 24 },
  footerText: { color: COLORS.textMuted, fontSize: 14 },
  footerLink: { color: COLORS.primary, fontSize: 14, fontWeight: "700" },
});
