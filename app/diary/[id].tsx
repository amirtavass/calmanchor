import { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Modal } from "react-native";
import { Text, TextInput } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import M3Button from "../../components/M3Button";
import {
  deleteJournalEntry,
  getJournalEntries,
  updateJournalEntry,
} from "../../lib/db";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";

interface EntryRow {
  id: string;
  created_at: string;
  body: string;
  prompts: { prompt_text: string } | null;
  journal_entry_tags: { tags: { id: string; name: string } }[];
}

/**
 * Single entry view (S19) + edit within the S21 window + delete (S22).
 * The S21 window: an entry created at time T is editable until 23:59:59 of
 * the calendar day after creation. App-level enforcement.
 */
export default function EntryDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { mode } = useAppTheme();
  const c = colors[mode];

  const [entry, setEntry] = useState<EntryRow | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [saving, setSaving] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const rows = await getJournalEntries();
        const found = rows?.find((r: EntryRow) => r.id === id);
        setEntry(found ?? null);
        if (found) setDraft(found.body);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const withinEditWindow = (createdAt: string) => {
    const created = new Date(createdAt);
    const end = new Date(created);
    end.setDate(created.getDate() + 1);
    end.setHours(23, 59, 59, 999);
    return new Date() <= end;
  };

  const canEdit = entry ? withinEditWindow(entry.created_at) : false;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString("en-GB", {
      weekday: "long",
      day: "numeric",
      month: "long",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const saveEdit = async () => {
    if (!entry || !draft.trim() || saving) return;
    setSaving(true);
    try {
      await updateJournalEntry(entry.id, draft.trim());
      setEntry({ ...entry, body: draft.trim() });
      setEditing(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const doDelete = async () => {
    if (!entry || busy) return;
    setBusy(true);
    try {
      await deleteJournalEntry(entry.id);
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setBusy(false);
    }
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      {/* Zone 1 · quiet header */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <View style={styles.side}>
          <M3Button
            label="Back"
            icon="arrow-left"
            variant="text"
            color={c.textMuted}
            onPress={() => router.back()}
          />
        </View>
        <View style={styles.centre}>
          <Text style={[styles.headline, { color: c.text }]}>Entry</Text>
        </View>
        <View style={styles.side} />
      </View>

      {/* Zone 2 · content */}
      <ScrollView contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        {loading ? (
          <Text style={muted(c)}>Loading entry…</Text>
        ) : error && !entry ? (
          <View style={styles.errorBox}>
            <Text style={[muted(c), { color: c.error }]}>Couldn't load this entry. {error}</Text>
            <M3Button label="Go back" onPress={() => router.back()} style={styles.retry} />
          </View>
        ) : !entry ? (
          <View style={styles.errorBox}>
            <Text style={[muted(c), { color: c.textMuted }]}>
              This entry no longer exists, or you don't have access to it.
            </Text>
            <M3Button label="Back to diary" onPress={() => router.back()} style={styles.retry} />
          </View>
        ) : (
          <>
            <View style={[styles.medallion, { backgroundColor: c.exJournalBg }]}>
              <Text style={{ fontSize: 26 }}>✎</Text>
            </View>
            <Text style={[styles.date, { color: c.textMuted }]}>{formatDate(entry.created_at)}</Text>
            {entry.prompts?.prompt_text ? (
              <Text style={[styles.promptRef, { color: c.exJournal }]}>
                {entry.prompts.prompt_text}
              </Text>
            ) : null}

            <View style={[styles.bodyCard, { backgroundColor: c.surface }]}>
              {editing ? (
                <TextInput
                  value={draft}
                  onChangeText={setDraft}
                  placeholder="Write here…"
                  placeholderTextColor={c.textFaint}
                  multiline
                  style={[styles.editInput, { backgroundColor: c.surface, color: c.text }]}
                  underlineColor="transparent"
                  activeUnderlineColor={c.primary}
                  textAlignVertical="top"
                />
              ) : (
                <Text style={[styles.bodyText, { color: c.text }]}>{entry.body}</Text>
              )}
            </View>

            {entry.journal_entry_tags && entry.journal_entry_tags.length > 0 ? (
              <View style={styles.tagsRow}>
                {entry.journal_entry_tags.map((t) => (
                  <View key={t.tags.id} style={[styles.tagChip, { backgroundColor: c.surfaceOffset }]}>
                    <Text style={[styles.tagLabel, { color: c.textMuted }]}>{t.tags.name}</Text>
                  </View>
                ))}
              </View>
            ) : null}

            {error ? (
              <Text style={[styles.inlineError, { color: c.error }]}>Couldn't save: {error}</Text>
            ) : null}
          </>
        )}
      </ScrollView>

      {/* Zone 3 · pinned actions */}
      {entry && !loading ? (
        <View style={[styles.nav, { paddingBottom: insets.bottom + 14, borderTopColor: c.divider }]}>
          {editing ? (
            <>
              <M3Button
                label="Cancel"
                variant="outlined"
                color={c.textMuted}
                onPress={() => {
                  setEditing(false);
                  setDraft(entry.body);
                  setError(null);
                }}
                style={{ flex: 1 }}
              />
              <M3Button
                label={saving ? "Saving…" : "Save changes"}
                icon="check"
                iconRight
                disabled={!draft.trim() || saving}
                onPress={saveEdit}
                style={{ flex: 1.3 }}
              />
            </>
          ) : (
            <>
              <M3Button
                label="Delete"
                icon="delete"
                variant="outlined"
                color={c.error}
                onPress={() => setConfirmDelete(true)}
                style={{ flex: 1 }}
              />
              <M3Button
                label={canEdit ? "Edit" : "Read only"}
                icon={canEdit ? "pencil" : "lock"}
                iconRight
                disabled={!canEdit}
                onPress={() => setEditing(true)}
                style={{ flex: 1.3 }}
              />
            </>
          )}
        </View>
      ) : null}

      {/* Delete confirm (design-system §17 modal) */}
      <Modal
        visible={confirmDelete}
        transparent
        animationType="fade"
        onRequestClose={() => setConfirmDelete(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { backgroundColor: c.surface }]}>
            <Text style={[styles.modalTitle, { color: c.text }]}>Delete this entry?</Text>
            <Text style={[styles.modalBody, { color: c.textMuted }]}>
              This cannot be undone. Deleting one entry won't affect any other record.
            </Text>
            <View style={styles.modalActions}>
              <M3Button
                label="Cancel"
                variant="outlined"
                color={c.textMuted}
                onPress={() => setConfirmDelete(false)}
                style={{ flex: 1 }}
              />
              <M3Button
                label={busy ? "Deleting…" : "Delete"}
                variant="filled"
                color={c.error}
                onPress={doDelete}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const muted = (c: typeof colors.light) => ({ color: c.textMuted, opacity: 0.85 });

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  side: { width: 90, alignItems: "flex-start", justifyContent: "center" },
  centre: { flex: 1, alignItems: "center" },
  headline: { fontSize: 16, lineHeight: 24, fontWeight: "700" },
  body: { padding: 20, paddingBottom: 32 },
  medallion: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 10,
  },
  date: { textAlign: "center", fontSize: 13, lineHeight: 18, opacity: 0.85 },
  promptRef: { textAlign: "center", fontSize: 13, lineHeight: 18, fontWeight: "600", marginTop: 4 },
  bodyCard: { borderRadius: 16, padding: 18, marginTop: 18 },
  bodyText: { fontSize: 15.5, lineHeight: 24 },
  editInput: { minHeight: 160, borderRadius: 12, paddingHorizontal: 12, fontSize: 15.5, lineHeight: 24 },
  tagsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 14 },
  tagChip: { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 5 },
  tagLabel: { fontSize: 12.5, lineHeight: 18, fontWeight: "600" },
  nav: {
    flexDirection: "row",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  inlineError: { marginTop: 12, fontSize: 13, lineHeight: 18 },
  errorBox: { paddingVertical: 24, alignItems: "center" },
  retry: { marginTop: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
  },
  modalCard: { width: "100%", borderRadius: 16, padding: 20 },
  modalTitle: { fontSize: 18, lineHeight: 26, fontWeight: "800" },
  modalBody: { marginTop: 6, fontSize: 14, lineHeight: 20 },
  modalActions: { flexDirection: "row", gap: 12, marginTop: 20 },
});