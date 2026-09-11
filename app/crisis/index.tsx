import { View, StyleSheet } from "react-native";
import { Button, Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";

/**
 * Crisis landing (modal). Ground / Breathe / Quick Reset + UK contacts.
 * Exercises (S11) wired in the crisis pass; this is the navigatable shell.
 */
export default function CrisisIndexScreen() {
  const router = useRouter();
  const { mode } = useAppTheme();
  const c = colors[mode];

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Button icon="close" onPress={() => router.back()} mode="text">
          Close
        </Button>
        <Text variant="titleMedium" style={{ fontWeight: "700" }}>
          Crisis help
        </Text>
        <View style={{ width: 64 }} />
      </View>
      <View style={styles.body}>
        <Text variant="titleLarge" style={{ fontWeight: "700", marginBottom: 8 }}>
          Take a moment.
        </Text>
        <Text variant="bodyMedium" style={[styles.muted, { marginBottom: 20 }]}>
          Grounding, breathing and your quick reset are one tap away.
        </Text>
        <Button mode="contained" style={styles.btn} onPress={() => router.back()}>
          Ground — 5-4-3-2-1
        </Button>
        <Button mode="contained" style={styles.btn} onPress={() => router.back()}>
          Breathe — box breathing
        </Button>
        <Text variant="bodySmall" style={[styles.muted, { marginTop: 24 }]}>
          UK: Samaritans 116 123 · Shout 85258 · NHS 111
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  body: { padding: 20 },
  muted: { color: "#5A5645", opacity: 0.85 },
  btn: { borderRadius: 12, marginBottom: 12 },
});