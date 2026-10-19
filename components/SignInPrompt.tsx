import { useRef, useState } from "react";
import { Modal, StyleSheet, View, Pressable } from "react-native";
import { Text } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAppTheme } from "../theme/ThemeContext";
import { colors } from "../theme/tokens";
import M3Button from "./M3Button";
import M3Spinner from "./M3Spinner";
import { signInWithGoogle, useSession } from "../lib/auth";

/**
 * Sign-in gate (A4) — the soft two-step flow that replaces the old "throws"
 * path (28 Aug §6; S01: sign-up is triggered at the first exercise attempt).
 *
 * `useSignInGate()` gives a screen:
 *   const { gate, prompt } = useSignInGate();
 *   gate(() => startExercise());   // runs immediately if signed in, else prompts
 *   ...render {prompt} once...
 *
 * When signed out the user sees a friendly card: "Sign in with Google to save
 * your progress" → Not now (dismiss) or Sign in with Google → `signInWithGoogle()`
 * → on success the gated action runs. Uses `useSession()` for live state, so the
 * gate reads the real session rather than a stale local flag.
 *
 * Visual: design-system §19 / craft §10.4 — a quiet modal card on a dimmed
 * backdrop, colour-field medallion, supportive copy, two M3Buttons.
 */

export function useSignInGate(options?: {
  title?: string;
  message?: string;
  confirmLabel?: string;
}) {
  const { signedIn } = useSession();
  const [visible, setVisible] = useState(false);
  const [busy, setBusy] = useState(false);
  const pending = useRef<(() => void) | null>(null);

  const gate = (action: () => void) => {
    if (signedIn) {
      action();
      return;
    }
    pending.current = action;
    setVisible(true);
  };

  const confirm = async () => {
    setBusy(true);
    try {
      const id = await signInWithGoogle();
      if (id && pending.current) {
        const run = pending.current;
        pending.current = null;
        setVisible(false);
        run();
      }
      // Cancelled / no session: keep the card open so the user can retry or
      // dismiss — never silently drop their intent.
    } finally {
      setBusy(false);
    }
  };

  const dismiss = () => {
    setVisible(false);
    pending.current = null;
  };

  const prompt = (
    <SignInPrompt
      visible={visible}
      busy={busy}
      title={options?.title}
      message={options?.message}
      confirmLabel={options?.confirmLabel}
      onConfirm={confirm}
      onDismiss={dismiss}
    />
  );

  return { gate, prompt, signedIn };
}

export default function SignInPrompt({
  visible,
  busy,
  title,
  message,
  confirmLabel,
  onConfirm,
  onDismiss,
}: {
  visible: boolean;
  busy: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  onConfirm: () => void;
  onDismiss: () => void;
}) {
  const { mode } = useAppTheme();
  const c = colors[mode];

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable
          style={[styles.card, { backgroundColor: c.surface }]}
          onPress={(e) => e.stopPropagation()}
          accessibilityViewIsModal
        >
          {/* Google sign-in badge — white circle + brand-blue G (Google's own
              button branding), not a theme-tinted icon. */}
          <View style={styles.medallion}>
            <MaterialCommunityIcons name="google" size={30} color="#4285F4" />
          </View>

          <Text style={[styles.title, { color: c.text }]}>
            {title ?? "Sign in"}
          </Text>
          <Text style={[styles.message, { color: c.textMuted }]}>
            {message ?? "Sign in to save your progress — your exercises, journal and check-ins stay private to your account."}
          </Text>

          <View style={styles.actions}>
            <M3Button
              label="Not now"
              variant="text"
              color={c.textMuted}
              onPress={onDismiss}
              disabled={busy}
              style={{ flex: 1 }}
            />
            <M3Button
              label={busy ? "Signing in…" : (confirmLabel ?? "Sign in")}
              icon={busy ? undefined : "google"}
              color={c.secondaryActive}
              onPress={onConfirm}
              disabled={busy}
              style={{ flex: 1.6 }}
            />
          </View>
          {busy ? (
            <View style={styles.busyRow}>
              <M3Spinner size={14} tint={c.textMuted} />
              <Text style={[styles.busyText, { color: c.textMuted }]}>
                Opening Google…
              </Text>
            </View>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(10, 12, 8, 0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  card: {
    width: "100%",
    maxWidth: 360,
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
  },
  medallion: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#DADCE0",
  },
  title: { fontSize: 18, fontWeight: "800", textAlign: "center", letterSpacing: -0.2 },
  message: { marginTop: 8, fontSize: 14, lineHeight: 21, textAlign: "center" },
  actions: { flexDirection: "row", gap: 12, marginTop: 22, width: "100%" },
  busyRow: { flexDirection: "row", alignItems: "center", gap: 6, marginTop: 12 },
  busyText: { fontSize: 12.5 },
});