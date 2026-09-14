# Progress — Changelog

Append-only record of changes (decisions + progress). Newest first. Never edit or delete a past entry.

## 2026-09-17 — Dashboard greeting moved to top + per-mode warm-gold bg

### Dashboard (`app/(tabs)/index.tsx`)
- **Greeting card moved to the top of the body** (was anchored at the bottom). New order:
  greeting card → stats row → today's plan → quick relief → weekly window chart → recent
  activity → CTA → warm reminder. Spacing tightened to `marginTop: 4 / marginBottom: 16` so the
  card sits flush under the ScreenHeader without an awkward gap.
- **Light-mode greeting bg swapped** from `warmGoldTint` (#4A3A28 — dark warm brown) to
  `warmGold` (#D4B882 — light gold). The dark tint made the `text` headline unreadable on the cream
  canvas. Dark mode keeps `warmGoldTint`. Medallion bg + accent (kicker, chevron, glyph) flip
  inversely so the card is always readable on its background in both modes:
  - **Light mode**: bg `warmGold` (light gold) · medallion `warmGoldTint` (dark) · glyph
    `warmGold` (light) · kicker `warmGoldTint` · reflection `secondary` · chevron `warmGoldTint`.
  - **Dark mode**: bg `warmGoldTint` (dark) · medallion `warmGold` (light) · glyph `textInverse`
    · kicker `warmGold` · reflection `textMuted` · chevron `warmGold`.
- `docs/ui/sections/home/00-dashboard.md` ASCII + decision row updated to match.

### Verification
- `npx tsc --noEmit` EXIT 0 · `npx expo export --platform android` bundles (4.2 MB hbc).

## 2026-09-16 — Avatar removed, greeting card anchored bottom, design-system loaders, light-mode contrast, helpfulness interactivity

### Header & greeting
- **`components/ScreenHeader.tsx`** — avatar removed; the top-right now carries the `ThemeToggle` only
  and gets the full width. Profile access moved into the dashboard greeting card's chevron, so the
  top-right action cluster is one button on every screen.
- **`app/(tabs)/index.tsx` (dashboard)** — `ScreenHeader` no longer carries the date/greeting
  subtitle. A new featured **greeting card** anchors the bottom of the screen: warm-gold tint
  (`warmGoldTint`) background, `warmGold` accent, time-of-day icon
  (`weather-sunset-up` / `white-balance-sunny` / `weather-night`), uppercase date kicker, "Good
  morning|afternoon|evening, Amir" headline, and a single supportive reflection sentence that
  changes with the time of day. Press → `/profile`. Fills the empty bottom space the warm
  reminder couldn't.

### Theme
- **`theme/ThemeContext.tsx`** — `system` preference removed (mentor: "auto is too many"). Two
  modes only (`light` / `dark`), persisted to AsyncStorage; `toggle()` cycles light ↔ dark.
  Default still falls back to the system scheme on first launch so we don't flash from light to
  dark.
- **`components/ThemeToggle.tsx`** — dropped "Auto" label. Now reads "Light" / "Dark" only, with
  the matching sun/moon glyph.
- **Light-mode contrast tweak (`theme/tokens.ts`)** — `textMuted` `#5A5645` → `#4A4536`,
  `textFaint` `#9C9583` → `#6E6857`. Body-text contrast against `--color-bg` is now solidly
  WCAG-AA across the screen (was borderline on `textFaint` — 3.2 : 1). The cream canvas
  `--color-bg: #F4F1EB` is unchanged (design-system §2 anchor).

### Design-system §17 loaders (skeleton + spinner) — borrowed
- **`components/M3Skeleton.tsx`** — direct lift of the design-system §17 "Skeleton Loader".
  Interpolation between `--color-surface-offset` and `--color-surface-dynamic` running on the
  design-system `shimmer` keyframes (1.5 s loop). Variants: `text` (14 dp), `text-multi`
  (decreasing-width stack), `card` (120 dp), `avatar` (40 dp, radius 999), `block` (custom).
- **`components/M3Skeleton.tsx > SkeletonTextStack`** — convenience for the 100% / 80% / 60%
  text stack pattern.
- **`components/M3Spinner.tsx`** — design-system §19 "Button with Loading" 16 dp circular border
  spinner, 1 s linear spin, accepts `tint` override.
- **`components/ExerciseLoadingScreen.tsx`** — full-screen skeleton that mirrors the live
  `app/exercise/[id].tsx` layout (category chip → headline → meta row → description panel →
  steps list → CTA). Used by `app/exercise/[id].tsx` and `app/exercise/session/[id].tsx` so the
  transition into the live screen is invisible.
- **`app/exercise/category/[key].tsx`** — replaced the inline "Loading…" text with four skeleton
  list rows matching the real category row layout.
- **`app/(tabs)/diary.tsx`** — replaced the inline "Loading your journal…" text with two prompt
  skeleton cards + three entry skeleton rows.

### Diary compose
- **Placeholder colour** changed from `textFaint` (no-prompt) and `exJournal` (with prompt) to
  `textMuted` (no-prompt) and `secondary` (with prompt). Both now match the warm-cream screen —
  the previous `exJournal` purple read as off-tone against the surface card.

### Session post-stage visibility
- **Helpfulness tiles** now have an **always-on 1 dp `text` border** so they read as interactive
  even when unselected. Selected state bumps to a 2 dp ring + outset shadow. Added a 0.85
  opacity press feedback so taps are felt. Filled with the strong tone (srFreeze / mood3 /
  success) + `textInverse` glyph + label.
- **Review & save / Save / Done** (post, confirm, done nav buttons) moved from `secondary`
  (#686040) to **`secondaryActive` (#4A4230)**. The lighter secondary was failing contrast
  against the cream bg for the small text-on-fill case; the darker active tone is unambiguously
  readable.

### Verification
- `npx tsc --noEmit` EXIT 0 · `npx expo export --platform android` bundles (4.2MB hbc). Reload
  via `npx expo start --dev-client`.

## 2026-09-15 — Dark mode toggle + green tone-down + diary/new rewrite + session nav visibility

### Dark mode (M2 polish, mentor direction)
- **`theme/ThemeContext.tsx` extended** to three modes (`light` / `dark` / `system`) persisted to
  AsyncStorage under `calmanchor.themeMode`. The resolved `mode` (still `"light" | "dark"`) keeps
  the existing `const c = colors[mode]` pattern working — every screen compiles unchanged. A new
  `togglePreference()` cycles light → dark → system → light so a single button is enough.
- **`components/ThemeToggle.tsx`** — small sun/moon Pressable, `surface2` background, `secondary`
  (warm olive) glyph. Always paired with the avatar so the top-right reads as a consistent action
  cluster on every screen. Glyph swaps between `weather-night` (current = light) and `weather-sunny`
  (current = dark); a small "Theme · Auto|Light|Dark" kicker surfaces the current resolved mode.
- **`components/ScreenHeader.tsx`** — right-side is now `[ThemeToggle] [Avatar]`. The dashboard no
  longer has its own bespoke header; it uses the same ScreenHeader so the top-right of every screen
  is identical (fixes the inconsistency the mentor called out).
- **Green tone-down** (design-system §7 secondary over primary): the loud `primary` green
  (`#1C4A32`) is now reserved for the active-tab indicator and CTAs that *must* feel urgent.
  Everywhere else — stat values, step circles, exercise Start/Do-again, diary Write/Save, session
  Review & save / Save / Done, the "Browse all categories" link — has moved to **`secondary` (warm
  olive `#686040`)** for a calmer feel. `accent` (sage `#4A7C59`) is used where we still want green
  (Sessions stat, Check-in done step, recent-session icon) but at a softer saturation. The design
  system's default page bg (`#F4F1EB` light / `#1E2E16` dark) is unchanged — the issue was the green
  *accents*, not the cream canvas.

### Diary compose (`app/diary/new.tsx`) — full rewrite
- **Prompts are now the TextInput's `placeholder`**, so the prompt is *inside* the writing surface
  rather than a separate panel pinned above it. The selected prompt is also surfaced as a small
  "PROMPT" kicker chip + close button above the field so it's obvious where the placeholder came
  from. The close button clears the prompt and reverts the placeholder to "Write here…".
- **Collapsible prompt picker** below the field: "Try a prompt" / "Change prompt" / "Hide prompts"
  toggle. The picker collapses as soon as the user has any text in the field, giving the keyboard
  the full real-estate.
- **Back button** added to the header (top-left, 36 dp circular Pressable on `surfaceOffset`,
  `arrow-left` glyph). Leave (text, top-right) is kept as the explicit discard.
- `KeyboardAvoidingView behaviour="height"` on Android (already in last session) + ScrollView
  `automaticallyAdjustKeyboardInsets` for iOS. Save button uses `secondary` (warm olive).

### Exercise session post stage (`app/exercise/session/[id].tsx`)
- **Helpfulness tiles are now filled with the strong tone** (`srFreeze`/`mood3`/`success`) and carry
  `textInverse` glyph + label, instead of the previous pastel `*-bg` fill that disappeared into the
  `surface` panel. Selected state adds a 2 dp fg-colour ring plus an outset shadow so it pops.
- **Skip nav button**: was `variant="text"` + muted colour (effectively invisible) → now
  `variant="outlined"` + muted colour so it reads as a real button.
- **Review & save / Save / Done nav buttons**: moved from default `primary` (loud green) →
  `secondary` (warm olive) for consistency with the rest of the app.
- Fixed a stray `}` left over from the original file that closed the switch before `case "confirm"`,
  making the file not type-check until cleaned up.

### Verification
- `npx tsc --noEmit` EXIT 0 · `npx expo export --platform android` bundles (4.2MB hbc).
- Dev-client reload via `npx expo start --dev-client`.

## 2026-09-14 — Dashboard + Diary polish + session helpfulness visibility (mentor feedback)

### Dashboard (`app/(tabs)/index.tsx`)
- **"This week in your window" chart** (design-system §11 — App Screen Sketch): 7-bar weekly view with
  per-day state colours (`--ns-window`, `--ns-hyper`, `--ns-hypo`), legend, and a dashed-border Today
  column (pre-data). Header shows the running tally (`4 of 6 days in window`) + a window-green pill with
  the percentage.
- **Engagement stat values**: Sessions shows real count when signed in, falls back to a dummy `12`;
  **Streak** now `5d` (warning) and **Window** now `% in window` (success) — both dummy placeholders
  until M3, replacing the previous `—` so the row reads alive.
- **Warm reminder card** (`exSelfkindBg`/`exSelfkind`, `hand-heart-outline`) below the CTA to fill the
  empty space below "Start today's session" with a colour-contrast nudge → `/diary/new`. The palette
  pulls in a fifth hue family so the bottom of the screen no longer reads as blank.
- All new icons verified against MCI glyphmap. `nsWindow/nsHyper/nsHypo` are pulled from the existing
  tokens (already in both light + dark schemes).

### Diary landing (`app/(tabs)/diary.tsx`)
- **Distinct icon per prompt** (`notebook-heart-outline`, `meditation`, `flower-tulip-outline`,
  `book-open-page-variant-outline`, `thought-bubble-outline`, `candle` — cycles if more) so the row no
  longer reads as the same card repeated three times.
- **Bolder, kicker-led prompt text**: added an `uppercase · 11/800 · 0.7 tracking` "Prompt" label, body
  bumped to `15/22/600`, plus a chevron-right in `--ex-journal` to read as a tappable list item.
- **Removed duplicate "Write a new entry" buttons** in the signed-out gentle card and empty state —
  the top filled M3Button is the only CTA now. Gentle card + empty state now keep their icon, title
  and supportive line so the screen still explains itself.
- Tinted icon medallion bumped 34→40 dp to match the dashboard quick-action tiles for consistency.

### Diary compose (`app/diary/new.tsx`)
- **Whole prompt chip is now Pressable** (previously only the `+`/`✕` glyph was tappable) with full
  `accessibilityRole="button"` + selected state. Glyph swapped from `+`/`✕` text to MCI `plus`/`close`.
- **Keyboard**: KAV behaviour changed from `undefined` (Android no-op) → `"height"` on Android so
  pinned Save and the input are not occluded by the soft keyboard; ScrollView gets
  `automaticallyAdjustKeyboardInsets` for iOS inset adjustment. Mirrors the pattern from the exercise
  session screen.
- **"Prompts are optional" notice**: replaced the small muted subline with a tinted `exJournalBg`
  info-badge (`information-outline` + 12.5/18/700 sentence) sitting above the prompt panel —
  impossible to miss now.

### Exercise session (`app/exercise/session/[id].tsx`)
- **Helpfulness tiles** (the "Did this exercise help?" row, S15 + D04 friendly words) rebuilt as
  **colour-field Pressable tiles** — `bg` background + matching `fg` icon and label, two-px border
  in `fg` when selected. The previous outlined M3Button variant disappeared against the
  `surface` panel; the new tiles read at a glance in all three colour families (`srFreeze/srFreezeBg`,
  `mood3/mood3Bg`, `success/successTint`). All three colours already had light + dark tokens.
- `HELP_OPTIONS` now carries `bg` alongside `fg` so the tile can fill with the paired surface.

### Verification
- `npx tsc --noEmit` EXIT 0 · `npx expo export --platform android` bundles (4.2MB hbc). Dev-client
  reload via `npx expo start --dev-client`.

## 2026-09-13 — Home/dashboard + Diary (journal) screens (M2 build-out)

### Scope (from the meetings + IA doc)
- Mentor expects **Dashboard** and **Journal** screens; both already fit the 5-tab shell (Home · Toolkit ·
  Exercises · Diary · Portfolio) in `docs/ui/01-navigation-and-ia.md` — no new tabs.
  - **Dashboard → Home tab** (`(tabs)/index.tsx`), modelled on design-system §21 "Composite Screens"
    (greeting + date header, stat cards, today's plan, quick actions, recent, CTA). Greeting name "Amir".
  - **Journal → Diary tab** (`(tabs)/diary.tsx`), grounded in user stories (S19–S24) + design-system
    journal components (§17 empty state, §18 list/chip idiom).

### Dashboard (`app/(tabs)/index.tsx`) — design-system §21 Composite 1
- Greeting header: computed date ("Sunday, 13 September") + time-of-day greeting + "Amir" (Alex→Amir) +
  warm-gold "Window" pill (token-paired `warmGoldTint`/`warmGold` + `star-four-points` glyph) + avatar → `/profile`.
- Stat cards (Sessions / Streak / Window): **Sessions wired to real data** when signed in; Streak/Window
  read "—" until M3 (S26 keeps them descriptive-only, no mood trend).
- "Today's plan" stepper: Check-in (✓, done) → Exercise (active) → Journal (pending), each step navigates.
- Quick actions: **colour-fields tiles** (Breathe/Ground/Journal/Crisis) in `--ex-*` pairs with MCI glyphs
  (`weather-windy`, `leaf`, `notebook-edit-outline`, `lifebuoy`), routes to real screens.
- Recent activity: real recent session + journal entry when signed in; hidden otherwise (partial/signed-out).
- CTA: full-width `M3Button` "Start today's session" → Exercises.
- Icons are MaterialCommunityIcons (rules §2.1) — no emoji icon system.

### Journal (`app/(tabs)/diary.tsx` + `diary/new.tsx` + `diary/[id].tsx`) — S19–S24
- **Landing**: ScreenHeader + "Write a new entry" primary; **Reflection prompts** (S23, from `prompts`)
  as tinted `exJournalBg` cards with `lightbulb-on-outline` medallions; **Your entries** timeline
  (newest first) with the design-system empty state (§17: "No journal entries yet" + supportive line +
  write action); signed-out gentle card (private-to-you + write, sign-in on save — S01).
- **Compose** (`new.tsx`): quiet header, KeyboardAvoidingView, prompt preselect via `?prompt=`, optional
  prompt chips, free-text `TextInput`, pinned **Save entry** → `saveJournalEntry()` (returns the new row).
- **Detail** (`[id].tsx`): back + entry medallion, prompt ref, body card, tag chips; **edit within the
  S21 window** (created before 23:59:59 of the next calendar day — app-enforced) via `updateJournalEntry()`;
  **delete any time** (S22) with a design-system §17 confirm modal → `deleteJournalEntry()`.

### Data layer (`lib/db.ts`)
- `saveJournalEntry` now returns the inserted row (needed for the flow).
- `getJournalEntries` now includes `prompts(prompt_text)` **and** `journal_entry_tags(tags(id,name))`.
- New: `getPrompts()`, `updateJournalEntry(id, body)` (S21), `setJournalEntryTags(entryId, tagIds)` (S20).

### Verification
- `npx tsc --noEmit` EXIT 0 · `npx expo export --platform android` bundles (4.2MB hbc). Dev-client reload
  via `npx expo start --dev-client` to view on device.

## 2026-09-11 (2) — Material 3 foundation + tab shell + exercises screen (5-4-3-2-1)

### MD3 foundation
- **Installed `react-native-paper` ^5.15.3** (MD3 by default) + `react-native-vector-icons` + `@types/react-native-vector-icons` + `@react-native-community/slider`.
- **`theme/md3.ts`** — MD3 theme bridge mapping `theme/tokens.ts` → `MD3Theme` (primary/secondary/tertiary ← tokens, surface variants ← offsets, onSurfaceVariant ← text-muted, outline ← border). `md3LightTheme`/`md3DarkTheme` exported.
- **`app/_layout.tsx`** — `ThemeProvider` + `PaperProvider` (mode-aware) + StatusBar + Stack (tabs + exercise/diary/crisis/profile).

### Tab shell (D14)
- **`app/(tabs)/_layout.tsx`** — expo-router `Tabs` styled to MD3/tokens: Home · Toolkit · Exercises · Diary · Portfolio (labels + icons, active = primary).
- **`components/CrisisFab.tsx`** — persistent Paper `FAB` (error-red, hand-heart icon) floating above the tab bar → full-screen crisis modal. Never gated.
- **`components/ScreenHeader.tsx`** — title + avatar top-right → profile stack.
- Moved `index`/`toolkit` into `(tabs)/`; added `(tabs)/exercises`, `(tabs)/diary`, `(tabs)/portfolio`; added `diary/`, `exercise/`, `crisis/`, `profile/` stacks.

### Exercises (5-4-3-2-1) — from existing ASCII pack
- **`(tabs)/exercises.tsx`** — Layout A category cards + Layout B "How are you feeling?" state filter (fight/flight/freeze/fawn/OK → suggested category + exercise rows). Null/error states + "no suggestions" edge.
- **`exercise/category/[key].tsx`** — exercises in one category (title/steps/duration → Start).
- **`exercise/[id].tsx`** — detail: category/steps/duration chips, "what this is"/"what to expect", Start (browse-first, sign-in only at save), null/error states.
- **`exercise/session/[id].tsx`** — guided session (S12–S15/S18): distress-before slider → step 1..5 (progress bar, prev/next) → distress-after + helpfulness chips → review/confirm → `saveSession()` → saved. Cancel discards (no confirm). Skippable ratings, no fixed duration.

### Verification
- `tsc --noEmit` clean. `npx expo export --platform android` bundles successfully (4.1MB hbc).

### Story cross-check (exercise screens vs S08–S18)
- ✅ S08 (6 categories), S09 (steps in order), S10 (no forced order), S11 (crisis = normal category), S12 (session start), S13 (confirm before save), S14 (distress 0–10 pre/post, nullable), S15 (helpfulness 0–10), S18 (multi/day).
- 🟡 **S16 (tags on sessions)** — tag picker not wired yet; join + `getSystemTags()`/`createUserTag()` ready.
- 🟡 **S17 (session history)** — no history view yet; landing "Done today" is a placeholder.
- S01 note: browse-first holds; Google sign-in is prompted by `saveSession()`'s internal `ensureSignedIn()` on the first save attempt.

## 2026-09-11 — Engine B via RPC; 46/46 PASS (direct-DB password attempt deferred)

### The `SUPABASE_DB_URL` attempt, and why it was parked
- Tried to connect this machine to Supabase directly for Engine B introspection (S02-rows, S04-rows,
  S26, S27, S29) via a `postgres://` string in `.env`.
- **Blockers, in order:** (1) the legacy direct host `db.uqisvrvgjoujxgrqigie.supabase.co` is
  **IPv6-only** (`AAAA` only) → `getaddrinfo ENOTFOUND` on this Windows machine; (2) the IPv4
  "Dedicated address" option is a **$4/mo Pro add-on**; (3) the free **shared pooler** needs the DB
  password, which kept failing `password authentication failed for user "postgres"` after several
  resets — the dashboard shows `[YOUR-PASSWORD]` placeholders, and the first reset password contained
  URL-special characters (`!?$` → fixed by percent-encoding) yet auth still failed, so the password
  itself could not be confirmed.
- **Decision:** stop blocking the 29-story verification on the password. Engine B now introspects via
  an RPC using the **service-role key** already used by Engine A. Direct/local DB access is
  **deferred, not abandoned** (recorded in ADR-010) — revisit the shared pooler + confirmed password,
  or the IPv4 add-on, if ad-hoc SQL is ever needed.

### Changes
- **New `supabase/introspection.sql`** — `get_schema_introspection()` `security definer` RPC returning
  RLS flags, public views, users/profiles columns, and `created_at`/`updated_at` presence as JSON.
  Grants: `service_role` + `authenticated` only (anon/public revoked). Run once in the SQL editor.
- **`services/verify-schema.ts`** — `engineB()` rewritten to call `admin.rpc("get_schema_introspection")`;
  the `postgres` driver import and `SUPABASE_DB_URL` branch removed. tsc clean.
- **`npm run verify:rls` → 46 checks, 46 PASS, 0 FAIL.** Engine B now executes S02-rows/S04-rows
  (RLS on all 9 user-data tables)/S26/S27/S29 for the first time.
- **ADR-010 recorded** (accepted, 2026-09-11) — Engine B introspects via RPC, not a direct DB password.
- `.env` `SUPABASE_DB_URL` line is now **optional/irrelevant** for verification — can be removed.

## 2026-09-05 — Design-system reconciliation + M2 data/auth hardening

### Design system reconciliation (source of truth = `designsystemtext.txt` v2.0)
- **Fixed `design-system/calm-anchor-design-system.css` dark-mode tokens** to match Aamir's spec exactly.
  Previously the CSS dark palette diverged (brighter/warm-tuned); now aligned: ns-hyper `#D4744A`,
  ns-hypo `#7A96AA`, sr-fight `#D96050`, sr-flight `#E09050`, sr-freeze `#7A96AA`, sr-fawn `#A888C4`,
  mood-1..5 `#D96050/#E09050/#D8A830/#7ABE88/#68C48A`, ex-breath `#5AADC0`, ex-ground `#7BBE96`,
  ex-somatic `#B09070`, ex-journal `#9A8AC4`, ex-selfkind `#D490A8`, ex-crisis `#D96050`, plus all
  `-bg` backgrounds and text-muted `#B8A878` / text-faint `#62594D`.
- `theme/tokens.ts` already matched the spec (verified) — the CSS was the only divergence; now both align.

### Data hardening (per 2 Sep meeting: personas + stress test)
- **`services/personas.ts`** — seeds 3 persona users via the service role: **active** (5 check-ins,
  8 sessions, 6 journal entries), **power** (3 check-ins, 12 sessions, 2 entries), **infrequent**
  (1/1/1 over 14 days). `npm run personas`.
- **Extended `services/verify-schema.ts`** with Engine A2 data-driven lifecycle checks against the
  persona data: **S17 (session history), S18 (multi/day), S19 (journal independent), S20 (journal tags),
  S21 (edit-window timestamps), S22 (single delete), S24 (unlimited entries/day)**.
- **Verification now 29/29 PASS** (was 22). Remaining UNTESTED: S26/S27/S29 (introspection, need
  `SUPABASE_DB_URL`), S10/S12/S13 (schema-only).

### Google-only auth (S02/D02/S01)
- **`lib/auth.ts` rewritten**: no more anonymous sign-in. `getCurrentUserId()` returns id or `null`;
  `signInWithGoogle()` (OAuth, deep-link `calmanchor://auth/callback`); `ensureSignedIn()` — the guard
  prompted at first exercise attempt (browse-first, S01); `signOut()`.
- **`lib/db.ts`**: all user-scoped writes/reads (`saveJournalEntry`, `getJournalEntries`, `saveCheckin`,
  `getCheckins`, `saveSession`, `getSessions`, profile, tags) now call `ensureSignedIn()`.

### Anonymisation (S05/D13) + single-entry delete (S22)
- **`supabase/anonymise.sql`** — `anonymise_user(p_user_id)` SQL function: rotates the user's UUID across
  all user-data tables to a fresh random id, clears PII on `users` (email/display_name/google_identity),
  mapping not stored. **Run in SQL editor** (like schema/rls).
- **`lib/db.ts`**: `anonymiseMyData()` (calls the RPC) + `deleteJournalEntry(id)` (single entry, any time).

### Docs sync (this session)
- **New ADRs recorded (accepted):** ADR-002 (Google-only auth), ADR-006 (anonymisation by UUID
  rotation), ADR-009 (screen mapping → M2). Register + candidate list updated in `docs/decisions/`.
- **Screen mapping moved to M2** (2 Sep meeting, "screening tasks can be moved to M2"): M1-21 split —
  shell + exercises mapping DONE in M1; Toolkit/Diary/Home/check-in/Crisis/Profile now M2-11/M2-12.
  Updated: `milestones/m1-project-setup.md` (M1-21 + deferred list), `milestones/m2-core-app.md`
  (full A–D plan + M2-07..M2-16), `01-overview.md` (M1 DONE, M2 IN_PROGRESS),
  `docs/ui/01-navigation-and-ia.md` (milestone tag → M2).
- `supabase/schema.sql` + `supabase/rls.sql` are **unchanged** — the live DB is already on the current
  schema (personas + verify run against it); only `supabase/anonymise.sql` is new this session (run in
  the SQL editor).

## 2026-08-30 — M1 completion: seed + RLS fix + full schema verification

- **Seed ran** against live Supabase (service role): **20 chapters / 35 exercises / 3 prompts / 3 system tags**. Confirmed.
- **RLS isolation (S04) fixed** — root cause was a stale `checkins` INSERT policy in the live DB rejecting
  owner inserts. Rewrote `supabase/rls.sql` as **idempotent per-operation policies** (`drop policy if
  exists` + explicit select/insert/update/delete per user-data table) and re-applied in the SQL editor.
  Now `npm run verify:rls` → **S04 PASS, S05 PASS**.
- **Full verification: 22 checks, 22 PASS** (`npm run verify:rls`). Recorded in
  `docs/schema-coaching/03-schema-status.md`. S26/S27/S29 + sequence stories remain UNTESTED (need
  `SUPABASE_DB_URL` for Engine B introspection).
- `services/verify-schema.ts` kept its insert-error capturing (useful for RLS debugging); `_diag.ts` removed.
- **Milestone 1 (architecture) deliverable effectively complete** once the above is committed — nav shell
  (M1-13) and Crisis FAB (M1-14) are deferred to M2 per the scope-doc dependency ordering (Aamir's call).

## 2026-08-30 — Schema verifier + live results

- **New `services/verify-schema.ts`** — runs the `docs/schema-coaching/02-query-pack.md` checks against
  live Supabase. `npm run verify` (Engine A, read-only) and `npm run verify:rls` (adds S04/S05 two-user
  isolation + cascade test). Engine B (introspection) activates when `SUPABASE_DB_URL` is set.
- Installed `postgres` (dev) for Engine B.
- **Live run (Engine A): 20 checks, 20 PASS.** Recorded in `docs/schema-coaching/03-schema-status.md`
  (S01,S02,S03,S06,S07,S08,S09,S11,S14,S15,S16,S19,S20,S23,S25 PASS; S04/S05 BLOCKED pending `--rls`;
  S26/S27/S29 + sequence stories UNTESTED, Engine B).
- Details: chapters=20, exercises=35 (breathing=3,somatic=11,sensory=8,voice=4,mindful=2,crisis=7),
  prompts=3, system tags=grounding/anxious/mood.

## 2026-08-30 — Dev-build / EAS decision (M1-17 → resolved by M1-18)

- **Decision:** stay on **Expo SDK 57** and use a **dev build via EAS cloud build** (no local Android SDK /
  Java needed). Recorded in `milestones/m1-project-setup.md` (M1-18) — resolved the M1-17 BLOCKED row.
- Installed `expo-dev-client@~57.0.16` (SDK 57 kept; pre-existing `react`/`react-dom` peer skew resolved
  with `--legacy-peer-deps`).
- Created `eas.json` with `development` (APK, developmentClient), `preview`, `production`.
- Toolkit PDF wiring landed: public-read `toolkit` bucket + `EXPO_PUBLIC_TOOLKIT_PDF_URL` +
  `lib/toolkit.ts` seam + `app/toolkit.tsx` (`react-native-pdf`, `source={{uri,cache:true}}`).
- `.env` gained `SUPABASE_SERVICE_ROLE_KEY` and `EXPO_PUBLIC_TOOLKIT_PDF_URL` (user-only, gitignored).
- **Pending (interactive, user-only):** `npx eas login` → `npx eas init` (adds `extra.eas.projectId`) →
  `npx eas build --profile development --platform android` → install APK; then `npx expo start --dev-client`.

## 2026-08-30 — Query-pack compliance pass (schema + seed corrections)

### Progress — hard-fail fixes (S05, S29)
- **S05 (delete my data):** every user-data FK now `on delete cascade` (checkins, journal_entries,
  exercise_sessions, checklist_progress, crisis_plan, settings, tags, junction tables) so delete-user
  cascades cleanly and no orphans remain.
- **S29 (offline-ready timestamps):** `created_at` + `updated_at` added to every user-data table —
  `exercise_sessions` (both, previously neither), `checkins` (+updated_at), `checklist_progress`
  (+created_at), `settings` (+created_at), `tags` (+updated_at). `journal_entries`, `profiles`,
  `crisis_plan` already had both.

### Progress — S11 crisis filter (decision: satisfy both filters)
- All 7 "Tools for the Bad Days" exercises now have **`exercise_type = 'crisis'`** AND
  **`category = 'crisis'`**. This satisfies S11's `WHERE exercise_type = 'crisis'` query *and* S08's
  `GROUP BY category` grouping — same set, both filters work, no separate crisis table/feature.
- Also fixed: "The Balloon Release" was mis-categorised `somatic` — it's a bad-days exercise, now
  `category = 'crisis'`.

### Progress — system tags (S16/S20)
- `services/seed.ts` now seeds system tags (`user_id` null): **grounding, anxious, mood** (D03 keeps
  "mood" only as a journal tag). Satisfies the INSERT…SELECT queries that attach `name = 'grounding'`/
  `'anxious'` system tags.

### Fix — RLS hole (S16)
- `tags` write policy tightened: `for insert with check (auth.uid() = user_id)` only — lets users create
  only *their* private tags, not global (system) tags. System tags are seeded via the service role
  (bypasses RLS).

### Fix — `documents` drop statement
- Added `drop table if exists documents cascade;` so the script re-runs cleanly.

### Progress — CHECK constraints (prevent test friction, recommended)
- `exercises.category` CHECK in the 6 contract names; `distress_before`/`distress_after`/`helpfulness`
  CHECK 0–10.

### Notes (accepted, not breaking — for the record)
- **5-4-3-2-1 Grounding** lives under "Mind" on workbook p.26 but is seeded `sensory` — acceptable
  contract mapping, noted. Its exercise is otherwise identical.
- **Chapter page ranges** in the seed differ from the workbook's own contents page for some chapters
  (e.g. Ch2 9–12 vs 8–14). Count (20) is right; mapping differs. Open item for Aamir — see
  `07-questions-for-aamir.md`.

## 2026-08-30 — RLS decision + contract alignment (ADR-003)

### Decision — RLS on all tables, difference in the policy (`docs/decisions/ADR-003-rls-strategy.md`)
- **Accepted (Amirreza, 2026-08-30):** `row level security` is enabled on **every** table. Content tables
  get a public-read policy (`for select using (true)`); user-data tables get own-rows-only
  (`auth.uid() = user_id`); `users` own-rows; `tags` public-read for system tags + owner for user tags;
  junction tables resolve owner via the parent row.
- Resolves the project lead's concern about "some tables RLS, some not" — the split lives in the policy,
  not in whether RLS is on.

### Decision — `users` table + service-role seed (sub-points of ADR-003)
- A `public.users` table mirrors `auth.users` (`id` PK→FK, `email`, `display_name`, `google_identity`
  unique, no password columns). All user-data FKs now reference `users(id)`. A `handle_new_user` trigger
  auto-creates the row on signup + one-time backfill. Satisfies S02/S27's `FROM users` queries and fixes
  the earlier split-brain (some FKs pointed at `auth.users`, some at a would-be parallel table).
- `services/seed.ts` now uses `SUPABASE_SERVICE_ROLE_KEY` (server-only, bypasses RLS) so content inserts
  still work under strict RLS. `lib/supabase.ts` unchanged (anon key for the client).

### Progress — exercise categories aligned to contract (S08)
- Renamed the seed's categories to the contract set: `body→somatic`, `breath→breathing`,
  `senses→sensory`, `mind→mindful`, and "Tools for the Bad Days" exercises → `crisis`.
- Final distribution (verified from file): `breathing=3, somatic=12, sensory=8, voice=4, mindful=2, crisis=6`
  = **35 exercises**, 6 distinct contract categories, no leftover old names. `npx tsc --noEmit` passes.
- Seed **not yet run** against Supabase (by user) — waiting on `SUPABASE_SERVICE_ROLE_KEY` in `.env`.

## 2026-08-30 — Schema alignment & seed corrections

### Decision — toolkit read source (`docs/decisions/ADR-001-toolkit-source.md`)
- **Accepted (Amirreza, 2026-08-30):** the workbook PDF is read from **Supabase Storage (public-read)** via a URL and cached on-device by `react-native-pdf` — **not committed to the repo**. The `assets/toolkit_compressed.pdf` file is removed and `.gitignore` excludes `*.pdf`. Seam: a new `lib/toolkit.ts` (same discipline as `lib/auth.ts`/`lib/db.ts`).

### Progress — mood removed, evidence-based metrics added (NOT a decision)
- **`lib/db.ts`:** removed `MoodLogInput`, `saveMoodLog`, `getMoodLogs`; removed `mood_before`/`mood_after` from `SessionInput`; added `distress_before`/`distress_after`/`helpfulness` (0–10) and `note`. Per `04-wellbeing-metrics.md` (D04).
- **Migration `0001_alignment_exercise_sessions.sql`:** renames `sessions` → `exercise_sessions`; drops `mood_before`/`mood_after`; adds `distress_before`/`distress_after`/`helpfulness` (smallint 0–10); drops `mood_logs`. Not yet applied (live Supabase).
- Matches S26/D03 (no mood dashboard, no `mood_logs`).

### Progress — table/column renames
- **`lib/db.ts`:** `saveSession`/`getSessions` target `exercise_sessions`; `getJournalEntries` joins `prompts` (not `journal_prompts`); `JournalEntryInput` drops `chapter_id`/`mood_after` (keeps `body`, `prompt_id`).
- **Migration `0002_alignment_journal_prompts.sql`:** renames `journal_prompts` → `prompts`; drops `journal_entries.mood_after`/`chapter_id`; adds `updated_at`, sets `body not null`.
- Matches S19/S23 (journal_entries shape) and S23 (table named `prompts`).

### Progress — missing tables
- **Migration `0003_missing_tables.sql`:** adds `users` (google_identity ref, no password columns), `profiles` (research fields only, separated identity), `tags` (system + user), `exercise_session_tags`, `journal_entry_tags`, `documents` (storage anchor). RLS: owner-only on all user-data tables (S04).
- **`lib/db.ts`:** added `getCurrentProfile`, `saveProfile`, `getSystemTags`, `createUserTag`. Not yet applied (live Supabase).

### Seed fixes (`services/seed.ts` — edited, NOT run)
- **6 categories** (was 5): added `body`. Reassigned body-family exercises — Hand on Chest & Slow Breath, Tapping/EFT, Rocking or Swaying — plus new **Stretching or Yoga (Cat-Cow / Child's Pose)**.
- **Added 9 missing workbook exercises** (verified against `toolkit_compressed.pdf` pages 23–34 + 99–113):
  - mind: "What's True Right Now?", "Gentle Journaling: What Does This Part of Me Need?"
  - senses: Weighted Blanket, Nature Sounds / Brown Noise / Low TV, Mindful Body Scan, Tactile Objects
  - somatic: Grounding Through Contact
  - senses: How to Build a Safe Space (from Making Safety Real)
- **Count:** 26 → **35 exercises**. Distinct categories (verified): `body, breath, mind, senses, somatic, voice`.
- Renamed seed's `journal_prompts` → `prompts` (delete + insert calls).
- `npx tsc --noEmit` passes. **Seed not executed against Supabase.**

## 2026-08-30 — Docs restructure (progress folder)

- Split the monolithic `01-milestone-tracker.md` into per-phase registers under `milestones/` + `01-overview.md`, mirroring the `docs/schema-coaching/` format (one concern per file, stable IDs, append-only registers, status legend).
