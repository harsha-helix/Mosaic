
# 07 — UI Specification

> Screen-by-screen visual and interaction specification for Mosaic MVP.
> Aesthetic direction: **lively, vibrant, fun, goofy**. Not a productivity app. Not a wellness tracker. A personal repository that feels alive.

---

## Design Tokens

### Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Display (day title, big numbers) | Space Grotesk | 700 | 32–48px |
| Heading | Space Grotesk | 600 | 20–24px |
| Subheading | Space Grotesk | 500 | 16–18px |
| Body | Inter | 400 | 15px |
| Caption / label | Inter | 400 | 12–13px |
| Commit message | `monospace` (system) | 400 | 13px |

Both fonts: Google Fonts (free). Import via `@fontsource`.

### Color Palette

#### Hero colors (both modes)

| Name | Hex | Used for |
|---|---|---|
| Violet | `#7C4DFF` | Primary brand, FAB, active nav |
| Coral | `#FF6B6B` | Spark, high-energy states |
| Yellow | `#FFD93D` | Beautiful things, joy |
| Green | `#6BCB77` | Gratitude, positive |
| Blue | `#4D96FF` | Photos, explore |
| Pink | `#EC4899` | Music |
| Orange | `#F97316` | Conversations |
| Cyan | `#06B6D4` | Reading |
| Lime | `#84CC16` | Quotes |
| Red | `#EF4444` | Workout |
| Amber | `#F59E0B` | Insight, Nicotine |
| Indigo | `#6366F1` | Coffee |
| Emerald | `#10B981` | Place |
| Purple | `#A855F7` | Anxiety |

#### Neutrals

| Token | Light | Dark |
|---|---|---|
| `bg-base` | `#FAFAF8` | `#141414` |
| `bg-surface` | `#FFFFFF` | `#1E1E1E` |
| `bg-elevated` | `#F4F4F2` | `#2A2A2A` |
| `text-primary` | `#111111` | `#F0F0F0` |
| `text-secondary` | `#666666` | `#999999` |
| `text-tertiary` | `#AAAAAA` | `#555555` |
| `border` | `#E8E8E8` | `#2E2E2E` |

#### Moment type → color map

Each moment type renders with its own color. Consistent across the entire app.

```
photo        → Blue    #4D96FF
beautiful    → Yellow  #FFD93D
idea         → Coral   #FF6B6B
gratitude    → Green   #6BCB77
anxiety      → Purple  #A855F7
conversation → Orange  #F97316
reading      → Cyan    #06B6D4
music        → Pink    #EC4899
quote        → Lime    #84CC16
workout      → Red     #EF4444
coffee       → Indigo  #6366F1
nicotine     → Amber   #F59E0B
place        → Emerald #10B981
insight      → Amber   #F59E0B
```

### Spacing

Base unit: 4px. Use multiples: 4, 8, 12, 16, 20, 24, 32, 40, 48.

### Border Radius

| Component | Radius |
|---|---|
| Card | 16px |
| Button (primary) | 999px (pill) |
| Button (secondary) | 12px |
| Input field | 12px |
| Bottom sheet | 24px top corners |
| Metric circle | 50% |
| FAB | 50% |
| Avatar / icon chip | 50% |

### Elevation / Shadow

Light mode: `0 2px 12px rgba(0,0,0,0.06)`
Dark mode: `0 2px 12px rgba(0,0,0,0.4)`

FAB: `0 4px 20px rgba(124,77,255,0.4)` (violet glow)

### Motion

| Interaction | Animation |
|---|---|
| Screen transition | Slide up (300ms, ease-out) |
| Bottom sheet open | Slide up (250ms, spring) |
| Bottom sheet dismiss | Slide down (200ms, ease-in) |
| Metric circle select | Scale bounce (150ms) |
| Remember toggle | Wiggle + color pop (200ms) |
| FAB tap | Scale down 0.9 → release (120ms) |
| Evening commit | See commit ceremony below |

---

## Core Components

### MetricCircles

