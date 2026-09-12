import { useEffect, useMemo, useRef, useState } from "react";
import { Animated, ScrollView, StyleSheet, View, Pressable } from "react-native";
import { Text, TextInput } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import M3Button from "../../../components/M3Button";
import M3Card from "../../../components/M3Card";
import M3Scale from "../../../components/M3Scale";
import { getAllExercises, saveCheckin, saveSession } from "../../../lib/db";
import {
  CATEGORIES,
  CATEGORY_TOKENS,
  Exercise,
  ExerciseCategory,
  senseIconForStep,
} from "../../../types/exercise";
import { useAppTheme } from "../../../theme/ThemeContext";
import { colors } from "../../../theme/tokens";

/**
 * Guided session (03-session-flow.md + 05-session D2 "Colour-forward").
 * Flow: distress-before → step 1..n → distress-after + helpfulness → confirm →
 * result (optional state re-check-in). Order and data contract are locked by
 * /docs; this file is the component treatment.
 * - Distress scale: M3Scale (0–10 SUDS, mood-band colours, no native slider).
 * - Step screen: sense glyph in an --ex-* ring with a slow 4s pulse (RN Animated).
 * - Re-check-in: 2-col grid of survival-response tinted cards.
 */
type Stage = "pre" | "steps" | "post" | "confirm" | "done";

const CHECKIN_STATES = [
  { key: "regulated", label: "Regulated", icon: "leaf", bg: "nsWindowBg", fg: "nsWindow" },
  { key: "freeze", label: "Freeze", icon: "snowflake", bg: "srFreezeBg", fg: "srFreeze" },
  { key: "fight", label: "Fight", icon: "flash", bg: "srFightBg", fg: "srFight" },
  { key: "flight", label: "Flight", icon: "run", bg: "srFlightBg", fg: "srFlight" },
  { key: "fawn", label: "Fawn", icon: "handshake", bg: "srFawnBg", fg: "srFawn" },
] as const;

