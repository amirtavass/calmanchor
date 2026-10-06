import { View, StyleSheet, Pressable, ScrollView } from "react-native";
import { Text } from "react-native-paper";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";
import { useRouter } from "expo-router";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAppTheme } from "../../theme/ThemeContext";
import { colors } from "../../theme/tokens";
import { UK_CRISIS_CONTACTS } from "../../lib/crisisContacts";

/**
 * Crisis landing (modal, always one tap away). S11: crisis exercises are a
 * category of exercises — Ground and Breathe deep-link to the real exercise
 * screens (sensory grounding + crisis/box breathing), not placeholder views.
 * UK contacts are visible, never intrusive. Usage is never logged (IA §3).
 * Craft §10.4: exit is a quiet icon-only close; actions are colour-field
 * tiles (the dashboard quick-action idiom).
 */
export default function CrisisIndexScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { mode } = useAppTheme();
  const c = colors[mode];

  return (
    <View style={[styles.root, { backgroundColor: c.bg }]}>
      {/* Quiet header — icon-only close (craft §10.4) */}
      <View style={[styles.header, { paddingTop: insets.top + 6 }]}>
        <View style={styles.side} />
        <View style={styles.centre}>
          <Text style={[styles.title, { color: c.text }]}>Crisis help</Text>
        </View>
        <View style={[styles.side, styles.right]}>
          <Pressable
            onPress={() => router.back()}
            hitSlop={10}
            accessibilityRole="button"
            accessibilityLabel="Close crisis help"
            style={[styles.close, { backgroundColor: c.surfaceOffset }]}
          >
            <MaterialCommunityIcons name="close" size={20} color={c.textMuted} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.body}>
        <Text style={[styles.headline, { color: c.text }]}>Take a moment.</Text>
        <Text style={[styles.subline, { color: c.textMuted }]}>
          Grounding, breathing and your quick reset are one tap away.
        </Text>

        {/* Actions — colour-field tiles (dashboard quick-action idiom) */}
        <Pressable
          onPress={() => router.push("/exercise/category/sensory")}
          accessibilityRole="button"
          accessibilityLabel="Ground — 5-4-3-2-1"
          style={({ pressed }) => [
            styles.tile,
            { backgroundColor: c.exGroundBg, borderColor: c.exGround },
            pressed && { opacity: 0.85 },
          ]}
        >
          <View style={[styles.tileIcon, { backgroundColor: c.exGround }]}>
            <MaterialCommunityIcons name="leaf" size={22} color={c.textInverse} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.tileTitle, { color: c.exGround }]}>Ground</Text>
            <Text style={[styles.tileBody, { color: c.text }]}>5-4-3-2-1 sensory grounding</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={c.exGround} />
        </Pressable>

        <Pressable
          onPress={() => router.push("/exercise/category/crisis")}
          accessibilityRole="button"
          accessibilityLabel="Breathe — box breathing"
          style={({ pressed }) => [
            styles.tile,
            { backgroundColor: c.exBreathBg, borderColor: c.exBreath },
            pressed && { opacity: 0.85 },
          ]}
        >
          <View style={[styles.tileIcon, { backgroundColor: c.exBreath }]}>
            <MaterialCommunityIcons name="weather-windy" size={22} color={c.textInverse} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.tileTitle, { color: c.exBreath }]}>Breathe</Text>
            <Text style={[styles.tileBody, { color: c.text }]}>Box breathing (4-4-4-4)</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={c.exBreath} />
        </Pressable>

        <Pressable
          onPress={() => router.push("/exercise/category/crisis")}
          accessibilityRole="button"
          accessibilityLabel="Quick reset"
          style={({ pressed }) => [
            styles.tile,
            { backgroundColor: c.exCrisisBg, borderColor: c.exCrisis },
            pressed && { opacity: 0.85 },
          ]}
        >
          <View style={[styles.tileIcon, { backgroundColor: c.exCrisis }]}>
            <MaterialCommunityIcons name="lifebuoy" size={22} color={c.textInverse} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.tileTitle, { color: c.exCrisis }]}>Quick reset</Text>
            <Text style={[styles.tileBody, { color: c.text }]}>Tools for the bad days</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={20} color={c.exCrisis} />
        </Pressable>

        {/* UK contacts — visible, not intrusive */}
        <View style={[styles.contactCard, { backgroundColor: c.surface }]}>
          <Text style={[styles.contactLabel, { color: c.textMuted }]}>UK crisis contacts</Text>
          {UK_CRISIS_CONTACTS.map((contact, i) => (
            <View key={contact.name} style={[styles.contactRow, i > 0 ? styles.contactBorder : null]}>
              <View style={{ flex: 1 }}>
                <Text style={[styles.contactName, { color: c.text }]}>{contact.name}</Text>
                {contact.note ? (
                  <Text style={[styles.contactNote, { color: c.textMuted }]}>{contact.note}</Text>
                ) : null}
              </View>
              <Text style={[styles.contactValue, { color: c.exCrisis }]}>{contact.value}</Text>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
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
  side: { width: 44, alignItems: "flex-start", justifyContent: "center" },
  right: { alignItems: "flex-end" },
  centre: { flex: 1, alignItems: "center" },
  close: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  title: { fontSize: 16, lineHeight: 24, fontWeight: "700" },
  body: { padding: 20, paddingBottom: 32 },
  headline: { fontSize: 24, lineHeight: 32, fontWeight: "800", letterSpacing: -0.3 },
  subline: { marginTop: 6, fontSize: 14.5, lineHeight: 21, opacity: 0.9 },
  tile: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
    marginTop: 16,
  },
  tileIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  tileTitle: { fontSize: 15, fontWeight: "800", lineHeight: 21 },
  tileBody: { marginTop: 2, fontSize: 13, lineHeight: 19, opacity: 0.9 },
  contactCard: { borderRadius: 12, padding: 14, marginTop: 24 },
  contactLabel: { fontSize: 12, fontWeight: "800", letterSpacing: 0.6, textTransform: "uppercase" },
  contactLine: { marginTop: 6, fontSize: 14, lineHeight: 20 },
  contactRow: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 10 },
  contactBorder: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: "rgba(0,0,0,0.08)" },
  contactName: { fontSize: 14.5, lineHeight: 20, fontWeight: "600" },
  contactNote: { marginTop: 1, fontSize: 12, lineHeight: 16 },
  contactValue: { fontSize: 14.5, lineHeight: 20, fontWeight: "700" },
});