# Home / Dashboard — section design

> **Route:** `app/(tabs)/index.tsx` · **M:** M2 (Home) / M3 (dashboard data) · **Source:** design-system §21
> Composite 1 (approved by mentor) + `docs/ui/03-screen-craft.md`.
> **Journey verticals:** Check-in · Do (quick relief) · Reflect (nudge) · Review (M3).
> **Header:** uses `components/ScreenHeader.tsx` — the top-right carries `ThemeToggle` only
> (avatar removed; profile access is reached through the dashboard greeting card's chevron).

## 1. The design (design-system §21 Composite 1 + §11 weekly chart + greeting card)

```
┌───────────────────────────────────────────────────────┐
│  Zone 1 · ScreenHeader — Calm Anchor        [☾Light]  │
├───────────────────────────────────────────────────────┤
│  Zone 2 · content (ScrollView, pb 96)                 │
│  ┌─────────────────────────────────┐                  │
│  │ ☀  SUNDAY, 13 SEPTEMBER         │  greeting card  │
│  │    Good morning, Amir        ›  │  warmGold (light)│
│  │    Notice what your morning     │  warmGoldTint    │
│  │    body is carrying today.      │  (dark)          │
│  └─────────────────────────────────┘                  │
│  ┌──────────┬──────────┬──────────┐                   │
│  │ Sessions │ Streak   │ In window│   stat cards      │
│  │  12/real │   5d     │   67%    │   (dummy until M3)│
│  └──────────┴──────────┴──────────┘                   │
│  ┌─────────────────────────────────┐                  │
│  │ Today's plan                    │  stepper:        │
│  │  (✓) Check-in ─ (2) Exercise ─ (3) Journal        │
│  └─────────────────────────────────┘                  │
│  Quick relief                                         │
│  ┌───────┐ ┌───────┐ ┌───────┐ ┌───────┐             │
│  │Breathe│ │Ground │ │Journal│ │Crisis │  ex-* tiles  │
│  └───────┘ └───────┘ └───────┘ └───────┘             │
│  This week in your window                             │
│  ┌─────────────────────────────────┐                  │
│  │ Where you spent the week   [📊67%]│                │
│  │ ▌ ▎ ▌ ▎ ▌ ▌ ╴▎  (window/hyper/  │  §11 weekly    │
│  │ M  T  W  T  F  S  Today         │  bars + legend  │
│  └─────────────────────────────────┘                  │
│  Recent (signed-in only)                              │
│  ┌─────────────────────────────────┐                  │
│  │ ✓  Morning breathing · 2h       │                  │
│  │ ✎  Journal · Reflection · 6h    │                  │
│  └─────────────────────────────────┘                  │
│  [ Start today's session  →  ]  (full-width CTA)      │
│  ┌─────────────────────────────────┐                  │
│  │ ♥  Be gentle with yourself →    │  warm reminder  │
│  │    A short reflection is enough │  (exSelfkind)    │
│  └─────────────────────────────────┘                  │
└───────────────────────────────────────────────────────┘
```

## 2. Decisions

| Item | Decision | Why |
|---|---|---|
| Name | Greeting says **"Amir"** (mentor: Alex → Amir) | Explicit mentor direction. Profile `display_name` can replace later. |
| Date | Computed at render: `en-GB` weekday + day + month | Never hard-coded; updates daily. |
| Window pill | Non-interactive pill: `warmGoldTint` bg + `warmGold` text + `star-four-points` | Design-system chip--selected gold; it is a *state indicator*, not a control — no M3Chip (needs onPress). |
| Stats | Sessions = real count when signed in, falls back to `12`; Streak = `5d` (warning); In window = `67%` (success) | Engagement vs S26: descriptive only, no mood trend. Dummy values until M3 wires the real aggregator — numbers stay illustrative, never evaluative. |
| Greeting card (top) | `warmGold` (light mode) / `warmGoldTint` (dark mode) bg + 48 dp inverse medallion with time-of-day glyph (`weather-sunset-up` / `white-balance-sunny` / `weather-night`) + uppercase date kicker (warmGoldTint / warmGold) + 22/800 headline ("Good morning|afternoon|evening, Amir") + one supportive sentence that swaps on time of day + `chevron-right` → `/profile` | Anchors the top of the day; replaces the removed header subtitle. Profile access moved here from the top-right avatar. The reflection sentence is descriptive only — no evaluation, no mood trend (S26). The medallion and accent flip per mode so the card is always readable on its background. |
| Today's plan | Stepper: Check-in (✓ done) → Exercise (active) → Journal (pending); each step navigates | Mirrors §21; gives 3 one-tap destinations. |
| Quick actions | Colour-fields tiles in `--ex-*` pairs, MCI glyphs (`weather-windy`, `leaf`, `notebook-edit-outline`, `lifebuoy`) | Reuse the landing tile pattern (§04); colour + icon + word (craft R7). |
| Recent | Real recent session + entry when signed in; hidden when not | Partial/signed-out degrade (craft §11). |
| CTA | Full-width `M3Button` → Exercises | The one forward action. |
| Warm reminder | `exSelfkindBg`/`exSelfkind` Pressable below CTA → `/diary/new`; `hand-heart-outline` 40 dp medallion | Fills the empty space below CTA with a colour-contrast nudge (fifth hue family — pink/rose — so the screen no longer bottoms out blank). |
| This week chart | 7 bars (Mon–Sat + Today), `--ns-window`/`--ns-hyper`/`--ns-hypo` fills, **Today is dashed-border only** (no fill — pre-data); running tally + percent badge + 3-dot legend | Direct lift from design-system §11 App Screen Sketch. Percent + tally derived locally (`daysInWindow / 6`) until M3 wires the real aggregator. |
| Icons | All MaterialCommunityIcons, typed | Craft §9 / rules §2.1 — no emoji. |

## 3. Craft cross-check (03-screen-craft §13)

- Three-zone structure; header + ScrollView; no pinned bar (tab screen, CTA inline).
- `useSafeAreaInsets()` on the header (`insets.top + 8`); content `paddingBottom: 96`.
- Stat cards and tiles use token pairs; `textInverse` on solid palette colour.
- Loading/empty/signed-out/error states handled for the data-bearing parts.
- tsc clean · expo export clean.