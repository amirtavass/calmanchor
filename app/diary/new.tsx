import { useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Button, Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";

/**
 * Compose a journal entry (S19). Optional prompt + free-text body + save.
 * Full prompt picker + tags land with the diary completion pass.
 */
export default function NewEntryScreen() {
  const router = useRouter();
  const { mode } = useAppTheme();
  const c = colors[mode];
  const [body, setBody] = useState("");

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Button icon="close" onPress={() => router.back()} mode="text">
          Cancel
        </Button>
        <Text variant="titleMedium" style={{ fontWeight: "700" }}>
          New entry
        </Text>
        <View style={{ width: 64 }} />
      </View>
      <ScrollView contentContainerStyle={styles.body}>
        <Text variant="bodyLarge" style={[styles.muted, { marginBottom: 16 }]}>
          A prompt is optional — write what's here for you right now.
        </Text>
        {/* TODO(S19/S23): prompt picker from prompts table + tag picker (S20) */}
        <Text style={[styles.input, { borderColor: c.border, color: body ? c.text : c.textFaint }]}>
          {body || "Write here…"}
        </Text>
        <Button
          mode="contained"
          style={styles.saveBtn}
          disabled={!body.trim()}
          onPress={() => {
            // TODO: saveJournalEntry({ body }) — wiring next.
            router.back();
          }}
        >
          Save entry
        </Button>
      </ScrollView>
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
  input: {
    borderWidth: 1.5,
    borderRadius: 8,
    padding: 16,
    minHeight: 160,
    fontSize: 16,
  },
  saveBtn: { marginTop: 20, borderRadius: 12 },
});