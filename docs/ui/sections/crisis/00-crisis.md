# Crisis — section design

> **Route:** `app/crisis/index.tsx` (full-screen modal from the Crisis FAB) · **M:** M2 ·
> **Sources:** IA §3 *Crisis* vertical + **S11** (crisis exercises are a category, not a separate
> section) + `docs/ui/03-screen-craft.md`.
> **Journey verticals:** Do (emergency). **Rules:** no confirmation dialogs, no login gate,
> usage never logged/analysed (IA §3).

## 1. Stories served

| Story | Screen treatment |
|---|---|
| **S11** crisis = category of exercises | Ground / Breathe / Quick Reset deep-link to the **real** exercise screens (`/exercise/category/sensory`, `/exercise/category/crisis`) — no placeholder crisis-mode. |
| Crisis contacts | UK contacts visible, never intrusive (Samaritans 116 123 · Shout 85258 · NHS 111). |
| One tap away | Persistent `CrisisFab` (always visible, above the tab bar) opens this modal. |

## 2. The design

```
┌───────────────────────────────────────────────┐
│  [        ]  Crisis help          [✕]        │  quiet header (icon-only close)
├───────────────────────────────────────────────┤
│  Take a moment.                               │  headline 800
│  Grounding, breathing and your quick reset    │  subline muted
│  are one tap away.                            │
│  ┌── 🍃 Ground · 5-4-3-2-1 grounding       › ┐│  --ex-ground tile
│  ┌── 🌬 Breathe · Box breathing (4-4-4-4)  › ┐│  --ex-breath tile
│  ┌── 🛟 Quick reset · Tools for the bad days›┐│  --ex-crisis tile
│  ┌─────────────────────────────────────────┐ │
│  │  UK CRISIS CONTACTS                     │ │  surface card
│  │  Samaritans 116 123 · Shout 85258 · NHS │ │
│  └─────────────────────────────────────────┘ │
└───────────────────────────────────────────────┘
```

## 3. Decisions

| Item | Decision | Why |
|---|---|---|
| Actions | Colour-field tiles (dashboard quick-action idiom): 40 dp solid `--ex-*` medallion, title 15/800, supporting 13/19, chevron | Consistent with the rest of the app (craft §5, §6). Colour + icon + word (R7). |
| Ground → | `/exercise/category/sensory` | 5-4-3-2-1 lives in the sensory category. |
| Breathe / Quick reset → | `/exercise/category/crisis` | Box breathing + bad-days tools live in the crisis category (S11). |
| Close | Quiet 36 dp icon circle (`surfaceOffset`, `close`, top-right, `hitSlop`) | Craft §10.4 — exit is quiet and out of the way; no word "Cancel". |
| Contacts | `surface` card, uppercase eyebrow + one line | Visible but not intrusive (IA §3). |
| No login | No `ensureSignedIn` anywhere | Crisis must never gate (IA §3). |

## 4. Craft cross-check (03-screen-craft §13)

- Three-zone scaffold; quiet header respects the safe area (`insets.top + 6`).
- Every colour is a token pair; `textInverse` on the solid medallions.
- Loading / error / empty not needed (static content + real routes).
- Icons typed `MciGlyph`, verified (`leaf`, `weather-windy`, `lifebuoy`, `chevron-right`, `close`).
- tsc clean · expo export clean.