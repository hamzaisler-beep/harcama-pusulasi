// src/screens/FamilyScreen.tsx
// Aile oluşturma, davet kodu ile üye ekleme ve ortak finansal rapor
import React, { useState, useEffect, useMemo } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput,
  ActivityIndicator, Alert, Share, useWindowDimensions, Modal
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import {
  doc, setDoc, getDoc, collection, query, where, onSnapshot,
  arrayUnion, arrayRemove, deleteDoc, updateDoc
} from "firebase/firestore";
import { db, auth } from "../services/firebase";
import { format, subMonths, startOfMonth, parseISO } from "date-fns";
import { tr } from "date-fns/locale";
import { COLORS, MONO } from "../theme/constants";
import { formatTRY } from "../utils/format";

interface Family {
  id: string;
  name: string;
  ownerId: string;
  members: string[];        // user UIDs
  memberEmails: string[];   // for display
  inviteCode: string;
  createdAt: string;
}

interface MemberStats {
  uid: string;
  email: string;
  income: number;
  expense: number;
}

const monthKey = (d: string) => {
  try { return format(d.includes("T") ? parseISO(d) : new Date(d), "yyyy-MM"); }
  catch { return ""; }
};

const genCode = () => Math.random().toString(36).substring(2, 8).toUpperCase();

