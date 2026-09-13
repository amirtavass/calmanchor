# Screen Craft — standing UI/UX principles

> **Status:** Standing reference — applies to EVERY screen, every milestone. Read this before designing or
> building any screen; do not re-derive these decisions per task.
> **Canonical examples (shipped, approved):** `app/exercise/[id].tsx` (detail), `app/exercise/session/[id].tsx`
> (guided session), `app/exercise/category/[key].tsx` (listing), `app/(tabs)/exercises.tsx` (landing).
> When a new screen needs a pattern, **copy it from these files** rather than inventing one.
> **Sibling docs:** `00-design-system-usage-rules.md` (how to borrow from `design-system/*`),
> `04-component-library.md` (the shared components + tokens), `01-navigation-and-ia.md` (shell/IA),
> `sections/*` (per-screen designs).
> **Hierarchy:** `/docs` (user stories, IA, screen specs, ledger) wins on *what* a screen contains;
> `00-design-system-usage-rules.md` wins on *borrowing*; **this file wins on layout, spacing, typography,
> colour roles, motion and control placement.** If a screen spec's ASCII disagrees with this file on craft
> (not content), follow this file and note it in the screen spec.

---

## 0. Why this file exists — rules learned from review

The Exercises flow went through three review rounds. Every rule below is one of those findings, generalised
so the remaining screens (Home/check-in, Toolkit, Diary, Crisis, Profile, Onboarding, Portfolio, Dashboard)
ship right the first time.

| # | Review finding | Rule |
|---|---|---|
| R1 | "What this is / what to expect are not engaging… simple font styling" | **Text is never bare** (§5) |
| R2 | "Buttons jump down as the user moves through the flow" | **Controls never move** (§7) |
| R3 | "The word *up* is positioned on the next line" | **No orphan words — split copy deliberately** (§4) |
| R4 | "The slider jumps a bit when I click a number" | **Choosing a value must not shift layout** (§7.3) |
| R5 | "No breathing room, positioned too high, back button hard to click" | **Headers respect the safe area and give a real target** (§2, §10) |
| R6 | "Green is all over the steps — use more contrasted colours" | **One hue per meaning; never one hue for everything** (§6) |
| R7 | "Fight and flight have the same colouring" | **Colour is never the only differentiator** (§6.4) |
| R8 | "The keyboard opens and the user can't see what they're writing" | **Keyboard-aware by default** (§12) |
| R9 | "Icons are not loaded / there's an unloaded shape" | **Only `@expo/vector-icons`; verify the glyph exists** (§9) |
| R10 | "Half of the screen is empty" | **Centre the composition; fill space with structure, not padding** (§3) |
| R11 | "The header says *Exercises* — that's wrong" | **Never label a pushed screen with its parent's name** (§10.3) |
| R12 | "I don't like the Cancel button from start to end" | **Exit controls are quiet and out of the way** (§10.4) |

---

## 1. The screen scaffold (three zones)

Every screen is **header → content → actions**, in that order, and the outermost view owns the background.

```
┌─────────────────────────────────────────────┐
│  ZONE 1 · HEADER                            │  paddingTop: insets.top + 6..8
│  [side 44]      [centre flex:1]   [side 44] │  paddingBottom: 8..12
├─────────────────────────────────────────────┤
│  ZONE 2 · CONTENT (ScrollView)              │  padding: 20 (16 on dense tab screens)
│                                             │  flexGrow: 1  ← lets auto-margins centre
│      [medallion]                            │  paddingBottom: 32 (96 on tab screens,
│      Headline                               │   for FAB + tab-bar clearance)
│      Subline                                │
│      ┌─ panel (surface, r16, p18) ─┐        │
│      │  Question / control / rows  │        │
│      └─────────────────────────────┘        │
│      icon-led reassurance rows              │
├─────────────────────────────────────────────┤
│  ZONE 3 · PINNED ACTION BAR                 │  paddingTop: 14 · gap: 12
│  [ secondary  flex 1 ] [ primary  flex 1.3 ]│  paddingBottom: insets.bottom + 14..16
└─────────────────────────────────────────────┘   hairline top border in `divider`
```

- **Zone 1 and Zone 3 are outside the ScrollView.** They never scroll, so the controls stay put (R2).
- **Zone 3 is used on every stage of a multi-step flow** and on any screen whose primary action matters
  (detail, session stages, diary compose, check-in, crisis actions). Inline buttons at the end of scroll
  content are only acceptable for tertiary links ("Browse all categories →").
