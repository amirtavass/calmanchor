import { useEffect, useState } from "react";
import type { ComponentProps } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Text } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useFocusEffect } from "expo-router";
import ScreenHeader from "../../components/ScreenHeader";
import M3Button from "../../components/M3Button";
import M3Card from "../../components/M3Card";
import M3Skeleton from "../../components/M3Skeleton";
import { getJournalEntries, getPrompts } from "../../lib/db";
import { isSignedIn } from "../../lib/auth";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";

type MciGlyph = ComponentProps<typeof MaterialCommunityIcons>["name"];

// Distinct icons per prompt card so they don't all read as the same row
// (rotates if there are more prompts than icons).
const PROMPT_ICONS: MciGlyph[] = [
  "notebook-heart-outline",
  "meditation",
  "flower-tulip-outline",
  "book-open-page-variant-outline",
  "thought-bubble-outline",
  "candle",
];

interface Prompt {
  id: string;
  prompt_text: string;
  chapter_id: string | null;
}

interface JournalEntryRow {
  id: string;
  created_at: string;
  body: string;
  prompts: { prompt_text: string } | null;
  journal_entry_tags: { tags: { id: string; name: string } }[];
}

/**
 * Diary tab — the journal (S19–S24). Design-system §17 empty state + §18
 * list/chip idiom, per craft §5 (text never bare) and §6 (journal = exJournal
 * purple, the warm-olive journal card tone). Browse-first: prompts are public;
 * entries load only when signed in (S01).
 */
