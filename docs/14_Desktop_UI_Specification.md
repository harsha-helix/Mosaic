
# 14 — Desktop UI Specification

> Desktop adaptation of `07_UI_Specification.md`. Mosaic was built mobile-first (see `04_Information_Architecture.md`, "Out of Scope: Desktop-specific layout"); this doc reverses that exclusion for one breakpoint. It does **not** change tokens (color, type, radius, shadow), copy, data model, or navigation destinations — those are the mobile spec's, unchanged. This is a layout-only pass: how the same screens, same components, same 5-cluster palette rearrange themselves when there's more than a phone's width of room.

> **Scope note:** single breakpoint. Below it, the app is exactly what `07_UI_Specification.md` describes — no changes. Above it, the layouts in this doc apply. There is no separate tablet redesign in this pass (see Out of Scope).

---

## Why this exists

Mosaic's mobile layout makes real sense at 375–430px: a bottom nav within thumb reach, a floating `+` for a five-second capture, full-screen takeovers for the two daily rituals so nothing competes for attention. None of that reasoning holds at 1440px. A single centered column of mobile-width content on a desktop monitor wastes the frame, floating action buttons read as a mobile pattern transplanted rather than a native one, and full-viewport modal takeovers feel heavier than they need to when there's room to dim a backdrop instead.

