import { useEffect, useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import { TouchableRipple } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useAppTheme } from "../theme/ThemeContext";
import { colors } from "../theme/tokens";

/**
 * M3 Filter chip — hand-built to m3.material.io/components/chips/specs.
 *
 * Filter chip spec:
 *   container height 32dp · corner radius 8dp · icon 18dp
 *   label: label-large (14/20, weight 500), start-aligned
 *   padding: 16dp sides without icon, 8dp with icon, 8dp between elements
 *   colours: unselected = surface + outline-variant stroke, on-surface-variant label;
 *            selected = secondary-container fill, leading checkmark, on-secondary-container
 *   toggle: selecting fills the chip (Material Symbols "check" on the start edge)
 *
 * Paper is used only for the press ripple (TouchableRipple) + accessibility.
 */
export default function M3Chip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
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

  const bg = prog.interpolate({
    inputRange: [0, 1],
    outputRange: [c.surface, c.secondarySubtle],
  });
  const border = prog.interpolate({
    inputRange: [0, 1],
    outputRange: [c.divider, c.secondarySubtle],
  });
  const labelColor = prog.interpolate({
    inputRange: [0, 1],
    outputRange: [c.textMuted, c.text],
  });
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
          <MaterialCommunityIcons name="check" size={18} color={c.text} />
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
});