import React from "react";
import { View } from "react-native";
import Svg, { Circle, Path, Rect } from "react-native-svg";
import type { Category, CategoryIconName } from "../lib/categories";

function Glyph({ name, color, size }: { name: CategoryIconName; color: string; size: number }) {
  const common = {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: color,
    strokeWidth: 2,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  switch (name) {
    case "cart":
      return (
        <Svg {...common}>
          <Path d="M3 4h2l2.5 11h11L21 8H6.5" />
          <Circle cx={9} cy={19} r={1.5} />
          <Circle cx={17} cy={19} r={1.5} />
        </Svg>
      );
    case "home":
      return (
        <Svg {...common}>
          <Path d="M3 10.5 12 3l9 7.5V21H3z" />
        </Svg>
      );
    case "bolt":
      return (
        <Svg {...common}>
          <Path d="M13 3 5 14h6l-1 7 8-11h-6z" />
        </Svg>
      );
    case "fuel":
      return (
        <Svg {...common}>
          <Rect x={4} y={3} width={10} height={18} rx={1} />
          <Path d="M14 9h3l2 2v7a1.5 1.5 0 0 1-3 0v-4h-2M7 7h4" />
        </Svg>
      );
    case "food":
      return (
        <Svg {...common}>
          <Path d="M7 3v8a3 3 0 0 0 6 0V3M10 3v18M17 3c-2 2-2 6 0 8v10" />
        </Svg>
      );
    case "heart":
      return (
        <Svg {...common}>
          <Path d="M12 21s-7-4.5-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 11c0 5.5-7 10-7 10z" />
        </Svg>
      );
    case "bag":
      return (
        <Svg {...common}>
          <Path d="M6 8h12l-1 13H7z" />
          <Path d="M9 8a3 3 0 0 1 6 0" />
        </Svg>
      );
    case "card":
      return (
        <Svg {...common}>
          <Rect x={3} y={5} width={18} height={14} rx={2} />
          <Path d="M3 10h18M7 15h4" />
        </Svg>
      );
    case "school":
      return (
        <Svg {...common}>
          <Path d="M2 9l10-5 10 5-10 5z" />
          <Path d="M6 11v5c3 2 9 2 12 0v-5" />
        </Svg>
      );
    case "gift":
      return (
        <Svg {...common}>
          <Rect x={3} y={8} width={18} height={13} rx={1} />
          <Path d="M3 12h18M12 8v13M12 8c-2-4-6-4-6-1s6 1 6 1 6 2 6-1-4-3-6 1" />
        </Svg>
      );
    case "paw":
      return (
        <Svg {...common}>
          <Circle cx={7} cy={10} r={1.6} />
          <Circle cx={11} cy={6.5} r={1.6} />
          <Circle cx={15.5} cy={7.5} r={1.6} />
          <Circle cx={18} cy={11.5} r={1.6} />
          <Path d="M8.5 18c0-3 2-5.5 4-5.5s4 2.5 4 5.5c0 1.5-1.5 2-4 2s-4-.5-4-2z" />
        </Svg>
      );
    case "wallet":
      return (
        <Svg {...common}>
          <Rect x={3} y={6} width={18} height={13} rx={2} />
          <Path d="M3 10h18M16 14h2" />
        </Svg>
      );
    case "plus-circle":
      return (
        <Svg {...common}>
          <Circle cx={12} cy={12} r={9} />
          <Path d="M12 8v8M8 12h8" />
        </Svg>
      );
    case "trend":
      return (
        <Svg {...common}>
          <Path d="M3 17l6-6 4 4 8-8M15 7h6v6" />
        </Svg>
      );
    case "dots":
    default:
      return (
        <Svg {...common}>
          <Circle cx={6} cy={12} r={1.2} />
          <Circle cx={12} cy={12} r={1.2} />
          <Circle cx={18} cy={12} r={1.2} />
        </Svg>
      );
  }
}

export function CategoryIcon({
  category,
  size = 40,
  iconSize = 20,
}: {
  category: Category;
  size?: number;
  iconSize?: number;
}) {
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no"
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.3,
        backgroundColor: category.tint,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Glyph name={category.icon} color={category.color} size={iconSize} />
    </View>
  );
}

export function CategoryGlyph({ category, size = 22 }: { category: Category; size?: number }) {
  return <Glyph name={category.icon} color={category.color} size={size} />;
}
