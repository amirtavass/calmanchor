# Component Library — what exists, what to reuse

> **Status:** Standing reference. Check here **before building any UI element** — if a component exists,
> use it; if a pattern exists in a shipped screen, copy it; only then build something new (and record it here).
> **Companion:** `03-screen-craft.md` (layout/spacing/typography/colour/motion rules).
> **All components are hand-built to m3.material.io specs** with colours from `theme/tokens.ts`.
> `react-native-paper` is used only for the press ripple (`TouchableRipple`), `Text` variants, and `TextInput`.

---

## 1. Reuse rule

1. **Exists → use it.** Do not restyle a copy; pass props (`color`, `fill`, `variant`, `tint`, `style`).
2. **Pattern exists in a shipped screen → copy the snippet**, then apply the *promotion rule* (§4): the second
   time a pattern is needed on another screen, extract it into `components/` and update this file.
3. **New component → spec it first.** One paragraph in this file: which M3 spec, which tokens, which props,
   which screen needs it. Then build it. No undocumented one-off components.
4. **Never** introduce a new native module (slider, reanimated, SVG, blur…) as part of a styling task —
   it forces an EAS rebuild and has already caused a production crash (`RNCSlider` ViewManager missing).

---

## 2. Components

### `components/M3Button.tsx`
M3 button, 40dp · radius 20 · `label-large` 14/20/500 · paddingH 16 · gap 8 · icon 20 · pressed state layer
12% (`${contentColor}1F`).

| Prop | Type | Notes |
|---|---|---|
| `label` | `string` | required |
| `onPress` | `() => void` | required |
| `variant` | `"filled" \| "outlined" \| "text"` | default `filled` |
| `icon` | `MciGlyph` | 20dp, leading |
| `iconRight` | `boolean` | trailing icon — use for `arrow-right` / `check` |
| `selected` | `boolean` | flips `outlined` → filled |
| `color` | `string` | overrides the accent (fill when filled/selected; border + label when outlined/text) |
| `disabled` | `boolean` | filled/text: `surfaceOffset2` + `textMuted`; outlined: transparent + `divider` border |
| `style` | `object` | applied to the outer wrapper — use `{ flex: 1 }` / `{ alignSelf: "stretch" }` |

