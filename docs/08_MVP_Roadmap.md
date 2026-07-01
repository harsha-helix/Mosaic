
# 08 — MVP Roadmap

> Phased build plan. Each phase ends with a working, usable app — not a partial one.
> The app is "done enough to use daily" after Phase 2.

---

## Success Metric (from vision doc)

> "I naturally open Mosaic every morning and every evening for at least 30 days. Not because I force myself to. Because I want to."

The roadmap is sequenced to reach that bar as fast as possible, then layer everything else on top.

---

## Phase 0 — Scaffold ✅ Complete (2026-06-30)
**Goal:** A running app with the right bones. Nothing visible to a user yet.

- [x] Vite + React 19 + TypeScript project initialised
- [x] Tailwind CSS configured with design tokens (colors, fonts, radius, spacing from `07_UI_Specification.md`)
- [x] Space Grotesk + Inter loaded via `@fontsource`
- [x] React Router v6 set up with all routes defined (empty screen components as stubs)
- [x] Zustand + TanStack Query installed
- [x] `idb` installed, IndexedDB schema defined (`entry`, `moment`, `fileIndex`, `syncQueue`)
- [x] TypeScript types written for `DailyEntry`, `Moment`, `Meta` (from `05_Data_Model.md`)
- [x] Google Cloud Console project created, Drive API enabled, OAuth client ID configured
- [x] Google Identity Services auth flow working (sign in → token → stored in memory)
- [x] Drive folder `Mosaic/` created on first auth, `meta.json` written
- [x] `lib/drive/` client: `readFile`, `writeFile`, `listFolder`, `uploadMedia` implemented
- [x] `lib/db/` IndexedDB queries: `getEntry`, `saveEntry`, `getMoments`, `appendMoment`
- [x] Drive file index (`fileIndex`) populated on first load
- [x] Bottom nav shell + screen routing working (blank screens)
- [x] PWA manifest + icons added
- [ ] Deployed to Vercel (deferred to end of MVP)

**Done when:** App opens in Android Chrome, Google Drive auth works, app shell is installable as PWA.

---

## Phase 1 — The Daily Loop ✅ Complete (2026-06-30)
**Goal:** The core ritual works end to end. Morning → Moments → Evening Commit → written to Drive.

- [x] **Onboarding screen** — name, notification times, Drive connect
- [x] **Home screen** (functional, not final)
  - Greeting by time of day
  - Today's status strip (morning / moments count / evening)
  - "Start your morning" banner when morning not done
  - "Commit today" banner after 8pm when evening not done
  - FAB [+] in bottom-right wired to Moment Capture
- [x] **Morning Check-in**
  - Sleep field (shown when previous evening committed, sleep missing)
  - MetricCircles for Mood, Energy, Anxiety, Excitement
  - Text fields for intention, priority, notice
  - Saves to `entries/YYYY-MM-DD.json` in Drive + IndexedDB
- [x] **Moment Capture**
  - Type picker bottom sheet (all 14 types)
  - Capture screen with text field, photo attachment, Remember toggle
  - Photo upload to `media/` in Drive
  - Remember auto-on for `beautiful` and `photo`
  - Appends to `moments/YYYY-MM-DD.json`
- [x] **Evening Commit**
  - MetricCircles for Spark, Mood
  - Exercise toggle + optional minutes
  - Reading and Deep Work free entry
  - All reflection text fields
  - Day title + commit message (monospace)
  - Remember this day toggle
  - Saves to `entries/YYYY-MM-DD.json`
- [x] **Commit ceremony animation** — terminal type-out + confetti → Home
- [x] **Drive sync (baseline)** — IndexedDB-first on load, background Drive fetch + push on every save. Hardening (retry queue, periodic multi-device pull) tracked separately in Phase 2.5 below.

**Done when:** A full day can be logged (morning → moments → evening) and the data appears correctly in the Mosaic Drive folder.

---

## Phase 2 — Browse & Reflect ✅ Complete (2026-06-30)
**Goal:** The past becomes accessible. The app has memory.

- [x] **Home screen** — final version
  - Quote card (random from captured quotes; fallback curated list)
  - 7-day averages strip (Sleep, Mood, Energy, Anxiety, Spark)
  - Last beautiful thing card (most recent `beautiful` or `photo`, whichever newer)
- [x] **Highlights screen**
  - Vertical scroll, newest first
  - MomentCards with type colors + Remember star
  - Day commit cards (violet border, title + key metrics)
  - Date labels grouping same-day items
  - Empty state
  - Tap moment → full detail view
  - Tap day commit → Day View
- [x] **Day View**
  - Morning section (metrics + text fields)
  - Moments list (chronological, compact MomentCards)
  - Evening section (all metrics + reflection)
  - Commit message in monospace
  - Read-only
- [x] **Search**
  - Auto-focused text input
  - Scrollable type filter chips
  - Full-text search across moments + entries
  - Match highlight in Violet
  - Empty state + recent moments when no query
- [x] **Dark mode** — Tailwind `dark:` variants applied across all screens

