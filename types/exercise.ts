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

// Sense glyph per 5-4-3-2-1 step — derived from the step's wording so the
// per-step screen can show a proper icon instead of an emoji (rules §2.1).
const SENSE_KEYWORDS: { match: RegExp; icon: MciGlyph }[] = [
  { match: /see/, icon: "eye" },
  { match: /hear/, icon: "ear-hearing" },
  { match: /touch|feel/, icon: "hand-back-right" },
  { match: /smell/, icon: "flower" },
  { match: /taste/, icon: "silverware-fork-knife" },
];

export function senseIconForStep(step: string): MciGlyph {
  const s = step.toLowerCase();
  const hit = SENSE_KEYWORDS.find((k) => k.match.test(s));
  return hit ? hit.icon : "meditation";
}

// Exercises tab colour per category — maps each category to the design system's
// `--ex-*` exercise-type palette (design-system/calm-anchor-design-system.css).
import type { ComponentProps } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { colors } from "../theme/tokens";

type TokenKey = keyof typeof colors.light;

/** Valid MaterialCommunityIcons glyph names, for icon-typed props. */
export type MciGlyph = ComponentProps<typeof MaterialCommunityIcons>["name"];

export const CATEGORY_TOKENS: Record<ExerciseCategory, { fg: TokenKey; bg: TokenKey }> = {
  breathing: { fg: "exBreath", bg: "exBreathBg" },
  somatic: { fg: "exSomatic", bg: "exSomaticBg" },
  sensory: { fg: "exGround", bg: "exGroundBg" },
  voice: { fg: "exSelfkind", bg: "exSelfkindBg" },
  mindful: { fg: "exJournal", bg: "exJournalBg" },
  crisis: { fg: "exCrisis", bg: "exCrisisBg" },
};