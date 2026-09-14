import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  KeyboardAvoidingView,
  ScrollView,
  StyleSheet,
  View,
  Pressable,
} from "react-native";
import { Text, TextInput } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import M3Button from "../../../components/M3Button";
import M3Card from "../../../components/M3Card";
import ExerciseLoadingScreen from "../../../components/ExerciseLoadingScreen";
import M3Scale, { moodBandKey } from "../../../components/M3Scale";
import { getAllExercises, saveCheckin, saveSession } from "../../../lib/db";
import {
  CATEGORIES,
  CATEGORY_TOKENS,
  Exercise,
  ExerciseCategory,
  MciGlyph,
  SENSE_TONES,
  senseForStep,
} from "../../../types/exercise";
import { useAppTheme } from "../../../theme/ThemeContext";
import { colors } from "../../../theme/tokens";

/**
 * Guided session (03-session-flow.md + 05-session D2 "Colour-forward").
 * Flow: distress-before → step 1..n → distress-after + helpfulness → confirm →
 * result (optional state re-check-in). Order, copy and data contract are locked
 * by /docs; this file is the component treatment.
 *
 * Every stage shares one shell — quiet icon close, content, pinned bottom nav —
 * so the actions sit in the same place all the way through (no jumping between
 * screens). The step screen centres its composition and gives each sense its
 * own --ex-* hue; motion is a breathing ring + expanding halo (design-system
 * breath-circle idiom) with the step text fading up. RN Animated only.
 */
type Stage = "pre" | "steps" | "post" | "confirm" | "done";

const CHECKIN_STATES = [
  { key: "regulated", label: "Regulated", icon: "leaf", bg: "nsWindowBg", fg: "nsWindow" },
  { key: "freeze", label: "Freeze", icon: "snowflake", bg: "srFreezeBg", fg: "srFreeze" },
  { key: "fight", label: "Fight", icon: "flash", bg: "srFightBg", fg: "srFight" },
  { key: "flight", label: "Flight", icon: "run", bg: "srFlightBg", fg: "srFlight" },
  { key: "fawn", label: "Fawn", icon: "handshake", bg: "srFawnBg", fg: "srFawn" },
] as const;

