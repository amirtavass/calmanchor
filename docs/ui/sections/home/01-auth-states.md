# Home / Dashboard - authentication states

> **Status:** Home and Toolkit auth-state UI implemented; Profile account actions and
> final PDF product decision remain pending device/product verification.
> **Route:** `app/(tabs)/index.tsx`
> **Related:** `sections/home/00-dashboard.md`, `sections/toolkit/00-toolkit.md`,
> `docs/schema-coaching/01-user-stories.md` (S01, S02, S07, S19-S24), ADR-002.
> **Purpose:** define what Home shows before and after Google sign-in, and restore a
> visible account control for signed-in users.

## 1. Product decision

Calm Anchor remains browse-first:

- Signed-out users can understand the app, open the Toolkit, and read the first 10
  PDF pages.
- Signed-out users can browse public exercises and crisis support.
- Signed-out users cannot save sessions, journal entries, triggers, check-ins, or
  personal progress.
- Google sign-in unlocks the complete PDF and user-owned features.
- The account control is visible in the signed-in Home header. It opens Profile,
  where the user can sign out or switch account.

The 10-page PDF limit is a proposed product rule for Aamir to confirm. The exact
limit and the page shown after page 10 should remain configuration, not a hard-coded
screen assumption.

## 2. Implementation contract

This section is intentionally strict. An implementation agent should follow these
rules rather than inventing new cards, icon treatments, colours, or navigation.

### 2.1 Existing components and patterns are mandatory

- Use `ScreenHeader` for the tab header. Do not create a second header component.
- Use `M3Card` for the signed-out progress card, unlock list, and account summary
  surfaces. Use `fill={c.surfaceOffset2}` only for a disabled/locked surface; use
  `fill={c.surface}` for an active content card.
- Use `M3Button` for every sign-in action. The primary Google action is a filled
  button with `color={c.secondaryActive}` and the `google` icon. The quiet alternative
  is `variant="text"` with `color={c.textMuted}`.
- Reuse `SignInPrompt` and `useSignInGate()` for locked actions. Do not create a
  second sign-in modal for the Toolkit boundary.
- Use `M3Spinner` for in-flight sign-in/loading states. Do not replace it with a
  new activity indicator treatment.
- Use `MaterialCommunityIcons` through `@expo/vector-icons` only. Verify the glyph
  exists in the typed `MciGlyph` vocabulary before implementation.
- Use `useAppTheme()` and `colors[mode]`; never add a hard-coded colour to this flow.
- Use the existing `ScreenHeader` safe-area treatment: `paddingTop: insets.top + 8`,
  horizontal padding 16, minimum height 64dp.

### 2.2 Layout and spacing contract

- Home remains a tab screen: `ScreenHeader` outside the `ScrollView`, content inside
  the `ScrollView`, and `paddingBottom: 96` for the tab bar and Crisis FAB.
- Use 16dp horizontal content padding on Home. Use 18dp card padding, 12dp card
  radius, and 12dp between related blocks.
- New auth-state blocks must use the existing three-zone screen craft: header,
  scrollable content, and inline/section actions. Do not add a pinned action bar to
  Home.
- Keep all account and lock targets at least 44dp high/wide, even when the visible
  glyph is 18-20dp.
- Do not use layout shifts to reveal locked content. The signed-out Home should be
  a deliberate composition, not the signed-in dashboard with missing values.

### 2.3 Typography contract

Use React Native Paper variants or the existing dashboard values. Do not introduce a
new font family or arbitrary sizes.

| Content | Required treatment |
|---|---|
| Screen title | `titleLarge`: 22/28, weight 400, `c.text`, through `ScreenHeader`. |
| Signed-out hero title | 22/28, weight 800, `c.text`; one short supportive statement only. |
| Section heading | 20/26, weight 800, `c.text`, margin top 24 and bottom 8. |
| Card title | 16/24, weight 700, `c.text`. |
| Body/supporting copy | 14/21, `c.textMuted`, approximately 0.9 opacity where the existing screen uses it. |
| Lock-row label | 14.5/21, `c.textMuted`; never use `c.textFaint` for an actionable label. |
| Eyebrow/kicker | 11.5-13, weight 800, uppercase, letter spacing 0.6-0.7. |
| Button label | `M3Button` default `label-large`: 14/20, weight 500. |
| Account accessibility label | Plain language, for example `Open your profile`; never expose an icon name. |

