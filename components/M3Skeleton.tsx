import { useEffect, useRef } from "react";
import { Animated, Easing, StyleSheet, View, type ViewStyle } from "react-native";
import { useAppTheme } from "../theme/ThemeContext";
import { colors } from "../theme/tokens";

/**
 * M3 Skeleton placeholder — direct lift from design-system §17 "Skeleton
 * Loader". Uses the design system's shimmer animation: a linear gradient
 * between two surface tokens, sliding across the element every 1.5s.
 *
 * Variants:
 *   `text` (default) — 14 dp tall, full width
 *   `card` — 120 dp tall, radius 12
 *   `avatar` — 40 dp square, radius 999
 *   `block` — generic block, custom height via `style.height`
 */
export type SkeletonVariant = "text" | "text-multi" | "card" | "avatar" | "block";

export default function M3Skeleton({
  variant = "text",
  width,
  style,
}: {
  variant?: SkeletonVariant;
  width?: number | string;
  style?: ViewStyle;
}) {
  const { mode } = useAppTheme();
  const c = colors[mode];

  const anim = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(anim, {
        toValue: 1,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: false,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [anim]);

  const baseColor = c.surfaceOffset;
  const highlightColor = c.surfaceDynamic;

  const bg = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [baseColor, highlightColor],
  });

  const variantStyle: ViewStyle =
    variant === "text"
      ? { height: 14, borderRadius: 4, marginBottom: 8 }
      : variant === "text-multi"
      ? { height: 14, borderRadius: 4 }
      : variant === "card"
      ? { height: 120, borderRadius: 12 }
      : variant === "avatar"
      ? { width: 40, height: 40, borderRadius: 999 }
      : { borderRadius: 8 };

  return (
    <Animated.View
      style={[
        styles.base,
        variantStyle,
        width != null ? ({ width } as ViewStyle) : null,
        style,
        { backgroundColor: bg as unknown as string },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  base: { overflow: "hidden" },
});

/**
 * Helper: a stacked list of skeleton text lines with the design-system
 * decreasing-width pattern (100% / 80% / 60%).
 */
export function SkeletonTextStack({ lines = 3 }: { lines?: number }) {
  const widths = ["100%", "80%", "60%"];
  return (
    <View>
      {Array.from({ length: lines }).map((_, i) => (
        <M3Skeleton
          key={i}
          variant="text-multi"
          width={widths[i % widths.length]}
          style={i === lines - 1 ? { marginBottom: 0 } : undefined}
        />
      ))}
    </View>
  );
}
