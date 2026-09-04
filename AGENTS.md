# CalmAnchor — Project Context for AI Agents

## What This Project Is

CalmAnchor is a digital companion application for CPTSD (Complex PTSD) self-management. It takes an existing clinically reviewed paper-based toolkit and turns it into an interactive web and mobile application.

The source material is the **Bella & Wolf CPTSD Toolkit** — a 118-page peer-created workbook covering nervous system regulation, survival responses (fight/flight/freeze/fawn), the Window of Tolerance, self-soothing strategies, inner child work, grounding exercises, and crisis planning.

## Core Application Functions

1. **Private Diary** — users log thoughts, reflections, and daily notes. Personal, private, never shared. Plain-text entries, editable until the end of the next calendar day, then locked (S21).
2. **Educational Content** — interactive guided exercises explaining trauma concepts (nervous system states, survival responses, regulation techniques) with an embedded PDF viewer for the toolkit.
3. **Toolkit Browser** — browse the full CPTSD toolkit by section, with tracking for completed exercises (distress before/after + helpfulness) and optional check-ins. No mood-trend dashboards (S26).

**Important:** This is a single-user, private application. There are NO clinician dashboards, NO data sharing, NO multi-user requirements. The Jenkinson bid originally mentioned clinician-facing features — that assumption was incorrect and has been dropped.

## People

| Person | Role |
|---|---|
| **Aamir Abbas** | Project lead, supervisor |
| **Kimberley Hajee** | MSc Psychology student — wrote the activity book (the Bella & Wolf toolkit adaptation) |
| **Sue Brown** | Variable Hours Tutor-AAC — AI and art integration collaborator |
| **Jerome Carson** | Professor of Psychology — project supervision |
| **Anchal Garg** | Co-applicant on Jenkinson bid, computing support |
| **Kashif Butt** | Former developer — stepped down 13 Jun 2026. Designed Figma screens and initial workflow. Assets handed over on GitHub. |
| **Amirreza Tavassoli** | Mobile Developer Intern (24 Aug – 20 Sep 2026) — builds the app with an AI agent under the schema-coaching protocol. GitHub: amirtavass. |
| **Richard Okusodo** | Mobile Developer Intern, Slot 2 — starts 1 Oct 2026. |

## Funding

- **Jenkinson Award JA27017** — £10,000
- **Cost code:** CAB-J-1-2612 (subjective code TBC)
- **Period:** Aug 2026 — Jul 2027
- **3 Ryley Student Internships** approved (Ryley Awards support the student internships; the Jenkinson bid sponsors the project)
- **Finance contacts (per Sam Johnson email, 25 Aug 2026):** queries on accessing or allocating funds from research awards go to Dr Tayo George (Research Systems & Projects Officer, T.George@greatermanchester.ac.uk) and Bilkis Yusuf (Clerical Officer, B.Yusof@greatermanchester.ac.uk), Research and Doctoral College. This follows a temporary staffing shortage in the R&DC during late 25/26.
- **Lead school:** School of Arts & Creative Technologies / Computing
- **OpenCode Go** subscription ($10/month) — usage limits per model (see oh-my-openagent config)

## What Already Exists

### Design
- `design-system/calm-anchor-design-system.html` + `.css` + `.js` — Complete design system with 35+ components, trauma-informed color palette (light + dark mode), CSS custom properties, form controls, navigation, feedback/overlays, content components, actions, data display. Built with Tailwind conventions.
- `calm-anchor-color-system-v3.html` — Original color token specification (in Design/ folder on OneDrive)

### Assets
- Figma screens (registration, login, Pause & Support screen)
- App code (early stage) — both zipped in GitHub repo
- **GitHub:** https://github.com/university-of-greater-manchester/cptsd_figma_design_and_app_code (Aamir has admin access)

### Documentation
- Full CPTSD toolkit PDF: `Documentation/toolkit_compressed.pdf` (in OneDrive project folder)
- Jenkinson bid document, budget profile, outcome letter
- Intern job description: `Intern JDs/intern-jd.docx`

### Project folders
- **OneDrive:** `C:\Users\aamye\OneDrive - University of Greater Manchester\9 - Projects\CalmAnchor (PTSD App)\`
- **WSL dev:** `~/code/calmanchor/`
- **Linear project:** CalmAnchor (PTSD App) — task tracking

## What We're Building

A mobile application (React Native / Expo + Supabase), built by the Mobile Developer Intern (Amirreza Tavassoli) under a milestone plan (24 Aug – 20 Sep 2026):
- **App:** Expo (React Native) + TypeScript, Expo Router navigation. Screens live in `app/`.
- **Backend/database:** Supabase (Postgres) — auth, RLS-protected user data, public-read content tables. Supabase-first; offline/local storage deferred to a later milestone.
- **Authentication:** Google sign-in ONLY — no username/password, no anonymous auth (story S02, decision D02).
- **PDF viewer:** the workbook PDF is served from private Supabase storage, never committed to git (S07/S28). Embedded viewer with chapter anchors.
- **Wellbeing data:** exercise sessions record SUDS distress (0–10) before/after and a helpfulness rating (0–10); NO mood dashboards or trend graphs (S26/D03); records are append-only.
- **Deployment (future):** App Store + Google Play via EAS Build; university Apple/Play accounts TBC. The design-system/docs site (index.html) deploys to Netlify.

## Tech Preferences

These are preferences, not mandates. The intern or developer should use what they're proficient with:
- JavaScript/TypeScript ecosystem
- Next.js / React for web
- Tailwind for styling (design system already uses Tailwind conventions)
- Supabase for auth and database
- The design system CSS tokens should be the single source of truth for all styling

## Current Status (Sep 2026)

- Internship running (24 Aug – 20 Sep): four milestones M1-M4 (setup/architecture → core app end-to-end → full feature set → store readiness). M1 delivered ~2 Sep; M2 due Sun 6 Sep.
- Requirements contract: `docs/schema-coaching/` on the `docs/schema-coaching` branch — user stories S01-S29 (all BRIEFED), query pack, status register, evidence base, decision log D01-D15, coaching protocol AGENT.md. These govern schema work; the coaching loop is Socratic and gated.
- App scaffold (Expo + Supabase + design tokens) lives on the intern's fork branch `feature/m1-scaffold` (remote `amirreza`) — review before merging to main.
- `PROGRESS.md` tracks milestone deliverables; decisions D12-D15 (RLS outcome, deletion anonymisation, bottom-tabs + crisis FAB navigation, PHQ-9/PCL-5 deferral) are in the decision log.
- Git workflow: feature branches + PRs, no direct pushes to main. Repo to be transferred to the University of Greater Manchester organisation and made private.

## Working With This Project

- Open the design system HTML in a browser to see all components
- All colors, spacing, typography are CSS custom properties — use them, don't override
- The toolkit PDF is the clinical source of truth — app features should map to toolkit sections
- Keep the app private, single-user, no data sharing
- UK spellings throughout (colour, centre, organise, programme)
