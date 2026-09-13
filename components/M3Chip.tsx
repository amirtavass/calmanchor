import { useEffect, useRef } from "react";
import type { ComponentProps } from "react";
import { Animated, StyleSheet } from "react-native";
import { TouchableRipple } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAppTheme } from "../theme/ThemeContext";
import { colors } from "../theme/tokens";

type MciGlyph = ComponentProps<typeof MaterialCommunityIcons>["name"];

/**
 * M3 Filter chip — hand-built to m3.material.io/components/chips/specs, with a
 * design-system tint mode.
 *
 * Plain (no tint): M3 filter chip — 32dp, radius 8, surface + divider stroke,
 * selecting fills `secondarySubtle` and animates in a leading checkmark.
 *
 * Tinted (`tint` + `icon`): the design system's own pill idiom (`.ex-chip` /
 * `.mpill`) — `--*-bg` fill, 1.5px `--*` stroke, `--*` icon + label; selecting
 * fills the solid `--*` colour with inverse text (`.chip--selected`). Used for
 * the survival-response state filter on the Exercises landing (04-landing D2),
 * where the icon also carries the state's meaning (flash/run/snowflake/
 * handshake/leaf) so colour is never the only differentiator.
 */
export default function M3Chip({
  label,
  selected,
  onPress,
  selectedBg,
  selectedColor,
  icon,
  tint,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  selectedBg?: string;
  selectedColor?: string;
  icon?: MciGlyph;
  tint?: { bg: string; fg: string };
}) {
  const { mode } = useAppTheme();
  const c = colors[mode];
  const prog = useRef(new Animated.Value(selected ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(prog, {
      toValue: selected ? 1 : 0,
      duration: 150,
      useNativeDriver: false,
    }).start();
  }, [selected, prog]);

  if (tint) {
    const bg = prog.interpolate({ inputRange: [0, 1], outputRange: [tint.bg, tint.fg] });
    const content = prog.interpolate({
      inputRange: [0, 1],
      outputRange: [tint.fg, c.textInverse],
    });
    return (
      <TouchableRipple
        onPress={onPress}
        style={styles.ripple}
        borderless
        accessibilityRole="button"
        accessibilityState={{ selected }}
        accessibilityLabel={selected ? `${label}, selected` : label}
      >
        <Animated.View style={[styles.tintPill, { backgroundColor: bg, borderColor: tint.fg }]}>
          {icon ? (
            <MaterialCommunityIcons name={icon} size={18} color={selected ? c.textInverse : tint.fg} />
          ) : null}
          <Animated.Text style={[styles.tintLabel, { color: content }]}>{label}</Animated.Text>
        </Animated.View>
      </TouchableRipple>
    );
  }

  const fill = selectedBg ?? c.secondarySubtle;
  const labelSel = selectedColor ?? c.text;
  const bg = prog.interpolate({ inputRange: [0, 1], outputRange: [c.surface, fill] });
  const border = prog.interpolate({ inputRange: [0, 1], outputRange: [c.divider, fill] });
  const labelColor = prog.interpolate({ inputRange: [0, 1], outputRange: [c.textMuted, labelSel] });
  const iconWidth = prog.interpolate({ inputRange: [0, 1], outputRange: [0, 18] });
  const iconGap = prog.interpolate({ inputRange: [0, 1], outputRange: [0, 8] });
  const padLeft = prog.interpolate({ inputRange: [0, 1], outputRange: [16, 8] });
  const iconOpacity = prog.interpolate({ inputRange: [0, 0.6, 1], outputRange: [0, 0, 1] });

  return (
    <TouchableRipple
      onPress={onPress}
      style={styles.ripple}
      accessibilityRole="button"
      accessibilityState={{ selected }}
      accessibilityLabel={selected ? `${label}, selected` : label}
    >
      <Animated.View
        style={[styles.pill, { backgroundColor: bg, borderColor: border, paddingLeft: padLeft }]}
      >
        <Animated.View
          style={{ opacity: iconOpacity, width: iconWidth, marginRight: iconGap, alignItems: "center" }}
          pointerEvents="none"
        >
          <MaterialCommunityIcons name="check" size={18} color={labelSel} />
        </Animated.View>
        <Animated.Text style={[styles.label, { color: labelColor }]}>{label}</Animated.Text>
      </Animated.View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  ripple: {
    borderRadius: 8,
    overflow: "hidden",
    marginVertical: 4,
  },
  pill: {
    height: 32,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    paddingRight: 16,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
  tintPill: {
    height: 40,
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 8,
    paddingHorizontal: 14,
  },
  tintLabel: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "600",
    letterSpacing: 0.1,
  },
});