**Usage in a pinned action bar:** secondary `variant="outlined" color={c.textMuted}` · primary `filled` ·
quiet escape `variant="text"`. Context-coloured actions pass `color` (e.g. the step's `--ex-*` hue).

### `components/M3Chip.tsx`
Two modes.

- **Plain (M3 filter chip):** 32dp · radius 8 · `surface` + `divider` stroke · selecting fills
  `secondarySubtle` and animates in an 18dp checkmark. Props: `label`, `selected`, `onPress`,
  `selectedBg?`, `selectedColor?`.
- **Tinted (design-system pill idiom):** 40dp · radius 8 · `borderWidth: 1.5` · paddingH 14 · gap 6 ·
  icon 18 · label 14/600. Unselected = `tint.bg` fill + `tint.fg` stroke/icon/label; selected = solid
  `tint.fg` fill + `textInverse` content. Props: add `icon?: MciGlyph`, `tint?: { bg: string; fg: string }`.

**Use tinted mode for semantic categories** (survival-response states, exercise categories) so the chip
carries its palette; plain mode for neutral filters. Put chips in a **horizontal ScrollView** when the set
can overflow — never let them wrap to a second line.

### `components/M3Card.tsx`
M3 filled card · radius 12 · content padding 16 · default fill `surfaceOffset2`.

| Prop | Notes |
|---|---|
| `children` | card content |
| `fill` | container colour override — use a `*Bg` token for tinted tiles |
| `accentColor` | optional 4dp top bar |
| `onPress` | adds ripple + button role |
| `style` | merged onto the card view (safe place for a selection border) |

### `components/M3Scale.tsx`
0–10 SUDS scale (S14/S15) — **the only slider in the app**; there is no native slider dependency.
Gradient track of 11 `--mood-5…1` bands (14dp tall, radius 7) · 30dp white thumb with a 3dp band-coloured
border, springing to the value (friction 9, tension 70) · 34dp fixed-height value chip in the band colour
(`textInverse` label) · endpoint labels `0 · calm` / `very high · 10` · tap anywhere sets the value.

Props: `value: number | null`, `onChange: (v: number) => void`.
Also exports **`moodBandKey(v)`** → the `mood*` token key for a value, so summaries can reuse the exact
same colour as the scale (used by the review screen's SUDS chips).

Layout is fixed-height: choosing a value moves the thumb, never the page.

### `components/ScreenHeader.tsx`
M3 small app bar for **tab screens only**: `surface` · `paddingTop: insets.top + 8` · minHeight 64 ·
`titleLarge` weight 400 · `labelMedium` subtitle in `textMuted` · trailing avatar → `/profile`.
Props: `title`, `subtitle?`. Pushed screens use a hero or a quiet header instead (`03-screen-craft.md` §10).

---

## 3. Tokens and helpers

```ts
import { useAppTheme } from "../theme/ThemeContext";   // { mode } — "light" | "dark"
import { colors, spacing, radius, animation, zIndex } from "../theme/tokens";
const c = colors[mode];                                 // always index by mode
```

- **Palette pairs:** `srFight`/`srFightBg`, `srFlight`/`srFlightBg`, `srFreeze`/`srFreezeBg`,
  `srFawn`/`srFawnBg`, `nsWindow`/`nsWindowBg`, `nsHyper`/`nsHyperBg`, `nsHypo`/`nsHypoBg`,
  `exBreath`/`exBreathBg`, `exGround`/`exGroundBg`, `exSomatic`/`exSomaticBg`, `exJournal`/`exJournalBg`,
  `exSelfkind`/`exSelfkindBg`, `exCrisis`/`exCrisisBg`, `mood1..5`/`mood1Bg..mood5Bg`,
  `success`/`successSubtle`/`successTint`, `primary`/`primarySubtle`/`primaryTint`,
  `accent`/`secondary` (+ `Subtle`/`Tint`), `warmGold`.
- **Surfaces:** `bg` → `surface` → `surface2` → `surfaceOffset` → `surfaceOffset2` → `surfaceDynamic`
  (increasing elevation of "lift"). `divider` = hairlines, `border` = real outlines.
- **Text:** `text` → `textMuted` (0.85–0.9 opacity for secondary) → `textFaint` (decorative only, **never**
  for a label on a control) · `textInverse` for content on a solid palette colour.
- **`types/exercise.ts`** exports the shared UI vocabulary: `MciGlyph` (typed icon names), `CATEGORIES`
  (`{ key, label, icon }`), `CATEGORY_TOKENS` (category → `{ fg, bg }` token keys), `SENSE_TONES`
  (see/hear/touch/smell/taste → distinct `--ex-*` pairs), `senseForStep(step)` → `{ key, icon, label }`,
  `senseIconForStep(step)`.

---

## 4. Patterns (snippets) and the promotion rule

These are copy-paste patterns living in the shipped screens today. **When a second screen needs one, extract
it into `components/`, delete the duplicate, and add it to §2 above.**

| Pattern | Where it lives now | Shape |
|---|---|---|
| **Screen shell** | `app/exercise/session/[id].tsx` → `shell()` | `KeyboardAvoidingView` → header row → ScrollView (`flexGrow: 1`, padding 20/32) → pinned action bar (`insets.bottom + 14`) |
| **Medallion** | session `medallion()`, detail hero | circular `*Bg` or `surface2` container, glyph at ~45% of size; 30/34/40/64/72/88dp |
| **Panel** | session pre/post | `surface`, radius 16, padding 18, `marginTop: 22`, `alignItems: "stretch"`; holds a 700-weight question + its control |
| **Tinted statement card** | detail "What this is" | `--*-bg`, radius 16, padding 18, eyebrow row (30dp icon circle + uppercase 800 label) + 15.5/24 body |
| **Icon-led list** | detail "What to expect" | `surface` card, rows paddingV 14, gap 14, hairline dividers, `[34dp tinted circle + glyph 18]` + 14.5/21 text |
| **Reassurance row** | session pre | `[glyph 16 textMuted]` + 13.5/20 muted text, gap 8 |
| **Meta pill** | detail hero | `surface2`, radius 999, paddingH 12 paddingV 6, `[glyph 14]` + 12.5/600 |
| **Eyebrow label** | detail, review card | 11.5–13 · 800 · `letterSpacing: 0.6–0.7` · uppercase · accent colour or 0.75 opacity |
| **Summary card** | session confirm | head row (40dp icon + title 16/700 + meta 12.5) · hairline divider · eyebrow + value blocks · quote block for user text |
| **SUDS chip** | session confirm | 38dp min-width circle, radius 19, `moodBandKey(v)` fill, `textInverse` 16/800 label |
| **Tinted tile grid** | landing categories | `M3Card fill={--*-bg}` at `width: "48%"`, glyph 28 + label 16/24/700 + count 12/16 @ 0.75 |
| **Two-line list row** | landing quick start | paddingV 12, gap 12, 40dp tinted lead icon, title 16/24/400 + supporting 14/20, trailing `M3Button` |
| **Greeting header** | home dashboard | `insets.top + 8`; left = date 13/600 muted + greeting 22/800; right = status pill + avatar; on `bg` (not a surface bar) |
| **Stat card** | home dashboard | `surface`, radius 12, paddingV 14, value 24/800 (semantic colour) + label 12/500 muted; row of 3 with gap 8 |
| **Stepper** | home "today's plan" | 28dp circles (done = `success`+check, active = `primary`+number, pending = `surfaceOffset`+muted number), 2dp connectors, label 12/500 below |
| **Status pill** | home Window chip | non-interactive: `warmGoldTint` bg + `warmGold` text + glyph 14, radius 999, paddingH 12 paddingV 6 |
| **Empty state** | diary | 64dp medallion (`--*-bg`, glyph 32) + 18/800 title + one supportive line (maxWidth 280) + full-width `M3Button` action |
| **Entry card** | diary list | `surface`, radius 12, padding 14, gap 12: 40dp tinted icon (`exJournalBg`/`exJournal`) + title 15/600 (2 lines) + meta 13/500 (date · tags) + trailing chevron |
| **Tinted icon circle** | diary prompt/entry medallions | 34dp radius 10 `--*-bg` + glyph 18 in `--*` (prompt) · 40dp radius 12 (entry row) |
| **Helpfulness tile** | session post | colour-field Pressable filled with the *strong* tone (e.g. `srFreeze`/`mood3`/`success`) + `textInverse` glyph 26 + label 13/800. Always-on 1 dp `text` border so it reads as interactive; selected = 2 dp `text` ring + outset shadow; 0.85 opacity on press. Three tiles share width via `flex: 1` + gap 10. **Never use the pastel `*-bg` variants here** — they read as a repeated near-white row against the surface panel. |
| **Filled CTA — strong contrast** | session Save / Done / Review & save, dashboard CTA, diary Write/Save | `M3Button` filled with `secondaryActive` (#4A4230), `textInverse` label. `secondary` (#686040) is too low-contrast for label-on-fill on the cream canvas; reserve `secondary` for outlined buttons and quiet elements. |
| **Theme toggle** | every screen header | small Pressable (`surface2` + `border`, 36 dp height, 18 radius), `weather-night`/`weather-sunny` MCI glyph in `secondary`, two-line `Theme · Light\|Dark` label. Cycles light ↔ dark. Avatar was removed from the header; profile access is reached through the dashboard greeting card's chevron. |
| **Skeleton placeholder** (`M3Skeleton`) | exercise detail / session / category / diary landing | direct lift of design-system §17. Interpolation between `surfaceOffset` and `surfaceDynamic` on the `shimmer` keyframes (1.5 s loop). Variants: `text` 14 dp, `text-multi` decreasing-width stack, `card` 120 dp, `avatar` 40 dp radius 999, `block` custom. Use `SkeletonTextStack` for the 100 / 80 / 60 % pattern. |
| **Spinner** (`M3Spinner`) | inline progress (button loading, search) | direct lift of design-system §19. 16 dp circular border, 1 s linear spin. `tint` override (default `textMuted`); pair with filled buttons for save/load states. |
| **Exercise loading screen** | exercise detail / session | full-screen skeleton mirroring the live detail layout (category chip → headline → meta row → description panel → steps list → CTA). Same ScreenHeader, same bg, so the transition into the live screen is invisible. |
| **Weekly window chart** | home §11 | 7 bars in a 56dp row, gap 8, `alignItems: flex-end`; per-day `--ns-*` fill, today is dashed-border (no fill) at the current day's slot height; legend below |
| **Warm reminder card** | home below CTA | `exSelfkindBg` 14 dp radius row, 40 dp `exSelfkind` medallion, title 15/800 + body 13/19 0.9, trailing chevron → relevant action |
| **Info badge** | diary/new | tinted row: `--*-bg` background, 12 dp radius, 10 dp vertical padding, `information-outline` glyph 14 + text 12.5/18/700 in `--*`. Use for notices the user must see (e.g. "optional") |
| **Breathing ring** | session steps | 180dp wrap; 112dp ring (2dp `--ex-*` border, `--*-bg` fill, glyph 44) + absolute halo; scale 1→1.045 (4s) and halo 1→1.65 / 0.4→0 (3s) |
| **Full-bleed chip scroller** | landing states | horizontal `ScrollView`, `marginHorizontal: -16` + content `paddingHorizontal: 16`, gap 8 |

---

## 5. Screen skeleton (copy-paste)

The pushed-screen scaffold, matching the shipped session shell. Start from this, then fill Zone 2 with the
structures in §4. (Tab screens differ: `ScreenHeader` + no pinned bar + `paddingBottom: 96`.)

```tsx
import { KeyboardAvoidingView, ScrollView, StyleSheet, View, Pressable } from "react-native";
import { Text } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import M3Button from "../../components/M3Button";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";

export default function ExampleScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const c = colors[mode];

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: c.bg }]} behavior="padding">
      {/* ZONE 1 · header — quiet (flow step) or tinted hero (entity screen) */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <View style={styles.side} />
        <View style={styles.centre} />
        <View style={[styles.side, styles.right]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Leave"
            style={[styles.close, { backgroundColor: c.surfaceOffset }]}
          >
            <MaterialCommunityIcons name="close" size={20} color={c.textMuted} />
          </Pressable>
        </View>
      </View>

      {/* ZONE 2 · content — auto-margins centre it without ever clipping */}
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.centered}>
          <View style={[styles.medallion, { backgroundColor: c.primaryTint }]}>
            <MaterialCommunityIcons name="meditation" size={29} color={c.primary} />
          </View>
          <Text variant="headlineSmall" style={[styles.headline, { color: c.text }]}>
            Headline
          </Text>
          <Text variant="bodyMedium" style={[styles.subline, { color: c.textMuted }]}>
            One supportive line that never orphans a word.
          </Text>

          <View style={[styles.panel, { backgroundColor: c.surface }]}>
            <Text variant="titleMedium" style={{ fontWeight: "700", color: c.text }}>
              The question or section this screen is about
            </Text>
            {/* control / icon-led rows / quote block */}
          </View>
        </View>
      </ScrollView>

      {/* ZONE 3 · pinned actions — same place on every stage of the flow */}
      <View style={[styles.nav, { paddingBottom: insets.bottom + 14, borderTopColor: c.divider }]}>
        <M3Button label="Back" icon="arrow-left" variant="outlined" color={c.textMuted}
          onPress={() => {}} style={{ flex: 1 }} />
        <M3Button label="Continue" icon="arrow-right" iconRight
          onPress={() => {}} style={{ flex: 1.3 }} />
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingBottom: 8 },
  side: { width: 44, alignItems: "flex-start", justifyContent: "center" },
  right: { alignItems: "flex-end" },
  centre: { flex: 1, alignItems: "center" },
  close: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center" },
  body: { padding: 20, paddingBottom: 32, flexGrow: 1 },
  centered: { alignItems: "center", width: "100%", marginTop: "auto", marginBottom: "auto" },
  medallion: { width: 64, height: 64, borderRadius: 32, alignItems: "center", justifyContent: "center", marginBottom: 18 },
  headline: { fontWeight: "800", textAlign: "center", letterSpacing: -0.3 },
  subline: { marginTop: 6, fontSize: 14.5, lineHeight: 21, opacity: 0.9, textAlign: "center" },
  panel: { width: "100%", borderRadius: 16, padding: 18, marginTop: 22, alignItems: "stretch" },
  nav: { flexDirection: "row", gap: 12, paddingHorizontal: 20, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
});
```

---

## 6. Known constraints

- **Icons:** `@expo/vector-icons` only (fonts load at runtime; `react-native-vector-icons` glyphs render as
  empty boxes in our dev build). Type names as `MciGlyph`; verify the glyph exists — `nose`/`tongue` do not.
- **No native slider.** `@react-native-community/slider` was removed after its missing ViewManager crashed the
  session screen. `M3Scale` is the replacement; do not reintroduce a native slider.
- **RN `Animated` only** for motion (see `03-screen-craft.md` §8).
- **`justifyContent: "center"` on a ScrollView content container clips overflow** — use auto-margins.
- **Unset `borderColor` renders black** — always set a border colour when you set `borderWidth`.
- **Dev-client workflow:** JS/styling changes need only Metro (`npx expo start --dev-client`); a new native
  module needs an EAS rebuild. Verify with `npx tsc --noEmit` and `npx expo export --platform android`.
