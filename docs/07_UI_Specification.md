
# 07 — UI Specification

> Screen-by-screen visual and interaction specification for Mosaic MVP.
> Aesthetic direction: **warm & tactile**. Not a productivity app. Not a wellness tracker. A personal repository that feels like a well-worn paper notebook, not a candy dispenser.

> **Revision note (2026-07-01):** the original direction was "lively, vibrant, fun, goofy" with a 14-color neon palette and emoji icons (see git history for the prior version of this section). After living with the built app, that direction read as chaotic rather than alive. This revision replaces the design tokens below — typography, color, radius, shadow, icon system — with a warm/tactile direction: cream paper surfaces, a serif for personality, a tightened 5-accent palette, bespoke flat icons instead of emoji, and softer tactile buttons. Screen-by-screen wireframes further down in this doc still describe *layout and content*, which hasn't changed — read their color/icon call-outs against the new tokens below, not literally. Wireframes will be refreshed screen-by-screen as each is prototyped.

---

## Design Tokens

### Typography

| Role | Font | Weight | Size |
|---|---|---|---|
| Display (day title, quote card, big numbers) | Fraunces | 600 | 28–44px |
| Heading | Fraunces | 600 | 20–24px |
| Subheading | Karla | 500 | 16–18px |
| Body | Karla | 400 | 15px |
| Caption / label | Karla | 400 | 12–13px |
| Commit message | `monospace` (system) | 400 | 13px |

Fraunces carries the personality (headings, day titles, the quote card, moment/commit copy that should feel written rather than typed). Karla stays the workhorse UI font — form labels, buttons, body text. Both fonts: Google Fonts (free). Import via `@fontsource`. Replaces the previous Space Grotesk + Inter pairing.

### Color Palette

#### Base — cream / parchment

Warmth lives in the whole canvas now, not just the accents. Light mode is a paper cream, not a stark off-white; dark mode is a warm espresso brown, not near-black.

| Token | Light | Dark | Used for |
|---|---|---|---|
| `bg-base` | `#FAF3E7` | `#1E1812` | Page background |
| `bg-surface` | `#FFFBF3` | `#2A231C` | Cards, sheets |
| `bg-elevated` | `#F4EAD9` | `#332B21` | Raised/hover surfaces |
| `text-primary` | `#2B2420` | `#F3EAD9` | Primary text |
| `text-secondary` | `#6B5F52` | `#B3A390` | Supporting text |
| `text-tertiary` | `#9A8E7E` | `#7A6D5C` | Hints, placeholders, inactive nav |
| `border` | `#E5D9C6` | `#3A2F24` | Hairlines, dividers |

#### Brand accent

| Name | Hex | Used for |
|---|---|---|
| Terracotta | `#C1633D` | Primary brand — FAB, active nav, primary buttons (Save, Commit), Spark metric. Doubles as the Creative spark cluster color below, same pattern as violet doing double duty in the old palette. |

#### Accent clusters (replaces the 14-color moment-type map)

14 per-type colors read as a rainbow rather than a system. Instead, moment types are grouped into 5 clusters by feeling — fewer, more deliberate hues, each covering 1–4 related types.

| Cluster | Hex | Moment types | Also used for |
|---|---|---|---|
| Reflective | `#5B7B7A` (dusty teal) | reading, music, quote, insight | Excitement metric |
| Warmth | `#C9A24B` (honey gold) | beautiful, gratitude, place | Mood metric |
| Creative spark | `#C1633D` (terracotta) | idea, photo, conversation | Brand accent, Spark metric |
| Body / routine | `#7A8B5C` (sage) | workout, coffee, nicotine | Energy metric |
| Anxiety | `#8B6B7D` (muted mauve) | anxiety (kept alone — too emotionally distinct to blend into a cluster) | Anxiety metric |

Anxiety the moment type and Anxiety the morning/evening metric intentionally share a hex — reinforces that they're the same signal shown two ways.

### Spacing

Base unit: 4px. Use multiples: 4, 8, 12, 16, 20, 24, 32, 40, 48. (Unchanged.)

### Border Radius

| Component | Radius |
|---|---|
| Card | 16px |
| Button (primary) | 14px (rounded rect, not a pill — see Buttons below) |
| Button (secondary) | 12px |
| Input field | 12px |
| Bottom sheet | 24px top corners |
| Metric circle | 50% |
| FAB | 50% |
| Avatar / icon chip | 50% |

