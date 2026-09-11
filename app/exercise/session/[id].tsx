import { useEffect, useMemo, useState, type ReactNode } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Button, Card, Chip, ProgressBar, Text } from "react-native-paper";
import Slider from "@react-native-community/slider";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getAllExercises, saveSession } from "../../../lib/db";
import { Exercise } from "../../../types/exercise";
import { useAppTheme } from "../../../theme/ThemeContext";
import { colors } from "../../../theme/tokens";

/**
 * Guided session (03-session-flow.md) — S12–S18.
 * Flow: distress-before → step 1..n → distress-after + helpfulness → confirm → saved.
 * Cancel discards without confirmation (trauma-informed); no partial save.
 */
type Stage = "pre" | "steps" | "post" | "confirm" | "done";

export default function SessionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { mode } = useAppTheme();
  const c = colors[mode];

  const [exercise, setExercise] = useState<Exercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [stage, setStage] = useState<Stage>("pre");
  const [stepIdx, setStepIdx] = useState(0);
  const [distressBefore, setDistressBefore] = useState<number | null>(null);
  const [distressAfter, setDistressAfter] = useState<number | null>(null);
  const [helpfulness, setHelpfulness] = useState<number | null>(null);
  const [note, setNote] = useState<string>("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const startedAt = useMemo(() => new Date(), []);

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

  if (loading) {
    return (
      <View style={[styles.root, { backgroundColor: c.bg, justifyContent: "center", alignItems: "center" }]}>
        <Text style={styles.muted}>Loading…</Text>
      </View>
    );
  }

  if (!exercise) {
    return (
      <View style={[styles.root, { backgroundColor: c.bg, justifyContent: "center", alignItems: "center", padding: 24 }]}>
        <Text variant="titleMedium" style={{ color: c.error }}>
          This exercise isn't available.
        </Text>
        <Button mode="contained" onPress={() => router.back()} style={{ marginTop: 16 }}>
          Back
        </Button>
      </View>
    );
  }

  const steps = exercise.steps ?? [];
  const totalSteps = steps.length;

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const ended = new Date();
      const durationMin = Math.max(1, Math.round((ended.getTime() - startedAt.getTime()) / 60000));
      await saveSession({
        exercise_id: exercise.id,
        started_at: startedAt,
        ended_at: ended,
        duration_minutes: durationMin,
        distress_before: distressBefore ?? undefined,
        distress_after: distressAfter ?? undefined,
        helpfulness: helpfulness ?? undefined,
        note: note || undefined,
      });
      setStage("done");
    } catch (e) {
      setSaveError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const step = (label: ReactNode, options?: { dots?: boolean }) => (
    <View style={[styles.stepTop, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Button icon="close" onPress={() => router.back()} mode="text">
          Cancel
        </Button>
        {options?.dots && totalSteps > 1 ? (
          <Text variant="bodySmall" style={styles.muted}>
            {stepIdx + 1} of {totalSteps}
          </Text>
        ) : null}
        <View style={{ width: 64 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>{label}</ScrollView>
    </View>
  );

  switch (stage) {
    case "pre":
      return step(
        <View>
          <Text variant="titleLarge" style={{ fontWeight: "700" }}>
            Before you begin
          </Text>
          <Text variant="bodyLarge" style={{ marginTop: 16 }}>
            How distressed do you feel right now?
          </Text>
          <View style={styles.sliderRow}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={10}
              step={1}
              value={distressBefore ?? 5}
              onValueChange={(v) => setDistressBefore(v)}
              minimumTrackTintColor={c.primary}
              maximumTrackTintColor={c.divider}
            />
          </View>
          <Text variant="bodySmall" style={styles.sliderLabels}>
            calm{"    "}·{"    "}·{"    "}·{"    "}·{"    "}very high
          </Text>
          <Text variant="bodyMedium" style={[styles.muted, { marginTop: 20 }]}>
            · This is just for you — it helps you notice how the exercise affects you.
          </Text>
          <Text variant="bodyMedium" style={[styles.muted, { marginTop: 8 }]}>
            · You can skip.
          </Text>
          <Button
            mode="contained"
            style={styles.cta}
            onPress={() => {
              setStepIdx(0);
              setStage("steps");
            }}
          >
            Continue
          </Button>
        </View>,
      );

    case "steps": {
      const s = steps[stepIdx];
      return step(
        <View>
          <ProgressBar progress={(stepIdx + 1) / totalSteps} color={c.primary} style={styles.progress} />
          <Text variant="headlineMedium" style={{ fontWeight: "700", marginTop: 24 }}>
            {s}
          </Text>
          <Text variant="bodyMedium" style={[styles.muted, { marginTop: 16 }]}>
            · You can take as long as you need.
          </Text>
          <Text variant="bodyMedium" style={[styles.muted, { marginTop: 8 }]}>
            · Nothing here is "wrong".
          </Text>
          <View style={styles.stepNav}>
            <Button mode="outlined" onPress={() => setStepIdx(Math.max(0, stepIdx - 1))} disabled={stepIdx === 0}>
              Previous
            </Button>
            <Button
              mode="contained"
              onPress={() => {
                if (stepIdx + 1 >= totalSteps) setStage("post");
                else setStepIdx(stepIdx + 1);
              }}
            >
              {stepIdx + 1 >= totalSteps ? "Finish" : "Next"}
            </Button>
          </View>
        </View>,
        { dots: true },
      );
    }

    case "post":
      return step(
        <View>
          <Text variant="titleLarge" style={{ fontWeight: "700" }}>
            That's it — well done for showing up.
          </Text>
          <Text variant="bodyLarge" style={{ marginTop: 20 }}>
            How distressed do you feel now?
          </Text>
          <View style={styles.sliderRow}>
            <Slider
              style={styles.slider}
              minimumValue={0}
              maximumValue={10}
              step={1}
              value={distressAfter ?? distressBefore ?? 5}
              onValueChange={(v) => setDistressAfter(v)}
              minimumTrackTintColor={c.primary}
              maximumTrackTintColor={c.divider}
            />
          </View>
          <Text variant="bodyLarge" style={{ marginTop: 20 }}>
            Did this exercise help?
          </Text>
          <View style={styles.helpfulnessRow}>
            {[0, 5, 10].map((v) => (
              <Chip
                key={v}
                selected={helpfulness === v}
                onPress={() => setHelpfulness(v)}
                style={styles.helpfulnessChip}
              >
                {v === 0 ? "Not really" : v === 5 ? "A little" : "Yes, it helped"}
              </Chip>
            ))}
          </View>
          <Text variant="bodySmall" style={[styles.muted, { marginTop: 8 }]}>
            (optional detail) {helpfulness ?? "—"} / 10
          </Text>
          <Button
            mode="contained"
            style={styles.cta}
            onPress={() => setStage("confirm")}
            disabled={distressAfter === null && helpfulness === null}
          >
            Review & save
          </Button>
        </View>,
      );

    case "confirm":
      return step(
        <View>
          <Text variant="titleLarge" style={{ fontWeight: "700" }}>
            Review what will be saved
          </Text>
          <Card style={styles.reviewCard}>
            <Card.Content>
              <Text variant="bodyMedium">
                <Text style={{ fontWeight: "700" }}>Exercise: </Text>
                {exercise.title}
              </Text>
              <Text variant="bodyMedium">
                <Text style={{ fontWeight: "700" }}>Distress: </Text>
                {distressBefore ?? "—"} → {distressAfter ?? "—"}
              </Text>
              <Text variant="bodyMedium">
                <Text style={{ fontWeight: "700" }}>Helped: </Text>
                {helpfulness === null ? "—" : `${helpfulness}/10`}
              </Text>
            </Card.Content>
          </Card>
          {saveError ? (
            <Text variant="bodySmall" style={{ color: c.error, marginTop: 8 }}>
              {saveError}
            </Text>
          ) : null}
          <View style={styles.stepNav}>
            <Button mode="outlined" onPress={() => setStage("post")}>
              Adjust
            </Button>
            <Button mode="contained" onPress={handleSave} loading={saving} disabled={saving}>
              Save
            </Button>
          </View>
        </View>,
      );

    case "done":
      return step(
        <View>
          <Text variant="headlineSmall" style={{ fontWeight: "700", color: c.success }}>
            ✓ Saved
          </Text>
          <Text variant="bodyMedium" style={[styles.muted, { marginTop: 12 }]}>
            This exercise is in your history. How do you feel now?
          </Text>
          <Button mode="contained" style={styles.cta} onPress={() => router.replace("/(tabs)/exercises")}>
            Done
          </Button>
        </View>,
      );
  }
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  stepTop: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  body: { padding: 20, paddingBottom: 48 },
  muted: { color: "#5A5645", opacity: 0.85 },
  sliderRow: { marginTop: 12 },
  slider: { width: "100%", height: 40 },
  sliderLabels: { color: "#9C9583", textAlign: "center", marginTop: 4 },
  cta: { marginTop: 28, borderRadius: 12 },
  progress: { marginTop: 8, borderRadius: 999 },
  stepNav: { flexDirection: "row", justifyContent: "space-between", gap: 12, marginTop: 32 },
  helpfulnessRow: { flexDirection: "row", gap: 8, marginTop: 8 },
  helpfulnessChip: { flex: 1 },
  reviewCard: { marginTop: 16 },
});