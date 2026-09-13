import { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Text } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import ScreenHeader from "../../components/ScreenHeader";
import M3Chip from "../../components/M3Chip";
import M3Button from "../../components/M3Button";
import M3Card from "../../components/M3Card";
import { getAllExercises, getSessions } from "../../lib/db";
import {
  CATEGORIES,
  CATEGORY_TOKENS,
  Exercise,
  ExerciseCategory,
} from "../../types/exercise";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";

/**
 * Exercises landing — 04-landing D2 "Colour fields".
 * Category tiles are blocks of their own --ex-*-bg colour; the state filter chips
 * speak the survival-response palette (--sr-*). Icons are MaterialCommunityIcons
 * (rules §2.1). A quiet "Done today" row reflects completion (03-session-flow §6).
 */
export default function ExercisesScreen() {
  const router = useRouter();
  const { mode } = useAppTheme();
  const c = colors[mode];

  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [stateFilter, setStateFilter] = useState<string | null>(null);
  const [recentSession, setRecentSession] = useState<SessionRow | null>(null);

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

  useEffect(() => {
    (async () => {
      try {
        const s = await getSessions();
        if (s && s.length) setRecentSession(s[0]);
      } catch {
        // Not signed in (or offline) — the done-today row simply stays hidden.
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

  // Survival-response tint for each state chip (04-landing D2 / design-system §4).
  // Design-system pill idiom (.ex-chip/.mpill): --sr-*-bg fill, --sr-* stroke,
  // --sr-* icon + label; selected = solid --sr-* fill. The icon carries the
  // state's meaning so colour is never the only differentiator (fight vs flight).
  const STATE_TONES: Record<
    string,
    { bg: keyof typeof colors.light; fg: keyof typeof colors.light; icon: "flash" | "run" | "snowflake" | "handshake" | "leaf" }
  > = {
    fight: { bg: "srFightBg", fg: "srFight", icon: "flash" },
    flight: { bg: "srFlightBg", fg: "srFlight", icon: "run" },
    freeze: { bg: "srFreezeBg", fg: "srFreeze", icon: "snowflake" },
    fawn: { bg: "srFawnBg", fg: "srFawn", icon: "handshake" },
    regulated: { bg: "nsWindowBg", fg: "nsWindow", icon: "leaf" },
  };
  const stateChip = (label: string, key: string) => {
    const t = STATE_TONES[key];
    return (
      <M3Chip
        label={label}
        icon={t.icon}
        tint={{ bg: c[t.bg], fg: c[t.fg] }}
        selected={stateFilter === key}
        onPress={() => setStateFilter(stateFilter === key ? null : key)}
      />
    );
  };

  // Quick start: the app's go-to exercises (design "Favourites (quick start)").
  const QUICK_TITLES = ["5-4-3-2-1 Grounding", "Gentle Inhale & Exhale"];
  const quickStart = exercises.filter((e) => QUICK_TITLES.includes(e.title));

  const categoryIcon = (key: string) =>
    CATEGORIES.find((cat) => cat.key === key)?.icon ?? "meditation";
  const categoryLabel = (key: string) =>
    CATEGORIES.find((cat) => cat.key === key)?.label ?? key;
  const categoryTone = (key: string) => {
    const t = CATEGORY_TOKENS[key as ExerciseCategory] ?? CATEGORY_TOKENS.breathing;
    return { fg: c[t.fg], bg: c[t.bg] };
  };

  const timeLabel = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  // M3 two-line list row (lists/specs) + trailing filled button.
  const ExerciseRow = ({ ex, star }: { ex: Exercise; star?: boolean }) => {
    const tone = categoryTone(ex.category);
    return (
      <View style={styles.listRow}>
        <View style={[styles.leadIcon, { backgroundColor: tone.bg }]}>
          <MaterialCommunityIcons name={categoryIcon(ex.category)} size={22} color={tone.fg} />
        </View>
        <View style={styles.listText}>
          <View style={styles.listTitleLine}>
            {star ? <Text style={[styles.star, { color: c.warmGold }]}>★</Text> : null}
            <Text style={[styles.listLabel, { color: c.text }]}>{ex.title}</Text>
          </View>
          <Text style={[styles.listSupporting, { color: c.textMuted }]}>
            {categoryLabel(ex.category)} · {ex.steps.length} steps
            {ex.duration_minutes ? ` · ~${ex.duration_minutes} min` : " · no fixed time"}
          </Text>
        </View>
        <M3Button label="Start" onPress={() => router.push(`/exercise/${ex.id}`)} />
      </View>
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <ScreenHeader title="Exercises" subtitle="What might help right now" />
      <ScrollView contentContainerStyle={styles.body}>
        {loading ? (
          <Text style={muted(c)}>Loading exercises…</Text>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={[muted(c), { color: c.error }]}>
              Couldn't load exercises. {error}
            </Text>
            <M3Button label="Retry" onPress={() => setError(null)} style={styles.retry} />
          </View>
        ) : (
          <>
            <Text style={styles.sectionTitle}>How are you feeling?</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
              style={styles.chipsScroll}
            >
              {stateChip("Fight", "fight")}
              {stateChip("Flight", "flight")}
              {stateChip("Freeze", "freeze")}
              {stateChip("Fawn", "fawn")}
              {stateChip("OK / regulated", "regulated")}
            </ScrollView>

            {recentSession && recentSession.exercises && recentSession.exercise_id ? (
              <View
                style={[
                  styles.doneCard,
                  { backgroundColor: c.successTint, borderColor: c.successSubtle },
                ]}
              >
                <Text style={[styles.doneTitle, { color: c.success }]}>Done today</Text>
                <View style={styles.listRow}>
                  <View style={styles.listText}>
                    <Text style={[styles.listLabel, { color: c.text }]}>
                      {recentSession.exercises.title}
                    </Text>
                    <Text style={[styles.listSupporting, { color: c.textMuted }]}>
                      {timeLabel(recentSession.started_at)}
                      {recentSession.helpfulness != null
                        ? ` · helped ${recentSession.helpfulness}/10`
                        : ""}
                    </Text>
                  </View>
                  <M3Button
                    label="Do again"
                    onPress={() => router.push(`/exercise/session/${recentSession.exercise_id}`)}
                  />
                </View>
              </View>
            ) : null}

            {stateFilter ? (
              <>
                <Text style={styles.sectionTitle}>Suggested for {stateFilter}</Text>
                <Text style={[styles.sectionSub, muted(c)]}>
                  Ideas only — skip or browse below if they don't fit.
                </Text>
                {filtered.length === 0 ? (
                  <Text style={muted(c)}>
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
                    const tone = categoryTone(cat.key);
                    return (
                      <View key={cat.key} style={styles.tile}>
                        <M3Card
                          fill={tone.bg}
                          onPress={() => router.push(`/exercise/category/${cat.key}`)}
                        >
                          <MaterialCommunityIcons name={cat.icon} size={28} color={tone.fg} />
                          <Text style={[styles.tileLabel, { color: tone.fg }]}>{cat.label}</Text>
                          <Text style={[styles.tileCount, { color: tone.fg }]}>
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
                    <Text style={[styles.sectionSub, muted(c)]}>
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

interface SessionRow {
  id: string;
  exercise_id: string | null;
  started_at: string;
  helpfulness: number | null;
  exercises: { title: string; category: string } | null;
}

const muted = (c: typeof colors.light) => ({ color: c.textMuted, opacity: 0.85 });

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 96 },
  chipsScroll: { marginHorizontal: -16, paddingHorizontal: 16, marginBottom: 8 },
  chips: { flexDirection: "row", gap: 8, paddingRight: 16 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  tile: { width: "48%", flexGrow: 1 },
  tileLabel: { marginTop: 8, fontSize: 16, lineHeight: 24, fontWeight: "700" },
  tileCount: { marginTop: 2, fontSize: 12, lineHeight: 16, opacity: 0.75 },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 8,
    fontSize: 20,
    fontWeight: "800",
    letterSpacing: -0.02,
  },
  sectionSub: { marginBottom: 16, fontSize: 14, lineHeight: 20 },
  doneCard: {
    marginTop: 16,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  doneTitle: { fontSize: 13, fontWeight: "700", marginBottom: 4 },
  listRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  leadIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  listText: { flex: 1 },
  listTitleLine: { flexDirection: "row", alignItems: "center", gap: 6 },
  listLabel: { fontSize: 16, lineHeight: 24, fontWeight: "400" },
  listSupporting: { marginTop: 2, fontSize: 14, lineHeight: 20, opacity: 0.85 },
  star: { fontSize: 18 },
  browseAll: { alignSelf: "flex-start", marginTop: 8, paddingVertical: 8 },
  browseAllText: { fontSize: 14, lineHeight: 20, fontWeight: "500", letterSpacing: 0.1 },
  errorBox: { paddingVertical: 24, alignItems: "center" },
  retry: { marginTop: 12 },
});