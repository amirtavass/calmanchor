import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import type { ComponentProps } from "react";
import { useAppTheme } from "../theme/ThemeContext";
import { colors } from "../theme/tokens";

type MciGlyph = ComponentProps<typeof MaterialCommunityIcons>["name"];

/**
 * Theme toggle — single button that cycles light ↔ dark. Sun + moon glyphs
 * swap to hint at the next state. `surface2` background with a `border` ring
 * so it sits in the small-app-bar right side consistently across every screen.
 *
 * The accompanying text shows the *current* resolved mode (not the next) —
 * because that's what the user is looking at right now.
 */
export default function ThemeToggle() {
  const { mode, toggle } = useAppTheme();
  const c = colors[mode];

  const icon: MciGlyph = mode === "dark" ? "weather-sunny" : "weather-night";
  const label = mode === "dark" ? "Dark" : "Light";
  const hint =
    mode === "dark"
      ? "Dark mode. Tap to switch to light."
      : "Light mode. Tap to switch to dark.";

  return (
    <Pressable
      onPress={toggle}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel={`Theme: ${label}. ${hint}`}
      testID="theme-toggle"
      style={[styles.btn, { backgroundColor: c.surface2, borderColor: c.border }]}
    >
      <MaterialCommunityIcons name={icon} size={18} color={c.secondary} />
      <View style={styles.textCol}>
        <Text style={[styles.kicker, { color: c.textMuted }]}>Theme</Text>
        <Text style={[styles.label, { color: c.text }]}>{label}</Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 10,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
  },
  textCol: { gap: 0 },
  kicker: { fontSize: 8.5, lineHeight: 10, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },
  label: { fontSize: 11.5, lineHeight: 14, fontWeight: "800", marginTop: -1 },
});
