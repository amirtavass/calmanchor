export interface Exercise {
  id: string;
  chapter_id: string | null;
  exercise_type: string;
  category: string;
  title: string;
  steps: string[];
  duration_minutes: number | null;
}

export type ExerciseCategory =
  | "breathing"
  | "somatic"
  | "sensory"
  | "voice"
  | "mindful"
  | "crisis";

export const CATEGORIES: { key: ExerciseCategory; label: string; icon: MciGlyph }[] = [
  { key: "breathing", label: "Breath", icon: "weather-windy" },
  { key: "somatic", label: "Somatic", icon: "hand-heart" },
  { key: "sensory", label: "Sensory", icon: "ear-hearing" },
  { key: "voice", label: "Voice", icon: "microphone" },
  { key: "mindful", label: "Mindful", icon: "meditation" },
  { key: "crisis", label: "Crisis", icon: "lifebuoy" },
];

// Sense glyph + tone per 5-4-3-2-1 step — derived from the step's wording so the
// per-step screen can show a proper icon instead of an emoji (rules §2.1), and a
// distinct colour per sense so the steps don't all read the same green. Tones
// reuse the design system's --ex-* palette (five distinct hues already defined).
export type SenseKey = "see" | "hear" | "touch" | "smell" | "taste" | "notice";

const SENSE_KEYWORDS: { match: RegExp; key: SenseKey; icon: MciGlyph; label: string }[] = [
  { match: /see/, key: "see", icon: "eye", label: "See" },
  { match: /hear|listen/, key: "hear", icon: "ear-hearing", label: "Hear" },
  { match: /touch|feel/, key: "touch", icon: "hand-back-right", label: "Touch" },
  { match: /smell/, key: "smell", icon: "flower", label: "Smell" },
  { match: /taste/, key: "taste", icon: "silverware-fork-knife", label: "Taste" },
];

export function senseForStep(step: string): { key: SenseKey; icon: MciGlyph; label: string } {
  const s = step.toLowerCase();
  const hit = SENSE_KEYWORDS.find((k) => k.match.test(s));
  return hit ?? { key: "notice", icon: "meditation", label: "Notice" };
}

export function senseIconForStep(step: string): MciGlyph {
  return senseForStep(step).icon;
}

// Exercises tab colour per category — maps each category to the design system's
// `--ex-*` exercise-type palette (design-system/calm-anchor-design-system.css).
import type { ComponentProps } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { colors } from "../theme/tokens";

type TokenKey = keyof typeof colors.light;

/** Valid MaterialCommunityIcons glyph names, for icon-typed props. */
export type MciGlyph = ComponentProps<typeof MaterialCommunityIcons>["name"];

/** Per-sense tone: five distinct hues from the design system's --ex-* palette. */
export const SENSE_TONES: Record<SenseKey, { fg: TokenKey; bg: TokenKey }> = {
  see: { fg: "exBreath", bg: "exBreathBg" }, // teal
  hear: { fg: "exJournal", bg: "exJournalBg" }, // purple
  touch: { fg: "exSomatic", bg: "exSomaticBg" }, // warm brown
  smell: { fg: "exSelfkind", bg: "exSelfkindBg" }, // rose
  taste: { fg: "exGround", bg: "exGroundBg" }, // earthy green
  notice: { fg: "exGround", bg: "exGroundBg" },
};

export const CATEGORY_TOKENS: Record<ExerciseCategory, { fg: TokenKey; bg: TokenKey }> = {
  breathing: { fg: "exBreath", bg: "exBreathBg" },
  somatic: { fg: "exSomatic", bg: "exSomaticBg" },
  sensory: { fg: "exGround", bg: "exGroundBg" },
  voice: { fg: "exSelfkind", bg: "exSelfkindBg" },
  mindful: { fg: "exJournal", bg: "exJournalBg" },
  crisis: { fg: "exCrisis", bg: "exCrisisBg" },
};