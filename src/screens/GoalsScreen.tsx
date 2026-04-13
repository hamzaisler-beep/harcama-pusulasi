import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  useWindowDimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import { useGoals } from "../store/useStore";
import { COLORS } from "../types";
import { formatCurrency } from "../utils/format";

const GOAL_ICONS = ["🎯", "🚗", "🏠", "🏖️", "📱", "💻", "💍", "💰", "🎓"];

export default function GoalsScreen() {
  const { goals, addGoal, deleteGoal, updateGoal, isLoaded } = useGoals();
  const [title, setTitle] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [selectedIcon, setSelectedIcon] = useState("🎯");
  const { width } = useWindowDimensions();
  const isWeb = width > 1024;

  if (!isLoaded) {
    return (
        <View style={[styles.safe, { justifyContent: 'center', alignItems: 'center' }]}>
            <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
    );
  }

  const handleAdd = () => {
    const target = parseFloat(targetAmount.replace(",", "."));
    if (!title || isNaN(target) || target <= 0) {
      Alert.alert("Hata", "Lütfen geçerli bir başlık ve miktar girin.");
      return;
    }
    
    addGoal({
      title,
      targetAmount: target,
      currentAmount: 0,
      icon: selectedIcon,
      color: COLORS.primary
    });
    
    setTitle("");
    setTargetAmount("");
    Alert.alert("Başarılı", "Birikim hedefi oluşturuldu.");
  };

  const handleUpdate = (id: string, current: number) => {
    Alert.prompt(
        "Miktarı Güncelle",
        "Mevcut birikim miktarını girin:",
        [
            { text: "İptal", style: "cancel" },
            { 
                text: "Güncelle", 
                onPress: (val) => {
                    const parsed = parseFloat(val || "0");
                    if (!isNaN(parsed)) updateGoal(id, parsed);
                }
            }
        ],
        "plain-text",
        current.toString()
    );
  };

  const totalTarget = goals.reduce((s, g) => s + g.targetAmount, 0);
  const totalCurrent = goals.reduce((s, g) => s + g.currentAmount, 0);
  const totalProgress = totalTarget > 0 ? (totalCurrent / totalTarget) * 100 : 0;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.content, isWeb && styles.webContent]} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
            <View>
                <Text style={styles.title}>Birikim Hedefleri</Text>
                <Text style={styles.subtitle}>Geleceğiniz için hedeflerinizi belirleyin</Text>
            </View>
        </View>

        <View style={styles.summaryCard}>
            <View style={styles.summaryInfo}>
                <View>
                    <Text style={styles.summaryLabel}>TOPLAM BİRİKİM PLANI</Text>
                    <Text style={styles.summaryValue}>{formatCurrency(totalCurrent)}</Text>
                </View>
                <View style={styles.summaryBadge}>
                    <Text style={styles.summaryBadgeText}>%{totalProgress.toFixed(0)}</Text>
                </View>
            </View>
            <View style={styles.mainProgressBg}>
                <View style={[styles.mainProgressFill, { width: `${totalProgress}%` }]} />
            </View>
            <Text style={styles.summaryTarget}>Tablo Hedef: {formatCurrency(totalTarget)}</Text>
        </View>

        <View style={[styles.mainGrid, isWeb && styles.mainGridWeb]}>
            <View style={styles.leftCol}>
                <Text style={styles.sectionTitle}>Aktif Hedefler</Text>
                <View style={styles.goalsGrid}>
                    {goals.map(goal => (
                        <View key={goal.id} style={[styles.goalCard, isWeb && styles.goalCardWeb]}>
                            <View style={styles.goalHeader}>
                                <View style={styles.goalIconBox}>
                                    <Text style={styles.goalIcon}>{goal.icon}</Text>
                                </View>
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.goalTitle}>{goal.title}</Text>
                                    <Text style={styles.goalAmounts}>
                                        {formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}
                                    </Text>
                                </View>
                                <TouchableOpacity onPress={() => handleUpdate(goal.id, goal.currentAmount)} style={styles.editBtn}>
                                    <MaterialIcons name="add-circle-outline" size={24} color={COLORS.primary} />
                                </TouchableOpacity>
                            </View>

                            <View style={styles.progressContainer}>
                                <View style={styles.progressHeader}>
                                    <View style={styles.progressBg}>
                                        <View 
                                            style={[
                                                styles.progressFill, 
                                                { 
                                                    width: `${Math.min((goal.currentAmount / goal.targetAmount) * 100, 100)}%`,
                                                    backgroundColor: goal.color
                                                }
                                            ]} 
                                        />
                                    </View>
                                    <Text style={styles.progressPct}>%{((goal.currentAmount / goal.targetAmount) * 100).toFixed(0)}</Text>
                                </View>
                            </View>

                            <TouchableOpacity 
                                onPress={() => {
                                    Alert.alert("Hedefi Sil", "Bu hedefi silmek istediğinizden emin misiniz?", [
                                        { text: "Vazgeç", style: "cancel" },
                                        { text: "Sil", style: "destructive", onPress: () => deleteGoal(goal.id) }
                                    ]);
                                }}
                                style={styles.deleteGoalBtn}
                            >
                                <MaterialIcons name="delete-outline" size={16} color={COLORS.textMuted} />
                            </TouchableOpacity>
                        </View>
                    ))}
                </View>
            </View>

            <View style={styles.rightCol}>
                <View style={styles.addCard}>
                    <Text style={styles.sectionTitle}>Yeni Hedef</Text>
                    <View style={styles.formGroup}>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Hedef Adı" 
                            placeholderTextColor={COLORS.textMuted}
                            value={title}
                            onChangeText={setTitle}
                        />
                    </View>
                    <View style={styles.formGroup}>
                        <TextInput 
                            style={styles.input} 
                            placeholder="Hedef Miktar" 
                            placeholderTextColor={COLORS.textMuted}
                            value={targetAmount}
                            onChangeText={setTargetAmount}
                            keyboardType="numeric"
                        />
                    </View>
                    <View style={styles.formGroup}>
                        <View style={styles.iconSelector}>
                            {GOAL_ICONS.map(icon => (
                                <TouchableOpacity 
                                    key={icon} 
                                    style={[styles.iconBtn, selectedIcon === icon && styles.iconBtnActive]}
                                    onPress={() => setSelectedIcon(icon)}
                                >
                                    <Text style={styles.iconBtnText}>{icon}</Text>
                                </TouchableOpacity>
                            ))}
                        </View>
                    </View>
                    <TouchableOpacity style={styles.createBtn} onPress={handleAdd}>
                        <Text style={styles.createBtnText}>Ekle</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background, minHeight: "100%" },
  content: { padding: 16, gap: 24, paddingBottom: 40, flexGrow: 1 },
  webContent: { padding: 32 },
  header: { marginBottom: 8 },
  title: { fontSize: 24, fontWeight: "900", color: "#fff" },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  
  summaryCard: { backgroundColor: COLORS.card, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  summaryInfo: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  summaryLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: "800", letterSpacing: 1.5 },
  summaryValue: { color: COLORS.textPrimary, fontSize: 32, fontWeight: "900", marginTop: 4 },
  summaryBadge: { backgroundColor: COLORS.primary + "15", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 10 },
  summaryBadgeText: { color: COLORS.primary, fontSize: 12, fontWeight: "800" },
  mainProgressBg: { height: 12, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 6, overflow: "hidden" },
  mainProgressFill: { height: "100%", backgroundColor: COLORS.primary, borderRadius: 6 },
  summaryTarget: { color: COLORS.textMuted, fontSize: 12, fontWeight: "600", marginTop: 12 },

  mainGrid: { gap: 24 },
  mainGridWeb: { flexDirection: "row" },
  leftCol: { flex: 2, gap: 16 },
  rightCol: { flex: 1 },

  sectionTitle: { color: COLORS.textPrimary, fontSize: 16, fontWeight: "800", marginBottom: 16 },
  goalsGrid: { gap: 16, flexDirection: "row", flexWrap: "wrap" },
  goalCard: { backgroundColor: COLORS.card, padding: 20, borderRadius: 20, borderWidth: 1, borderColor: "rgba(255,255,255,0.03)", width: "100%", position: 'relative' },
  goalCardWeb: { width: "48%" },
  goalHeader: { flexDirection: "row", alignItems: "center", gap: 16 },
  goalIconBox: { width: 50, height: 50, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.03)", alignItems: "center", justifyContent: "center" },
  goalIcon: { fontSize: 24 },
  goalTitle: { color: COLORS.textPrimary, fontSize: 15, fontWeight: "800" },
  goalAmounts: { color: COLORS.textMuted, fontSize: 12, fontWeight: "600", marginTop: 4 },
  editBtn: { padding: 4 },
  
  progressContainer: { marginTop: 20 },
  progressHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  progressBg: { flex: 1, height: 6, backgroundColor: "rgba(255,255,255,0.05)", borderRadius: 3, overflow: "hidden" },
  progressFill: { height: "100%", borderRadius: 3 },
  progressPct: { color: COLORS.textPrimary, fontSize: 12, fontWeight: "900" },
  
  deleteGoalBtn: { position: 'absolute', top: 12, right: 12, opacity: 0.5 },

  addCard: { backgroundColor: COLORS.card, padding: 24, borderRadius: 24, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)", gap: 20 },
  formGroup: { gap: 8 },
  input: { height: 50, backgroundColor: COLORS.background, borderRadius: 14, paddingHorizontal: 16, color: COLORS.textPrimary, fontSize: 14, borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  iconSelector: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  iconBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: COLORS.background, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "rgba(255,255,255,0.05)" },
  iconBtnActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primary + "10" },
  iconBtnText: { fontSize: 16 },
  createBtn: { height: 50, backgroundColor: COLORS.primary, borderRadius: 14, alignItems: "center", justifyContent: "center", marginTop: 10 },
  createBtnText: { color: COLORS.textPrimary, fontSize: 14, fontWeight: "800" },
});