A row of 10 tappable circles for 1–10 inputs.

```
○ ○ ○ ○ ○ ● ● ● ○ ○
1 2 3 4 5 6 7 8 9 10
```

- Unselected: `bg-elevated`, `border`
- Selected: filled with the relevant color (each metric has its own color)
- Tapping a number selects 1 through N (tap 7 → 1–7 filled)
- Tap the same number again to deselect (clear)
- Size: 28px circles, 6px gap

Metric color assignments:

| Metric | Color |
|---|---|
| Mood | Coral `#FF6B6B` |
| Energy | Yellow `#FFD93D` |
| Anxiety | Purple `#A855F7` |
| Excitement | Green `#6BCB77` |
| Spark | Violet `#7C4DFF` |

### MomentCard

```
┌────────────────────────────────┐
│ [●] Beautiful  Jun 28 · 6:42PM │  ← colored dot + type label + timestamp
│                                │
│ saw the sun set behind the     │
│ water tank on the terrace      │
│                                │
│ [photo thumbnail]              │  ← if has photo
│                                 │
│                         [★]    │  ← remember indicator (gold star, visible when true)
└────────────────────────────────┘
```

- Border-left: 3px solid in type color
- Background: `bg-surface`
- Card shadow on elevated surfaces

### FAB (Floating Action Button)

- Position: fixed, bottom-right, 24px from edge, 80px from bottom (above nav)
- Size: 56px circle
- Color: Violet `#7C4DFF`
- Icon: `+` in white, 24px
- Shadow: violet glow
- On tap: scale bounce + opens Moment Capture sheet

### BottomNav

```
┌──────────────────────────────────────┐
│  🏠       ✨       📊       🔍    ⚙️  │
│ Home  Highlights Insights Search Settings│
└──────────────────────────────────────┘
```

- Height: 64px + safe area inset
- Active tab: icon in Violet, label in Violet, bold
- Inactive: `text-tertiary`
- Background: `bg-surface` with top border
- FAB sits above, does not live in nav

### RememberToggle

- Off state: outlined star, `text-tertiary`
- On state: filled star, `#FFD93D` (yellow), slight scale bounce on toggle
- Label: "Remember" in caption style
- Used in Moment Capture and Evening Commit

---

## Screens

---

### 1. Onboarding

Single scrollable page. Shown once.

```
┌──────────────────────────────┐
│                              │
│    ✦ Mosaic                  │  ← brand mark, large
│                              │
│  "Version control            │
│   for a life well lived."    │  ← tagline, Display font
│                              │
│  ──────────────────────      │
│                              │
│  What should we call you?    │
│  ┌────────────────────────┐  │
│  │ Your name              │  │
│  └────────────────────────┘  │
│                              │
│  Morning reminder            │
│  ┌──────┐                    │
│  │ 8:00 │ AM                 │
│  └──────┘                    │
│                              │
│  Evening reminder            │
│  ┌──────┐                    │
│  │ 9:00 │ PM                 │
│  └──────┘                    │
│                              │
│  ┌────────────────────────┐  │
│  │  Connect Google Drive  │  │  ← Violet pill button
│  └────────────────────────┘  │
│                              │
│  Your data lives in your     │
│  Drive. Only you can see it. │  ← caption, reassuring
│                              │
└──────────────────────────────┘
```

- After Drive auth succeeds → brief success state → navigate to Home
- Error state: inline error below button, retry option

---

### 2. Home

