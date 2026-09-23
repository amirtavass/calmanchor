import { useEffect, useMemo, useRef, useState } from "react";
import type { ComponentProps } from "react";
import { View, StyleSheet, ScrollView, Pressable, Dimensions } from "react-native";
import { Text } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import Pdf, { PdfRef } from "react-native-pdf";
import ScreenHeader from "../../components/ScreenHeader";
import M3Button from "../../components/M3Button";
import M3Skeleton from "../../components/M3Skeleton";
import { useSignInGate } from "../../components/SignInPrompt";
import { getChapters } from "../../lib/db";
import { useSession } from "../../lib/auth";
import { toolkitSource } from "../../lib/toolkit";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";

type MciGlyph = ComponentProps<typeof MaterialCommunityIcons>["name"];

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

const SIGNED_OUT_PAGE_LIMIT = 10;

/** First number in "1–6" → 1 (start page). */
const startPageOf = (range: string) => {
  const m = range.match(/\d+/);
  return m ? Number(m[0]) : 1;
};

/**
 * Toolkit tab (M2-01) — design-system "Learn/Read" vertical.
 * Two views toggled by a pair of M3Buttons (the app's button language, not the
 * old exercise-chip idiom):
 *   Contents — the 20 workbook chapters (`getChapters()`), grouped by
 *     content group. Each row is the diary "entry card" pattern (40dp tinted
 *     number medallion + title 15/600 + "p. range" meta + chevron-right).
 *   Read — the workbook PDF (S07), `pdfRef.setPage()` jumps to the tapped
 *     chapter's start page. Page info is a meta pill; reload is an icon circle.
 *
 * The Pdf stays mounted; Contents is an overlay inside readWrap so the viewer
 * never unmounts/remounts (no re-download, no white-screen flash) and the
 * segment above stays visible. Browse-first (S01): chapters are public.
 */
