import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View } from "react-native";
import { useAppTheme } from "../theme/ThemeContext";
import { colors } from "../theme/tokens";

/**
 * M3 Spinner — design-system §19 "Button with Loading" lifted to a standalone
 * component. 16 dp circular border spinner, 1s linear spin. Use `size` to
 * scale (default 16). Use `tint` to override the colour (default
 * `textMuted`); call sites typically pass `secondary` or a brand tone.
 */
export default function M3Spinner({
  size = 16,
  tint,
}: {
  size?: number;
  tint?: string;
}) {
  const { mode } = useAppTheme();
  const c = colors[mode];
  const color = tint ?? c.textMuted;

  const spin = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(spin, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [spin]);

  const rotate = spin.interpolate({ inputRange: [0, 1], outputRange: ["0deg", "360deg"] });

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Animated.View
        style={[
          styles.ring,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderColor: color,
            transform: [{ rotate }],
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: "center", justifyContent: "center" },
  ring: { borderWidth: 2, borderRightColor: "transparent" },
});
