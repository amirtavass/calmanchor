import { StyleSheet, View } from "react-native";
import { Avatar, IconButton, Text } from "react-native-paper";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../theme/ThemeContext";
import { colors } from "../theme/tokens";

/**
 * M3 Small app bar — m3.material.io/components/app-bars/specs.
 * Container height 64dp (below the status-bar inset) · `surface` · elevation 0.
 * Headline: title-large (22/28, weight 400, M3). Subtitle: label-medium (12/16) in on-surface-variant.
 */
export default function ScreenHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const c = colors[mode];

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
      <IconButton
        icon={() => <Avatar.Icon size={36} icon="account" />}
        onPress={() => router.push("/profile/index")}
        testID="header-avatar"
      />
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
});