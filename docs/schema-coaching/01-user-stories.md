# 01 - User Stories

The requirements contract for the Calm Anchor app. Each story carries acceptance criteria and the schema implications the agent should check. Stories are grouped by requirement area. IDs are stable - reference them in the query pack and the status register.

Legend for status register: UNTESTED / PASS / FAIL / FIXED / BLOCKED.

Briefing status: stories are marked [BRIEFED] or [NOT YET BRIEFED]. BRIEFED = the topic was discussed with the student in supervision. NOT YET BRIEFED = decided by the project lead but not yet discussed with the student - the student should raise these at supervision for context. The markers are the source of truth; the supervision summaries themselves are private to the project lead and are NOT available to this agent - do not attempt to locate them. Present NOT YET BRIEFED stories as requirements to be understood, never as already-agreed items.

---

## A - Onboarding and auth [BRIEFED - supervision 26 & 28 Aug: browse-first onboarding, Google-only sign-in (S02), research profile at sign-up (S03)]

### S01 - First-launch onboarding
As a new user, I want a guided onboarding the first time I open the app, so that I understand what Calm Anchor is and how to get started.
Acceptance criteria:
- Onboarding runs on first launch only.
- It includes an app walkthrough and a nervous-system primer (the workbook's introductory material).
- The walkthrough comes BEFORE any sign-in prompt: the user can browse the workbook, chapters and exercises unauthenticated (clarified 28 Aug).
- Sign-in with Google is triggered when the user first attempts an exercise, not at first launch.
- Completing sign-up lands the user on the home screen; onboarding completion can be derived from profile existence.
Schema implications: `users` and `profiles` tables; onboarding completion can be derived from profile existence.

### S02 - Google sign-in only
As a user, I want to sign in with my Google account, so that I do not have to manage a separate username and password.
Acceptance criteria:
- Google is the ONLY sign-in method. No username/password, no email/password, no other providers.
- A successful sign-in creates or resolves an internal user record.
- A session persists for up to 90 days (service-layer work, later milestone; schema must not block it).
Schema implications: `users` table with a stable internal UUID and a Google identity reference; no password columns. Session persistence is deferred (service layer), so no sessions table required for MVP - but nothing in the schema may preclude one.

### S03 - Research profile at onboarding
As a user, I want to answer a few optional profile questions during onboarding, so that my data can contribute to research.
Acceptance criteria:
- Questions asked: age band (18-24, 25-34, 35-44, 45-54, 55-64, 65+), gender, ethnicity (ONS categories), current treatment status (optional), how the user found the app (optional).
- Every question is optional and offers "prefer not to say".
- Profile data is stored on the user record.
- Profile data is NOT personally identifiable (no name, email, or phone in the research fields).
Schema implications: `profiles` table (or columns on `users`) with age_band, gender, ethnicity, treatment_status, referral_source. Identity fields (email, display name) must be separable from research fields for anonymised export.

### S04 - Data isolation
As a user, I want my data to be visible only to me, so that my journal and exercise history stay private.
Acceptance criteria:
- A user can read only their own journal entries, exercise sessions, check-ins, tags, and profile.
- A user cannot read another user's records by any query path.
- Row-level security is enabled and tested on every user-data table.
Schema implications: RLS policies (owner-only) on all user-data tables; foreign keys carry the user id.

### S05 - Delete my data
As a user, I want to delete all of my data, so that I can fully withdraw from the app.
Acceptance criteria:
- A single action ("delete my data") anonymises the user: the internal UUID is replaced with a NEW random UUID on every user-data record; the old/new mapping is never stored, so re-identification is impossible.
- The user becomes a fresh anonymous entity; repeated deletion cycles create a new anonymous identity each time (decision D13).
- "Delete my account" (full removal) is a separate action from "delete my data" (anonymisation).
Schema implications: one transaction updates user_id (or owner key) on all user-data rows to a fresh UUID. No cascade delete and NO mapping table may exist.

---

## B - Content and the workbook [BRIEFED - supervision 26 & 28 Aug: catalogue/PDF viewer, public-read content, PDF served from private Supabase storage (S07/S28)]

### S06 - Browse the chapters
As a user, I want to browse the workbook chapters in order, so that I can find the material relevant to me.
Acceptance criteria:
- All 20 workbook chapters are listed, in workbook order.
- Each chapter shows its title and page range.
- Chapters carry a content group (learn, practice, reflect, reframe, relationships) and a colour token from the design system.
Schema implications: `chapters` table: order_index, title, page_range, content_group, colour_token. Content is shared across users (public read).

### S07 - View the workbook PDF
As a user, I want to open and read the workbook PDF in the app, so that the book is available as supporting material.
Acceptance criteria:
- The PDF renders in-app (React Native PDF / Blob viewer).
- The user can jump to a chapter from a chapter anchor.
- The PDF can be viewed WITHOUT signing in (content is public; user data is not).
- The PDF is NOT committed to the git repository - it is served from private Supabase storage.
Schema implications: PDF stored in a private storage bucket with signed URLs or a public-read content path; chapter anchors map page ranges to PDF pages. A `documents` metadata table may be needed.

### S08 - Exercise catalogue by category
As a user, I want to browse exercises grouped by category, so that I can find the right kind of exercise quickly.
Acceptance criteria:
- Exercises are grouped by category: breathing, somatic, sensory, voice, mindful, crisis.
- The catalogue lists every exercise exactly once.
- Exercises show title, category, and (where set) duration.
Schema implications: `exercises` table: title, category, exercise_type, steps, duration_minutes, chapter reference. Count from the seed file - the number of exercises is what the file says, not what a commit message claims.

### S09 - Guided exercise instructions
As a user, I want to open an exercise and see its guided steps in order, so that I can work through it properly.
Acceptance criteria:
- Steps render in order.
- Where a duration is set, it is shown before starting.
Schema implications: `exercises.steps` (ordered array or child table).

### S10 - No forced sequence
As a user, I want to do any exercise at any time, so that the workbook works as a free log rather than a course.
Acceptance criteria:
- No exercise depends on another being completed first.
- The app never blocks an exercise because another is incomplete.
Schema implications: no required-ordering constraints anywhere.

### S11 - Crisis exercises are just exercises
As a user, I want the bad-days and crisis exercises from the workbook ("Tools for the Bad Days", pages 99-113) available in the catalogue, so that I can use them when I need them.
Acceptance criteria:
- Crisis-tagged exercises appear in the catalogue under their category like any other exercise.
- No special crisis-mode feature exists. Nothing beyond the workbook.
Schema implications: `exercises` rows with crisis exercise_type; no crisis-specific tables.

---

## C - Exercise sessions [BRIEFED - supervision 28 Aug: full session flow walked through; SUDS distress + helpfulness agreed with the student (see 04-wellbeing-metrics.md)]

### S12 - Start a guided exercise
As a user, I want to start an exercise and have the app record when I started, so that my history is accurate.
Acceptance criteria:
- Starting an exercise creates a session record with exercise id and start time.
- A user can start an exercise while another session exists (multiple exercises can overlap or repeat in a day).
Schema implications: `exercise_sessions`: id, user_id, exercise_id, started_at. No uniqueness constraint on (user, day, exercise).

### S13 - Complete an exercise with confirmation
As a user, I want a confirmation step after finishing an exercise, so that I can review what will be saved before it is committed.
Acceptance criteria:
- On completion, the app shows a summary screen (what will be saved: exercise, times, ratings, tags, note).
- Saving commits the session with end time and duration.
- The user can go back and adjust before saving.
Schema implications: `exercise_sessions`: ended_at, duration_minutes (may be calculated from started_at/ended_at).

### S14 - Distress before and after
As a user, I want to rate my distress before and after an exercise, so that I can notice how the exercise affected me.
Acceptance criteria:
- Pre-rating captured at session start; post-rating at completion.
- Scale: 0-10 (evidence-backed, see 04-wellbeing-metrics.md - this is the SUDS-derived metric).
- Both ratings stored on the session record.
Schema implications: `exercise_sessions.distress_before`, `distress_after` (smallint, 0-10, nullable). These replace any generic mood_before/mood_after columns.

### S15 - Helpfulness rating
As a user, I want to rate how much an exercise helped right now, so that I can reflect on what works for me.
Acceptance criteria:
- Captured at completion only.
- Scale: 0-10.
Schema implications: `exercise_sessions.helpfulness` (smallint 0-10, nullable).

### S16 - Tags on sessions
As a user, I want to tag an exercise session, so that I can find and recall it later.
Acceptance criteria:
- Tags can be chosen from the system set or created by the user.
- User-created tags are private to that user; they never become global tags.
Schema implications: `tags` (system, shared) and user-owned tags; `exercise_session_tags` join. User tags carry user_id and are RLS-protected.

### S17 - Session history
As a user, I want to see my past exercise sessions, so that I can look back at what I have done.
Acceptance criteria:
- Shows the user's own sessions only, newest first.
- Each entry shows exercise, date, and duration.
Schema implications: query on `exercise_sessions` filtered by user_id, ordered by started_at desc. Must pass with RLS enabled.

### S18 - Multiple sessions per day
As a user, I want to do several exercises in one day and keep them all, so that the log reflects reality.
Acceptance criteria:
- Multiple sessions per day are saved independently.
- Each session keeps its own times and ratings.
Schema implications: no unique constraints on (user_id, exercise_id, date). Append-only inserts.

---

## D - Journal [BRIEFED - supervision 28 Aug: plain-text entries, edit window (S21), single-entry delete (S22), workbook-grounded prompts only (S23)]

### S19 - Plain-text journal entry
As a user, I want to write a plain-text journal note at any time, so that I can record my thoughts when I choose to.
Acceptance criteria:
- A journal entry is independent of exercise completion (writing in the journal is its own action).
- Entries store text and a timestamp.
- Multiple entries per day are allowed.
Schema implications: `journal_entries`: id, user_id, body, created_at, (prompt_id nullable), updated_at.

### S20 - Journal tags
As a user, I want to tag my journal entries, so that I can organise my notes.
Acceptance criteria:
- System tags available; user can add custom tags.
- Custom tags are private to the user.
Schema implications: tags tables shared with S16; `journal_entry_tags` join.

### S21 - Limited edit window
As a user, I want to edit a journal entry only for a limited time, so that my journal is honest about when things were written.
Acceptance criteria:
- An entry created at time T can be edited until 23:59:59 of the calendar day after creation.
- After the window, the entry is locked (app-level enforcement; schema must not contradict it).
Schema implications: created_at + updated_at; the window can be computed from created_at. App enforces; no schema-level contradiction.

### S22 - Delete a single entry
As a user, I want to delete an individual journal entry, so that I can remove something I do not want kept.
Acceptance criteria:
- Deleting one entry does not affect any other record.
Schema implications: single-row hard delete on `journal_entries`; the user may delete an individual entry at any time, including within the edit window (decision D13).

### S23 - Prompted journaling
As a user, I want to write a journal entry from a workbook reflection prompt, so that I have a starting point when I want one.
Acceptance criteria:
- Reflection prompts are grounded in the workbook (e.g. "What do you think the purpose of this exercise was?").
- A prompt is optional; entries can exist without one.
- Prompts that cannot be traced to the workbook are removed, not kept.
Schema implications: `prompts` table (only workbook-grounded rows), `journal_entries.prompt_id` nullable FK.

### S24 - Unlimited entries per day
As a user, I want to write as many entries as I like in a day.
Acceptance criteria:
- No limit and no uniqueness constraint on (user, day).
Schema implications: none required - verify no constraints exist.

---

## E - Check-ins and mood [BRIEFED - supervision 28 Aug: check-ins reviewed; the no-mood-dashboard rule (S26) explicitly agreed; metrics stored raw for research only]

### S25 - Check-in
As a user, I want to record a check-in (nervous-system state, survival response, triggers, note), so that I can track my state over time.
Acceptance criteria:
- All fields optional; timestamp saved.
- Multiple check-ins per day allowed.
Schema implications: `checkins`: id, user_id, ns_state, survival_response, triggers (array), note, created_at.

### S26 - No mood dashboard
As a user, I never want to see graphs of my mood over time, so that I am not confronted with trends that could make me feel worse.
Acceptance criteria:
- The app contains no mood-trend dashboard, chart, or graph view.
- Wellbeing metrics are stored raw for research; they are never aggregated into a user-facing trend.
Schema implications: a NON-requirement: no aggregation view/endpoint is required. Storing raw session metrics is sufficient and required.

---

## F - Research and privacy [BRIEFED - supervision 26 & 28 Aug: PDF out of repo (S28), anonymised export scope (S27), offline-ready timestamps (S29)]

### S27 - Anonymised research export
As a researcher, I want to export all users' data with no personally identifiable information, so that research can proceed without exposing identities.
Acceptance criteria:
- Export includes demographics (age band, gender, ethnicity, treatment status, referral) and wellbeing metrics (distress before/after, helpfulness) plus behavioural data (sessions, journal, check-ins).
- Export EXCLUDES email, display name, Google identity, and any free-text that could identify the user; journal bodies and free-text notes are excluded by default (agreed 28 Aug - see D07).
- The export is a developer/researcher tool, not a user-facing feature (no UI).
Schema implications: identity columns and research columns must be separable in queries; a research-view or export query that selects only non-PII columns. Journal/notes bodies are PII-adjacent - exclude by default.

### S28 - Workbook not in the repository
As a project lead, I want the workbook PDF kept out of the public repository, so that clinical content and licensing are not exposed.
Acceptance criteria:
- No clinical PDF exists in the git history of the repository.
- The PDF lives in private Supabase storage.
Schema implications: storage bucket private; repo contains only metadata, not content.

### S29 - Offline-ready timestamps
As a developer, I want every user-data table to carry timestamps, so that a future offline sync layer can reconcile records.
Acceptance criteria:
- Every user-data table has created_at and updated_at.
- Timestamps are server-set (or a sync strategy is documented).
Schema implications: created_at/updated_at on all user-data tables (journal_entries, exercise_sessions, checkins, tags, profiles).
