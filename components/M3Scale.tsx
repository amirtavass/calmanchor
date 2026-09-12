import { Pressable, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../theme/ThemeContext";
import { colors } from "../theme/tokens";

/**
 * M3Scale — 0–10 SUDS scale (S14/S15), hand-built to avoid any native slider
 * dependency (the community slider's ViewManager is absent from the dev build,
 * which crashed the session screen).
 *
 * Design (04-landing/05-session): soft `--mood-5..1` gradient taps, one per
 * SUDS point. The selected tap expands and lifts with a value chip filled in
 * the current band's colour — colour *is* the distress feedback, per the
 * design system. Larger, gentler targets than a drag slider (S10 no-pressure).
 */
const BANDS = ["mood5", "mood5", "mood4", "mood4", "mood3", "mood3", "mood2", "mood2", "mood1", "mood1", "mood1"] as const;

export default function M3Scale({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  const { mode } = useAppTheme();
  const c = colors[mode];
  const bandColor = (i: number) => c[BANDS[Math.max(0, Math.min(10, i))]];

  return (
    <View style={styles.wrap}>
      <View style={styles.chipRow}>
        {value !== null ? (
          <View style={[styles.chip, { backgroundColor: bandColor(value) }]}>
            <Text style={[styles.chipText, { color: c.textInverse }]}>{value}</Text>
          </View>
        ) : (
          <Text style={[styles.hint, { color: c.textMuted }]}>Tap a number</Text>
        )}
      </View>

      <View style={styles.track}>
        {Array.from({ length: 11 }, (_, i) => {
          const selected = value === i;
          return (
            <Pressable
              key={i}
              onPress={() => onChange(i)}
              accessibilityRole="adjustable"
              accessibilityLabel={`${i}`}
              accessibilityState={{ selected }}
              hitSlop={3}
              style={[
                styles.segment,
                {
                  backgroundColor: bandColor(i),
                  height: selected ? 44 : 30,
                  borderColor: selected ? `${c.text}55` : "transparent",
                },
              ]}
            />
          );
        })}
      </View>

      <View style={styles.labels}>
        <Text style={[styles.label, { color: c.textMuted }]}>calm</Text>
        <Text style={[styles.label, { color: c.textMuted }]}>very high</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16 },
  chipRow: {
    alignItems: "center",
    marginBottom: 12,
    minHeight: 32,
    justifyContent: "center",
  },
  chip: {
    minWidth: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 10,
  },
  chipText: { fontWeight: "700", fontSize: 15 },
  hint: { fontSize: 14, opacity: 0.85 },
  track: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  segment: {
    flex: 1,
    borderWidth: 2,
    borderRadius: 10,
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
  },
  label: { fontSize: 12, opacity: 0.85 },
});