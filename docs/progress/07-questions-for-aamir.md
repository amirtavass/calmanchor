# Open Questions for Aamir

Append-only register. The student brings these to supervision. Anything ambiguous, unresolved, or
where two source documents conflict goes here — never silently choose a side (per D01).

## Register (append-only)

| Date | Question | Reason / source | Status |
|---|---|---|---|
| 2026-08-30 | **Chapter page ranges:** seed page ranges differ from the workbook's own contents page (e.g. Ch2 9–12 vs PDF 8–14; Ch5 23–32 vs 23–34; Ch1 1–6 vs 3–6). Count is 20 (correct) but the range mapping differs, and `page_range` drives the PDF jump (S07). Align to the contents page, or confirm the custom split (e.g. Window of Tolerance as its own chapter; Crisis Plan & Final Words merged) is intentional? | S07 vs `toolkit_compressed.pdf` p.7 + seed `page_range` | Open |
| 2026-08-30 | **Auth direction:** repo uses silent anonymous sign-in (`lib/auth.ts`) but `docs/schema-coaching/01-user-stories.md` S01/S02 require **Google-only** sign-in with `users` + `google_identity`. Which is current? | S01/S02 vs `AGENTS.md` + `auth.ts` | Open |
| 2026-08-30 | **Apple/Android vs PWA:** scope doc describes a Next.js PWA (web, Vercel, no app stores); the offer/email and roster ask for React Native + iOS/Android + store submission. Which platform? | scope doc architecture vs project ask | Open |
| 2026-08-30 | **Workbook PDF in git history:** `dca63f9` (pushed to `origin/feature/m1-scaffold` + `upstream`) still contains the PDF. Leave (D10: repo becomes private) or rewrite history (force-push)? | S28 vs ADR-001. Deleted from working tree; history still holds it. | Open |
| 2026-10-03 | **M3-05 approach — how should the Learn / Reframe / Relationships chapters get "educational content"?** Options seen so far: (a) supply the workbook chapter text and seed grounded exercises + reflection prompts; (b) restrict to what the lead-authored docs already quote (technical-spec §2.2 core content, `calmanchor-m1-plan_2.md` steps); (c) something else (e.g. a reading/summary surface that links into the PDF rather than reproducing it). **Nothing has been built and nothing invented** — deliberately deferred until you decide. | S23 (prompts must be grounded in the workbook's own reflection questions, "not agent-generated artifacts") + the workbook is the clinical source of truth. The toolkit PDF cannot be read in the build environment, so the content cannot be extracted automatically. | **Deferred — to be decided later** |
| 2026-10-03 | **Confirm the three Portfolio table shapes** (`favourites` with `unique(user_id, exercise_id)`, `safe_space_notes.body`, `custom_strategies.title` + `body`) and whether the portfolio should be added to the requirements contract as a story so the query pack can validate it. Implemented as proposed in ADR-011. | M3-04 names the tables but stories S01–S29 never mention a portfolio — schema work is governed by the contract, so this needs a ruling. | Open |
