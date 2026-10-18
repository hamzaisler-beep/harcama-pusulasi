// src/screens/SettingsScreen.tsx
import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, ActivityIndicator, Alert, useWindowDimensions
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { updateProfile, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from "firebase/auth";
import { auth } from "../services/firebase";
import { COLORS } from "../theme/constants";

type Props = { onLogout: () => void };

export default function SettingsScreen({ onLogout }: Props) {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [displayName, setDisplayName] = useState(auth.currentUser?.displayName || "");
  const [nameBusy, setNameBusy] = useState(false);
  const [nameMsg, setNameMsg] = useState("");

  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [pwBusy, setPwBusy] = useState(false);
  const [pwMsg, setPwMsg] = useState("");
  const [pwErr, setPwErr] = useState("");

  const handleSaveName = async () => {
    if (!displayName.trim()) return;
    setNameBusy(true); setNameMsg("");
    try {
      await updateProfile(auth.currentUser!, { displayName: displayName.trim() });
      setNameMsg("Profil güncellendi!");
    } catch { setNameMsg("Hata oluştu."); }
    finally { setNameBusy(false); }
  };

  const handleChangePw = async () => {
    if (newPw.length < 6) { setPwErr("Şifre en az 6 karakter olmalı."); return; }
    if (!currentPw) { setPwErr("Mevcut şifrenizi girin."); return; }
    setPwBusy(true); setPwErr(""); setPwMsg("");
    try {
      const user = auth.currentUser!;
      const cred = EmailAuthProvider.credential(user.email!, currentPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      setPwMsg("Şifre değiştirildi!"); setCurrentPw(""); setNewPw("");
    } catch (e: any) {
      setPwErr(e.code === "auth/wrong-password" || e.code === "auth/invalid-credential" ? "Mevcut şifre hatalı." : "Hata oluştu.");
    } finally { setPwBusy(false); }
  };

  const confirmLogout = () => {
    Alert.alert("Çıkış Yap", "Hesabınızdan çıkmak istiyor musunuz?", [
      { text: "Vazgeç", style: "cancel" },
      { text: "Çıkış Yap", style: "destructive", onPress: onLogout },
    ]);
  };

  const col = !isDesktop;

  return (
    <ScrollView style={s.container} contentContainerStyle={[s.scroll, { paddingBottom: 80 }]}>
      <Text style={s.pageTitle}>Ayarlar</Text>
      <View style={[s.row, col && { flexDirection: "column" }]}>
        {/* Profile Card */}
        <View style={[s.card, { flex: 1 }]}>
          <Text style={s.cardTitle}>Profil</Text>
          <Text style={s.lbl}>Ad Soyad</Text>
          <TextInput
            style={s.input} value={displayName} onChangeText={setDisplayName}
            placeholder="Ad Soyad" placeholderTextColor={COLORS.textMuted}
          />
          <Text style={s.lbl}>E-posta</Text>
          <TextInput
            style={[s.input, s.inputDisabled]} value={auth.currentUser?.email || ""}
            editable={false} placeholderTextColor={COLORS.textMuted}
          />
          <Text style={s.lbl}>Para Birimi</Text>
          <View style={s.selectBox}>
            <Text style={s.selectText}>₺ Türk Lirası</Text>
            <MaterialIcons name="expand-more" size={20} color={COLORS.textMuted} />
          </View>
          {!!nameMsg && <Text style={s.successText}>{nameMsg}</Text>}
          <TouchableOpacity style={s.saveBtn} onPress={handleSaveName} disabled={nameBusy}>
            {nameBusy ? <ActivityIndicator color="#000" size="small" /> : <Text style={s.saveBtnText}>Kaydet</Text>}
          </TouchableOpacity>
        </View>

        <View style={{ gap: 14, flex: 1 }}>
          {/* Plan Card */}
          <View style={s.card}>
            <View style={s.planHeader}>
              <Text style={s.cardTitle}>Plan</Text>
              <View style={s.proBadge}>
                <Text style={s.proStar}>⭐</Text>
                <Text style={s.proText}>PRO</Text>
              </View>
            </View>
            <Text style={s.planMsg}>Sınırsız kullanımın keyfini çıkarın. Teşekkürler! 🎉</Text>
          </View>

          {/* Change Password Card */}
          <View style={s.card}>
            <Text style={s.cardTitle}>Şifre Değiştir</Text>
            <Text style={s.lbl}>Mevcut Şifre</Text>
            <TextInput
              style={s.input} value={currentPw} onChangeText={setCurrentPw}
              secureTextEntry placeholder="••••••" placeholderTextColor={COLORS.textMuted}
            />
            <Text style={s.lbl}>Yeni Şifre</Text>
            <TextInput
              style={s.input} value={newPw} onChangeText={setNewPw}
              secureTextEntry placeholder="En az 6 karakter" placeholderTextColor={COLORS.textMuted}
            />
            {!!pwErr && <Text style={s.errText}>{pwErr}</Text>}
            {!!pwMsg && <Text style={s.successText}>{pwMsg}</Text>}
            <TouchableOpacity style={s.pwBtn} onPress={handleChangePw} disabled={pwBusy}>
              {pwBusy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={s.pwBtnText}>Şifreyi Güncelle</Text>}
            </TouchableOpacity>
          </View>

          {/* Logout */}
          <TouchableOpacity style={s.logoutBtn} onPress={confirmLogout}>
            <Text style={s.logoutText}>Çıkış Yap</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Text style={s.footer}>Tasarım & Geliştirme: <Text style={{ color: COLORS.primary }}>Tuma Bilişim</Text></Text>
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20 },
  pageTitle: { color: "#fff", fontSize: 22, fontWeight: "800", marginBottom: 16 },
  row: { flexDirection: "row", gap: 14 },
  card: { backgroundColor: COLORS.card, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14 },
  cardTitle: { color: "#fff", fontSize: 16, fontWeight: "800", marginBottom: 14 },
  lbl: { color: COLORS.textMuted, fontSize: 11, fontWeight: "700", marginBottom: 6 },
  input: { backgroundColor: COLORS.cardSecondary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, color: "#fff", fontSize: 14, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  inputDisabled: { opacity: 0.5 },
  selectBox: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", backgroundColor: COLORS.cardSecondary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12 },
  selectText: { color: COLORS.text, fontSize: 14 },
  saveBtn: { backgroundColor: COLORS.primary, borderRadius: 10, paddingVertical: 12, alignItems: "center", marginTop: 4 },
  saveBtnText: { color: "#000", fontWeight: "800", fontSize: 14 },
  planHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 10 },
  proBadge: { flexDirection: "row", alignItems: "center", gap: 4, backgroundColor: "rgba(0,201,167,0.15)", borderRadius: 8, paddingHorizontal: 10, paddingVertical: 4, borderWidth: 1, borderColor: "rgba(0,201,167,0.3)" },
  proStar: { fontSize: 12 },
  proText: { color: COLORS.primary, fontWeight: "800", fontSize: 12 },
  planMsg: { color: COLORS.textSecondary, fontSize: 13, lineHeight: 20 },
  pwBtn: { backgroundColor: COLORS.cardSecondary, borderRadius: 10, paddingVertical: 12, alignItems: "center", borderWidth: 1, borderColor: COLORS.border, marginTop: 4 },
  pwBtnText: { color: COLORS.text, fontWeight: "700", fontSize: 14 },
  errText: { color: COLORS.expense, fontSize: 12, marginBottom: 8 },
  successText: { color: COLORS.income, fontSize: 12, marginBottom: 8 },
  logoutBtn: { backgroundColor: "rgba(248,113,113,0.15)", borderRadius: 12, paddingVertical: 16, alignItems: "center", borderWidth: 1, borderColor: "rgba(248,113,113,0.3)" },
  logoutText: { color: COLORS.expense, fontWeight: "800", fontSize: 15 },
  footer: { textAlign: "center", color: COLORS.textMuted, fontSize: 11, marginTop: 24 },
});
