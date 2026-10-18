import React, { useState } from "react";
import { Platform, Pressable, Share, View } from "react-native";
import { AppText, Card } from "./ui";
import { CopyIcon, ShareIcon } from "./icons";
import { colors, fonts, radius } from "../theme";
import type { Household } from "../types";

/** Davet kodunu gösterir; paylaşma veya kopyalama sunar. */
export function InviteCard({ household, compact }: { household: Household; compact?: boolean }) {
  const [copied, setCopied] = useState(false);
  const message = `HarcamaPusulası'nda "${household.name}" hanesine katıl. Davet kodu: ${household.inviteCode}`;

  const share = async () => {
    // Web'de tarayıcı paylaşma desteklemiyorsa panoya kopyala.
    if (Platform.OS === "web") {
      const nav = globalThis.navigator as Navigator | undefined;
      try {
        if (nav?.share) {
          await nav.share({ text: message });
          return;
        }
        await nav?.clipboard?.writeText(household.inviteCode);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } catch {
        /* kullanıcı iptal etti */
      }
      return;
    }
    try {
      await Share.share({ message });
    } catch {
      /* kullanıcı iptal etti */
    }
  };

  return (
    <Card style={compact ? undefined : { borderWidth: 1.5, borderColor: colors.accentSoft }}>
      {!compact && (
        <View style={{ gap: 4 }}>
          <AppText variant="title">Eşini davet et</AppText>
          <AppText variant="small">
            Bu kodla katıldığında aynı harcamaları ikiniz de anında görürsünüz.
          </AppText>
        </View>
      )}
      <View style={{ flexDirection: "row", alignItems: "center", gap: 10 }}>
        <View
          style={{
            flex: 1,
            height: 52,
            borderRadius: radius.md,
            backgroundColor: colors.surfaceMuted,
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <AppText
            selectable
            style={{ fontFamily: fonts.display, fontSize: 24, letterSpacing: 4 }}
            accessibilityLabel={`Davet kodu ${household.inviteCode.split("").join(" ")}`}
          >
            {household.inviteCode}
          </AppText>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Davet kodunu paylaş"
          onPress={share}
          style={{
            height: 52,
            paddingHorizontal: 16,
            borderRadius: radius.md,
            backgroundColor: colors.accent,
            flexDirection: "row",
            alignItems: "center",
            gap: 8,
          }}
        >
          {copied ? (
            <CopyIcon color={colors.white} size={18} />
          ) : (
            <ShareIcon color={colors.white} size={18} />
          )}
          <AppText style={{ color: colors.white, fontFamily: fonts.semibold }}>
            {copied ? "Kopyalandı" : "Paylaş"}
          </AppText>
        </Pressable>
      </View>
    </Card>
  );
}