### Buttons

Moved off the flat pill shape — soft & tactile now: a rounded rect with a matte fill and a subtle inset shadow along the bottom edge, so it reads as pressable rather than a flat color block.

```
Primary:   background <accent>, radius 14px, text on-accent (see contrast rule below),
           box-shadow: inset 0 -2px 0 rgba(43,36,32,0.15), 0 1px 3px rgba(43,36,32,0.12)
           active state: shadow flattens (inset offset → -1px), scale 0.98
Secondary: transparent fill, 1.5px border in text-secondary, radius 12px,
           fills with bg-elevated on press
```

Text-on-accent: use the darkest reasonable shade of the accent's own family (matching each cluster's tint pairing), not pure white or pure black — keeps buttons feeling like part of the paper palette rather than a sticker on top of it.

### Elevation / Shadow

Light mode: `0 2px 12px rgba(43,36,32,0.08)`
Dark mode: `0 2px 12px rgba(0,0,0,0.4)`

FAB: `0 4px 20px rgba(193,99,61,0.35)` (terracotta glow, replaces the violet glow)

### Icons

Emoji (nav bar, moment type picker, type chips) are replaced by a bespoke flat-geometric icon set: solid single-color shapes, no outline, one icon per moment type plus the 5 nav icons. Each moment-type icon is colored by its accent cluster (see above), not individually per type — reinforces the cluster grouping visually, not just semantically. Nav icons use `text-tertiary` inactive / brand terracotta active, same pattern as today just without emoji.

### Motion

Motion vocabulary is unchanged — bounce, wiggle, and the commit ceremony's confetti all stay, restyled onto the new palette rather than removed. The instinct going into this revision was that "warm & tactile" might mean quieter motion, but the decision was to keep the celebratory beats and just re-skin them: confetti particles should draw from the new accent-cluster hexes (teal / gold / terracotta / sage / mauve) instead of the old neon hero colors.

| Interaction | Animation |
|---|---|
| Screen transition | Slide up (300ms, ease-out) |
| Bottom sheet open | Slide up (250ms, spring) |
| Bottom sheet dismiss | Slide down (200ms, ease-in) |
| Metric circle select | Scale bounce (150ms) |
| Remember toggle | Wiggle + color pop (200ms) |
| FAB tap | Scale down 0.9 → release (120ms) |
| Evening commit | See commit ceremony below — confetti recolored to the new accent clusters |

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
| Mood | Warmth gold `#C9A24B` |
| Energy | Sage `#7A8B5C` |
| Anxiety | Mauve `#8B6B7D` |
| Excitement | Reflective teal `#5B7B7A` |
| Spark | Terracotta `#C1633D` (brand) |

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
- Color: Terracotta `#C1633D` (brand)
- Icon: `+` in on-accent color (dark terracotta text tone, not pure white — see Buttons), 24px
- Shadow: terracotta glow
- On tap: scale bounce + opens Moment Capture sheet

### BottomNav

```
┌──────────────────────────────────────┐
│  [home] [highlights] [insights] [search] [settings]  │
│  Home    Highlights   Insights  Search  Settings      │
└──────────────────────────────────────┘
```

Icons are the bespoke flat-geometric set (see Icons above), not emoji.

- Height: 64px + safe area inset
- Active tab: icon in Terracotta, label in Terracotta, bold
- Inactive: `text-tertiary`
- Background: `bg-surface` with top border
- FAB sits above, does not live in nav

### RememberToggle

- Off state: outlined star, `text-tertiary`
- On state: filled star, `#C9A24B` (warmth gold, was yellow), slight scale bounce on toggle
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
│  "Made of the moments        │
│   you'd otherwise forget."   │  ← tagline, Display font
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
│  │  Connect Google Drive  │  │  ← Terracotta rounded-rect button
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
│ │  remember every day.   │   │     Fraunces, italic body
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
│  │                        │  │     Warmth gold left border
│  │ saw the sun set behind │  │
│  │ the water tank         │  │
│  │                   Jun 28│ │
│  └────────────────────────┘  │
│                              │
│  Today                       │
│  ○ Morning · 3 moments · ○   │  ← status strip
│                              │
│ ┌──────────────────────────┐ │  ← conditional banner (if morning not done)
│ │ Start your morning →     │ │     Terracotta background, white text
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

