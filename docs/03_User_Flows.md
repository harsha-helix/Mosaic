
# 03 — User Flows

> Working document. Describes every screen-to-screen journey a user takes in Mosaic MVP.

---

## Platform

- **Type:** Progressive Web App (PWA), installable on Android home screen
- **Target device:** Mobile (Android primary), responsive for desktop
- **Offline:** Service worker caches the app shell; full offline support is a post-MVP concern
- **Storage:** Google Drive (JSON files for structured data, native file storage for photos)

---

## Entry Points

| Entry Point | Where it lands |
|---|---|
| Open PWA (cold) | Home Screen |
| Morning notification tap | Morning Check-in |
| Evening notification tap | Evening Commit |
| + button (any screen) | Moment Capture |
| (future) Android widget | Moment Capture |

---

## 1. Onboarding

Shown only on first launch.

```
Welcome screen
  → "What should Mosaic call you?" [text field]
  → Morning reminder time [default 8:00 AM]
  → Evening reminder time [default 9:00 PM]
  → "Connect Google Drive" [OAuth button]
    → Google OAuth flow
    → Drive folder "Mosaic" created automatically
  → Done → Home Screen
```

Notes:
- No account system. Identity is just a name for personalisation.
- All fields optional except Drive connection (required for persistence).

---

## 2. Home Screen

The default landing screen on every open.

### Layout (top to bottom)

```
┌─────────────────────────────────┐
│  [Quote]                        │  ← random from captured quotes;
│                                 │     fallback to curated list if none yet
├─────────────────────────────────┤
│  7-day averages                 │  ← Sleep · Anxiety · Spark · Mood · Energy
│  [spark icon] 7.2  [zzz] 6.8h  │     shown as icon + number pairs
│  [mood] 6.5  [energy] 7.0      │
├─────────────────────────────────┤
│  Last beautiful thing           │  ← most recent Beautiful Thing or Photo,
│  [image or icon]                │     whichever is newer
│  "saw the sun set behind the    │
│   water tank on the terrace"    │
│  Jun 28                         │
├─────────────────────────────────┤
│  Today                          │
│  ○ Morning  ● 3 moments  ○ Eve  │  ← status dots: ○ pending  ● done
└─────────────────────────────────┘

         [+]  ← floating action button, always visible
```

### Behaviour

- If morning check-in is not done → "Good morning" banner above the quote with a "Start your day" tap target. Dismissable.
- If evening commit is not done and time > 8 PM → "Commit today" banner. Dismissable.
- 7-day averages computed from committed days only (skipped days do not skew the average).

---

## 3. Morning Check-in

### Entry
- Tap "Start your day" banner on Home, or tap morning notification.
- Can be done retroactively at any point before midnight (the commit window closes at midnight).

### Flow

```
Morning Check-in screen
  → Sliders / tap scales (all optional):
      Mood       [1–10]
      Energy     [1–10]
      Anxiety    [1–10]
      Excitement [1–10]
  → Text fields (all optional):
      Today's intention   [single line]
      Today's priority    [single line]
      One thing to notice [single line]
  → [Save] → Home Screen
```

### Notes
- No field is required. Tapping [Save] with nothing filled is valid.
- If already completed today, screen shows filled values with an [Edit] option.
- Editing is allowed until midnight.

---

## 4. Moment Capture

The highest-frequency interaction. Target: under 10 seconds.

### Entry
- Tap [+] from any screen.

### Flow

```
[+] tapped
  → Type picker (full-screen bottom sheet)
      [📷 Photo]      [🌸 Beautiful]   [💡 Idea]
      [🙏 Gratitude]  [😟 Anxiety]     [❤️ Conversation]
      [📚 Reading]    [🎵 Music]       [📖 Quote]
      [🏃 Workout]    [☕ Coffee]       [🌍 Place]
      [✨ Insight]
  → Tap type → Capture screen

Capture screen:
  → [Text field — main content]
  → [📷 Add photo] (optional, available on all types)
  → [Remember toggle] ← marks as highlight; off by default
                         auto-on for: Beautiful Thing, Photo
  → [Save] → dismissed, returns to previous screen
```

### Notes
- Photo type opens camera/gallery first, then offers text field for caption.
- All other types open text field first, with optional photo attachment.
- "Remember" toggle: moments tagged Remember appear in the Highlights timeline.
- Tags are implicit from type; no manual tagging in MVP.
- Location is a future field — not in MVP.

---

## 5. Evening Commit

Closes the day. If you miss it, that day is gone — no retroactive evening commits.

### Entry
- Tap evening notification, or tap "Commit today" banner on Home.
- Available until you submit the next morning's check-in. Closing a new morning permanently locks the previous evening.

### Flow

