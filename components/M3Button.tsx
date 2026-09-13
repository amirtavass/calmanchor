import { useState } from "react";
import type { ComponentProps } from "react";
import { StyleSheet, View } from "react-native";
import { Text, TouchableRipple } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useAppTheme } from "../theme/ThemeContext";
import { colors } from "../theme/tokens";

/**
 * M3 Button — hand-built to m3.material.io/components/buttons/specs.
 *
 * Spec (filled): container height 40dp · fully rounded (radius 20dp) · label label-large
 * (14/20/500) · padding 16dp · optional leading icon 20dp · elevation 0.
 * Pressed state layer = 12% of the content colour. Paper is used only for the press
 * ripple (TouchableRipple) + accessibility.
 *
 * Variants:
 *   filled   — container `primary`, label `onPrimary`
 *   outlined — transparent container, `primary` label + 1dp `primary` stroke;
 *              `selected` flips it to filled; `color` overrides the accent
 *   text     — transparent, `primary` label (used for "Skip" / text actions)
 */
export default function M3Button({
  label,
  onPress,
  icon,
  iconRight,
  disabled,
  style,
  variant = "filled",
  selected,
  color,
}: {
  label: string;
  onPress: () => void;
  icon?: ComponentProps<typeof MaterialCommunityIcons>["name"];
  iconRight?: boolean;
  disabled?: boolean;
  style?: object;
  variant?: "filled" | "outlined" | "text";
  selected?: boolean;
  color?: string;
}) {
  const { mode } = useAppTheme();
  const c = colors[mode];
  const [pressed, setPressed] = useState(false);

  let containerColor = c.surfaceOffset2; // disabled
  let contentColor = c.textMuted; // disabled
  let borderColor: string | undefined;

  if (!disabled) {
    if (variant === "filled" || (variant === "outlined" && selected)) {
      containerColor = color ?? c.primary;
      contentColor = c.textInverse;
    } else if (variant === "outlined") {
      containerColor = "transparent";
      contentColor = color ?? c.primary;
      borderColor = color ?? c.primary;
    } else {
      containerColor = "transparent";
      contentColor = color ?? c.primary;
    }
  } else if (variant === "outlined") {
    containerColor = "transparent";
    borderColor = c.divider;
  } else if (variant === "text") {
    containerColor = "transparent";
  }

  return (
    <TouchableRipple
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!disabled, selected: !!selected }}
      accessibilityLabel={label}
      style={[
        styles.wrap,
        variant === "outlined" ? { borderWidth: 1, borderColor } : null,
        style,
      ]}
    >
      <View style={[styles.btn, { backgroundColor: containerColor }]}>
        {icon && !iconRight ? (
          <MaterialCommunityIcons name={icon} size={20} color={contentColor} />
        ) : null}
        <Text style={[styles.label, { color: contentColor }]}>{label}</Text>
        {icon && iconRight ? (
          <MaterialCommunityIcons name={icon} size={20} color={contentColor} />
        ) : null}
        {pressed && !disabled ? (
          <View
            pointerEvents="none"
            style={[StyleSheet.absoluteFill, { backgroundColor: `${contentColor}1F`, borderRadius: 20 }]}
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