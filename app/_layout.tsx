import { useEffect } from "react";
import { AppState } from "react-native";
import { Redirect, Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PaperProvider } from "react-native-paper";
import { ThemeProvider, useTheme as useAppTheme } from "../theme/ThemeContext";
import { md3DarkTheme, md3LightTheme } from "../theme/md3";
import { loadOnboardingSeen, useOnboardingSeen } from "../lib/onboarding";
import { syncNow } from "../lib/db";

function RootNavigator() {
  const { mode } = useAppTheme();
  const md3Theme = mode === "dark" ? md3DarkTheme : md3LightTheme;

  // M3-08: on first launch only, open the introduction. The flag is local
  // (AsyncStorage) — no account and no data are involved (spec §3.8).
  const onboarded = useOnboardingSeen();
  useEffect(() => {
    loadOnboardingSeen();
  }, []);

  // M3-07: drain the write-behind queue whenever the app is in use. Writes
  // made offline stay queued (D05 append-only) and are replayed here.
  useEffect(() => {
    void syncNow();
    const sub = AppState.addEventListener("change", (state) => {
      if (state === "active") void syncNow();
    });
    return () => sub.remove();
  }, []);

  // Still reading storage: hold a blank frame so the tabs don't flash first.
  if (onboarded === null) return null;

  return (
    <PaperProvider theme={md3Theme}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      {onboarded ? null : <Redirect href="/onboarding" />}
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="onboarding" options={{ presentation: "fullScreenModal", gestureEnabled: false }} />
        <Stack.Screen name="auth/callback" options={{ headerShown: false }} />
        <Stack.Screen name="exercise" options={{ headerShown: false }} />
        <Stack.Screen name="diary" options={{ headerShown: false }} />
        <Stack.Screen name="crisis/index" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="profile/index" options={{ presentation: "card" }} />
        <Stack.Screen name="profile/questions" options={{ presentation: "card" }} />
        <Stack.Screen name="profile/export" options={{ presentation: "card" }} />
      </Stack>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <RootNavigator />
    </ThemeProvider>
  );
}
