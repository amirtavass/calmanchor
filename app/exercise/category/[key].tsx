import { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Text } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import M3Button from "../../../components/M3Button";
import M3Card from "../../../components/M3Card";
import { getExercisesByCategory } from "../../../lib/db";
import { CATEGORIES, CATEGORY_TOKENS, Exercise, ExerciseCategory } from "../../../types/exercise";
import { useAppTheme } from "../../../theme/ThemeContext";
import { colors } from "../../../theme/tokens";

/**
 * Category listing — exercises in one category (Layout A card → list). M3 treatment
 * consistent with the landing (04 D2). 3–5 actions: see all · open · start.
 */
export default function CategoryScreen() {
  const { key } = useLocalSearchParams<{ key: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const c = colors[mode];
  const catKey = (key as ExerciseCategory) in CATEGORY_TOKENS ? (key as ExerciseCategory) : "breathing";

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

  const t = CATEGORY_TOKENS[catKey];
  const tone = { fg: c[t.fg], bg: c[t.bg] };
  const icon = CATEGORIES.find((cat) => cat.key === catKey)?.icon ?? "meditation";
  const label = CATEGORIES.find((cat) => cat.key === catKey)?.label ?? String(key);

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <Pressable
          onPress={() => router.back()}
          style={styles.back}
          hitSlop={10}
          accessibilityRole="button"
          accessibilityLabel="Back"
        >
          <View style={[styles.backBtn, { backgroundColor: c.surfaceOffset }]}>
            <MaterialCommunityIcons name="arrow-left" size={22} color={c.text} />
          </View>
        </Pressable>
        <View style={styles.headerText}>
          <Text variant="titleLarge" style={{ fontWeight: "700", color: c.text }}>
            {label}
          </Text>
          <Text variant="bodySmall" style={muted(c)}>
            {loading ? "Loading…" : `${items.length} exercise${items.length === 1 ? "" : "s"}`}
          </Text>
        </View>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        {loading ? (
          <Text style={muted(c)}>Loading…</Text>
        ) : error ? (
          <View style={styles.errorBox}>
            <Text style={[muted(c), { color: c.error }]}>Couldn't load exercises. {error}</Text>
            <M3Button label="Retry" onPress={() => setError(null)} style={styles.retry} />
          </View>
        ) : items.length === 0 ? (
          <Text style={muted(c)}>No exercises in this category yet.</Text>
        ) : (
          items.map((ex) => (
            <M3Card
              key={ex.id}
              fill={tone.bg}
              onPress={() => router.push(`/exercise/${ex.id}`)}
              style={styles.card}
            >
              <View style={styles.row}>
                <MaterialCommunityIcons name={icon} size={24} color={tone.fg} />
                <View style={styles.text}>
                  <Text variant="titleMedium" style={{ color: c.text, fontWeight: "600" }}>
                    {ex.title}
                  </Text>
                  <Text variant="bodySmall" style={muted(c)}>
                    {ex.steps.length} steps
                    {ex.duration_minutes ? ` · ~${ex.duration_minutes} min` : " · no fixed time"}
                  </Text>
                </View>
                <M3Button label="Start" onPress={() => router.push(`/exercise/${ex.id}`)} />
              </View>
            </M3Card>
          ))
        )}
      </ScrollView>
    </View>
  );
}

const muted = (c: typeof colors.light) => ({ color: c.textMuted, opacity: 0.85 });

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
  },
  back: { width: 44, height: 44, alignItems: "center", justifyContent: "center" },
  backBtn: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerText: { flex: 1, marginLeft: 4 },
  body: { padding: 16, paddingTop: 8, paddingBottom: 48 },
  card: { marginBottom: 10 },
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  text: { flex: 1 },
  errorBox: { paddingVertical: 24, alignItems: "center" },
  retry: { marginTop: 12 },
});