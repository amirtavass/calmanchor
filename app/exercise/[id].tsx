import { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Button, Card, Chip, Text } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAllExercises } from "../../lib/db";
import { Exercise } from "../../types/exercise";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";

/**
 * Exercise detail (02-exercise-detail.md).
 * 3–5 actions: understand (what/expect) · start · resume previous · favourite.
 */
export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { mode } = useAppTheme();
  const c = colors[mode];

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const all = (await getAllExercises()) ?? [];
        setExercise(all.find((e) => e.id === id) ?? null);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: c.bg, justifyContent: "center", alignItems: "center" }]}>
        <Text style={styles.muted}>Loading exercise…</Text>
      </View>
    );
  }

  if (error || !exercise) {
    return (
      <View style={[styles.root, { backgroundColor: c.bg, justifyContent: "center", alignItems: "center", padding: 24 }]}>
        <Text variant="titleMedium" style={{ color: c.error, textAlign: "center" }}>
          {error ?? "This exercise isn't available."}
        </Text>
        <Text variant="bodyMedium" style={[styles.muted, { marginTop: 8, textAlign: "center" }]}>
          It may have been removed from the workbook catalogue.
        </Text>
        <Button mode="contained" onPress={() => router.replace("/(tabs)/exercises")} style={{ marginTop: 16 }}>
          Browse all exercises
        </Button>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Button icon="arrow-left" onPress={() => router.back()} mode="text">
          Back
        </Button>
        <Text variant="titleMedium" style={{ fontWeight: "700" }}>
          Exercises
        </Text>
        <View style={{ width: 64 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={styles.chipRow}>
          <Chip mode="outlined" style={styles.chip}>
            {exercise.category}
          </Chip>
          <Chip mode="outlined" style={styles.chip}>
            {exercise.steps.length} steps
          </Chip>
          <Chip mode="outlined" style={styles.chip}>
            {exercise.duration_minutes ? `~${exercise.duration_minutes} min` : "no fixed time"}
          </Chip>
        </View>

        <Text variant="headlineSmall" style={{ fontWeight: "700", marginTop: 12 }}>
          {exercise.title}
        </Text>

        <Text variant="titleMedium" style={styles.sectionLabel}>
          What this is
        </Text>
        <Text variant="bodyMedium" style={styles.muted}>
          {exercise.category === "sensory" && exercise.title === "5-4-3-2-1 Grounding"
            ? "Brings your attention back to the present by noticing things around you, one sense at a time. Useful when thoughts spiral or you feel disconnected."
            : `A ${exercise.category} exercise from the workbook toolkit.`}
        </Text>

        <Text variant="titleMedium" style={styles.sectionLabel}>
          What to expect
        </Text>
        <View style={styles.expect}>
          <Text variant="bodyMedium" style={styles.muted}>
            · {exercise.steps.length} gentle steps
          </Text>
          <Text variant="bodyMedium" style={styles.muted}>
            · No need to do it "right"
          </Text>
          <Text variant="bodyMedium" style={styles.muted}>
            · You can stop any time
          </Text>
          <Text variant="bodyMedium" style={styles.muted}>
            · You'll be asked how you feel before & after
          </Text>
        </View>

        <Button
          mode="contained"
          style={styles.startBtn}
          contentStyle={styles.startContent}
          onPress={() => router.push(`/exercise/session/${exercise.id}`)}
        >
          Start
        </Button>
        <Text variant="bodySmall" style={[styles.muted, { textAlign: "center", marginTop: 12 }]}>
          Sign-in is only needed when you save a session — you can preview freely.
        </Text>
      </ScrollView>
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
  body: { padding: 16, paddingBottom: 48 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: { margin: 0 },
  sectionLabel: { marginTop: 20, marginBottom: 6, fontWeight: "700" },
  expect: { gap: 4 },
  startBtn: { marginTop: 28, borderRadius: 12 },
  startContent: { paddingVertical: 6 },
  muted: { color: "#5A5645", opacity: 0.85 },
});