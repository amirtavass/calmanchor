# Exercises — Session-start UX: component directions (3 options + recommendation)

> **Status:** OPTIONS + RECOMMENDATION — no code changed. Apply once the direction is picked.
> **Routes:** `app/exercise/session/[id].tsx` (all screens) · **Data:** `saveSession()` (`exercise_sessions` +
> distress/helpfulness), `saveCheckin()` · **M:** M2
> **Scope:** PURELY component treatment + feel. The flow **order and data contract are locked** by
> `03-session-flow.md` (distress-before → steps → distress-after + helpfulness → confirm → result → landing
> change) and win per rules §1. Nothing here reorders screens or changes what is saved.
> **Sources:** `design-system/calm-anchor-design-system.{html,css}` v2.0 + `docs/ui/00-design-system-usage-rules.md`
> (standing rules — applied here, not restated) + `03-session-flow.md` + `01-user-stories.md`.
> **Screens covered:** per-step sense screen · distress-before/after scale (SUDS 0–10, S14) · helpfulness
> selector (S15) · result re-check-in (S25). Confirm, note and tags keep their `03-session-flow.md` treatment.

---

## Locked, not up for redesign (rules §1)

- **Flow:** `pre → steps → post → confirm → done`, then the landing shows a quiet "Done today" row.
- **Data contract:** distress before/after `smallint 0–10` nullable (S14) · helpfulness `smallint 0–10` nullable (S15,
  shown as friendly words 0/5/10) · re-check-in → `saveCheckin()` (ns_state / survival_response, S25) · confirm
  summary before commit (S13) · cancel = discard, no confirmation (trauma-informed).
- The doc's ASCII shows `[0]…[10]` buttons on the scale, but its own annotation allows "`.form-slider` **or** pill row
  (`mood1..mood5` tokens)" — so picking a slider/pills component is **Type A**, not a revision.

## The problem this file must solve

The result screen's re-check-in is currently **5 emoji buttons** (😌🧊⚡🏃🤝) — the single largest
emoji-as-interaction in the app, and banned by rules §2.1. The step screen's sense is a lone emoji (👁 in the ASCII);
the distress scale and helpfulness selector are bare and don't yet speak the design-system's colour language. The three
directions below differ in how far they push colour, animation and interaction feel; all of them remove the emoji
interactions.

---

## Direction 1 — "M3-pure, standard components"

*Standard M3 components throughout; colour only as accents; no animation. The safe, spec-correct path.*

```
✕ Cancel  ········ 3 of 5  (•••●)
┌───────────────────────────────────────────────┐
│  Before you begin                              │
│  How distressed do you feel right now?         │
│                                                │
│  calm ◉─────────────○────── very high          │  ← M3 Slider (0–10, step 1)
│          [ 6 ]                                │    value chip under thumb
│  · just for you · you can skip                 │
│  [ Skip ]                      [ Continue → ] │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ ✕ Cancel       3 of 5       •••●              │
│                                                │
│              ( ◉ )                            │  96dp tonal circle (surfaceOffset2),
│        "Find 3 things                         │  static MCI sense glyph
│         you can hear"                         │
│  · quiet hum · traffic · birds                │
│  · as long as you need · nothing is wrong     │
│  [ ‹ Previous ]               [ Next → ]      │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│  That's it — well done for showing up.        │
│  How distressed do you feel now?              │
│  [ same M3 slider as Pre ]                    │
│  Did this exercise help?                      │
│  [ Not really │ A little │ Yes, it helped ]   │  ← M3 SegmentedButtons (0/5/10)
│  (optional fine slider 0–10)                  │
│  [ Skip ]                     [ Review & save ]│
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│                     ✓ Saved                   │
│  This exercise is in your history.            │
│  How do you feel now?                         │
│  (•) Regulated   ( ) Freeze    ( ) Fight      │  ← M3 RadioButton rows
│      leaf          snowflake     flash        │    icon in --sr-* / nsWindow
│  ( ) Flight      ( ) Fawn                     │
│      run           handshake                  │
│  [ Skip ]                     [ Done ]        │
│  [ View history → ]                           │
└───────────────────────────────────────────────┘
```

**Component decisions** (rules §5):

