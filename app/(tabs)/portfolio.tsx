import { useCallback, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Text, TextInput } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useFocusEffect, useRouter } from "expo-router";
import ScreenHeader from "../../components/ScreenHeader";
import M3Button from "../../components/M3Button";
import M3Skeleton from "../../components/M3Skeleton";
import LockedAccessCard from "../../components/LockedAccessCard";
import { useSignInGate } from "../../components/SignInPrompt";
import {
  deleteCustomStrategy,
  deleteSafeSpaceNote,
  getCustomStrategies,
  getFavourites,
  getSafeSpaceNotes,
  saveCustomStrategy,
  saveSafeSpaceNote,
  type FavouriteRow,
  type NoteRow,
  type StrategyRow,
} from "../../lib/db";
import { useSession } from "../../lib/auth";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";
import { CATEGORY_TOKENS, CATEGORIES, type ExerciseCategory, type MciGlyph } from "../../types/exercise";

/**
 * Portfolio (M3-04) — the user's own "comfort box": favourited exercises,
 * safe-space notes and custom strategies. Three independent lists, each with
 * its own empty state; nothing here is required or scored (S26). Owner-only
 * rows behind RLS; browse-first sign-in at every save (S01).
 *
 * Sections follow the diary's entry-card idiom so the tab reads like the rest
 * of the app. Notes and strategies are editable and deletable — the user
 * controls their own content; deletion is inline-confirm, never an alert.
 */
