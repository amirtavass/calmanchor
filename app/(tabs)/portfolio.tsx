import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import ScreenHeader from "../../components/ScreenHeader";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";

/**
 * Portfolio tab — M3 placeholder (favourites, safe-space notes, quick reset).
 */
export default function PortfolioScreen() {
  const { mode } = useAppTheme();
  const c = colors[mode];

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <ScreenHeader title="Portfolio" subtitle="Your personal toolkit" />
      <View style={styles.body}>
        <Text variant="bodyMedium" style={muted(c)}>
          Favourited exercises and personal strategies will appear here (coming in a later milestone).
        </Text>
      </View>
    </View>
  );
}

const muted = (c: typeof colors.light) => ({ color: c.textMuted, opacity: 0.85 });

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { padding: 16 },
});