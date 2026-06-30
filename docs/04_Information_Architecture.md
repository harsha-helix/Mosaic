
# 04 — Information Architecture

> Defines the full screen inventory, navigation structure, content hierarchy, and data flows for Mosaic MVP.

---

## Screen Inventory

| # | Screen | Type | Access |
|---|---|---|---|
| 1 | Onboarding | One-time flow | First launch only |
| 2 | Home | Persistent | Bottom nav |
| 3 | Morning Check-in | Daily flow | Banner · Notification |
| 4 | Moment Capture | Overlay | [+] FAB from any screen |
| 5 | Evening Commit | Daily flow | Banner · Notification |
| 6 | Highlights | Persistent | Bottom nav |
| 7 | Day View | Detail | Tap from Highlights |
| 8 | Insights | Persistent | Bottom nav |
| 9 | Search | Persistent | Bottom nav |
| 10 | Settings | Persistent | Bottom nav |

---

## Navigation Structure

### Bottom Navigation Bar

```
[ Home ]  [ Highlights ]  [ Insights ]  [ Search ]  [ Settings ]
```

Five items. Always visible except during Onboarding and full-screen flows (Morning, Evening Commit).

### Contextual Access (not in nav)

```
Morning Check-in   ← Home banner / morning notification
Evening Commit     ← Home banner / evening notification
Moment Capture     ← [+] FAB, always visible over bottom nav
Day View           ← tap any committed day in Highlights
```

### Full Navigation Map

```
                        ┌─────────────────────────────┐
                        │         ONBOARDING          │
                        │  Welcome → Drive → Done     │
                        └──────────────┬──────────────┘
                                       │ (first launch only)
                                       ▼
┌──────────────────────────────────────────────────────────────────┐
│                         BOTTOM NAV                               │
│                                                                  │
│   Home    Highlights    Insights    Search    Settings           │
└──┬─────────────┬───────────────┬──────────────┬──────────────┬──┘
   │             │               │              │              │
   ▼             ▼               ▼              ▼              ▼
 Home        Highlights       Insights       Search        Settings
   │             │
   │             └──► Day View
   │
   ├──► Morning Check-in   (banner / notification)
   ├──► Evening Commit      (banner / notification)
   └──► Moment Capture      ([+] FAB — available from ALL screens)
```

---

## Content Hierarchy

### 1. Onboarding

```
Onboarding
├── Display name field
├── Morning notification time (default 8:00 AM)
├── Evening notification time (default 9:00 PM)
└── Google Drive OAuth connection
```

### 2. Home

```
Home
├── Quote                        ← random from captured quotes; fallback to curated
├── 7-day averages               ← Sleep · Mood · Energy · Anxiety · Spark
├── Last beautiful thing         ← most recent Beautiful Thing or Photo (whichever newer)
│   ├── Thumbnail (if photo)
│   ├── Text
│   └── Date
├── Today's status strip
│   ├── Morning indicator        ← done / pending
│   ├── Moments count
│   └── Evening indicator        ← done / pending / locked
└── [+] FAB
```

Contextual banners (conditional):
- "Good morning — start your day" → Morning not done, before noon
- "Commit today" → Evening not done, after 8 PM

### 3. Morning Check-in

```
Morning Check-in
├── Sleep field (last night)     ← shown only if previous evening committed but sleep missing
├── Mood         [1–10]
├── Energy       [1–10]
├── Anxiety      [1–10]
├── Excitement   [1–10]
├── Today's intention            [text]
├── Today's priority             [text]
└── One thing to notice today    [text]
```

### 4. Moment Capture (overlay)

```
Moment Capture
├── Type Picker (grid)
│   └── 13 types: Photo · Beautiful · Idea · Gratitude · Anxiety ·
│                 Conversation · Reading · Music · Quote · Workout ·
│                 Coffee · Place · Insight
└── Capture Screen
    ├── Text field               ← primary input on all types
    ├── Photo attachment         ← optional on all types; primary on Photo type
    └── Remember toggle          ← off by default; auto-on for Beautiful + Photo
```

### 5. Evening Commit

