import { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Text } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import M3Button from "../../components/M3Button";
import { useSignInGate } from "../../components/SignInPrompt";
import { buildExport, openExportedFile, saveCsvFile, type ExportDataset, type ExportKind } from "../../lib/export";
import { useSession } from "../../lib/auth";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";

/**
 * Data export (M3-09 / M4-07) — technical-spec §3.9.
 *
 * User-initiated only; the file is generated and saved on this device; no
 * network request, no cloud, no copy kept by the app. Plain-text CSV so the
 * user can open it in any spreadsheet (spec: "CSV or Excel" — we ship CSV,
 * which Excel/Numbers/Sheets all open; an .xlsx writer would mean a new
 * dependency for no extra data).
 *
 * Every item is opt-in and the flow never blocks on "why" (Appendix F).
 */
const OPTIONS: { kind: ExportKind; label: string; body: string; icon: keyof typeof MaterialCommunityIcons.glyphMap }[] = [
  {
    kind: "diary",
    label: "Diary entries",
    body: "What you wrote, with the prompt and tags.",
    icon: "notebook-edit-outline",
  },
  {
    kind: "triggers",
    label: "Trigger logs",
    body: "What happened, the state you noted, and your note.",
    icon: "flash-outline",
  },
  {
    kind: "portfolio",
    label: "Portfolio",
    body: "Favourites, safe-space notes and your own strategies.",
    icon: "star-outline",
  },
];

export default function ExportScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const c = colors[mode];
  const { signedIn } = useSession();
  const { gate, prompt } = useSignInGate({
    message: "Sign in with Google to export your data — it is only read back for your own account.",
  });

  const [selected, setSelected] = useState<Record<ExportKind, boolean>>({
    diary: true,
    triggers: true,
    portfolio: true,
  });
  const [counts, setCounts] = useState<Record<ExportKind, number | null>>({
    diary: null,
    triggers: null,
    portfolio: null,
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!signedIn) return;
    let active = true;
    (async () => {
      for (const opt of OPTIONS) {
        try {
          const d = await buildExport(opt.kind);
          if (active) setCounts((prev) => ({ ...prev, [opt.kind]: d.rows.length }));
        } catch {
          if (active) setCounts((prev) => ({ ...prev, [opt.kind]: 0 }));
        }
      }
    })();
    return () => {
      active = false;
    };
  }, [signedIn]);

  const chosen = OPTIONS.filter((o) => selected[o.kind]);

  const runExport = () => {
    if (busy || chosen.length === 0) return;
    setError(null);
    setDone(null);
    gate(() => {
      void (async () => {
        setBusy(true);
        try {
          const datasets: ExportDataset[] = [];
          for (const opt of chosen) datasets.push(await buildExport(opt.kind));
          const path =
            datasets.length === 1
              ? await saveCsvFile(datasets[0].fileStem, toCsv(datasets[0]))
              : await saveCsvFile("data", datasets.map(toCsv).join("\r\n"));
          await openExportedFile(
            path,
            datasets.length === 1 ? datasets[0].label : "data export",
          );
          setDone(path);
        } catch (e) {
          setError(e instanceof Error ? e.message : String(e));
        } finally {
          setBusy(false);
        }
      })();
    });
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      {/* Zone 1 — quiet header, same shape as Profile */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <View style={styles.side}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Back"
            style={[styles.iconBtn, { backgroundColor: c.surfaceOffset }]}
          >
            <MaterialCommunityIcons name="arrow-left" size={20} color={c.text} />
          </Pressable>
        </View>
        <View style={styles.centre}>
          <Text style={[styles.headline, { color: c.text }]}>Export my data</Text>
        </View>
        <View style={[styles.side, styles.right]} />
      </View>

      <ScrollView contentContainerStyle={styles.body} showsVerticalScrollIndicator={false}>
        <Text style={[styles.intro, { color: c.textMuted }]}>
          Your data will be saved to your device as a file. No one else can see it — nothing is
          uploaded or emailed.
        </Text>

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>WHAT TO EXPORT</Text>
        <View style={[styles.card, { backgroundColor: c.surface }]}>
          {OPTIONS.map((opt, i) => {
            const on = selected[opt.kind];
            return (
              <Pressable
                key={opt.kind}
                onPress={() => setSelected((s) => ({ ...s, [opt.kind]: !s[opt.kind] }))}
                style={[styles.row, i > 0 ? styles.rowBorder : null]}
                accessibilityRole="checkbox"
                accessibilityState={{ checked: on }}
                accessibilityLabel={opt.label}
              >
                <MaterialCommunityIcons
                  name={on ? "checkbox-marked" : "checkbox-blank-outline"}
                  size={22}
                  color={on ? c.secondary : c.textMuted}
                />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: c.text }]}>{opt.label}</Text>
                  <Text style={[styles.rowBody, { color: c.textMuted }]}>{opt.body}</Text>
                </View>
                <Text style={[styles.count, { color: c.textMuted }]}>
                  {counts[opt.kind] === null ? "—" : `${counts[opt.kind]}`}
                </Text>
              </Pressable>
            );
          })}
        </View>

        <View style={[styles.noteCard, { backgroundColor: c.surfaceOffset2 }]}>
          <MaterialCommunityIcons name="file-delimited-outline" size={18} color={c.textMuted} />
          <Text style={[styles.noteText, { color: c.textMuted }]}>
            Saved as CSV — plain text that opens in Excel, Numbers or Google Sheets. No password
            protection, and the app does not keep a copy.
          </Text>
        </View>

        {error ? <Text style={[styles.error, { color: c.error }]}>{error}</Text> : null}
        {done ? (
          <View style={[styles.doneCard, { backgroundColor: c.nsWindowBg }]}>
            <MaterialCommunityIcons name="check-circle" size={18} color={c.nsWindow} />
            <Text style={[styles.doneText, { color: c.nsWindow }]}>
              Saved. You can close this screen whenever you like.
            </Text>
          </View>
        ) : null}
      </ScrollView>

      {/* Zone 3 — pinned action */}
      <View style={[styles.actionBar, { paddingBottom: insets.bottom + 16, borderTopColor: c.divider }]}>
        <M3Button
          label={busy ? "Preparing…" : "Export"}
          icon="download"
          color={c.secondary}
          disabled={busy || chosen.length === 0}
          onPress={runExport}
          style={styles.exportBtn}
        />
      </View>
      {prompt}
    </View>
  );
}

