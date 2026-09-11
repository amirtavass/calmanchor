import { View, StyleSheet } from "react-native";
import { Button, Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";

/**
 * Single entry view (S19/S21/S22). Edit within the limited window + delete.
 * Full data wiring lands with the diary completion pass.
 */
export default function EntryDetailScreen() {
  const router = useRouter();
  const { mode } = useAppTheme();
  const c = colors[mode];

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Button icon="arrow-left" onPress={() => router.back()} mode="text">
          Back
        </Button>
        <Text variant="titleMedium" style={{ fontWeight: "700" }}>
          Entry
        </Text>
        <View style={{ width: 64 }} />
      </View>
      <View style={styles.body}>
        <Text variant="bodyMedium" style={styles.muted}>
          An entry you've written will appear here, with edit (within the limited window) and delete
          actions.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 8,
  },
  body: { padding: 20 },
  muted: { color: "#5A5645", opacity: 0.85 },
});