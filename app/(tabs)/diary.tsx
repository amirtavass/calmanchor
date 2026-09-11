import { View, StyleSheet, ScrollView } from "react-native";
import { Button, Card, Text } from "react-native-paper";
import { useRouter } from "expo-router";
import ScreenHeader from "../../components/ScreenHeader";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";

/**
 * Diary tab — journal (M2). 3–5 actions: see prompts · write · review · edit/delete · tag.
 * Full implementation (prompts + entries + edit window + tags) lands next;
 * this renders the entry point + the 3 workbook prompts.
 */
export default function DiaryScreen() {
  const router = useRouter();
  const { mode } = useAppTheme();
  const c = colors[mode];

  const prompts = [
    {
      text: "Write a letter to your younger self. Speak with kindness, understanding, and honesty.",
      chapter: "My Inner Child & Me",
    },
    {
      text: "What does this part of me need right now? Get curious about the part that feels afraid, angry, or sad.",
      chapter: "Self-Soothing Strategies",
    },
    {
      text: "If I treated myself like someone I love, what would I say or do right now?",
      chapter: "The Anatomy of Compassion",
    },
  ];

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <ScreenHeader title="Diary" subtitle="Reflect in your own words" />
      <ScrollView contentContainerStyle={styles.body}>
        <Text variant="titleMedium" style={styles.sectionLabel}>
          Write a new entry
        </Text>
        <Button mode="contained" icon="create" onPress={() => router.push("/diary/new")} style={styles.newBtn}>
          Start writing
        </Button>

        <Text variant="titleMedium" style={styles.sectionLabel}>
          Reflection prompts
        </Text>
        {prompts.map((p, i) => (
          <Card
            key={i}
            style={styles.card}
            onPress={() => router.push("/diary/new")}
          >
            <Card.Content>
              <Text variant="bodyMedium">{p.text}</Text>
              <Text variant="bodySmall" style={styles.muted}>
                {p.chapter}
              </Text>
            </Card.Content>
          </Card>
        ))}

        <Text variant="titleMedium" style={styles.sectionLabel}>
          Recent entries
        </Text>
        <Text variant="bodyMedium" style={styles.muted}>
          Your past entries will appear here, newest first.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { padding: 16, paddingBottom: 96 },
  sectionLabel: { marginTop: 8, marginBottom: 8, fontWeight: "700" },
  newBtn: { borderRadius: 12, marginBottom: 16 },
  card: { marginBottom: 8 },
  muted: { color: "#5A5645", opacity: 0.85, marginTop: 6 },
});