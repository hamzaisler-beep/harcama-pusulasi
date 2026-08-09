// src/screens/SettingsScreen.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Image,
  Alert,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  updateProfile,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth";
import { auth, storage } from "../services/firebase";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import * as ImagePicker from "expo-image-picker";
import { COLORS } from "../theme/constants";
import { APP_VERSION } from "../theme/constants";

type View_ = "main" | "name" | "password";

const authErrorText = (code?: string) => {
  switch (code) {
    case "auth/wrong-password":
    case "auth/invalid-credential":
      return "Mevcut şifre hatalı.";
    case "auth/weak-password":
      return "Yeni şifre en az 6 karakter olmalı.";
    case "auth/requires-recent-login":
      return "Güvenlik için çıkış yapıp tekrar giriş yapın.";
    case "auth/too-many-requests":
      return "Çok fazla deneme yapıldı, biraz bekleyin.";
    default:
      return "İşlem tamamlanamadı, lütfen tekrar deneyin.";
  }
};

type Props = { onUpdate?: () => void };

export default function SettingsScreen({ onUpdate }: Props) {
  const user = auth.currentUser;
  const displayName = user?.displayName || user?.email?.split("@")[0] || "Kullanıcı";
  const initials = displayName.substring(0, 2).toUpperCase();

  const [view, setView] = useState<View_>("main");
  const [nameInput, setNameInput] = useState(displayName);
  const [currentPw, setCurrentPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [newPw2, setNewPw2] = useState("");
  const [showCurPw, setShowCurPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [busy, setBusy] = useState(false);
  const [photoUploading, setPhotoUploading] = useState(false);
  const [error, setError] = useState("");
  const [ok, setOk] = useState("");
  const [photoURL, setPhotoURL] = useState(user?.photoURL || "");

  const goView = (v: View_) => {
    setError("");
    setOk("");
    if (v === "name") setNameInput(auth.currentUser?.displayName || "");
    if (v === "password") { setCurrentPw(""); setNewPw(""); setNewPw2(""); }
    setView(v);
  };

  const handlePickPhoto = async () => {
    if (!user) return;
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("İzin Gerekli", "Fotoğraf seçmek için galeri iznine ihtiyaç var.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });
      if (result.canceled || !result.assets?.[0]?.uri) return;
      const uri = result.assets[0].uri;

      setPhotoUploading(true);
      setError("");

      const response = await fetch(uri);
      const blob = await response.blob();
      const storageRef = ref(storage, `avatars/${user.uid}.jpg`);
      await uploadBytes(storageRef, blob);
      const url = await getDownloadURL(storageRef);
      await updateProfile(user, { photoURL: url });
      setPhotoURL(url);
      onUpdate?.();
    } catch {
      setError("Fotoğraf yüklenemedi, lütfen tekrar deneyin.");
    } finally {
      setPhotoUploading(false);
    }
  };

  const handleSaveName = async () => {
    if (!user || !nameInput.trim()) return;
    setBusy(true);
    setError("");
    try {
      await updateProfile(user, { displayName: nameInput.trim() });
      setOk("Adınız güncellendi.");
      onUpdate?.();
      setView("main");
    } catch (e: any) {
      setError(authErrorText(e?.code));
    } finally {
      setBusy(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;
    if (newPw.length < 6) { setError("Yeni şifre en az 6 karakter olmalı."); return; }
    if (newPw !== newPw2) { setError("Yeni şifreler eşleşmiyor."); return; }
    setBusy(true);
    setError("");
    try {
      const cred = EmailAuthProvider.credential(user.email, currentPw);
      await reauthenticateWithCredential(user, cred);
      await updatePassword(user, newPw);
      setOk("Şifreniz değiştirildi.");
      setView("main");
    } catch (e: any) {
      setError(authErrorText(e?.code));
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = () => {
    auth.signOut();
  };

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

      {/* Profile Header */}
      <View style={styles.profileHeader}>
        <TouchableOpacity onPress={handlePickPhoto} style={styles.avatarWrap} disabled={photoUploading}>
          {photoURL ? (
            <Image source={{ uri: photoURL }} style={styles.avatarImg} />
          ) : (
            <View style={styles.avatarFallback}>
              <Text style={styles.avatarInitials}>{initials}</Text>
            </View>
          )}
          <View style={styles.avatarBadge}>
            {photoUploading
              ? <ActivityIndicator size={10} color="#fff" />
              : <MaterialIcons name="photo-camera" size={12} color="#fff" />
            }
          </View>
        </TouchableOpacity>
        <Text style={styles.profileName}>{auth.currentUser?.displayName || displayName}</Text>
        <Text style={styles.profileEmail}>{user?.email}</Text>
      </View>

      {!!ok && (
        <View style={styles.okBox}>
          <MaterialIcons name="check-circle-outline" size={16} color={COLORS.income} />
          <Text style={styles.okText}>{ok}</Text>
        </View>
      )}
      {!!error && (
        <View style={styles.errorBox}>
          <MaterialIcons name="error-outline" size={16} color={COLORS.expense} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {view === "main" && (
        <>
          <SectionHeader label="HESAP" />
          <SettingsCard>
            <SettingsRow icon="person-outline" label="Ad Soyad Düzenle" onPress={() => goView("name")} />
            <Divider />
            <SettingsRow icon="lock-outline" label="Şifre Değiştir" onPress={() => goView("password")} />
          </SettingsCard>

          <SectionHeader label="HAKKINDA" />
          <SettingsCard>
            <SettingsRow icon="info-outline" label="Uygulama Sürümü" value={APP_VERSION} />
            <Divider />
            <SettingsRow icon="star-outline" label="Uygulamayı Değerlendir" />
          </SettingsCard>

          <SectionHeader label="HESAP İŞLEMLERİ" />
          <SettingsCard>
            <TouchableOpacity style={styles.logoutRow} onPress={handleLogout}>
              <MaterialIcons name="logout" size={20} color={COLORS.expense} />
              <Text style={styles.logoutText}>Çıkış Yap</Text>
            </TouchableOpacity>
          </SettingsCard>
        </>
      )}

      {view === "name" && (
        <>
          <SectionHeader label="AD SOYAD" />
          <View style={styles.formCard}>
            <View style={styles.inputBox}>
              <MaterialIcons name="person-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={nameInput}
                onChangeText={setNameInput}
                placeholder="Ad Soyad"
                placeholderTextColor={COLORS.textMuted}
                autoFocus
                autoCapitalize="words"
              />
            </View>
            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => goView("main")}>
                <Text style={styles.cancelBtnText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, busy && { opacity: 0.7 }]} onPress={handleSaveName} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Kaydet</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}

      {view === "password" && (
        <>
          <SectionHeader label="ŞİFRE DEĞİŞTİR" />
          <View style={styles.formCard}>
            <Text style={styles.fieldLabel}>Mevcut Şifre</Text>
            <View style={styles.inputBox}>
              <MaterialIcons name="lock-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={currentPw}
                onChangeText={setCurrentPw}
                secureTextEntry={!showCurPw}
                placeholder="Mevcut şifreniz"
                placeholderTextColor={COLORS.textMuted}
                autoFocus
              />
              <TouchableOpacity onPress={() => setShowCurPw(s => !s)} style={styles.eyeBtn}>
                <MaterialIcons name={showCurPw ? "visibility-off" : "visibility"} size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Yeni Şifre</Text>
            <View style={styles.inputBox}>
              <MaterialIcons name="lock-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={newPw}
                onChangeText={setNewPw}
                secureTextEntry={!showNewPw}
                placeholder="En az 6 karakter"
                placeholderTextColor={COLORS.textMuted}
              />
              <TouchableOpacity onPress={() => setShowNewPw(s => !s)} style={styles.eyeBtn}>
                <MaterialIcons name={showNewPw ? "visibility-off" : "visibility"} size={20} color={COLORS.textMuted} />
              </TouchableOpacity>
            </View>

            <Text style={[styles.fieldLabel, { marginTop: 12 }]}>Yeni Şifre (Tekrar)</Text>
            <View style={styles.inputBox}>
              <MaterialIcons name="lock-outline" size={20} color={COLORS.textMuted} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={newPw2}
                onChangeText={setNewPw2}
                secureTextEntry={!showNewPw}
                placeholder="Şifreyi tekrar girin"
                placeholderTextColor={COLORS.textMuted}
              />
            </View>

            <View style={styles.btnRow}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => goView("main")}>
                <Text style={styles.cancelBtnText}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.saveBtn, busy && { opacity: 0.7 }]} onPress={handleChangePassword} disabled={busy}>
                {busy ? <ActivityIndicator color="#fff" size="small" /> : <Text style={styles.saveBtnText}>Değiştir</Text>}
              </TouchableOpacity>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );
}

const SectionHeader = ({ label }: { label: string }) => (
  <Text style={styles.sectionHeader}>{label}</Text>
);

const SettingsCard = ({ children }: { children: React.ReactNode }) => (
  <View style={styles.card}>{children}</View>
);

const Divider = () => <View style={styles.divider} />;

const SettingsRow = ({ icon, label, value, onPress }: { icon: any; label: string; value?: string; onPress?: () => void }) => (
  <TouchableOpacity style={styles.settingsRow} onPress={onPress} disabled={!onPress}>
    <MaterialIcons name={icon} size={20} color={COLORS.textSecondary} />
    <Text style={styles.settingsLabel}>{label}</Text>
    {value ? (
      <Text style={styles.settingsValue}>{value}</Text>
    ) : onPress ? (
      <MaterialIcons name="chevron-right" size={20} color={COLORS.textMuted} />
    ) : null}
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 48 },

  profileHeader: { alignItems: "center", paddingVertical: 28 },
  avatarWrap: { position: "relative", marginBottom: 14 },
  avatarImg: { width: 88, height: 88, borderRadius: 44, borderWidth: 2, borderColor: COLORS.primary },
  avatarFallback: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: "#78dcc8",
    alignItems: "center", justifyContent: "center",
  },
  avatarInitials: { fontSize: 28, fontWeight: "800", color: "#000" },
  avatarBadge: {
    position: "absolute", bottom: 2, right: 2,
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: COLORS.background,
  },
  profileName: { fontSize: 20, fontWeight: "800", color: "#fff", letterSpacing: -0.3 },
  profileEmail: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },

  okBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.income + "15",
    borderRadius: 10, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.income + "30",
  },
  okText: { color: COLORS.income, fontSize: 13, flex: 1 },
  errorBox: {
    flexDirection: "row", alignItems: "center", gap: 8,
    backgroundColor: COLORS.expense + "15",
    borderRadius: 10, padding: 12, marginBottom: 16,
    borderWidth: 1, borderColor: COLORS.expense + "30",
  },
  errorText: { color: COLORS.expense, fontSize: 13, flex: 1 },

  sectionHeader: {
    fontSize: 11, fontWeight: "700", color: COLORS.textMuted,
    letterSpacing: 1, marginBottom: 8, marginTop: 24, paddingHorizontal: 4,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16, borderWidth: 1, borderColor: COLORS.border,
    overflow: "hidden",
  },
  settingsRow: {
    flexDirection: "row", alignItems: "center", gap: 14,
    paddingHorizontal: 20, paddingVertical: 16,
  },
  settingsLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: COLORS.text },
  settingsValue: { fontSize: 13, color: COLORS.textMuted },
  divider: { height: 1, backgroundColor: COLORS.border, marginHorizontal: 20 },

  logoutRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingHorizontal: 20, paddingVertical: 16 },
  logoutText: { color: COLORS.expense, fontSize: 15, fontWeight: "700" },

  formCard: {
    backgroundColor: COLORS.card,
    borderRadius: 16, padding: 20,
    borderWidth: 1, borderColor: COLORS.border,
    marginTop: 4,
  },
  fieldLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: "700", marginBottom: 8, letterSpacing: 0.3 },
  inputBox: {
    height: 52, backgroundColor: COLORS.background,
    borderRadius: 12, flexDirection: "row", alignItems: "center",
    paddingHorizontal: 14, borderWidth: 1, borderColor: COLORS.border,
    marginBottom: 4,
  },
  inputIcon: { marginRight: 10 },
  input: { flex: 1, color: "#fff", fontSize: 15 },
  eyeBtn: { padding: 4 },

  btnRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  cancelBtn: {
    flex: 1, height: 48, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.04)",
    borderWidth: 1, borderColor: COLORS.border,
  },
  cancelBtnText: { color: COLORS.textSecondary, fontWeight: "700", fontSize: 14 },
  saveBtn: {
    flex: 1, height: 48, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    backgroundColor: COLORS.primary,
  },
  saveBtnText: { color: "#fff", fontWeight: "800", fontSize: 14 },
});
