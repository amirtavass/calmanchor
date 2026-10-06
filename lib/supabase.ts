import "react-native-url-polyfill/auto";

import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "../supabase/database.types";

const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

// Typed against `supabase/database.types.ts` (B4) — regenerated from the live
// schema with `npm run gen:types`, so calls are checked against the real
// columns rather than drifting hand-written interfaces.
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    // PKCE is the recommended RN flow: signInWithOAuth returns a URL carrying
    // a code_challenge, and app/auth/callback.tsx exchanges the returned code
    // for a session (tokens never appear in the deep-link URL).
    flowType: "pkce",
  },
});
