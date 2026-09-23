import { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import M3Spinner from "../../components/M3Spinner";
import { supabase } from "../../lib/supabase";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";

/**
 * Auth callback (A1) — resolves the `calmanchor://auth/callback` deep link that
 * Supabase Google OAuth returns to. With the PKCE flow the link carries a
 * `code` (and optional `sb_flow_id`) query param; we exchange it for a session,
 * then send the user home.
 *
 * There is nothing to render — a brief centred spinner, then router.replace.
 */
export default function AuthCallbackScreen() {
  const router = useRouter();
  const { code, sb_flow_id } = useLocalSearchParams<{
    code?: string;
    sb_flow_id?: string;
  }>();
  const { mode } = useAppTheme();
  const c = colors[mode];

  useEffect(() => {
    (async () => {
      try {
        if (typeof code === "string" && code) {
          await supabase.auth.exchangeCodeForSession(
            code,
            typeof sb_flow_id === "string" && sb_flow_id
              ? { flowId: sb_flow_id }
              : undefined
          );
        } else {
          // No code (e.g. cold-start re-entry): just pick up any persisted session.
          await supabase.auth.getSession();
        }
      } catch {
        // Exchange failed — drop the user home; the sign-in gate can retry.
      } finally {
        router.replace("/(tabs)");
      }
    })();
  }, [code, sb_flow_id, router]);

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <M3Spinner size={32} tint={c.secondary} />
      <Text style={[styles.label, { color: c.textMuted }]}>Signing you in…</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  label: { fontSize: 14, fontWeight: "600" },
});