import { useEffect, useMemo, useRef, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Dimensions } from "react-native";
import { Text } from "react-native-paper";
import Pdf, { PdfRef } from "react-native-pdf";
import ScreenHeader from "../../components/ScreenHeader";
import M3Chip from "../../components/M3Chip";
import M3Skeleton from "../../components/M3Skeleton";
import { getChapters } from "../../lib/db";
import { toolkitSource } from "../../lib/toolkit";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";

interface Chapter {
  id: string;
  order_index: number;
  title: string;
  page_range: string;
  content_group: string;
  colour_token: string;
}

// Map the seed content groups to the ex-* colour families (design system).
const GROUP_TONES: Record<string, { fg: keyof typeof colors.light; bg: keyof typeof colors.light }> = {
  learn: { fg: "exBreath", bg: "exBreathBg" },
  practice: { fg: "exGround", bg: "exGroundBg" },
  reflect: { fg: "exJournal", bg: "exJournalBg" },
  reframe: { fg: "exSelfkind", bg: "exSelfkindBg" },
  relationships: { fg: "exSomatic", bg: "exSomaticBg" },
  crisis: { fg: "exCrisis", bg: "exCrisisBg" },
};
const GROUP_LABELS: Record<string, string> = {
  learn: "Learn",
  practice: "Practice",
  reflect: "Reflect",
  reframe: "Reframe",
  relationships: "Relationships",
  crisis: "Crisis",
};

/** First number in "1–6" → 1 (start page). */
const startPageOf = (range: string) => {
  const m = range.match(/\d+/);
  return m ? Number(m[0]) : 1;
};

/**
 * Toolkit tab (M2-01) — design-system "Learn/Read" vertical.
 * Two views toggled by a segmented control:
 *   Contents — the 20 workbook chapters (`getChapters()`), grouped by
 *     content group, each row tinted with its group's --ex-* pair.
 *   Read — the workbook PDF (S07), `pdfRef.setPage()` jumps to the tapped
 *     chapter's start page. Page indicator + reload in the mini toolbar.
 *
 * Browse-first (S01): chapters are public content, no sign-in required.
 */
export default function ToolkitScreen() {
  const { mode } = useAppTheme();
  const c = colors[mode];

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<"contents" | "read">("contents");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  const pdfRef = useRef<PdfRef>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getChapters();
        setChapters(data ?? []);
      } catch (e) {
        setError(e instanceof Error ? e.message : String(e));
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  // Group chapters by content_group, preserving order_index within.
  const groups = useMemo(() => {
    const map = new Map<string, Chapter[]>();
    for (const ch of chapters) {
      const g = ch.content_group || "learn";
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(ch);
    }
    return Array.from(map.entries());
  }, [chapters]);

  const openChapter = (ch: Chapter) => {
    const target = startPageOf(ch.page_range);
    setPage(target);
    setView("read");
    // The Pdf may still be mounted from a previous read — jump immediately;
    // if it's freshly mounted, `page` prop handles the initial page.
    setTimeout(() => pdfRef.current?.setPage(target), 120);
  };

  const close = () => {
    // contents default; leave page state as-is so returning keeps position.
    setView("contents");
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <ScreenHeader title="Toolkit" subtitle="The workbook" />

      {/* Segmented control — Contents / Read */}
      <View style={styles.segment}>
        <M3Chip
          label="Contents"
          icon="format-list-bulleted"
          selected={view === "contents"}
          onPress={() => setView("contents")}
        />
        <M3Chip
          label="Read"
          icon="book-open-variant"
          selected={view === "read"}
          onPress={() => setView("read")}
        />
      </View>

      {view === "contents" ? (
        <ScrollView contentContainerStyle={styles.body}>
          {loading ? (
            <ChaptersSkeleton />
          ) : error ? (
            <View style={styles.errorBox}>
              <Text style={[styles.errorText, { color: c.error }]}>
                Couldn't load the chapter list. {error}
              </Text>
              <Pressable onPress={() => setError(null)} accessibilityRole="button">
                <Text style={[styles.retry, { color: c.secondary }]}>Retry</Text>
              </Pressable>
            </View>
          ) : groups.length === 0 ? (
            <Text style={[styles.empty, { color: c.textMuted }]}>
              No chapters yet. Run `npm run seed` to load the workbook outline.
            </Text>
          ) : (
            groups.map(([group, list]) => {
              const tone = GROUP_TONES[group] ?? GROUP_TONES.learn;
              const fg = c[tone.fg];
              const bg = c[tone.bg];
              return (
                <View key={group} style={styles.group}>
                  <View style={styles.groupHeader}>
                    <View style={[styles.groupDot, { backgroundColor: bg }]}>
                      <View style={[styles.groupDotCore, { backgroundColor: fg }]} />
                    </View>
                    <Text style={[styles.groupLabel, { color: fg }]}>
                      {GROUP_LABELS[group] ?? group}
                    </Text>
                    <Text style={[styles.groupCount, { color: c.textMuted }]}>
                      {list.length} {list.length === 1 ? "chapter" : "chapters"}
                    </Text>
                  </View>
                  {list.map((ch) => {
                    const fgNow = c[tone.fg];
                    const bgNow = c[tone.bg];
                    return (
                      <Pressable
                        key={ch.id}
                        onPress={() => openChapter(ch)}
                        accessibilityRole="button"
                        accessibilityLabel={`${ch.title}, page ${ch.page_range}`}
                        style={({ pressed }) => [
                          styles.chapterRow,
                          { backgroundColor: c.surface },
                          pressed && { opacity: 0.85 },
                        ]}
                      >
                        <View style={[styles.chapterNum, { backgroundColor: bgNow }]}>
                          <Text style={[styles.chapterNumText, { color: fgNow }]}>
                            {ch.order_index}
                          </Text>
                        </View>
                        <View style={styles.chapterText}>
                          <Text style={[styles.chapterTitle, { color: c.text }]}>
                            {ch.title}
                          </Text>
                          <Text style={[styles.chapterPages, { color: c.textMuted }]}>
                            p. {ch.page_range}
                          </Text>
                        </View>
                        <Text style={[styles.openChip, { color: fgNow }]}>Open ›</Text>
                      </Pressable>
                    );
                  })}
                </View>
              );
            })
          )}
        </ScrollView>
      ) : (
        <View style={styles.readWrap}>
          {/* Mini toolbar */}
          <View style={[styles.readToolbar, { borderBottomColor: c.divider }]}>
            <Pressable onPress={close} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back to contents">
              <Text style={[styles.backLink, { color: c.secondary }]}>‹ Contents</Text>
            </Pressable>
            <Text style={[styles.pageInfo, { color: c.textMuted }]}>
              Page {page}
              {total ? ` of ${total}` : ""}
            </Text>
            <Pressable onPress={() => setError(null)} hitSlop={10} accessibilityRole="button" accessibilityLabel="Reload workbook" disabled={!error}>
              <Text style={[styles.backLink, { color: error ? c.error : c.textFaint }]}>Reload</Text>
            </Pressable>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={[styles.errorText, { color: c.error }]}>
                Couldn't load the workbook. {error}
              </Text>
              <Pressable onPress={() => setError(null)} accessibilityRole="button">
                <Text style={[styles.retry, { color: c.secondary }]}>Retry</Text>
              </Pressable>
            </View>
          ) : (
            <Pdf
              ref={pdfRef}
              source={toolkitSource}
              page={page}
              style={styles.pdf}
              trustAllCerts={false}
              renderActivityIndicator={(progress) => (
                <View style={styles.loadingWrap}>
                  <M3Skeleton variant="card" style={styles.loadingCard} />
                  <Text style={[styles.loadingText, { color: c.textMuted }]}>
                    {progress > 0 ? `Loading… ${Math.round(progress * 100)}%` : "Loading…"}
                  </Text>
                </View>
              )}
              onPageChanged={(p, t) => {
                setPage(p);
                setTotal(t);
              }}
              onError={(e) => setError(String(e))}
            />
          )}
        </View>
      )}
    </View>
  );
}