export default function DiaryScreen() {
  const router = useRouter();
  const { mode } = useAppTheme();
  const c = colors[mode];

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [entries, setEntries] = useState<JournalEntryRow[] | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const p = await getPrompts();
        setPrompts(p ?? []);
      } catch {
        // Prompts are content; if they fail the rest still works.
      }
    })();
  }, []);

  useFocusEffect(() => {
    (async () => {
      const ok = await isSignedIn();
      setSignedIn(ok);
      if (!ok) {
        setLoading(false);
        return;
      }
      try {
        const j = await getJournalEntries();
        setEntries(j ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  });

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    const today = new Date();
    const yest = new Date();
    yest.setDate(today.getDate() - 1);
    const same = (a: Date, b: Date) =>
      a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
    if (same(d, today)) return "Today";
    if (same(d, yest)) return "Yesterday";
    return d.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  };

  const entryTitle = (e: JournalEntryRow) => {
    if (e.prompts?.prompt_text) return e.prompts.prompt_text;
    const firstLine = e.body.split("\n")[0].trim();
    return firstLine.length > 60 ? `${firstLine.slice(0, 60)}…` : firstLine || "Untitled entry";
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <ScreenHeader title="Diary" subtitle="Reflect in your own words" />
      <ScrollView contentContainerStyle={styles.body}>
        {/* Primary action */}
        <M3Button
          label="Write a new entry"
          icon="notebook-edit-outline"
          iconRight
          color={c.secondary}
          onPress={() => router.push("/diary/new")}
          style={styles.writeBtn}
        />

        {/* Reflection prompts (S23) — distinct icon + kicker per card */}
        {prompts.length > 0 ? (
          <>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Reflection prompts</Text>
            {prompts.map((p, i) => (
              <M3Card
                key={p.id}
                fill={c.exJournalBg}
                style={styles.promptCard}
                onPress={() => router.push({ pathname: "/diary/new", params: { prompt: p.id } })}
              >
                <View style={styles.promptRow}>
                  <View style={[styles.promptIcon, { backgroundColor: c.exJournal }]}>
                    <MaterialCommunityIcons
                      name={PROMPT_ICONS[i % PROMPT_ICONS.length]}
                      size={20}
                      color={c.textInverse}
                    />
                  </View>
                  <View style={{ flex: 1, gap: 2 }}>
                    <Text style={[styles.promptKicker, { color: c.exJournal }]}>Prompt</Text>
                    <Text style={[styles.promptText, { color: c.text }]}>{p.prompt_text}</Text>
                  </View>
                  <MaterialCommunityIcons name="chevron-right" size={18} color={c.exJournal} />
                </View>
              </M3Card>
            ))}
          </>
        ) : null}

        {/* Your entries (S19/S20/S21/S24) */}
        <Text style={[styles.sectionTitle, { color: c.text }]}>Your entries</Text>

        {loading ? (
          <>
            <M3Card style={styles.promptCard}>
              <View style={styles.promptRow}>
                <M3Skeleton variant="avatar" />
                <View style={{ flex: 1, gap: 6 }}>
                  <M3Skeleton variant="text-multi" width="30%" />
                  <M3Skeleton variant="text-multi" width="90%" />
                </View>
              </View>
            </M3Card>
            <M3Card style={styles.promptCard}>
              <View style={styles.promptRow}>
                <M3Skeleton variant="avatar" />
                <View style={{ flex: 1, gap: 6 }}>
                  <M3Skeleton variant="text-multi" width="30%" />
                  <M3Skeleton variant="text-multi" width="80%" />
                </View>
              </View>
            </M3Card>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Your entries</Text>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.entryCard, { backgroundColor: c.surface }]}>
                <M3Skeleton variant="avatar" />
                <View style={styles.entryText}>
                  <M3Skeleton variant="text-multi" width="80%" />
                  <M3Skeleton variant="text-multi" width="40%" style={{ marginTop: 6 }} />
                </View>
                <M3Skeleton variant="block" style={{ width: 16, height: 16, borderRadius: 4 }} />
              </View>
            ))}
          </>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={[muted(c), { color: c.error }]}>Couldn't load your entries. {error}</Text>
            <M3Button label="Retry" onPress={() => setError(null)} style={styles.retry} />
          </View>
        ) : !signedIn ? (
          <View style={[styles.gentleCard, { backgroundColor: c.surface }]}>
            <View style={[styles.gentleIcon, { backgroundColor: c.primaryTint }]}>
              <MaterialCommunityIcons name="shield-account" size={20} color={c.primary} />
            </View>
            <Text style={[styles.gentleTitle, { color: c.text }]}>
              Your journal is private to you
            </Text>
            <Text style={[styles.gentleBody, muted(c)]}>
              Sign in to see your entries. You can still start writing — you'll be asked
              when you save.
            </Text>
          </View>
        ) : entries && entries.length === 0 ? (
          <View style={styles.emptyState}>
            <View style={[styles.emptyMedallion, { backgroundColor: c.exJournalBg }]}>
              <MaterialCommunityIcons name="notebook-outline" size={32} color={c.exJournal} />
            </View>
            <Text style={[styles.emptyTitle, { color: c.text }]}>No journal entries yet</Text>
            <Text style={[styles.emptyDesc, muted(c)]}>
              Start writing about your feelings to see them here. Your first entry is the
              hardest.
            </Text>
          </View>
        ) : (
          (entries ?? []).map((e) => (
            <Pressable
              key={e.id}
              onPress={() => router.push(`/diary/${e.id}`)}
              accessibilityRole="button"
              accessibilityLabel={entryTitle(e)}
              style={({ pressed }) => [
                styles.entryCard,
                { backgroundColor: c.surface },
                pressed && { opacity: 0.85 },
              ]}
            >
              <View style={[styles.entryIcon, { backgroundColor: c.exJournalBg }]}>
                <MaterialCommunityIcons name="notebook-edit-outline" size={18} color={c.exJournal} />
              </View>
              <View style={styles.entryText}>
                <Text style={[styles.entryTitle, { color: c.text }]} numberOfLines={2}>
                  {entryTitle(e)}
                </Text>
                <Text style={[styles.entryMeta, { color: c.textMuted }]}>
                  {formatDate(e.created_at)}
                  {e.journal_entry_tags && e.journal_entry_tags.length > 0
                    ? ` · ${e.journal_entry_tags.map((t) => t.tags.name).join(", ")}`
                    : ""}
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={c.textMuted} />
            </Pressable>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const muted = (c: typeof colors.light) => ({ color: c.textMuted, opacity: 0.85 });

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 96 },
  writeBtn: { marginBottom: 8 },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 8,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    letterSpacing: -0.02,
  },
  promptCard: { marginBottom: 8 },
  promptRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  promptIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  promptKicker: {
    fontSize: 11,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    opacity: 0.9,
  },
  promptText: { flex: 1, fontSize: 15, lineHeight: 22, fontWeight: "600" },
  gentleCard: { borderRadius: 16, padding: 18, alignItems: "flex-start" },
  gentleIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  gentleTitle: { fontSize: 16, lineHeight: 24, fontWeight: "700" },
  gentleBody: { marginTop: 4, fontSize: 14, lineHeight: 20 },
  emptyState: { alignItems: "center", paddingVertical: 20 },
  emptyMedallion: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 18, lineHeight: 26, fontWeight: "800", textAlign: "center" },
  emptyDesc: { marginTop: 6, fontSize: 14, lineHeight: 20, textAlign: "center", maxWidth: 280 },
  entryCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  entryIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  entryText: { flex: 1 },
  entryTitle: { fontSize: 15, lineHeight: 21, fontWeight: "600" },
  entryMeta: { marginTop: 2, fontSize: 13, lineHeight: 18, opacity: 0.85 },
  errorBox: { paddingVertical: 24, alignItems: "center" },
  retry: { marginTop: 12 },
});