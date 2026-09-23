import { useState } from "react";
import type { ComponentProps } from "react";
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { Text } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import M3Button from "../../components/M3Button";
import M3Card from "../../components/M3Card";
import { saveProfile } from "../../lib/db";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";

type MciGlyph = ComponentProps<typeof MaterialCommunityIcons>["name"];
type TokenKey = keyof typeof colors.light;

/**
 * Research profile questions (A5, S03, 28 Aug §6) — the five optional fields
 * asked after first sign-in. Every question is skippable and carries a
 * "Prefer not to say" option; answers are stored on `profiles`, separate from
 * identity (S27: no PII in research data). Once saved, the dashboard prompt
 * disappears (a row exists). Craft §1/§12: quiet header, KAV, pinned Save.
 */

interface Question {
  key: "age_band" | "gender" | "ethnicity" | "treatment_status" | "referral_source";
  label: string;
  hint: string;
  options: { label: string; value: string }[];
}

const QUESTIONS: Question[] = [
  {
    key: "age_band",
    label: "How old are you?",
    hint: "In a band, not an exact age.",
    options: [
      { label: "18–24", value: "18-24" },
      { label: "25–34", value: "25-34" },
      { label: "35–44", value: "35-44" },
      { label: "45–54", value: "45-54" },
      { label: "55+", value: "55+" },
      { label: "Prefer not to say", value: "prefer_not_to_say" },
    ],
  },
  {
    key: "gender",
    label: "How would you describe your gender?",
    hint: "Completely up to you.",
    options: [
      { label: "Woman", value: "woman" },
      { label: "Man", value: "man" },
      { label: "Non-binary", value: "non_binary" },
      { label: "Prefer not to say", value: "prefer_not_to_say" },
    ],
  },
  {
    key: "ethnicity",
    label: "Which best describes your ethnicity?",
    hint: "ONS categories.",
    options: [
      { label: "White", value: "white" },
      { label: "Mixed / Multiple", value: "mixed" },
      { label: "Asian / Asian British", value: "asian" },
      { label: "Black / African / Caribbean", value: "black" },
      { label: "Other ethnic group", value: "other" },
      { label: "Prefer not to say", value: "prefer_not_to_say" },
    ],
  },
  {
    key: "treatment_status",
    label: "Are you currently in treatment or support?",
    hint: "Optional.",
    options: [
      { label: "Yes, currently", value: "current" },
      { label: "On a waiting list", value: "waiting" },
      { label: "Previously, not now", value: "previous" },
      { label: "Never", value: "never" },
      { label: "Prefer not to say", value: "prefer_not_to_say" },
    ],
  },
  {
    key: "referral_source",
    label: "How did you find Calm Anchor?",
    hint: "Optional.",
    options: [
      { label: "Healthcare professional", value: "healthcare" },
      { label: "Charity / support service", value: "charity" },
      { label: "Friend or family", value: "friend" },
      { label: "Online / app store", value: "online" },
      { label: "Other", value: "other" },
      { label: "Prefer not to say", value: "prefer_not_to_say" },
    ],
  },
];

export default function ProfileQuestionsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const c = colors[mode];

  const [answers, setAnswers] = useState<Record<string, string | null>>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const answered = QUESTIONS.filter((q) => answers[q.key]).length;

  const setAnswer = (q: Question, value: string) => {
    setAnswers((prev) => ({ ...prev, [q.key]: prev[q.key] === value ? null : value }));
  };

  const save = async () => {
    if (saving) return;
    setSaving(true);
    setError(null);
    try {
      await saveProfile({
        age_band: answers.age_band ?? undefined,
        gender: answers.gender ?? undefined,
        ethnicity: answers.ethnicity ?? undefined,
        treatment_status: answers.treatment_status ?? undefined,
        referral_source: answers.referral_source ?? undefined,
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: c.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Zone 1 · quiet header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <View style={styles.side}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={[styles.iconBtn, { backgroundColor: c.surfaceOffset }]}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={c.text} />
          </Pressable>
        </View>
        <View style={styles.centre}>
          <Text style={[styles.headline, { color: c.text }]}>A few optional questions</Text>
        </View>
        <View style={[styles.side, styles.right]}>
          <M3Button label="Not now" variant="text" color={c.textMuted} onPress={() => router.back()} />
        </View>
      </View>

      {/* Zone 2 · content */}
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centered}>
          <M3Card fill={c.exJournalBg} style={styles.intro}>
            <MaterialCommunityIcons name="account-heart-outline" size={22} color={c.exJournal} />
            <Text style={[styles.introText, { color: c.exJournal }]}>
              These help us understand who Calm Anchor helps. Every question is optional — skip any
              or all of them.
            </Text>
          </M3Card>

          {QUESTIONS.map((q) => {
            const selected = answers[q.key];
            return (
              <View key={q.key} style={[styles.panel, { backgroundColor: c.surface, borderColor: c.border }]}>
                <Text style={[styles.fieldLabel, { color: c.text }]}>{q.label}</Text>
                <Text style={[styles.fieldHint, { color: c.textFaint }]}>{q.hint}</Text>
                <View style={styles.optionGrid}>
                  {q.options.map((o) => {
                    const active = selected === o.value;
                    return (
                      <Pressable
                        key={o.value}
                        onPress={() => setAnswer(q, o.value)}
                        style={[
                          styles.option,
                          {
                            backgroundColor: active ? c.secondary : c.surfaceOffset,
                            borderColor: active ? c.secondaryActive : c.divider,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected: active }}
                        accessibilityLabel={o.label}
                      >
                        <Text
                          style={[
                            styles.optionLabel,
                            { color: active ? c.textInverse : c.text },
                          ]}
                        >
                          {o.label}
                        </Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Zone 3 · pinned actions */}
      <View style={[styles.nav, { paddingBottom: insets.bottom + 14, borderTopColor: c.divider }]}>
        <M3Button
          label={saving ? "Saving…" : answered ? `Save (${answered} answered)` : "Skip — not now"}
          icon="check"
          iconRight
          color={c.secondaryActive}
          onPress={save}
          disabled={saving}
          style={{ flex: 1.3 }}
        />
      </View>
      {error ? (
        <Text style={[styles.errorText, { color: c.error }]}>Couldn't save: {error}</Text>
      ) : null}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  side: { width: 72, alignItems: "flex-start", justifyContent: "center" },
  right: { alignItems: "flex-end" },
  centre: { flex: 1, alignItems: "center" },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headline: { fontSize: 15, lineHeight: 22, fontWeight: "700" },
  body: { padding: 20, paddingBottom: 32, flexGrow: 1 },
  centered: { alignItems: "stretch", width: "100%", marginTop: "auto", marginBottom: "auto" },
  intro: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 14 },
  introText: { flex: 1, fontSize: 13.5, lineHeight: 20, fontWeight: "700" },
  panel: { width: "100%", borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1 },
  fieldLabel: { fontSize: 14, lineHeight: 20, fontWeight: "700" },
  fieldHint: { fontSize: 12.5, marginTop: 2, marginBottom: 10 },
  optionGrid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: {
    borderRadius: 10,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  optionLabel: { fontSize: 13, fontWeight: "700" },
  nav: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  errorText: { paddingHorizontal: 20, paddingBottom: 8, fontSize: 13, lineHeight: 18 },
});