| Element | design-system does | This direction uses | Why | Emoji → replacement |
|---|---|---|---|---|
| Distress scale | Section 20 slider + Section 6/10/11 mood pill-row (old mood framing) | **M3 Slider** (0–10, step 1) + live value chip + "calm"/"very high" endpoints | S14 SUDS 0–10; doc annotation permits `.form-slider`; a precise slider beats 11 pills | N/A (no emoji) |
| Step sense | Section 10 Breathing demo = static emoji + text; step ASCII shows 👁 | **MCI sense glyph** (static) in a 96dp `surfaceOffset2` tonal circle | S09 steps in order; rules §2.1 replaces the emoji; the glyph reinforces the 5-4-3-2-1 senses | `👁` → MCI `eye` (see) / `ear-hearing` (hear) / `hand-back-right` (touch) / `nose` (smell) / `tongue` (taste); fallback = category glyph |
| Helpfulness | Section 19 `.btn-group` segmented buttons | **M3 SegmentedButtons** (Not really / A little / Yes, it helped → 0/5/10) + optional M3 Slider detail | S15 0–10; D04 word labels; one-of-three → segmented control | N/A |
| Re-check-in | Section 21 composite uses `.form-radio` list; app today uses 5 emoji buttons | **M3 RadioButton** list — MCI icon in `--sr-*`/`nsWindow` + label; **Skip** text | S25 state language; rules §2.1 removes emoji-as-buttons; calmest single-choice pattern | `😌🧊⚡🏃🤝` → MCI `leaf` / `snowflake` / `flash` / `run` / `handshake` in `--sr-*`/`nsWindow` |

**Reasoning:** pure M3 — no borrow that touches look beyond what M3 already provides, no animation, no dependency.
The emoji removal is done via the standing rule, not via colour. This is the reference behaviour everything else
is measured against.

**Strengths**
- Zero new dependencies, zero animation risk, zero locked-decision revisions (all Type A).
- Most accessible baseline (radio list + segmented control are the most screen-reader/predictable M3 patterns).
- Radio list mirrors the design-system's own Section 21 ns-state list — a genuine borrow, done M3-correctly.

**Weaknesses**
- Least "designed" — the screens still feel like forms, not moments.
- Colour carries none of the meaning the design-system intends (Sections 4/5/6).
- The radio list for re-check-in is the least distinctive of the three; states don't read at a glance.

**UX principles:** spec purity · predictability for a dysregulated user · minimal cognitive load.

---

## Direction 2 — "Colour-forward, consistent with the landing"

*The same colour language as the landing's recommended D2: `--sr-*` for states, `--ex-*` for the exercise, `--mood-*`
for distress. One gentle animation on the step screen.*

```
✕ Cancel  ········ 3 of 5  (•••●)
┌───────────────────────────────────────────────┐
│  Before you begin                              │
│  How distressed do you feel right now?         │
│                                                │
│  calm ●─────────○─────────────── very high    │  ← M3 Slider, track =
│          [ 4 ]                                │    --mood-1→--mood-3→--mood-5
│                                                │    value chip = current band
│  [ Skip ]                      [ Continue → ] │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ ✕ Cancel       3 of 5       •••●              │
│                                                │
│            ( ◉ )  · pulsing 4s                │  96dp ring filled --ex-*,
│        "Find 3 things                         │  pulse: scale 1.0→1.06,
│         you can hear"                         │  opacity 1→0.55, loop
│  · quiet hum · traffic · birds                │  (trigger: step mount)
│  [ ‹ Previous ]               [ Next → ]      │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│  Did this exercise help?                      │
│  [ Not really ] [ A little ] [ Yes, it helped ]│  ← M3Button group (hand-built),
│  (optional fine slider 0–10)                  │    outlined → filled on select
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│                     ✓ Saved                   │
│  How do you feel now?                         │
│  ┌───────────────┐ ┌───────────────┐          │
│  │ ▓ leaf        │ │ ▓ snowflake   │          │  ← 2-col grid of M3 tinted cards
│  │ Regulated     │ │ Freeze        │          │    fill --sr-*-bg, icon+label --sr-*
│  └───────────────┘ └───────────────┘          │    Regulated = nsWindowBg/nsWindow
│  ┌───────────────┐ ┌───────────────┐          │    selected = --sr-* border
│  │ ▓ flash       │ │ ▓ run         │          │
│  │ Fight         │ │ Flight        │          │
│  └───────────────┘ └───────────────┘          │
│  ┌───────────────┐ ┌───────────────┐          │
│  │ ▓ handshake   │ │  (skip)       │          │
│  │ Fawn          │ │               │          │
│  └───────────────┘ └───────────────┘          │
│                               [ Done ]        │
│                    [ View history → ]         │
└───────────────────────────────────────────────┘
```

**Component decisions** (rules §5):