export default function PortfolioScreen() {
  const router = useRouter();
  const { mode } = useAppTheme();
  const c = colors[mode];
  const { signedIn } = useSession();
  const { gate, prompt } = useSignInGate({
    message: "Sign in with Google to build your portfolio — it stays private to your account.",
  });

  const [loading, setLoading] = useState(true);
  const [favourites, setFavourites] = useState<FavouriteRow[]>([]);
  const [notes, setNotes] = useState<NoteRow[]>([]);
  const [strategies, setStrategies] = useState<StrategyRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  const [noteDraft, setNoteDraft] = useState("");
  const [noteEditId, setNoteEditId] = useState<string | null>(null);
  const [noteOpen, setNoteOpen] = useState(false);
  const [strategyDraft, setStrategyDraft] = useState({ title: "", body: "" });
  const [strategyEditId, setStrategyEditId] = useState<string | null>(null);
  const [strategyOpen, setStrategyOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      const [f, n, s] = await Promise.all([
        getFavourites().catch(() => [] as FavouriteRow[]),
        getSafeSpaceNotes().catch(() => [] as NoteRow[]),
        getCustomStrategies().catch(() => [] as StrategyRow[]),
      ]);
      setFavourites(f);
      setNotes(n);
      setStrategies(s);
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }, []);

  // Reload on every focus: starring an exercise happens on another screen, so
  // a mount-only read would leave this tab showing a stale/empty list.
  useFocusEffect(
    useCallback(() => {
      if (!signedIn) {
        setLoading(false);
        setFavourites([]);
        setNotes([]);
        setStrategies([]);
        return;
      }
      setLoading(true);
      void load();
    }, [signedIn, load]),
  );

  const run = (fn: () => Promise<void>) => {
    if (busy) return;
    gate(() => {
      void (async () => {
        setBusy(true);
        try {
          await fn();
          await load();
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
        } finally {
          setBusy(false);
        }
      })();
    });
  };

  const saveNote = () => {
    const body = noteDraft.trim();
    if (!body) return;
    const id = noteEditId;
    run(async () => {
      await saveSafeSpaceNote(body, id ?? undefined);
      setNoteDraft("");
      setNoteEditId(null);
      setNoteOpen(false);
    });
  };

  const saveStrategy = () => {
    const title = strategyDraft.title.trim();
    if (!title) return;
    const body = strategyDraft.body.trim();
    const id = strategyEditId;
    run(async () => {
      await saveCustomStrategy({ title, body: body || undefined }, id ?? undefined);
      setStrategyDraft({ title: "", body: "" });
      setStrategyEditId(null);
      setStrategyOpen(false);
    });
  };

  // Per-section identity (craft §6 — one hue per meaning). The gold pair flips
  // per mode so the star stays readable; notes and strategies use their own
  // --ex-* pairs in both modes.
  const ACCENTS = {
    favourites: {
      fg: mode === "light" ? c.warmGoldSubtle : c.warmGold,
      medallionBg: mode === "light" ? c.warmGold : c.warmGoldTint,
      medallionFg: mode === "light" ? c.warmGoldTint : c.warmGold,
    },
    notes: { fg: c.exGround, medallionBg: c.exGroundBg, medallionFg: c.exGround },
    strategies: { fg: c.exSelfkind, medallionBg: c.exSelfkindBg, medallionFg: c.exSelfkind },
  } as const;

  /** Section surface: white + hairline edge in light mode (see dashboard). */
  const rowSurface = {
    backgroundColor: mode === "light" ? c.surface2 : c.surface,
    borderWidth: 1,
    borderColor: c.divider,
  };

  const emptyState = (
    icon: MciGlyph,
    title: string,
    body: string,
    accent: (typeof ACCENTS)[keyof typeof ACCENTS],
  ) => (
    <View style={[styles.empty, rowSurface]}>
      <View style={[styles.emptyIcon, { backgroundColor: accent.medallionBg }]}>
        <MaterialCommunityIcons name={icon} size={20} color={accent.medallionFg} />
      </View>
      <Text style={[styles.emptyTitle, { color: c.text }]}>{title}</Text>
      <Text style={[styles.emptyBody, { color: c.textMuted }]}>{body}</Text>
    </View>
  );

  const sectionHeader = (title: string, icon: MciGlyph, count: number, fg: string) => (
    <View style={styles.sectionHead}>
      <MaterialCommunityIcons name={icon} size={18} color={fg} />
      <Text style={[styles.sectionTitle, { color: c.text }]}>{title}</Text>
      {count > 0 ? (
        <View style={[styles.countPill, { backgroundColor: c.surfaceOffset }]}>
          <Text style={[styles.countText, { color: c.textMuted }]}>{count}</Text>
        </View>
      ) : null}
    </View>
  );

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <ScreenHeader title="Portfolio" subtitle="Your personal toolkit" />
      <ScrollView contentContainerStyle={styles.body}>
        {!signedIn ? (
          <LockedAccessCard
            title="Your portfolio lives here"
            message="Favourite exercises, safe-space notes and your own strategies — saved to your account and never shared."
            onSignIn={() => gate(() => undefined)}
          />
        ) : loading ? (
          <>
            <SkeletonList />
            <SkeletonList />
            <SkeletonList />
          </>
        ) : (
          <>
            {error ? <Text style={[styles.error, { color: c.error }]}>{error}</Text> : null}

            {/* ---- Favourites ------------------------------------------------ */}
            {sectionHeader("Favourite exercises", "star", favourites.length, ACCENTS.favourites.fg)}
            {favourites.length === 0
              ? emptyState(
                  "star-outline",
                  "Nothing saved yet",
                  "Tap the star on any exercise to keep it here for quick access.",
                  ACCENTS.favourites,
                )
              : favourites.map((f) => {
                  const key = (f.exercises?.category ?? "mindful") as ExerciseCategory;
                  const t = CATEGORY_TOKENS[key in CATEGORY_TOKENS ? key : "mindful"];
                  const cat = CATEGORIES.find((x) => x.key === key);
                  return (
                    <Pressable
                      key={f.id}
                      onPress={() => router.push(`/exercise/${f.exercise_id}`)}
                      style={[styles.row, rowSurface]}
                      accessibilityRole="button"
                      accessibilityLabel={`Open ${f.exercises?.title ?? "exercise"}`}
                    >
                      <View style={[styles.rowIcon, { backgroundColor: c[t.bg] }]}>
                        <MaterialCommunityIcons name={cat?.icon ?? "meditation"} size={18} color={c[t.fg]} />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.rowTitle, { color: c.text }]} numberOfLines={1}>
                          {f.exercises?.title ?? "Exercise"}
                        </Text>
                        <Text style={[styles.rowMeta, { color: c.textMuted }]}>
                          {cat?.label ?? f.exercises?.category ?? ""}
                          {f.exercises?.duration_minutes ? ` · ~${f.exercises.duration_minutes} min` : ""}
                        </Text>
                      </View>
                      <MaterialCommunityIcons name="chevron-right" size={22} color={c.textMuted} />
                    </Pressable>
                  );
                })}

            {/* ---- Safe-space notes ------------------------------------------ */}
            {sectionHeader("Safe-space notes", "home-heart", notes.length, ACCENTS.notes.fg)}
            {noteOpen ? (
              <View style={[styles.composer, rowSurface]}>
                <TextInput
                  mode="outlined"
                  label="Describe a place that feels safe (optional detail)"
                  value={noteDraft}
                  onChangeText={setNoteDraft}
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                  outlineColor={c.divider}
                  activeOutlineColor={c.secondary}
                  textColor={c.text}
                  theme={{ colors: { onSurfaceVariant: c.textMuted, primary: c.secondary } }}
                />
                <View style={styles.composerActions}>
                  <M3Button
                    label="Cancel"
                    variant="text"
                    color={c.textMuted}
                    onPress={() => {
                      setNoteOpen(false);
                      setNoteDraft("");
                      setNoteEditId(null);
                    }}
                    style={{ flex: 1 }}
                  />
                  <M3Button
                    label={noteEditId ? "Save note" : "Add note"}
                    icon="check"
                    color={c.secondary}
                    onPress={saveNote}
                    disabled={busy || !noteDraft.trim()}
                    style={{ flex: 1.4 }}
                  />
                </View>
              </View>
            ) : (
              <M3Button
                label="Add a safe-space note"
                icon="plus"
                variant="outlined"
                color={c.secondary}
                onPress={() => {
                  setNoteOpen(true);
                  setNoteEditId(null);
                  setNoteDraft("");
                }}
                style={styles.addButton}
              />
            )}
            {notes.length === 0 && !noteOpen
              ? emptyState(
                  "home-heart",
                  "No notes yet",
                  "Jot down what a safe place looks, sounds or feels like — from the workbook's Making Safety Real section.",
                  ACCENTS.notes,
                )
              : notes.map((n) => (
                  <View key={n.id} style={[styles.row, rowSurface]}>
                    <View style={[styles.rowIcon, { backgroundColor: c.exGroundBg }]}>
                      <MaterialCommunityIcons name="home-heart" size={18} color={c.exGround} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, styles.noteBody, { color: c.text }]}>{n.body}</Text>
                      <Text style={[styles.rowMeta, { color: c.textMuted }]}>{relative(n.created_at)}</Text>
                      {confirmDelete === n.id ? (
                        <View style={styles.confirmRow}>
                          <Text style={[styles.confirmText, { color: c.textMuted }]}>Delete this note?</Text>
                          <Pressable onPress={() => setConfirmDelete(null)} accessibilityRole="button">
                            <Text style={[styles.confirmAction, { color: c.textMuted }]}>Keep</Text>
                          </Pressable>
                          <Pressable
                            onPress={() =>
                              run(async () => {
                                await deleteSafeSpaceNote(n.id);
                                setConfirmDelete(null);
                              })
                            }
                            accessibilityRole="button"
                          >
                            <Text style={[styles.confirmAction, { color: c.error }]}>Delete</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <View style={styles.rowActions}>
                          <Pressable
                            onPress={() => {
                              setNoteOpen(true);
                              setNoteEditId(n.id);
                              setNoteDraft(n.body);
                              setConfirmDelete(null);
                            }}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="Edit note"
                          >
                            <MaterialCommunityIcons name="pencil-outline" size={18} color={c.textMuted} />
                          </Pressable>
                          <Pressable
                            onPress={() => setConfirmDelete(n.id)}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="Delete note"
                          >
                            <MaterialCommunityIcons name="trash-can-outline" size={18} color={c.textMuted} />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </View>
                ))}

            {/* ---- Custom strategies ----------------------------------------- */}
            {sectionHeader("Your strategies", "lightbulb-on-outline", strategies.length, ACCENTS.strategies.fg)}
            {strategyOpen ? (
              <View style={[styles.composer, rowSurface]}>
                <TextInput
                  mode="outlined"
                  label="What helps you?"
                  value={strategyDraft.title}
                  onChangeText={(t) => setStrategyDraft((d) => ({ ...d, title: t }))}
                  style={styles.input}
                  outlineColor={c.divider}
                  activeOutlineColor={c.secondary}
                  textColor={c.text}
                  theme={{ colors: { onSurfaceVariant: c.textMuted, primary: c.secondary } }}
                />
                <TextInput
                  mode="outlined"
                  label="How do you do it? (optional)"
                  value={strategyDraft.body}
                  onChangeText={(t) => setStrategyDraft((d) => ({ ...d, body: t }))}
                  multiline
                  numberOfLines={3}
                  style={styles.input}
                  outlineColor={c.divider}
                  activeOutlineColor={c.secondary}
                  textColor={c.text}
                  theme={{ colors: { onSurfaceVariant: c.textMuted, primary: c.secondary } }}
                />
                <View style={styles.composerActions}>
                  <M3Button
                    label="Cancel"
                    variant="text"
                    color={c.textMuted}
                    onPress={() => {
                      setStrategyOpen(false);
                      setStrategyDraft({ title: "", body: "" });
                      setStrategyEditId(null);
                    }}
                    style={{ flex: 1 }}
                  />
                  <M3Button
                    label={strategyEditId ? "Save strategy" : "Add strategy"}
                    icon="check"
                    color={c.secondary}
                    onPress={saveStrategy}
                    disabled={busy || !strategyDraft.title.trim()}
                    style={{ flex: 1.4 }}
                  />
                </View>
              </View>
            ) : (
              <M3Button
                label="Add your own strategy"
                icon="plus"
                variant="outlined"
                color={c.secondary}
                onPress={() => {
                  setStrategyOpen(true);
                  setStrategyEditId(null);
                  setStrategyDraft({ title: "", body: "" });
                }}
                style={styles.addButton}
              />
            )}
            {strategies.length === 0 && !strategyOpen
              ? emptyState(
                  "lightbulb-on-outline",
                  "No strategies yet",
                  "Anything that helps you — a walk, a phrase, a person. Written in your own words, for your own use.",
                  ACCENTS.strategies,
                )
              : strategies.map((s) => (
                  <View key={s.id} style={[styles.row, rowSurface]}>
                    <View style={[styles.rowIcon, { backgroundColor: c.exSelfkindBg }]}>
                      <MaterialCommunityIcons name="lightbulb-on-outline" size={18} color={c.exSelfkind} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.rowTitle, { color: c.text }]}>{s.title}</Text>
                      {s.body ? (
                        <Text style={[styles.noteBody, { color: c.textMuted }]}>{s.body}</Text>
                      ) : null}
                      <Text style={[styles.rowMeta, { color: c.textMuted }]}>{relative(s.created_at)}</Text>
                      {confirmDelete === s.id ? (
                        <View style={styles.confirmRow}>
                          <Text style={[styles.confirmText, { color: c.textMuted }]}>
                            Delete this strategy?
                          </Text>
                          <Pressable onPress={() => setConfirmDelete(null)} accessibilityRole="button">
                            <Text style={[styles.confirmAction, { color: c.textMuted }]}>Keep</Text>
                          </Pressable>
                          <Pressable
                            onPress={() =>
                              run(async () => {
                                await deleteCustomStrategy(s.id);
                                setConfirmDelete(null);
                              })
                            }
                            accessibilityRole="button"
                          >
                            <Text style={[styles.confirmAction, { color: c.error }]}>Delete</Text>
                          </Pressable>
                        </View>
                      ) : (
                        <View style={styles.rowActions}>
                          <Pressable
                            onPress={() => {
                              setStrategyOpen(true);
                              setStrategyEditId(s.id);
                              setStrategyDraft({ title: s.title, body: s.body ?? "" });
                              setConfirmDelete(null);
                            }}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="Edit strategy"
                          >
                            <MaterialCommunityIcons name="pencil-outline" size={18} color={c.textMuted} />
                          </Pressable>
                          <Pressable
                            onPress={() => setConfirmDelete(s.id)}
                            hitSlop={8}
                            accessibilityRole="button"
                            accessibilityLabel="Delete strategy"
                          >
                            <MaterialCommunityIcons name="trash-can-outline" size={18} color={c.textMuted} />
                          </Pressable>
                        </View>
                      )}
                    </View>
                  </View>
                ))}
          </>
        )}
      </ScrollView>
      {prompt}
    </View>
  );
}

