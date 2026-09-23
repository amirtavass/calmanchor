# Live data + Google sign-in — design & step plan

> **Concern:** how the app goes from "reads mock numbers" to "reads real Supabase data for the
> signed-in user", and how Google sign-in becomes visible/live in the UI.
> **Status:** Phase A **implemented** (2026-09-17); Phases B & C are design-only (not yet built).
> **Sources:** `docs/schema-coaching/01-user-stories.md` (S01–S29), `docs/decisions/ADR-002`
> (Google-only auth), **meetings** (`Meetings.txt`: 26 Aug, 28 Aug, 02 Sep), M3-02/M3-03 in
> `docs/progress/milestones/m3-full-feature-set.md`, `docs/ui/sections/home/00-dashboard.md`.
> Every step below cites the meeting or milestone it comes from.

## 1. Current state (what is real vs mock)

Good news: **the data layer already talks to real Supabase.** `lib/db.ts` calls `supabase.from(...)`
for every domain (journal, checkins, sessions, profile, tags, exercises, chapters, anonymise RPC).
There are **no mock functions in the app** — the only fixtures are the Node persona seeder
(`services/personas.ts`, DB rows for the stress test) and **four hardcoded values on the dashboard**.

| Where | What is hardcoded | Real replacement |
|---|---|---|
| `app/(tabs)/index.tsx` L163 | Sessions stat falls back to `"12"` | `exercise_sessions` count for `auth.uid()` |
| `app/(tabs)/index.tsx` L168 | Streak stat `"5d"` | Consecutive days with a session/check-in |
| `app/(tabs)/index.tsx` L86–96 | Weekly chart `thisWeek` array + `inWindowPct` (`67%`) | `checkins.ns_state` per calendar day |
| `app/(tabs)/index.tsx` L139, L115 | Greeting name `"Amir"` (hardcoded) | `users.display_name` (identity table, 28 Aug §5) |
| — | No live sign-in state | `onAuthStateChange` subscription |

Auth today (`lib/auth.ts`): Google OAuth works (Supabase provider, `skipBrowserRedirect`, session
persisted in AsyncStorage), sign-in is polled (~10 s), and `ensureSignedIn()` gates every write.
**Gaps:** (a) no `app/auth/callback.tsx` route to resolve the `calmanchor://auth/callback` deep link
on device, (b) no `onAuthStateChange` subscription, so screens never *react* to sign-in/out live,
(c) the app never displays the Google profile (name, avatar, email) — the greeting hardcodes "Amir",
and the post-sign-in research-profile questions (28 Aug §6) are not shown.

## 2. Design goals

1. **Dashboard reads real data** (M3-03): sessions count, streak, in-window %, and the weekly bars
   all come from `exercise_sessions` + `checkins` for the signed-in user.
2. **Google sign-in is visible and live** (28 Aug §5–6): the UI shows the signed-in Google profile
   (name, avatar, email), reacts immediately to sign-in/sign-out, and offers sign-in / sign-out
   controls.
3. **Browse-first stays intact** (S01; 28 Aug §6, §10): nothing is gated at launch; sign-in is
   prompted **when the user attempts their first exercise** (workbook/PDF/exercises stay readable
   without auth — S07).
4. **No mood/trend visualisation** (S26; 28 Aug §4): distress/helpfulness are stored raw and never
   charted. The only chart is the weekly **window-of-tolerance** state (nervous-system state from
   `checkins.ns_state`), which is **not** mood/SUDS — this is design-system §11 and was already
   approved; we keep it, we do not add mood trends.
5. **Post-sign-in research profile** (28 Aug §6): after first Google sign-in, ask the five optional
   research-profile questions (age band, gender, ethnicity, treatment status, referral source, each
   with "prefer not to say"). Stored on `profiles`, separate from identity (S03/S27).

## 3. Meeting cross-check (why each phase exists)