**Done when:** You can open the app, look back at any past day, scroll your highlights, and search for any moment you've logged.

---

## Phase 2.5 — Sync Hardening ✅ Complete (2026-07-01)
**Goal:** Close the gap between what `06_Technical_Architecture.md` describes and what's actually running. Decision record: [`09_Sync_Architecture.md`](./09_Sync_Architecture.md).

- [x] Field-level merge on entries (`morning`/`evening` by `submitted_at`) — already built, confirmed correct
- [x] Union-by-id merge on moments — already built, confirmed correct
- [x] Widen `syncQueue` schema to accept `Blob` payloads (photo uploads currently can't be queued)
- [x] Wire `enqueueSyncItem` into the three push sites (`pushEntry`, `pushMoments`, `pushMedia`) on failure — currently swallowed via `console.warn`
- [x] `flushSyncQueue()` — coalesce by path, replay newest-per-path, drop after 5 failed retries
- [x] Call `flushSyncQueue()` on app open and on `window`'s `online` event
- [x] Periodic full-history sync on app open when `meta.last_synced_at` is older than 6 hours
- [x] Settings screen shows a pending-sync-item count when the queue is non-empty

**Done when:** an offline write survives a close/reopen and lands on Drive without a manual tap, and a second device's changes surface within 6 hours without one either. ✅ `npm run build` passes clean.

---

## Phase 3 — Insights
**Goal:** Your data tells you something.

- [ ] **Insights screen**
  - Summary card (streak, days this month, monthly averages)
  - Time window selector (7d / 30d / 90d)
  - Spark, Sleep, Mood + Energy, Anxiety line charts (Recharts)
  - Moments per day bar chart
  - Empty state (< 3 days)
- [ ] Coffee + nicotine counts derived from moments, shown in Day View
- [ ] Streak computation (consecutive days with evening commit)

**Done when:** After a few weeks of use, the Insights screen shows something meaningful about your patterns.

---

## Phase 4 — Notifications
**Goal:** Mosaic reminds you. You don't have to remember to open it.

- [ ] Firebase project created (Spark plan, free)
- [ ] Firebase FCM integrated into the PWA (service worker push handler)
- [ ] FCM token generated on first load, saved to `meta.json`
- [ ] `functions/src/notify.ts` Cloud Function written and deployed
- [ ] 2 Cloud Scheduler jobs created: `0 8 * * *` (morning) and `0 21 * * *` (evening)
- [ ] Notification tap → deep links to `/morning` or `/evening`
- [ ] Notification times from Settings respected by Cloud Function (reads from `meta.json`)

**Done when:** Phone receives a morning notification at 8am and evening at 9pm without the app being open.

---

## Explicit Deferrals

These are intentionally out of scope until after the 30-day success metric is hit:

| Feature | Why deferred |
|---|---|
| Vercel deploy | Deferred to end of MVP |
| Offline write queue UI | Silent retry is fine for single user |
| Desktop layout | Mobile is the primary device |
| Android widget | Useful but not essential for the loop |
| AI analysis / monthly reports | Needs months of data first |
| Semantic search | Full-text is enough for MVP |
| Branches + Releases | Post-MVP Git concepts |
| Export / data portability | Drive folder is already the export |
| Water tracking | Optional, low priority |
| Themes / accent picker | Default palette is strong enough |

---

## Build Order Summary

```
Phase 0 — Scaffold          ✅ complete
    ↓
Phase 1 — Daily Loop        ✅ complete
    ↓
Phase 2 — Browse & Reflect  ✅ complete
    ↓
Phase 2.5 — Sync Hardening  ✅ complete
    ↓
Phase 3 — Insights          ← next  (data pays off)
    ↓
Phase 4 — Notifications     (fully automatic)
```

Start Phase 4 last — Firebase is the least familiar piece. By then the app is already working and the notifications are an enhancement, not a dependency.

---

## Known Issues / Follow-ups

Found during Phase 2.5 sync hardening. Not blocking, but worth fixing before they bite:

| Issue | Where | Why it matters |
|---|---|---|
| Onboarding lets you set custom morning/evening notification times, but `bootstrapDrive()` hardcodes `08:00`/`21:00` into `meta.json` on first write instead of using what you entered. Your chosen times are silently dropped. | `lib/drive/operations.ts` (`bootstrapDrive`), `screens/Onboarding/index.tsx` | Will surface as a real bug once Phase 4 notifications read `meta.json` for schedule times — the Cloud Function would fire at the wrong hour. Fix before starting Phase 4. |
| `listFolder()` / `searchFolder()` request `pageSize=1000` with no page-token loop — Drive API results beyond 1000 files in a single folder are silently dropped. | `lib/drive/client.ts` | At one `entries/` file and up to a handful of `moments/` files per day, this is years away. But it means sync (and the "search Drive for existing Mosaic folder" bootstrap logic) will quietly stop seeing older files once any folder crosses 1000 items, with no error to signal it. Cheap to fix later with a `pageToken` loop — flagging now so it doesn't get forgotten. |