- **Backgrounds:** the root view sets `backgroundColor: c.bg`. Panels/cards set their own surface — never
  rely on the parent's background bleeding through.
- **KeyboardAvoidingView wraps the whole scaffold** (behaviour `"padding"`) on any screen with a text input.

Reference implementation: the `shell()` helper in `app/exercise/session/[id].tsx` — reuse that shape.
A copy-paste skeleton is in `04-component-library.md` §5.

---

## 2. Spacing and safe area (R5)

| Where | Value |
|---|---|
| Header top | `insets.top + 6` (pushed screens) · `insets.top + 8` (tab `ScreenHeader`) |
| Header bottom | `8` (session shell) · `12` (listing/detail headers) |
| Header sides | `paddingHorizontal: 16` |
| Content padding | `20` (session/detail bodies) · `16` (dense tab screens) |
| Content bottom | `32` (pushed screens) · `96` (tab screens — FAB + tab bar clearance) |
| Action bar | `paddingTop: 14`, `gap: 12`, `paddingHorizontal: 20`, `paddingBottom: insets.bottom + 14` (16 on detail) |
| Panel / card | radius `16` (panels, summary cards) · radius `12` (M3 cards, list tiles) · padding `18` (panels) / `16` (cards) |
| Vertical rhythm between blocks | `12` (tight) · `18–22` (section) · `26–28` (new topic) |
| Full-bleed horizontal scrollers | `marginHorizontal: -16` + `paddingHorizontal: 16` on the content container |

**Rules**

1. Always read `useSafeAreaInsets()` — never hard-code a status-bar offset. `react-native-safe-area-context`
   is already installed and expo-router provides the provider.
2. Nothing sits flush against the top of the screen. If a header looks "too high", it is missing its inset.
3. Tap targets: minimum **44dp** hit area for any navigation control, even if the visible glyph is smaller
   (e.g. a 34–38dp circle inside a 44dp `Pressable`), plus `hitSlop={10}`.
4. Spacing scales: 4 / 8 / 12 / 16 / 20 / 24 / 28 / 32 (`theme/tokens.ts` → `spacing`). Do not invent 13px gaps.

---

## 3. Centring without clipping (R10)

Short screens look unfinished when content hugs the top ("half the screen is empty"). Long screens break
when centred content overflows.

**Do this:** the ScrollView's `contentContainerStyle` gets `flexGrow: 1`, and the content wrapper gets
`marginTop: "auto"` + `marginBottom: "auto"`.

```tsx
<ScrollView contentContainerStyle={{ padding: 20, paddingBottom: 32, flexGrow: 1 }}>
  <View style={{ alignItems: "center", width: "100%", marginTop: "auto", marginBottom: "auto" }}>
    …
  </View>
</ScrollView>
```

**Never** use `justifyContent: "center"` on a ScrollView's content container — when the content is taller
than the viewport, the top is clipped and unreachable.

Fill the space with **structure** (medallion → headline → subline → panel → icon rows), not with padding.
A centred screen should still read top-to-bottom as a composition.

---

## 4. Typography and voice (R1, R3)

### 4.1 The scale in use

| Role | Treatment | Example |
|---|---|---|
| Screen headline | `headlineSmall`, weight **800**, `letterSpacing: -0.3`, centred | "Before you begin" |
| Hero title | `headlineMedium`, weight **800**, `letterSpacing: -0.4`, centred | "5-4-3-2-1 Grounding" |
| Step statement | `headlineMedium`, weight **700**, centred | "Find 3 things you can hear" |
| Subline | `bodyMedium` 14.5/21, `textMuted` @ 0.9, centred, `marginTop: 6` | "Check it looks right — you can still adjust anything." |
| Emphasis subline | `titleMedium`, weight **700**, in a semantic colour | "Well done for showing up." |
| Section label (in content) | **brand 800**, `letterSpacing: -0.02`, ~20 (ledger Q3) | "Quick start" |
| Eyebrow (inside a card) | 11.5–13, weight **800**, `letterSpacing: 0.6–0.7`, `textTransform: "uppercase"`, 0.75 opacity or the card's accent colour | "WHAT THIS IS" |
| Panel question | `titleMedium`, weight **700**, `text` | "How distressed do you feel now?" |
| Body copy | 14.5–15.5 / 21–24 | explanation text |
| Supporting / meta | 12–13 / 16–20, `textMuted` | "Sensory · 5 steps · ~5 min" |
| App-bar title (tab screens) | `titleLarge` weight **400** + `labelMedium` subtitle (ledger Q5) | `ScreenHeader` |

