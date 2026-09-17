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
        <Text variant="titleMedium" style={{ fontWeight: "700", color: c.text }}>
          Crisis help
        </Text>
        <View style={{ width: 64 }} />
      </View>
      <View style={styles.body}>
        <Text variant="titleLarge" style={{ fontWeight: "700", color: c.text, marginBottom: 8 }}>
          Take a moment.
        </Text>
        <Text variant="bodyMedium" style={[muted(c), { marginBottom: 20 }]}>
          Grounding, breathing and your quick reset are one tap away.
        </Text>
        <Button mode="contained" buttonColor={c.secondaryActive} textColor={c.textInverse} style={styles.btn} onPress={() => router.back()}>
          Ground — 5-4-3-2-1
        </Button>
        <Button mode="contained" buttonColor={c.secondaryActive} textColor={c.textInverse} style={styles.btn} onPress={() => router.back()}>
          Breathe — box breathing
        </Button>
        <Text variant="bodySmall" style={[muted(c), { marginTop: 24 }]}>
          UK: Samaritans 116 123 · Shout 85258 · NHS 111
        </Text>
      </View>
    </View>
  );
}

const muted = (c: typeof colors.light) => ({ color: c.textMuted, opacity: 0.85 });

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
  btn: { borderRadius: 12, marginBottom: 12 },
});