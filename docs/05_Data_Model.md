
# 05 — Data Model

> Defines every data structure Mosaic stores. All data lives in Google Drive as JSON files. No backend database.

---

## Design Decisions

**Moments: one file per day (array), not one file per moment.**
A single `moments/2026-06-28.json` containing all that day's moments requires one Drive API call to load the full day, vs. N calls for N individual files. For a single user with low volume, this is strictly better.

**No normalisation.** Data is denormalised by design. Each file is self-contained and human-readable. This makes the Drive folder a usable archive even without the app.

**IDs.** All IDs are timestamp-based: `{unix-ms}-{4-char-random}`. Sortable, unique, no dependency on a UUID library.

**Null vs omitted.** Optional fields that were not filled are omitted entirely (not stored as `null`). This keeps files small and avoids false signals in analysis.

---

## File Map

```
Mosaic/
├── entries/
│   └── YYYY-MM-DD.json       ← one per committed/partial day
├── moments/
│   └── YYYY-MM-DD.json       ← all moments for that day as an array
├── media/
│   └── {id}.jpg / .png       ← photo attachments
└── meta.json                 ← app config and sync state
```

---

## 1. Daily Entry — `entries/YYYY-MM-DD.json`

One file per day. Written incrementally — morning fields saved when morning is submitted, evening fields added when evening is committed. File may exist with only morning fields if evening hasn't been committed yet.

### Schema

```json
{
  "date": "2026-06-28",
  "morning": {
    "submitted_at": "2026-06-28T08:14:00Z",
    "mood": 7,
    "energy": 8,
    "anxiety": 4,
    "excitement": 9,
    "intention": "finish the flows doc",
    "priority": "nothing else matters today",
    "notice": "notice light"
  },
  "evening": {
    "submitted_at": "2026-06-28T23:41:00Z",
    "spark": 9,
    "mood": 8,
    "exercise": {
      "done": true,
      "minutes": 40
    },
    "reading_minutes": 30,
    "deep_work_hours": 3.5,
    "sleep_hours": 7.5,
    "biggest_win": "actually started building this",
    "biggest_challenge": "resisting the urge to code before designing",
    "energised_by": "the moment the IA doc clicked into place",
    "drained_by": "nothing, today was good",
    "journal": "rare day where the doing felt as good as the idea",
    "commit_message": "feat: noticed beauty in a Tuesday",
    "day_title": "the terrace at golden hour",
    "remember": true
  }
}
```

### Field Reference

**morning** (all optional)

| Field | Type | Notes |
|---|---|---|
| `submitted_at` | ISO 8601 string | Set on save |
| `mood` | integer 1–10 | |
| `energy` | integer 1–10 | |
| `anxiety` | integer 1–10 | |
| `excitement` | integer 1–10 | |
| `intention` | string | |
| `priority` | string | |
| `notice` | string | "one thing to notice today" |

**evening** (all optional except `submitted_at`)

| Field | Type | Notes |
|---|---|---|
| `submitted_at` | ISO 8601 string | Set on commit |
| `spark` | integer 1–10 | Overall "how alive did this day feel" |
| `mood` | integer 1–10 | |
| `exercise.done` | boolean | Coffee count is derived from Coffee moments — not stored here |
| `exercise.minutes` | integer | Omitted if `done` is false |
| `reading_minutes` | integer | |
| `deep_work_hours` | float | |
| `sleep_hours` | float | Filled next morning; omitted until then |
| `biggest_win` | string | |
| `biggest_challenge` | string | |
| `energised_by` | string | |
| `drained_by` | string | |
| `journal` | string | One sentence |
| `commit_message` | string | Short, git-style |
| `day_title` | string | The name of this day |
| `remember` | boolean | Default false; omitted when false |

---

## 2. Moments — `moments/YYYY-MM-DD.json`

An array of all moments captured on that date. Appended to on each new capture. Ordered by `captured_at`.

### Schema

```json
[
  {
    "id": "1751106840123-a3f2",
    "captured_at": "2026-06-28T09:14:00Z",
    "type": "coffee",
    "text": "first cup, slow morning",
    "remember": false
  },
  {
    "id": "1751128920456-b7e1",
    "captured_at": "2026-06-28T18:42:00Z",
    "type": "beautiful",
    "text": "saw the sun set behind the water tank on the terrace",
    "media_id": "1751128920456-b7e1",
    "remember": true
  },
  {
    "id": "1751136060789-c2d4",
    "captured_at": "2026-06-28T21:01:00Z",
    "type": "idea",
    "text": "what if mosaic is essentially a letter to future me"
  }
]
```

### Field Reference

| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | string | yes | `{unix-ms}-{4-char-random}` |
| `captured_at` | ISO 8601 string | yes | |
| `type` | string enum | yes | See type list below |
| `text` | string | yes | Main content |
| `media_id` | string | no | ID of file in `media/`; same as moment `id` when present |
| `remember` | boolean | no | Omitted when false |

