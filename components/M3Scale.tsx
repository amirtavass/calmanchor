import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useAppTheme } from "../theme/ThemeContext";
import { colors } from "../theme/tokens";

/**
 * M3Scale — 0–10 SUDS scale (S14/S15), hand-built to avoid any native slider
 * dependency (the community slider's ViewManager is absent from the dev build,
 * which crashed the session screen).
 *
 * Design (03-session-flow: `.form-slider`; 05-session D2): a gradient track of
 * `--mood-5..1` bands with a thumb that springs to the chosen value — colour
 * *is* the distress feedback. Tap anywhere on the bar sets the value; no drag
 * precision required (S10 no-pressure, gentle for a dysregulated user).
 *
 * Layout is fixed-height (chip row, track, labels) so choosing a value never
 * shifts the screen — the thumb moves, the page doesn't.
 */
const BANDS = ["mood5", "mood5", "mood4", "mood4", "mood3", "mood3", "mood2", "mood2", "mood1", "mood1", "mood1"] as const;
const THUMB = 30;

/** Mood-band token for a SUDS value — shared so summaries can reuse the colour. */
export const moodBandKey = (v: number) => BANDS[Math.max(0, Math.min(10, Math.round(v)))];

export default function M3Scale({
  value,
  onChange,
}: {
  value: number | null;
  onChange: (v: number) => void;
}) {
  const { mode } = useAppTheme();
  const c = colors[mode];
  const [trackW, setTrackW] = useState(0);
  const pos = useRef(new Animated.Value(value ?? 0)).current;

  useEffect(() => {
    Animated.spring(pos, {
      toValue: value ?? 0,
      friction: 9,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [value, pos]);

  const bandColor = (i: number) => c[BANDS[Math.max(0, Math.min(10, i))]];
  const travel = Math.max(0, trackW - THUMB);
  const translateX = pos.interpolate({
    inputRange: [0, 10],
    outputRange: [0, travel],
    extrapolate: "clamp",
  });

  const handleTap = (x: number) => {
    if (trackW <= 0) return;
    const ratio = Math.max(0, Math.min(1, x / trackW));
    onChange(Math.round(ratio * 10));
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.chipRow}>
        {value !== null ? (
          <View style={[styles.chip, { backgroundColor: bandColor(value) }]}>
            <Text style={[styles.chipText, { color: c.textInverse }]}>{value}</Text>
          </View>
        ) : (
          <Text style={[styles.hint, { color: c.textMuted }]}>Tap the bar — 0 calm, 10 very high</Text>
        )}
      </View>

      <Pressable
        onPress={(e) => handleTap(e.nativeEvent.locationX)}
        accessibilityRole="adjustable"
        accessibilityLabel="Distress level, 0 to 10"
        accessibilityValue={
          value !== null ? { min: 0, max: 10, now: value } : { min: 0, max: 10 }
        }
        hitSlop={{ top: 8, bottom: 8 }}
        style={styles.hit}
      >
        <View style={styles.trackOuter} onLayout={(e) => setTrackW(e.nativeEvent.layout.width)}>
          <View style={styles.track}>
            {Array.from({ length: 11 }, (_, i) => (
              <View key={i} style={[styles.seg, { backgroundColor: bandColor(i) }]} />
            ))}
          </View>
          <Animated.View
            pointerEvents="none"
            style={[
              styles.thumb,
              {
                borderColor: value !== null ? bandColor(value) : c.divider,
                opacity: value !== null ? 1 : 0.55,
                transform: [{ translateX }],
              },
            ]}
          />
        </View>
      </Pressable>

      <View style={styles.labels}>
        <Text style={[styles.label, { color: c.textMuted }]}>0 · calm</Text>
        <Text style={[styles.label, { color: c.textMuted }]}>very high · 10</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginTop: 16 },
  chipRow: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
    height: 34,
  },
  chip: {
    minWidth: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 12,
  },
  chipText: { fontWeight: "700", fontSize: 15 },
  hint: { fontSize: 13, opacity: 0.85, textAlign: "center" },
  hit: { paddingVertical: 10 },
  trackOuter: { height: THUMB, justifyContent: "center" },
  track: {
    height: 14,
    borderRadius: 7,
    flexDirection: "row",
    overflow: "hidden",
  },
  seg: { flex: 1, height: 14 },
  thumb: {
    position: "absolute",
    left: 0,
    top: 0,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
    borderWidth: 3,
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOpacity: 0.18,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  labels: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  label: { fontSize: 12, opacity: 0.85 },
});