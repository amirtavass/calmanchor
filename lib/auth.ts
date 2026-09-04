import { supabase } from "./supabase";

// ============================================================
// AUTH — Google-only (S02/D02). No anonymous, no password.
// Browse-first (S01): content is public and readable without
// sign-in. Google sign-in is prompted when the user first
// attempts a user-scoped action (e.g. starting an exercise).
//
// Call `getCurrentUserId()` to check; it returns null if not
// signed in (no silent anonymous session). Call `ensureSignedIn()`
// to prompt Google sign-in when a guarded action is attempted.
// ============================================================

/** Returns the signed-in user id, or null if not signed in. */
export async function getCurrentUserId(): Promise<string | null> {
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user?.id ?? null;
}

/** True if a session is active. */
export async function isSignedIn(): Promise<boolean> {
  return (await getCurrentUserId()) !== null;
}

/**
 * Prompt Google sign-in. Returns the signed-in user id, or null if the
 * user cancelled/dismissed the flow. Call from the guard in exercise/diary
 * entry points (S01: sign-in prompted at first exercise attempt).
 */
export async function signInWithGoogle(): Promise<string | null> {
  const { error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "calmanchor://auth/callback",
      skipBrowserRedirect: true, // React Native: return the auth URL to open externally
    },
  });
  if (error) throw error;

  // OAuth in RN: the browser/app opens the provider; on return the session is
  // picked up via the deep link. Poll briefly for the session to resolve.
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 500));
    const id = await getCurrentUserId();
    if (id) return id;
  }
  return null;
}

/**
 * Guard for user-scoped actions. Returns the user id, prompting Google
 * sign-in if needed. Call at the start of "Start exercise" / "Save entry"
 * flows. (S01: browse freely; sign in when you do something.)
 */
export async function ensureSignedIn(): Promise<string | null> {
  const id = await getCurrentUserId();
  if (id) return id;
  return signInWithGoogle();
}

/** Sign out (back to browse-only mode). */
export async function signOut() {
  await supabase.auth.signOut();
}