function toCsv(d: ExportDataset): string {
  const esc = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    return /[",\r\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [d.columns.map(esc).join(","), ...d.rows.map((r) => r.map(esc).join(","))].join("\r\n") + "\r\n";
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  side: { width: 72, alignItems: "flex-start", justifyContent: "center" },
  right: { alignItems: "flex-end" },
  centre: { flex: 1, alignItems: "center" },
  iconBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  headline: { fontSize: 16, lineHeight: 24, fontWeight: "700" },
  body: { padding: 20, paddingBottom: 32 },
  intro: { fontSize: 14.5, lineHeight: 22 },
  sectionLabel: {
    marginTop: 22,
    marginBottom: 10,
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  card: { borderRadius: 16, paddingHorizontal: 16 },
  row: { flexDirection: "row", alignItems: "flex-start", gap: 12, paddingVertical: 14 },
  rowBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(0,0,0,0.08)" },
  rowTitle: { fontSize: 15, lineHeight: 21, fontWeight: "600" },
  rowBody: { marginTop: 2, fontSize: 12.5, lineHeight: 18 },
  count: { fontSize: 13, lineHeight: 21, fontWeight: "700", minWidth: 28, textAlign: "right" },
  noteCard: {
    flexDirection: "row",
    gap: 10,
    alignItems: "flex-start",
    borderRadius: 14,
    padding: 14,
    marginTop: 16,
  },
  noteText: { flex: 1, fontSize: 12.5, lineHeight: 19 },
  error: { marginTop: 14, fontSize: 13, lineHeight: 19 },
  doneCard: {
    flexDirection: "row",
    gap: 8,
    alignItems: "center",
    borderRadius: 14,
    padding: 14,
    marginTop: 14,
  },
  doneText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: "600" },
  actionBar: {
    paddingHorizontal: 20,
    paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  exportBtn: { alignSelf: "stretch" },
});
