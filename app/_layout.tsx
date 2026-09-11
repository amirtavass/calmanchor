import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { PaperProvider } from "react-native-paper";
import { ThemeProvider, useTheme as useAppTheme } from "../theme/ThemeContext";
import { md3DarkTheme, md3LightTheme } from "../theme/md3";

function RootNavigator() {
  const { mode } = useAppTheme();
  const md3Theme = mode === "dark" ? md3DarkTheme : md3LightTheme;

  return (
    <PaperProvider theme={md3Theme}>
      <StatusBar style={mode === "dark" ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="exercise/[id]" options={{ presentation: "card" }} />
        <Stack.Screen name="exercise/session/[id]" options={{ presentation: "card" }} />
        <Stack.Screen name="exercise/category/[key]" options={{ presentation: "card" }} />
        <Stack.Screen name="diary/new" options={{ presentation: "modal" }} />
        <Stack.Screen name="diary/[id]" options={{ presentation: "card" }} />
        <Stack.Screen name="crisis/index" options={{ presentation: "fullScreenModal" }} />
        <Stack.Screen name="profile/index" options={{ presentation: "card" }} />
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