### 4.2 Rules

1. **Weight contrast does the work.** A screen should mix 800 (headline/eyebrow), 700 (questions/emphasis),
   400–500 (body) — never a page of one weight.
2. **No orphan words (R3).** Do not let a headline wrap by accident. Split copy into a headline + subline
   yourself: `"That's it."` + `"Well done for showing up."`. Keep headlines under ~24 characters, and set
   `textAlign: "center"` on centred compositions.
3. **UK spelling** everywhere (colour, centre, organise, programme).
4. **Voice:** calm, second person, no pressure, no clinical jargon, no "good/bad" framing (S26).
   Prefer "You can skip. No pressure." to "This field is optional."
5. **Never ship bare paragraph text as the whole treatment** — see §5.

---

## 5. Text is never bare (R1)

Explanatory copy always lives inside a structure. Pick one:

| Structure | When | Shipped example |
|---|---|---|
| **Panel** — `surface`, radius 16, padding 18 | A question + its control, or a grouped form section | pre/post stage panels in the session |
| **Tinted statement card** — `--ex-*-bg`, radius 16, padding 18, eyebrow + icon medallion | The one thing this screen is about | "What this is" on the detail screen |
| **Icon-led list** — rows of `[34dp tinted circle + glyph 18]` + 14.5/21 text, hairline dividers | Anything you would otherwise write as `·` bullets | "What to expect" on the detail screen |
| **Icon-led reassurance rows** — `[glyph 16]` + 13.5/20 muted text | Small print, privacy notes, "you can skip" | pre-stage reassurance rows |
| **Quote block** — `surfaceOffset`, radius 10, `borderLeftWidth: 3` in `primary`, italic 14.5/21 | User-authored text being echoed back | the note on the review screen |
| **Meta pill** — `surface2`, radius 999, paddingH 12 paddingV 6, `[glyph 14]` + 12.5/600 | Facts: category, step count, duration, time range | detail hero pills |

**Banned:** runs of `·`-prefixed plain text lines, unstyled `<Text>` paragraphs floating on the background,
labels with no visual anchor, and `marginTop` as the only form of hierarchy.

---

## 6. Colour (R6, R7)

### 6.1 Semantic palettes — one hue per meaning

| Palette | Tokens | Means | Used for |
|---|---|---|---|
| Survival response | `srFight/Bg`, `srFlight/Bg`, `srFreeze/Bg`, `srFawn/Bg` | the user's state | state filter chips, re-check-in cards |
| Nervous system | `nsWindow/Bg`, `nsHyper/Bg`, `nsHypo/Bg` | window of tolerance | "regulated" chip/card, check-in |
| Exercise identity | `exBreath/Bg`, `exGround/Bg`, `exSomatic/Bg`, `exJournal/Bg`, `exSelfkind/Bg`, `exCrisis/Bg` | category / per-sense identity | category tiles, heroes, medallions, step rings |
| Distress (SUDS) | `mood1..mood5` (+ `*Bg`) | 0–10 distress, calm→high | scale track, value chips, review chips |
| Semantic | `success/Tint/Subtle`, `warning`, `error`, `info` | outcome, caution, failure | saved states, errors |
| Brand | `primary`, `accent`, `secondary` (+ `Tint`/`Subtle`) | the app's own actions | primary buttons, active tab, focus |
| Warm accent | `warmGold` | one deliberate human touch | the ★ on favourites |

### 6.2 Rules

1. **Tint = pair.** A tinted surface always uses the pair: background `*Bg`, content (icon + label) `*`.
   Never mix a foreground from one palette with a background from another.
2. **On-colour text = `textInverse`.** It is defined per theme so it reads correctly on both light and dark
   palette colours (white text on dark-mode pastels fails).
3. **`primary` green is for the app's own actions**, not decoration. If a screen is mostly green, the colour
   is being used as a theme instead of a signal (R6) — give each element its own semantic hue.
4. **Colour is never the only differentiator (R7).** Pair every coloured choice with an **icon** and a
   **word**: fight = `flash` + red, flight = `run` + amber. Two similar hues side by side must differ in
   glyph and label too.
5. **Progressions get distinct hues.** A three-option answer (e.g. helpfulness) uses three different colours
   from the table (`srFreeze` → `mood3` → `success`), not one colour three times.