The signed-out copy must be reassuring, not punitive. Prefer `Sign in to save your
progress` over `You cannot use this feature`.

### 2.4 Colour contract

Use semantic token pairs and preserve dark mode:

| Purpose | Light/dark treatment |
|---|---|
| Root Home background | `c.bg`. |
| Header | `c.surface`, matching `ScreenHeader`. |
| Active card | `c.surface`. |
| Locked/disabled card | `c.surfaceOffset2` with readable `c.text`/`c.textMuted`. Do not use opacity to make the whole card disappear. |
| Hairlines | `c.divider`; use `c.border` only for a real outline. |
| Primary sign-in CTA | `c.secondaryActive` fill with `c.textInverse` label. |
| Quiet sign-in action | `c.textMuted` text button. |
| Account icon | `c.secondary` on `c.surface2`, or `c.textMuted` when the control is neutral. |
| Lock icon | `c.textMuted` on `c.surfaceOffset` or `c.secondaryTint`; neutral, not error red. |
| Public exercise tiles | Existing exercise pairs such as `exBreath/exBreathBg` and `exGround/exGroundBg`. |
| Crisis tile/FAB | Existing `exCrisis/exCrisisBg`; never recolour Crisis to communicate auth state. |
| Signed-out unlock emphasis | `secondaryTint`/`secondary` may identify the invitation to sign in; do not introduce a new lock colour. |

Rules:

- A tinted surface always uses its pair: `*Bg` for the background and `*` for the
  icon/label. This is the same rule used by exercise, diary, and Toolkit cards.
- Colour is never the only difference. Every locked state has a lock glyph and clear
  copy; every public action has an icon and a label.
- Do not use `error`, `warning`, or `success` to indicate signed-out access. Being
  signed out is a neutral state, not an error.
- Do not use `textFaint` for lock labels, button labels, or accessibility-relevant
  text. Disabled controls remain readable using the existing M3 disabled treatment.

### 2.5 Icon contract

- Import `MaterialCommunityIcons` from `@expo/vector-icons/MaterialCommunityIcons`.
- Use `account-circle-outline` for the signed-in Home account control if it is
  present in the typed icon vocabulary; otherwise use the verified `account-outline`.
  Do not substitute a custom avatar glyph or emoji.
- Use `lock-outline` for a neutral locked feature. Use `lock-check-outline` only for
  the signed-in confirmation row, matching `app/exercise/[id].tsx`.
- Use `google` only for Google sign-in actions and the existing Google medallion.
- Use `lifebuoy` for Crisis, matching the current Home quick-action vocabulary.
- Standalone controls use a visible glyph of 20dp inside a 44dp hit target. Small
  supporting lock rows may use a 14-16dp glyph, matching the existing exercise detail
  sign-in row.
- Lock icons are not decorative badges floating over random corners. Put them at the
  leading edge of a row or inside a 34dp tinted icon container, matching the existing
  icon-led list pattern.

### 2.6 Canonical locked-access component

The dashboard lock card and the Toolkit page-11 boundary must use one visual pattern.
Do not create a different lock treatment for each screen.

```text
+------------------------------------------------------------+
| [lock]  Continue with Calm Anchor                          |
|         Sign in with Google to unlock this private feature. |
|                                                            |
|                                      [Sign in with Google]  |
+------------------------------------------------------------+
```

Implementation rules:

- Container: `M3Card`, `fill={c.surfaceOffset2}`, radius 12dp, padding 16dp.
- Leading icon: 34dp rounded square, radius 10dp, `c.surfaceOffset` fill, with
  `lock-outline` at 18dp in `c.textMuted`.
- Title: 16/24, weight 700, `c.text`. Use a specific title such as `Your progress`
  or `Continue with the full Toolkit`, not `Locked`.
- Supporting copy: 14/21, `c.textMuted`, maximum two lines where possible.
- Action: `M3Button` filled, `color={c.secondaryActive}`, Google icon leading,
  `textInverse` label. If the row is too narrow, place the button below the copy
  aligned to the right; never shrink the button below its standard 40dp height.
- Optional quiet action: `M3Button` text variant with `color={c.textMuted}` and
  label `Not now`. Use it in the page-11 sign-in modal, not as a disabled button.
