import { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Text } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import M3Button from "../../components/M3Button";
import { getAllExercises } from "../../lib/db";
import {
  CATEGORIES,
  CATEGORY_TOKENS,
  Exercise,
  ExerciseCategory,
  MciGlyph,
} from "../../types/exercise";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";

/**
 * Exercise detail (02-exercise-detail.md) — 3–5 actions: understand · start ·
 * resume previous · favourite.
 *
 * Treatment: the exercise's own --ex-* identity colour carries a tinted hero
 * (icon medallion + title + meta pills), so there is no separate app-bar label
 * to contradict the screen — the back control floats over the hero. "What this
 * is" is a tinted statement card; "What to expect" is an icon list (no plain
 * bullet text). The Start action is pinned at the thumb line in the exercise
 * colour, with the sign-in note as a quiet lock row above it.
 */
const EXPECT_ITEMS: { icon: MciGlyph; text: string }[] = [
  { icon: "format-list-numbered", text: "A few gentle steps, one at a time" },
  { icon: "heart-outline", text: "No need to do it \"right\"" },
  { icon: "pause-circle-outline", text: "You can stop at any point" },
  { icon: "chart-line", text: "A before & after check-in, both skippable" },
];

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

  const catKey = (exercise?.category as ExerciseCategory) ?? "breathing";
  const t = CATEGORY_TOKENS[catKey in CATEGORY_TOKENS ? catKey : "breathing"];
  const tone = { fg: c[t.fg], bg: c[t.bg] };
  const catIcon = CATEGORIES.find((cat) => cat.key === exercise?.category)?.icon ?? "meditation";
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
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        {/* Hero — the exercise's own colour field */}
        <View style={[styles.hero, { backgroundColor: tone.bg, paddingTop: insets.top + 8 }]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={[styles.backBtn, { backgroundColor: c.surface2, top: insets.top + 8 }]}
          >
            <MaterialCommunityIcons name="arrow-left" size={22} color={c.text} />
          </Pressable>

          <View style={[styles.medallion, { backgroundColor: c.surface2 }]}>
            <MaterialCommunityIcons name={catIcon} size={40} color={tone.fg} />
          </View>

          <Text variant="headlineMedium" style={[styles.heroTitle, { color: c.text }]}>
            {exercise.title}
          </Text>

          <View style={styles.metaRow}>
            <View style={[styles.metaPill, { backgroundColor: c.surface2 }]}>
              <MaterialCommunityIcons name={catIcon} size={14} color={tone.fg} />
              <Text style={[styles.metaText, { color: tone.fg }]}>{catLabel}</Text>
            </View>
            <View style={[styles.metaPill, { backgroundColor: c.surface2 }]}>
              <MaterialCommunityIcons name="format-list-numbered" size={14} color={c.textMuted} />
              <Text style={[styles.metaText, { color: c.textMuted }]}>
                {exercise.steps.length} steps
              </Text>
            </View>
            <View style={[styles.metaPill, { backgroundColor: c.surface2 }]}>
              <MaterialCommunityIcons name="clock-outline" size={14} color={c.textMuted} />
              <Text style={[styles.metaText, { color: c.textMuted }]}>
                {exercise.duration_minutes ? `~${exercise.duration_minutes} min` : "no fixed time"}
              </Text>
            </View>
          </View>
        </View>

        <View style={styles.body}>
          {/* What this is — tinted statement card */}
          <View style={[styles.aboutCard, { backgroundColor: tone.bg }]}>
            <View style={styles.aboutHead}>
              <View style={[styles.aboutIcon, { backgroundColor: c.surface2 }]}>
                <MaterialCommunityIcons name="information-outline" size={18} color={tone.fg} />
              </View>
              <Text style={[styles.aboutTitle, { color: tone.fg }]}>What this is</Text>
            </View>
            <Text style={[styles.aboutText, { color: c.text }]}>
              {exercise.category === "sensory" && exercise.title === "5-4-3-2-1 Grounding"
                ? "A grounding practice that brings your attention back to the present — noticing things around you one sense at a time. Helpful when thoughts spiral, or when you feel far away from the room."
                : `A ${catLabel.toLowerCase()} practice from the workbook toolkit — short, guided, and yours to use whenever you need it.`}
            </Text>
          </View>

          {/* What to expect — icon list */}
          <Text style={[styles.sectionLabel, { color: c.text }]}>What to expect</Text>
          <View style={[styles.expectCard, { backgroundColor: c.surface }]}>
            {EXPECT_ITEMS.map((item, i) => (
              <View key={item.text} style={[styles.expectRow, i > 0 ? styles.expectRowBorder : null]}>
                <View style={[styles.expectIcon, { backgroundColor: tone.bg }]}>
                  <MaterialCommunityIcons name={item.icon} size={18} color={tone.fg} />
                </View>
                <Text style={[styles.expectText, { color: c.textMuted }]}>{item.text}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Pinned action bar */}
      <View
        style={[
          styles.actionBar,
          { backgroundColor: c.bg, paddingBottom: insets.bottom + 16, borderTopColor: c.divider },
        ]}
      >
        <View style={styles.signinRow}>
          <MaterialCommunityIcons name="lock-outline" size={14} color={c.textMuted} />
          <Text style={[styles.signinText, { color: c.textMuted }]}>
            Sign-in is only needed to save — you can try it freely first.
          </Text>
        </View>
        <M3Button
          label="Start exercise"
          icon="play"
          color={tone.fg}
          onPress={() => router.push(`/exercise/session/${exercise.id}`)}
          style={styles.startBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  hero: {
    paddingHorizontal: 20,
    paddingBottom: 28,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    alignItems: "center",
  },
  backBtn: {
    position: "absolute",
    left: 16,
    top: 0,
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 1 },
    elevation: 2,
  },
  medallion: {
    width: 88,
    height: 88,
    borderRadius: 44,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  heroTitle: {
    fontWeight: "800",
    textAlign: "center",
    marginTop: 16,
    letterSpacing: -0.4,
  },
  metaRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 16, justifyContent: "center" },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  metaText: { fontSize: 12.5, fontWeight: "600", letterSpacing: 0.1 },
  body: { padding: 20 },
  aboutCard: { borderRadius: 16, padding: 18 },
  aboutHead: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  aboutIcon: { width: 30, height: 30, borderRadius: 15, alignItems: "center", justifyContent: "center" },
  aboutTitle: { fontSize: 13, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
  aboutText: { fontSize: 15.5, lineHeight: 24, opacity: 0.92 },
  sectionLabel: {
    marginTop: 26,
    marginBottom: 10,
    fontSize: 13,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    opacity: 0.75,
  },
  expectCard: { borderRadius: 16, paddingHorizontal: 16, paddingVertical: 4 },
  expectRow: { flexDirection: "row", alignItems: "center", gap: 14, paddingVertical: 14 },
  expectRowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(0,0,0,0.08)" },
  expectIcon: { width: 34, height: 34, borderRadius: 17, alignItems: "center", justifyContent: "center" },
  expectText: { flex: 1, fontSize: 14.5, lineHeight: 21 },
  actionBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  signinRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    marginBottom: 12,
  },
  signinText: { fontSize: 12, opacity: 0.9, flexShrink: 1 },
  startBtn: { alignSelf: "stretch" },
});