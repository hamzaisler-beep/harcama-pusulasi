import { useEffect, useState } from "react";
import { doc, onSnapshot, serverTimestamp, setDoc } from "firebase/firestore";
import { db } from "./firebase";
import { cleanLimits } from "./budgetMath";

/**
 * households/{hid}/meta/budget → { limits: { kategoriId: kuruş } }
 * Limitler her ay için geçerlidir (aylık bütçe); değiştirilene kadar aynı kalır.
 */
function budgetRef(householdId: string) {
  return doc(db, "households", householdId, "meta", "budget");
}

export function useBudgetLimits(householdId: string): { limits: Record<string, number>; loading: boolean } {
  const [limits, setLimits] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    return onSnapshot(
      budgetRef(householdId),
      (snap) => {
        const data = snap.exists() ? (snap.data() as { limits?: Record<string, number> }) : {};
        setLimits(cleanLimits(data.limits ?? {}));
        setLoading(false);
      },
      (err) => {
        console.warn("Bütçe okunamadı", err);
        setLoading(false);
      },
    );
  }, [householdId]);

  return { limits, loading };
}

export async function saveBudgetLimits(
  householdId: string,
  limits: Record<string, number | null | undefined>,
): Promise<void> {
  await setDoc(budgetRef(householdId), { limits: cleanLimits(limits), updatedAt: serverTimestamp() });
}
