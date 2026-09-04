/// <reference types="node" />
import "dotenv/config";
import { createClient } from "@supabase/supabase-js";

// ============================================================
// CalmAnchor — 3-persona dummy data for schema/query stress test
// (per 2 Sep meeting: populate DB with dummy data for active /
//  power / infrequent users and stress-test schema + queries.)
//
// Run with the service role (bypasses RLS):
//   npx ts-node services/personas.ts
//
// Creates: 3 auth users + profiles + checkins + journal_entries +
// exercise_sessions (+ tags). Tagged emails <persona>@persona.calm.
// Idempotent-ish: deletes prior persona rows by email prefix first.
// ============================================================

const url = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabase = createClient(url, serviceKey, { auth: { autoRefreshToken: false, persistSession: false } });

// Personas — shape the data so each stress-tests different query paths.
const personas = [
  {
    key: "active",
    email: "active@persona.calm",
    displayName: "Active Alex",
    profile: { age_band: "25-34", gender: "non-binary", ethnicity: "White", treatment_status: "In therapy", referral_source: "Friend" },
    // 5 check-ins, 8 sessions over 7 days, 6 journal entries — dense but realistic
    checkins: [
      { daysAgo: 6, ns_state: "hyper", survival_response: "fight", triggers: ["work stress"], note: "woke up wired" },
      { daysAgo: 5, ns_state: "dysregulated", survival_response: "flight", triggers: ["email"], note: "spiralled" },
      { daysAgo: 4, ns_state: "window", survival_response: null, triggers: [], note: "felt okay" },
      { daysAgo: 2, ns_state: "hypo", survival_response: "freeze", triggers: ["loud noise"], note: "shut down" },
      { daysAgo: 0, ns_state: "window", survival_response: null, triggers: [], note: "regulated today" },
    ],
    sessions: [
      { daysAgo: 6, exIdx: 0, distressBefore: 7, distressAfter: 4, helpfulness: 8, note: "breathing helped" },
      { daysAgo: 5, exIdx: 1, distressBefore: 6, distressAfter: 5, helpfulness: 5, note: null },
      { daysAgo: 5, exIdx: 2, distressBefore: 8, distressAfter: 3, helpfulness: 9, note: "5-4-3-2-1 grounding" },
      { daysAgo: 4, exIdx: 0, distressBefore: 3, distressAfter: 2, helpfulness: 7, note: null },
      { daysAgo: 3, exIdx: 3, distressBefore: 5, distressAfter: 3, helpfulness: 6, note: "humming" },
      { daysAgo: 2, exIdx: 2, distressBefore: 8, distressAfter: 5, helpfulness: 7, note: "freeze -> grounding" },
      { daysAgo: 1, exIdx: 4, distressBefore: 4, distressAfter: 2, helpfulness: 8, note: "self-holding" },
      { daysAgo: 0, exIdx: 0, distressBefore: 2, distressAfter: 1, helpfulness: 9, note: "good session" },
    ],
    journal: [
      { daysAgo: 6, body: "I keep waking up wired. Noticed the fight response at work." },
      { daysAgo: 5, body: "Emails trigger me. I want to pause before replying." },
      { daysAgo: 4, body: "Today was calmer. I felt present at lunch." },
      { daysAgo: 3, body: "Inner child work: the younger me wanted reassurance." },
      { daysAgo: 1, body: "Frozen by the loud noise yesterday. Grounding helped." },
      { daysAgo: 0, body: "A good day. I remembered to breathe." },
    ],
  },
  {
    key: "power",
    email: "power@persona.calm",
    displayName: "Power Priya",
    profile: { age_band: "35-44", gender: "female", ethnicity: "Asian", treatment_status: "Not in therapy", referral_source: "NHS" },
    // 12 sessions, 3 check-ins, 2 journal entries over 7 days — heavy usage
    checkins: [
      { daysAgo: 5, ns_state: "window", survival_response: null, triggers: [], note: null },
      { daysAgo: 2, ns_state: "hyper", survival_response: "flight", triggers: ["deadline"], note: "anxious all day" },
      { daysAgo: 0, ns_state: "window", survival_response: null, triggers: [], note: null },
    ],
    sessions: Array.from({ length: 12 }, (_, i) => ({
      daysAgo: 6 - Math.floor(i / 2),
      exIdx: i % 6,
      distressBefore: 4 + (i % 4),
      distressAfter: Math.max(1, 4 + (i % 4) - 2),
      helpfulness: 6 + (i % 3),
      note: i % 3 === 0 ? `session ${i + 1} note` : null,
    })),
    journal: [
      { daysAgo: 4, body: "Busy week. Exercised daily to stay grounded." },
      { daysAgo: 0, body: "Deadline passed. I coped better than last month." },
    ],
  },
  {
    key: "infrequent",
    email: "infrequent@persona.calm",
    displayName: "Infrequent Idris",
    profile: { age_band: "18-24", gender: "male", ethnicity: "Black", treatment_status: null, referral_source: null },
    // 1 session, 1 check-in, 1 journal entry across 14 days — sparse (edge: long gaps)
    checkins: [
      { daysAgo: 10, ns_state: "window", survival_response: null, triggers: [], note: null },
    ],
    sessions: [
      { daysAgo: 10, exIdx: 0, distressBefore: 6, distressAfter: 4, helpfulness: 6, note: null },
    ],
    journal: [
      { daysAgo: 10, body: "First entry. Trying this out." },
    ],
  },
];

