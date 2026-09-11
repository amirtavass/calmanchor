import { StyleSheet, View } from "react-native";
import { FAB } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAppTheme } from "../theme/ThemeContext";

/**
 * Persistent Crisis FAB — floats above the tab bar on every tab.
 * One tap → full-screen crisis modal. Never gated, never hidden (D14 / IA §6).
 */
export default function CrisisFab() {
  const router = useRouter();
  const { mode } = useAppTheme();

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <FAB
        icon="hand-heart"
        style={styles.fab}
        color={mode === "dark" ? "#1E2E16" : "#F4F1EB"}
        onPress={() => router.push("/crisis/index")}
        testID="crisis-fab"
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
    backgroundColor: "#BF3A2A",
  },
});