import { useState } from "react";
import type { ComponentProps } from "react";
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Pressable } from "react-native";
import { Text, TextInput } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import M3Button from "../../components/M3Button";
import { useSignInGate } from "../../components/SignInPrompt";
import { saveCheckin } from "../../lib/db";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";

type MciGlyph = ComponentProps<typeof MaterialCommunityIcons>["name"];
type TokenKey = keyof typeof colors.light;

/**
 * Trigger tracker (M2-05) — log a trigger with an optional state + note.
 * Browse-first (S01): the form is free to fill in; sign-in is prompted by
 * saveCheckin at the moment of saving. A single check-in row holds the
 * trigger name(s) + ns_state + survival_response + note (schema: checkins).
 * Craft §1/§12: quiet header, KAV, pinned Save.
 */

const NS_OPTIONS = [
  { key: "window", label: "In window", icon: "leaf" as MciGlyph, fg: "nsWindow", bg: "nsWindowBg" },
  { key: "hyper", label: "Hyper", icon: "flash" as MciGlyph, fg: "nsHyper", bg: "nsHyperBg" },
  { key: "hypo", label: "Hypo", icon: "snowflake" as MciGlyph, fg: "nsHypo", bg: "nsHypoBg" },
] as const;

const SR_OPTIONS = [
  { key: "fight", label: "Fight", icon: "flash" as MciGlyph, fg: "srFight", bg: "srFightBg" },
  { key: "flight", label: "Flight", icon: "run" as MciGlyph, fg: "srFlight", bg: "srFlightBg" },
  { key: "freeze", label: "Freeze", icon: "snowflake" as MciGlyph, fg: "srFreeze", bg: "srFreezeBg" },
  { key: "fawn", label: "Fawn", icon: "handshake" as MciGlyph, fg: "srFawn", bg: "srFawnBg" },
] as const;

export default function TriggerScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const c = colors[mode];

  const [name, setName] = useState("");
  const [ns, setNs] = useState<string | null>(null);
  const [sr, setSr] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // A4: sign-in gate at save (S01). Logging a trigger is user-scoped — the soft
  // card prompts Google sign-in instead of a throw.
  const { gate: gateSave, prompt: signInPrompt } = useSignInGate({
    message: "Sign in with Google to save your trigger — it stays private to your account.",
  });

  const save = async () => {
    if (!name.trim() || saving) return;
    setSaving(true);
    setError(null);
    try {
      await saveCheckin({
        triggers: [name.trim()],
        ns_state: ns ?? undefined,
        survival_response: sr ?? undefined,
        note: note.trim() || undefined,
      });
      router.back();
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
      setSaving(false);
    }
  };

  const picker = <K extends string>({
    options,
    value,
    onSelect,
  }: {
    options: readonly { key: K; label: string; icon: MciGlyph; fg: TokenKey; bg: TokenKey }[];
    value: K | null;
    onSelect: (k: K | null) => void;
  }) => (
    <View style={styles.pickerRow}>
      {options.map((o) => {
        const selected = value === o.key;
        const fg = c[o.fg];
        const bg = c[o.bg];
        return (
          <Pressable
            key={o.key}
            onPress={() => onSelect(selected ? null : o.key)}
            style={[
              styles.option,
              {
                backgroundColor: selected ? fg : bg,
                borderColor: fg,
                borderWidth: selected ? 2 : 1,
              },
            ]}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={o.label}
          >
            <MaterialCommunityIcons
              name={o.icon}
              size={18}
              color={selected ? c.textInverse : fg}
            />
            <Text
              style={[styles.optionLabel, { color: selected ? c.textInverse : fg }]}
            >
              {o.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={[styles.root, { backgroundColor: c.bg }]}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
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
          <Text style={[styles.headline, { color: c.text }]}>Log a trigger</Text>
        </View>
        <View style={[styles.side, styles.right]}>
          <M3Button label="Leave" variant="text" color={c.textMuted} onPress={() => router.back()} />
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
          <View style={[styles.infoBadge, { backgroundColor: c.exGroundBg }]}>
            <MaterialCommunityIcons name="crosshairs-question" size={14} color={c.exGround} />
            <Text style={[styles.infoBadgeText, { color: c.exGround }]}>
              Noticing what triggers you helps you see patterns — nothing here is judged.
            </Text>
          </View>

          <View style={[styles.panel, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.fieldLabel, { color: c.text }]}>What triggered you?</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. a crowded room, a smell, a word…"
              placeholderTextColor={c.textMuted}
              style={[styles.input, { backgroundColor: "transparent", color: c.text }]}
              underlineColor="transparent"
              activeUnderlineColor={c.secondary}
              autoFocus
            />
          </View>

          <View style={[styles.panel, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.fieldLabel, { color: c.text }]}>
              How does your body feel? <Text style={[styles.optional, { color: c.textFaint }]}>(optional)</Text>
            </Text>
            {picker({ options: NS_OPTIONS, value: ns, onSelect: setNs })}
          </View>

          <View style={[styles.panel, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.fieldLabel, { color: c.text }]}>
              Which response is showing? <Text style={[styles.optional, { color: c.textFaint }]}>(optional)</Text>
            </Text>
            {picker({ options: SR_OPTIONS, value: sr, onSelect: setSr })}
          </View>

          <View style={[styles.panel, { backgroundColor: c.surface, borderColor: c.border }]}>
            <Text style={[styles.fieldLabel, { color: c.text }]}>
              Add a note <Text style={[styles.optional, { color: c.textFaint }]}>(optional)</Text>
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="What helped, if anything?"
              placeholderTextColor={c.textMuted}
              multiline
              style={[styles.input, styles.noteInput, { backgroundColor: "transparent", color: c.text }]}
              underlineColor="transparent"
              activeUnderlineColor={c.secondary}
              textAlignVertical="top"
            />
          </View>
        </View>
      </ScrollView>

      {/* Zone 3 · pinned actions */}
      <View style={[styles.nav, { paddingBottom: insets.bottom + 14, borderTopColor: c.divider }]}>
        <M3Button
          label={saving ? "Saving…" : "Save trigger"}
          icon="check"
          iconRight
          color={c.secondary}
          disabled={!name.trim() || saving}
          onPress={() => gateSave(() => void save())}
          style={{ flex: 1.3 }}
        />
      </View>
      {error ? (
        <Text style={[styles.errorText, { color: c.error }]}>Couldn't save: {error}</Text>
      ) : null}
      {signInPrompt}
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
  panel: { width: "100%", borderRadius: 16, padding: 16, marginTop: 16, borderWidth: 1 },
  fieldLabel: { fontSize: 14, lineHeight: 20, fontWeight: "700", marginBottom: 8 },
  optional: { fontWeight: "500" },
  input: { minHeight: 48, fontSize: 16, lineHeight: 24 },
  noteInput: { minHeight: 96 },
  pickerRow: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
  },
  optionLabel: { fontSize: 13, fontWeight: "700" },
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