// Helpfulness (S15, D04 friendly words) — three distinct colour-field tiles
// (design-system idiom). The tiles are filled with the strong tone and carry
// `textInverse` glyph + label, so they read at a glance on the light surface
// panel: cool neutral → warm gold → green. Selected state adds a 2dp ring in
// the fg tone. The lighter `bg` variants were tried first but read as a
// repeated near-white row against the surface — the saturated treatment here
// is unambiguous.
const HELP_OPTIONS: {
  value: number;
  label: string;
  icon: MciGlyph;
  fg: keyof typeof colors.light;
  bg: keyof typeof colors.light;
}[] = [
  { value: 0, label: "Not really", icon: "emoticon-neutral-outline", fg: "srFreeze", bg: "srFreeze" },
  { value: 5, label: "A little", icon: "emoticon-outline", fg: "mood3", bg: "mood3" },
  { value: 10, label: "Yes, it helped", icon: "emoticon-happy-outline", fg: "success", bg: "success" },
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
  const [finishedAt, setFinishedAt] = useState<Date | null>(null);

  const startedAt = useMemo(() => new Date(), []);

  useEffect(() => {
    if (stage === "confirm" && !finishedAt) setFinishedAt(new Date());
  }, [stage, finishedAt]);

  // --- Motion (step screen) -------------------------------------------------
  const pulse = useRef(new Animated.Value(0)).current;
  const halo = useRef(new Animated.Value(0)).current;
  const textFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    pulse.setValue(0);
    halo.setValue(0);
    const breath = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 2000,
          easing: Easing.inOut(Easing.ease),
          useNativeDriver: true,
        }),
      ]),
    );
    const ripple = Animated.loop(
      Animated.timing(halo, {
        toValue: 1,
        duration: 3000,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    );
    breath.start();
    ripple.start();
    return () => {
      breath.stop();
      ripple.stop();
    };
  }, [pulse, halo, stepIdx, stage]);

  useEffect(() => {
    textFade.setValue(0);
    Animated.timing(textFade, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }, [textFade, stepIdx]);

  const ringScale = pulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.045] });
  const haloScale = halo.interpolate({ inputRange: [0, 1], outputRange: [1, 1.65] });
  const haloOpacity = halo.interpolate({ inputRange: [0, 0.75, 1], outputRange: [0.4, 0.08, 0] });
  const textShift = textFade.interpolate({ inputRange: [0, 1], outputRange: [10, 0] });

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

  const catKey = (exercise?.category as ExerciseCategory) ?? "breathing";
  const catToken = CATEGORY_TOKENS[catKey in CATEGORY_TOKENS ? catKey : "breathing"];
  const catTone = { fg: c[catToken.fg], bg: c[catToken.bg] };
  const catIcon = CATEGORIES.find((cat) => cat.key === exercise?.category)?.icon ?? "meditation";

  const handleSave = async () => {
    setSaving(true);
    setSaveError(null);
    try {
      const ended = finishedAt ?? new Date();
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
    return <ExerciseLoadingScreen title="Session" />;
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
  const clock = (d: Date) => d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  // --- Shared shell ---------------------------------------------------------
  const closeBtn = (
    <Pressable
      onPress={() => router.back()}
      hitSlop={10}
      accessibilityRole="button"
      accessibilityLabel="Leave session"
      style={[styles.closeBtn, { backgroundColor: c.surfaceOffset }]}
    >
      <MaterialCommunityIcons name="close" size={20} color={c.textMuted} />
    </Pressable>
  );

  const shell = ({
    content,
    nav,
    dots,
    dotColor,
  }: {
    content: React.ReactNode;
    nav: React.ReactNode;
    dots?: boolean;
    dotColor?: string;
  }) => (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: c.bg }]} behavior="padding">
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <View style={styles.headerSide}>
          {dots && totalSteps > 1 ? (
            <Text style={[styles.count, { color: c.textMuted }]}>
              {stepIdx + 1}/{totalSteps}
            </Text>
          ) : null}
        </View>
        {dots && totalSteps > 1 ? (
          <View style={styles.dots}>
            {steps.map((_, i) => (
              <View
                key={i}
                style={[
                  styles.dot,
                  {
                    backgroundColor: i === stepIdx ? dotColor ?? c.primary : c.divider,
                    width: i === stepIdx ? 18 : 8,
                  },
                ]}
              />
            ))}
          </View>
        ) : (
          <View style={styles.dots} />
        )}
        <View style={[styles.headerSide, styles.headerRight]}>{closeBtn}</View>
      </View>

      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {content}
      </ScrollView>

      <View
        style={[styles.bottomNav, { paddingBottom: insets.bottom + 14, borderTopColor: c.divider }]}
      >
        {nav}
      </View>
    </KeyboardAvoidingView>
  );

  const medallion = (icon: MciGlyph, fg: string, bg: string, size = 64) => (
    <View style={[styles.medallion, { width: size, height: size, borderRadius: size / 2, backgroundColor: bg }]}>
      <MaterialCommunityIcons name={icon} size={size * 0.45} color={fg} />
    </View>
  );

  switch (stage) {
    case "pre":
      return shell({
        content: (
          <View style={styles.centered}>
            {medallion(catIcon, catTone.fg, catTone.bg)}
            <Text variant="headlineSmall" style={[styles.headline, { color: c.text }]}>
              Before you begin
            </Text>
            <Text variant="bodyMedium" style={[styles.subline, muted(c)]}>
              {exercise.title}
            </Text>

            <View style={[styles.panel, { backgroundColor: c.surface }]}>
              <Text variant="titleMedium" style={{ fontWeight: "700", color: c.text }}>
                How distressed do you feel right now?
              </Text>
              <M3Scale value={distressBefore} onChange={setDistressBefore} />
            </View>

            <View style={styles.reassure}>
              <View style={styles.reassureRow}>
                <MaterialCommunityIcons name="lock-outline" size={16} color={c.textMuted} />
                <Text style={[styles.reassureText, muted(c)]}>
                  This is just for you — it helps you notice how the exercise affects you.
                </Text>
              </View>
              <View style={styles.reassureRow}>
                <MaterialCommunityIcons name="hand-heart-outline" size={16} color={c.textMuted} />
                <Text style={[styles.reassureText, muted(c)]}>You can skip. No pressure.</Text>
              </View>
            </View>
          </View>
        ),
        nav: (
          <>
            <M3Button
              label="Skip"
              variant="text"
              color={c.textMuted}
              onPress={() => { setStepIdx(0); setStage("steps"); }}
              style={{ flex: 1 }}
            />
            <M3Button
              label="Continue"
              icon="arrow-right"
              iconRight
              onPress={() => { setStepIdx(0); setStage("steps"); }}
              style={{ flex: 1.3 }}
            />
          </>
        ),
      });

    case "steps": {
      const s = steps[stepIdx];
      const sense = senseForStep(s ?? "");
      const st = SENSE_TONES[sense.key];
      const senseTone =
        sense.key === "notice" ? catTone : { fg: c[st.fg], bg: c[st.bg] };

      return shell({
        dots: true,
        dotColor: senseTone.fg,
        content: (
          <View style={styles.centered}>
            <View style={[styles.sensePill, { backgroundColor: senseTone.bg }]}>
              <MaterialCommunityIcons name={sense.icon} size={14} color={senseTone.fg} />
              <Text style={[styles.sensePillText, { color: senseTone.fg }]}>{sense.label}</Text>
            </View>

            <View style={styles.ringWrap}>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.halo,
                  {
                    backgroundColor: senseTone.bg,
                    borderColor: senseTone.fg,
                    opacity: haloOpacity,
                    transform: [{ scale: haloScale }],
                  },
                ]}
              />
              <Animated.View
                style={[
                  styles.ring,
                  {
                    backgroundColor: senseTone.bg,
                    borderColor: senseTone.fg,
                    transform: [{ scale: ringScale }],
                  },
                ]}
              >
                <MaterialCommunityIcons name={sense.icon} size={44} color={senseTone.fg} />
              </Animated.View>
            </View>

            <Animated.View
              style={[styles.stepTextWrap, { opacity: textFade, transform: [{ translateY: textShift }] }]}
            >
              <Text variant="headlineMedium" style={{ fontWeight: "700", color: c.text, textAlign: "center" }}>
                {s}
              </Text>
              <Text variant="bodyMedium" style={[styles.bullet, muted(c), { textAlign: "center" }]}>
                · You can take as long as you need.
              </Text>
              <Text variant="bodyMedium" style={[styles.bullet, muted(c), { textAlign: "center" }]}>
                · Nothing here is "wrong".
              </Text>
            </Animated.View>
          </View>
        ),
        nav: (
          <>
            <M3Button
              label="Back"
              icon="arrow-left"
              variant="outlined"
              color={c.textMuted}
              onPress={() => setStepIdx(Math.max(0, stepIdx - 1))}
              disabled={stepIdx === 0}
              style={{ flex: 1 }}
            />
            <M3Button
              label={stepIdx + 1 >= totalSteps ? "Finish" : "Next"}
              icon={stepIdx + 1 >= totalSteps ? "check" : "arrow-right"}
              iconRight
              variant="outlined"
              color={senseTone.fg}
              onPress={() => {
                if (stepIdx + 1 >= totalSteps) setStage("post");
                else setStepIdx(stepIdx + 1);
              }}
              style={{ flex: 1 }}
            />
          </>
        ),
      });
    }

    case "post":
      return shell({
        content: (
          <View style={styles.centered}>
            {medallion("hand-heart", c.success, c.successTint)}
            <Text variant="headlineSmall" style={[styles.headline, { color: c.text }]}>
              That's it.
            </Text>
            <Text variant="titleMedium" style={[styles.sublineStrong, { color: c.success }]}>
              Well done for showing up.
            </Text>

            <View style={[styles.panel, { backgroundColor: c.surface }]}>
              <Text variant="titleMedium" style={{ fontWeight: "700", color: c.text }}>
                How distressed do you feel now?
              </Text>
              <M3Scale value={distressAfter} onChange={setDistressAfter} />
            </View>

            <View style={[styles.panel, { backgroundColor: c.surface, marginTop: 12 }]}>
              <Text variant="titleMedium" style={{ fontWeight: "700", color: c.text }}>
                Did this exercise help?
              </Text>
              <View style={styles.helpRow}>
                {HELP_OPTIONS.map((h) => {
                  const selected = helpfulness === h.value;
                  const bg = c[h.bg];
                  const fg = c[h.fg];
                  const ringColor = selected ? c.text : "transparent";
                  return (
                    <Pressable
                      key={h.value}
                      onPress={() => setHelpfulness(h.value)}
                      style={({ pressed }) => [
                        styles.helpTile,
                        {
                          backgroundColor: bg,
                          borderColor: ringColor,
                          borderWidth: selected ? 2 : 1,
                          opacity: pressed ? 0.85 : 1,
                        },
                        selected ? styles.helpTileSelected : null,
                      ]}
                      accessibilityRole="button"
                      accessibilityState={{ selected }}
                      accessibilityLabel={h.label}
                    >
                      <MaterialCommunityIcons name={h.icon} size={26} color={c.textInverse} />
                      <Text style={[styles.helpLabel, { color: c.textInverse }]}>{h.label}</Text>
                    </Pressable>
                  );
                })}
              </View>
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
          </View>
        ),
        nav: (
          <>
            <M3Button
              label="Skip"
              variant="outlined"
              color={c.textMuted}
              onPress={() => setStage("confirm")}
              style={{ flex: 1 }}
            />
            <M3Button
              label="Review & save"
              icon="arrow-right"
              iconRight
              color={c.secondaryActive}
              onPress={() => setStage("confirm")}
              style={{ flex: 1.3 }}
            />
          </>
        ),
      });

    case "confirm": {
      const helped = HELP_OPTIONS.find((h) => h.value === helpfulness);
      const ended = finishedAt ?? new Date();
      const mins = Math.max(1, Math.round((ended.getTime() - startedAt.getTime()) / 60000));
      return shell({
        content: (
          <View style={styles.centered}>
            {medallion("clipboard-check-outline", c.primary, c.primaryTint)}
            <Text variant="headlineSmall" style={[styles.headline, { color: c.text }]}>
              Review what will be saved
            </Text>
            <Text variant="bodyMedium" style={[styles.subline, muted(c)]}>
              Check it looks right — you can still adjust anything.
            </Text>

            <View style={[styles.summaryCard, { backgroundColor: c.surface }]}>
              <View style={styles.summaryHead}>
                <View style={[styles.summaryIcon, { backgroundColor: catTone.bg }]}>
                  <MaterialCommunityIcons name={catIcon} size={20} color={catTone.fg} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.summaryTitle, { color: c.text }]}>{exercise.title}</Text>
                  <Text style={[styles.summarySub, muted(c)]}>
                    {clock(startedAt)} → {clock(ended)} · ~{mins} min
                  </Text>
                </View>
              </View>

              <View style={[styles.summaryDivider, { backgroundColor: c.divider }]} />

              <Text style={[styles.summaryLabel, muted(c)]}>Distress</Text>
              <View style={styles.distressRow}>
                {distressBefore !== null ? (
                  <View style={[styles.sudsChip, { backgroundColor: c[moodBandKey(distressBefore)] }]}>
                    <Text style={[styles.sudsText, { color: c.textInverse }]}>{distressBefore}</Text>
                  </View>
                ) : (
                  <Text style={[styles.sudsSkip, muted(c)]}>skipped</Text>
                )}
                <MaterialCommunityIcons name="arrow-right" size={18} color={c.textMuted} />
                {distressAfter !== null ? (
                  <View style={[styles.sudsChip, { backgroundColor: c[moodBandKey(distressAfter)] }]}>
                    <Text style={[styles.sudsText, { color: c.textInverse }]}>{distressAfter}</Text>
                  </View>
                ) : (
                  <Text style={[styles.sudsSkip, muted(c)]}>skipped</Text>
                )}
              </View>

              <Text style={[styles.summaryLabel, muted(c), { marginTop: 16 }]}>Helped</Text>
              {helped ? (
                <View style={styles.helpedRow}>
                  <MaterialCommunityIcons name={helped.icon} size={16} color={c[helped.fg]} />
                  <Text style={[styles.helpedText, { color: c[helped.fg] }]}>{helped.label}</Text>
                </View>
              ) : (
                <Text style={[styles.sudsSkip, muted(c)]}>skipped</Text>
              )}

              {note.trim() ? (
                <>
                  <Text style={[styles.summaryLabel, muted(c), { marginTop: 16 }]}>Note</Text>
                  <View style={[styles.noteQuote, { backgroundColor: c.surfaceOffset, borderLeftColor: c.primary }]}>
                    <Text style={[styles.noteQuoteText, { color: c.text }]}>“{note.trim()}”</Text>
                  </View>
                </>
              ) : null}
            </View>

            {saveError ? (
              <Text variant="bodySmall" style={{ color: c.error, marginTop: 12, textAlign: "center" }}>
                {saveError}
              </Text>
            ) : null}
          </View>
        ),
        nav: (
          <>
            <M3Button
              label="Adjust"
              icon="arrow-left"
              variant="outlined"
              color={c.textMuted}
              onPress={() => setStage("post")}
              style={{ flex: 1 }}
            />
            <M3Button
              label="Save"
              icon="check"
              iconRight
              color={c.secondaryActive}
              onPress={handleSave}
              disabled={saving}
              style={{ flex: 1.3 }}
            />
          </>
        ),
      });
    }

    case "done":
      return shell({
        content: (
          <View style={styles.centered}>
            {medallion("check-circle", c.success, c.successTint, 72)}
            <Text variant="headlineSmall" style={[styles.headline, { color: c.success }]}>
              Saved
            </Text>
            <Text variant="bodyMedium" style={[styles.subline, muted(c)]}>
              This exercise is in your history.
            </Text>

            <Text variant="titleMedium" style={[styles.checkinTitle, { color: c.text }]}>
              How do you feel now?
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
            ) : (
              <Text variant="bodySmall" style={[styles.subline, muted(c)]}>
                Optional — only if you feel like it.
              </Text>
            )}
            {saveError ? (
              <Text variant="bodySmall" style={{ color: c.error, marginTop: 8, textAlign: "center" }}>
                {saveError}
              </Text>
            ) : null}
          </View>
        ),
        nav: (
          <>
            <M3Button
              label="Skip"
              variant="outlined"
              color={c.textMuted}
              onPress={() => router.replace("/(tabs)/exercises")}
              style={{ flex: 1 }}
            />
            <M3Button
              label="Done"
              icon="check"
              iconRight
              color={c.secondaryActive}
              onPress={() => router.replace("/(tabs)/exercises")}
              style={{ flex: 1.3 }}
            />
          </>
        ),
      });
  }
}

