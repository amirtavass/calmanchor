import { useState } from "react";
import { StyleSheet, View } from "react-native";
import { Text, TouchableRipple } from "react-native-paper";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useAppTheme } from "../theme/ThemeContext";
import { colors } from "../theme/tokens";

/**
 * M3 Filled button — hand-built to m3.material.io/components/buttons/specs.
 *
 * Spec (filled):
 *   container height 40dp · fully rounded (radius = 20dp) · label label-large (14/20/500)
 *   padding 16dp left/right · optional leading icon 20dp
 *   colours: container `primary`, label/icon `onPrimary`; pressed state layer = 12% onPrimary
 *   elevation 0
 *
 * Paper is used only for the press ripple (TouchableRipple) + accessibility.
 */
export default function M3Button({
  label,
  onPress,
  icon,
  disabled,
  style,
}: {
  label: string;
  onPress: () => void;
  icon?: string;
  disabled?: boolean;
  style?: object;
}) {
  const { mode } = useAppTheme();
  const c = colors[mode];
  const [pressed, setPressed] = useState(false);

  const containerColor = disabled ? c.surfaceOffset : c.primary;
  const contentColor = disabled ? c.textFaint : c.textInverse;

  return (
    <TouchableRipple
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled }}
      accessibilityLabel={label}
      style={[styles.wrap, style]}
    >
      <View style={[styles.btn, { backgroundColor: containerColor }]}>
        {icon ? (
          <MaterialCommunityIcons name={icon} size={20} color={contentColor} />
        ) : null}
        <Text style={[styles.label, { color: contentColor }]}>{label}</Text>
        {pressed && !disabled ? (
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: `${c.textInverse}1F`, borderRadius: 20 }]}
          />
        ) : null}
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: 20,
    overflow: "hidden",
  },
  btn: {
    height: 40,
    paddingHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  label: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: "500",
    letterSpacing: 0.1,
  },
});