```
Evening Commit
├── Metrics
│   ├── Spark        [1–10 tap scale]
│   ├── Mood         [1–10 tap scale]
│   ├── Coffee       [0–6+ counter]
│   ├── Exercise     [yes/no toggle + optional minutes]
│   ├── Reading      [free entry — minutes or pages]
│   └── Deep Work    [free entry — hours]
├── Reflection
│   ├── Biggest win              [text]
│   ├── Biggest challenge        [text]
│   ├── What energised me?       [text]
│   ├── What drained me?         [text]
│   ├── One sentence journal     [text]
│   ├── Commit message           [text — short]
│   └── Day title                [text]
└── Remember this day toggle
```

Note: Sleep is not entered here. It is entered the next morning as the first field in Morning Check-in.

### 6. Highlights

```
Highlights
└── Chronological scroll (newest first)
    └── Highlight card
        ├── Date
        ├── Type label (Beautiful · Photo · Idea · Day Commit · ...)
        ├── Text
        └── Thumbnail (if photo)
```

What appears: any Moment or Evening Commit with Remember = true.

### 7. Day View

```
Day View
├── Header
│   ├── Date
│   └── Day title (if set)
├── Morning section
│   ├── Mood · Energy · Anxiety · Excitement
│   ├── Intention
│   ├── Priority
│   └── One thing to notice
├── Moments section
│   └── Moment list (chronological)
│       └── Moment card: type · time · text · thumbnail · Remember indicator
└── Evening Commit section
    ├── Spark · Mood · Coffee · Exercise · Reading · Deep Work · Sleep
    └── Reflection fields
```

Read-only. No editing from Day View.

### 8. Insights

```
Insights
├── Summary card
│   ├── Current streak           ← consecutive days committed
│   ├── Days committed this month
│   └── This month's averages    ← Sleep · Mood · Spark · Anxiety · Energy
├── Time window selector         ← 7d · 30d · 90d
└── Charts
    ├── Spark trend              [line chart]
    ├── Sleep trend              [line chart]
    ├── Mood + Energy            [combined line chart]
    ├── Anxiety trend            [line chart]
    └── Moments logged per day   [bar chart]
```

All computed locally from Drive data. No AI in MVP.

### 9. Search

```
Search
├── Text input (auto-focused)
├── Filter chips                 ← All · Photo · Idea · Gratitude · Beautiful · Quote · ...
└── Results list
    └── Result card: type icon · text snippet · date
```

Full-text search across all moment text and day commit reflection fields.

### 10. Settings

```
Settings
├── Notifications
│   ├── Morning reminder time
│   └── Evening reminder time
├── Storage
│   └── Google Drive connection status + reconnect
└── Display name
```

---

## Data Flows

```
User action                  Reads from              Writes to
─────────────────────────────────────────────────────────────────
Morning check-in (save)      —                       entries/{date}.json
Sleep entry (next morning)   entries/{yesterday}.json entries/{yesterday}.json
Moment capture (save)        —                       moments/{date}/{id}.json
Evening commit (save)        —                       entries/{date}.json
Home screen (load)           entries/ (last 7 days)  —
                             moments/ (last 1)
Highlights (load)            moments/ (remember=true) —
                             entries/ (remember=true)
Day View (load)              entries/{date}.json      —
                             moments/{date}/
Insights (load)              entries/ (all)           —
Search (query)               entries/ (all)           —
                             moments/ (all)
```

---

## File Structure (Google Drive)

```
Mosaic/
├── entries/
│   ├── 2026-06-28.json         ← one file per committed day
│   └── 2026-06-29.json
├── moments/
│   ├── 2026-06-28/
│   │   ├── {id}.json
│   │   └── {id}.json
│   └── 2026-06-29/
│       └── {id}.json
├── media/
│   └── {id}.jpg                ← photo attachments; moments reference by id
└── meta.json                   ← app config, last sync timestamp
```

---

## State Rules

| State | Rule |
|---|---|
| Morning window | Open all day until next morning check-in is submitted |
| Evening window | Open from any time until next morning check-in is submitted |
| Day locked | Once next morning is submitted, previous day is read-only |
| Sleep field | Appears in morning check-in only if previous evening committed and sleep missing |
| Remember default | On for Beautiful Thing and Photo; off for all other types |
| Highlights | Includes moments and day commits where remember = true |
| 7-day averages | Computed from committed days only; skipped days excluded |
| Streak | Consecutive days with an evening commit; resets if a day has no commit |

---

## Out of Scope (MVP)

- Offline queue / conflict resolution
- Branches and Releases
- AI-generated insights or semantic search
- Desktop-specific layout
- Android widget
- Export / data portability UI
- Water tracking
- Location on moments