### Moment Types (enum)

```
photo · beautiful · idea · gratitude · anxiety ·
conversation · reading · music · quote · workout ·
coffee · nicotine · place · insight
```

All moment types carry a `captured_at` timestamp, making time-series types like `coffee` and `nicotine` automatically loggable throughout the day. Tap + → Coffee at 9am, tap again at 2pm — each is a separate timestamped entry.

### Remember defaults by type

| Type | Remember default |
|---|---|
| `beautiful` | true |
| `photo` | true |
| all others | false |

---

## 3. Media — `media/{id}.jpg`

Photos are stored as files in the `media/` folder. The filename is the moment's `id` with the original extension preserved (`.jpg`, `.png`, `.webp`).

Moments reference their photo via `media_id`. The app constructs the Drive file path as `media/{media_id}.{ext}`.

No separate metadata file for media — all context lives in the moment object.

---

## 4. App Config — `meta.json`

Stored at the root of the Mosaic Drive folder. Written on onboarding, updated on settings changes.

### Schema

```json
{
  "version": "1.0",
  "display_name": "Harsha",
  "created_at": "2026-06-01T00:00:00Z",
  "notifications": {
    "morning_time": "08:00",
    "evening_time": "21:00"
  },
  "last_synced_at": "2026-06-28T23:41:00Z"
}
```

### Field Reference

| Field | Type | Notes |
|---|---|---|
| `version` | string | Schema version for future migrations |
| `display_name` | string | Used in UI greetings |
| `created_at` | ISO 8601 string | When the user first set up Mosaic |
| `notifications.morning_time` | `HH:MM` string | 24-hour format |
| `notifications.evening_time` | `HH:MM` string | 24-hour format |
| `last_synced_at` | ISO 8601 string | Updated after every successful write |

---

## Computed Values (never stored)

These are derived at runtime from raw data. They are never written to Drive.

| Value | Derived from | Used in |
|---|---|---|
| 7-day averages | Last 7 `entries/` files | Home screen |
| Daily coffee count | Count of `type: coffee` moments for the day | Insights, Day View |
| Daily nicotine count | Count of `type: nicotine` moments for the day | Insights, Day View |
| Current streak | All `entries/` files, `evening.submitted_at` present | Insights |
| Days committed this month | All `entries/` files in current month | Insights |
| Monthly averages | All `entries/` files in current month | Insights |
| Highlights feed | All moments + entries where `remember = true` | Highlights |
| Search results | Full text scan of all `moments/` and `entries/` | Search |

---

## Data Lifecycle

```
Day starts
  → morning submitted → entries/YYYY-MM-DD.json created with morning block

Throughout day
  → moment captured → appended to moments/YYYY-MM-DD.json
  → photo attached  → saved to media/{id}.jpg

Evening
  → commit submitted → evening block written to entries/YYYY-MM-DD.json

Next morning
  → sleep entered → entries/YYYY-MM-DD.json updated (previous date)
  → morning check-in for new day → new entries file created
  → previous day's evening window now locked (read-only)
```

---

## Example: A Full Day

**`entries/2026-06-28.json`**
```json
{
  "date": "2026-06-28",
  "morning": {
    "submitted_at": "2026-06-28T08:14:00Z",
    "mood": 7,
    "energy": 8,
    "anxiety": 4,
    "excitement": 9,
    "intention": "finish the flows doc",
    "priority": "nothing else matters today",
    "notice": "notice light"
  },
  "evening": {
    "submitted_at": "2026-06-28T23:41:00Z",
    "spark": 9,
    "mood": 8,
    "exercise": { "done": true, "minutes": 40 },
    "reading_minutes": 30,
    "deep_work_hours": 3.5,
    "sleep_hours": 7.5,
    "biggest_win": "actually started building this",
    "journal": "rare day where the doing felt as good as the idea",
    "commit_message": "feat: noticed beauty in a Tuesday",
    "day_title": "the terrace at golden hour",
    "remember": true
  }
}
```

**`moments/2026-06-28.json`**
```json
[
  {
    "id": "1751106840123-a3f2",
    "captured_at": "2026-06-28T09:14:00Z",
    "type": "coffee",
    "text": "first cup, slow morning"
  },
  {
    "id": "1751128920456-b7e1",
    "captured_at": "2026-06-28T18:42:00Z",
    "type": "beautiful",
    "text": "saw the sun set behind the water tank on the terrace",
    "media_id": "1751128920456-b7e1",
    "remember": true
  },
  {
    "id": "1751136060789-c2d4",
    "captured_at": "2026-06-28T21:01:00Z",
    "type": "idea",
    "text": "what if mosaic is essentially a letter to future me"
  }
]
```
