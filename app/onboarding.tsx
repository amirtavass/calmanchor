import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentProps } from "react";
import { Animated, Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import M3Button from "../components/M3Button";
import { getAllExercises } from "../lib/db";
import { markOnboardingSeen } from "../lib/onboarding";
import { useAppTheme } from "../theme/ThemeContext";
import { colors } from "../theme/tokens";
import { SR_OPTIONS } from "../types/checkin";
import { UK_CRISIS_CONTACTS } from "../lib/crisisContacts";

type MciGlyph = ComponentProps<typeof MaterialCommunityIcons>["name"];
type TokenKey = keyof typeof colors.light;

/**
 * Onboarding (M3-08) — technical-spec §3.8, seven gentle steps.
 *
 * Rules from the spec, all enforced here:
 *  - every step is skippable and the whole flow can be exited at any time;
 *  - no login, registration or personal data is collected (the flag lives in
 *    AsyncStorage, locally — not on any account);
 *  - **no progress bar** (avoids "you're X% done" pressure);
 *  - no assessment or quiz — step 3 is informational, not evaluative;
 *  - 1–2 sentences a step, warm non-clinical language (Appendix F).
 *
 * Transitions are a soft fade (spec: "gentle fade, not slides").
 *
 * Deviations, recorded in the changelog: step 3 is a tap-to-explore zone band
 * rather than a slider (keeps it strictly informational); step 4 offers
 * Box Breathing *or* 5-4-3-2-1 as in the spec, but links into the live
 * catalogue by title so it never 404s.
 */

const ZONES: { key: string; label: string; icon: MciGlyph; fg: TokenKey; bg: TokenKey; blurb: string }[] = [
  {
    key: "hypo",
    label: "Hypo",
    icon: "snowflake",
    fg: "nsHypo",
    bg: "nsHypoBg",
    blurb: "Low energy — flat, foggy, far away. Your body has turned the volume right down.",
  },
  {
    key: "window",
    label: "In window",
    icon: "leaf",
    fg: "nsWindow",
    bg: "nsWindowBg",
    blurb: "The window of tolerance — able to feel things and still think, choose and respond.",
  },
  {
    key: "hyper",
    label: "Hyper",
    icon: "flash",
    fg: "nsHyper",
    bg: "nsHyperBg",
    blurb: "High energy — alert, racing, braced. Your body is ready for something to happen.",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const c = colors[mode];

  const [step, setStep] = useState(0);
  const [zone, setZone] = useState<string | null>(null);
  const [exIds, setExIds] = useState<Record<string, string>>({});
  const fade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    getAllExercises()
      .then((all) => {
        const map: Record<string, string> = {};
        for (const e of all ?? []) {
          if (/5-4-3-2-1/i.test(e.title)) map.grounding = e.id;
          if (/box breathing/i.test(e.title)) map.breathing = e.id;
        }
        setExIds(map);
      })
      .catch(() => {
        // Catalogue unavailable — step 4 falls back to the Exercises tab.
      });
  }, []);

  const goTo = (next: number) => {
    fade.setValue(0);
    setStep(next);
    Animated.timing(fade, { toValue: 1, duration: 260, useNativeDriver: true }).start();
  };

  const finish = () => {
    markOnboardingSeen();
    // Revisited from Profile → return there; first launch → land on Home.
    if (router.canGoBack()) router.back();
    else router.replace("/(tabs)");
  };

  const tone = useMemo(() => {
    const pair: Record<number, { fg: TokenKey; bg: TokenKey }> = {
      0: { fg: "warmGold", bg: "warmGoldTint" },
      1: { fg: "exBreath", bg: "exBreathBg" },
      2: { fg: "nsWindow", bg: "nsWindowBg" },
      3: { fg: "exGround", bg: "exGroundBg" },
      4: { fg: "exSelfkind", bg: "exSelfkindBg" },
      5: { fg: "exCrisis", bg: "exCrisisBg" },
      6: { fg: "exJournal", bg: "exJournalBg" },
    };
    return pair[step] ?? pair[0];
  }, [step]);

  const isLast = step === 6;

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top }]}>
      {/* Zone 1 — quiet: exit (always) + Skip (never a wall) */}
      <View style={styles.topBar}>
        <View style={[styles.medallion, { backgroundColor: c[tone.bg] }]}>
          <MaterialCommunityIcons
            name={
              step === 0
                ? "anchor"
                : step === 1
                ? "compass-outline"
                : step === 2
                ? "waveform"
                : step === 3
                ? "play-circle-outline"
                : step === 4
                ? "star-outline"
                : step === 5
                ? "lifebuoy"
                : "heart-outline"
            }
            size={26}
            color={c[tone.fg]}
          />
        </View>
        <View style={styles.topSpacer} />
        <Pressable
          onPress={finish}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Close onboarding"
          style={[styles.closeBtn, { backgroundColor: c.surfaceOffset }]}
        >
          <MaterialCommunityIcons name="close" size={18} color={c.textMuted} />
        </Pressable>
      </View>

      {/* Zone 2 — content, one thought at a time */}
      <Animated.View style={[styles.body, { opacity: fade }]}>
        {step === 0 ? (
          <>
            <Text style={[styles.eyebrow, { color: c[tone.fg] }]}>WELCOME</Text>
            <Text style={[styles.headline, { color: c.text }]}>This is Calm Anchor</Text>
            <Text style={[styles.copy, { color: c.textMuted }]}>
              A companion to the toolkit — not a replacement for the book. It makes the workbook
              easier to reach when you need it.
            </Text>
          </>
        ) : step === 1 ? (
          <>
            <Text style={[styles.eyebrow, { color: c[tone.fg] }]}>HOW IT WORKS</Text>
            <Text style={[styles.headline, { color: c.text }]}>Three places to begin</Text>
            <View style={[styles.card, { backgroundColor: c.surface }]}>
              {[
                { icon: "book-open-variant" as MciGlyph, title: "The Toolkit", body: "Read the workbook, chapter by chapter." },
                { icon: "meditation" as MciGlyph, title: "Exercises", body: "Short practices for when things are loud." },
                { icon: "notebook-edit-outline" as MciGlyph, title: "Reflections", body: "A private diary, only ever yours." },
              ].map((row, i) => (
                <View key={row.title} style={[styles.row, i > 0 ? styles.rowBorder : null]}>
                  <View style={[styles.rowIcon, { backgroundColor: c[tone.bg] }]}>
                    <MaterialCommunityIcons name={row.icon} size={18} color={c[tone.fg]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: c.text }]}>{row.title}</Text>
                    <Text style={[styles.rowBody, { color: c.textMuted }]}>{row.body}</Text>
                  </View>
                </View>
              ))}
            </View>
            <Text style={[styles.copy, styles.copyTight, { color: c.textMuted }]}>
              You never have to use all three. Use whichever one helps today.
            </Text>
          </>
        ) : step === 2 ? (
          <>
            <Text style={[styles.eyebrow, { color: c[tone.fg] }]}>THE NERVOUS SYSTEM</Text>
            <Text style={[styles.headline, { color: c.text }]}>Your window of tolerance</Text>
            <Text style={[styles.copy, { color: c.textMuted }]}>
              There is a range where you can feel things and still think. Tap a zone to read about
              it — nothing is recorded.
            </Text>
            <View style={styles.zoneRow}>
              {ZONES.map((z) => {
                const active = zone === z.key;
                return (
                  <Pressable
                    key={z.key}
                    onPress={() => setZone(active ? null : z.key)}
                    accessibilityRole="button"
                    accessibilityState={{ selected: active }}
                    accessibilityLabel={z.label}
                    style={[
                      styles.zone,
                      {
                        backgroundColor: active ? c[z.fg] : c[z.bg],
                        borderColor: c[z.fg],
                        borderWidth: active ? 2 : 1,
                      },
                    ]}
                  >
                    <MaterialCommunityIcons
                      name={z.icon}
                      size={20}
                      color={active ? c.textInverse : c[z.fg]}
                    />
                    <Text style={[styles.zoneLabel, { color: active ? c.textInverse : c[z.fg] }]}>
                      {z.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
            {zone ? (
              <Text style={[styles.zoneBlurb, { color: c.text }]}>
                {ZONES.find((z) => z.key === zone)?.blurb}
              </Text>
            ) : null}
            <Text style={[styles.sectionLabel, { color: c.textMuted }]}>WHEN SOMETHING LANDS HARD</Text>
            <View style={styles.chipRow}>
              {SR_OPTIONS.map((o) => (
                <View key={o.key} style={[styles.chip, { backgroundColor: c[o.bg], borderColor: c[o.fg] }]}>
                  <MaterialCommunityIcons name={o.icon} size={14} color={c[o.fg]} />
                  <Text style={[styles.chipLabel, { color: c[o.fg] }]}>{o.label}</Text>
                </View>
              ))}
            </View>
            <Text style={[styles.copy, styles.copyTight, { color: c.textMuted }]}>
              Fight, flight, freeze and fawn are protective responses, not faults. The workbook
              explains them in full.
            </Text>
          </>
        ) : step === 3 ? (
          <>
            <Text style={[styles.eyebrow, { color: c[tone.fg] }]}>YOUR FIRST EXERCISE</Text>
            <Text style={[styles.headline, { color: c.text }]}>Would you like to try one?</Text>
            <Text style={[styles.copy, { color: c.textMuted }]}>
              Two short ones to start with. There is no need to do this now — you can come back
              whenever you like.
            </Text>
            <View style={styles.card}>
              {[
                {
                  key: "breathing",
                  title: "Box Breathing",
                  body: "Four counts in, four held, four out. Steady and simple.",
                  icon: "weather-windy" as MciGlyph,
                  fg: "exBreath" as TokenKey,
                  bg: "exBreathBg" as TokenKey,
                },
                {
                  key: "grounding",
                  title: "5-4-3-2-1 Grounding",
                  body: "Notice five things you can see, then four, then three.",
                  icon: "leaf" as MciGlyph,
                  fg: "exGround" as TokenKey,
                  bg: "exGroundBg" as TokenKey,
                },
              ].map((opt, i) => (
                <Pressable
                  key={opt.key}
                  onPress={() => {
                    const id = exIds[opt.key];
                    if (id) router.push(`/exercise/session/${id}`);
                    else router.push("/(tabs)/exercises");
                  }}
                  style={[styles.row, i > 0 ? styles.rowBorder : null]}
                  accessibilityRole="button"
                  accessibilityLabel={`Start ${opt.title}`}
                >
                  <View style={[styles.rowIcon, { backgroundColor: c[opt.bg] }]}>
                    <MaterialCommunityIcons name={opt.icon} size={18} color={c[opt.fg]} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: c.text }]}>{opt.title}</Text>
                    <Text style={[styles.rowBody, { color: c.textMuted }]}>{opt.body}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={22} color={c.textMuted} />
                </Pressable>
              ))}
            </View>
          </>
        ) : step === 4 ? (
          <>
            <Text style={[styles.eyebrow, { color: c[tone.fg] }]}>YOUR PORTFOLIO</Text>
            <Text style={[styles.headline, { color: c.text }]}>Keep what helps close by</Text>
            <Text style={[styles.copy, { color: c.textMuted }]}>
              Star an exercise and it waits in your Portfolio. You can add safe-space notes and your
              own strategies there too.
            </Text>
            <View style={[styles.card, styles.starCard, { backgroundColor: c.surface }]}>
              <View style={[styles.starMedallion, { backgroundColor: c.warmGoldTint }]}>
                <MaterialCommunityIcons name="star" size={26} color={c.warmGold} />
              </View>
              <Text style={[styles.rowBody, { color: c.textMuted, textAlign: "center" }]}>
                The star appears on every exercise. Tap it once and it is saved.
              </Text>
            </View>
          </>
        ) : step === 5 ? (
          <>
            <Text style={[styles.eyebrow, { color: c[tone.fg] }]}>CRISIS SUPPORT</Text>
            <Text style={[styles.headline, { color: c.text }]}>Help is one tap away</Text>
            <Text style={[styles.copy, { color: c.textMuted }]}>
              The round button in the corner is always there — on every screen. It opens grounding
              exercises and these numbers, without asking you anything first.
            </Text>
            <View style={[styles.card, { backgroundColor: c.surface }]}>
              {UK_CRISIS_CONTACTS.map((contact, i) => (
                <View key={contact.name} style={[styles.row, i > 0 ? styles.rowBorder : null]}>
                  <View style={[styles.rowIcon, { backgroundColor: c.exCrisisBg }]}>
                    <MaterialCommunityIcons name="phone-outline" size={18} color={c.exCrisis} />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.rowTitle, { color: c.text }]}>{contact.name}</Text>
                    <Text style={[styles.rowBody, { color: c.textMuted }]}>{contact.value}</Text>
                  </View>
                </View>
              ))}
            </View>
          </>
        ) : (
          <>
            <Text style={[styles.eyebrow, { color: c[tone.fg] }]}>YOU'RE READY</Text>
            <Text style={[styles.headline, { color: c.text }]}>Take your time</Text>
            <Text style={[styles.copy, { color: c.textMuted }]}>
              There is no pressure to do everything. Come back when you're ready — this will be
              here.
            </Text>
            <View style={[styles.card, styles.starCard, { backgroundColor: c.surface }]}>
              <View style={[styles.starMedallion, { backgroundColor: c.exJournalBg }]}>
                <MaterialCommunityIcons name="hand-heart-outline" size={26} color={c.exJournal} />
              </View>
              <Text style={[styles.rowBody, { color: c.textMuted, textAlign: "center" }]}>
                You can read this introduction again from your Profile at any time.
              </Text>
            </View>
          </>
        )}
      </Animated.View>

      {/* Zone 3 — pinned actions. "Skip" is always one tap (spec §3.8). */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 16, borderTopColor: c.divider }]}>
        <M3Button label="Skip" variant="text" color={c.textMuted} onPress={finish} style={styles.skipBtn} />
        <M3Button
          label={isLast ? "Open Calm Anchor" : "Next"}
          icon={isLast ? "arrow-right" : undefined}
          iconRight={isLast}
          color={c.secondary}
          onPress={() => (isLast ? void finish() : goTo(step + 1))}
          style={styles.nextBtn}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  topSpacer: { flex: 1 },
  medallion: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  closeBtn: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  body: { flex: 1, paddingHorizontal: 24, paddingTop: 26 },
  eyebrow: { fontSize: 11.5, lineHeight: 16, fontWeight: "800", letterSpacing: 0.9 },
  headline: { fontSize: 28, lineHeight: 34, fontWeight: "800", letterSpacing: -0.5, marginTop: 8 },
  copy: { marginTop: 12, fontSize: 15.5, lineHeight: 24 },
  copyTight: { marginTop: 12, fontSize: 13.5, lineHeight: 20 },
  sectionLabel: {
    marginTop: 22,
    marginBottom: 10,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  card: { borderRadius: 16, padding: 16, marginTop: 20 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 12 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(0,0,0,0.08)" },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 15, lineHeight: 21, fontWeight: "700" },
  rowBody: { marginTop: 2, fontSize: 13, lineHeight: 19 },
  zoneRow: { flexDirection: "row", gap: 8, marginTop: 18 },
  zone: {
    flex: 1,
    alignItems: "center",
    gap: 6,
    paddingVertical: 14,
    borderRadius: 14,
  },
  zoneLabel: { fontSize: 12.5, fontWeight: "700", textAlign: "center" },
  zoneBlurb: { marginTop: 14, fontSize: 14, lineHeight: 21 },
  chipRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 11,
    paddingVertical: 7,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipLabel: { fontSize: 12.5, fontWeight: "700" },
  starCard: { alignItems: "center", gap: 12 },
  starMedallion: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  actionBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 24,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  skipBtn: { flex: 1 },
  nextBtn: { flex: 1.6 },
});