**Today status strip:**
- `○ Morning` slot shows the Day Glyph (see Morning Check-in) once morning is saved, instead of a plain dot
- Middle slot shows the mosaic tile row (see Moment Capture) instead of a "N moments" count — empty strip if nothing captured yet
- `○ Evening` slot fills once Evening Commit is done

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
│  ○ ○ ○ ○ ○ ○ ○ ○ ○ ○        │  ← MetricCircles (Warmth gold)
│  1           5          10   │
│                              │
│  Energy                      │
│  ○ ○ ○ ○ ○ ○ ○ ○ ○ ○        │  ← MetricCircles (Sage)
│                              │
│  Anxiety                     │
│  ○ ○ ○ ○ ○ ○ ○ ○ ○ ○        │  ← MetricCircles (Mauve)
│                              │
│  Excitement                  │
│  ○ ○ ○ ○ ○ ○ ○ ○ ○ ○        │  ← MetricCircles (Reflective teal)
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
│  │      Save morning    │    │  ← Terracotta rounded-rect button
│  └──────────────────────┘    │
│                              │
└──────────────────────────────┘
```

- All fields optional; "Save morning" always active
- Keyboard: "next" moves between text fields
- Back arrow → Home (no confirmation needed; partially filled state is saved as draft)

**Instant visual — Day Glyph**

On tap "Save morning," before transitioning to Home, a small radial glyph renders in place of the button:

```
        Mood
         ●
  Excite ╱ ╲ Energy
        ╱   ╲
       ●─────●
        ╲   ╱
         ╲ ╱
          ●
       Anxiety
```

- 4-axis shape (diamond/radar), one axis per morning metric: Mood (Warmth gold), Energy (Sage), Anxiety (Mauve), Excitement (Reflective teal)
- Axis length = value / 10; unfilled metrics collapse that axis to center (glyph adapts to partial input)
- Pop-in animation (200ms, scale bounce), holds ~600ms, then shrinks into the Today status strip on Home as a small persistent icon
- If no metrics were filled, the glyph is skipped — button simply confirms and navigates
- The same glyph shape is reused wherever this day is referenced elsewhere in the app (Today status strip, Day View header, Highlights day-commit cards) — it becomes the day's visual signature, independent of whether Evening Commit happens

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
│  │        Save          │    │  ← type-colored rounded-rect button
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

**Instant visual — Mosaic tile**

On [Save], in parallel with the spring-dismiss (no added delay — must not compromise the <10s capture target):

- A small square tile in the type's color animates from the Save button toward the bottom of the screen and lands in the **Today mosaic strip** on Home
- The Today mosaic strip replaces the plain "3 moments" count in the status area: instead of a number, it renders the actual tiles (one per moment captured today, left to right, in capture order), each colored by type
- Tile drop: ~150ms travel + 100ms settle bounce — total added time is not perceptible against the capture flow
- Tile count is uncapped for MVP; strip wraps or scrolls horizontally past ~12 tiles
- This is the seed of the lifetime mosaic grid (see Parking Lot: "Animated commit graph") — the Today strip is a one-day slice of what that fuller view will eventually show

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
│  ○ ○ ○ ○ ○ ○ ○ ○ ○ ○        │  ← MetricCircles (Terracotta)
│                              │
│  Mood                        │
│  ○ ○ ○ ○ ○ ○ ○ ○ ○ ○        │  ← MetricCircles (Warmth gold)
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
│  │    Commit ✦          │    │  ← Terracotta rounded-rect button, large
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
│  │  🔥 12 day streak      │  │  ← summary card, Terracotta bg
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
│  [line chart, Terracotta]        │
│                              │
│  Sleep                       │
│  [line chart, Reflective teal] │
│                              │
│  Mood & Energy               │
│  [dual line, Warmth gold + Sage] │
│                              │
│  Anxiety                     │
│  [line chart, Mauve]        │
│                              │
│  Moments per day             │
│  [bar chart, multi-color]    │  ← each bar colored by most-used type
│                              │
└──────────────────────────────┘
```

- Charts: Recharts, styled to match token system
- Summary card: Terracotta background, white text
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
- Results highlight matched text in Terracotta

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