| My step | Aamir's source (meeting / milestone) |
|---|---|
| A1 callback route, A2 `useSession()` | Necessary for "sign-in completes inside the app" (28 Aug §5; ADR-002 implementation notes: verify the deep link on a dev build). |
| A3 identity display | "User identity (email, display name, Google identity) lives on a separate table" — read from `users`, not `user_metadata` (28 Aug §5). |
| A4 sign-in gate at first exercise | "Sign-up is triggered when the user attempts to do an exercise, at which point Google Sign-In is initiated" (28 Aug §6; S01). |
| A5 research-profile prompt | "After sign-up, a short set of research profile questions is asked … all optional with a 'prefer not to say' option" (28 Aug §6). |
| B1 stats/streak/window % | M3-03; "Metrics tracked per session … distress before/after, helpfulness" + check-ins for window state (28 Aug §4; S25). |
| B2 weekly window chart | Design-system §11, already approved in M2; **not** a mood trend (28 Aug §4, S26). |
| B3 types | 02 Sep: personas + schema stress-tested before UI — schema/types are the source of truth (already 46/46 via `npm run verify`). |
| C verification | 26 Aug: "test queries … stored for reuse"; 02 Sep: verify before sign-off; M3 gate. |

## 4. The steps (design, in build order)

### Phase A — Google sign-in made visible & live (28 Aug §5–6) ✅ SHIPPED 2026-09-17

**A1. Add the auth callback route.** ✅ `app/auth/callback.tsx` — resolves the
`calmanchor://auth/callback` deep link, calls `supabase.auth.getSession()`, then
`router.replace("/(tabs)")`. Registered in `app/_layout.tsx`.

**A2. Add a live session hook.** ✅ `useSession()` in `lib/auth.ts`:
- `useEffect` → `supabase.auth.onAuthStateChange(...)`; initial read from AsyncStorage session.
- Returns `{ session, userId, user, signedIn, loading }` where `user` is the Supabase session user.
- Subscription removed on unmount.

**A3. Surface the Google profile — identity comes from the `users` table (28 Aug §5).** ✅
- `getCurrentUser()` in `lib/db.ts` → `{ display_name, email }` from `users` (non-prompting).
- `app/(tabs)/index.tsx` greeting uses `display_name` (fallback "there").
- `app/profile/index.tsx`: avatar (`user_metadata.picture`), name, email, sign-in/out controls,
  research-profile state.
- `signOut()` with a confirm-free flow (single tap on the profile screen).

**A4. Sign-in gate at the first exercise attempt (28 Aug §6; S01).** ✅
- `components/SignInPrompt.tsx` + `useSignInGate()` — soft modal ("Sign in with Google to save…",
  Not now / Sign in with Google, busy state) instead of the old throw path.
- Wired at: exercise detail "Start exercise", session save, post-session check-in, journal save,
  trigger save. Crisis stays ungated (IA §3).

**A5. Research-profile prompt after first sign-in (28 Aug §6).** ✅
- `getResearchProfile()` in `lib/db.ts` (non-prompting) decides whether a row exists.
- Dashboard shows a gentle nudge card → `app/profile/questions.tsx` (five optional questions, each
  with "Prefer not to say", saved via `saveProfile()`). Asked once.

### Phase B — Dashboard reads real Supabase data (M3-02, M3-03)

**B1. Add a `getDashboardStats()` query in `lib/db.ts`** returning one object:
- `sessions: number` — count of `exercise_sessions` for `auth.uid()` (lean `.select("id")`).
- `streak: number` — consecutive days ending today (or yesterday if today has none yet) where the
  user has **either** an `exercise_sessions` row **or** a `checkins` row. Query distinct dates from
  both tables, walk back day-by-day; stop at the first gap. *Decision to confirm:* streak source =
  sessions only, or sessions + check-ins (recommended: sessions only for a pure "exercise streak";
  record whichever is agreed).
- `week: { day, state, height }[]` + `inWindowPct` — last 7 calendar days, one bar per day. State
  per day = the **last** `checkins.ns_state` of that day; map `window`/`regulated` → "window",
  `hyper`/`hypo`/`dysregulated` → out-of-window; no check-in that day → neutral/absent bar (today
  keeps the dashed no-fill style). `inWindowPct` = in-window days ÷ days-with-data (guard ÷ 0 → 0).

