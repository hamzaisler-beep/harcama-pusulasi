// src/screens/OnboardingScreen.tsx
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  useWindowDimensions,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialIcons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { COLORS } from "../theme/constants";

const SLIDES = [
  {
    icon: "swap-vert" as const,
    color: COLORS.primary,
    title: "Paranı Takip Et",
    desc: "Tüm gelir ve giderlerini tek yerden kaydet. Nereye ne kadar harcadığını gör ve bilinçli kararlar al.",
  },
  {
    icon: "pie-chart" as const,
    color: COLORS.income,
    title: "Bütçeni Yönet",
    desc: "Bütçe hedefleri oluştur, faturalarını takip et ve borç/alacaklarını kolayca düzenle.",
  },
  {
    icon: "flag" as const,
    color: COLORS.warning,
    title: "Geleceğini Planla",
    desc: "Tasarruf hedefleri belirle, yatırımlarını izle ve finansal özgürlüğüne ulaş.",
  },
];

export default function OnboardingScreen({ navigation }: any) {
  const { width } = useWindowDimensions();
  const [current, setCurrent] = useState(0);
  const scrollRef = useRef<ScrollView>(null);

  const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const idx = Math.round(e.nativeEvent.contentOffset.x / width);
    setCurrent(idx);
  };

  const goTo = (idx: number) => {
    scrollRef.current?.scrollTo({ x: idx * width, animated: true });
    setCurrent(idx);
  };

  const finish = async () => {
    await AsyncStorage.setItem("onboarding_seen", "1");
    navigation.replace("Login");
  };

  const next = () => {
    if (current < SLIDES.length - 1) goTo(current + 1);
    else finish();
  };

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.skipRow}>
        <TouchableOpacity onPress={finish} style={styles.skipBtn}>
          <Text style={styles.skipText}>Atla</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        style={{ flex: 1 }}
        scrollEventThrottle={16}
      >
        {SLIDES.map((slide, i) => (
          <View key={i} style={[styles.slide, { width }]}>
            <View style={[styles.iconCircle, { backgroundColor: slide.color + "18", borderColor: slide.color + "40" }]}>
              <MaterialIcons name={slide.icon} size={56} color={slide.color} />
            </View>
            <Text style={styles.slideTitle}>{slide.title}</Text>
            <Text style={styles.slideDesc}>{slide.desc}</Text>
          </View>
        ))}
      </ScrollView>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <TouchableOpacity key={i} onPress={() => goTo(i)}>
              <View style={[styles.dot, i === current && styles.dotActive]} />
            </TouchableOpacity>
          ))}
        </View>

        <TouchableOpacity style={styles.nextBtn} onPress={next}>
          {current < SLIDES.length - 1 ? (
            <>
              <Text style={styles.nextBtnText}>İleri</Text>
              <MaterialIcons name="arrow-forward" size={20} color="#fff" />
            </>
          ) : (
            <Text style={styles.nextBtnText}>Başla</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  skipRow: { flexDirection: "row", justifyContent: "flex-end", paddingHorizontal: 24, paddingTop: 8, paddingBottom: 4 },
  skipBtn: { padding: 8 },
  skipText: { color: COLORS.textMuted, fontSize: 14, fontWeight: "600" },
  slide: { flex: 1, alignItems: "center", justifyContent: "center", paddingHorizontal: 36 },
  iconCircle: { width: 140, height: 140, borderRadius: 40, alignItems: "center", justifyContent: "center", marginBottom: 40, borderWidth: 1 },
  slideTitle: { fontSize: 26, fontWeight: "900", color: "#fff", textAlign: "center", letterSpacing: -0.5, marginBottom: 16 },
  slideDesc: { fontSize: 15, color: COLORS.textMuted, textAlign: "center", lineHeight: 24 },
  footer: { paddingHorizontal: 24, paddingBottom: 32, gap: 24 },
  dots: { flexDirection: "row", justifyContent: "center", gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.border },
  dotActive: { width: 24, backgroundColor: COLORS.primary },
  nextBtn: { height: 56, backgroundColor: COLORS.primary, borderRadius: 16, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8 },
  nextBtnText: { color: "#fff", fontSize: 16, fontWeight: "800" },
});
