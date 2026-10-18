import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onAuthStateChanged, type User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth, db } from "../lib/firebase";
import { ensureUserDoc } from "../lib/auth";
import type { Household, UserProfile } from "../types";

export type SessionStatus = "loading" | "signedOut" | "needsHousehold" | "ready";

interface SessionValue {
  status: SessionStatus;
  user: User | null;
  profile: UserProfile | null;
  household: Household | null;
}

const SessionContext = createContext<SessionValue | null>(null);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profileReady, setProfileReady] = useState(false);
  const [household, setHousehold] = useState<Household | null>(null);
  const [householdReady, setHouseholdReady] = useState(false);

  // 1) Oturum
  useEffect(() => {
    return onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthReady(true);
      if (u) {
        ensureUserDoc(u).catch((e) => console.warn("Kullanıcı kaydı oluşturulamadı", e));
      }
    });
  }, []);

  // 2) users/{uid}
  useEffect(() => {
    setProfile(null);
    setProfileReady(false);
    if (!user) return;
    return onSnapshot(
      doc(db, "users", user.uid),
      { includeMetadataChanges: true },
      (snap) => {
        // Yazma işlemi henüz sunucuya ulaşmadıysa bekle. Aksi halde hane,
        // sunucuda oluşmadan okunmaya çalışılır ve güvenlik kuralı reddeder.
        if (snap.metadata.hasPendingWrites) return;
        setProfile(snap.exists() ? ({ uid: user.uid, ...snap.data() } as UserProfile) : null);
        setProfileReady(true);
      },
      (err) => {
        console.warn("Profil okunamadı", err);
        setProfile(null);
        setProfileReady(true);
      },
    );
  }, [user]);

  // 3) households/{hid}
  const householdId = profile?.householdId ?? null;
  useEffect(() => {
    setHousehold(null);
    setHouseholdReady(false);
    if (!householdId) {
      setHouseholdReady(true);
      return;
    }

    let unsubscribe: (() => void) | null = null;
    let retryTimer: ReturnType<typeof setTimeout> | null = null;
    let cancelled = false;

    const listen = (attempt: number) => {
      unsubscribe = onSnapshot(
        doc(db, "households", householdId),
        (snap) => {
          setHousehold(snap.exists() ? ({ id: snap.id, ...snap.data() } as Household) : null);
          setHouseholdReady(true);
        },
        (err) => {
          // Hata alan dinleyici kendini kapatır. Yeni kurulan/katılınan hanede
          // sunucu bir anlık geride kalabilir; birkaç kez tekrar dene.
          if (!cancelled && attempt < 3) {
            retryTimer = setTimeout(() => listen(attempt + 1), 800 * (attempt + 1));
            return;
          }
          // Örn. hane silindiyse ya da kullanıcı üyelikten çıkarıldıysa.
          console.warn("Hane okunamadı", err);
          setHousehold(null);
          setHouseholdReady(true);
        },
      );
    };
    listen(0);

    return () => {
      cancelled = true;
      if (retryTimer) clearTimeout(retryTimer);
      unsubscribe?.();
    };
  }, [householdId]);

  const status: SessionStatus = useMemo(() => {
    if (!authReady) return "loading";
    if (!user) return "signedOut";
    if (!profileReady || !householdReady) return "loading";
    if (!household) return "needsHousehold";
    return "ready";
  }, [authReady, user, profileReady, householdReady, household]);

  const value = useMemo(
    () => ({ status, user, profile, household }),
    [status, user, profile, household],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession, SessionProvider içinde kullanılmalı.");
  return ctx;
}

/** Hazır durumdaki ekranlar için: kullanıcı ve hane kesin var. */
export function useReadySession(): { user: User; household: Household; profile: UserProfile | null } {
  const { user, household, profile } = useSession();
  if (!user || !household) throw new Error("Oturum ya da hane hazır değil.");
  return { user, household, profile };
}