const HELP_OPTIONS = [
  { value: 0, label: "Not really" },
  { value: 5, label: "A little" },
  { value: 10, label: "Yes, it helped" },
];

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const c = colors[mode];

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<Stage>("pre");
  const [stepIdx, setStepIdx] = useState(0);
  const [distressBefore, setDistressBefore] = useState<number | null>(null);
  const [distressAfter, setDistressAfter] = useState<number | null>(null);
  const [helpfulness, setHelpfulness] = useState<number | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [selectedState, setSelectedState] = useState<string | null>(null);
  const [checkinSaved, setCheckinSaved] = useState(false);

  const startedAt = useMemo(() => new Date(), []);

  // Slow breathing pulse for the step screen (05 D2) — RN Animated, no native dep.
  const pulse = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [pulse, stepIdx, stage]);
  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] });
  const ringOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 0.55] });

  useEffect(() => {
    (async () => {
      try {
        const all = (await getAllExercises()) ?? [];
        setExercise(all.find((e) => e.id === id) ?? null);
      } catch (e) {
        setSaveError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const tone = exercise
    ? (() => {
        const t = CATEGORY_TOKENS[(exercise.category as ExerciseCategory) ?? "breathing"];
        return { fg: c[t.fg], bg: c[t.bg] };
      })()
    : { fg: c.primary, bg: c.primarySubtle };
  const catIcon = CATEGORIES.find((cat) => cat.key === exercise?.category)?.icon ?? "meditation";

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const ended = new Date();
      const durationMin = Math.max(1, Math.round((ended.getTime() - startedAt.getTime()) / 60000));
      await saveSession({
        exercise_id: exercise!.id,
        started_at: startedAt,
        ended_at: ended,
        duration_minutes: durationMin,
        distress_before: distressBefore ?? undefined,
        distress_after: distressAfter ?? undefined,
        helpfulness: helpfulness ?? undefined,
        note: note.trim() || undefined,
      });
      setStage("done");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const onCheckin = async (s: (typeof CHECKIN_STATES)[number]) => {
    if (checkinSaved) return;
    setSelectedState(s.key);
    try {
      if (s.key === "regulated") await saveCheckin({ ns_state: "regulated" });
      else await saveCheckin({ survival_response: s.key });
      setCheckinSaved(true);
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    }
  };

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: c.bg, justifyContent: "center", alignItems: "center" }]}>
        <Text style={{ color: c.textMuted, opacity: 0.85 }}>Loading…</Text>
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={[styles.root, { backgroundColor: c.bg, justifyContent: "center", alignItems: "center", padding: 24 }]}>
        <Text variant="titleMedium" style={{ color: c.error }}>This exercise isn't available.</Text>
        <M3Button label="Back" onPress={() => router.back()} style={{ marginTop: 16 }} />
      </View>
    );
  }

  const steps = exercise.steps ?? [];
  const totalSteps = steps.length;

  const header = (withDots = false) => (
    <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
      <Pressable
        onPress={() => router.back()}
        style={styles.cancel}
        hitSlop={10}
        accessibilityRole="button"
        accessibilityLabel="Cancel session"
      >
        <Text style={{ color: c.textMuted, fontWeight: "600" }}>✕ Cancel</Text>
      </Pressable>
      {withDots && totalSteps > 1 ? (
        <View style={styles.dots}>
          {steps.map((_, i) => (
            <View
              key={i}
              style={[styles.dot, { backgroundColor: i === stepIdx ? c.primary : c.divider }]}
            />
          ))}
          <Text style={[styles.count, { color: c.textMuted }]}>
            {stepIdx + 1} of {totalSteps}
          </Text>
        </View>
      ) : null}
      <View style={{ width: 72 }} />
    </View>
  );

  const page = (content: React.ReactNode, withDots = false) => (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      {header(withDots)}
      <ScrollView contentContainerStyle={styles.body}>{content}</ScrollView>
    </View>
  );

  switch (stage) {
    case "pre":
      return page(
        <View>
          <Text variant="titleLarge" style={{ fontWeight: "700", color: c.text }}>
            Before you begin
          </Text>
          <Text variant="bodyLarge" style={{ marginTop: 16, color: c.text }}>
            How distressed do you feel right now?
          </Text>
          <M3Scale value={distressBefore} onChange={setDistressBefore} />
          <Text variant="bodyMedium" style={[styles.bullet, muted(c)]}>
            · This is just for you — it helps you notice how the exercise affects you.
          </Text>
          <Text variant="bodyMedium" style={[styles.bullet, muted(c)]}>
            · You can skip.
          </Text>
          <View style={styles.actionRow}>
            <M3Button label="Skip" variant="text" onPress={() => { setStepIdx(0); setStage("steps"); }} />
            <M3Button label="Continue →" onPress={() => { setStepIdx(0); setStage("steps"); }} />
          </View>
        </View>,
      );

    case "steps": {
      const s = steps[stepIdx];
      const senseIcon = senseIconForStep(s ?? "");
      return page(
        <View style={styles.stepBody}>
          <Animated.View
            style={[
              styles.ring,
              { backgroundColor: tone.bg, borderColor: tone.fg, transform: [{ scale: ringScale }], opacity: ringOpacity },
            ]}
          >
            <MaterialCommunityIcons name={senseIcon} size={44} color={tone.fg} />
          </Animated.View>
          <Text variant="headlineMedium" style={{ fontWeight: "700", color: c.text, textAlign: "center", marginTop: 28 }}>
            {s}
          </Text>
          <Text variant="bodyMedium" style={[styles.bullet, muted(c), { textAlign: "center" }]}>
            · You can take as long as you need.
          </Text>
          <Text variant="bodyMedium" style={[styles.bullet, muted(c), { textAlign: "center" }]}>
            · Nothing here is "wrong".
          </Text>
          <View style={styles.stepNav}>
            <M3Button
              label="‹ Back"
              variant="outlined"
              onPress={() => setStepIdx(Math.max(0, stepIdx - 1))}
              disabled={stepIdx === 0}
              style={{ flex: 1 }}
            />
            <M3Button
              label={stepIdx + 1 >= totalSteps ? "Finish" : "Next ›"}
              variant="outlined"
              onPress={() => {
                if (stepIdx + 1 >= totalSteps) setStage("post");
                else setStepIdx(stepIdx + 1);
              }}
              style={{ flex: 1 }}
            />
          </View>
        </View>,
        true,
      );
    }

    case "post":
      return page(
        <View>
          <Text variant="titleLarge" style={{ fontWeight: "700", color: c.text }}>
            That's it — well done for showing up.
          </Text>
          <Text variant="bodyLarge" style={{ marginTop: 20, color: c.text }}>
            How distressed do you feel now?
          </Text>
          <M3Scale value={distressAfter} onChange={setDistressAfter} />

          <Text variant="bodyLarge" style={{ marginTop: 20, color: c.text }}>
            Did this exercise help?
          </Text>
          <View style={styles.helpRow}>
            {HELP_OPTIONS.map((h) => (
              <M3Button
                key={h.value}
                label={h.label}
                variant="outlined"
                selected={helpfulness === h.value}
                onPress={() => setHelpfulness(h.value)}
              />
            ))}
          </View>

          <TextInput
            mode="outlined"
            label="Add a note (optional)"
            value={note}
            onChangeText={setNote}
            multiline
            style={styles.note}
            outlineColor={c.divider}
            activeOutlineColor={c.primary}
            placeholder="What did you notice?"
          />

          <View style={styles.actionRow}>
            <M3Button label="Skip" variant="text" onPress={() => setStage("confirm")} />
            <M3Button label="Review & save" onPress={() => setStage("confirm")} />
          </View>
        </View>,
      );

    case "confirm":
      return page(
        <View>
          <Text variant="titleLarge" style={{ fontWeight: "700", color: c.text }}>
            Review what will be saved
          </Text>
          <View style={[styles.reviewCard, { backgroundColor: c.surface }]}>
            <ReviewRow label="Exercise" value={exercise.title} />
            <ReviewRow label="Distress" value={`${distressBefore ?? "—"} → ${distressAfter ?? "—"}`} />
            <ReviewRow
              label="Helped"
              value={helpfulness === null ? "—" : `${helpfulness}/10`}
            />
            {note.trim() ? <ReviewRow label="Note" value={`"${note.trim()}"`} /> : null}
          </View>
          {saveError ? (
            <Text variant="bodySmall" style={{ color: c.error, marginTop: 8 }}>
              {saveError}
            </Text>
          ) : null}
          <View style={styles.stepNav}>
            <M3Button label="‹ Adjust" variant="outlined" onPress={() => setStage("post")} />
            <M3Button label="Save" onPress={handleSave} disabled={saving} />
          </View>
        </View>,
      );

    case "done":
      return page(
        <View>
          <View style={styles.savedRow}>
            <MaterialCommunityIcons name="check-circle" size={36} color={c.success} />
            <Text variant="headlineSmall" style={{ fontWeight: "700", color: c.success }}>
              Saved
            </Text>
          </View>
          <Text variant="bodyMedium" style={[muted(c), { marginTop: 12 }]}>
            This exercise is in your history. How do you feel now?
          </Text>

          <View style={styles.checkGrid}>
            {CHECKIN_STATES.map((s) => (
              <M3Card
                key={s.key}
                fill={c[s.bg]}
                onPress={() => onCheckin(s)}
                style={[
                  styles.checkCard,
                  selectedState === s.key ? { borderWidth: 2, borderColor: c[s.fg] } : null,
                ]}
              >
                <MaterialCommunityIcons name={s.icon} size={24} color={c[s.fg]} />
                <Text style={{ color: c[s.fg], fontWeight: "700", marginTop: 6 }}>{s.label}</Text>
              </M3Card>
            ))}
          </View>
          {checkinSaved ? (
            <Text variant="bodySmall" style={{ color: c.success, marginTop: 12, textAlign: "center" }}>
              Saved — thank you.
            </Text>
          ) : null}
          {saveError ? (
            <Text variant="bodySmall" style={{ color: c.error, marginTop: 8, textAlign: "center" }}>
              {saveError}
            </Text>
          ) : null}

          <View style={styles.actionRow}>
            <M3Button label="Skip" variant="text" onPress={() => router.replace("/(tabs)/exercises")} />
            <M3Button label="Done" onPress={() => router.replace("/(tabs)/exercises")} />
          </View>
        </View>,
      );
  }
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  const { mode } = useAppTheme();
  const c = colors[mode];
  return (
    <View style={styles.reviewRow}>
      <Text variant="bodyMedium" style={{ color: c.textMuted, flex: 1 }}>{label}</Text>
      <Text variant="bodyMedium" style={{ color: c.text, fontWeight: "600", flex: 2 }}>{value}</Text>
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
    paddingHorizontal: 16,
    paddingBottom: 10,
  },
  cancel: { minWidth: 72, paddingVertical: 10 },
  dots: { flexDirection: "row", alignItems: "center", gap: 4 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  count: { fontSize: 12, marginLeft: 8 },
  body: { padding: 20, paddingBottom: 64 },
  bullet: { marginTop: 8 },
  actionRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 32 },
  stepBody: { alignItems: "center" },
  ring: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 40,
  },
  stepNav: { flexDirection: "row", justifyContent: "center", gap: 12, marginTop: 40, width: "100%" },
  helpRow: { gap: 12, marginTop: 12, alignItems: "stretch" },
  note: { marginTop: 20, backgroundColor: "transparent" },
  reviewCard: { marginTop: 16, borderRadius: 12, padding: 16 },
  reviewRow: { flexDirection: "row", paddingVertical: 6, gap: 12 },
  savedRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  checkGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 20 },
  checkCard: { width: "48%", flexGrow: 1 },
});