import { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Text } from "react-native-paper";
import { useRouter } from "expo-router";
import ScreenHeader from "../../components/ScreenHeader";
import M3Chip from "../../components/M3Chip";
import M3Button from "../../components/M3Button";
import M3Card from "../../components/M3Card";
import { getAllExercises } from "../../lib/db";
import {
  CATEGORIES,
  CATEGORY_TOKENS,
  Exercise,
  ExerciseCategory,
} from "../../types/exercise";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";

/**
 * Exercises landing — Layout A (category cards, design-system colours + emoji per
 * category) with Layout B's "How are you feeling?" filter (01-landing-variants.md).
 * M3 component usage per docs/ui/sections/exercises/00-m3-design-ledger.md:
 *   small app bar · filter chips (bare row) · filled cards w/ --ex-* accent ·
 *   brand section titles · two-line list + filled buttons for quick start.
 */
export default function ExercisesScreen() {
  const router = useRouter();
  const { mode } = useAppTheme();
  const c = colors[mode];

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getAllExercises();
        setExercises(data ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const counts: Record<string, number> = {};
  for (const ex of exercises) counts[ex.category] = (counts[ex.category] ?? 0) + 1;

  // Suggested category for each nervous-system state (Layout B idea).
  const stateToCategory: Record<string, ExerciseCategory> = {
    fight: "crisis",
    flight: "crisis",
    freeze: "sensory",
    fawn: "voice",
    regulated: "breathing",
  };
  const filtered =
    stateFilter && stateToCategory[stateFilter]
      ? exercises.filter((e) => e.category === stateToCategory[stateFilter])
      : [];

  // Quick start: the app's go-to exercises (design "Favourites (quick start)").
  const QUICK_TITLES = ["Gentle Inhale & Exhale", "Humming"];
  const quickStart = exercises.filter((e) => QUICK_TITLES.includes(e.title));

  const mutedStyle = { color: c.textMuted, opacity: 0.85 };
  const categoryLabel = (key: string) =>
    CATEGORIES.find((cat) => cat.key === key)?.label ?? key;

  // M3 two-line list row (lists/specs): label body-large, supporting body-medium,
  // trailing filled button.
  const ExerciseRow = ({ ex, star }: { ex: Exercise; star?: boolean }) => (
    <View style={styles.listRow}>
      {star ? <Text style={[styles.star, { color: c.warmGold }]}>★</Text> : null}
      <View style={styles.listText}>
        <Text style={[styles.listLabel, { color: c.text }]}>{ex.title}</Text>
        <Text style={[styles.listSupporting, { color: c.textMuted }]}>
          {categoryLabel(ex.category)} · {ex.steps.length} steps
          {ex.duration_minutes ? ` · ~${ex.duration_minutes} min` : " · no fixed time"}
        </Text>
      </View>
      <M3Button label="Start" onPress={() => router.push(`/exercise/${ex.id}`)} />
    </View>
  );

  const States = () => (
    <>
      <Text style={styles.sectionTitle}>How are you feeling?</Text>
      <View style={styles.chips}>
        <M3Chip
          label="Fight"
          selected={stateFilter === "fight"}
          onPress={() => setStateFilter(stateFilter === "fight" ? null : "fight")}
        />
        <M3Chip
          label="Flight"
          selected={stateFilter === "flight"}
          onPress={() => setStateFilter(stateFilter === "flight" ? null : "flight")}
        />
        <M3Chip
          label="Freeze"
          selected={stateFilter === "freeze"}
          onPress={() => setStateFilter(stateFilter === "freeze" ? null : "freeze")}
        />
        <M3Chip
          label="Fawn"
          selected={stateFilter === "fawn"}
          onPress={() => setStateFilter(stateFilter === "fawn" ? null : "fawn")}
        />
        <M3Chip
          label="OK / regulated"
          selected={stateFilter === "regulated"}
          onPress={() => setStateFilter(stateFilter === "regulated" ? null : "regulated")}
        />
      </View>
    </>
  );

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <ScreenHeader title="Exercises" subtitle="What might help right now" />
      <ScrollView contentContainerStyle={styles.body}>
        {loading ? (
          <Text style={mutedStyle}>Loading exercises…</Text>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={[mutedStyle, { color: c.error }]}>
              Couldn't load exercises. {error}
            </Text>
            <M3Button label="Retry" onPress={() => setError(null)} style={styles.retry} />
          </View>
        ) : (
          <>
            <States />

            {stateFilter ? (
              <>
                <Text style={styles.sectionTitle}>Suggested for {stateFilter}</Text>
                <Text style={[styles.sectionSub, mutedStyle]}>
                  Ideas only — skip or browse below if they don't fit.
                </Text>
                {filtered.length === 0 ? (
                  <Text style={mutedStyle}>
                    No suggestions yet for this state — browse all categories below.
                  </Text>
                ) : (
                  filtered.map((ex) => <ExerciseRow key={ex.id} ex={ex} />)
                )}
                <Pressable
                  onPress={() => setStateFilter(null)}
                  style={styles.browseAll}
                  accessibilityRole="button"
                >
                  <Text style={[styles.browseAllText, { color: c.primary }]}>
                    Browse all categories →
                  </Text>
                </Pressable>
              </>
            ) : (
              <>
                <View style={styles.grid}>
                  {CATEGORIES.map((cat) => {
                    const tokens = CATEGORY_TOKENS[cat.key];
                    const fg = c[tokens.fg];
                    return (
                      <View key={cat.key} style={styles.tile}>
                        <M3Card
                          accentColor={fg}
                          onPress={() => router.push(`/exercise/category/${cat.key}`)}
                        >
                          <Text style={styles.tileEmoji}>{cat.emoji}</Text>
                          <Text style={[styles.tileLabel, { color: c.text }]}>
                            {cat.label}
                          </Text>
                          <Text style={[styles.tileCount, { color: c.textMuted }]}>
                            {counts[cat.key] ?? 0} exercises
                          </Text>
                        </M3Card>
                      </View>
                    );
                  })}
                </View>

                {quickStart.length > 0 ? (
                  <>
                    <Text style={styles.sectionTitle}>Quick start</Text>
                    <Text style={[styles.sectionSub, mutedStyle]}>
                      Your go-to exercises — one tap away.
                    </Text>
                    {quickStart.map((ex) => (
                      <ExerciseRow key={ex.id} ex={ex} star />
                    ))}
                  </>
                ) : null}
              </>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 96 },
  chips: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 8 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  tile: { width: "48%", flexGrow: 1 },
  tileEmoji: { fontSize: 34, lineHeight: 40 },
  tileLabel: { marginTop: 6, fontSize: 16, lineHeight: 24, fontWeight: "700" },
  tileCount: { marginTop: 2, fontSize: 12, lineHeight: 16, opacity: 0.85 },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 8,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.02,
  },
  sectionSub: { marginBottom: 16, fontSize: 14, lineHeight: 20 },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  listText: { flex: 1 },
  listLabel: { fontSize: 16, lineHeight: 24, fontWeight: "400" },
  listSupporting: { marginTop: 2, fontSize: 14, lineHeight: 20, opacity: 0.85 },
  star: { fontSize: 18 },
  browseAll: { alignSelf: "flex-start", marginTop: 8, paddingVertical: 8 },
  browseAllText: { fontSize: 14, lineHeight: 20, fontWeight: "500", letterSpacing: 0.1 },
  errorBox: { paddingVertical: 24, alignItems: "center" },
  retry: { marginTop: 12 },
});