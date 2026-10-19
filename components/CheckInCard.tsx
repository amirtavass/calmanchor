import { useState } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { Text, TextInput } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import M3Button from "./M3Button";
import { useSignInGate } from "./SignInPrompt";
import { saveCheckin } from "../lib/db";
import { useAppTheme } from "../theme/ThemeContext";
import { colors } from "../theme/tokens";
import { NS_OPTIONS, SR_OPTIONS, nsOption, type StateOption } from "../types/checkin";

/**
 * Daily check-in card (M3-02) — Home, under the stat row.
 *
 * S25: a check-in records nervous-system state, survival response, triggers and
 * an optional note. Multiple check-ins a day are allowed (append-only, D05), so
 * this card never "locks" — after saving it settles into a quiet summary with a
 * "Check in again" action rather than a completion wall.
 *
 * Browse-first (S01): the form is free to fill in; sign-in is prompted at save.
 * Everything is optional except the save itself. Craft §1/§12: quiet header,
 * colour-field state chips (colour + glyph + word, R7), no pressure language.
 */
export default function CheckInCard({
  onSaved,
}: {
  onSaved?: (state: { ns: string | null; at: string }) => void;
}) {
  const { mode } = useAppTheme();
  const c = colors[mode];

  const [ns, setNs] = useState<string | null>(null);
  const [sr, setSr] = useState<string | null>(null);
  const [trigger, setTrigger] = useState("");
  const [note, setNote] = useState("");
  const [expanded, setExpanded] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState<{ ns: string | null; at: string } | null>(null);

  const { gate, prompt } = useSignInGate({
    message: "Sign in with Google to save your check-in — it stays private to your account.",
  });

  const reset = () => {
    setNs(null);
    setSr(null);
    setTrigger("");
    setNote("");
    setExpanded(false);
    setError(null);
    setSaved(null);
  };

  const save = () => {
    if (saving) return;
    setError(null);
    gate(() => {
      void runSave();
    });
  };

  const runSave = async () => {
    setSaving(true);
    try {
      await saveCheckin({
        ns_state: ns ?? undefined,
        survival_response: sr ?? undefined,
        triggers: trigger.trim() ? [trigger.trim()] : undefined,
        note: note.trim() || undefined,
      });
      const at = new Date().toISOString();
      setSaved({ ns, at });
      onSaved?.({ ns, at });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSaving(false);
    }
  };

  const chips = <K extends string>(
    options: readonly StateOption<K>[],
    value: string | null,
    onSelect: (k: K | null) => void,
  ) => (
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
            <MaterialCommunityIcons name={o.icon} size={18} color={selected ? c.textInverse : fg} />
            <Text style={[styles.optionLabel, { color: selected ? c.textInverse : fg }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );

  if (saved) {
    const opt = nsOption(saved.ns);
    return (
      <View style={[styles.card, { backgroundColor: mode === "light" ? c.surface2 : c.surface, borderColor: c.divider }]}>
        <View style={styles.savedRow}>
          <View style={[styles.savedIcon, { backgroundColor: opt ? c[opt.bg] : c.surfaceOffset }]}>
            <MaterialCommunityIcons
              name={opt ? opt.icon : "check"}
              size={20}
              color={opt ? c[opt.fg] : c.textMuted}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.title, { color: c.text }]}>Checked in</Text>
            <Text style={[styles.sub, { color: c.textMuted }]}>
              {opt ? `You marked yourself ${opt.label.toLowerCase()}.` : "Thanks for checking in."} You can
              check in again any time today.
            </Text>
          </View>
        </View>
        <M3Button label="Check in again" icon="refresh" variant="text" color={c.secondary} onPress={reset} />
      </View>
    );
  }

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor: mode === "light" ? c.surface2 : c.surface,
          borderColor: c.divider,
        },
      ]}
    >
      <Text style={[styles.title, { color: c.text }]}>How are you right now?</Text>
      <Text style={[styles.sub, { color: c.textMuted }]}>
        A quick note on your state. Optional, private, and only yours.
      </Text>

      <Text style={[styles.label, { color: c.textMuted }]}>Where are you?</Text>
      {chips(NS_OPTIONS, ns, setNs)}

      {expanded ? (
        <>
          <Text style={[styles.label, { color: c.textMuted }]}>What's showing up?</Text>
          {chips(SR_OPTIONS, sr, setSr)}

          <TextInput
            mode="outlined"
            label="Trigger (optional)"
            value={trigger}
            onChangeText={setTrigger}
            style={styles.input}
            outlineColor={c.divider}
            activeOutlineColor={c.secondary}
            textColor={c.text}
            theme={{ colors: { onSurfaceVariant: c.textMuted, primary: c.secondary } }}
          />
          <TextInput
            mode="outlined"
            label="Anything you want to note? (optional)"
            value={note}
            onChangeText={setNote}
            style={styles.input}
            multiline
            numberOfLines={3}
            outlineColor={c.divider}
            activeOutlineColor={c.secondary}
            textColor={c.text}
            theme={{ colors: { onSurfaceVariant: c.textMuted, primary: c.secondary } }}
          />
        </>
      ) : (
        <Pressable
          onPress={() => setExpanded(true)}
          style={styles.moreRow}
          accessibilityRole="button"
          accessibilityLabel="Add more detail"
        >
          <MaterialCommunityIcons name="plus" size={18} color={c.secondary} />
          <Text style={[styles.moreLabel, { color: c.secondary }]}>Add more detail</Text>
        </Pressable>
      )}

      {error ? <Text style={[styles.error, { color: c.srFight }]}>{error}</Text> : null}

      <M3Button
        label="Save check-in"
        icon="check"
        onPress={save}
        disabled={saving}
        color={c.secondary}
        style={styles.save}
      />
      {prompt}
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1 },
  title: { fontSize: 16, lineHeight: 22, fontWeight: "800", letterSpacing: -0.2 },
  sub: { marginTop: 2, fontSize: 13, lineHeight: 19, marginBottom: 12 },
  label: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
    letterSpacing: 0.7,
    textTransform: "uppercase",
    marginTop: 6,
    marginBottom: 8,
  },
  pickerRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginBottom: 4 },
  option: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 12,
  },
  optionLabel: { fontSize: 13.5, lineHeight: 18, fontWeight: "700" },
  moreRow: { flexDirection: "row", alignItems: "center", gap: 6, paddingVertical: 10, marginBottom: 4 },
  moreLabel: { fontSize: 13.5, lineHeight: 18, fontWeight: "700" },
  input: { marginBottom: 10, backgroundColor: "transparent" },
  error: { fontSize: 13, lineHeight: 18, marginBottom: 8 },
  save: { alignSelf: "stretch", marginTop: 6 },
  savedRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 8 },
  savedIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
});
