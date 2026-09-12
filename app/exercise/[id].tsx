import { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Text } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import M3Button from "../../components/M3Button";
import { getAllExercises } from "../../lib/db";
import { CATEGORIES, CATEGORY_TOKENS, Exercise, ExerciseCategory } from "../../types/exercise";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";

/**
 * Exercise detail (02-exercise-detail.md) — M3 treatment consistent with the
 * landing. 3–5 actions: understand · start · resume previous · favourite.
 */
export default function ExerciseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
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

  const tone =
    exercise && (exercise.category as ExerciseCategory) in CATEGORY_TOKENS
      ? (() => {
          const t = CATEGORY_TOKENS[exercise.category as ExerciseCategory];
          return { fg: c[t.fg], bg: c[t.bg] };
        })()
      : { fg: c.primary, bg: c.primarySubtle };
  const catIcon =
    CATEGORIES.find((cat) => cat.key === exercise?.category)?.icon ?? "meditation";
  const catLabel =
    CATEGORIES.find((cat) => cat.key === exercise?.category)?.label ?? exercise?.category ?? "";

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: c.bg, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: c.textMuted, opacity: 0.85 }}>Loading exercise…</Text>
      </View>
    );
  }

  if (error || !exercise) {
    return (
      <View
        style={[
          styles.root,
          { backgroundColor: c.bg, justifyContent: "center", alignItems: "center", padding: 24 },
        ]}
      >
        <Text variant="titleMedium" style={{ color: c.error, textAlign: "center" }}>
          {error ?? "This exercise isn't available."}
        </Text>
        <Text variant="bodyMedium" style={{ color: c.textMuted, marginTop: 8, textAlign: "center" }}>
          It may have been removed from the workbook catalogue.
        </Text>
        <M3Button
          label="Browse all exercises"
          onPress={() => router.replace("/(tabs)/exercises")}
          style={{ marginTop: 16 }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.back}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <View style={[styles.backBtn, { backgroundColor: c.surfaceOffset }]}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={c.text} />
          </View>
        </Pressable>
        <Text variant="titleMedium" style={{ fontWeight: "700", color: c.text }}>
          Exercises
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <View style={[styles.heroIcon, { backgroundColor: tone.bg }]}>
          <MaterialCommunityIcons name={catIcon} size={38} color={tone.fg} />
        </View>

        <View style={styles.chipRow}>
          <View style={[styles.tag, { backgroundColor: tone.bg }]}>
            <Text style={[styles.tagText, { color: tone.fg }]}>{catLabel}</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: c.surfaceOffset }]}>
            <Text style={[styles.tagText, { color: c.textMuted }]}>{exercise.steps.length} steps</Text>
          </View>
          <View style={[styles.tag, { backgroundColor: c.surfaceOffset }]}>
            <Text style={[styles.tagText, { color: c.textMuted }]}>
              {exercise.duration_minutes ? `~${exercise.duration_minutes} min` : "no fixed time"}
            </Text>
          </View>
        </View>

        <Text variant="headlineSmall" style={{ fontWeight: "700", marginTop: 12, color: c.text }}>
          {exercise.title}
        </Text>

        <Text variant="titleMedium" style={[styles.sectionLabel, { color: c.text }]}>
          What this is
        </Text>
        <Text variant="bodyMedium" style={{ color: c.textMuted, opacity: 0.85 }}>
          {exercise.category === "sensory" && exercise.title === "5-4-3-2-1 Grounding"
            ? "Brings your attention back to the present by noticing things around you, one sense at a time. Useful when thoughts spiral or you feel disconnected."
            : `A ${catLabel} exercise from the workbook toolkit.`}
        </Text>

        <Text variant="titleMedium" style={[styles.sectionLabel, { color: c.text }]}>
          What to expect
        </Text>
        <View style={styles.expect}>
          <Text variant="bodyMedium" style={{ color: c.textMuted, opacity: 0.85 }}>
            · {exercise.steps.length} gentle steps
          </Text>
          <Text variant="bodyMedium" style={{ color: c.textMuted, opacity: 0.85 }}>
            · No need to do it "right"
          </Text>
          <Text variant="bodyMedium" style={{ color: c.textMuted, opacity: 0.85 }}>
            · You can stop any time
          </Text>
          <Text variant="bodyMedium" style={{ color: c.textMuted, opacity: 0.85 }}>
            · You'll be asked how you feel before & after
          </Text>
        </View>

        <M3Button
          label="Start"
          onPress={() => router.push(`/exercise/session/${exercise.id}`)}
          style={styles.startBtn}
        />
        <Text variant="bodySmall" style={{ color: c.textMuted, opacity: 0.85, textAlign: "center", marginTop: 12 }}>
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
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { padding: 16, paddingBottom: 48 },
  heroIcon: {
    width: 76,
    height: 76,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 20,
  },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16 },
  tag: { borderRadius: 8, paddingHorizontal: 12, paddingVertical: 6 },
  tagText: { fontSize: 13, fontWeight: "600" },
  sectionLabel: { marginTop: 20, marginBottom: 6, fontWeight: "700" },
  expect: { gap: 4 },
  startBtn: { marginTop: 28 },
});