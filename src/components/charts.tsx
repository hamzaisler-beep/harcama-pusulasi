import React, { useState } from "react";
import { View, type LayoutChangeEvent } from "react-native";
import Svg, { Circle, Line, Path, Rect, Text as SvgText } from "react-native-svg";
import { AppText } from "./ui";
import { colors, fonts } from "../theme";
import { formatKurus } from "../lib/format";

const SERIES_EXPENSE = colors.accent;
const SERIES_INCOME = "#EB6834";

function useWidth(): [number, (e: LayoutChangeEvent) => void] {
  const [w, setW] = useState(0);
  return [w, (e) => setW(Math.round(e.nativeEvent.layout.width))];
}

/** 1250000 kuruş → "12,5 bin" (eksen etiketleri için kısa biçim) */
function shortTL(kurus: number): string {
  const tl = kurus / 100;
  if (tl >= 1_000_000) return `${(tl / 1_000_000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} mn`;
  if (tl >= 1000) return `${(tl / 1000).toLocaleString("tr-TR", { maximumFractionDigits: 1 })} bin`;
  return tl.toLocaleString("tr-TR", { maximumFractionDigits: 0 });
}

/** Ekseni yuvarlak adımlarla böler (0, 20 bin, 40 bin...). */
function niceMax(max: number): { top: number; step: number } {
  if (max <= 0) return { top: 100_00, step: 50_00 };
  const raw = max / 3;
  const pow = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? 10 * pow;
  return { top: Math.ceil(max / step) * step, step };
}

/* ---------- Yatay çubuklar: kategoriye göre gider ---------- */

export function HorizontalBars({
  rows,
}: {
  rows: { key: string; label: string; value: number; share: number }[];
}) {
  const max = Math.max(...rows.map((r) => r.value), 1);
  return (
    <View style={{ gap: 10 }} accessibilityRole="list">
      {rows.map((r) => (
        <View
          key={r.key}
          style={{ flexDirection: "row", alignItems: "center", gap: 10 }}
          accessible
          accessibilityLabel={`${r.label}: ${formatKurus(r.value)}, yüzde ${Math.round(r.share * 100)}`}
        >
          <AppText style={{ width: 92, fontSize: 13 }} numberOfLines={1}>
            {r.label}
          </AppText>
          <View style={{ flex: 1, height: 12, justifyContent: "center" }}>
            <View
              style={{
                width: `${Math.max(2, (r.value / max) * 100)}%`,
                height: 12,
                backgroundColor: SERIES_EXPENSE,
                borderTopRightRadius: 4,
                borderBottomRightRadius: 4,
              }}
            />
          </View>
          <View style={{ width: 84, alignItems: "flex-end" }}>
            <AppText style={{ fontSize: 13, fontFamily: fonts.semibold }}>{formatKurus(r.value)}</AppText>
            <AppText variant="caption">%{Math.round(r.share * 100)}</AppText>
          </View>
        </View>
      ))}
    </View>
  );
}

/* ---------- Aylık gider (çubuk) + gelir (nokta-çizgi), tek eksen ---------- */

