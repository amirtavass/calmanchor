import { View, StyleSheet } from "react-native";
import { ActivityIndicator, Button, Text } from "react-native-paper";
import { useState } from "react";
import Pdf from "react-native-pdf";
import { Dimensions } from "react-native";
import ScreenHeader from "../../components/ScreenHeader";
import { toolkitSource } from "../../lib/toolkit";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";

/**
 * Toolkit tab — chapter list + PDF viewer + jump-to-chapter (M2).
 * Chapter list data (`getChapters()`) is wired in a follow-up; for now the
 * PDF renders in-app (S07) with a reload affordance.
 */
export default function ToolkitScreen() {
  const { mode } = useAppTheme();
  const c = colors[mode];
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [error, setError] = useState<string | null>(null);

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <ScreenHeader title="Toolkit" subtitle="The workbook" />
      <View style={styles.toolbar}>
        <Text variant="bodySmall" style={{ color: c.textMuted }}>
          Page {page}
          {total ? ` of ${total}` : ""}
        </Text>
        <Button mode="text" onPress={() => setError(null)} disabled={!error}>
          Reload
        </Button>
      </View>
      {error ? (
        <View style={styles.errorBox}>
          <Text variant="bodyMedium" style={{ color: c.error }}>
            Couldn't load the workbook. {error}
          </Text>
          <Button mode="contained" onPress={() => setError(null)} style={styles.errorBtn}>
            Retry
          </Button>
        </View>
      ) : (
        <Pdf
          source={toolkitSource}
          style={styles.pdf}
          trustAllCerts={false}
          renderActivityIndicator={() => <ActivityIndicator size="large" />}
          onPageChanged={(p, t) => {
            setPage(p);
            setTotal(t);
          }}
          onError={(e) => setError(String(e))}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  toolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  pdf: { flex: 1, width: Dimensions.get("window").width },
  errorBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 24 },
  errorBtn: { marginTop: 12 },
});