import { View, StyleSheet } from "react-native";
import { Text } from "react-native-paper";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";

/**
 * Profile stack (from header avatar). M3: research profile, settings,
 * export, delete-my-data, about. Navigatable placeholder.
 */
export default function ProfileIndexScreen() {
  const { mode } = useAppTheme();
  const c = colors[mode];

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.body}>
        <Text variant="titleLarge" style={{ fontWeight: "700" }}>
          Profile
        </Text>
        <Text variant="bodyMedium" style={[styles.muted, { marginTop: 8 }]}>
          Research profile, settings, data export and privacy controls arrive in a later milestone.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { padding: 20 },
  muted: { color: "#5A5645", opacity: 0.85 },
});