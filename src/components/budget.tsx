import React from "react";
import { View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";
import { AppText } from "./ui";
import { colors, fonts, statusColors } from "../theme";
import { formatKurus } from "../lib/format";
import type { BudgetState } from "../lib/budgetMath";

/** Yatay doluluk çubuğu. %100'ü geçse de çubuk taşmaz; durum yazıyla da söylenir. */
export function ProgressBar({ ratio, state, height = 8 }: { ratio: number; state: BudgetState; height?: number }) {
  const pct = Math.max(0, Math.min(1, ratio)) * 100;
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{ height, borderRadius: height / 2, backgroundColor: colors.line, overflow: "hidden" }}
    >
      <View
        style={{
          width: `${pct}%`,
          height,
          borderRadius: height / 2,
          backgroundColor: statusColors[state],
        }}
      />
    </View>
  );
}

function StatusIcon({ state, size = 14 }: { state: BudgetState; size?: number }) {
  const color = state === "over" ? statusColors.over : statusColors.warn;
  if (state === "ok") return null;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2.4} strokeLinecap="round">
      {state === "over" ? (
        <>
          <Circle cx={12} cy={12} r={9} />
          <Path d="M12 7v6M12 16.5v.5" />
        </>
      ) : (
        <>
          <Path d="M12 3 2 20h20z" strokeLinejoin="round" />
          <Path d="M12 10v4M12 17v.5" />
        </>
      )}
    </Svg>
  );
}

/** Durum satırı: renk + simge + yazı (renk tek başına anlam taşımaz). */
export function BudgetStatusText({
  state,
  spent,
  limit,
}: {
  state: BudgetState;
  spent: number;
  limit: number;
}) {
  const pct = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  let text: string;
  let color: string = colors.muted;
  if (state === "over") {
    text = `${formatKurus(spent - limit)} aşıldı`;
    color = statusColors.over;
  } else if (state === "warn") {
    text = spent === limit ? "Limit doldu" : `%${pct} · ${formatKurus(limit - spent)} kaldı`;
    color = "#8A3409";
  } else {
    text = `%${pct} · ${formatKurus(limit - spent)} kaldı`;
  }
  return (
    <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
      <StatusIcon state={state} />
      <AppText style={{ fontSize: 13, color, fontFamily: state === "ok" ? fonts.regular : fonts.semibold }}>
        {text}
      </AppText>
    </View>
  );
}

/** Halka: toplam bütçe doluluğu. */
export function BudgetRing({ ratio, state, size = 64 }: { ratio: number; state: BudgetState; size?: number }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const pct = Math.max(0, Math.min(1, ratio));
  return (
    <View style={{ width: size, height: size, alignItems: "center", justifyContent: "center" }}>
      <Svg width={size} height={size} style={{ position: "absolute" }}>
        <Circle cx={size / 2} cy={size / 2} r={r} stroke={colors.line} strokeWidth={stroke} fill="none" />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          stroke={statusColors[state]}
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={`${c * pct} ${c}`}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
      <AppText style={{ fontFamily: fonts.semibold, fontSize: 14 }}>%{Math.round(ratio * 100)}</AppText>
    </View>
  );
}