async function main() {
  // Fetch exercise ids (content is public, service role can read)
  const { data: ex, error: exErr } = await supabase.from("exercises").select("id, title").order("title");
  if (exErr) throw exErr;
  if (!ex || ex.length === 0) throw new Error("No exercises seeded — run services/seed.ts first.");
  const exIds = ex.map((e) => e.id);
  const exIdAt = (idx: number) => exIds[idx % exIds.length];

  // Fetch prompt ids
  const { data: prompts, error: prErr } = await supabase.from("prompts").select("id");
  if (prErr) throw prErr;

  for (const p of personas) {
    // Clean previous persona rows (by email prefix) for idempotent reruns
    const { data: existing } = await supabase.from("users").select("id, email").ilike("email", `%${p.key}@persona.calm`);
    for (const u of existing ?? []) {
      await supabase.from("users").delete().eq("id", u.id);
    }
    await supabase.auth.admin.deleteUser(p.email).catch(() => {});

    // Create auth user (fires on_auth_user_created -> users row)
    const { data: authUser, error: auErr } = await supabase.auth.admin.createUser({
      email: p.email,
      password: "Persona-1234!",
      email_confirm: true,
      user_metadata: { full_name: p.displayName },
    });
    if (auErr) throw auErr;
    const uid = authUser.user.id;
    console.log(`✓ created ${p.key} user ${uid}`);

    // Profile (research fields)
    const { error: pfErr } = await supabase.from("profiles").upsert({ user_id: uid, ...p.profile }, { onConflict: "user_id" });
    if (pfErr) throw pfErr;

    // Check-ins
    for (const c of p.checkins) {
      const { error } = await supabase.from("checkins").insert({
        user_id: uid,
        ns_state: c.ns_state,
        survival_response: c.survival_response,
        triggers: c.triggers,
        note: c.note,
        created_at: new Date(Date.now() - c.daysAgo * 864e5).toISOString(),
      });
      if (error) throw error;
    }

    // Exercise sessions
    for (const s of p.sessions) {
      const started = new Date(Date.now() - s.daysAgo * 864e5);
      const ended = new Date(started.getTime() + 4 * 60e3);
      const { error } = await supabase.from("exercise_sessions").insert({
        user_id: uid,
        exercise_id: exIdAt(s.exIdx),
        started_at: started.toISOString(),
        ended_at: ended.toISOString(),
        duration_minutes: 4,
        distress_before: s.distressBefore,
        distress_after: s.distressAfter,
        helpfulness: s.helpfulness,
        note: s.note,
      });
      if (error) throw error;
    }

    // Journal entries (with optional prompt for a couple)
    for (let i = 0; i < p.journal.length; i++) {
      const j = p.journal[i];
      const { error } = await supabase.from("journal_entries").insert({
        user_id: uid,
        body: j.body,
        prompt_id: prompts && prompts.length && i === 0 ? prompts[0].id : null,
        created_at: new Date(Date.now() - j.daysAgo * 864e5).toISOString(),
      });
      if (error) throw error;
    }

    console.log(`✓ seeded ${p.key}: ${p.checkins.length} check-ins, ${p.sessions.length} sessions, ${p.journal.length} journal entries`);
  }
  console.log("🎉 Persona data complete.");
}

main().catch((e) => { console.error("persona seed failed:", e); process.exit(1); });