| Element | design-system does | This direction uses | Why | Emoji → replacement |
|---|---|---|---|---|
| Distress scale | Section 6/20 mood scale (5 coloured bands) | **M3 Slider** with `--mood-1→--mood-3→--mood-5` gradient track; value chip coloured to current band | S14 SUDS 0–10 + Section 6 colour mapped onto the track — colour *is* distress feedback | N/A (no emoji) |
| Step sense | Section 10 Breathing demo = static emoji; step ASCII 👁 | **MCI sense glyph** in a 96dp ring filled with the exercise's `--ex-*` colour + **4s pulse** — ring scale 1.0→1.06, opacity 1→0.55, 2s in / 2s out, loop on step mount (Reanimated) | S09; rules §2.1; the motion teaches the pacing the step asks for (slow, even) | `👁` → MCI glyph (as D1) inside a breathing ring that pulses — animation, not a static icon |
| Helpfulness | Section 19 `.btn-group` (Day/Week/Month) | **M3Button group** (hand-built, outlined→filled on select, M3 anatomy) + optional M3 Slider | S15/D04; borrows the button-group *intent* per M3 (rules §2.2) | N/A |
| Re-check-in | Section 4 `sr-card` = tinted bg + coloured border + emoji title | **2-col grid of M3 tinted cards** — fill `--sr-*-bg`, icon + label `--sr-*`; Regulated = `nsWindowBg`/`nsWindow`; selected = `--sr-*` border; **Skip** text | S25; rules §2.1 + §2.2 — the emoji-button row becomes colour-forward cards with real states | `😌🧊⚡🏃🤝` → MCI glyphs (as D1) on `--sr-*-bg` cards; the card replaces the emoji button |

**Reasoning:** this is the design-system's colour language (Sections 4, 5, 6) applied to the whole session, and it
is exactly the palette Direction 2 of `04-landing-directions.md` recommends — so the user meets the same colours
browsing and doing. `--sr-*` states, `--ex-*` exercise identity, `--mood-*` distress: one coherent system, one
purposeful animation.

**Strengths**
- Consistency with the landing (04 D2) — a single colour language across the Exercises journey.
- Solves the re-check-in emoji problem decisively: colour-forward cards, no flat-border pattern, real states.
- The step pulse gives a gentle, trauma-safe motion that teaches pacing instead of decorating.

**Weaknesses**
- The pulse needs `react-native-reanimated` (new dependency + babel plugin + **native EAS rebuild**) — an
  implementation consequence, not a decision revision.
- More colour on screen than M3 default; card-grid states need AA contrast verified in dark mode.
- Segmented control replaced by a hand-built group — slightly more code than D1.

**UX principles:** colour association over time · context-first (state colour) · consistency across a journey.

---

## Direction 3 — "Calm moments, touch-first"

*The screens become emotional moments, not forms: big tap targets, near-full-screen step, minimal chrome, more
animation. Highest ambition, highest risk.*

```
✕ Cancel  ········ 3 of 5  (•••●)
┌───────────────────────────────────────────────┐
│  How distressed do you feel right now?         │
│  calm                                         │
│    ○ ○ ○ ● ○ ○ ○ ○ ○ ○ ○                    │  ← 11 tap dots (--mood-1..5
│          [ 4 ]                               │    gradient), selected dot
│  very high                                   │    expands
│  [ Skip ]                      [ Continue → ] │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│ ✕ Cancel       3 of 5       •••●              │
│                                                │
│               ( ◉ )                           │  large --ex-*-bg halo,
│        "Find 3 things                         │  6s slow pulse
│         you can hear"                         │
│  [ more guidance ▾ ]                          │  hints collapsed, optional
│                                                │
│                    [ Next → ]                 │  floating action row
│  [ ‹ Previous ]                               │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│  Did this exercise help?                      │
│  [ Not really       ]                         │  ← full-width M3 tonal pills
│  [ A little         ]                         │    outlined → filled on select
│  [ Yes, it helped   ]                         │
│  (optional fine slider 0–10)                  │
└───────────────────────────────────────────────┘

┌───────────────────────────────────────────────┐
│                     ✓ Saved                   │
│  How do you feel now?                         │
│  ← [▓leaf] [▓snowflake] [▓flash] [▓run] [▓handshake] →
│       Reg.       Freeze      Fight   Flight  Fawn
│                                                │  horizontal-scroll large cards,
│  [ Skip ]                     [ Done ]        │  selected card lifts
│  [ View history → ]                           │
└───────────────────────────────────────────────┘
```

**Component decisions** (rules §5):

