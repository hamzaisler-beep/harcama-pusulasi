import React from "react";
import Svg, { Circle, Path, Rect } from "react-native-svg";

type IconProps = { size?: number; color: string; strokeWidth?: number };

function Base({ size = 24, color, strokeWidth = 2, children }: IconProps & { children: React.ReactNode }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {children}
    </Svg>
  );
}

export const HomeIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M3 10.5 12 3l9 7.5V21H3z" />
  </Base>
);
export const ListIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M4 6h16M4 12h16M4 18h10" />
  </Base>
);
export const PlusIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M12 5v14M5 12h14" />
  </Base>
);
export const PieIcon = (p: IconProps) => (
  <Base {...p}>
    <Circle cx={12} cy={12} r={9} />
    <Path d="M12 3v9h9" />
  </Base>
);
export const BarsIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M5 20V11M12 20V5M19 20v-6" />
  </Base>
);
export const ChevronLeft = (p: IconProps) => (
  <Base {...p}>
    <Path d="m15 6-6 6 6 6" />
  </Base>
);
export const ChevronRight = (p: IconProps) => (
  <Base {...p}>
    <Path d="m9 6 6 6-6 6" />
  </Base>
);
export const CompassIcon = (p: IconProps) => (
  <Base {...p}>
    <Circle cx={12} cy={12} r={9} />
    <Path d="m15.5 8.5-2 5-5 2 2-5z" />
  </Base>
);
export const ShareIcon = (p: IconProps) => (
  <Base {...p}>
    <Path d="M12 16V4M7 9l5-5 5 5M5 20h14" />
  </Base>
);
export const CopyIcon = (p: IconProps) => (
  <Base {...p}>
    <Rect x={8} y={8} width={12} height={12} rx={2} />
    <Path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3" />
  </Base>
);
