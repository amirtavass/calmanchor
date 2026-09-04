# 05 - Decision Log

The reasoning behind the product decisions encoded in the user stories. Written so that the student (and their agent) can see WHY the requirements are what they are - and so that future changes start from the rationale, not from a re-litigation of the past.

Format follows the ADR pattern: context, decision, rationale, consequences. Decisions here are the project lead's; the student's own decisions (RLS, auth details) belong in their own ADRs using templates/ADR.md.

---

## D01 - The workbook is the source of truth

- Context: product opinions accumulate faster than evidence. Some early assumptions (12 sections, 5 exercises, crisis-as-feature) conflicted with the actual workbook.
- Decision: the Bella and Wolf CPTSD Toolkit is the clinical source of truth. Where any requirement or opinion conflicts with the workbook, the workbook wins.
- Rationale: the app is a digital companion for a clinical resource; drifting from it means drifting from the intervention itself.
- Consequences: content counts come from the workbook (20 chapters, ~26 exercises in 6 categories). Agent and student must flag conflicts in the register rather than silently choose.

## D02 - Google sign-in only

- Context: different auth providers capture different data shapes; username/password adds credential management for a single-user wellbeing app.
- Decision: Google is the ONLY sign-in method. No username/password, no other providers. Internal UUID per user. Profile research fields collected at onboarding.
- Rationale: one auth path = one data shape; Google profile gives identity without password management.
- Consequences: the users table needs a google identity reference and stable internal id; no password columns. Session persistence (up to 90 days) is service-layer work in a later milestone.

## D03 - No mood dashboard, ever

- Context: initial student schema included mood_logs and moods on sessions; the design system includes pre/post exercise mood scales.
- Decision: wellbeing metrics are stored raw (distress before/after, helpfulness) but NEVER aggregated into user-facing trend graphs.
- Rationale: confronting vulnerable users with visualised mood trends can increase rumination and distress (see 04-wellbeing-metrics.md).
- Consequences: no aggregation views/endpoints for the UI; research uses the raw records. "Mood" survives only as a journal tag.

## D04 - Exercise metrics are evidence-based

- Context: "track mood before/after" is ambiguous; single-item mood is psychometrically weak.
- Decision: exercise sessions record distress before (0-10), distress after (0-10), helpfulness (0-10, post only), times, duration, tags, optional note.
- Rationale: SUDS-derived momentary distress is the established measure in the PTSD/exposure literature; helpfulness captures intervention response; EMA-style in-app ratings beat retrospective recall (references in 04).
- Consequences: schema columns are distress_before, distress_after, helpfulness. Renaming or adding metric columns requires a decision-log entry.

## D05 - Append-only behavioural records

- Context: multi-device and offline sync were open questions.
- Decision: all behavioural records (sessions, journal entries, check-ins) are append-only inserts with timestamps. No uniqueness constraints on (user, day) or (user, exercise, day). Edits: journal entries editable until end of the next calendar day, then locked; single-entry delete allowed. Last-write-wins for the rare edit conflict.
- Rationale: append-only eliminates merge conflicts entirely; matches the workbook's free-log philosophy; keeps schema offline-ready.
- Consequences: no sessions table or forced single-device logout in MVP (deferred - requires token-invalidation infrastructure and contradicts offline direction). Every user-data table carries created_at/updated_at (S29).

## D06 - Journal and exercise sessions are separate entities

- Context: it was briefly unclear whether completing an exercise created a journal entry.
- Decision: journal entries are independent plain-text notes the user can create at any time. Exercise completion writes to exercise_sessions only.
- Rationale: journaling is voluntary reflection; forcing a journal entry on every exercise would add friction (the app reduces effort, per product direction).
- Consequences: no required session_id FK on journal entries; prompt_id is optional and grounded in workbook reflection questions only.

## D07 - Research profile fields, PII separated

- Context: research export must never leak identity.
- Decision: profiles carry age band, gender, ethnicity (ONS), treatment status (optional), referral source (optional). Identity (email, display name, Google identity) lives separately. Anonymised export excludes all identity columns and free text (journal bodies, notes) by default.
- Rationale: demographic covariates are the research payload; PII is liability. Exact age is PII-adjacent; bands are the norm.
- Consequences: the export query (S27) must be writable without touching PII columns. User-facing export is out of scope; "delete all my data" is supported (S05).

## D08 - Content is public-read; user data is owner-only