| Element | design-system does | This direction uses | Why | Emoji → replacement |
|---|---|---|---|---|
| Distress scale | Section 6/10/11 mood pill-row | **11-dot tap row** — soft `--mood-1..5` gradient dots, selected dot expands, value chip | S14; a dysregulated user finds slider *drags* hard — tap-dots have larger, gentler targets | N/A (no emoji) |
| Step sense | Section 10 Breathing demo = static emoji | **MCI sense glyph** large in an `--ex-*-bg` halo + **6s slow pulse** (scale 1.0→1.05, opacity 1→0.6, loop, Reanimated); hints collapsed behind "more guidance ▾" | S09; S10 no pressure — the step is a moment to rest in, not a form to read | `👁` → MCI glyph (as D1) + slow halo pulse replacing the static emoji |
| Helpfulness | Section 10 `.btn` variants | **Full-width M3 tonal pills** (outlined→filled on select) + optional M3 Slider | S15/D04; biggest targets, least precision required | N/A |
| Re-check-in | Section 4 `sr-card` | **Horizontal-scroll row of large M3 cards** (fill `--sr-*-bg`, icon + label `--sr-*`; Regulated `nsWindow`), selected card lifts; **Skip** text | S25; one prominent choice, no grid scan | `😌🧊⚡🏃🤝` → MCI glyphs (as D1) on large cards |

**Reasoning:** leads with feel. Each screen is reduced to the single thing the user is doing, the scale and the state
picker become touch-first, and the step screen becomes a place to pause. This is the design-system's "trauma-informed"
intent taken furthest.

**Strengths**
- Calmest, most emotionally considered; least "app-like form", most "I'm here now".
- Largest touch targets of the three — good for tremor/shaky hands in high distress.
- Distinctive; clearly different from the current implementation.

**Weaknesses**
- 🔒 Not a revision of a locked decision — but the most custom code: two animations, custom dot row, custom cards.
  Needs Reanimated (native rebuild) like D2.
- Tap-dot precision on 11 targets is non-standard; horizontal scroll can hide options off-screen for a
  stressed user.
- Highest implementation + QA cost; most to get wrong.

**UX principles:** meet-the-user-where-they-are · reduce precision demands · the screen is a moment, not a form.

---

## States

### Null / no-data
- **First session ever:** no "Done today" row on the landing; the result screen's re-check-in is optional and can be
  skipped.
- **Resume:** if a session was cancelled mid-flow, the detail page offers "Resume last time" (edge case below); the
  session screen itself always opens at Pre.
- **Skipped ratings (S14/S15 nullable):** Pre and Post both render **Skip**; Post's "Review & save" is reachable even
  when every rating is skipped (03-session-flow §7: "Skipping all ratings: allowed — session still saved"). The Confirm
  summary shows `—` for any skipped value.

### Error
- **Save failed (offline) on Confirm:** the summary stays (nothing lost); below the actions a line —
  `Couldn't save this session. It's safe to retry. [Retry]` in `error` colour. Retry re-invokes `saveSession()`.
- **Step load failed mid-session:** content is bundled so this is unlikely; if it happens, show the current step with
  a `[Pause]`/`[Resume]` toggle (03-session-flow §7).

### Edge cases
- **Cancel mid-session:** no confirmation dialog (trauma-informed); exit and discard; no partial save; detail offers
  "Resume last time".
- **Doing it 5× today:** allowed (S18); each logged independently; the landing "Done today" lists the most recent only.
- **No duration:** Confirm shows `~5 mins` computed from started/ended, or `—` if ended == started.
- **Sense fallback (step screen):** if a step has no sense keyword, show the exercise-category glyph
  (CATEGORY_TOKENS `--ex-*`) — never a blank icon.
- **Tags on Post:** system tags plus the user's own only (S16); "grounding"/"anxious" are system, new ones become
  private. Component treatment unchanged from 03-session-flow (M3Chip row + "new tag" input).

## Shared / out of scope (not redesign targets)
Confirm screen (M3 Card summary list + M3Button Save/Adjust), note (M3 outlined TextInput), tags (M3Chip row), and
the landing "Done today" change keep the component treatment `03-session-flow.md` already specifies.

---

## Recommendation

**Pick Direction 2 — "Colour-forward".** It makes the whole session speak the same colour language the landing's
recommended D2 uses — `--sr-*` states, `--ex-*` exercise identity, `--mood-*` distress — so the user meets one
coherent system from browsing to finishing. It decisively solves the emoji-as-buttons problem (the file's main job)
with colour-forward icon cards that have real M3 states, and it carries a single, gentle, purposeful animation (the
4s breathing ring) instead of a wall of motion.

**No locked /docs decision is revised** — the flow, the data contract, and every S-numbered rule stand; every borrow
here is Type A. One implementation consequence to note, not a decision: the pulse needs
`react-native-reanimated` (new dependency + babel plugin + native EAS rebuild).

If you want the session flow to stay animation-free and dependency-free, **Direction 1** is the fallback — standard
M3 everywhere, same colourless calm as today but with emoji removed properly. Direction 3 is not recommended: it is
the most emotionally ambitious but the highest-risk, with custom controls that can misfire exactly when a user is
most stressed.