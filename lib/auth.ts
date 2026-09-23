import { useEffect, useState } from "react";
import { Linking } from "react-native";
import type { Session, User } from "@supabase/supabase-js";
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
//
// For reactive UI state use the `useSession()` hook — it subscribes
// to Supabase `onAuthStateChange` so screens update the moment the
// session changes (no manual re-polling).
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
 *
 * PKCE flow: `signInWithOAuth({ skipBrowserRedirect: true })` returns the
 * provider URL in `data.url` but does NOT open it in React Native (the SDK
 * only auto-redirects in a browser). We must open it ourselves, then wait for
 * the deep link (`app/auth/callback.tsx`) to exchange the code for a session.
 */
export async function signInWithGoogle(): Promise<string | null> {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: "calmanchor://auth/callback",
      skipBrowserRedirect: true, // React Native: we open data.url ourselves below
    },
  });
  if (error) throw error;
  if (!data?.url) return null;

  // Open the provider URL in the system browser / custom tab.
  await Linking.openURL(data.url);

  // Wait for the callback route to exchange the code and persist the session.
  // Resolve on the first SIGNED_IN event; fall back to null after a generous
  // timeout so the caller can show the modal again rather than hang forever.
  return new Promise<string | null>((resolve) => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "SIGNED_IN" && session?.user?.id) {
        subscription.unsubscribe();
        resolve(session.user.id);
      }
    });
    setTimeout(() => {
      subscription.unsubscribe();
      resolve(null);
    }, 90_000);
  });
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

/**
 * Live session hook (A2). Subscribes to `onAuthStateChange` so the UI reacts
 * to sign-in/sign-out immediately. Returns the Supabase session `user` (with
 * `email`, `user_metadata.full_name`, `user_metadata.avatar_url`/`picture`)
 * plus the stable internal `userId`. `loading` is true until the initial
 * session read completes. Guard the subscription on unmount to avoid leaks.
 */
export function useSession() {
  const [session, setSession] = useState<Session | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const sync = (s: Session | null) => {
      if (!active) return;
      setSession(s);
      setUserId(s?.user?.id ?? null);
      setUser(s?.user ?? null);
      setLoading(false);
    };

    // Initial read (persisted session from AsyncStorage).
    supabase.auth.getSession().then(({ data }) => sync(data.session));

    // Live updates — signed in/out/refreshed.
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, s) => sync(s));

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  return { session, userId, user, signedIn: userId !== null, loading };
}