function SkeletonList() {
  return (
    <View style={{ marginBottom: 12 }}>
      <M3Skeleton variant="text-multi" width="40%" style={{ marginBottom: 12 }} />
      <M3Skeleton variant="text-multi" width="100%" style={{ marginBottom: 8 }} />
      <M3Skeleton variant="text-multi" width="70%" />
    </View>
  );
}

function relative(iso: string): string {
  const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return d === 1 ? "Yesterday" : `${d}d ago`;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 96 },
  sectionHead: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 22, marginBottom: 10 },
  sectionTitle: { fontSize: 20, lineHeight: 26, fontWeight: "800", letterSpacing: -0.02, flex: 1 },
  countPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3 },
  countText: { fontSize: 12, fontWeight: "700" },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
    borderRadius: 14,
    padding: 14,
    marginBottom: 8,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
  },
  rowTitle: { fontSize: 15, lineHeight: 21, fontWeight: "600" },
  rowMeta: { marginTop: 2, fontSize: 12.5, lineHeight: 17 },
  noteBody: { marginTop: 4, fontSize: 13.5, lineHeight: 20, fontWeight: "400" },
  rowActions: { flexDirection: "row", gap: 18, marginTop: 10 },
  confirmRow: { flexDirection: "row", alignItems: "center", gap: 16, marginTop: 10 },
  confirmText: { fontSize: 12.5, flex: 1 },
  confirmAction: { fontSize: 13, fontWeight: "700" },
  empty: { borderRadius: 14, padding: 18, alignItems: "center", marginBottom: 8 },
  emptyIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  emptyTitle: { fontSize: 15, fontWeight: "700", textAlign: "center" },
  emptyBody: { marginTop: 4, fontSize: 13, lineHeight: 19, textAlign: "center" },
  composer: { borderRadius: 14, padding: 14, marginBottom: 8 },
  input: { backgroundColor: "transparent", marginBottom: 10 },
  composerActions: { flexDirection: "row", gap: 10 },
  addButton: { alignSelf: "stretch", marginBottom: 8 },
  error: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
});
