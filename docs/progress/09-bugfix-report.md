# Bug fix report — three persistent issues (Sep 2026)

Date: 2026-09-24
Scope: `app/(tabs)/exercises.tsx`, `app/(tabs)/toolkit.tsx`, `app/exercise/session/[id].tsx`,
`app/diary/[id].tsx`, `components/M3Button.tsx`, `lib/toolkit.ts`.

Three persistent, user-visible issues were reported and fixed. Each section lists the
symptom, the root cause, and what changed.

---

## 1. Exercises tab opened the Google sign-in page on its own

### Symptom

- Merely **navigating to the Exercises tab** (initial render, no tap) launched the Google
  sign-in page. The sign-in modal was supposed to appear only when the user chose to
  **start** an exercise.
- If the user dismissed the sign-in page and stayed signed out, the Exercises tab was
  **stuck on "Loading exercises…"** and never showed its content.

### Root cause

Two mount-time effects in `app/(tabs)/exercises.tsx` were wrong in opposite directions:

1. A `useEffect(..., [])` called `getSessions()` unconditionally on mount. `getSessions()`
   in `lib/db.ts` starts with `ensureSignedIn()`, and `ensureSignedIn()` calls
   `signInWithGoogle()` when there is no session — which does `Linking.openURL(...)` and
   opens the browser. So *reading the tab* fired *sign-in*. This is the only tab that made
   an unguarded prompt-ing call; the Diary tab pre-checks `isSignedIn()` and the Home
   dashboard guards everything behind `if (!signedIn) return`.
2. The exercise-list effect early-returned on `if (!signedIn)` **without** calling
   `setLoading(false)`, so a signed-out user stayed on the loading state for ever. The
   exercise catalogue itself (`getAllExercises()`) is a public read and never needed the
   guard.

### Fix

- The exercise catalogue is now loaded **unconditionally** (public content, S01
  browse-first). The loading flag is always cleared, so the tab renders its content for
  everyone.
- `getSessions()` now runs **only when `signedIn` is already true**, and the "Done today"
  row is cleared on sign-out. Nothing calls `ensureSignedIn()` from a mount effect any
  more.
- Sign-in is now triggered **only** by the user: the "Start exercise" button on
  `app/exercise/[id].tsx` calls `gateStart(...)` from `useSignInGate`, which shows the
  modal. Pressing "Sign in with Google" in that modal runs `signInWithGoogle()`, i.e. it
  navigates to the Google sign-in page, and on success continues into the session.
- Hardened the same latent bug in `app/diary/[id].tsx`: its entry-load effect now checks
  `signedIn` before calling `getJournalEntries()` (which would otherwise prompt).

### Result

- Signed-out users see the full Exercises screen (chips, categories, quick start) and can
  browse exercise detail pages freely.
- They **cannot start** an exercise without signing in; the modal appears only when
  "Start exercise" is tapped, and its confirm button navigates to Google sign-in.

---

## 2. Toolkit PDF: locked pages were reachable, then the reader became scroll-locked

### Symptom

Two successive, related problems:

- **First version:** unlogged users saw the whole workbook and could scroll straight into
  the locked pages. A modal blocked the view, and pressing "Not now" yanked the reader
  back to page 10.
- **Second version (regression):** as soon as the reader went past page 10 the toolkit
  **re-rendered and clamped itself to page 10**, and from then on the user could not even
  scroll between pages 1 and 10.

### Root cause

`app/(tabs)/toolkit.tsx` gated the PDF by mutating the controlled `page` state:

- `scrollEnabled={signedIn || page < SIGNED_OUT_PAGE_LIMIT}` — once `page` reached 10 the
  scroll was **disabled entirely**, freezing the reader at page 10 and blocking pages
  1–9 as well.
- `onPageChanged` did `setPage(10)` + `pdfRef.current?.setPage(10)` + `gate(...)` — a
  state change on every scroll attempt past the limit, which re-rendered the viewer and
  repeated the snap-back. This is the documented prop→`componentDidUpdate`→`scrollToIndex`
  loop the code already tried to avoid.

The design was wrong in principle: it tried to **prevent scrolling past the limit**
instead of **removing the locked pages from the reader**.

### Fix — a free preview plus a real lock page

The signed-out reader is now a separate surface (`FreePreview` in
`app/(tabs)/toolkit.tsx`):

- Pages **1 to 10 are each rendered as their own single-page PDF** and stacked in a plain
  `ScrollView`, so the user scrolls them **freely**. Nothing disables scrolling and nothing
  re-renders while reading.
