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
│  [Contents] [Read]        ← two M3Buttons        │
│    (filled active / outlined idle)               │
├──────────────────────────────────────────────────┤
│  CONTENTS (default) — overlay on the PDF:        │
│  LEARN                            (2 chapters)   │
│  ┌── 1  Introduction & For You     p. 1–6   ›    │
│  └── 2  The Nervous System…        p. 9–12  ›    │
│  PRACTICE                         (4 chapters)   │
│  ┌── 5  Self-Soothing Strategies…   p. 23–32  ›  │
│  │   (grouped by content_group; each row = the   │
│  │    diary "entry card" pattern: 40dp tinted    │
│  │    number medallion + title 15/600 + "p.      │
│  │    range" 13/500 meta + chevron-right)        │
│  READ:                                           │
│  ┌────────────────────────────────────────────┐ │
│  │  [‹ Contents]  (p.5 of 118 pill)  [↻]      │ │
│  │  ┌──────────────────────────────────────┐ │ │
│  │  │            PDF (S07)                 │ │ │
│  │  └──────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────┘
```

## 3. Decisions

| Item | Decision | Why |
|---|---|---|
| Segment | Two **`M3Button`** (filled active / outlined idle, `secondaryActive`/`secondary`), `flex: 1` | Matches the app's current button language (dashboard/diary CTAs, session nav). The old `M3Chip` segment was the pre-refactor exercise-landing idiom (review finding). |
| Landing view | **Contents** by default; Read is one tap away | The chapter list is the navigation; the PDF is the destination. |
| Chapter rows | diary "entry card" pattern: `surface` card, **40 dp** tinted number medallion (group's `--ex-*` pair), title 15/600, `p. {page_range}` 13/500 supporting, trailing **chevron-right** | Copy of the shipped diary entry list (craft §5 "text never bare", one hue per meaning). Replaces the previous `Open ›` text chip + 34 dp circle. |
| Grouping | Grouped by `content_group` with a small-caps **eyebrow** header + count | Mirrors the workbook's own structure; colour + label + count so groups differ in more than colour (R7). |
| Read toolbar | `M3Button` text "‹ Contents" (`arrow-left`) · **meta pill** (`surface2`, radius 999, `book-open-page-variant` + `Page X of Y`) · **36 dp icon reload circle** (`surfaceOffset`, `refresh`) | Replaces bare-text links. Meta pill + icon circle match the detail hero pills and the session close-button idiom. |
| Jump-to-page | **`pdfRef.setPage(n)` only** (native `setNativePage`) — the `Pdf` is uncontrolled (no `page` prop) | The controlled `page` prop + `onPageChanged` feedback loop caused a white-screen re-render on every swipe (`PdfView` `scrollToIndex`). Ref-only jump avoids it. |
| Pdf stays mounted | Contents renders as an **overlay inside `readWrap`** (`absoluteFill`, `bg`); the Pdf is never unmounted | Toggling must not remount the viewer (full re-download + white flash). The overlay lives *inside* `readWrap` so the segment buttons stay visible. |
| Loading | `ChaptersSkeleton` — grouped skeleton rows matching the live layout (shimmer, §17) | No plain "Loading…" text (rules §6.1). |
| Error / empty | Inline `M3Button` Retry; empty state = medallion + title + supportive line (§17) | Empty is styled as a design-system empty state, not bare text. |
| Colour mapping | `content_group` → `--ex-*` family (learn→breath, practice→ground, reflect→journal, reframe→selfkind, relationships→somatic, crisis→crisis) | Reuses the existing category palette (ledger); no new tokens. |

## 4. Craft cross-check (03-screen-craft §13)

- Three-zone scaffold; `ScreenHeader`; safe-area aware.
- Read view is a native full-bleed PDF — the mini-toolbar carries a text button, a meta pill, and an icon circle (no bare-text links).
- Buttons are `M3Button`; rows are the diary entry-card pattern; icons typed `MciGlyph` and verified.
- Loading / error / empty all styled; tsc clean · expo export clean.