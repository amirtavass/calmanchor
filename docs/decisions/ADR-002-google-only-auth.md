# ADR-002 - Auth: Google-only sign-in, no anonymous path

Status: accepted
Date: 2026-09-05
Author: Amirreza

## Context

Story S01 ("user can browse before sign-in") and S02 ("Google sign-in; stable internal UUID and Google
identity reference, no password columns") require **Google-only** authentication. The first `lib/auth.ts`
iteration used silent anonymous sign-in (`supabase.auth.signInAnonymously`): it satisfied "no auth UI",
but it is a coached violation — anonymous sign-in produces no real identity, no `users` row with a Google
identity, and makes the S02 contract ("Google profile gives identity") impossible. D02 fixes Google as the
only sign-in method; the silent-anonymous approach had to be removed.

Two coupled constraints:

1. **Browse-first (S01):** the toolkit, PDF, and exercise catalogue must be usable *before* sign-in.
   Sign-in is triggered only when the user attempts the first exercise (see meeting 6 — onboarding).
2. **Identity shape (S02/S27):** every user-data record keys off an internal UUID with a stable
   `users` row (ADR-003), created on sign-up by the `handle_new_user` trigger and joined from the
   Google profile (email, display name, Google identity).

## Decision

Google is the **only** sign-in method. No username/password, no anonymous sign-in, no other providers.

- `lib/auth.ts`:
  - `getCurrentUserId(): Promise<string | null>` — drives browse-first (null until signed in).
  - `signInWithGoogle()` — opens the Supabase OAuth flow for provider `google`, with
    `redirectTo: "calmanchor://auth/callback"` and `skipBrowserRedirect: true`, then polls for the
    session (~10 s) so sign-in completes inside the app without a browser hand-back.
  - `isSignedIn()`, `signOut()`, and `ensureSignedIn()` — the guard raised at the first exercise
    attempt, per S01.
  - `signInAnonymously` is removed entirely.
- The user's `users` row is created automatically by the existing `handle_new_user` trigger on sign-up
  (email + `raw_user_meta_data.full_name`) and backfilled once; `google_identity` is populated by the
  Supabase OAuth provider, not by a password flow. (Until the app-side OAuth handshake verifies the
  `google_identity` write, the anon-key client must not depend on that column being populated.)
- Session persistence (`30–90 day` tokens) stays a Supabase service-layer concern; **no** custom
  credential storage in this milestone.

## Rationale

- Satisfies S01, S02 and D02 directly: one auth path = one data shape; Google profile gives identity
  without password management or storage.
- Keeps the browse-first product direction: sign-in is a deliberate gate at the first *write* (exercise
  attempt), not a blocker to reading the workbook (S07/D08).
- The `users`/`profiles` split (ADR-003, D07) stays intact: identity lives on `users`, research fields
  on `profiles`.

## Consequences

- **First sign-in happens at the first exercise attempt**, so user-data screens must handle
  `getCurrentUserId() === null` (browse-only) gracefully.
- Every user-scoped write in `lib/db.ts` now calls `ensureSignedIn()` and throws
  `"Sign-in required to …"` when null — a single guard seam, not scattered checks.
- The Supabase project must have the **Google provider enabled** and allow the `calmanchor` redirect
  scheme; the deep link still needs on-device verification.
- Anonymous sign-in is gone for good; any future "quick try" path must not reintroduce it.

## Implementation notes

- Rewritten files: `lib/auth.ts` (new API), `lib/db.ts` (guards imported from `lib/auth.ts`).
- `redirectTo: "calmanchor://auth/callback"` — the `calmanchor://` scheme must be configured in
  `app.json` (expo-router deep links) and in the Supabase Auth provider settings.
- Verify on a dev build: sign out → browse toolkit → attempt exercise → Google sheet opens → session
  appears; confirm `getCurrentUserId()` returns the id afterwards.