6. **Cite token names, never hex** (in specs, and in code — colours come from `theme/tokens.ts`).
7. **Dark mode is not an afterthought.** Every token has a dark value; check the tinted surfaces in both
   modes (`useAppTheme()` → `colors[mode]`).

---

## 7. Controls never move (R2, R4)

### 7.1 Pinned action bar

- Primary/secondary actions for a stage live in the **pinned bar** (Zone 3), identical in position across
  every stage of a flow. A user should be able to walk a whole flow without their thumb re-learning where
  the button is.
- Ratio: secondary `flex: 1`, primary `flex: 1.3`. Both `variant` choices stay the same height (40dp).
- Style hierarchy in the bar: **filled** = the one way forward · **outlined** = a real alternative ·
  **text** = a quiet escape ("Skip"). Neutral alternatives take `color={c.textMuted}`; accent-coloured
  alternatives take the current context hue.

### 7.2 Fixed-size slots

Any element whose content changes (a value chip, a counter, a selection) must sit in a **fixed-height
container** so nothing below it shifts. Shipped examples: the scale's `chipRow` is `height: 34` whether or
not a value is chosen; the header's side slots are `width: 44` even when empty; the step nav never changes
position when the step text grows.

### 7.3 Selection must not reflow (R4)

When a control's selected state changes size (a growing segment, an expanding dot), contain it:
fixed-height track, absolute-positioned indicators, or `width` changes on a centred element. If the screen
visibly jumps when a user taps, it is a bug.

### 7.4 Disabled and loading

- Disabled filled/text: container `surfaceOffset2`, label `textMuted` — **still readable** (never `textFaint`).
- Disabled outlined: transparent container + `divider` border (always set a border colour; an unset
  `borderColor` renders black in RN).
- Saving/in-flight: disable the primary, keep its label ("Save"), and surface errors as `bodySmall` in
  `error` near the action — never an alert.

---

## 8. Motion

**RN `Animated` only.** `react-native-reanimated` is installed but needs a native rebuild to ship — do not
introduce it (or any new native module) as part of a styling task.

Approved vocabulary (all shipped in the session screen):

| Motion | Values | Purpose |
|---|---|---|
| Breathing ring | scale `1 → 1.045`, 2000ms in / 2000ms out, `Easing.inOut(Easing.ease)`, loop | teaches slow pacing |
| Expanding halo | scale `1 → 1.65`, opacity `0.4 → 0.08 → 0`, 3000ms, `Easing.out(Easing.cubic)`, loop | calm "sonar", design-system `breath-circle` halo |
| Content fade-up | opacity `0 → 1` + translateY `10 → 0`, 350ms, on content change | marks a step transition without a hard cut |
| Spring to value | `Animated.spring` friction 9, tension 70, `useNativeDriver: true` | scale thumb / slider response |
| Chip select | 150ms colour interpolation | confirms a selection |

Rules: `useNativeDriver: true` for transform/opacity · **one focal animation per screen** · never animate
layout properties (height, margin, padding) · restart loops on the value that changes them (`stepIdx`) and
stop them in the effect cleanup · respect a static screen when nothing is happening (no idle motion on
forms).

---

## 9. Icons (R9)

1. **Only `@expo/vector-icons`** (`import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons"`).
   `react-native-vector-icons` needs native font linking that our dev build does not have — its glyphs
   render as empty boxes. Do not add it back.
2. **Type glyph names** as `MciGlyph` (`types/exercise.ts`) so an invalid name fails at compile time.
3. **Verify the glyph exists** before use — the typed union is the source of truth. Some plausible names do
   not exist (`nose`, `tongue`); substitutes shipped: smell → `flower`, taste → `silverware-fork-knife`.
4. **Sizes:** 14 (inside pills) · 16 (reassurance rows) · 18 (chips, list glyphs) · 20 (buttons, close) ·
   22–24 (headers, cards) · 38–44 (medallions/rings). Icon colour = the content colour of its container.
5. **Medallions:** a circular tinted container (`--*-bg` or `surface2`) with the glyph at ~45% of its size —
   30dp (inline), 34dp (list rows), 40dp (summary head), 64–88dp (hero/focal).
6. **No emoji as an icon system** (`00-design-system-usage-rules.md` §2.1). One deliberate accent is allowed
   (the ★ favourite marker).

---

## 10. Headers and navigation (R5, R11, R12)

### 10.1 Tab screens

Use `ScreenHeader` (M3 small app bar: `surface`, `titleLarge` weight 400, `labelMedium` subtitle in
`textMuted`, trailing avatar → `/profile`). Content bottom padding **96** for FAB + tab-bar clearance.

