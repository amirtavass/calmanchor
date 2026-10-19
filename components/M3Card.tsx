import { Pressable, StyleSheet, View } from "react-native";
import { useAppTheme } from "../theme/ThemeContext";
import { colors } from "../theme/tokens";

/**
 * M3 Card (filled variant) — hand-built to m3.material.io/components/cards/specs.
 *
 * Spec:
 *   corner radius 12dp · padding 16dp l/r · gap between cards 8dp max
 *   filled card container colour = `surface-container-highest` (maps to surfaceOffset2)
 *
 * Optional `fill` overrides the container colour (e.g. a category's `--ex-*-bg` tint for
 * the colour-field tiles in 04-landing D2). Optional `accentColor` renders a thin top bar.
 * Surface cards (no `fill`) carry the design-system hairline border (`.ccard`), which
 * gives them a visible edge against the page background — in light mode `surface`
 * and `bg` alone are nearly indistinguishable.
 *
 * A plain RN `Pressable` is used rather than Paper's `TouchableRipple`: on device the
 * Android foreground ripple inside the clipped card was leaving sibling cards with
 * their content invisible; a subtle pressed opacity provides the feedback instead.
 */
export default function M3Card({
  children,
  onPress,
  accentColor,
  fill,
  style,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  accentColor?: string;
  fill?: string;
  style?: object;
}) {
  const { mode } = useAppTheme();
  const c = colors[mode];

  const card = (
    <View
      style={[
        styles.card,
        { backgroundColor: fill ?? c.surfaceOffset2 },
        !fill ? { borderWidth: 1, borderColor: c.divider } : null,
        style,
      ]}
    >
      {accentColor ? <View style={[styles.accent, { backgroundColor: accentColor }]} /> : null}
      <View style={styles.content}>{children}</View>
    </View>
  );

  if (!onPress) return card;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      style={({ pressed }) => [styles.ripple, pressed && styles.pressed]}
    >
      {card}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  ripple: { borderRadius: 12 },
  pressed: { opacity: 0.88 },
  card: {
    borderRadius: 12,
    overflow: "hidden",
  },
  accent: { height: 4 },
  content: { padding: 16 },
});