import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import ScreenHeader from "./ScreenHeader";
import M3Skeleton, { SkeletonTextStack } from "./M3Skeleton";
import { useAppTheme } from "../theme/ThemeContext";
import { colors } from "../theme/tokens";

/**
 * Skeleton fallback for exercise-loading states. Mirrors the real
 * `app/exercise/[id].tsx` layout (header → category chip → headline →
 * description → meta row → steps list → CTA) so the transition into the live
 * screen is invisible. Used by `app/exercise/[id].tsx`, `app/exercise/session/[id].tsx`,
 * and `app/exercise/category/[key].tsx` while their data is in flight.
 *
 * Direct borrow of design-system §17 "Skeleton Loader" — same shimmer
 * animation, same decreasing-width text stack (100% / 80% / 60%).
 */
export default function ExerciseLoadingScreen({
  title = "Exercise",
}: {
  title?: string;
}) {
  const { mode } = useAppTheme();
  const c = colors[mode];

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <ScreenHeader title={title} />
      <View style={styles.body}>
        {/* Category chip + title row */}
        <View style={styles.chipRow}>
          <M3Skeleton variant="block" style={styles.chip} />
        </View>
        <M3Skeleton variant="block" style={styles.titleLine} />
        <M3Skeleton variant="block" style={styles.titleLine2} />

        {/* Meta row */}
        <View style={styles.metaRow}>
          <M3Skeleton variant="block" style={styles.metaChip} />
          <M3Skeleton variant="block" style={styles.metaChip} />
        </View>

        {/* Description panel */}
        <View style={[styles.panel, { backgroundColor: c.surface }]}>
          <M3Skeleton variant="block" style={styles.panelKicker} />
          <SkeletonTextStack lines={3} />
        </View>

        {/* Steps panel */}
        <View style={[styles.panel, { backgroundColor: c.surface }]}>
          <M3Skeleton variant="block" style={styles.panelKicker} />
          <View style={styles.stepRow}>
            <M3Skeleton variant="avatar" style={styles.stepNum} />
            <View style={styles.stepText}>
              <M3Skeleton variant="text-multi" width="80%" />
              <M3Skeleton variant="text-multi" width="55%" style={styles.stepSub} />
            </View>
          </View>
          <View style={styles.stepRow}>
            <M3Skeleton variant="avatar" style={styles.stepNum} />
            <View style={styles.stepText}>
              <M3Skeleton variant="text-multi" width="70%" />
              <M3Skeleton variant="text-multi" width="45%" style={styles.stepSub} />
            </View>
          </View>
          <View style={styles.stepRow}>
            <M3Skeleton variant="avatar" style={styles.stepNum} />
            <View style={styles.stepText}>
              <M3Skeleton variant="text-multi" width="85%" />
              <M3Skeleton variant="text-multi" width="60%" style={styles.stepSub} />
            </View>
          </View>
        </View>

        {/* CTA */}
        <M3Skeleton variant="block" style={styles.cta} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 96 },
  chipRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  chip: { height: 26, width: 96, borderRadius: 999 },
  titleLine: { height: 26, width: "70%", borderRadius: 6, marginBottom: 8 },
  titleLine2: { height: 26, width: "45%", borderRadius: 6, marginBottom: 20 },
  metaRow: { flexDirection: "row", gap: 8, marginBottom: 24 },
  metaChip: { height: 28, width: 86, borderRadius: 14 },
  panel: { borderRadius: 16, padding: 18, marginBottom: 12 },
  panelKicker: { height: 14, width: "40%", borderRadius: 4, marginBottom: 12 },
  stepRow: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 8 },
  stepNum: { width: 28, height: 28, borderRadius: 14 },
  stepText: { flex: 1 },
  stepSub: { marginTop: 4 },
  cta: { height: 48, borderRadius: 24, marginTop: 24 },
});