- Context: RLS strategy was delegated to the student with an ADR requirement.
- Decision (project lead's position): content tables (chapters, exercises, prompts) are readable without authentication - the workbook PDF and catalogue are supporting material, not private data. ALL user-data tables enforce owner-only RLS.
- Rationale: the PDF must be viewable before sign-in (story S07); user data is the sensitive part.
- Consequences: the student records the final RLS decision in an ADR (templates/ADR.md), including whether content tables get RLS with public policies or no RLS at all, and why.

## D09 - The coaching loop is coaching, not grading

- Context: the student builds the app with an agent; a verdict document would grade the student.
- Decision: the schema-coaching pack is a working protocol: stories + queries + register + Socratic coaching. No scores delivered to the student. The student articulates the gap and approves the fix before the agent implements it.
- Rationale: the internship is a learning project; the register gives the supervisor progress visibility without a grade.
- Consequences: AGENT.md encodes the rules. The register is the meeting artifact.

## D10 - Workbook PDF out of the repository

- Context: the full clinical PDF was committed to a public repository.
- Decision: the PDF is never committed to git; it lives in private Supabase storage; the repo carries metadata and anchors only.
- Rationale: licensing and clinical-content exposure; git history retains deleted files.
- Consequences: story S28; the repository will transfer to the University of Greater Manchester organisation and become private in due course.

## D11 - Agent may implement after articulation and approval

- Context: should the student's agent write schema fixes itself?
- Decision: the agent may implement a fix AFTER the student has articulated the gap in their own words and explicitly approved the approach. This is a standing project rule, not a trial.
- Rationale: the student remains the decision-maker and learns the reasoning; the agent removes mechanical friction.
- Consequences: AGENT.md session protocol includes the articulation gate.

## D12 - RLS strategy resolved: content public, user data owner-only

- Context: D08 left the final RLS choice to the student's ADR. On 26 Aug the student presented selective RLS (user-data tables only, because content is shared across users); the lead initially suggested enabling RLS on ALL tables to avoid per-table runtime access checks.
- Decision: the selective model was accepted, on condition that the decision and its implications are documented (student ADR). Content tables (chapters, exercises, prompts, PDF path) are publicly readable without authentication; EVERY user-data table enforces owner-only RLS. Reconfirmed 28 Aug.
- Rationale: unauthenticated access to educational content is an intentional product direction (S07 - the PDF must be viewable before sign-in); user data is the sensitive surface. The runtime-complexity concern is retired by documenting the policy per table.
- Consequences: story S04 remains the test (no cross-user read by any query path, with RLS on). The student's ADR records the table-by-table choice and why.

## D13 - "Delete my data" is anonymisation by UUID rotation

- Context: S05 (delete all data) and S22 (delete a single entry) left delete semantics open pending an ADR decision.
- Decision: "delete my data" rotates the user's internal UUID to a NEW random value across every user-data row, in one transaction; the old/new mapping is never stored. The user becomes a fresh anonymous entity and the data stays usable for research; each further deletion cycle creates another anonymous identity. Individual journal entries (and exercise session entries) requested by the user are hard-deleted row-by-row, at any time, including within the edit window. "Delete my account" (full removal) is a distinct action from "delete my data".
- Rationale: hard deletion destroys the research value of behavioural data; UUID rotation preserves longitudinal records with no re-identification path. Row-level deletes respect user agency without touching any other record.
- Consequences: no cascade-delete requirement from user to user-data tables; no mapping table may exist anywhere; stories S05 and S22 updated; app copy must distinguish "delete my data" from "delete my account".

## D14 - Navigation: bottom tabs + persistent crisis button (no hamburger)

- Context: a 28 Aug proposal put secondary items in a hamburger menu. On 2 Sep the build agent pushed back: hamburger menus hide primary navigation, reduce discoverability, and are particularly problematic for trauma-informed apps where the crisis path must be reachable in one tap.
- Decision: sticky bottom tab bar with 4-5 tabs (Toolkit, Exercises, Journal/Diary, Portfolio/Dashboard) + a header avatar for profile/settings + a persistent floating Crisis button that is NEVER buried in a menu. Hamburger rejected as a primary AND secondary pattern for this app. Components follow Google Material Design 3; colour, typography and tokens come from the EXISTING design system - the agent must never invent a new design system.
- Rationale: one-tap crisis access and discoverability outweigh menu tidiness; the agent's critique was accepted (the original prompt had been ambiguous).
- Consequences: every ASCII screen design must include the Crisis FAB; exercises landing page uses category cards (Layout A); design-system tokens are the style source of truth.

## D15 - PHQ-9 and PCL-5 questionnaires deferred

- Context: structured clinical questionnaires were floated as possible in-app measures.
- Decision: not in the MVP. Revisit after store readiness. SUDS distress and helpfulness remain the only structured in-app metrics.
- Rationale: questionnaire administration adds burden and clinical-administration questions with no clear MVP use; the session-anchored measures (D04) already cover the evidence base.
- Consequences: no questionnaire tables in the M1/M2 schema; tracked as a deferred idea, not a requirement.
