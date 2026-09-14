import { useEffect, useState } from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Text } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import ScreenHeader from "../../components/ScreenHeader";
import M3Button from "../../components/M3Button";
import M3Card from "../../components/M3Card";
import { getSessions, getJournalEntries } from "../../lib/db";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";

/**
 * Home / dashboard tab — design-system §21 Composite 1 + §11 weekly chart.
 * Greeting card · stat cards · today's plan stepper · quick actions · recent
 * activity · "Start today's session" CTA · warm reminder · weekly window chart.
 *
 * The greeting card sits at the top of the body — replacing what used to be
 * a bespoke header — so the day opens with a personal anchor. `ThemeToggle`
 * on the right of the ScreenHeader is the only top-right action (avatar
 * removed; profile access is reached through the greeting card's chevron).
 */
export default function HomeScreen() {
  const router = useRouter();
  const { mode } = useAppTheme();
  const c = colors[mode];

  const [sessionCount, setSessionCount] = useState<number | null>(null);
  const [recentSession, setRecentSession] = useState<SessionRow | null>(null);
  const [recentEntry, setRecentEntry] = useState<EntryRow | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const s = await getSessions();
        setSessionCount(s?.length ?? 0);
        if (s && s.length) setRecentSession(s[0]);
      } catch {
        // Not signed in (or offline) — stats/activity stay hidden.
      }
      try {
        const j = await getJournalEntries();
        if (j && j.length) setRecentEntry(j[0]);
      } catch {
        // Not signed in — recent journal stays hidden.
      }
    })();
  }, []);

  const now = new Date();
  const dateLabel = now.toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  const hour = now.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  // Time-of-day reflection copy. Sourced once from a small static table —
  // no fabricated evaluations, just a supportive sentence for the moment.
  const reflection =
    hour < 12
      ? "Notice what your morning body is carrying before you start."
      : hour < 18
      ? "A short pause mid-day can reset the next few hours."
      : "Wind down slowly — your nervous system notices how you end the day.";

  const relative = (iso: string) => {
    const mins = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (mins < 60) return `${mins}m`;
    const h = Math.floor(mins / 60);
    if (h < 24) return `${h}h`;
    const d = Math.floor(h / 24);
    return d === 1 ? "1d" : `${d}d`;
  };

  const quickActions = [
    { label: "Breathe", icon: "weather-windy" as const, fg: c.exBreath, bg: c.exBreathBg, route: "/exercise/category/breathing" },
    { label: "Ground", icon: "leaf" as const, fg: c.exGround, bg: c.exGroundBg, route: "/exercise/category/sensory" },
    { label: "Journal", icon: "notebook-edit-outline" as const, fg: c.exJournal, bg: c.exJournalBg, route: "/diary" },
    { label: "Crisis", icon: "lifebuoy" as const, fg: c.exCrisis, bg: c.exCrisisBg, route: "/crisis/index" },
  ];

  // Design-system §11 — App Screen Sketch. Dummy weekly bars until M3 wiring.
  // Today is dashed (no fill) so the chart still looks alive pre-data.
  const thisWeek: { day: string; state: "window" | "hyper" | "hypo" | "today"; height: number }[] = [
    { day: "Mon", state: "window", height: 28 },
    { day: "Tue", state: "hyper", height: 18 },
    { day: "Wed", state: "window", height: 24 },
    { day: "Thu", state: "hypo", height: 14 },
    { day: "Fri", state: "window", height: 32 },
    { day: "Sat", state: "window", height: 22 },
    { day: "Today", state: "today", height: 24 },
  ];
  const daysInWindow = thisWeek.filter((d) => d.state === "window").length;
  const inWindowPct = Math.round((daysInWindow / 6) * 100);

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      {/* Zone 1 · ScreenHeader — ThemeToggle only (avatar removed). */}
      <ScreenHeader title="Calm Anchor" />

      {/* Zone 2 · content */}
      <ScrollView contentContainerStyle={styles.body}>
        {/* Greeting card — anchored at the top of the day. Featured warm tone,
            gives the user the date + greeting + a single supportive sentence +
            a route into the profile (replacing the top-right avatar). */}
        <Pressable
          style={[
            styles.greetingCard,
            { backgroundColor: mode === "light" ? c.warmGold : c.warmGoldTint },
          ]}
          onPress={() => router.push("/profile/index")}
          accessibilityRole="button"
          accessibilityLabel={`${greeting}, Amir. Open profile.`}
        >
          <View
            style={[
              styles.greetingIcon,
              { backgroundColor: mode === "light" ? c.warmGoldTint : c.warmGold },
            ]}
          >
            <MaterialCommunityIcons
              name={hour < 12 ? "weather-sunset-up" : hour < 18 ? "white-balance-sunny" : "weather-night"}
              size={24}
              color={mode === "light" ? c.warmGold : c.textInverse}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={[
                styles.greetingKicker,
                { color: mode === "light" ? c.warmGoldTint : c.warmGold },
              ]}
            >
              {dateLabel.toUpperCase()}
            </Text>
            <Text style={[styles.greetingHeadline, { color: c.text }]}>
              {greeting}, Amir
            </Text>
            <Text
              style={[
                styles.greetingReflection,
                { color: mode === "light" ? c.secondary : c.textMuted },
              ]}
            >
              {reflection}
            </Text>
          </View>
          <MaterialCommunityIcons
            name="chevron-right"
            size={22}
            color={mode === "light" ? c.warmGoldTint : c.warmGold}
          />
        </Pressable>

        {/* Stats row — sessions real when signed in; streak + window are dummy
            placeholders until M3 wiring (design-system §11 supplies the chart).
            Toned-down palette: accent (sage) and warmGold replace primary green. */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, { backgroundColor: c.surface }]}>
            <Text style={[styles.statValue, { color: c.accent }]}>
              {sessionCount != null ? sessionCount : "12"}
            </Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>Sessions</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: c.surface }]}>
            <Text style={[styles.statValue, { color: c.warmGoldSubtle }]}>5d</Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>Streak</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: c.surface }]}>
            <Text style={[styles.statValue, { color: c.secondary }]}>{inWindowPct}%</Text>
            <Text style={[styles.statLabel, { color: c.textMuted }]}>In window</Text>
          </View>
        </View>

        {/* Today's plan */}
        <M3Card style={styles.planCard}>
          <Text style={[styles.planTitle, { color: c.text }]}>Today's plan</Text>
          <View style={styles.stepper}>
            <Pressable
              style={styles.step}
              accessibilityRole="button"
              accessibilityLabel="Check-in, done"
              onPress={() => router.push("/(tabs)/exercises")}
            >
              <View style={[styles.stepCircle, { backgroundColor: c.accent }]}>
                <MaterialCommunityIcons name="check" size={16} color={c.textInverse} />
              </View>
              <Text style={[styles.stepLabel, { color: c.textMuted }]}>Check-in</Text>
            </Pressable>
            <View style={[styles.connector, { backgroundColor: c.divider }]} />
            <Pressable
              style={styles.step}
              accessibilityRole="button"
              accessibilityLabel="Exercise, current step"
              onPress={() => router.push("/(tabs)/exercises")}
            >
              <View style={[styles.stepCircle, { backgroundColor: c.secondary }]}>
                <Text style={[styles.stepNumber, { color: c.textInverse }]}>2</Text>
              </View>
              <Text style={[styles.stepLabel, { color: c.text }]}>Exercise</Text>
            </Pressable>
            <View style={[styles.connector, { backgroundColor: c.divider }]} />
            <Pressable
              style={styles.step}
              accessibilityRole="button"
              accessibilityLabel="Journal, next"
              onPress={() => router.push("/diary")}
            >
              <View style={[styles.stepCircle, { backgroundColor: c.surfaceOffset }]}>
                <Text style={[styles.stepNumber, { color: c.textMuted }]}>3</Text>
              </View>
              <Text style={[styles.stepLabel, { color: c.textMuted }]}>Journal</Text>
            </Pressable>
          </View>
        </M3Card>

        {/* Quick actions — colour-fields tiles */}
        <Text style={[styles.sectionTitle, { color: c.text }]}>Quick relief</Text>
        <View style={styles.grid}>
          {quickActions.map((qa) => (
            <View key={qa.label} style={styles.tile}>
              <M3Card fill={qa.bg} onPress={() => router.push(qa.route as never)}>
                <MaterialCommunityIcons name={qa.icon} size={26} color={qa.fg} />
                <Text style={[styles.tileLabel, { color: qa.fg }]}>{qa.label}</Text>
              </M3Card>
            </View>
          ))}
        </View>

        {/* This week in your window — design-system §11 */}
        <Text style={[styles.sectionTitle, { color: c.text }]}>This week in your window</Text>
        <View style={[styles.weekCard, { backgroundColor: c.surface }]}>
          <View style={styles.weekHead}>
            <View style={{ flex: 1 }}>
              <Text style={[styles.weekTitle, { color: c.text }]}>Where you spent the week</Text>
              <Text style={[styles.weekSub, { color: c.textMuted }]}>
                {daysInWindow} of 6 days in window
              </Text>
            </View>
            <View style={[styles.weekBadge, { backgroundColor: c.nsWindowBg }]}>
              <MaterialCommunityIcons name="chart-bar" size={14} color={c.nsWindow} />
              <Text style={[styles.weekBadgeLabel, { color: c.nsWindow }]}>{inWindowPct}%</Text>
            </View>
          </View>
          <View style={styles.weekBars}>
            {thisWeek.map((d) => {
              const isToday = d.state === "today";
              const fg =
                d.state === "window"
                  ? c.nsWindow
                  : d.state === "hyper"
                  ? c.nsHyper
                  : d.state === "hypo"
                  ? c.nsHypo
                  : c.secondary;
              const bg =
                d.state === "window"
                  ? c.nsWindow
                  : d.state === "hyper"
                  ? c.nsHyper
                  : d.state === "hypo"
                  ? c.nsHypo
                  : "transparent";
              return (
                <View key={d.day} style={styles.weekCol}>
                  <View
                    style={[
                      styles.weekBar,
                      {
                        height: d.height,
                        backgroundColor: isToday ? "transparent" : bg,
                        borderColor: fg,
                        borderWidth: isToday ? 1.5 : 0,
                        borderStyle: isToday ? "dashed" : "solid",
                      },
                    ]}
                  />
                  <Text
                    style={[
                      styles.weekLabel,
                      {
                        color: isToday ? c.text : c.textMuted,
                        fontWeight: isToday ? "700" : "500",
                      },
                    ]}
                  >
                    {d.day}
                  </Text>
                </View>
              );
            })}
          </View>
          <View style={styles.weekLegend}>
            <View style={styles.legendRow}>
              <View style={[styles.legendSwatch, { backgroundColor: c.nsWindow }]} />
              <Text style={[styles.legendText, { color: c.textMuted }]}>Window</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendSwatch, { backgroundColor: c.nsHyper }]} />
              <Text style={[styles.legendText, { color: c.textMuted }]}>Hyper</Text>
            </View>
            <View style={styles.legendRow}>
              <View style={[styles.legendSwatch, { backgroundColor: c.nsHypo }]} />
              <Text style={[styles.legendText, { color: c.textMuted }]}>Hypo</Text>
            </View>
          </View>
        </View>

        {/* Recent activity — real data when signed in, hidden otherwise */}
        {recentSession || recentEntry ? (
          <>
            <Text style={[styles.sectionTitle, { color: c.text }]}>Recent</Text>
            {recentSession && recentSession.exercises ? (
              <View style={[styles.activityRow, { backgroundColor: c.surface }]}>
                <View style={[styles.activityIcon, { backgroundColor: c.accentTint }]}>
                  <MaterialCommunityIcons name="check-circle" size={18} color={c.accent} />
                </View>
                <View style={styles.activityText}>
                  <Text style={[styles.activityTitle, { color: c.text }]}>
                    {recentSession.exercises.title}
                  </Text>
                  <Text style={[styles.activitySubtitle, { color: c.textMuted }]}>
                    Session · {relative(recentSession.started_at)}
                  </Text>
                </View>
              </View>
            ) : null}
            {recentEntry ? (
              <View style={[styles.activityRow, { backgroundColor: c.surface }]}>
                <View style={[styles.activityIcon, { backgroundColor: c.exJournalBg }]}>
                  <MaterialCommunityIcons name="notebook-edit-outline" size={18} color={c.exJournal} />
                </View>
                <View style={styles.activityText}>
                  <Text style={[styles.activityTitle, { color: c.text }]} numberOfLines={1}>
                    {recentEntry.prompts?.prompt_text
                      ? `Journal · ${recentEntry.prompts.prompt_text}`
                      : "Journal entry"}
                  </Text>
                  <Text style={[styles.activitySubtitle, { color: c.textMuted }]}>
                    Reflection · {relative(recentEntry.created_at)}
                  </Text>
                </View>
              </View>
            ) : null}
          </>
        ) : null}

        {/* CTA — secondary tone (warm olive) instead of loud primary green. */}
        <M3Button
          label="Start today's session"
          icon="play"
          iconRight
          onPress={() => router.push("/(tabs)/exercises")}
          style={styles.cta}
          color={c.secondary}
        />

        {/* Warm reminder — colour-contrast nudge → /diary/new */}
        <Pressable
          style={[styles.reminderCard, { backgroundColor: c.exSelfkindBg }]}
          onPress={() => router.push("/diary/new")}
          accessibilityRole="button"
          accessibilityLabel="Write a quick reflection"
        >
          <View style={[styles.reminderIcon, { backgroundColor: c.exSelfkind }]}>
            <MaterialCommunityIcons name="hand-heart-outline" size={20} color={c.textInverse} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.reminderTitle, { color: c.exSelfkind }]}>
              Be gentle with yourself
            </Text>
            <Text style={[styles.reminderBody, { color: c.text }]}>
              You don't have to feel a certain way today. A short reflection is enough.
            </Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={c.exSelfkind} />
        </Pressable>
      </ScrollView>
    </View>
  );
}

