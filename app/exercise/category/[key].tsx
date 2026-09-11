import { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView } from "react-native";
import { Button, Card, Text } from "react-native-paper";
import { useLocalSearchParams, useRouter } from "expo-router";
import { getExercisesByCategory } from "../../../lib/db";
import { Exercise } from "../../../types/exercise";
import { useAppTheme } from "../../../theme/ThemeContext";
import { colors } from "../../../theme/tokens";

/**
 * Category listing — exercises in one category (Layout A card → list).
 * 3–5 actions: see all in category · open an exercise · start directly.
 */
export default function CategoryScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const router = useRouter();
  const { mode } = useAppTheme();
  const c = colors[mode];

  const [items, setItems] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getExercisesByCategory(String(key));
        setItems(data ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, [key]);

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Button icon="arrow-left" onPress={() => router.back()} mode="text">
          Back
        </Button>
        <Text variant="titleLarge" style={{ textTransform: "capitalize", fontWeight: "700" }}>
          {key}
        </Text>
        <View style={{ width: 64 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {loading ? (
          <Text style={styles.muted}>Loading…</Text>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={[styles.muted, { color: c.error }]}>
              Couldn't load exercises. {error}
            </Text>
            <Button mode="contained" onPress={() => setError(null)} style={styles.retry}>
              Retry
            </Button>
          </View>
        ) : items.length === 0 ? (
          <Text style={styles.muted}>No exercises in this category yet.</Text>
        ) : (
          items.map((ex) => (
            <Card
              key={ex.id}
              style={styles.card}
              onPress={() => router.push(`/exercise/${ex.id}`)}
            >
              <Card.Content style={styles.row}>
                <View style={styles.text}>
                  <Text variant="titleMedium">{ex.title}</Text>
                  <Text variant="bodySmall" style={styles.muted}>
                    {ex.steps.length} steps
                    {ex.duration_minutes ? ` · ~${ex.duration_minutes} min` : " · no fixed time"}
                  </Text>
                </View>
                <Button mode="contained" onPress={() => router.push(`/exercise/${ex.id}`)}>
                  Start
                </Button>
              </Card.Content>
            </Card>
          ))
        )}
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
  body: { padding: 16, paddingBottom: 48 },
  card: { marginBottom: 8 },
  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  text: { flex: 1, paddingRight: 12 },
  muted: { color: "#5A5645", opacity: 0.85 },
  errorBox: { paddingVertical: 24, alignItems: "center" },
  retry: { marginTop: 12 },
});