```
┌──────────────────────────────┐
│  Good morning, Harsha  ☀️    │  ← greeting, changes by time of day
│                              │
│ ┌────────────────────────┐   │
│ │                        │   │
│ │  "The goal is not to   │   │  ← Quote card, bg-surface
│ │  remember every day.   │   │     Space Grotesk, italic body
│ │  The goal is to notice │   │
│ │  every day."           │   │
│ │                        │   │
│ └────────────────────────┘   │
│                              │
│  Last 7 days                 │  ← section label
│  ┌──────────────────────┐    │
│  │ ✦7.2  😴6.8h  😟4.1 │    │  ← Spark·Sleep·Anxiety
│  │ 😊6.5  ⚡7.0         │    │     Mood·Energy
│  └──────────────────────┘    │
│                              │
│  ┌────────────────────────┐  │
│  │ [photo or icon]        │  │  ← Last beautiful thing card
│  │                        │  │     Yellow left border
│  │ saw the sun set behind │  │
│  │ the water tank         │  │
│  │                   Jun 28│ │
│  └────────────────────────┘  │
│                              │
│  Today                       │
│  ○ Morning · 3 moments · ○   │  ← status strip
│                              │
│ ┌──────────────────────────┐ │  ← conditional banner (if morning not done)
│ │ Start your morning →     │ │     Violet background, white text
│ └──────────────────────────┘ │
│                              │
└──────────────────────────────┘
                          [+]   ← FAB, bottom-right
```

**Greeting variants by time:**
- Before noon: "Good morning" ☀️
- Noon–5pm: "Hey," ✌️
- 5pm–9:30pm: "Good evening" 🌆
- After 9:30pm: "Still going?" 🌙

**Conditional banners:**
- Morning not done (any time before midnight): violet banner "Start your morning →"
- Evening not done + time > 8pm: dark banner "Commit today before you sleep →"
- Both banners are dismissable; they return next time the app is opened

---

### 3. Morning Check-in

Full-screen flow. Not a bottom sheet — deserves full attention.

```
┌──────────────────────────────┐
│ ←   Morning                  │
│     Jun 28                   │
│                              │
│  [Sleep from last night]     │  ← only shown if prev evening committed,
│  How long did you sleep?     │     sleep not yet filled
│  ┌──────────────────────┐    │
│  │  7.5   hours         │    │  ← number input
│  └──────────────────────┘    │
│  ─────────────────────────   │
│                              │
│  Mood                        │
│  ○ ○ ○ ○ ○ ○ ○ ○ ○ ○        │  ← MetricCircles (Coral)
│  1           5          10   │
│                              │
│  Energy                      │
│  ○ ○ ○ ○ ○ ○ ○ ○ ○ ○        │  ← MetricCircles (Yellow)
│                              │
│  Anxiety                     │
│  ○ ○ ○ ○ ○ ○ ○ ○ ○ ○        │  ← MetricCircles (Purple)
│                              │
│  Excitement                  │
│  ○ ○ ○ ○ ○ ○ ○ ○ ○ ○        │  ← MetricCircles (Green)
│                              │
│  Today's intention           │
│  ┌──────────────────────┐    │
│  │                      │    │
│  └──────────────────────┘    │
│                              │
│  Today's priority            │
│  ┌──────────────────────┐    │
│  │                      │    │
│  └──────────────────────┘    │
│                              │
│  One thing to notice today   │
│  ┌──────────────────────┐    │
│  │                      │    │
│  └──────────────────────┘    │
│                              │
│  ┌──────────────────────┐    │
│  │      Save morning    │    │  ← Violet pill button
│  └──────────────────────┘    │
│                              │
└──────────────────────────────┘
```

- All fields optional; "Save morning" always active
- Keyboard: "next" moves between text fields
- Back arrow → Home (no confirmation needed; partially filled state is saved as draft)

---

### 4. Moment Capture

Two-step overlay from any screen.

**Step 1 — Type Picker (bottom sheet, full height)**