export default function FamilyScreen() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 900;

  const [family, setFamily] = useState<Family | null>(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [joining, setJoining] = useState(false);
  const [familyName, setFamilyName] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [view, setView] = useState<"main" | "create" | "join">("main");

  // Member transactions from Firestore
  const [memberStats, setMemberStats] = useState<MemberStats[]>([]);
  const [statsUnsubs, setStatsUnsubs] = useState<(() => void)[]>([]);

  const user = auth.currentUser!;
  const thisMonth = format(new Date(), "yyyy-MM");

  // Load user's family
  useEffect(() => {
    const q = query(collection(db, "families"), where("members", "array-contains", user.uid));
    const unsub = onSnapshot(q, snap => {
      if (snap.empty) { setFamily(null); setLoading(false); return; }
      const f = { id: snap.docs[0].id, ...snap.docs[0].data() } as Family;
      setFamily(f);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Load member stats when family changes
  useEffect(() => {
    statsUnsubs.forEach(u => u());
    if (!family) { setMemberStats([]); return; }

    const stats: Record<string, MemberStats> = {};
    family.members.forEach((uid, i) => {
      stats[uid] = { uid, email: family.memberEmails?.[i] || uid, income: 0, expense: 0 };
    });

    const newUnsubs: (() => void)[] = [];
    family.members.forEach(uid => {
      const q = query(collection(db, "transactions"), where("familyId", "==", `personal_${uid}`));
      const unsub = onSnapshot(q, snap => {
        let inc = 0, exp = 0;
        snap.docs.forEach(d => {
          const tx = d.data();
          const val = Math.abs(Number(tx.amount) || 0);
          if (monthKey(tx.date || tx.createdAt?.toDate?.().toISOString() || "") === thisMonth) {
            if (tx.type === "income") inc += val;
            else exp += val;
          }
        });
        setMemberStats(prev => {
          const next = [...prev];
          const idx = next.findIndex(s => s.uid === uid);
          const updated = { ...stats[uid], income: inc, expense: exp };
          if (idx >= 0) next[idx] = updated; else next.push(updated);
          return [...next];
        });
      });
      newUnsubs.push(unsub);
    });
    setStatsUnsubs(newUnsubs);
    return () => newUnsubs.forEach(u => u());
  }, [family?.id]);

  const totals = useMemo(() => {
    const inc = memberStats.reduce((s, m) => s + m.income, 0);
    const exp = memberStats.reduce((s, m) => s + m.expense, 0);
    return { income: inc, expense: exp, net: inc - exp };
  }, [memberStats]);

  // Create family
  const handleCreate = async () => {
    if (!familyName.trim()) return;
    setBusy(true);
    try {
      const code = genCode();
      const id = Date.now().toString(36);
      const data: Family = {
        id, name: familyName.trim(), ownerId: user.uid,
        members: [user.uid], memberEmails: [user.email || user.uid],
        inviteCode: code, createdAt: new Date().toISOString(),
      };
      await setDoc(doc(db, "families", id), data);
      setView("main");
    } catch (e) { Alert.alert("Hata", "Aile oluşturulamadı."); }
    finally { setBusy(false); }
  };

  // Join via code
  const handleJoin = async () => {
    if (!inviteCode.trim()) return;
    setBusy(true);
    try {
      const q = query(collection(db, "families"), where("inviteCode", "==", inviteCode.trim().toUpperCase()));
      const snap = await new Promise<any>((res, rej) => {
        const unsub = onSnapshot(q, s => { unsub(); res(s); }, rej);
      });
      if (snap.empty) { Alert.alert("Hata", "Geçersiz davet kodu."); setBusy(false); return; }
      const fDoc = snap.docs[0];
      await updateDoc(doc(db, "families", fDoc.id), {
        members: arrayUnion(user.uid),
        memberEmails: arrayUnion(user.email || user.uid),
      });
      setView("main");
    } catch { Alert.alert("Hata", "Davet kodunu kontrol edin."); }
    finally { setBusy(false); }
  };

  // Leave family
  const handleLeave = () => {
    Alert.alert("Aileden Ayrıl", "Aileden ayrılmak istiyor musunuz?", [
      { text: "Vazgeç", style: "cancel" },
      {
        text: "Ayrıl", style: "destructive",
        onPress: async () => {
          if (!family) return;
          if (family.ownerId === user.uid) {
            // Owner deletes the whole family
            await deleteDoc(doc(db, "families", family.id));
          } else {
            await updateDoc(doc(db, "families", family.id), {
              members: arrayRemove(user.uid),
              memberEmails: arrayRemove(user.email || user.uid),
            });
          }
        }
      },
    ]);
  };

  // Share invite
  const handleShare = async () => {
    if (!family) return;
    const msg = `FinFlow ailem "${family.name}"e katılmak için davet kodunu kullan:\n\nKod: ${family.inviteCode}\n\nUygulama üzerinden Aile > Aileye Katıl kısmından bu kodu gir.`;
    try { await Share.share({ message: msg }); } catch { }
  };

  if (loading) {
    return (
      <View style={s.loadingWrap}>
        <ActivityIndicator size="large" color={COLORS.primary} />
      </View>
    );
  }

  // No family yet
  if (!family) {
    if (view === "create") {
      return (
        <View style={s.formWrap}>
          <TouchableOpacity onPress={() => setView("main")} style={s.backBtn}>
            <MaterialIcons name="arrow-back" size={20} color={COLORS.primary} />
            <Text style={s.backText}>Geri</Text>
          </TouchableOpacity>
          <Text style={s.formTitle}>Aile Oluştur</Text>
          <Text style={s.lbl}>Aile Adı</Text>
          <TextInput style={s.input} value={familyName} onChangeText={setFamilyName}
            placeholder="Örn: Yılmaz Ailesi" placeholderTextColor={COLORS.textMuted} autoFocus />
          <TouchableOpacity style={s.primaryBtn} onPress={handleCreate} disabled={busy}>
            {busy ? <ActivityIndicator color="#000" /> : <Text style={s.primaryBtnText}>Aile Oluştur</Text>}
          </TouchableOpacity>
        </View>
      );
    }
    if (view === "join") {
      return (
        <View style={s.formWrap}>
          <TouchableOpacity onPress={() => setView("main")} style={s.backBtn}>
            <MaterialIcons name="arrow-back" size={20} color={COLORS.primary} />
            <Text style={s.backText}>Geri</Text>
          </TouchableOpacity>
          <Text style={s.formTitle}>Aileye Katıl</Text>
          <Text style={s.lbl}>Davet Kodu</Text>
          <TextInput style={s.input} value={inviteCode} onChangeText={setInviteCode}
            placeholder="6 haneli kod (örn: AB1234)" placeholderTextColor={COLORS.textMuted}
            autoCapitalize="characters" autoFocus />
          <TouchableOpacity style={s.primaryBtn} onPress={handleJoin} disabled={busy}>
            {busy ? <ActivityIndicator color="#000" /> : <Text style={s.primaryBtnText}>Katıl</Text>}
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={s.emptyWrap}>
        <Text style={s.emptyEmoji}>👨‍👩‍👧‍👦</Text>
        <Text style={s.emptyTitle}>Henüz bir aileniz yok</Text>
        <Text style={s.emptyDesc}>Aile oluşturun veya bir aileye katılın. Ortak gelir/gider takibi yapın.</Text>
        <TouchableOpacity style={s.primaryBtn} onPress={() => setView("create")}>
          <MaterialIcons name="group-add" size={18} color="#000" />
          <Text style={s.primaryBtnText}>Aile Oluştur</Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.secondaryBtn} onPress={() => setView("join")}>
          <MaterialIcons name="login" size={18} color={COLORS.primary} />
          <Text style={s.secondaryBtnText}>Aileye Katıl (Davet Kodu)</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Family exists — show dashboard
  const col = !isDesktop;
  return (
    <ScrollView style={s.container} contentContainerStyle={[s.scroll, { paddingBottom: 80 }]}>
      {/* Family Header */}
      <View style={s.familyHeader}>
        <View>
          <Text style={s.familyName}>👨‍👩‍👧‍👦 {family.name}</Text>
          <Text style={s.familyMeta}>{family.members.length} üye · Bu Ay</Text>
        </View>
        <TouchableOpacity style={s.leaveBtn} onPress={handleLeave}>
          <Text style={s.leaveBtnText}>{family.ownerId === user.uid ? "Aileyi Sil" : "Ayrıl"}</Text>
        </TouchableOpacity>
      </View>

      {/* Invite Code Card */}
      <View style={s.inviteCard}>
        <View>
          <Text style={s.inviteLbl}>Davet Kodu</Text>
          <Text style={s.inviteCode}>{family.inviteCode}</Text>
          <Text style={s.inviteHint}>Bu kodu paylaşarak aile üyesi ekleyebilirsiniz</Text>
        </View>
        <TouchableOpacity style={s.shareBtn} onPress={handleShare}>
          <MaterialIcons name="share" size={18} color="#000" />
          <Text style={s.shareBtnText}>Paylaş</Text>
        </TouchableOpacity>
      </View>

      {/* Totals KPI */}
      <View style={[s.kpiRow, col && { flexDirection: "column" }]}>
        <View style={s.kpiCard}>
          <Text style={s.kpiLbl}>Bu Ay Toplam Gelir</Text>
          <Text style={[s.kpiVal, { color: COLORS.income }]}>{formatTRY(totals.income)}</Text>
        </View>
        <View style={s.kpiCard}>
          <Text style={s.kpiLbl}>Bu Ay Toplam Gider</Text>
          <Text style={[s.kpiVal, { color: COLORS.expense }]}>{formatTRY(totals.expense)}</Text>
        </View>
        <View style={s.kpiCard}>
          <Text style={s.kpiLbl}>Bu Ay Net</Text>
          <Text style={[s.kpiVal, { color: totals.net >= 0 ? COLORS.income : COLORS.expense }]}>
            {totals.net >= 0 ? "+" : ""}{formatTRY(totals.net)}
          </Text>
        </View>
      </View>

      {/* Member Breakdown */}
      <View style={s.membersCard}>
        <Text style={s.sectionTitle}>Üye Bazında Rapor</Text>
        {memberStats.length === 0 ? (
          <Text style={s.emptyText}>Henüz veri yok.</Text>
        ) : (
          memberStats.map((m) => (
            <View key={m.uid} style={s.memberRow}>
              <View style={s.memberAvatar}>
                <Text style={s.memberAvatarText}>
                  {(m.email || "?").substring(0, 2).toUpperCase()}
                </Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.memberEmail}>{m.email}</Text>
                {m.uid === family.ownerId && <Text style={s.ownerBadge}>Kurucu</Text>}
              </View>
              <View style={{ alignItems: "flex-end" }}>
                <Text style={[s.memberInc, { color: COLORS.income }]}>+{formatTRY(m.income)}</Text>
                <Text style={[s.memberExp, { color: COLORS.expense }]}>-{formatTRY(m.expense)}</Text>
              </View>
            </View>
          ))
        )}
      </View>

      {/* Progress bars per member */}
      {memberStats.length > 1 && (
        <View style={s.membersCard}>
          <Text style={s.sectionTitle}>Gider Dağılımı (Üye)</Text>
          {memberStats.map((m) => {
            const total = memberStats.reduce((s, x) => s + x.expense, 0) || 1;
            const pct = (m.expense / total) * 100;
            return (
              <View key={m.uid} style={s.barRow}>
                <Text style={s.barLabel} numberOfLines={1}>{m.email.split("@")[0]}</Text>
                <View style={s.barTrack}>
                  <View style={[s.barFill, { width: `${pct}%` as any }]} />
                </View>
                <Text style={s.barPct}>%{Math.round(pct)}</Text>
              </View>
            );
          })}
        </View>
      )}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 20 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.background },
  formWrap: { flex: 1, backgroundColor: COLORS.background, padding: 24 },
  backBtn: { flexDirection: "row", alignItems: "center", gap: 6, marginBottom: 24 },
  backText: { color: COLORS.primary, fontSize: 14, fontWeight: "600" },
  formTitle: { color: "#fff", fontSize: 24, fontWeight: "800", marginBottom: 24 },
  lbl: { color: COLORS.textMuted, fontSize: 11, fontWeight: "700", marginBottom: 8 },
  input: { backgroundColor: COLORS.cardSecondary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 14, color: "#fff", fontSize: 15, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14 },

  emptyWrap: { flex: 1, backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center", padding: 32, gap: 14 },
  emptyEmoji: { fontSize: 64 },
  emptyTitle: { color: "#fff", fontSize: 22, fontWeight: "800", textAlign: "center" },
  emptyDesc: { color: COLORS.textSecondary, fontSize: 14, textAlign: "center", lineHeight: 22 },

  primaryBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: COLORS.primary, borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, alignSelf: "stretch", justifyContent: "center" },
  primaryBtnText: { color: "#000", fontWeight: "800", fontSize: 15 },
  secondaryBtn: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: "rgba(0,201,167,0.1)", borderRadius: 12, paddingHorizontal: 24, paddingVertical: 14, borderWidth: 1, borderColor: "rgba(0,201,167,0.3)", alignSelf: "stretch", justifyContent: "center" },
  secondaryBtnText: { color: COLORS.primary, fontWeight: "800", fontSize: 15 },

  familyHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 16 },
  familyName: { color: "#fff", fontSize: 22, fontWeight: "800" },
  familyMeta: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  leaveBtn: { backgroundColor: "rgba(248,113,113,0.15)", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6, borderWidth: 1, borderColor: "rgba(248,113,113,0.3)" },
  leaveBtnText: { color: COLORS.expense, fontWeight: "700", fontSize: 12 },

  inviteCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: "rgba(0,201,167,0.3)", marginBottom: 14, flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  inviteLbl: { color: COLORS.textMuted, fontSize: 11, fontWeight: "700", marginBottom: 6 },
  inviteCode: { color: COLORS.primary, fontSize: 28, fontWeight: "900", fontFamily: MONO, letterSpacing: 4, marginBottom: 4 },
  inviteHint: { color: COLORS.textMuted, fontSize: 11 },
  shareBtn: { flexDirection: "row", alignItems: "center", gap: 6, backgroundColor: COLORS.primary, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10 },
  shareBtnText: { color: "#000", fontWeight: "800", fontSize: 13 },

  kpiRow: { flexDirection: "row", gap: 12, marginBottom: 14 },
  kpiCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  kpiLbl: { color: COLORS.textMuted, fontSize: 11, fontWeight: "600", marginBottom: 8 },
  kpiVal: { fontSize: 20, fontWeight: "800", fontFamily: MONO },

  membersCard: { backgroundColor: COLORS.card, borderRadius: 12, padding: 20, borderWidth: 1, borderColor: COLORS.border, marginBottom: 14 },
  sectionTitle: { color: "#fff", fontSize: 15, fontWeight: "800", marginBottom: 14 },
  memberRow: { flexDirection: "row", alignItems: "center", paddingVertical: 12, borderBottomWidth: 1, borderColor: COLORS.border, gap: 12 },
  memberAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: "center", justifyContent: "center" },
  memberAvatarText: { color: "#000", fontWeight: "800", fontSize: 14 },
  memberEmail: { color: COLORS.text, fontSize: 13, fontWeight: "600" },
  ownerBadge: { color: COLORS.primary, fontSize: 10, fontWeight: "700", marginTop: 2 },
  memberInc: { fontSize: 13, fontWeight: "700", fontFamily: MONO },
  memberExp: { fontSize: 13, fontWeight: "700", fontFamily: MONO },
  emptyText: { color: COLORS.textMuted, fontSize: 13, textAlign: "center", paddingVertical: 16 },

  barRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 12 },
  barLabel: { color: COLORS.textSecondary, fontSize: 12, width: 80 },
  barTrack: { flex: 1, height: 8, backgroundColor: COLORS.track, borderRadius: 4, overflow: "hidden" },
  barFill: { height: "100%", borderRadius: 4, backgroundColor: COLORS.primary },
  barPct: { color: COLORS.textMuted, fontSize: 11, width: 32, textAlign: "right" },
});
