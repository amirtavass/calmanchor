# Toolkit — section design

> **Route:** `app/(tabs)/toolkit.tsx` · **M:** M2 · **Sources:** user story **S07** (view workbook PDF)
> + IA §3 *Learn/Read* vertical + `docs/ui/03-screen-craft.md`.
> **Journey verticals:** Learn/Read.

## 1. Stories served

| Story | Screen treatment |
|---|---|
| **S07** view the workbook PDF | Read view: `react-native-pdf` renders `TOOLKIT_URL` (public Supabase storage) in-app. |
| Chapter navigation | Contents view lists the 20 `chapters` rows (`getChapters()`); tapping a chapter `pdfRef.setPage(startPage)` jumps the PDF to the chapter's first page and switches to Read. |
| Browse-first (S01) | Chapters are public content — no sign-in needed. |

## 2. The design

```
┌──────────────────────────────────────────────────┐
│  ScreenHeader  Toolkit · The workbook  [☾Light]  │
│  [⊞ Contents] [📖 Read]       ← segmented chips   │
├──────────────────────────────────────────────────┤
│  CONTENTS (default):                             │
│  ● LEARN                            (2 chapters) │
│  ┌── 1  Introduction & For You     p. 1–6  Open ›│
│  └── 2  The Nervous System…        p. 9–12 Open ›│
│  ● PRACTICE                         (4 chapters) │
│  ┌── 5  Self-Soothing Strategies…   p. 23–32 ›   │
│  │   (grouped by content_group; each row tinted │
│  │    with its --ex-* pair, number medallion,   │
│  │    title 15/600, "p. range" supporting text) │
│  READ:                                           │
│  ┌────────────────────────────────────────────┐ │
│  │  ‹ Contents        Page 5 of 118   Reload │ │
│  │  ┌──────────────────────────────────────┐ │ │
│  │  │            PDF (S07)                 │ │ │
│  │  └──────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

## 3. Decisions

| Item | Decision | Why |
|---|---|---|
| Landing view | **Contents** by default; Read is one tap away | The chapter list is the navigation; the PDF is the destination. Reading a chapter returns to Contents via `‹ Contents`. |
| Chapter rows | `surface` card, 34 dp number medallion in the group's `--ex-*` pair, title 15/600, `p. {page_range}` supporting, trailing `Open ›` in the group colour | Same list-row idiom as exercises/entries (craft §5, one hue per meaning). |
| Grouping | Grouped by `content_group` (learn/practice/reflect/reframe/relationships/crisis) with a small-caps header + count | Mirrors the workbook's own structure; colour + label + count so groups differ in more than colour (R7). |
| Jump-to-page | `page_range` first number parsed → `Pdf` `page` prop (fresh mount) + `pdfRef.setPage()` (already-mounted) | `react-native-pdf` exposes `setPage(n)` on its ref; using both covers mount and re-read. |
| Loading | `ChaptersSkeleton` — grouped skeleton rows matching the live layout (shimmer, §17) | No plain "Loading…" text (rules §6.1). |
| Error / empty | Inline retry + empty state pointing at `npm run seed` | Chapters are seed data; a seeded-but-empty DB should say so. |
| Colour mapping | `content_group` → `--ex-*` family (learn→breath, practice→ground, reflect→journal, reframe→selfkind, relationships→somatic, crisis→crisis) | Reuses the existing category palette (ledger); no new tokens. |

## 4. Craft cross-check (03-screen-craft §13)

- Three-zone scaffold; `ScreenHeader`; safe-area aware.
- Read view is a native full-bleed PDF — the mini-toolbar carries Contents/Reload + page info.
- `M3Chip` segmented control (Contents / Read) uses the existing chip component.
- Loading / error / empty all styled; tsc clean · expo export clean.