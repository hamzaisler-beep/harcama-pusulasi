// src/hooks/useStore.ts
// Store değişimlerine abone olup bileşeni yeniden render eden basit hook.
// Kullanım:  const s = useStore();  // s.transactions, s.accounts ...
import { useEffect, useState } from "react";
import { store } from "../store";

export function useStore() {
  const [, setTick] = useState(0);
  useEffect(() => {
    const fn = () => setTick((t) => t + 1);
    store.listeners.add(fn);
    // İlk mount'ta güncel veriyi yakala
    fn();
    return () => {
      store.listeners.delete(fn);
    };
  }, []);
  return store;
}
