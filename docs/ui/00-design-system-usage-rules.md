# Design System Usage Rules (standing reference)

> **Status:** Standing reference — applies to EVERY screen, every milestone. Re-read before designing any
> screen, do not re-derive per task.
> **Source:** project-lead directive on `design-system/calm-anchor-design-system.{html,css,js}` v2.0.
> **Sibling docs:** `docs/ui/01-navigation-and-ia.md` (IA + shell), `docs/ui/sections/*` (per-screen designs).
> **Rule of thumb:** if this file and a screen file disagree, this file wins; if `/docs` and the
> design-system disagree, `/docs` wins.

---

## 1. Reference hierarchy

`design-system/*` is a **visual and style reference only**:

- What it owns: typography weights/scale, colour tokens and dark-mode behaviour, spacing rhythm,
  elevation/shadow, and *ideas* for which component fits where.
- What it does NOT own: app logic, copy/wording, data decisions, feature decisions, navigation/IA,
  or the set of exercise categories. Those live in `/docs` (`01-user-stories.md`, `01-navigation-and-ia.md`,
  screen specs, the M3 ledger) and in the product/clinical material.

**Conflict rule — no exceptions:** wherever the design-system conflicts with a decision already recorded in
`/docs`, the `/docs` decision wins. The design-system is never a reason to change a locked decision; only the
project lead can do that (see §3).

Worked examples (decisions that are /docs-locked, not borrowable):

| Design-system says | /docs says | Verdict |
|---|---|---|
| "Mood Selector" (Sections 6, 10, 20) — 5 mood pills | We log **SUDS distress (0–10) + helpfulness (0–10)** (S14/S15); no mood scale | Content/framing: /docs wins. Borrow only the pill-row *visual* where relevant (session flow) |
| `.fab` background `--color-primary` (Section 19) | Crisis FAB background = **`--color-error`** (IA §6) | Colour decision: /docs wins |
| `.app-section-label` small-caps (Section 11) | Section labels = brand-800, letter-spacing −0.02 (ledger Q3) | Typography decision: /docs wins |
| Exercise palette names: Breathing/Grounding/Somatic/Journaling/Self-Kindness/Crisis (Section 5) | Categories are `breathing, somatic, sensory, voice, mindful, crisis` (S08) | Data/IA decision: /docs wins (colours are reused with a documented remap) |
| Dark-mode display headings → `--color-warm-gold` (Section 12) | App-bar headline = M3 title-large, `text` (ledger Q5) | Typography decision: /docs wins unless lead opts in |

---

## 2. Anti-patterns — never carry over

Two patterns from the design-system must never be reproduced structurally. Pull the *intent*, implement per
M3 (state layers, tonal surfaces, proper elevation/ripple).

### 2.1 Emoji as the icon system
The design-system uses emoji as primary iconography throughout (Sections 9, 10, 16, 21, the category glyphs,
bottom-nav icons, empty-state icons).

- **Use a proper icon set** — MaterialCommunityIcons (already available) — for anything structural or
  repeated: navigation items, category/exercise-type markers, buttons, list leading icons.
- **A single emoji as a one-off warm touch is fine** (e.g. the ★ on quick-start favourites, a headline mark).
  The line is: emoji as an *entire* icon system is not carried forward; a *single* emoji as a deliberate accent is.

### 2.2 Flat / border-only / no-state-layer components
The design-system's `.btn` plain fills, `.ex-chip`/`.ex-tile` (tinted fill + coloured border as the only
differentiation), card borders as the only differentiator, and the bare-circle FAB are flat, border-differentiated,
no-state-layer patterns.

- **Pull the colour/typography intent** (which token, which weight, which tint) and **implement the actual
  component per M3 spec** — state layers (8%/12% overlays), tonal surfaces, ripple/elevation, spec'd dp values.
- Colour application is a mapping exercise (design-system token → M3 colour role), never a copy of the CSS shape.

---

## 3. Two kinds of borrow — and how to flag them

Before applying anything from the design-system, classify the borrow:

- **Type A — style-only, no locked decision touched.** It adds colour/typography/spacing on top of an
  already-agreed structure, or picks up an *idea* the design-system shows that /docs didn't rule on.
  → Free to apply. Record it in the screen spec ("borrowed from design-system: …") so the reasoning is visible.
  → No sign-off needed.

- **Type B — revises an already-locked `/docs` or ledger decision.** It changes a decided token value, a
  chosen component variant (e.g. ledger Q1 card fill), a decided layout shape, or any data/copy/feature decision.
  → **Must be flagged explicitly in the screen file and NOT applied until the project lead approves.**
  Flag format:
  > 🔒 **REVISES `<doc/decision>`:** `<what changes and from what to what>`. Requires sign-off before implementation.

**How to decide:** ask "does this change a decision already recorded in /docs (user stories, IA, ledger,
screen specs)?" Yes → Type B. Only adding style on top of an existing decision → Type A.
**If unsure → ask.** Never assume a borrow is Type A.

---

## 4. Cross-check before you borrow

1. Re-read the relevant `/docs` sections for the screen (user stories, IA, ledger, prior screen specs).
2. Identify what the design-system suggests for that screen's components.
3. Classify each borrow (Type A / Type B) and list any deliberate "not carried over" items with a one-line reason.
4. Cite **token names, never hex**, in specs and wireframes (maps to `theme/tokens.ts`).

---

## 5. Component decisions in every directions file

Every direction in every `docs/ui/sections/*` directions file must include a **"Component decisions"** subsection:
one row per UI element that differs from a plain M3 default. It forces each borrow to be concrete (component, token,
reason) instead of "more colourful", and it is where the emoji/animation replacement is specified.

| Column | What goes in it |
|---|---|
| **design-system does** | Name the actual pattern — e.g. "Section 10's 'Exercise Type Chips' are emoji + coloured pill *buttons*, not true chips". Never just "colourful". |
| **This direction uses** | The actual component (M3Chip / SegmentedButtons / IconButton / M3 Card / …), not just a token. |
| **Why** | The user story or UX principle driving the substitution (cite the S-number or principle) — not "more modern". |
| **Emoji → replacement** | If the design-system element used an emoji: the **named MaterialCommunityIcons glyph**, or a **specific animation** — what moves, on what trigger, roughly how (e.g. "ring scales 1.0→1.06, opacity 1→0.55, 4s loop on step mount — reinforces the pacing the exercise teaches"). Never just "icon instead of emoji". If the element has no emoji, write N/A. |

If a row changes an already-locked `/docs` value, mark the row **🔒** and reference the flag in the file's
recommendation (§3 Type B) instead of burying it in the table.