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
  Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../services/firebase";
import { COLORS } from "../theme/constants";

export default function LoginScreen({ navigation }: any) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
    } catch (e: any) {
      Alert.alert("Giriş Hatası", "E-posta veya şifre hatalı.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : "height"} style={styles.content}>
        <View style={styles.header}>
            <View style={styles.logoBox}>
                <MaterialIcons name="explore" size={40} color={COLORS.primary} />
            </View>
            <Text style={styles.title}>Harcama Pusulası</Text>
            <Text style={styles.subtitle}>Finansal özgürlüğüne adım at.</Text>
        </View>

        <View style={styles.form}>
            <View style={styles.inputBox}>
                <MaterialIcons name="alternate-email" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput 
                    style={styles.input}
                    placeholder="E-posta"
                    placeholderTextColor={COLORS.textMuted}
                    value={email}
                    onChangeText={setEmail}
                    autoCapitalize="none"
                />
            </View>

            <View style={styles.inputBox}>
                <MaterialIcons name="lock-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
                <TextInput 
                    style={styles.input}
                    placeholder="Şifre"
                    placeholderTextColor={COLORS.textMuted}
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry
                />
            </View>

            <TouchableOpacity style={styles.loginBtn} onPress={handleLogin} disabled={loading}>
                {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.loginBtnText}>Giriş Yap</Text>}
            </TouchableOpacity>

            <View style={styles.footer}>
                <Text style={styles.footerText}>Hesabın yok mu?</Text>
                <TouchableOpacity onPress={() => navigation.navigate("Register")}>
                    <Text style={styles.footerLink}>Kayıt Ol</Text>
                </TouchableOpacity>
            </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { flex: 1, padding: 30, justifyContent: "center" },
  header: { alignItems: "center", marginBottom: 50 },
  logoBox: { width: 80, height: 80, borderRadius: 24, backgroundColor: COLORS.card, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: COLORS.border, marginBottom: 20 },
  title: { fontSize: 28, fontWeight: "900", color: "#fff" },
  subtitle: { fontSize: 14, color: COLORS.textMuted, marginTop: 8 },
  form: { gap: 16 },
  inputBox: { height: 60, backgroundColor: COLORS.card, borderRadius: 16, flexDirection: "row", alignItems: "center", paddingHorizontal: 20, borderWidth: 1, borderColor: COLORS.border },
  inputIcon: { marginRight: 12 },
  input: { flex: 1, color: "#fff", fontSize: 15 },
  loginBtn: { height: 60, backgroundColor: COLORS.primary, borderRadius: 16, alignItems: "center", justifyContent: "center", marginTop: 10 },
  loginBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
  footer: { flexDirection: "row", justifyContent: "center", gap: 8, marginTop: 20 },
  footerText: { color: COLORS.textMuted, fontSize: 14 },
  footerLink: { color: COLORS.primary, fontSize: 14, fontWeight: "700" },
});