interface SessionRow {
  started_at: string;
  exercises: { title: string; category: string } | null;
}

interface EntryRow {
  created_at: string;
  prompts: { prompt_text: string } | null;
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  body: { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 96 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 16 },
  statCard: { flex: 1, borderRadius: 12, paddingVertical: 14, alignItems: "center" },
  statValue: { fontSize: 24, lineHeight: 30, fontWeight: "800" },
  statLabel: { marginTop: 2, fontSize: 12, lineHeight: 16, fontWeight: "500" },
  planCard: { marginBottom: 4 },
  planTitle: { fontSize: 16, lineHeight: 24, fontWeight: "700", marginBottom: 14 },
  stepper: { flexDirection: "row", alignItems: "center" },
  step: { alignItems: "center", gap: 6, flex: 1 },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumber: { fontSize: 13, lineHeight: 18, fontWeight: "700" },
  stepLabel: { fontSize: 12, lineHeight: 16, fontWeight: "500" },
  connector: { height: 2, width: 24, marginBottom: 18 },
  sectionTitle: {
    marginTop: 24,
    marginBottom: 8,
    fontSize: 20,
    lineHeight: 26,
    fontWeight: "800",
    letterSpacing: -0.02,
  },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  tile: { width: "48%", flexGrow: 1 },
  tileLabel: { marginTop: 8, fontSize: 16, lineHeight: 24, fontWeight: "700" },
  activityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  activityIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  activityText: { flex: 1 },
  activityTitle: { fontSize: 15, lineHeight: 21, fontWeight: "600" },
  activitySubtitle: { marginTop: 2, fontSize: 13, lineHeight: 18, opacity: 0.85 },
  cta: { marginTop: 20, alignSelf: "stretch" },

