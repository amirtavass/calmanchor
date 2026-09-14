import { useEffect, useMemo, useState } from "react";
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Pressable,
} from "react-native";
import { Text, TextInput } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import M3Button from "../../components/M3Button";
import { getPrompts, saveJournalEntry } from "../../lib/db";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";

interface Prompt {
  id: string;
  prompt_text: string;
}

/**
 * Compose a journal entry (S19) — optional workbook prompt (S23) + free-text
 * body + save. Craft §1/§12: quiet header, KeyboardAvoidingView, pinned Save.
 * Sign-in is prompted by saveJournalEntry at the moment of saving (S01).
 *
 * The prompt is presented as the *placeholder* of the TextInput. A small
 * horizontal prompt picker below the input lets the user swap the placeholder;
 * the picker hides itself once the user starts typing so the field gets the
 * full keyboard real-estate. Header carries a back button (top-left) + Leave
 * (top-right) so the entry can be discarded from either side.
 */
export default function NewEntryScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ prompt?: string }>();
  const { mode } = useAppTheme();
  const c = colors[mode];

  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [promptId, setPromptId] = useState<string | null>(params.prompt ?? null);
  const [body, setBody] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pickerOpen, setPickerOpen] = useState<boolean>(true);

  useEffect(() => {
    (async () => {
      try {
        const p = await getPrompts();
        setPrompts(p ?? []);
      } catch {
        // Prompt list is optional — a blank entry is fine (S19).
      }
    })();
  }, []);

  const selectedPrompt = useMemo(
    () => prompts.find((p) => p.id === promptId) ?? null,
    [prompts, promptId],
  );

  const placeholder = selectedPrompt?.prompt_text ?? "Write here…";

  // Hide the picker as soon as the user has meaningful text — gives the
  // keyboard and the text field the full width.
  useEffect(() => {
    if (body.trim().length > 0 && pickerOpen) setPickerOpen(false);
  }, [body, pickerOpen]);

  const save = async () => {
    if (!body.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      await saveJournalEntry({ body: body.trim(), prompt_id: promptId });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: c.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      {/* Zone 1 · quiet header (back · title · Leave) */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <View style={styles.side}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Back"
            testID="new-entry-back"
            style={[styles.iconBtn, { backgroundColor: c.surfaceOffset }]}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={c.text} />
          </Pressable>
        </View>
        <View style={styles.centre}>
          <Text style={[styles.headline, { color: c.text }]}>New entry</Text>
        </View>
        <View style={[styles.side, styles.right]}>
          <M3Button
            label="Leave"
            variant="text"
            color={c.textMuted}
            onPress={() => router.back()}
          />
        </View>
      </View>

      {/* Zone 2 · content */}
      <ScrollView
        contentContainerStyle={styles.body}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        automaticallyAdjustKeyboardInsets
      >
        <View style={styles.centered}>
          {/* Prompts are optional — explicit, prominent notice. */}
          <View style={[styles.infoBadge, { backgroundColor: c.exJournalBg }]}>
            <MaterialCommunityIcons name="information-outline" size={14} color={c.exJournal} />
            <Text style={[styles.infoBadgeText, { color: c.exJournal }]}>
              Prompts are optional — write whatever feels right.
            </Text>
          </View>

          {/* TextInput — the selected prompt becomes its placeholder. */}
          <View style={[styles.inputPanel, { backgroundColor: c.surface, borderColor: c.border }]}>
            {selectedPrompt ? (
              <View style={styles.inputHead}>
                <View style={[styles.inputKickerWrap, { backgroundColor: c.exJournalBg }]}>
                  <MaterialCommunityIcons name="lightbulb-on-outline" size={12} color={c.exJournal} />
                  <Text style={[styles.inputKicker, { color: c.exJournal }]}>Prompt</Text>
                </View>
                <Pressable
                  onPress={() => setPromptId(null)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel="Remove prompt"
                >
                  <MaterialCommunityIcons name="close" size={16} color={c.textMuted} />
                </Pressable>
              </View>
            ) : null}
            <TextInput
              value={body}
              onChangeText={setBody}
              placeholder={placeholder}
              placeholderTextColor={selectedPrompt ? c.secondary : c.textMuted}
              multiline
              style={[styles.input, { color: c.text, backgroundColor: "transparent" }]}
              underlineColor="transparent"
              activeUnderlineColor="transparent"
              textAlignVertical="top"
              autoFocus
            />
          </View>

          {/* Prompt picker — collapses when user starts writing, expands on tap. */}
          {prompts.length > 0 ? (
            <View style={styles.pickerWrap}>
              <Pressable
                onPress={() => setPickerOpen((v) => !v)}
                style={styles.pickerToggle}
                accessibilityRole="button"
                accessibilityLabel={pickerOpen ? "Hide prompts" : "Show prompts"}
              >
                <MaterialCommunityIcons
                  name={pickerOpen ? "chevron-up" : "lightbulb-on-outline"}
                  size={16}
                  color={c.exJournal}
                />
                <Text style={[styles.pickerToggleText, { color: c.exJournal }]}>
                  {pickerOpen
                    ? "Hide prompts"
                    : selectedPrompt
                    ? "Change prompt"
                    : "Try a prompt"}
                </Text>
              </Pressable>
              {pickerOpen ? (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.promptRow}
                  keyboardShouldPersistTaps="handled"
                >
                  {prompts.map((p) => {
                    const selected = promptId === p.id;
                    return (
                      <Pressable
                        key={p.id}
                        onPress={() => {
                          setPromptId(selected ? null : p.id);
                          setPickerOpen(true);
                        }}
                        style={[
                          styles.promptChip,
                          {
                            backgroundColor: selected ? c.exJournal : c.surfaceOffset,
                            borderColor: selected ? c.exJournal : c.divider,
                          },
                        ]}
                        accessibilityRole="button"
                        accessibilityState={{ selected }}
                        accessibilityLabel={p.prompt_text}
                      >
                        <Text
                          style={[
                            styles.promptChipLabel,
                            { color: selected ? c.textInverse : c.text },
                          ]}
                          numberOfLines={1}
                        >
                          {p.prompt_text.length > 34
                            ? `${p.prompt_text.slice(0, 34)}…`
                            : p.prompt_text}
                        </Text>
                      </Pressable>
                    );
                  })}
                </ScrollView>
              ) : null}
            </View>
          ) : null}
        </View>
      </ScrollView>

      {/* Zone 3 · pinned actions */}
      <View
        style={[styles.nav, { paddingBottom: insets.bottom + 14, borderTopColor: c.divider }]}
      >
        <M3Button
          label={saving ? "Saving…" : "Save entry"}
          icon="check"
          iconRight
          color={c.secondary}
          disabled={!body.trim() || saving}
          onPress={save}
          style={{ flex: 1.3 }}
        />
      </View>
      {error ? (
        <Text style={[styles.errorText, { color: c.error }]}>Couldn't save: {error}</Text>
      ) : null}
    </KeyboardAvoidingView>
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
  body: { padding: 20, paddingBottom: 32, flexGrow: 1 },
  centered: { alignItems: "stretch", width: "100%", marginTop: "auto", marginBottom: "auto" },

  infoBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    marginTop: 8,
  },
  infoBadgeText: { flex: 1, fontSize: 12.5, lineHeight: 18, fontWeight: "700" },

  // --- Input + prompt-as-placeholder ----------------------------------------
  inputPanel: {
    width: "100%",
    borderRadius: 18,
    padding: 16,
    marginTop: 18,
    borderWidth: 1,
  },
  inputHead: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  inputKickerWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  inputKicker: { fontSize: 10.5, fontWeight: "800", letterSpacing: 0.5, textTransform: "uppercase" },
  input: {
    minHeight: 220,
    borderRadius: 12,
    paddingHorizontal: 0,
    fontSize: 16,
    lineHeight: 24,
  },

  // --- Prompt picker (collapsible) -------------------------------------------
  pickerWrap: { marginTop: 14 },
  pickerToggle: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  pickerToggleText: { fontSize: 13, fontWeight: "700" },
  promptRow: { flexDirection: "row", gap: 8, paddingRight: 8, marginTop: 6 },
  promptChip: {
    borderRadius: 8,
    borderWidth: 1.5,
    paddingHorizontal: 14,
    paddingVertical: 10,
    maxWidth: 240,
  },
  promptChipLabel: { fontSize: 13.5, lineHeight: 19, fontWeight: "600" },

  nav: {
    flexDirection: "row",
    justifyContent: "center",
    gap: 12,
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
  },
  errorText: { paddingHorizontal: 20, paddingBottom: 8, fontSize: 13, lineHeight: 18 },
});