```
┌──────────────────────────────┐
│  ▬  (drag handle)            │
│                              │
│  What's happening?           │  ← heading
│                              │
│  ┌──────┐ ┌──────┐ ┌──────┐ │
│  │  📷  │ │  🌸  │ │  💡  │ │
│  │Photo │ │Beaut.│ │ Idea │ │
│  └──────┘ └──────┘ └──────┘ │
│  ┌──────┐ ┌──────┐ ┌──────┐ │
│  │  🙏  │ │  😟  │ │  ❤️  │ │
│  │Grat. │ │Anxi. │ │Conv. │ │
│  └──────┘ └──────┘ └──────┘ │
│  ┌──────┐ ┌──────┐ ┌──────┐ │
│  │  📚  │ │  🎵  │ │  📖  │ │
│  │Read. │ │Music │ │Quote │ │
│  └──────┘ └──────┘ └──────┘ │
│  ┌──────┐ ┌──────┐ ┌──────┐ │
│  │  🏃  │ │  ☕  │ │  🚬  │ │
│  │Work. │ │Coffe.│ │Nicoт.│ │
│  └──────┘ └──────┘ └──────┘ │
│  ┌──────┐ ┌──────┐           │
│  │  🌍  │ │  ✨  │           │
│  │Place │ │Insig.│           │
│  └──────┘ └──────┘           │
└──────────────────────────────┘
```

- Each tile: type color background (10% opacity), type color icon
- 3-column grid
- Tap → slide up to Step 2

**Step 2 — Capture Screen**

```
┌──────────────────────────────┐
│ ←  [● Beautiful]             │  ← type chip, yellow
│                              │
│  ┌──────────────────────┐    │
│  │                      │    │
│  │  What did you see?   │    │  ← placeholder varies by type
│  │                      │    │
│  │                      │    │
│  └──────────────────────┘    │
│                              │
│  [📷 Add photo]              │  ← ghost button, always available
│                              │
│  ─────────────────────────   │
│                              │
│  [★ Remember]  OFF → ON      │  ← RememberToggle
│                              │
│  ┌──────────────────────┐    │
│  │        Save          │    │  ← type-colored pill button
│  └──────────────────────┘    │
└──────────────────────────────┘
```

**Text field placeholders by type:**

| Type | Placeholder |
|---|---|
| beautiful | "What did you notice?" |
| idea | "What's the idea?" |
| gratitude | "What are you grateful for?" |
| anxiety | "What's on your mind?" |
| conversation | "Who did you talk to? What stuck?" |
| reading | "What are you reading?" |
| music | "What are you listening to?" |
| quote | "What did you read?" |
| workout | "What did you do?" |
| coffee | "First cup? Treat?" |
| nicotine | "Cigarette, gum, or patch?" |
| place | "Where are you?" |
| insight | "What did you just realise?" |
| photo | "What's in this photo?" (optional) |

- Photo type: camera/gallery opens first, then text field for caption
- Save → sheet dismisses with a satisfying spring animation
- Remember auto-on for `beautiful` and `photo`

---

### 5. Evening Commit

Full-screen flow. Should feel like a ritual.

```
┌──────────────────────────────┐
│ ←   Commit the day           │
│     Jun 28 · Tuesday         │
│                              │
│  How was the day, overall?   │
│                              │
│  Spark                       │
│  ○ ○ ○ ○ ○ ○ ○ ○ ○ ○        │  ← MetricCircles (Violet)
│                              │
│  Mood                        │
│  ○ ○ ○ ○ ○ ○ ○ ○ ○ ○        │  ← MetricCircles (Coral)
│                              │
│  ─────────────────────────   │
│                              │
│  The numbers                 │
│                              │
│  Exercise                    │
│  [Yes] [No]     [__ mins]    │  ← toggle pair + optional text input
│                              │
│  Reading                     │
│  ┌────────────┐              │
│  │ __ minutes │              │
│  └────────────┘              │
│                              │
│  Deep Work                   │
│  ┌────────────┐              │
│  │ __ hours   │              │
│  └────────────┘              │
│                              │
│  ─────────────────────────   │
│                              │
│  Reflect                     │
│                              │
│  Biggest win                 │
│  ┌──────────────────────┐    │
│  │                      │    │
│  └──────────────────────┘    │
│                              │
│  Biggest challenge           │
│  ┌──────────────────────┐    │
│  │                      │    │
│  └──────────────────────┘    │
│                              │
│  What energised you?         │
│  ┌──────────────────────┐    │
│  │                      │    │
│  └──────────────────────┘    │
│                              │
│  What drained you?           │
│  ┌──────────────────────┐    │
│  │                      │    │
│  └──────────────────────┘    │
│                              │
│  One sentence                │
│  ┌──────────────────────┐    │
│  │                      │    │
│  └──────────────────────┘    │
│                              │
│  ─────────────────────────   │
│                              │
│  Name this day               │
│  ┌──────────────────────┐    │
│  │ Day title            │    │
│  └──────────────────────┘    │
│                              │
│  Commit message              │
│  ┌──────────────────────┐    │
│  │ feat: ...            │    │  ← monospace font
│  └──────────────────────┘    │
│                              │
│  [★ Remember this day]       │
│                              │
│  ┌──────────────────────┐    │
│  │    Commit ✦          │    │  ← Violet pill, large
│  └──────────────────────┘    │
└──────────────────────────────┘
```