- Do not apply `opacity` to the entire card, do not use a red error colour, and do
  not put the lock icon on top of the card as a floating badge.
- The card is an invitation, not a disabled control. The whole card may be a
  Pressable only when the destination is unambiguous; otherwise only the button is
  interactive and the card remains a readable surface.

The Toolkit page-11 state follows the same content hierarchy, inside the existing
`SignInPrompt` modal surface:

1. neutral `lock-outline` medallion;
2. title explaining what becomes available;
3. supporting copy explaining Google sign-in and privacy;
4. `Not now` text action and filled `Sign in with Google` action;
5. `M3Spinner` and `Opening Google...` while the request is in flight.

The Dashboard and Toolkit must therefore differ in placement only: the Dashboard
uses an inline `M3Card`; page 11 uses the established sign-in modal. Their lock icon,
copy hierarchy, token usage, and button treatment remain the same.

## 3. Account control and Profile opening behaviour

There is no hamburger menu or side drawer in the approved Calm Anchor navigation.
Decision D14 keeps five bottom tabs and puts low-frequency account actions in Profile.
The phrase "account side bar" should therefore be implemented as the existing pushed
Profile route, not as a new drawer pattern.

```text
SIGNED-IN HOME HEADER

+------------------------------------------------------------+
| Calm Anchor                              [person] [theme]   |
|                                           44dp   existing  |
+------------------------------------------------------------+
                                                   |
                                                   +--> profile/index.tsx
                                                        |
                                                        +--> identity card
                                                        +--> research profile
                                                        +--> Sign out
                                                        +--> Switch account
```

Header rules:

- Keep the title on the left and the existing ThemeToggle on the right.
- Insert the account control in the same `actions` row, immediately before the
  ThemeToggle. Signed-out Home renders only ThemeToggle.
- The account control uses a 36dp visual container inside a 44dp press target,
  `surface2` fill, `border` outline, 18dp radius, and a 20dp account glyph. This
  mirrors the existing ThemeToggle shape rather than creating a new pill.
- Pressing it calls `router.push("/profile")`; it does not open an overlay, drawer,
  or bottom sheet.
- The account control has a pressed state layer using the existing M3 pattern and
  never changes the header height.
- Do not duplicate Profile navigation through a second prominent avatar in the
  greeting card. The greeting card may retain a passive chevron only if the final
  screen needs it, but the header control is the canonical account affordance.

Profile route rules:

- Keep the existing Profile screen scaffold, `ScreenHeader`/quiet header pattern,
  `M3Card` identity card, and existing sign-out controls.
- `Sign out` is an outlined `M3Button` using `color={c.error}` only because it is a
  destructive action; it is not the colour of the account icon.
- `Switch account` is a text/outlined action that signs out and reopens the existing
  Google sign-in flow. Do not add a provider picker because Google is the only
  provider (ADR-002).
- If a confirmation surface is needed, reuse the existing M3 modal language and
  surfaces. Do not build a navigation drawer solely for account switching.

## 4. Signed-out Home

The signed-out dashboard should not look like an empty or broken version of the
signed-in dashboard. It should explain the value of signing in while preserving
public browsing and crisis access.

```text
+------------------------------------------------------------+
| ZONE 1 - HEADER                                             |
| Calm Anchor                                      [moon]     |
+------------------------------------------------------------+
| ZONE 2 - CONTENT                                            |
|                                                            |
| +--------------------------------------------------------+ |
| | A calm place to begin                                 | |
| |                                                        | |
| | Explore grounding, breathing and nervous-system       | |
| | exercises at your own pace.                          | |
| |                                                        | |
| | [Sign in with Google]                                 | |
| |                                                        | |
| | You can browse without an account. Sign in when you   | |
| | want to save sessions, journal entries or progress.   | |
| +--------------------------------------------------------+ |
|                                                            |
| Start here                                                 |
| +----------------+ +----------------+                     |
| | Breathe        | | Ground         |                     |
| | public         | | public         |                     |
| | [open]         | | [open]         |                     |
| +----------------+ +----------------+                     |
| +----------------+ +----------------+                     |
| | Toolkit        | | Crisis         |                     |
| | 10 pages free  | | always open    |                     |
| | [book]         | | [lifebuoy]     |                     |
| +----------------+ +----------------+                     |
|                                                            |
| Your progress                                              |
| +--------------------------------------------------------+ |
| | [lock] Sign in to save your sessions and reflections  | |
| |                                                        | |
| | Your private activity will appear here after you       | |
| | sign in with Google.                                  | |
| |                                      [Sign in]          | |
| +--------------------------------------------------------+ |
|                                                            |
| What sign-in unlocks                                       |
| +--------------------------------------------------------+ |
| | [lock] Full Toolkit PDF                               | |
| | [lock] Saved exercise sessions                        | |
| | [lock] Private diary and triggers                     | |
| | [lock] Personal progress and check-ins                | |
| +--------------------------------------------------------+ |
|                                                            |
| [Browse exercises]                                         |
|                                                            |
| [Crisis FAB]                                               |
+------------------------------------------------------------+
| TAB BAR: Home | Toolkit | Exercises | Diary | Portfolio    |
+------------------------------------------------------------+
```