export default function ToolkitScreen() {
  const { mode } = useAppTheme();
  const c = colors[mode];
  const { signedIn } = useSession();
  const { gate, prompt } = useSignInGate({
    title: "Continue with the full Toolkit",
    message: "Sign in with Google to read the remaining pages and save your progress.",
  });

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

  const openPage = (targetPage: number) => {
    // Jump via the imperative ref (native setNativePage) instead of the
    // controlled `page` prop — avoids the prop→componentDidUpdate→scrollToIndex
    // re-render loop that white-screens while swiping.
    pdfRef.current?.setPage(targetPage);
    setView("read");
  };

  const openChapter = (ch: Chapter) => {
    const targetPage = startPageOf(ch.page_range);
    if (!signedIn && targetPage > SIGNED_OUT_PAGE_LIMIT) {
      gate(() => openPage(targetPage));
      return;
    }
    openPage(targetPage);
  };

  const segmentBtn = (label: string, icon: MciGlyph, target: "contents" | "read") => {
    const active = view === target;
    return (
      <M3Button
        label={label}
        icon={icon}
        variant={active ? "filled" : "outlined"}
        color={active ? c.secondaryActive : c.secondary}
        onPress={() => setView(target)}
        style={styles.segmentBtn}
      />
    );
  };

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      <ScreenHeader title="Toolkit" subtitle="The workbook" />

      <View style={styles.bodyWrap}>
        {/* Segment — two M3Buttons, the app's current control language */}
        <View style={styles.segment}>
          {segmentBtn("Contents", "format-list-bulleted", "contents")}
          {segmentBtn("Read", "book-open-variant", "read")}
        </View>

        <View style={styles.readWrap}>
          {/* Read toolbar — meta pill + icon reload, not bare text links */}
          <View style={[styles.readToolbar, { borderBottomColor: c.divider }]}>
            <M3Button
              label="Contents"
              icon="arrow-left"
              variant="text"
              color={c.secondary}
              onPress={() => setView("contents")}
            />
            <View style={[styles.pagePill, { backgroundColor: c.surface2 }]}>
              <MaterialCommunityIcons name="book-open-page-variant" size={14} color={c.textMuted} />
              <Text style={[styles.pageText, { color: c.textMuted }]}>Page {signedIn ? page : Math.min(page, SIGNED_OUT_PAGE_LIMIT)}
                {signedIn ? (total ? ` of ${total}` : "") : ` of ${Math.min(total || SIGNED_OUT_PAGE_LIMIT, SIGNED_OUT_PAGE_LIMIT)}`}
              </Text>
            </View>
            <Pressable
              onPress={() => setError(null)}
              hitSlop={10}
              accessibilityRole="button"
              accessibilityLabel="Reload workbook"
              disabled={!error}
              style={[styles.reloadBtn, { backgroundColor: c.surfaceOffset }]}
            >
              <MaterialCommunityIcons name="refresh" size={20} color={error ? c.error : c.textMuted} />
            </Pressable>
          </View>

          {error ? (
            <View style={styles.errorBox}>
              <Text style={[styles.errorText, { color: c.error }]}>
                Couldn't load the workbook. {error}
              </Text>
              <M3Button label="Retry" color={c.secondary} onPress={() => setError(null)} style={styles.retry} />
            </View>
          ) : (
            <Pdf
              ref={pdfRef}
              source={toolkitSource}
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
                setTotal(t);
                if (!signedIn && p > SIGNED_OUT_PAGE_LIMIT) {
                  setPage(SIGNED_OUT_PAGE_LIMIT);
                  pdfRef.current?.setPage(SIGNED_OUT_PAGE_LIMIT);
                  gate(() => openPage(p));
                  return;
                }
                setPage(p);
              }}
              onError={(e) => setError(String(e))}
            />
          )}

          {/* Contents overlay — lives INSIDE readWrap so its absoluteFill only
              covers the PDF area, never the Contents/Read buttons above. */}
          {view === "contents" ? (
            <View style={[styles.contentsOverlay, { backgroundColor: c.bg }]}>
              <ScrollView contentContainerStyle={styles.body}>
                {loading ? (
                  <ChaptersSkeleton />
                ) : error ? (
                  <View style={styles.errorBox}>
                    <Text style={[styles.errorText, { color: c.error }]}>
                      Couldn't load the chapter list. {error}
                    </Text>
                    <M3Button label="Retry" color={c.secondary} onPress={() => setError(null)} style={styles.retry} />
                  </View>
                ) : groups.length === 0 ? (
                  <View style={styles.emptyState}>
                    <View style={[styles.emptyMedallion, { backgroundColor: c.exBreathBg }]}>
                      <MaterialCommunityIcons name="book-open-page-variant-outline" size={32} color={c.exBreath} />
                    </View>
                    <Text style={[styles.emptyTitle, { color: c.text }]}>No chapters yet</Text>
                    <Text style={[styles.emptyDesc, { color: c.textMuted }]}>
                      Run `npm run seed` to load the workbook outline.
                    </Text>
                  </View>
                ) : (
                  groups.map(([group, list]) => {
                    const tone = GROUP_TONES[group] ?? GROUP_TONES.learn;
                    const fg = c[tone.fg];
                    const bg = c[tone.bg];
                    return (
                      <View key={group} style={styles.group}>
                        <View style={styles.groupHeader}>
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
                              <MaterialCommunityIcons name="chevron-right" size={20} color={c.textMuted} />
                            </Pressable>
                          );
                        })}
                      </View>
                    );
                  })
                )}
              </ScrollView>
            </View>
          ) : null}
        </View>
      </View>
      {prompt}
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
  bodyWrap: { flex: 1 },
  segment: { flexDirection: "row", gap: 8, paddingHorizontal: 16, paddingVertical: 8 },
  segmentBtn: { flex: 1 },
  body: { paddingHorizontal: 16, paddingTop: 4, paddingBottom: 96 },
  group: { marginTop: 16 },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  groupLabel: { fontSize: 13, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
  groupCount: { fontSize: 12, fontWeight: "500" },
  chapterRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  chapterNum: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  chapterNumText: { fontSize: 16, fontWeight: "800" },
  chapterText: { flex: 1 },
  chapterTitle: { fontSize: 15, lineHeight: 21, fontWeight: "600" },
  chapterPages: { marginTop: 2, fontSize: 13, lineHeight: 18, opacity: 0.85 },
  readWrap: { flex: 1 },
  contentsOverlay: { ...(StyleSheet.absoluteFill as object) },
  readToolbar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  pagePill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  pageText: { fontSize: 12.5, fontWeight: "600", letterSpacing: 0.1 },
  reloadBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  pdf: { flex: 1, width: Dimensions.get("window").width },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12, padding: 24 },
  loadingCard: { width: "70%", height: 200 },
  loadingText: { fontSize: 13, fontWeight: "600" },
  errorBox: { paddingVertical: 48, alignItems: "center", paddingHorizontal: 24 },
  errorText: { fontSize: 14, lineHeight: 20, textAlign: "center" },
  retry: { marginTop: 16, minWidth: 140 },
  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyMedallion: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  emptyTitle: { fontSize: 18, lineHeight: 26, fontWeight: "800", textAlign: "center" },
  emptyDesc: { marginTop: 6, fontSize: 14, lineHeight: 20, textAlign: "center", maxWidth: 280 },
  skelNum: { width: 40, height: 40, borderRadius: 12 },
  skelSub: { marginTop: 6 },
});
