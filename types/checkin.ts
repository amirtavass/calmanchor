import type { ComponentProps } from "react";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { colors } from "../theme/tokens";

type MciGlyph = ComponentProps<typeof MaterialCommunityIcons>["name"];
type TokenKey = keyof typeof colors.light;

export type NsStateKey = "window" | "hyper" | "hypo";
export type SurvivalKey = "fight" | "flight" | "freeze" | "fawn";

export interface StateOption<K extends string> {
  key: K;
  label: string;
  icon: MciGlyph;
  fg: TokenKey;
  bg: TokenKey;
}

/**
 * Check-in vocabulary (S25). Nervous-system state + survival response, in the
 * design system's `--ns-*` / `--sr-*` colour families. Colour is never the only
 * differentiator — every option carries a glyph and a word (craft R7).
 * Shared by the Home check-in card and the Diary trigger tracker.
 */
export const NS_OPTIONS: readonly StateOption<NsStateKey>[] = [
  { key: "window", label: "In window", icon: "leaf", fg: "nsWindow", bg: "nsWindowBg" },
  { key: "hyper", label: "Hyper", icon: "flash", fg: "nsHyper", bg: "nsHyperBg" },
  { key: "hypo", label: "Hypo", icon: "snowflake", fg: "nsHypo", bg: "nsHypoBg" },
];

export const SR_OPTIONS: readonly StateOption<SurvivalKey>[] = [
  { key: "fight", label: "Fight", icon: "flash", fg: "srFight", bg: "srFightBg" },
  { key: "flight", label: "Flight", icon: "run", fg: "srFlight", bg: "srFlightBg" },
  { key: "freeze", label: "Freeze", icon: "snowflake", fg: "srFreeze", bg: "srFreezeBg" },
  { key: "fawn", label: "Fawn", icon: "handshake", fg: "srFawn", bg: "srFawnBg" },
];

/** Window-of-tolerance bucket for a raw `checkins.ns_state` value. */
export function nsBucket(value: string | null | undefined): "window" | "hyper" | "hypo" | null {
  const v = (value ?? "").trim().toLowerCase();
  if (!v) return null;
  if (v === "window" || v === "regulated" || v === "in window" || v === "in_window") return "window";
  if (v === "hyper" || v === "hyperarousal" || v === "dysregulated") return "hyper";
  if (v === "hypo" || v === "hypoarousal" || v === "shutdown") return "hypo";
  return null;
}

export function nsOption(key: string | null | undefined): StateOption<NsStateKey> | null {
  const b = nsBucket(key);
  return b ? (NS_OPTIONS.find((o) => o.key === b) ?? null) : null;
}