The fix is not a redesign — it's translating the same information hierarchy into desktop-native patterns: sidebar instead of bottom nav, centered dialogs instead of full-screen flows, multi-column grids instead of single-column stacks where content genuinely parallelizes (charts, cards) and *not* where it doesn't (forms stay single-column — a wide input field isn't more usable, just harder to scan).

---

## Breakpoint

| Range | Behavior |
|---|---|
| `< 1024px` | Mobile layout, unchanged. Bottom nav, FAB, full-screen Morning/Evening/Moment Capture. This is everything in `07_UI_Specification.md`. |
| `≥ 1024px` (`lg`) | Desktop layout, this doc. Sidebar nav, centered dialogs, multi-column screens. |

1024px is chosen over the more common 768px because Mosaic's mobile layout already reads fine on a large phone or a small tablet held in portrait — the point where it starts feeling cramped is closer to "browser window," not "tablet." Implementation: a single Tailwind `lg:` breakpoint family; no new breakpoint needs adding to `tailwind.config.ts` since `lg` (1024px) already exists as a Tailwind default.

No JS-based layout switching — this is CSS media-query driven throughout, same as the existing `dark:` variant pattern, so resizing a window live-transitions between layouts with no flash or remount.

---

## Layout Tokens (desktop-only additions)

These are new — nothing here overrides a mobile token.

| Token | Value | Used for |
|---|---|---|
| `sidebar-width` | 240px | Sidebar nav |
| `content-max-width` | 1120px | Max width of the scrollable content area next to the sidebar, centered within any extra window width beyond it |
| `content-gutter` | 40px | Left/right padding inside the content area |
| `column-gap` | 24px | Gap between columns in 2-up / 3-up layouts |
| `dialog-width-sm` | 480px | Moment Capture dialog |
| `dialog-width-md` | 600px | Morning / Evening dialog |
| `dialog-width-form` | 440px | Onboarding card |

Card radius, shadow, and color tokens are all reused as-is from `07_UI_Specification.md` / `tailwind.config.ts` (`rounded-card`, `shadow-card`, the five accent-cluster CSS variables, etc). Desktop cards do not get a different shadow or radius than mobile cards.

---

## Navigation: Sidebar (replaces BottomNav ≥1024px)

```
┌────────────────┬──────────────────────────────────────┐
│  ✦ Mosaic      │                                        │
│                │                                        │
│ ┌────────────┐ │                                        │
│ │ + New moment│ │           (page content)               │
│ └────────────┘ │                                        │
│                │                                        │
│  ⌂ Home        │                                        │
│  ★ Highlights  │                                        │
│  ▤ Insights    │                                        │
│  ⌕ Search      │                                        │
│  ⚙ Settings    │                                        │
│                │                                        │
│                │                                        │
│  ────────────  │                                        │
│  Harsha        │                                        │
│  ● synced      │                                        │
└────────────────┴──────────────────────────────────────┘
   240px fixed              content-max-width, centered
```

- Fixed, full-height, `bg-surface` with a right hairline border (`border-hairline`) — same surface/border tokens as the mobile `BottomNav`, just rotated 90°.
- Brand mark at top (`✦ Mosaic`, Fraunces), replacing the greeting-per-screen pattern mobile relies on since there's now a permanent chrome element to hold identity.
- **"+ New moment" button**, not a floating action button. Full sidebar-width, `bg-terracotta`, same button treatment as spec's Primary button (inset shadow, `rounded-btn`). Opens the Moment Capture dialog (see below). This is the one meaningful interaction-model change: the FAB's "always reachable, floats over everything" job is replaced by "always visible, first thing in the sidebar" — appropriate because a mouse doesn't have the mobile FAB's thumb-reach constraint to solve for.
- Five nav rows below it: same icon set, same active/inactive color rule as `BottomNav` (`text-terracotta` + bold active, `text-hint` inactive) — just icon-left-of-label instead of icon-above-label, and a full-row hover state (`bg-elevated` on hover) since desktop has hover.
- Active row gets a left accent bar (3px, `bg-terracotta`) rather than just color, so active state reads at a glance in peripheral vision the way a highlighted sidebar item conventionally does.
- Footer: display name + a small sync-status dot (reuses whatever `useSyncStore` already exposes — `idle`/`syncing`/`error` — rendered as dot color, no new state). Gives the sidebar a natural place for "is my data safe" ambient reassurance without adding a Settings visit.
- **Does not scroll** with content; content area scrolls independently to its right.

Component: new `SidebarNav`, rendered instead of `BottomNav` at `≥1024px` (both can live in the DOM guarded by Tailwind's `hidden lg:flex` / `flex lg:hidden`, same pattern already used for dark mode's `dark:` variants — no JS breakpoint detection needed).

---

## Full-screen flows → Dialogs

Morning Check-in, Evening Commit, and Moment Capture are full-viewport on mobile because the spec calls for them to "deserve full attention" (§3) or because a bottom sheet is the native mobile pattern for a quick overlay (§4). On desktop, "full attention" is better served by a centered dialog over a dimmed backdrop — it keeps the ritual-like focus (everything outside it recedes) without the disorienting effect of a form taking over an entire 27" monitor.

```
┌──────────────────────────────────────────────────────┐
│                                                        │
│   (dimmed sidebar + content, bg-black/40 overlay)     │
│                                                        │
│         ┌──────────────────────────────┐             │
│         │  ←   Morning                  │             │
│         │      Jun 28                   │             │
│         │                                │             │
│         │  ... same field order as       │             │
│         │  mobile, single column ...     │             │
│         │                                │             │
│         │  ┌──────────────────────┐     │             │
│         │  │      Save morning     │     │             │
│         │  └──────────────────────┘     │             │
│         └──────────────────────────────┘             │
│                                                        │
└──────────────────────────────────────────────────────┘
```

Rules that apply to all three (Morning, Evening, Moment Capture) at `≥1024px`:

- Backdrop: `bg-black/40`, click-to-dismiss preserved from Moment Capture's existing mobile behavior; Morning/Evening gain click-outside-to-dismiss on desktop (they don't have this on mobile since there's no "outside" — full viewport). Same no-confirmation-needed draft-save behavior as spec §3.
- Container: `bg-surface`, `rounded-card` (16px, all four corners — not the mobile bottom-sheet's top-only `rounded-sheet`), `shadow-card`, vertically centered, max-height `85vh` with internal scroll.
- Width: `dialog-width-md` (600px) for Morning/Evening, `dialog-width-sm` (480px) for Moment Capture's capture step. Content inside stays single-column — these are forms, and forms scan better narrow-and-tall than wide-and-short even with room to spare.
- Motion: replaces "slide up from bottom" with scale+fade-in (0.96 → 1, 180ms, ease-out) and a matching scale+fade-out on dismiss — conventional desktop dialog motion, analogous to the mobile sheet's slide/spring but native to the container shape. Backdrop fade timing (200ms) is unchanged from spec.
- Moment Capture's Step 1 type grid widens from 3 columns to 5 (14 types fit in 3 rows instead of 5 — meaningfully less scrolling), tiles otherwise unchanged (10%-opacity accent background, accent-colored icon).
- Evening's Commit Ceremony (terminal type-out + confetti + fade, spec §5) plays inside the dialog bounds, not full-viewport — confetti particles are simply clipped to the dialog's rounded-card bounds rather than the window.

Component: new shared `Dialog` wrapper (backdrop + centered card + scale motion + Esc-to-dismiss), used by `MorningScreen`, `EveningScreen`, and `MomentCapture` at `≥1024px`; each keeps its existing mobile full-screen/bottom-sheet render path below `1024px`. Keyboard: Esc dismisses (new — desktop convention, no mobile equivalent needed), Tab cycles fields, Enter-in-last-field does not auto-submit (avoid accidental commits on a long form).

---

## Screens

### 1. Onboarding

> **Superseded by `15_Onboarding_and_Dark_Theme_Refresh.md`** (2026-07-02) — onboarding moves from one static form to a multi-step flow. The 440px centered-card/`dialog-width-form` treatment below still holds on desktop; only the card's *contents* change per doc 15.

Single column stays single column — centering it is the entire fix.

```
┌────────────────────────────────────────────────────────┐
│                                                          │
│                                                          │
│              ┌────────────────────────┐                │
│              │      ✦ Mosaic          │                │
│              │  "Made of the moments  │                │
│              │   you'd otherwise      │                │
│              │   forget."              │                │
│              │  ──────────────────    │                │
│              │  What should we call   │                │
│              │  you?                  │                │
│              │  [____________]        │                │
│              │  Morning reminder      │                │
│              │  [8:00 AM]             │                │
│              │  Evening reminder      │                │
│              │  [9:00 PM]             │                │
│              │  [Connect Google Drive]│                │
│              │  Your data lives in    │                │
│              │  your Drive.           │                │
│              └────────────────────────┘                │
│                                                          │
└────────────────────────────────────────────────────────┘
        (dialog-width-form, 440px, vertically centered)
```

No sidebar (matches mobile: nav is hidden pre-auth). Card sits on the plain `bg-base` canvas, `shadow-card`, `rounded-card` — reads as a single focused artifact on an otherwise empty desktop window rather than stretching form fields to fill the frame.

---

### 2. Home

Mobile stacks quote → averages → last-beautiful-thing → status strip → banner, all full-width, because there's only one width available. Desktop has room to run the "at a glance" content and the "one thing to look at" content side by side.

```
┌──────────────────────────────────┬───────────────────────────┐
│  Good morning, Harsha ☀️          │                            │
│                                    │                            │
│ ┌────────────────────────────┐    │  ┌──────────────────────┐  │
│ │ "The goal is not to        │    │  │ [photo]               │  │
│ │  remember every day..."    │    │  │ Last beautiful thing  │  │
│ └────────────────────────────┘    │  │ saw the sun set...    │  │
│                                    │  │                Jun 28 │  │
│  Last 7 days                       │  └──────────────────────┘  │
│  ┌──────────────────────────┐     │                            │
│  │ ✦7.2  😴6.8h  😟4.1      │     │  ┌──────────────────────┐  │
│  │ 😊6.5  ⚡7.0              │     │  │ Start your morning → │  │
│  └──────────────────────────┘     │  │ (conditional banner)  │  │
│                                    │  └──────────────────────┘  │
│  Today                             │                            │
│  ○ Morning · [mosaic tiles] · ○   │                            │
│                                    │                            │
└────────────────────────────────────┴───────────────────────────┘
        left column ~60%                    right rail ~40%
                        column-gap: 24px
```

Left column: greeting, quote card, 7-day averages, Today status strip — the "how's it going" content, in reading order. Right rail: last-beautiful-thing card and any conditional banner — the "one thing to notice" content, visually separated so it doesn't compete with the averages for attention. Both columns cap at `content-max-width` combined, not each independently full-width. Below `1024px`, right rail content simply drops below the left column in the same order as spec §Home — no content is removed, only re-flowed.

---

### 3 & 5. Morning Check-in / Evening Commit

Covered under **Full-screen flows → Dialogs** above. No further column changes — these stay single-column forms inside the dialog, exactly per spec §3/§5's field order. The one desktop-only addition: MetricCircles rows get a touch more horizontal breathing room (28px circles unchanged, but the row no longer needs to compress against a 375px edge), and multiple metric rows can optionally sit two-per-row side by side (Mood next to Energy, Anxiety next to Excitement) if this reads better in practice — flagged as an option, not a requirement, since spec's stacked order is easy to scan and shouldn't be broken just because there's width available.

---

### 4. Moment Capture

Covered under **Full-screen flows → Dialogs**. Step 1's grid goes 3→5 columns (noted above). Step 2's capture screen stays single-column inside `dialog-width-sm` — text field, photo attachment, Remember toggle, Save button, same order as spec §4.

---

### 6. Highlights

Mobile is a single chronological feed. At 1440px a single centered column of cards is the clearest sign an app hasn't been adapted for desktop — so this becomes a masonry-style 2-up grid, still newest-first, still grouped by date.

```
┌──────────────────────────────────────────────────────────┐
│  Highlights                                               │
│                                                             │
│  [Jun 28]                        [Jun 28]                 │
│  ┌───────────────────┐          ┌───────────────────┐    │
│  │ [●] Beautiful      │          │ ✦ Day committed    │    │
│  │ saw the sun set...  │          │ "the terrace at    │    │
│  │ [photo]             │          │  golden hour"       │    │
│  └───────────────────┘          │ Spark 9 · Mood 8    │    │
│                                    └───────────────────┘    │
│  [Jun 20]                                                  │
│  ┌───────────────────┐                                    │
│  │ [●] Idea           │                                    │
│  │ what if mosaic...   │                                    │
│  └───────────────────┘                                    │
└──────────────────────────────────────────────────────────┘
```

- 2-column CSS grid, cards keep their natural (variable) height — a masonry layout, not a fixed-height grid, so a card with a photo doesn't force its neighbor to match height.
- Date labels span both columns above the row they introduce, consistent with mobile's date-then-cards grouping.
- `MomentCard` itself is unchanged — same border-left accent, same shadow, same photo thumbnail (once wired per `10_UIUX_Audit.md` #1). This is a grid-placement change only.
- Empty state copy and illustration unchanged from spec, just centered within the full content width instead of a mobile column.

---

### 7. Day View

Mobile stacks Morning → Moments → Evening top to bottom because a phone can't show all three without scrolling anyway. Desktop can — and a day's full shape (orient → live it → reflect) is exactly the kind of thing that benefits from being visible at once rather than scrolled through.

```
┌───────────────┬───────────────────────┬───────────────────┐
│ ← Jun 28 · Tue │                       │                    │
│ "the terrace   │                       │                    │
│  at golden     │                       │                    │
│  hour"         │                       │                    │
│                │                       │                    │
│ Morning        │  Moments (3)          │  Evening           │
│ 😊7 ⚡8 😟4 🌟9│  [●]Coffee 9:14AM     │  ✦9 😊8            │
│ Intention:     │  first cup, slow...   │  🏃40m 📚30m 💻3.5h │
│ finish the doc │                       │                     │
│ Priority:      │  [●]Beautiful 6:42PM★│  Biggest win        │
│ nothing else   │  saw the sun set...   │  actually started   │
│ Notice: light  │  [photo]              │  building            │
│                │                       │                     │
│                │  [●]Idea 9:01PM       │  Journal             │
│                │  what if mosaic...    │  rare day where...   │
│                │                       │                     │
│                │                       │  > feat: noticed     │
│                │                       │    beauty in a Tue.  │
└───────────────┴───────────────────────┴───────────────────┘
   ~22% Morning        ~40% Moments             ~38% Evening
```

Three columns, day title/header spans the full width above them. Moments column is widest since it's typically the most variable-length content (0 to a dozen+ moments). All three columns are read-only per spec, unchanged. Below `1024px`: collapses to spec's existing mobile stack order (Morning, then Moments, then Evening) — no reflow logic needed beyond letting the grid become a single column.

---

### 8. Insights

Mobile stacks 5 full-width charts vertically — a lot of scrolling for content that's meant to be scanned for patterns at a glance. Desktop grids them 2-up.

```
┌──────────────────────────────────────────────────────────┐
│  Insights                                                  │
│  ┌────────────────────────────────────────────────────┐   │
│  │  🔥 12 day streak · 18 days this month              │   │
│  │  Avg: Spark 7.8 · Sleep 7.1h · Mood 7.2 · Energy 7.6│   │
│  │  · Anxiety 3.8                                       │   │
│  └────────────────────────────────────────────────────┘   │
│                    [ 7d ] [ 30d ] [ 90d ]                  │
│  ┌───────────────────────┐  ┌───────────────────────┐    │
│  │ Spark                  │  │ Sleep                  │    │
│  │ [line chart]            │  │ [line chart]            │    │
│  └───────────────────────┘  └───────────────────────┘    │
│  ┌───────────────────────┐  ┌───────────────────────┐    │
│  │ Mood & Energy           │  │ Anxiety                 │    │
│  │ [dual line chart]       │  │ [line chart]            │    │
│  └───────────────────────┘  └───────────────────────┘    │
│  ┌────────────────────────────────────────────────────┐   │
│  │ Moments per day  [bar chart, multi-color]           │   │
│  └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
```

- Summary card and time-window segmented control stay full-width (they're the "state of the union" content, not a comparison chart).
- Four line charts pair into a 2×2 grid; "Moments per day" bar chart stays full-width since it's a different chart type and reads awkwardly squeezed to half-width.
- Recharts containers just need a `width` that resolves against the grid cell instead of the viewport — no chart-library change, this is a container-sizing change.
- Same empty-state copy for `< 3 days` of data, same streak-reset rule.

---

### 9. Search

Mobile: search bar → scrollable filter chips → vertical results list. Desktop: filters move to a persistent left column so they don't need to be re-scrolled-past on every search, results go 2-up.

```
┌────────────────┬─────────────────────────────────────────┐
│ 🔍 Search       │                                          │
│ memories        │  ── Results ──────────────────────────  │
│                 │                                           │
│ Filter          │  ┌───────────────┐ ┌───────────────┐    │
│ ☐ All           │  │[●]Beautiful    │ │[●]Idea         │    │
│ ☐ 📷 Photo      │  │Jun 28           │ │Jun 20           │    │
│ ☐ 🌸 Beautiful  │  │saw the sun...   │ │what if mosaic...│    │
│ ☐ 💡 Idea       │  └───────────────┘ └───────────────┘    │
│ ☐ 🙏 Gratitude  │                                           │
│ ...             │                                           │
└────────────────┴─────────────────────────────────────────┘
   ~200px filter col        results grid, 2-up
```

- Filter chips become a checklist column (still single-select-or-All per current behavior, just laid out vertically — easier to scan 14 types in a column than a wrapped horizontal chip row).
- Results grid mirrors Highlights' 2-up treatment for consistency between the app's two "browse past moments" screens.
- Auto-focus on the search input is preserved from spec. Empty-state ("Recent" last-5) and no-results copy unchanged.

---

### 10. Settings

Mobile stacks section → rows top to bottom. Desktop uses the standard label-column / control-column settings pattern, which reads faster once there's width for it.

```
┌──────────────────────────────────────────────────────────┐
│  Settings                                                  │
│                                                             │
│  Notifications          ┌──────────────────────────────┐  │
│                          │ Morning reminder    [08:00]  │  │
│                          │ Evening reminder    [21:00]  │  │
│                          └──────────────────────────────┘  │
│  Storage                 ┌──────────────────────────────┐  │
│                          │ Google Drive  ✓ Connected     │  │
│                          │               [Reconnect]     │  │
│                          └──────────────────────────────┘  │
│  Your name                ┌────────────────────────────┐  │
│                          │ [Harsha_______________]      │  │
│                          └──────────────────────────────┘  │
│                                                             │
│  ─────────────────────────────────────────────────────    │
│  Mosaic v1.0 · Made for one.                               │
└──────────────────────────────────────────────────────────┘
```

Section label sits to the left (`text-secondary`, right-aligned or top-aligned depending on row height — right-aligned reads more like a settings pane, top-aligned reads more like a form; recommend top-aligned to match Karla's left-reading rhythm rather than introducing a new right-aligned-label pattern nowhere else in the app uses). Control column caps at ~480px so text inputs don't stretch wide. This layout also naturally accommodates whatever Settings ends up being reconciled to per `10_UIUX_Audit.md` #6 (Account/Sync/About/Sign-out) — the label/control pattern scales to more sections without redesign.

---

## Component Change Summary

| Mobile component | Desktop (`≥1024px`) behavior |
|---|---|
| `BottomNav` | Replaced by new `SidebarNav` (left rail, 240px, icon+label rows, active accent bar) |
| `FAB` | Replaced by "+ New moment" full-width button inside `SidebarNav` |
| `MomentCapture` (bottom sheet) | Wrapped in shared `Dialog` (centered card, scale-fade motion); type grid 3→5 columns |
| `MorningScreen` / `EveningScreen` (full-viewport) | Wrapped in shared `Dialog` (600px centered card); field order/content unchanged |
| Highlights feed (1-column) | 2-column masonry grid |
| Search results (1-column list) | Filter sidebar + 2-column results grid |
| Insights charts (stacked) | 2×2 chart grid + full-width bar chart |
| Day View (stacked sections) | 3-column grid (Morning / Moments / Evening) |
| Home (stacked sections) | 2-column (primary content / right rail) |
| Settings (stacked rows) | Label-column / control-column |
| `MomentCard`, `MetricCircles`, `RememberToggle`, icons, all color/type/radius tokens | **Unchanged.** Reused as-is; this pass touches layout, not visual language. |

---

## Motion (desktop-specific)

| Interaction | Desktop animation |
|---|---|
| Dialog open (Morning/Evening/Moment Capture) | Scale 0.96→1 + fade, 180ms ease-out (replaces mobile's slide-up) |
| Dialog dismiss | Scale 1→0.96 + fade, 150ms ease-in |
| Sidebar active row change | Accent bar slides to new row, 150ms ease-out (subtle, avoid a jarring snap) |
| Everything else (screen transitions within the content area, MetricCircles select, Remember toggle, commit ceremony, FAB-equivalent tap) | Unchanged from spec's Motion table |

---

## Out of Scope (this pass)

- **Tablet-specific breakpoint.** 1024px is a hard cut from mobile to desktop; a 768–1023px transitional layout is not designed here. Current behavior: anything under 1024px gets the mobile layout, which is serviceable but not optimized for a tablet-sized window. Worth a follow-up if usage data shows meaningful tablet traffic.
- **Keyboard shortcuts / command palette.** Desktop affords this (a `⌘K` search launcher would fit naturally next to the sidebar's Search item) but it's a net-new feature, not a layout adaptation — flagged for a separate spec.
- **Resizable/draggable panels**, multi-window support, or any layout persistence beyond what CSS handles automatically.
- **Insights chart interactivity changes** (hover tooltips, zoom) beyond what Recharts already provides — this pass only changes chart container sizing/grid placement.
- **A distinct desktop onboarding flow** beyond centering the existing card — no new steps, no split-screen marketing treatment.