### 10.2 Pushed screens — two approved shapes

| Shape | Use it when | Shipped example |
|---|---|---|
| **Tinted hero** — full-bleed `--*-bg` panel, `paddingTop: insets.top + 8`, `paddingBottom: 28`, bottom corners radius 28, floating 38dp circular back button (`surface2`) at `left: 16, top: insets.top + 8`, then medallion → title → meta pills | The screen is *about one entity* (an exercise, an entry, a chapter) | `app/exercise/[id].tsx` |
| **Quiet header** — inset-aware row: `[side 44] [centre] [side 44]`, no title text | The screen is a *step in a flow* | session shell, category listing (title + count subtitle) |

### 10.3 Never mislabel a screen (R11)

A pushed screen must not carry its parent's name as a title ("Exercises" on an exercise detail screen).
Either the hero shows the entity's own name, or the header shows nothing. If a title is genuinely useful,
it is the entity's name plus a supporting count/subtitle — never the section name.

### 10.4 Exit and back controls (R12)

- **Back** (within a flow) = an outlined button in the pinned bar, labelled `Back` with a leading
  `arrow-left`. It is part of the content, not the chrome.
- **Leave/dismiss** (out of the flow) = an **icon-only** 36dp circle (`surfaceOffset` bg, `close` glyph 20 in
  `textMuted`) at the **top-right**, `hitSlop={10}`, a11y label "Leave session". No word "Cancel" — it reads
  as a threat to progress and it repeats on every stage.
- Both may coexist; they must never look alike or sit in the same corner.
- Destructive/exit actions leave no doubt: leaving a session discards it silently (per `03-session-flow.md`),
  so the control stays quiet but always present.

---

## 11. States

Every screen ships all five, styled per §5/§6:

| State | Treatment |
|---|---|
| **Loading** | Centred, `textMuted` @ 0.85, one short line ("Loading exercises…"). No spinner unless the wait exceeds ~1s. |
| **Empty** | Centred, icon medallion + headline + one supportive line + a single action. Never "No data." |
| **Error** | Centred, `error`-coloured message, `textMuted` explanation, one `Retry` button. Errors never replace the whole screen if partial content is usable. |
| **Partial / signed-out** | Degrade quietly: hide the rows that need auth, keep the rest usable (the done-today row simply stays hidden). |
| **Success** | `success` medallion + headline + one line, then the next gentle question (never a celebratory modal). |

---

## 12. Keyboard (R8)

Any screen with a `TextInput`:

1. Wrap the scaffold in `<KeyboardAvoidingView behavior="padding">`.
2. `keyboardShouldPersistTaps="handled"` on the ScrollView so the first tap on an action works.
3. Keep the input in Zone 2 with ≥ 88dp `minHeight` for multiline notes.
4. Never place a text input inside the pinned bar.

---

## 13. Per-screen checklist

Before calling a screen done:

- [ ] Scaffold is header → content → pinned actions; zones 1 and 3 are outside the ScrollView.
- [ ] `useSafeAreaInsets()` drives the top of the header and the bottom of the action bar.
- [ ] Content centres with auto-margins + `flexGrow: 1` (no `justifyContent: "center"` on a scroll container).
- [ ] No bare text: every copy block is a panel, tinted card, icon-led list, quote, or pill.
- [ ] Headline/subline split deliberately; no orphan word; weight contrast present (800/700/400).
- [ ] Every colour comes from a token, in a `*Bg` + `*` pair; `textInverse` on solid colour.
- [ ] No screen is dominated by one hue; each element's colour means something.
- [ ] Colour + icon + word on every categorical choice.
- [ ] Controls sit in the same place across every stage; choosing a value shifts nothing.
- [ ] Tap targets ≥ 44dp with `hitSlop`; back and exit controls are distinct.
- [ ] Icons are `@expo/vector-icons` with typed, verified glyph names.
- [ ] Loading / empty / error / signed-out / success states all styled.
- [ ] Keyboard-aware if there is an input.
- [ ] Motion: ≤ 1 focal animation, `useNativeDriver`, transform/opacity only, cleaned up.
- [ ] Reused `M3Button` / `M3Chip` / `M3Card` / `M3Scale` / `ScreenHeader` instead of new one-offs
      (`04-component-library.md`); any new component is spec'd there first.
- [ ] Dark mode checked.
- [ ] `npx tsc --noEmit` clean and `npx expo export --platform android` succeeds.
