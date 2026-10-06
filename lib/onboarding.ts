import { useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * First-launch onboarding flag (M3-08).
 *
 * Deliberately **local** (AsyncStorage), not a user-data row: the spec is
 * explicit that onboarding collects no data and requires no account — the app
 * must work anonymously, so the "seen it" flag cannot live behind RLS.
 *
 * A tiny external store rather than a `useState` in the root layout, so the
 * first-launch redirect cannot go stale when onboarding completes and the user
 * is routed back into the app.
 */

export const ONBOARDING_SEEN_KEY = "calmanchor.onboardingSeen";

let cached: boolean | null = null;
const listeners = new Set<() => void>();

const emit = () => listeners.forEach((l) => l());

/** Read the flag once at start-up; resolves `null` until known. */
export function loadOnboardingSeen(): void {
  if (cached !== null) return;
  AsyncStorage.getItem(ONBOARDING_SEEN_KEY)
    .then((v) => {
      cached = v === "1";
      emit();
    })
    .catch(() => {
      // Fail open: never trap a user inside onboarding because storage failed.
      cached = true;
      emit();
    });
}

export function markOnboardingSeen(): void {
  cached = true;
  emit();
  AsyncStorage.setItem(ONBOARDING_SEEN_KEY, "1").catch(() => {
    // Local-only flag; a missed write just means seeing onboarding again.
  });
}

/** Reset the flag — "read the introduction again" from Profile. */
export function markOnboardingUnseen(): void {
  cached = false;
  emit();
  AsyncStorage.removeItem(ONBOARDING_SEEN_KEY).catch(() => undefined);
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

function getSnapshot(): boolean | null {
  return cached;
}

/** `null` = still reading storage (render nothing / a splash). */
export function useOnboardingSeen(): boolean | null {
  return useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
}
