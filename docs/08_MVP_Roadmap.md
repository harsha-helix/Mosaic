
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
- [x] Deployed to Vercel (deferred to end of MVP)

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

## Phase 3 — Sync Integrity & Mobile Performance  ← next
**Goal:** Trust the data; the phone stops being the weak device. Decision record: [`11_Sync_Integrity_and_Mobile_Performance.md`](./11_Sync_Integrity_and_Mobile_Performance.md).

> Re-prioritized 2026-07-02 after direct inspection of the live Drive folder found **8 duplicate `meta.json` files** — root cause traced to `bootstrapDrive` checking only the local file index (never Drive) and `buildFileIndex` never indexing root files.

- [x] `repairMeta()` owns the canonical `meta.json` index entry; root files resolved from the Drive listing (D1) — 2026-07-02
- [x] `bootstrapDrive()` decides meta existence from the Drive listing; in-flight mutex prevents racing bootstraps (D2) — 2026-07-02
- [x] `repairMeta()` — merges duplicates into canonical (oldest `createdTime`, settings from newest), trashes rest, self-heals on every app open via `hydrateToday` (D3) — 2026-07-02
- [x] Media: downscale at capture (1600px JPEG q0.8 via `lib/media.ts`), 256px thumbnail in IndexedDB (`mediaThumb` store, DB v2), presence-check before upload/replay; `PhotoThumbnail` renders local-first with Drive fallback + backfill (D4) — 2026-07-02
- [x] Auth: silent-refresh on `visibilitychange` + queue flush; sign-out no longer clears the file index or data (D5) — 2026-07-02
- [x] `pageToken` loops in `listFolder`/`searchFolder`; `appProperties: {mosaic:'root'}` marker on new root folders (D6, partial) — 2026-07-02
- [x] Perf remainder (D6): Home uses `getEntriesInRange` (last 7 days) + `getLatestMomentWhere` (reverse cursor, stops at first match) — no unbounded `getAll*` on Home's render path; full-history pulls run in batches of 5 with event-loop yields — 2026-07-02
- [x] Image quality pass: uploads 2048px JPEG q0.9 (was 1600/q0.8), thumbnails 800px q0.8 (was 256/q0.7 — blurry at card width); DB v3 drops old 256px thumbs so they regenerate from Drive full-res on next view — 2026-07-02
- [x] Onboarding notification times persisted; Settings has name + reminder-time editing (D7) — done in ui-overhaul pass

**Done when:** fresh device sign-in creates zero root files; one `meta.json` exists; phone-captured photos appear on laptop; Home is jank-free on the phone.

---

## Phase 4 — Feel & Identity
**Goal:** Close the "feels like a form" gap. Source: [`10_UIUX_Audit.md`](./10_UIUX_Audit.md) priorities + capture redesign in [`12_Capture_UX_Grouped_Grid.md`](./12_Capture_UX_Grouped_Grid.md).

