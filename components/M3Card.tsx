import { StyleSheet, View } from "react-native";
import { TouchableRipple } from "react-native-paper";
import { useAppTheme } from "../theme/ThemeContext";
import { colors } from "../theme/tokens";

/**
 * M3 Card (filled variant) — hand-built to m3.material.io/components/cards/specs.
 *
 * Spec:
 *   corner radius 12dp · padding 16dp l/r · gap between cards 8dp max
 *   filled card container colour = `surface-container-highest` (maps to surfaceOffset2)
 *
 * Optional `accentColor` renders a thin top bar in the category's `--ex-*` colour so
 * the Exercises tiles stay colour-coded per the design system.
 *
 * Paper is used only for the press ripple (TouchableRipple).
 */
export default function M3Card({
  children,
  onPress,
  accentColor,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  accentColor?: string;
  style?: object;
}) {
  const { mode } = useAppTheme();
  const c = colors[mode];

  const card = (
    <View style={[styles.card, { backgroundColor: c.surfaceOffset2 }, style]}>
      {accentColor ? <View style={[styles.accent, { backgroundColor: accentColor }]} /> : null}
      <View style={styles.content}>{children}</View>
    </View>
  );

  if (!onPress) return card;

  return (
    <TouchableRipple
      onPress={onPress}
      accessibilityRole="button"
      style={styles.ripple}
    >
      {card}
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  ripple: { borderRadius: 12 },
  card: {
    borderRadius: 12,
    overflow: "hidden",
  },
  accent: { height: 4 },
  content: { padding: 16 },
});