function ChaptersSkeleton() {
  const { mode } = useAppTheme();
  const c = colors[mode];
  const widths = [72, 86, 62];
  return (
    <View>
      {[0, 1, 2].map((group) => (
        <View key={group} style={styles.group}>
          <View style={styles.groupHeader}>
            <M3Skeleton variant="block" style={styles.skelGroupDot} />
            <M3Skeleton variant="text-multi" width={group < 2 ? 90 : 120} />
          </View>
          {[0, 1, 2].map((i) => (
            <View key={i} style={[styles.chapterRow, { backgroundColor: c.surface }]}>
              <M3Skeleton variant="avatar" style={styles.skelNum} />
              <View style={styles.chapterText}>
                <M3Skeleton variant="text-multi" width={`${widths[(i + group) % widths.length]}%`} />
                <M3Skeleton variant="text-multi" width="30%" style={styles.skelSub} />
              </View>
            </View>
          ))}
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  segment: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingBottom: 8 },
  body: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 96 },
  group: { marginTop: 16 },
  groupHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  groupDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  groupDotCore: { width: 8, height: 8, borderRadius: 4 },
  groupLabel: { fontSize: 13, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
  groupCount: { fontSize: 12, fontWeight: "500", marginLeft: "auto" },
  chapterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  chapterNum: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  chapterNumText: { fontSize: 14, fontWeight: "800" },
  chapterText: { flex: 1 },
  chapterTitle: { fontSize: 15, lineHeight: 21, fontWeight: "600" },
  chapterPages: { marginTop: 2, fontSize: 12.5, lineHeight: 18, opacity: 0.85 },
  openChip: { fontSize: 13, fontWeight: "800", letterSpacing: 0.2 },
  readWrap: { flex: 1 },
  readToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backLink: { fontSize: 13, fontWeight: "700" },
  pageInfo: { fontSize: 12.5, fontWeight: "600" },
  pdf: { flex: 1, width: Dimensions.get("window").width },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  loadingCard: { width: "70%", height: 200 },
  loadingText: { fontSize: 13, fontWeight: "600" },
  errorBox: { paddingVertical: 48, alignItems: "center", paddingHorizontal: 24 },
  errorText: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  retry: { marginTop: 12, fontSize: 14, fontWeight: "800", letterSpacing: 0.1 },
  empty: { paddingVertical: 48, fontSize: 14, lineHeight: 20, textAlign: "center" },
  skelGroupDot: { width: 16, height: 16, borderRadius: 8 },
  skelNum: { width: 34, height: 34, borderRadius: 10 },
  skelSub: { marginTop: 6 },
});