import { View, StyleSheet, ScrollView } from "react-native";
import { Button, Card, Text } from "react-native-paper";
import { useRouter } from "expo-router";
import ScreenHeader from "../../components/ScreenHeader";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";

/**
 * Home / check-in tab. M2 placeholder — full check-in card + dashboard
 * land in M3. For now: quick relief + today's prompt + favourites shortcut
 * (IA §3 Home: check-in · quick relief · today's prompt · quick-start).
 */
export default function HomeScreen() {
  const router = useRouter();
  const { mode } = useAppTheme();
  const c = colors[mode];

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <ScreenHeader title="Calm Anchor" subtitle="Your private toolkit companion" />
      <ScrollView contentContainerStyle={styles.body}>
        <Card style={styles.card}>
          <Card.Title title="How are you feeling right now?" titleVariant="titleMedium" />
          <Card.Content>
            <Text variant="bodyMedium" style={{ color: c.textMuted }}>
              A quick check-in (nervous-system state, survival response, triggers) lands in M3.
            </Text>
          </Card.Content>
        </Card>

        <Text variant="titleMedium" style={styles.sectionLabel}>
          Quick relief
        </Text>
        <View style={styles.tiles}>
          <Button mode="contained" style={styles.tile} onPress={() => router.push("/(tabs)/exercises")}>
            Ground
          </Button>
          <Button mode="contained" style={styles.tile} onPress={() => router.push("/crisis/index")}>
            Breathe
          </Button>
          <Button mode="contained-tonal" style={styles.tile} onPress={() => router.push("/crisis/index")}>
            Crisis
          </Button>
        </View>

        <Text variant="titleMedium" style={styles.sectionLabel}>
          Today's reflection
        </Text>
        <Card style={styles.card} onPress={() => router.push("/diary/new")}>
          <Card.Content>
            <Text variant="bodyMedium" style={{ color: c.textMuted }}>
              "If I treated myself like someone I love, what would I say or do right now?" — write in
              the diary.
            </Text>
          </Card.Content>
        </Card>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { padding: 16, paddingBottom: 96 },
  card: { marginBottom: 16 },
  sectionLabel: { marginTop: 8, marginBottom: 8 },
  tiles: { flexDirection: "row", gap: 8, marginBottom: 16 },
  tile: { flex: 1 },
});