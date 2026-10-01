import { StyleSheet, View } from "react-native";
import { Text } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import M3Button from "./M3Button";
import M3Card from "./M3Card";
import { useAppTheme } from "../theme/ThemeContext";
import { colors } from "../theme/tokens";

/** Shared signed-out invitation used by Home and other browse-first surfaces. */
export default function LockedAccessCard({
  title,
  message,
  onSignIn,
  buttonLabel = "Sign in with Google",
}: {
  title: string;
  message: string;
  onSignIn: () => void;
  buttonLabel?: string;
}) {
  const { mode } = useAppTheme();
  const c = colors[mode];

  return (
    <M3Card fill={c.surfaceOffset2} style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconBox, { backgroundColor: c.surfaceOffset }]}>
          <MaterialCommunityIcons name="lock-outline" size={18} color={c.textMuted} />
        </View>
        <View style={styles.copy}>
          <Text style={[styles.title, { color: c.text }]}>{title}</Text>
        </View>
      </View>
      <Text style={[styles.message, { color: c.textMuted }]}>{message}</Text>
      <M3Button
        label={buttonLabel}
        icon="google"
        color={c.secondaryActive}
        onPress={onSignIn}
        style={styles.button}
      />
    </M3Card>
  );
}

const styles = StyleSheet.create({
  card: { marginTop: 16 },
  row: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  iconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  copy: { flex: 1 },
  title: { fontSize: 16, lineHeight: 24, fontWeight: "700" },
  message: { marginTop: 2, fontSize: 14, lineHeight: 21 },
  button: { alignSelf: "center", marginTop: 14 },
});