- [ ] Consolidate the four MomentCard implementations (audit #2 — do first, so photos are added once)
- [ ] Photo playback: thumbnail component (reads IndexedDB thumbs from Phase 3) in Highlights, Search, Day View, Home (audit #1)
- [ ] **Day Glyph** — radar shape on Morning save → status strip → Day View header (audit #3)
- [ ] Capture picker → grouped grid + 2-tap quick-log for body types (doc 12)
- [ ] Motion layer: bottom-sheet slide-up first, then route transitions (audit #4)
- [ ] Today mosaic tile strip on Home + tile-drop animation (audit #5)
- [ ] Polish: Evening "back" → "←", onboarding success beat, RememberToggle decision (audit #7)

**Done when:** the app has a mosaic in it, photos come back, and capture feels faster than before.

---

## Phase 5 — Insights (lean) + Report Viewer
**Goal:** Numbers in-app, meaning from Claude. Decision record: [`13_AI_Layer_Claude_Native.md`](./13_AI_Layer_Claude_Native.md).

- [ ] **Insights screen (lean)** — streak, days this month, 7d/30d/90d selector, Spark/Sleep/Mood+Energy/Anxiety charts (Recharts), moments-per-day, empty state
- [ ] Coffee + nicotine counts in Day View
- [ ] `analysis/` added to file index + periodic sync
- [ ] **Reports section** — report cards → rendered markdown, tappable highlight moments deep-linking to Day View

**Done when:** daily glanceable numbers live in-app and Monday's Claude report renders in the app.

---

## Phase 6 — AI Reports Operational
**Goal:** The data starts talking back. No app code — Cowork scheduled tasks per doc 13.

- [ ] Weekly task (`0 8 * * 1`): read last 7 days from Drive → write `analysis/weekly/YYYY-Www.json`
- [ ] Monthly task (`0 8 1 * *`): calendar month → `analysis/monthly/YYYY-MM.json`
- [ ] First weekly report validated: all `highlights.moment_id` resolve, renders in-app

**Done when:** a weekly report arrives unprompted, and answering one of its questions becomes a captured moment.

---

## Parked — Notifications (was Phase 4)
**Status: undecided (2026-07-02).** Usage is already near-daily without reminders. Revisit after Phase 4 lands: compare Firebase FCM (original plan below) vs. a zero-infra substitute (Android alarms/calendar). Original FCM checklist preserved in [`06_Technical_Architecture.md`](./06_Technical_Architecture.md) — note its dependency on D7 (meta notification times) is resolved in Phase 3.

---

## Explicit Deferrals

These are intentionally out of scope until after the 30-day success metric is hit:

| Feature | Why deferred |
|---|---|
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
Phase 3 — Sync Integrity & Mobile Perf   ← next  (trust first)
    ↓
Phase 4 — Feel & Identity                (glyph, photos, mosaic, motion)
    ↓
Phase 5 — Insights (lean) + Report Viewer
    ↓
Phase 6 — AI Reports (Cowork scheduled tasks, no app code)

Parked: Notifications (undecided — usage is already habitual)
```

---

## Known Issues / Follow-ups

Found during Phase 2.5 sync hardening. Not blocking, but worth fixing before they bite:

| Issue | Where | Why it matters |
|---|---|---|
| Onboarding lets you set custom morning/evening notification times, but `bootstrapDrive()` hardcodes `08:00`/`21:00` into `meta.json` on first write instead of using what you entered. Your chosen times are silently dropped. | `lib/drive/operations.ts` (`bootstrapDrive`), `screens/Onboarding/index.tsx` | Will surface as a real bug once Phase 4 notifications read `meta.json` for schedule times — the Cloud Function would fire at the wrong hour. Fix before starting Phase 4. |
| **8 duplicate `meta.json` files exist on Drive right now** (observed 2026-07-02). Each bootstrap on a device with an empty local file index creates a new one, because existence is checked against IndexedDB only and `buildFileIndex` never indexes root files. Devices then track different copies → divergent `last_synced_at` → inconsistent periodic sync. | `lib/drive/operations.ts` (`bootstrapDrive` step 3), `lib/drive/fileIndex.ts` (`buildFileIndex`) | This is the prime suspect behind "data seemed to vanish" reports. Fix + one-time repair specced in `11_Sync_Integrity_and_Mobile_Performance.md` (D1–D3) — Phase 3's first item. |
| `listFolder()` / `searchFolder()` request `pageSize=1000` with no page-token loop — Drive API results beyond 1000 files in a single folder are silently dropped. | `lib/drive/client.ts` | At one `entries/` file and up to a handful of `moments/` files per day, this is years away. But it means sync (and the "search Drive for existing Mosaic folder" bootstrap logic) will quietly stop seeing older files once any folder crosses 1000 items, with no error to signal it. Cheap to fix later with a `pageToken` loop — flagging now so it doesn't get forgotten. |