### Signed-out Home component decisions

| Area | Signed-out treatment | Reason |
|---|---|---|
| Greeting | Replace personal greeting with calm introductory copy | Do not fabricate a name or imply a session exists. |
| Sign-in CTA | One prominent Google CTA near the top; secondary repeat CTA in locked progress card | The first CTA explains the value; the second appears at the moment of intent. |
| Stats | Do not show Sessions, Streak, or In window numbers | Numbers would be misleading without a user session and could imply tracking. |
| Today's plan | Replace with `Start here` public actions | A personal plan requires user data; public discovery does not. |
| Quick relief | Keep public exercises and Crisis | Browse-first and crisis access remain available without auth. |
| Toolkit | Show as `10 pages free` and allow reading up to the agreed limit | Matches the meeting decision that the PDF is readable without auth. |
| Recent activity | Replace with the locked `Your progress` card | Avoid an empty list that looks like a loading/error state. |
| Weekly chart | Hide entirely | No data exists and the app must not show a false trend. |
| Journal | Keep the tab discoverable, but explain sign-in at save or use a locked landing state | Users can understand the feature without silently losing an entry. |
| Crisis FAB | Always available and never gated | Crisis support must remain one tap away. |

## 5. Signed-in Home

The signed-in dashboard keeps the current personal dashboard content, but the
account control returns to the header so the user can reach Profile without having
to infer that the greeting card is clickable.

```text
+------------------------------------------------------------+
| ZONE 1 - HEADER                                             |
| Calm Anchor                              [person-circle]    |
|                                           account control  |
+------------------------------------------------------------+
| ZONE 2 - CONTENT                                            |
| +--------------------------------------------------------+ |
| | [sun]  SUNDAY, 13 SEPTEMBER                           | |
| |       Good morning, Amir                              | |
| |       Notice what your morning body is carrying today.| |
| +--------------------------------------------------------+ |
|                                                            |
| +------------+ +------------+ +------------+               |
| | Sessions   | | Streak     | | In window  |               |
| | 12 / real  | | 5d         | | 67%        |               |
| +------------+ +------------+ +------------+               |
|                                                            |
| Today's plan                                               |
| +--------------------------------------------------------+ |
| | (done) Check-in ---- (2) Exercise ---- (3) Journal     | |
| +--------------------------------------------------------+ |
|                                                            |
| Quick relief                                               |
| +----------+ +----------+ +----------+ +----------+       |
| | Breathe  | | Ground   | | Journal  | | Crisis   |       |
| +----------+ +----------+ +----------+ +----------+       |
|                                                            |
| This week in your window                                   |
| +--------------------------------------------------------+ |
| | Where you spent the week                         67%    | |
| | |  |  |  |  |  |  |  |                              | |
| | M  T  W  T  F  S  Today                               | |
| +--------------------------------------------------------+ |
|                                                            |
| Recent                                                    |
| +--------------------------------------------------------+ |
| | [done] Morning breathing - 2h                         | |
| | [note] Journal - Reflection - 6h                      | |
| +--------------------------------------------------------+ |
|                                                            |
| [Start today's session ->]                                 |
|                                                            |
| [heart] Be gentle with yourself ->                        |
|        A short reflection is enough.                      |
|                                                            |
| [Crisis FAB]                                               |
+------------------------------------------------------------+
| TAB BAR: Home | Toolkit | Exercises | Diary | Portfolio    |
+------------------------------------------------------------+
```

