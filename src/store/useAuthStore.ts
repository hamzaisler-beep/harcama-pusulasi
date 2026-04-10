// src/store/useAuthStore.ts
import { useState, useEffect } from "react";
import { User } from "firebase/auth";
import { subscribeToAuthChanges } from "../services/authService";

interface AuthState {
  user: User | null;
  loading: boolean;
  initialized: boolean;
}

let _authState: AuthState = {
  user: null,
  loading: true,
  initialized: false,
};

let _listeners: ((state: AuthState) => void)[] = [];

function notify() {
  _listeners.forEach((fn) => fn({ ..._authState }));
}

// Initial subscription
subscribeToAuthChanges((user) => {
  _authState = {
    user,
    loading: false,
    initialized: true,
  };
  notify();
});

export function useAuth() {
  const [state, setState] = useState(_authState);

  useEffect(() => {
    const fn = (newState: AuthState) => setState(newState);
    _listeners.push(fn);
    return () => {
      _listeners = _listeners.filter((l) => l !== fn);
    };
  }, []);

  return state;
}
