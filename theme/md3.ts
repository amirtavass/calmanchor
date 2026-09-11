import { MD3LightTheme, MD3DarkTheme, MD3Theme } from "react-native-paper";
import { colors, spacing, radius } from "./tokens";

/**
 * MD3 theme bridge.
 *
 * Calm Anchor's design token source of truth is `theme/tokens.ts` (which mirrors
 * `design-system/calm-anchor-design-system.css` v2.0). react-native-paper cannot
 * read CSS, so we map our tokens onto an `MD3Theme` here. Every Paper component
 * (Button, Card, Chip, Slider, FAB, BottomNavigation, ...) renders through this.
 *
 * MD3 role mapping used:
 *   primary       <- --color-primary
 *   secondary     <- --color-secondary
 *   accent        <- --color-accent
 *   error         <- --color-error
 *   background    <- --color-bg
 *   surface       <- --color-surface
 *   surfaceVariant<- --color-surface-offset
 *   onSurface     <- --color-text
 *   onSurfaceVariant <- --color-text-muted
 *   outline       <- --color-border
 *   outlineVariant<- --color-divider
 *   surfaceContainer/surfaceContainerHigh/Highest <- surface offsets (MD3 tonal surfaces)
 */

function buildTheme(mode: "light" | "dark"): MD3Theme {
  const c = colors[mode];
  const base = mode === "dark" ? MD3DarkTheme : MD3LightTheme;

  return {
    ...base,
    roundness: radius.md,
    colors: {
      ...base.colors,
      primary: c.primary,
      onPrimary: mode === "dark" ? c.textInverse : c.textInverse,
      primaryContainer: c.primarySubtle,
      onPrimaryContainer: c.text,
      secondary: c.secondary,
      onSecondary: mode === "dark" ? c.textInverse : c.textInverse,
      secondaryContainer: c.secondarySubtle,
      onSecondaryContainer: c.text,
      tertiary: c.accent,
      onTertiary: c.textInverse,
      tertiaryContainer: c.accentSubtle,
      onTertiaryContainer: c.text,
      error: c.error,
      onError: c.textInverse,
      errorContainer: c.error !== "#BF3A2A" && mode === "light" ? "#FAEAE8" : c.surfaceOffset,
      onErrorContainer: c.text,
      background: c.bg,
      onBackground: c.text,
      surface: c.surface,
      onSurface: c.text,
      surfaceVariant: c.surfaceOffset,
      onSurfaceVariant: c.textMuted,
      surfaceDisabled: c.surfaceOffset2,
      onSurfaceDisabled: c.textFaint,
      outline: c.border,
      outlineVariant: c.divider,
      backdrop: mode === "dark" ? "rgba(30,46,22,0.72)" : "rgba(244,241,235,0.72)",
      inverseSurface: c.textMuted,
      inverseOnSurface: c.surface,
      inversePrimary: c.primaryHover,
      shadow: "#000000",
      scrim: mode === "dark" ? "rgba(0,0,0,0.4)" : "rgba(26,26,19,0.4)",
      elevation: base.colors.elevation,
    },
    fonts: base.fonts,
    animation: base.animation,
  };
}

export const md3LightTheme = buildTheme("light");
export const md3DarkTheme = buildTheme("dark");

export const md3Spacing = spacing;