- The slot immediately after page 10 — the **"page 11" position** — is a **lock page**:
  a lock medallion, supportive copy, and a **"Sign in with Google"** button. There is
  **no modal**. This is the modern "limited pages + locked page" pattern.
- Pressing the lock page's button calls `signInWithGoogle()` directly. Signing in swaps
  the surface for the full continuous PDF (same component, full access).
- Each preview row is `pointerEvents="none"` because `react-native-pdf`'s `singlePage`
  mode installs an Android touch listener that swallows gestures — without this the parent
  `ScrollView` could not scroll.
- Chapter rows that start beyond page 10 show a **lock icon** and jump to the lock page
  instead of silently doing nothing.
- The read toolbar shows `Free · Page X of 10` while signed out, `Page X of Y` when signed
  in.

Supporting change in `lib/toolkit.ts`: `loadToolkitLocalSource()` downloads the workbook
**once** to the device cache and shares a `file://` source between all the preview page
instances (`react-native-pdf`'s own per-instance cache would have raced across ten
concurrent viewers). The PDF stays out of the repo (S07/S28).

### Result

- Signed-out: pages 1–10 scroll freely; page 11 is a lock page with a sign-in button.
- Signed-in: the full workbook, unchanged.
- No modal, no snap-back, no re-render trap.

---

## 3. The button next to "Skip" on the completion screen was invisible

### Symptom

On the exercise completion screen ("That's it." / "Well done for showing up."), the button
sitting next to **Skip** was completely transparent — the tap target was there and worked,
but neither its fill nor its label could be seen. Only Skip was visible.

### Root cause

Two compounding problems in `components/M3Button.tsx`:

1. **The fill was painted on the wrong view.** The container colour was applied to an
   inner `View` while the outer `TouchableRipple` (which is what `flex: 1`/`flex: 1.3` was
   applied to) stayed unstyled. Depending on layout, the inner view did not cover the
   tap area, so the filled button rendered with no visible surface — and its label used
   `textInverse` (cream), which is invisible against the cream page background.
   `Skip` looked fine only because its `outlined` variant draws a 1 dp border on the
   wrapper.
2. **The accent colour was low-contrast.** The button used `secondaryActive`
   (warm olive `#4A4230`), which the design rules already flagged as weak for the small
   text-on-fill case.

### Fix

- **`components/M3Button.tsx`** — the container colour is now painted on the **wrapper**
  (the `TouchableRipple` itself), which is the element that receives the caller's `style`
  and therefore the full flex'd tap area. The wrapper also carries `height: 40` and the
  rounded/`overflow: hidden` clip; the inner view only lays out the icon and label.
  Selected-outlined buttons now get a border in the fill colour instead of the default
  border. This fixes **every** filled `M3Button` at the source, not just this one.
- **`app/exercise/session/[id].tsx`** — the completion CTAs are now **green**:
  - "Review & save" (next to Skip on "That's it.") → `success` (`#2E7D52` light /
    `#68C48A` dark), matching the "Well done for showing up." colour story on that screen.
  - "Save" (confirm stage) and "Done" (saved stage) → the same `success` green, since they
    are the same class of completion button and had the identical invisibility bug.

### Result

The button is clearly visible with a green fill and a legible label, matching the visibility
of Skip while keeping the completion screen's green tone.

### Follow-up (same day)

- The label/icon colour is now chosen from the **fill's own luminance** (WCAG contrast against
  `#FFFFFF` / `#1A1A13`) rather than the background-relative `textInverse`, so a solid green
  button can never render its text in an unreadable tone. An optional `textColor` prop allows an
  explicit override.
- In the **Saved** stage, the "How do you feel now?" check-in is no longer locked after the first
  tap: the user can select a different state and the new check-in is saved (records remain
  append-only). The "Saved — thank you." confirmation was removed as redundant.

---

## Verification

- `npx tsc --noEmit` — exit 0.
- `npx expo export --platform android` — bundles (4.3 MB hbc).
- Device QA still required for full acceptance (Android demo-ready; iOS needs device).

## Notes

- Sign-in is now **only** ever initiated by an explicit user action ("Start exercise",
  the toolkit lock page, or an explicit sign-in button). No screen performs a prompt-ing
  data read on mount.
- If only the completion button mentioned in issue 3 should be green (and "Save"/"Done"
  should revert to `secondaryActive`), that is a one-line change per button in
  `app/exercise/session/[id].tsx`.
