import { StyleSheet, View } from "react-native";
import { FAB } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAppTheme } from "../theme/ThemeContext";
import { colors } from "../theme/tokens";

/**
 * Persistent Crisis FAB — floats above the tab bar on every tab.
 * One tap → full-screen crisis modal. Never gated, never hidden (D14 / IA §6).
 *
 * Colours come from the token set so the FAB is legible in both themes; it was
 * previously a hardcoded light-mode red on a dark-mode surface (M4-01 fix).
 */
export default function CrisisFab() {
  const router = useRouter();
  const { mode } = useAppTheme();
  const c = colors[mode];

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <FAB
        icon="hand-heart"
        style={[styles.fab, { backgroundColor: c.error }]}
        color={c.textInverse}
        onPress={() => router.push("/crisis/index")}
        testID="crisis-fab"
        accessibilityLabel="Crisis support"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    right: 24,
    bottom: 88,
    zIndex: 300,
  },
  fab: {
    borderRadius: 9999,
  },
});
