// Tasarım dosyasındaki ("HarcamaPusulası Ekranlar") renk, yazı ve boşluk değerleri.
export const colors = {
  bg: "#F3F5F4",
  surface: "#FFFFFF",
  surfaceMuted: "#F7F9F8",
  ink: "#13201B",
  muted: "#5B6B64",
  line: "#E2E7E4",
  lineSoft: "#EDF1EF",
  border: "#D3DBD7",
  accent: "#0E6B5A",
  accentDark: "#0E3B33",
  accentSoft: "#E3F1EC",
  onAccentMuted: "#CFE3DD",
  warn: "#B4470F",
  warnDeep: "#9A3A0B",
  warnSoft: "#FBEDE3",
  white: "#FFFFFF",
} as const;

export const fonts = {
  regular: "Figtree_400Regular",
  medium: "Figtree_500Medium",
  semibold: "Figtree_600SemiBold",
  display: "BricolageGrotesque_700Bold",
  displaySemi: "BricolageGrotesque_600SemiBold",
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 28,
} as const;

// Hane üyelerine sırayla verilen renkler (avatar ve grafikler).
// Renk körlüğü dahil ayırt edilebilirliği doğrulanmış sıra; sırayı değiştirme.
export const memberColors = ["#2A78D6", "#EB6834", "#1BAF7A", "#6250D6"] as const;

// Bütçe durum renkleri (her zaman yazıyla birlikte kullanılır, tek başına değil).
export const statusColors = {
  ok: colors.accent,
  warn: "#D9772F",
  over: "#9A3A0B",
} as const;