**B2. Check-in data dependency (M3-02).** The weekly window chart reads `checkins`, so it only has
real shape once check-ins exist. Today they come from the diary trigger tracker (M2-05). For the
chart to be meaningful, add the **daily check-in card on Home** (M3-02): ns_state + survival
response + triggers → `saveCheckin()`. Sequence: M3-02 check-in card → then B1 stats have data.

**B3. Wire the dashboard.**
- Replace the hardcoded `thisWeek` array, `"5d"`, and `"12"` fallback with `getDashboardStats()`.
- Add the dashboard loading skeleton (`M3Skeleton`/`SkeletonTextStack`) while awaiting.
- Signed-out / error state: hide the three stat values behind a light "Sign in to see your stats"
  affordance (design §21 keeps the layout stable); never show fabricated numbers.

**B4. Typing.** Generate real Supabase types (`npx supabase gen types typescript`) into
`supabase/database.types.ts` and type `getDashboardStats` returns from it; hand-written row
interfaces in `lib/db.ts` can then be replaced incrementally (02 Sep: schema is the source of truth).

### Phase C — Verification & sign-off

- `npx tsc --noEmit` EXIT 0; `npx expo export --platform android` bundles.
- `npm run verify` still 46/46 (schema untouched; personas stress test already satisfied the
  02 Sep requirement).
- On-device (dev build): sign out → dashboard shows prompt, no fake numbers; sign in via Google →
  name + avatar appear within ~1 s (no 10 s poll reliance); first-time sign-in → research-profile
  card appears once; run an exercise → Sessions increments; do a check-in → today's bar reflects
  `ns_state`; next day → streak = 2. Sign out from profile → dashboard returns to prompt.
- Confirm the `calmanchor://auth/callback` deep link resolves (Android intent filter in
  `app.json`/`android.json` + Supabase Auth redirect allow-list already contain `calmanchor://`).

## 5. Files touched (Phase A shipped ✅; B/C pending)

| File | Change | Status |
|---|---|---|
| `app/auth/callback.tsx` | NEW — resolve deep link, redirect to `(tabs)`. | ✅ |
| `lib/auth.ts` | ADD `useSession()` hook + `onAuthStateChange`; keep `signInWithGoogle`/`signOut`/`ensureSignedIn`. | ✅ |
| `lib/db.ts` | ADD `getCurrentUser()` (identity) + `getResearchProfile()` (non-prompting). | ✅ |
| `components/SignInPrompt.tsx` | NEW — soft sign-in modal + `useSignInGate()` hook. | ✅ |
| `app/(tabs)/index.tsx` | Greeting name from `users` + A5 research nudge card; **stats still mock (Phase B)**. | A3/A5 ✅ / B pending |
| `app/profile/index.tsx` | Google profile display + sign-in / sign-out controls. | ✅ |
| `app/profile/questions.tsx` | NEW — five optional research questions, saved via `saveProfile()`. | ✅ |
| `app/_layout.tsx` | Register `auth/callback` + `profile/questions`. | ✅ |
| `lib/db.ts` | ADD `getDashboardStats()` (Phase B) — not yet. | ⏳ |
| `supabase/database.types.ts` | NEW (if generating types) — not yet. | ⏳ |
| `docs/ui/sections/home/00-dashboard.md`, `docs/progress/06-changelog.md` | Update. | ✅ changelog / ⏳ dashboard doc |

## 6. Non-goals (out of scope for this pass)

- No local cache / offline-first (deferred — 26 Aug §2; that is M3-07).
- No Portfolio wiring (M3-04), full 7-step onboarding (M3-08), or export (M3-09) yet.
- No mood/SUDS trend visualisations (S26; 28 Aug §4) — the weekly window chart is the only chart.
- No changes to `supabase/schema.sql`, RLS, or the personas seed (DB is already correct and verified —
  02 Sep: personas + schema hardening were done *before* UI, per Aamir's priority order).