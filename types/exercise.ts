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

export const CATEGORIES: { key: ExerciseCategory; label: string; emoji: string }[] = [
  { key: "breathing", label: "Breath", emoji: "🫁" },
  { key: "somatic", label: "Somatic", emoji: "🧍" },
  { key: "sensory", label: "Sensory", emoji: "👂" },
  { key: "voice", label: "Voice", emoji: "🗣" },
  { key: "mindful", label: "Mindful", emoji: "🧠" },
  { key: "crisis", label: "Crisis", emoji: "🆘" },
];

// Exercises tab colour per category — maps each category to the design system's
// `--ex-*` exercise-type palette (design-system/calm-anchor-design-system.css).
import { colors } from "../theme/tokens";

type TokenKey = keyof typeof colors.light;

export const CATEGORY_TOKENS: Record<ExerciseCategory, { fg: TokenKey; bg: TokenKey }> = {
  breathing: { fg: "exBreath", bg: "exBreathBg" },
  somatic: { fg: "exSomatic", bg: "exSomaticBg" },
  sensory: { fg: "exGround", bg: "exGroundBg" },
  voice: { fg: "exSelfkind", bg: "exSelfkindBg" },
  mindful: { fg: "exJournal", bg: "exJournalBg" },
  crisis: { fg: "exCrisis", bg: "exCrisisBg" },
};