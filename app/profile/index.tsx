import { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Image } from "react-native";
import { Text } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import M3Button from "../../components/M3Button";
import M3Card from "../../components/M3Card";
import { useSession, signOut, signInWithGoogle } from "../../lib/auth";
import { getCurrentUser, getResearchProfile } from "../../lib/db";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";

/**
 * Profile stack — Phase A (A3/A5). Shows the signed-in Google identity
 * (display name, email, avatar), a live sign-in / sign-out control, and the
 * research-profile state (answered / not yet). Identity is read from the
 * `users` table (28 Aug §5); avatar comes from Google `user_metadata.picture`.
 * Browse-first: when signed out the screen is a simple sign-in card.
 */
export default function ProfileIndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const c = colors[mode];

  const { signedIn, user, loading: sessionLoading } = useSession();
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [email, setEmail] = useState<string | null>(null);
  const [researchDone, setResearchDone] = useState<boolean | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!signedIn) {
      setDisplayName(null);
      setEmail(null);
      setResearchDone(null);
      return;
    }
    (async () => {
      try {
        const u = await getCurrentUser();
        setDisplayName(u?.display_name ?? null);
        setEmail(u?.email ?? null);
      } catch {
        // Non-critical identity read.
      }
      try {
        const p = await getResearchProfile();
        setResearchDone(p !== null);
      } catch {
        // Non-critical — prompt stays visible if we can't confirm.
      }
    })();
  }, [signedIn, user?.id]);

  const avatarUrl =
    (user?.user_metadata?.avatar_url as string | undefined) ??
    (user?.user_metadata?.picture as string | undefined) ??
    null;
  const name = displayName ?? (user?.user_metadata?.full_name as string | undefined) ?? null;

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      {/* Zone 1 · quiet header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <View style={styles.side}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={[styles.iconBtn, { backgroundColor: c.surfaceOffset }]}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={c.text} />
          </Pressable>
        </View>
        <View style={styles.centre}>
          <Text style={[styles.headline, { color: c.text }]}>Profile</Text>
        </View>
        <View style={[styles.side, styles.right]} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        {sessionLoading ? null : signedIn ? (
          <>
            {/* Identity card */}
            <View style={[styles.identityCard, { backgroundColor: c.surface }]}>
              {avatarUrl ? (
                <Image
                  source={{ uri: avatarUrl }}
                  style={[styles.avatarImage, { backgroundColor: c.surfaceOffset }]}
                  accessibilityLabel="Google profile photo"
                />
              ) : (
                <View style={[styles.avatarWrap, { backgroundColor: c.surfaceOffset }]}>
                  <Text style={[styles.avatarInitial, { color: c.secondary }]}>
                    {(name ?? "?").charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View style={{ flex: 1 }}>
                <Text style={[styles.identityName, { color: c.text }]}>{name ?? "Signed in"}</Text>
                {email ? (
                  <Text style={[styles.identityEmail, { color: c.textMuted }]}>{email}</Text>
                ) : null}
              </View>
              <MaterialCommunityIcons name="google" size={18} color={c.textMuted} />
            </View>

            {/* Research profile (S03) */}
            <View style={[styles.sectionCard, { backgroundColor: c.surface }]}>
              <View style={styles.sectionHead}>
                <View style={[styles.sectionIcon, { backgroundColor: c.exJournalBg }]}>
                  <MaterialCommunityIcons name="account-heart-outline" size={20} color={c.exJournal} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sectionTitle, { color: c.text }]}>Research profile</Text>
                  <Text style={[styles.sectionSub, { color: c.textMuted }]}>
                    {researchDone === true
                      ? "Answered — thanks for helping us understand."
                      : researchDone === false
                      ? "A few optional questions, asked once."
                      : "Loading…"}
                  </Text>
                </View>
              </View>
              {researchDone === false ? (
                <M3Button
                  label="Answer now"
                  icon="arrow-right"
                  iconRight
                  color={c.exJournal}
                  onPress={() => router.push("/profile/questions")}
                  style={{ marginTop: 14 }}
                />
              ) : null}
            </View>

            {/* Sign out */}
            <M3Button
              label={busy ? "Signing out…" : "Sign out"}
              variant="outlined"
              color={c.error}
              icon="logout"
              onPress={async () => {
                setBusy(true);
                try {
                  await signOut();
                } finally {
                  setBusy(false);
                }
              }}
              style={{ marginTop: 18 }}
            />
          </>
        ) : (
          /* Signed out — browse-first sign-in card */
          <View style={styles.signedOut}>
            <View style={[styles.signedOutMedallion, { backgroundColor: c.secondaryTint }]}>
              <MaterialCommunityIcons name="google" size={32} color={c.secondary} />
            </View>
            <Text style={[styles.signedOutTitle, { color: c.text }]}>Sign in with Google</Text>
            <Text style={[styles.signedOutBody, { color: c.textMuted }]}>
              Your exercises, journal and check-ins stay private to your account. You can browse
              everything without an account.
            </Text>
            <M3Button
              label={busy ? "Signing in…" : "Sign in with Google"}
              icon="google"
              iconRight
              color={c.secondaryActive}
              onPress={async () => {
                setBusy(true);
                try {
                  await signInWithGoogle();
                } finally {
                  setBusy(false);
                }
              }}
              style={{ marginTop: 20, alignSelf: "stretch" }}
            />
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  side: { width: 72, alignItems: "flex-start", justifyContent: "center" },
  right: { alignItems: "flex-end" },
  centre: { flex: 1, alignItems: "center" },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headline: { fontSize: 16, lineHeight: 24, fontWeight: "700" },
  body: { padding: 20, paddingBottom: 32 },
  identityCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    padding: 16,
  },
  avatarWrap: {
    width: 52,
    height: 52,
    borderRadius: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImage: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },
  avatarInitial: { fontSize: 22, fontWeight: "800" },
  identityName: { fontSize: 17, fontWeight: "800", lineHeight: 23 },
  identityEmail: { fontSize: 13.5, marginTop: 2, lineHeight: 18 },
  sectionCard: { borderRadius: 16, padding: 16, marginTop: 14 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 12 },
  sectionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  sectionTitle: { fontSize: 15, fontWeight: "800", lineHeight: 21 },
  sectionSub: { fontSize: 12.5, marginTop: 2, lineHeight: 18 },
  signedOut: { alignItems: "center", paddingTop: 40, paddingHorizontal: 8 },
  signedOutMedallion: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  signedOutTitle: { fontSize: 20, fontWeight: "800", marginTop: 16, textAlign: "center" },
  signedOutBody: {
    marginTop: 8,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
});