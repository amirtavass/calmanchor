import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { colors } from "./tokens";

/**
 * Theme — two modes (light / dark) persisted to AsyncStorage. No system
 * override; the user picks exactly what they want. Cycles light ↔ dark.
 *
 * - `mode` is the *resolved* effective mode ("light" | "dark") — the existing
 *   pattern `const { mode } = useAppTheme(); const c = colors[mode];` keeps
 *   working unchanged.
 * - `setMode` / `toggle` mutate and persist.
 */

export type ThemeMode = "light" | "dark";

const STORAGE_KEY = "calmanchor.themeMode";

interface ThemeContextValue {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  toggle: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  mode: "light",
  setMode: () => {},
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>("light");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(STORAGE_KEY)
      .then((v) => {
        if (v === "light" || v === "dark") setModeState(v);
      })
      .catch(() => {})
      .finally(() => setHydrated(true));
  }, []);

  const setMode = useCallback((m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem(STORAGE_KEY, m).catch(() => {});
  }, []);

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const next: ThemeMode = prev === "light" ? "dark" : "light";
      AsyncStorage.setItem(STORAGE_KEY, next).catch(() => {});
      return next;
    });
  }, []);

  // Default to system scheme on first launch if we can't read storage yet,
  // but as soon as the user touches the toggle we go with what they picked.
  const systemScheme = useColorScheme();
  const initial = systemScheme === "dark" ? "dark" : "light";
  const effective = hydrated ? mode : initial;

  return (
    <ThemeContext.Provider value={{ mode: effective, setMode, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}

// Alias so components can read `const { mode } = useAppTheme()` (MD3 bridge uses it too).
export const useAppTheme = useTheme;