### Account control placement and behaviour

```text
SIGNED-IN HEADER

  +--------------------------------------------------------+
  | Calm Anchor                              [person-circle]|
  |                                           44dp target  |
  +--------------------------------------------------------+
                                                   |
                                                   +--> /profile
                                                        |
                                                        +--> identity card
                                                        +--> research profile
                                                        +--> Sign out
                                                        +--> Switch account
```

The icon should:

- Sit in the top-right of `ScreenHeader`, inside a minimum 44dp press target.
- Use a MaterialCommunityIcons account glyph, not an emoji or a text avatar.
- Be present only when a session is active; signed-out users use the visible Google
  CTA instead.
- Have an accessible label such as `Open your profile`.
- Open the existing Profile route. Sign out and switch-account actions belong on
  Profile, not inside the Home header.
- Keep the greeting card's chevron out of the profile-navigation responsibility.
  The card may remain visually informative, but the account icon is the canonical
  account entry point.

## 6. Toolkit access states

The PDF viewer needs an explicit signed-out boundary. It must not look like the
viewer failed to load.

```text
SIGNED-OUT, PAGES 1-10

+------------------------------------------------------------+
| Toolkit                                      [book]        |
| Free preview - pages 1 to 10                               |
+------------------------------------------------------------+
|                                                            |
|                  [PDF page content]                       |
|                                                            |
| Page 6 of 10                                               |
| [< Previous]                                  [Next >]     |
+------------------------------------------------------------+

SIGNED-OUT, ATTEMPT TO OPEN PAGE 11

+------------------------------------------------------------+
|                  [lock]                                    |
|                                                            |
| Continue with the full Toolkit                            |
| Sign in with Google to read the remaining pages and save   |
| your progress.                                             |
|                                                            |
| [Not now]                         [Sign in with Google]     |
+------------------------------------------------------------+
```

Rules:

- The preview should include the first 10 PDF pages, subject to Aamir's approval.
- Page navigation must stop cleanly at the boundary; do not open page 11 and then
  cover it with an error.
- Tapping a locked chapter or page uses the same soft sign-in prompt as the rest
  of the app.
- After successful sign-in, return the user to the page or chapter they attempted
  to open, where possible.
- If the PDF is public but the viewer cannot enforce page limits reliably, use a
  product decision to choose between a preview PDF asset or a server-side/page
  access boundary. Do not pretend that a client-only page limit protects the full
  document.

## 7. State and copy matrix

| State | Home identity | Home data | Toolkit | User-owned actions |
|---|---|---|---|---|
| Signed out | Introductory copy | No personal stats or chart | First 10 pages | Soft sign-in prompt |
| Signed in, no activity | Personal greeting | Empty states, no fabricated progress | Full PDF | Save actions enabled |
| Signed in, active | Personal greeting | Real sessions/check-ins/recent activity | Full PDF | Save, edit, delete per existing rules |
| Session expired | Introductory copy after refresh | Clear signed-out state | First 10 pages | Prompt on next protected action |

## 8. Open decisions for Aamir

These are intentionally recorded rather than silently assumed:

1. Confirm that the signed-out PDF preview limit is exactly 10 pages.
2. Confirm whether the first 10 pages should be a preview of the real PDF or a
   separate public preview document.
3. Confirm the copy and destination when a signed-out user reaches the limit.
4. Confirm whether the signed-out Diary tab shows a locked landing card or remains
   browseable until Save, consistent with S01.
5. Confirm whether `Switch account` should sign out immediately and reopen the
   Google prompt, or first show a confirmation sheet.

## 9. Remaining implementation boundary

Implemented from this guide:

- auth-state conditional rendering on Home;
- signed-in account icon in `ScreenHeader`;
- shared `LockedAccessCard` treatment;
- Toolkit page-10 signed-out boundary and sign-in prompt;
- signed-out Home public actions and locked progress/unlock cards.

Still pending:

- product confirmation that 10 pages is the final preview limit;
- device verification of page-boundary behavior on Android;
- Profile sign-out/switch-account refinements;
- Google provider and Supabase dashboard configuration;
- real dashboard aggregation (Phase B).

Update `sections/home/00-dashboard.md` and the Toolkit screen spec whenever the
approved product decision changes this guide.