**Commit Ceremony Animation**

On tapping "Commit":

1. Button pulses → screen fades to `#141414` (dark)
2. Commit message types out in monospace, green text, terminal-style:
   ```
   > committing Jun 28...
   > feat: noticed beauty in a Tuesday
   > ✓ day committed
   ```
3. After 1.5s → confetti burst in the hero colors (brief, joyful)
4. Screen transitions to Home with a slide-down (day is done)

If no commit message was written, step 2 shows a generic line:
```
> committing Jun 28...
> ✓ day committed
```

---

### 6. Highlights

```
┌──────────────────────────────┐
│  Highlights                  │  ← heading
│                              │
│  [Jun 28]                    │  ← date label, `text-tertiary`, small
│  ┌────────────────────────┐  │
│  │ [●] Beautiful          │  │  ← MomentCard, yellow border
│  │ saw the sun set behind │  │
│  │ the water tank         │  │
│  │ [photo]                │  │
│  └────────────────────────┘  │
│                              │
│  [Jun 28]                    │
│  ┌────────────────────────┐  │
│  │ ✦ Day committed        │  │  ← Day commit card, violet border
│  │ "the terrace at golden │  │
│  │  hour"                 │  │
│  │ Spark 9 · Mood 8       │  │
│  └────────────────────────┘  │
│                              │
│  [Jun 20]                    │
│  ┌────────────────────────┐  │
│  │ [●] Idea               │  │  ← coral border
│  │ what if mosaic is a    │  │
│  │ letter to future me    │  │
│  └────────────────────────┘  │
│                              │
└──────────────────────────────┘
```

- Newest first
- Grouped by date when multiple on the same day
- Tap a Moment card → full-screen moment detail (text, photo, timestamp)
- Tap a Day commit card → Day View
- Empty state: illustration + "Nothing remembered yet — tap ★ on any moment to keep it here"

---

### 7. Day View

```
┌──────────────────────────────┐
│ ←   Jun 28 · Tuesday         │
│     "the terrace at golden   │
│      hour"                   │  ← day title, Display font
│                              │
│  ── Morning ─────────────    │
│  😊7  ⚡8  😟4  🌟9          │  ← metric chips, colored
│  Intention: finish the doc   │
│  Priority: nothing else      │
│  Notice: light               │
│                              │
│  ── Moments (3) ──────────   │
│                              │
│  [●] Coffee  9:14 AM         │  ← MomentCard compact
│  first cup, slow morning     │
│                              │
│  [●] Beautiful  6:42 PM  ★   │
│  saw the sun set...  [photo] │
│                              │
│  [●] Idea  9:01 PM           │
│  what if mosaic is a letter  │
│                              │
│  ── Evening ──────────────   │
│  ✦9  😊8  🏃40m  📚30m  💻3.5h│
│                              │
│  Biggest win                 │
│  actually started building   │
│                              │
│  Journal                     │
│  rare day where the doing    │
│  felt as good as the idea    │
│                              │
│  > feat: noticed beauty      │  ← monospace, dimmed
│    in a Tuesday              │
│                              │
└──────────────────────────────┘
```