  // --- This week in your window (§11) ---------------------------------------
  weekCard: { borderRadius: 16, padding: 16, marginTop: 4 },
  weekHead: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", marginBottom: 16 },
  weekTitle: { fontSize: 16, fontWeight: "800", lineHeight: 22, letterSpacing: -0.2 },
  weekSub: { marginTop: 2, fontSize: 12.5, lineHeight: 18, opacity: 0.9 },
  weekBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  weekBadgeLabel: { fontSize: 12.5, fontWeight: "800", letterSpacing: 0.2 },
  weekBars: { flexDirection: "row", alignItems: "flex-end", gap: 8, height: 56 },
  weekCol: { flex: 1, alignItems: "center", gap: 6 },
  weekBar: { width: "100%", borderRadius: 4 },
  weekLabel: { fontSize: 11, lineHeight: 14 },
  weekLegend: { flexDirection: "row", gap: 14, marginTop: 14 },
  legendRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendSwatch: { width: 10, height: 10, borderRadius: 3 },
  legendText: { fontSize: 12, lineHeight: 16, fontWeight: "600" },

  // --- Warm reminder --------------------------------------------------------
  reminderCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    padding: 14,
    marginTop: 16,
  },
  reminderIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  reminderTitle: { fontSize: 15, fontWeight: "800", lineHeight: 21 },
  reminderBody: { marginTop: 2, fontSize: 13, lineHeight: 19, opacity: 0.9 },

  // --- Greeting card (anchored at the top of the dashboard) ---------------
  greetingCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    borderRadius: 18,
    padding: 16,
    marginTop: 4,
    marginBottom: 16,
  },
  greetingIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  greetingKicker: {
    fontSize: 11,
    lineHeight: 14,
    fontWeight: "800",
    letterSpacing: 0.8,
  },
  greetingHeadline: {
    fontSize: 22,
    lineHeight: 28,
    fontWeight: "800",
    letterSpacing: -0.3,
    marginTop: 2,
  },
  greetingReflection: {
    marginTop: 4,
    fontSize: 13,
    lineHeight: 19,
  },
});
