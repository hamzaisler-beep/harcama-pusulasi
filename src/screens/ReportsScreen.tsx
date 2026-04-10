import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  useWindowDimensions,
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
  const { width } = useWindowDimensions();
  const isWeb = width > 768;

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

      const text = response.content[0].type === 'text' ? response.content[0].text : '';
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      const jsonString = jsonMatch ? jsonMatch[0] : text;
      const parsed = JSON.parse(jsonString);
      
      setInsights(parsed);

    } catch (e: any) {
      console.error("AI Analysis Error", e);
      Alert.alert("Hata", "AI Analizi sırasında bir sorun oluştu.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={[styles.content, isWeb && styles.webContent]} showsVerticalScrollIndicator={false}>
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.title}>Raporlar \u0026 Analiz</Text>
            <Text style={styles.subtitle}>Finansal sağlığınızı AI ile optimize edin</Text>
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
                <MaterialIcons name="auto-awesome" size={18} color="#fff" />
                <Text style={styles.analyzeBtnText}>AI Analizi Başlat</Text>
              </>
            )}
          </TouchableOpacity>
        </View>

        <View style={[styles.mainLayout, isWeb && styles.webMainLayout]}>
          <View style={styles.leftCol}>
            {/* Summary Cards */}
            <View style={styles.summaryGrid}>
              <View style={[styles.summaryCard, { borderColor: COLORS.income }]}>
                <Text style={styles.summaryLabel}>Toplam Gelir</Text>
                <Text style={[styles.summaryValue, { color: COLORS.income }]}>{formatCurrency(income)}</Text>
              </View>
              <View style={[styles.summaryCard, { borderColor: COLORS.expense }]}>
                <Text style={styles.summaryLabel}>Toplam Gider</Text>
                <Text style={[styles.summaryValue, { color: COLORS.expense }]}>{formatCurrency(expense)}</Text>
              </View>
            </View>

            {/* AI Insights Card */}
            {insights && (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <MaterialIcons name="psychology" size={24} color={COLORS.primary} />
                  <Text style={styles.cardTitle}>Yapay Zeka Görüşleri</Text>
                </View>
                <Text style={styles.overallSummary}>{insights.overallSummary}</Text>
                
                <View style={styles.insightGrid}>
                  <View style={styles.insightStat}>
                    <Text style={styles.insightLabel}>LİDER KATEGORİ</Text>
                    <Text style={styles.insightValue}>{insights.topCategory}</Text>
                    <Text style={styles.insightSub}>{formatCurrency(insights.topCategoryAmount)}</Text>
                  </View>
                  <View style={styles.insightStat}>
                    <Text style={styles.insightLabel}>GELİR KULLANIMI</Text>
                    <Text style={styles.insightValue}>%{insights.spendingRate}</Text>
                    <View style={styles.miniProgress}>
                      <View style={[styles.miniProgressFill, { width: `${insights.spendingRate}%`, backgroundColor: insights.spendingRate > 80 ? COLORS.expense : COLORS.primary }]} />
                    </View>
                  </View>
                </View>

                {insights.unusualNote && (
                  <View style={styles.alertBox}>
                    <MaterialIcons name="warning-amber" size={20} color={COLORS.amber} />
                    <Text style={styles.alertText}>{insights.unusualNote}</Text>
                  </View>
                )}

                <View style={styles.recBox}>
                  <MaterialIcons name="lightbulb-outline" size={20} color={COLORS.primary} />
                  <Text style={styles.recText}>{insights.recommendation}</Text>
                </View>
              </View>
            )}

            {!insights && !loading && (
              <View style={styles.emptyCard}>
                <MaterialIcons name="analytics" size={48} color={COLORS.textMuted} />
                <Text style={styles.emptyText}>Detaylı analiz için yukarıdaki butona tıklayın.</Text>
              </View>
            )}
          </View>

          <View style={styles.rightCol}>
            {/* Category Breakdown */}
            {categoryTotals.length > 0 && (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Kategori Bazlı Harcama</Text>
                <View style={styles.catList}>
                  {categoryTotals.map(([cat, val], i) => {
                    const pct = expense > 0 ? Math.round((val / expense) * 100) : 0;
                    return (
                      <View key={i} style={styles.catRow}>
                        <View style={styles.catHeader}>
                          <Text style={styles.catName}>{cat}</Text>
                          <Text style={styles.catVal}>{formatCurrency(val)}</Text>
                        </View>
                        <View style={styles.progressBg}>
                          <View style={[styles.progressFill, { width: `${pct}%` }]} />
                        </View>
                        <Text style={styles.catPct}>%{pct}</Text>
                      </View>
                    );
                  })}
                </View>
              </View>
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 20, paddingBottom: 40, gap: 24 },
  webContent: { padding: 32 },
  headerRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "flex-start" },
  title: { fontSize: 24, fontWeight: "800", color: COLORS.textPrimary, letterSpacing: -0.5 },
  subtitle: { fontSize: 13, color: COLORS.textMuted, marginTop: 4 },
  analyzeBtn: { flexDirection: "row", alignItems: "center", backgroundColor: COLORS.primary, paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, gap: 8 },
  analyzeBtnDisabled: { opacity: 0.7 },
  analyzeBtnText: { color: "#fff", fontWeight: "700", fontSize: 14 },
  mainLayout: { gap: 24 },
  webMainLayout: { flexDirection: "row" },
  leftCol: { flex: 1.5, gap: 24 },
  rightCol: { flex: 1 },
  summaryGrid: { flexDirection: "row", gap: 16 },
  summaryCard: { flex: 1, backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderLeftWidth: 4 },
  summaryLabel: { fontSize: 12, color: COLORS.textSecondary, fontWeight: "600", marginBottom: 4 },
  summaryValue: { fontSize: 18, fontWeight: "800" },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 24, borderWidth: 1, borderColor: COLORS.border, gap: 20 },
  cardHeader: { flexDirection: "row", alignItems: "center", gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: "700", color: COLORS.textPrimary },
  overallSummary: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 22 },
  insightGrid: { flexDirection: "row", gap: 16 },
  insightStat: { flex: 1, backgroundColor: COLORS.background, padding: 16, borderRadius: 12, gap: 6 },
  insightLabel: { fontSize: 10, fontWeight: "800", color: COLORS.textMuted, letterSpacing: 0.5 },
  insightValue: { fontSize: 15, fontWeight: "700", color: COLORS.textPrimary },
  insightSub: { fontSize: 12, color: COLORS.textSecondary },
  miniProgress: { height: 4, backgroundColor: COLORS.border, borderRadius: 2, marginTop: 4, overflow: "hidden" },
  miniProgressFill: { height: 4, borderRadius: 2 },
  alertBox: { flexDirection: "row", backgroundColor: COLORS.expenseLight, padding: 14, borderRadius: 12, gap: 12, alignItems: "center" },
  alertText: { flex: 1, fontSize: 13, color: COLORS.expense, fontWeight: "500" },
  recBox: { flexDirection: "row", backgroundColor: COLORS.primaryLight, padding: 14, borderRadius: 12, gap: 12, alignItems: "center" },
  recText: { flex: 1, fontSize: 13, color: COLORS.primary, fontWeight: "500" },
  emptyCard: { backgroundColor: COLORS.card, borderRadius: 16, padding: 40, alignItems: "center", gap: 12, borderStyle: "dashed", borderWidth: 2, borderColor: COLORS.border },
  emptyText: { color: COLORS.textMuted, fontSize: 14, textAlign: "center" },
  catList: { gap: 16 },
  catRow: { gap: 8 },
  catHeader: { flexDirection: "row", justifyContent: "space-between" },
  catName: { fontSize: 13, fontWeight: "600", color: COLORS.textSecondary },
  catVal: { fontSize: 13, fontWeight: "700", color: COLORS.textPrimary },
  progressBg: { height: 6, backgroundColor: COLORS.background, borderRadius: 3, overflow: "hidden" },
  progressFill: { height: 6, backgroundColor: COLORS.primary, borderRadius: 3 },
  catPct: { fontSize: 11, color: COLORS.textMuted, textAlign: "right" },
});

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
