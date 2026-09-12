import { Tabs } from "expo-router";
import { StyleSheet, View } from "react-native";
import CrisisFab from "../../components/CrisisFab";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";

/**
 * Bottom-tab shell (D14). Tabs styled to Material 3 / Calm Anchor tokens.
 * Crisis FAB floats above the tab bar on every tab.
 * Tab order: Home · Toolkit · Exercises · Diary · Portfolio.
 */
export default function TabsLayout() {
  const { mode } = useAppTheme();
  const c = colors[mode];

  return (
    <View style={styles.root}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: c.primary,
          tabBarInactiveTintColor: c.textMuted,
          tabBarStyle: {
            backgroundColor: c.surface,
            borderTopColor: c.divider,
            borderTopWidth: StyleSheet.hairlineWidth,
          },
          tabBarLabelStyle: { fontWeight: "600", fontSize: 11 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: "Home", tabBarIcon: ({ color, size }) => <IonIcon name="home" color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="toolkit"
          options={{ title: "Toolkit", tabBarIcon: ({ color, size }) => <IonIcon name="book" color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="exercises"
          options={{ title: "Exercises", tabBarIcon: ({ color, size }) => <IonIcon name="fitness" color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="diary"
          options={{ title: "Diary", tabBarIcon: ({ color, size }) => <IonIcon name="create" color={color} size={size} /> }}
        />
        <Tabs.Screen
          name="portfolio"
          options={{ title: "Portfolio", tabBarIcon: ({ color, size }) => <IonIcon name="star" color={color} size={size} /> }}
        />
      </Tabs>
      <CrisisFab />
    </View>
  );
}

// Small icon helper to avoid pulling in a full icon-font mapping in the layout.
// Uses the MaterialIcons glyph set shipped with @expo/vector-icons.
import Ionicons from "@expo/vector-icons/Ionicons";
import type { ColorValue } from "react-native";
function IonIcon({ name, color, size }: { name: string; color: ColorValue; size: number }) {
  return <Ionicons name={name as any} color={color as string} size={size} />;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
});