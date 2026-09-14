# Diary / Journal — section design

> **Routes:** `app/(tabs)/diary.tsx` (landing) · `app/diary/new.tsx` (compose) · `app/diary/[id].tsx` (detail) ·
> **M:** M2 · **Sources:** user stories **S19–S24** + design-system §17 (empty state/modal) + §18 (list/chip
> idiom) + `docs/ui/03-screen-craft.md`.
> **Journey verticals:** Reflect.

## 1. Stories served

| Story | Screen treatment |
|---|---|
| **S19** plain-text entry, any time, multiple/day | Compose `new.tsx`: optional prompt + free-text body + save. Unlimited (no constraint). |
| **S20** journal tags | Compose preselect prompt; detail shows tag chips; `setJournalEntryTags()` junction writer. |
| **S21** limited edit window | Detail edit button enabled until **23:59:59 of the calendar day after creation**; then "Read only". |
| **S22** delete a single entry | Detail delete (any time) behind a design-system §17 confirm modal; row-level, affects nothing else. |
| **S23** prompted journaling | Landing lists workbook-grounded `prompts`; `?prompt=<id>` preselected in compose. |
| **S24** unlimited entries/day | No day-limit anywhere (schema has no (user,day) uniqueness — S24 PASS). |

## 2. Landing (`app/(tabs)/diary.tsx`)

```
┌───────────────────────────────────────────────┐
│  ScreenHeader  Diary                  [☾Light] │
├───────────────────────────────────────────────┤
│  [ Write a new entry  → ]   secondary CTA       │
│  Reflection prompts (S23) — distinct icon each │
│  · loading:  two exJournalBg skeleton cards    │  M3Skeleton
│               + three entry skeleton rows      │  (shimmer)
│  ┌── ♥ PROMPT                                    │
│  │   "Write a letter to your younger self…"  ›  │  exJournalBg card
│  ┌── 🧘 PROMPT                                   │
│  │   "What does this part of me need…"        ›  │
│  ┌── 🌷 PROMPT                                   │
│  │   "If I treated myself like someone…"      ›  │
│  Your entries (S19)                            │
│   · empty:  📖 medallion + "No journal entries │  §17 empty state
│             yet" + supportive line (no dup CTA) │
│   · signed-out: shield card "private to you"   │  craft §11 degrade
│             (no dup CTA — top button is the one)│
│   · list:   ✎ title · Today · tag, tag ›       │  §18 list-item
└───────────────────────────────────────────────┘
```

- **Distinct icon per prompt** — `notebook-heart-outline`, `meditation`, `flower-tulip-outline`,
  `book-open-page-variant-outline`, `thought-bubble-outline`, `candle` (cycles if more). Avoids the
  "same card three times" feel.
- **Bolder, kicker-led prompt text**: `uppercase · 11/800 · 0.7 tracking` "Prompt" kicker in
  `--ex-journal`, body `15/22/600`, plus a chevron-right so the row reads as a tappable list item.
- **CTA de-dup**: only the top filled M3Button "Write a new entry" is shown. The gentle-card and
  empty-state M3Buttons were removed so the screen no longer offers the same action twice.
- **Loading state**: two prompt-card skeletons + three entry-row skeletons (`M3Skeleton`) so the
  layout shape is preserved while data loads. Never plain "Loading…" text.
- Medallion bumped 34→40 dp so it matches the dashboard quick-action tiles.

## 3. Compose (`app/diary/new.tsx`)

- Craft §1 scaffold: header (**back button** top-left circular Pressable on `surfaceOffset` +
  `arrow-left` glyph, **Leave** top-right text variant) → content → pinned **Save entry** (secondary
  tone).
- Craft §12: `KeyboardAvoidingView behaviour="height"` on Android (was `undefined`); ScrollView gets
  `automaticallyAdjustKeyboardInsets` for iOS. Multiline input ≥ 220 dp.
- **"Prompts are optional" info-badge** (`exJournalBg`, `information-outline`, 12.5/18/700) sits at
  the top of the content — replaces the small muted subline so it can no longer be missed.
- **Prompts as TextInput `placeholder`**. The selected prompt becomes the field's placeholder
  text in `--secondary` (warm olive — matches the screen); the empty-state placeholder reads
  "Write here…" in `--text-muted`. A small `PROMPT` kicker chip + close button at the top of the
  field shows the user where the prompt came from. The whole picker (chips) collapses once the
  user starts typing so the keyboard has the full real-estate; reopened via the "Try a prompt" /
  "Change prompt" toggle. Prompt preselect from `?prompt=` (deep link from landing) still works.
- `saveJournalEntry({ body, prompt_id })` prompts Google sign-in at the moment of saving (S01, browse-first).

## 4. Detail (`app/diary/[id].tsx`)

- Back (top-left text button) → medallion → date → prompt ref → body card → tag chips.
- **Edit**: `canEdit` = `now ≤ end of (created day + 1)`. Enabled → inline edit + **Save changes**
  (`updateJournalEntry`). Past window → primary disabled labelled "Read only".
- **Delete**: outlined error button → §17 modal ("This cannot be undone…") → `deleteJournalEntry(id)` → back.
- Craft §7.4: in-flight disables the action, errors are inline `bodySmall` near the bar — never an alert.

## 5. Data layer (`lib/db.ts`)

- `getJournalEntries()` → rows with `prompts(prompt_text)` + `journal_entry_tags(tags(id,name))`.
- `saveJournalEntry()` returns the inserted row. New: `getPrompts()`, `updateJournalEntry(id, body)`,
  `setJournalEntryTags(entryId, tagIds)` (S20). `deleteJournalEntry(id)` (S22, pre-existing).

## 6. Craft cross-check (03-screen-craft §13)

- Three-zone scaffold; quiet headers; pinned action bars; edit-window + delete controls in the bar.
- Colour: journal identity = `exJournal`/`exJournalBg` (purple) for prompts/medallions; cards on `surface`;
  signed-out shield in `primaryTint`. `textInverse` on the solid purple icon circles.
- Empty / error / signed-out / loading / success all styled.
- tsc clean · expo export clean.