const muted = (c: typeof colors.light) => ({ color: c.textMuted, opacity: 0.9 });

const styles = StyleSheet.create({
  root: { flex: 1 },

  // --- Shell ----------------------------------------------------------------
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  closeBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dots: { flexDirection: "row", alignItems: "center", gap: 4, flex: 1, justifyContent: "center" },
  dot: { height: 8, borderRadius: 4 },
  headerSide: { width: 44, alignItems: "flex-start", justifyContent: "center" },
  headerRight: { alignItems: "flex-end" },
  count: { fontSize: 12, fontWeight: "600" },
  body: { padding: 20, paddingBottom: 32, flexGrow: 1 },
  bottomNav: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
  },

  // --- Shared content -------------------------------------------------------
  // Auto margins centre the composition when there is spare room and collapse
  // to zero when the content is taller than the viewport (never clips the top).
  centered: { alignItems: "center", width: "100%", marginTop: "auto", marginBottom: "auto" },
  medallion: { alignItems: "center", justifyContent: "center", marginBottom: 18 },
  headline: { fontWeight: "800", textAlign: "center", letterSpacing: -0.3 },
  subline: { marginTop: 6, textAlign: "center", fontSize: 14.5, lineHeight: 21 },
  sublineStrong: { marginTop: 6, textAlign: "center", fontWeight: "700" },
  panel: {
    width: "100%",
    borderRadius: 16,
    padding: 18,
    marginTop: 22,
    alignItems: "stretch",
  },
  reassure: { width: "100%", marginTop: 18, gap: 8, paddingHorizontal: 4 },
  reassureRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  reassureText: { flex: 1, fontSize: 13.5, lineHeight: 20 },
  bullet: { marginTop: 8 },

  // --- Steps ----------------------------------------------------------------
  sensePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 6,
    marginBottom: 18,
  },
  sensePillText: { fontSize: 13, fontWeight: "700", letterSpacing: 0.2 },
  ringWrap: { width: 180, height: 180, alignItems: "center", justifyContent: "center" },
  halo: { position: "absolute", width: 112, height: 112, borderRadius: 56, borderWidth: 2 },
  ring: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  stepTextWrap: { alignItems: "center", marginTop: 24, width: "100%" },

  // --- Post -----------------------------------------------------------------
  helpRow: { gap: 10, marginTop: 14, alignItems: "stretch", flexDirection: "row" },
  helpTile: {
    flex: 1,
    borderRadius: 14,
    paddingVertical: 16,
    paddingHorizontal: 10,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  helpTileSelected: {
    // Outset ring via shadow — pairs with the 2dp border so the selected tile
    // pops above its neighbours even at a glance.
    shadowColor: "#000",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  helpLabel: { fontSize: 13, fontWeight: "800", textAlign: "center", lineHeight: 17 },
  note: { marginTop: 12, backgroundColor: "transparent", minHeight: 88, width: "100%" },

  // --- Confirm --------------------------------------------------------------
  summaryCard: { width: "100%", borderRadius: 16, padding: 18, marginTop: 22 },
  summaryHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  summaryIcon: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  summaryTitle: { fontSize: 16, fontWeight: "700", lineHeight: 22 },
  summarySub: { fontSize: 12.5, marginTop: 2 },
  summaryDivider: { height: StyleSheet.hairlineWidth, marginVertical: 16 },
  summaryLabel: { fontSize: 11.5, fontWeight: "800", letterSpacing: 0.7, textTransform: "uppercase" },
  distressRow: { flexDirection: "row", alignItems: "center", gap: 12, marginTop: 8 },
  sudsChip: {
    minWidth: 38,
    height: 38,
    borderRadius: 19,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  sudsText: { fontSize: 16, fontWeight: "800" },
  sudsSkip: { fontSize: 14, fontStyle: "italic" },
  helpedRow: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 8 },
  helpedText: { fontSize: 15, fontWeight: "700" },
  noteQuote: {
    marginTop: 8,
    borderRadius: 10,
    borderLeftWidth: 3,
    padding: 12,
  },
  noteQuoteText: { fontSize: 14.5, lineHeight: 21, fontStyle: "italic" },

  // --- Done -----------------------------------------------------------------
  checkinTitle: { marginTop: 28, marginBottom: 4, fontWeight: "700", textAlign: "center" },
  checkGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12, width: "100%" },
  checkCard: { width: "48%", flexGrow: 1 },
});