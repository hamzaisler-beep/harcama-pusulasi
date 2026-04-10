// src/screens/ReportsScreen.tsx
import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import Anthropic from "@anthropic-ai/sdk";
import { useTransactions } from "../store/useStore";
import { COLORS } from "../types";
import { formatCurrency } from "../utils/format";

interface Insight {
  overallSummary: string;
  topCategory: string;
  topCategoryAmount: number;
  spendingRate: number;
  recommendation: string;
  unusualNote: string | null;
}

export default function ReportsScreen() {
  const { transactions } = useTransactions();
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<Insight | null>(null);

  const income = useMemo(
    () => transactions.filter((t) => t.type === "income").reduce((s, t) => s + t.amount, 0),
    [transactions]
  );
  const expense = useMemo(
    () => Math.abs(transactions.filter((t) => t.type === "expense").reduce((s, t) => s + t.amount, 0)),
    [transactions]
  );

  const categoryTotals = useMemo(() => {
    const cats: Record<string, number> = {};
    transactions.filter((t) => t.type === "expense").forEach((t) => {
      cats[t.category] = (cats[t.category] || 0) + Math.abs(t.amount);
    });
    return Object.entries(cats).sort((a, b) => b[1] - a[1]);
  }, [transactions]);

  const generateInsights = async () => {
    if (transactions.length === 0) {
      Alert.alert("Veri Yok", "Önce işlem eklemeniz gerekiyor.");
      return;
    }
    
    setLoading(true);

    try {
      const apiKey = process.env.EXPO_PUBLIC_ANTHROPIC_API_KEY;
      
      if (!apiKey || apiKey === "sk-ant-..." || apiKey.length < 20) {
        console.warn("Anthropic API anahtarı geçersiz veya bulunamadı.");
        throw new Error("API_KEY_MISSING");
      }

      const client = new Anthropic({
        apiKey: apiKey,
        dangerouslyAllowBrowser: true,
      });

      const prompt = `
        Sen bir finansal danışmansın. Aşağıdaki harcama verilerini analiz et ve JSON formatında geri dön.
        Veriler: ${JSON.stringify(transactions)}
        
        Cevap şunları içermeli:
        - overallSummary (Aylık genel özet, 1-2 cümle)
        - topCategory (En çok harcanan kategori ismi)
        - topCategoryAmount (O kategoriye ait toplam tutar)
        - spendingRate (Gelir/Gider oranı, tam sayı yüzde olarak)
        - recommendation (Tasarruf önerisi veya finansal tavsiye)
        - unusualNote (Normalden fazla bir harcama varsa not, yoksa null)

        Sadece geçerli bir JSON objesi döndür.
      `;

      const response = await client.messages.create({
        model: "claude-3-5-sonnet-20240620",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      });

      const text = response.content[0].text;
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : text;
      const parsed = JSON.parse(jsonString);
      
      setInsights({
        overallSummary: parsed.overallSummary,
        topCategory: parsed.topCategory,
        topCategoryAmount: parsed.topCategoryAmount,
        spendingRate: parsed.spendingRate,
        recommendation: parsed.recommendation,
        unusualNote: parsed.unusualNote,
      });

    } catch (e: any) {
      console.error("AI Analysis Error", e);
      
      if (e.message === "API_KEY_MISSING") {
        Alert.alert("API Anahtarı Eksik", "Lütfen .env dosyasına EXPO_PUBLIC_ANTHROPIC_API_KEY ekleyin.");
      } else {
        Alert.alert("Analiz Hatası", "Yapay zeka analizi sırasında bir hata oluştu. Lütfen tekrar deneyin.");
      }

      // Hata durumunda demo verisi ile devam edelim (UI'ın tamamen çökmemesi için alternatif)
      const topCat = categoryTotals[0];
      const rate = income > 0 ? Math.round((expense / income) * 100) : 0;
      setInsights({
        overallSummary: `[Demo] Analiz tamamlanamadı ancak yerel özet: ${transactions.length} işlem.`,
        topCategory: topCat ? topCat[0] : "Yok",
        topCategoryAmount: topCat ? topCat[1] : 0,
        spendingRate: rate,
        recommendation: "Ağ bağlantınızı veya API anahtarınızı kontrol edin.",
        unusualNote: null,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Raporlar</Text>
            <Text style={styles.subtitle}>Harcama analizi ve AI önerileri</Text>
          </View>
          <TouchableOpacity
            style={[styles.analyzeBtn, loading && styles.analyzeBtnDisabled]}
            onPress={generateInsights}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <>
                <MaterialIcons name="auto-awesome" size={16} color="#fff" />
                <Text style={styles.analyzeBtnText}>Analiz Et</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.incomeLight }]}>
            <MaterialIcons name="trending-up" size={20} color={COLORS.income} />
            <Text style={[styles.summaryLabel, { color: COLORS.income }]}>Toplam Gelir</Text>
            <Text style={[styles.summaryValue, { color: COLORS.income }]}>{formatCurrency(income)}</Text>
          </View>
          <View style={[styles.summaryCard, { backgroundColor: COLORS.expenseLight }]}>
            <MaterialIcons name="trending-down" size={20} color={COLORS.expense} />
            <Text style={[styles.summaryLabel, { color: COLORS.expense }]}>Toplam Gider</Text>
            <Text style={[styles.summaryValue, { color: COLORS.expense }]}>{formatCurrency(expense)}</Text>
          </View>
        </View>

        {/* AI Insights */}
        {insights && (
          <View style={styles.card}>
            <View style={styles.aiHeader}>
              <MaterialIcons name="psychology" size={20} color={COLORS.primary} />
              <Text style={styles.cardTitle}>AI Analizi</Text>
            </View>
            <Text style={styles.summary}>{insights.overallSummary}</Text>

            <View style={styles.insightRow}>
              <View style={[styles.insightBadge, { backgroundColor: COLORS.expenseLight }]}>
                <Text style={[styles.insightBadgeLabel, { color: COLORS.expense }]}>EN YÜKSEK KATEGORİ</Text>
                <Text style={[styles.insightBadgeValue, { color: COLORS.expense }]}>
                  {insights.topCategory} — {formatCurrency(insights.topCategoryAmount)}
                </Text>
              </View>
              <View style={[styles.insightBadge, { backgroundColor: COLORS.primaryLight }]}>
                <Text style={[styles.insightBadgeLabel, { color: COLORS.primary }]}>HARCAMA ORANI</Text>
                <Text style={[styles.insightBadgeValue, { color: COLORS.primary }]}>
                  %{insights.spendingRate} gelir kullanıldı
                </Text>
              </View>
            </View>

            {insights.unusualNote && (
              <View style={styles.warningBox}>
                <MaterialIcons name="warning-amber" size={16} color={COLORS.amber} />
                <Text style={styles.warningText}>{insights.unusualNote}</Text>
              </View>
            )}

            <View style={styles.recBox}>
              <MaterialIcons name="lightbulb-outline" size={16} color={COLORS.income} />
              <Text style={styles.recText}>{insights.recommendation}</Text>
            </View>
          </View>
        )}

        {/* Category Breakdown */}
        {categoryTotals.length > 0 && (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Kategori Dağılımı</Text>
            {categoryTotals.map(([cat, val], i) => {
              const pct = expense > 0 ? Math.round((val / expense) * 100) : 0;
              return (
                <View key={i} style={styles.catRow}>
                  <View style={styles.catTop}>
                    <Text style={styles.catName}>{cat}</Text>
                    <View style={styles.catRight}>
                      <Text style={styles.catPct}>%{pct}</Text>
                      <Text style={styles.catVal}>{formatCurrency(val)}</Text>
                    </View>
                  </View>
                  <View style={styles.progressBg}>
                    <View style={[styles.progressFill, { width: `${pct}%` }]} />
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {transactions.length === 0 && (
          <View style={styles.empty}>
            <MaterialIcons name="bar-chart" size={48} color={COLORS.textMuted} />
            <Text style={styles.emptyTitle}>Veri Yok</Text>
            <Text style={styles.emptyText}>Rapor oluşturmak için işlem eklemeniz gerekiyor.</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 32, gap: 16 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 22, fontWeight: "700", color: COLORS.textPrimary },
  subtitle: { fontSize: 13, color: COLORS.textSecondary, marginTop: 2 },
  analyzeBtn: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.primary,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    gap: 6,
  },
  analyzeBtnDisabled: { opacity: 0.7 },
  analyzeBtnText: { color: "#fff", fontWeight: "700", fontSize: 13 },
  summaryRow: { flexDirection: "row", gap: 12 },
  summaryCard: { flex: 1, borderRadius: 14, padding: 14, gap: 4 },
  summaryLabel: { fontSize: 12, fontWeight: "600", marginTop: 4 },
  summaryValue: { fontSize: 16, fontWeight: "700" },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    padding: 16,
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  aiHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 15, fontWeight: "600", color: COLORS.textPrimary },
  summary: { fontSize: 13, color: COLORS.textSecondary, lineHeight: 20 },
  insightRow: { flexDirection: "row", gap: 10 },
  insightBadge: { flex: 1, borderRadius: 12, padding: 12 },
  insightBadgeLabel: { fontSize: 9, fontWeight: "700", letterSpacing: 0.5, marginBottom: 4 },
  insightBadgeValue: { fontSize: 12, fontWeight: "600" },
  warningBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.amberLight,
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  warningText: { flex: 1, fontSize: 12, color: COLORS.amber, lineHeight: 18 },
  recBox: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: COLORS.incomeLight,
    borderRadius: 10,
    padding: 10,
    gap: 8,
  },
  recText: { flex: 1, fontSize: 12, color: COLORS.income, lineHeight: 18 },
  catRow: { gap: 6 },
  catTop: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  catName: { fontSize: 13, fontWeight: "500", color: COLORS.textPrimary },
  catRight: { flexDirection: "row", gap: 10, alignItems: "center" },
  catPct: { fontSize: 12, color: COLORS.textSecondary },
  catVal: { fontSize: 12, fontWeight: "600", color: COLORS.textPrimary },
  progressBg: { height: 6, backgroundColor: COLORS.background, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, backgroundColor: COLORS.primary, borderRadius: 3 },
  empty: { alignItems: "center", paddingVertical: 40 },
  emptyTitle: { fontSize: 16, fontWeight: "600", color: COLORS.textPrimary, marginTop: 10 },
  emptyText: { fontSize: 13, color: COLORS.textSecondary, marginTop: 4, textAlign: "center" },
});