- Read-only
- Metric chips: small pill with icon + value, colored per metric
- Commit message in monospace at bottom

---

### 8. Insights

```
┌──────────────────────────────┐
│  Insights                    │
│                              │
│  ┌────────────────────────┐  │
│  │  🔥 12 day streak      │  │  ← summary card, Violet bg
│  │  18 days this month    │  │
│  │                        │  │
│  │  Avg this month        │  │
│  │  Spark 7.8 · Sleep 7.1h│  │
│  │  Mood 7.2 · Energy 7.6 │  │
│  │  Anxiety 3.8           │  │
│  └────────────────────────┘  │
│                              │
│  [  7d  ] [ 30d ] [ 90d ]    │  ← segmented control
│                              │
│  Spark                       │
│  [line chart, Violet]        │
│                              │
│  Sleep                       │
│  [line chart, Blue]          │
│                              │
│  Mood & Energy               │
│  [dual line, Coral + Yellow] │
│                              │
│  Anxiety                     │
│  [line chart, Purple]        │
│                              │
│  Moments per day             │
│  [bar chart, multi-color]    │  ← each bar colored by most-used type
│                              │
└──────────────────────────────┘
```

- Charts: Recharts, styled to match token system
- Summary card: Violet background, white text
- Empty state (< 3 days of data): "Come back after a few days — your patterns will show up here"
- Streak resets to 0 if an evening commit is missed

---

### 9. Search

```
┌──────────────────────────────┐
│  ┌──────────────────────┐    │
│  │ 🔍 Search memories   │    │  ← auto-focused on open
│  └──────────────────────┘    │
│                              │
│  [All] [📷] [🌸] [💡] [🙏]  │  ← filter chips, scrollable
│                              │
│  ── Results ──────────────   │
│                              │
│  [●] Beautiful · Jun 28      │
│  saw the sun set behind the  │
│  water tank...               │
│                              │
│  [●] Idea · Jun 20           │
│  what if mosaic is a letter  │
│  to future me                │
│                              │
└──────────────────────────────┘
```

- Empty search state: recent moments (last 5), labeled "Recent"
- No results: "Nothing found — try different words"
- Results highlight matched text in Violet

---

### 10. Settings

```
┌──────────────────────────────┐
│  Settings                    │
│                              │
│  Notifications               │
│  ─────────────────────────   │
│  Morning reminder   [08:00]  │
│  Evening reminder   [21:00]  │
│                              │
│  Storage                     │
│  ─────────────────────────   │
│  Google Drive   ✓ Connected  │
│                 [Reconnect]  │
│                              │
│  Your name                   │
│  ─────────────────────────   │
│  ┌──────────────────────┐    │
│  │ Harsha               │    │
│  └──────────────────────┘    │
│                              │
│                              │
│  ─────────────────────────   │
│  Mosaic v1.0                 │
│  Made for one.               │  ← subtle footer
│                              │
└──────────────────────────────┘
```

---

## Empty States

| Screen | Empty state text |
|---|---|
| Home — no quotes | "Nothing quoted yet — capture your first quote with +" |
| Home — no beautiful moments | "Nothing noticed yet — go find something beautiful" |
| Highlights | "Nothing remembered yet — tap ★ on any moment to keep it here" |
| Search — no results | "Nothing found — try different words" |
| Insights — < 3 days | "Come back after a few days — your patterns will show up here" |
| Day View — no moments | "A quiet day. Nothing captured." |

---

## Dark Mode

All tokens defined in pairs (light / dark). Switching is handled by Tailwind's `dark:` variant + `prefers-color-scheme` media query. User can override via a toggle in Settings (post-MVP; system default for MVP).

Hero colors stay the same across light and dark — they're vibrant enough to read on both `#FAFAF8` and `#141414`.

---

## Out of Scope (MVP)

- Custom themes or accent color picker
- Animations beyond what is specified (parallax, complex transitions)
- Desktop-specific layout breakpoints
- Tablet layout
- Accessibility audit (post-MVP)