```
Evening Commit screen

  Section 1 — Metrics (quick taps / number entry, all optional):
      Spark        [1–10 tap scale]   ← overall "how alive did this day feel"
      Mood         [1–10 tap scale]
      Coffee       [0–6+ tap counter]
      Exercise     [yes / no toggle + optional minutes field]
      Reading      [minutes or pages, free entry]
      Deep Work    [hours, free entry]
      Sleep        [skip — entered next morning]

  Section 2 — Reflection (all optional):
      Biggest win          [text]
      Biggest challenge    [text]
      What energised me?   [text]
      What drained me?     [text]
      One sentence journal [text]
      Commit message       [text — short, like a git commit]
      Day title            [text — the name of this day]

  [Remember this day] toggle  ← marks entire commit as highlight

  [Commit] → confirmation animation → Home Screen
```

### Sleep Entry (next morning)

- Morning check-in screen includes a "Last night's sleep" field at the top when previous day's commit exists but sleep is unfilled.
- Entering sleep retroactively updates the previous day's data file.

---

## 6. Timeline (Highlights)

A curated vertical scroll of moments and days worth remembering.

### Entry
- Bottom nav or Home shortcut (TBD).

### Layout

```
Highlights

  [Jun 28]  Beautiful Thing
  "saw the sun set behind the water tank"
  [photo thumbnail]

  [Jun 25]  Day committed
  "the day i finally understood what i was building"
  Spark 9 · Mood 8

  [Jun 20]  Idea
  "what if the home screen opened with a question, not a quote"

  [Jun 14]  Day committed
  "graduated. still doesn't feel real."

  ...
```

### What appears here
- Any Moment with [Remember] toggled on.
- Any Evening Commit with [Remember this day] toggled on.
- Beautiful Thing and Photo moments have Remember on by default.

### Behaviour
- Tapping a Moment shows full detail.
- Tapping a Day Commit opens the Day View for that date.
- No edit from here — view only.

---

## 7. Day View

Full picture of a single day.

### Entry
- Tap a committed day from Timeline.

### Layout

```
Day View — Jun 28 · "the terrace at golden hour"

  Morning
    Mood 7 · Energy 8 · Anxiety 4 · Excitement 9
    Intention: finish the flows doc
    Priority: nothing else matters today
    One thing: notice light

  Moments  (3)
    ☕ Coffee — 9:14 AM
    🌸 Beautiful — 6:42 PM · "the sun behind the water tank" [photo]  ★
    💡 Idea — 9:01 PM · "mosaic as a letter to future me"

  Evening Commit
    Spark 9 · Mood 8 · Sleep — · Coffee 2 · Exercise — · Reading 30m
    Biggest win: actually started building this
    Drain: nothing, today was good
    Journal: "rare day where the doing felt as good as the idea"
    Commit: feat: noticed beauty in a Tuesday
```

★ = Remember-tagged moment

---

## 8. Search

### Entry
- Search icon in nav.

### Flow

```
Search screen
  → Text input (auto-focus)
  → Results update as you type

Results show:
  - Matching moments (type icon + text + date)
  - Matching day commits (title + date)

Filter chips (optional):
  All · Photo · Idea · Gratitude · Beautiful · Quote · ...
```

### Notes
- MVP: full-text search across all text fields.
- Post-MVP: semantic / AI-powered search.

---

## 9. Notifications

| Notification | Time | Tap action |
|---|---|---|
| Morning check-in | 8:00 AM (configurable) | Opens Morning Check-in |
| Evening commit | 9:00 PM (configurable) | Opens Evening Commit |

- Times set during onboarding, adjustable in Settings.
- No smart scheduling in MVP.
- Delivered via browser push notifications (PWA).

---

## 10. Settings

Minimal. Accessed via profile icon or nav.

```
Settings

  Notifications
    Morning reminder  [time picker]  default 8:00 AM
    Evening reminder  [time picker]  default 9:00 PM

  Storage
    Google Drive connection  [connected ✓ / reconnect]
    Drive folder: Mosaic/

  Display name  [text field]

  — future —
  Export data
  Widgets
  Themes
```

---

## Navigation

Bottom navigation bar (4 items):

| Icon | Label | Screen |
|---|---|---|
| 🏠 | Home | Home Screen |
| ✨ | Highlights | Timeline |
| 📊 | Insights | Insights |
| 🔍 | Search | Search |
| ⚙️ | Settings | Settings |

Morning Check-in, Moment Capture, and Evening Commit are accessed via banners, notifications, or [+] — not directly from nav.

---

## Edge Cases

| Situation | Behaviour |
|---|---|
| Open app, morning already done | Home shows no banner; morning values visible in Today strip |
| Open app after midnight, evening not committed | Window stays open — you can commit last night's evening at any point until you submit the next morning's check-in. Once a new morning is started, the previous evening window closes permanently. |
| No internet, Drive unavailable | App opens from cache; writes queued locally; synced when online (post-MVP) |
| No quotes captured yet | Home screen shows a curated fallback quote |
| No beautiful moments yet | Home screen shows placeholder ("nothing yet — go notice something") |
| First 7 days (not enough data) | Averages computed from available days only |

---

## Out of Scope (MVP)

- Branches (long-running life projects)
- Releases (major milestones)
- AI analysis / monthly reports
- Semantic search
- Desktop-specific UI
- Android widget
- Multi-device sync conflict resolution
- Export / backup UI
- Water tracking