export function MonthlyChart({
  data,
}: {
  data: { label: string; expense: number; income: number }[];
}) {
  const [width, onLayout] = useWidth();
  const height = 190;
  const padLeft = 44;
  const padRight = 8;
  const padTop = 14;
  const padBottom = 26;
  const plotW = Math.max(0, width - padLeft - padRight);
  const plotH = height - padTop - padBottom;
  const max = Math.max(...data.map((d) => Math.max(d.expense, d.income)), 0);
  const { top, step } = niceMax(max);
  const y = (v: number) => padTop + plotH - (v / top) * plotH;
  const slot = data.length ? plotW / data.length : 0;
  const barW = Math.min(30, slot * 0.5);
  const cx = (i: number) => padLeft + slot * i + slot / 2;

  const ticks: number[] = [];
  for (let v = 0; v <= top + 1; v += step) ticks.push(v);

  const incomePath = data
    .map((d, i) => `${i === 0 ? "M" : "L"}${cx(i)} ${y(d.income)}`)
    .join(" ");
  const last = data[data.length - 1];

  return (
    <View style={{ gap: 10 }}>
      {/* Gösterge: iki seri olduğu için her zaman var */}
      <View style={{ flexDirection: "row", gap: 16 }}>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 12, height: 12, borderRadius: 3, backgroundColor: SERIES_EXPENSE }} />
          <AppText variant="caption" style={{ color: colors.ink }}>Gider</AppText>
        </View>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 6 }}>
          <View style={{ width: 14, height: 2, backgroundColor: SERIES_INCOME }} />
          <View style={{ width: 8, height: 8, borderRadius: 4, backgroundColor: SERIES_INCOME, marginLeft: -11 }} />
          <AppText variant="caption" style={{ color: colors.ink, marginLeft: 3 }}>Gelir</AppText>
        </View>
      </View>
      <View
        onLayout={onLayout}
        style={{ height }}
        accessible
        accessibilityLabel={`Aylık gider ve gelir. ${data
          .map((d) => `${d.label}: gider ${formatKurus(d.expense)}, gelir ${formatKurus(d.income)}`)
          .join("; ")}`}
      >
        {width > 0 && (
          <Svg width={width} height={height}>
            {ticks.map((t) => (
              <React.Fragment key={t}>
                <Line x1={padLeft} x2={width - padRight} y1={y(t)} y2={y(t)} stroke={colors.lineSoft} strokeWidth={1} />
                <SvgText x={padLeft - 6} y={y(t) + 4} fontSize={10.5} fill={colors.muted} textAnchor="end" fontFamily={fonts.regular}>
                  {shortTL(t)}
                </SvgText>
              </React.Fragment>
            ))}
            {data.map((d, i) => {
              const h = Math.max(0, y(0) - y(d.expense));
              const r = Math.min(4, h / 2, barW / 2);
              const x0 = cx(i) - barW / 2;
              const y0 = y(d.expense);
              // Üst köşeleri yuvarlak, tabanı düz çubuk
              const p =
                h <= 0
                  ? ""
                  : `M${x0} ${y(0)} V${y0 + r} Q${x0} ${y0} ${x0 + r} ${y0} H${x0 + barW - r} Q${x0 + barW} ${y0} ${x0 + barW} ${y0 + r} V${y(0)} Z`;
              return (
                <React.Fragment key={d.label + i}>
                  {p ? <Path d={p} fill={SERIES_EXPENSE} /> : null}
                  <SvgText
                    x={cx(i)}
                    y={height - 8}
                    fontSize={11}
                    fill={i === data.length - 1 ? colors.ink : colors.muted}
                    fontWeight={i === data.length - 1 ? "600" : "400"}
                    textAnchor="middle"
                    fontFamily={fonts.regular}
                  >
                    {d.label}
                  </SvgText>
                </React.Fragment>
              );
            })}
            <Line x1={padLeft} x2={width - padRight} y1={y(0)} y2={y(0)} stroke={colors.border} strokeWidth={1} />
            {data.length > 1 && <Path d={incomePath} stroke={SERIES_INCOME} strokeWidth={2} fill="none" />}
            {data.map((d, i) => (
              <Circle key={"inc" + i} cx={cx(i)} cy={y(d.income)} r={4} fill={SERIES_INCOME} stroke={colors.surface} strokeWidth={2} />
            ))}
            {/* Sadece son ayın giderini doğrudan etiketle */}
            {last && last.expense > 0 && (
              <SvgText
                x={cx(data.length - 1)}
                y={Math.max(11, y(last.expense) - 7)}
                fontSize={11}
                fontWeight="600"
                fill={colors.ink}
                textAnchor="middle"
                fontFamily={fonts.semibold}
              >
                {shortTL(last.expense)}
              </SvgText>
            )}
          </Svg>
        )}
      </View>
    </View>
  );
}

/* ---------- Kişilere göre pay: tek yatay yığılmış çubuk ---------- */

export function ShareBar({
  parts,
}: {
  parts: { key: string; label: string; value: number; share: number; color: string }[];
}) {
  const total = parts.reduce((s, p) => s + p.value, 0);
  return (
    <View style={{ gap: 12 }}>
      <View
        style={{ flexDirection: "row", height: 14, borderRadius: 4, overflow: "hidden", gap: total > 0 ? 2 : 0, backgroundColor: total > 0 ? "transparent" : colors.line }}
        accessibilityElementsHidden
        importantForAccessibility="no"
      >
        {total > 0 &&
          parts
            .filter((p) => p.value > 0)
            .map((p) => <View key={p.key} style={{ flex: p.value, backgroundColor: p.color }} />)}
      </View>
      <View style={{ flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between", rowGap: 8 }}>
        {parts.map((p) => (
          <View
            key={p.key}
            style={{ flexDirection: "row", alignItems: "center", gap: 8 }}
            accessible
            accessibilityLabel={`${p.label}: ${formatKurus(p.value)}, yüzde ${Math.round(p.share * 100)}`}
          >
            <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: p.color }} />
            <AppText style={{ fontSize: 14 }}>{p.label}</AppText>
            <AppText style={{ fontSize: 14, fontFamily: fonts.semibold }}>{formatKurus(p.value)}</AppText>
            <AppText variant="caption">%{Math.round(p.share * 100)}</AppText>
          </View>
        ))}
      </View>
    </View>
  );
}
