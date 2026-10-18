import React from "react";
import { View } from "react-native";
import { AppText, Card, Screen } from "./ui";
import { colors } from "../theme";

/** Henüz yazılmamış sekmeler için: hangi aşamada geleceğini söyler. */
export function ComingSoon({
  title,
  phase,
  description,
}: {
  title: string;
  phase: string;
  description: string;
}) {
  return (
    <Screen>
      <AppText variant="display" accessibilityRole="header">
        {title}
      </AppText>
      <Card style={{ alignItems: "flex-start" }}>
        <View
          style={{
            backgroundColor: colors.accentSoft,
            borderRadius: 8,
            paddingHorizontal: 10,
            paddingVertical: 4,
          }}
        >
          <AppText variant="caption" style={{ color: colors.accentDark, fontWeight: "600" }}>
            {phase}
          </AppText>
        </View>
        <AppText variant="small" style={{ fontSize: 15, lineHeight: 22 }}>
          {description}
        </AppText>
      </Card>
    </Screen>
  );
}
