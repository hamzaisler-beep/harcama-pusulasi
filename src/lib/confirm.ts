import { Alert, Platform } from "react-native";

/** Evet/Hayır onayı. Web'de tarayıcının onay penceresi, mobilde sistem uyarısı. */
export function confirmAction(title: string, message: string, confirmLabel = "Sil"): Promise<boolean> {
  if (Platform.OS === "web") {
    const w = globalThis as unknown as { confirm?: (msg: string) => boolean };
    return Promise.resolve(w.confirm ? w.confirm(`${title}\n\n${message}`) : true);
  }
  return new Promise((resolve) => {
    Alert.alert(title, message, [
      { text: "Vazgeç", style: "cancel", onPress: () => resolve(false) },
      { text: confirmLabel, style: "destructive", onPress: () => resolve(true) },
    ]);
  });
}
