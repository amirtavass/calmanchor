import { Pressable, StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../theme/ThemeContext";
import { colors } from "../theme/tokens";
import ThemeToggle from "./ThemeToggle";
import { useSession } from "../lib/auth";

/**
 * M3 Small app bar — m3.material.io/components/app-bars/specs.
 * Container height 64dp (below the status-bar inset) · `surface` · elevation 0.
 * Headline: title-large (22/28, weight 400, M3). Subtitle: label-medium (12/16) in on-surface-variant.
 *
 * Signed-in users get a profile action before ThemeToggle. Signed-out users only
 * see ThemeToggle; profile access belongs to the authenticated route.
 */
export default function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const c = colors[mode];
  const { signedIn } = useSession();

  return (
    <View
      style={[
        styles.header,
        { paddingTop: insets.top + 8, backgroundColor: c.surface },
      ]}
    >
      <View style={styles.titles}>
        <Text variant="titleLarge" style={[styles.title, { color: c.text }]}>
          {title}
        </Text>
        {subtitle ? (
          <Text variant="labelMedium" style={[styles.subtitle, { color: c.textMuted }]}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      <View style={styles.actions}>
        {signedIn ? (
          <Pressable
            onPress={() => router.push("/profile")}
            accessibilityRole="button"
            accessibilityLabel="Open your profile"
            style={[styles.accountButton, { backgroundColor: c.surface2, borderColor: c.border }]}
          >
            <MaterialCommunityIcons name="account-circle-outline" size={20} color={c.secondary} />
          </Pressable>
        ) : null}
        <ThemeToggle />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    minHeight: 64,
  },
  titles: { flex: 1 },
  title: { fontWeight: "400", fontSize: 22, lineHeight: 28 },
  subtitle: { marginTop: 2, fontSize: 12, lineHeight: 16, fontWeight: "500" },
  actions: { flexDirection: "row", alignItems: "center", gap: 4 },
  accountButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
});
