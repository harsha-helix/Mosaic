# Mosaic

> Made of the moments you'd otherwise forget.

Mosaic is a personal daily-journaling PWA: a morning check-in, moment capture throughout the day, and an evening commit — all stored as human-readable JSON in your own Google Drive. No backend, no database, no account system beyond Google sign-in. Full design and architecture background lives in [`../docs`](../docs).

**Status:** v0.2.5 — Phases 0–2.5 complete (scaffold, daily loop, browse/reflect, sync hardening). Phase 3 (Insights) is next. See [`../docs/08_MVP_Roadmap.md`](../docs/08_MVP_Roadmap.md) for the full phase breakdown and known issues.

---

## Quick start

### 1. Install dependencies

```bash
npm install
```

### 2. Configure Google OAuth

Edit `.env.local` and set your client ID:

```
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
```

To get one:
1. [Google Cloud Console](https://console.cloud.google.com) → create/select a project
2. **APIs & Services → Enable APIs** → enable **Google Drive API**
3. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Authorised JavaScript origins: `http://localhost:5173` for local dev, plus your deployed domain (e.g. `https://your-app.vercel.app`) once you have one
6. Scope used by the app: `https://www.googleapis.com/auth/drive.file` (Mosaic can only see/edit files it created — never your other Drive content)

### 3. Run locally

```bash
npm run dev
```

Open `http://localhost:5173`. First visit redirects to `/onboarding`.

**Testing on a phone:** if you point a phone at your computer's LAN IP (e.g. `http://192.168.1.x:5173`) during dev, that origin must also be added to the OAuth client's authorised origins list, or sign-in will fail. Easiest path is testing against a real deployed URL instead.

### 4. Build / deploy

```bash
npm run build      # tsc -b && vite build — must pass clean before shipping
npm run preview     # serve the production build locally
```

Deployed via Vercel (`vercel.json` handles SPA rewrites). Add `VITE_GOOGLE_CLIENT_ID` as an environment variable in the Vercel dashboard, and add the deployed domain to the OAuth client's authorised origins.

---

## Tech stack

React 19 + TypeScript on Vite, Tailwind for styling, React Router v6, Zustand for UI state, TanStack Query, `idb` for IndexedDB, Google Drive API v3 + Google Identity Services for auth and storage. No backend — full rationale in [`../docs/06_Technical_Architecture.md`](../docs/06_Technical_Architecture.md).

## How data & sync work

Mosaic is local-first: every read/write hits IndexedDB immediately, Drive syncs in the background, the UI never blocks on network. Each day's data is a self-contained JSON file (`entries/YYYY-MM-DD.json`, `moments/YYYY-MM-DD.json`) in a `Mosaic/` folder in your Drive — readable even without the app.

Sync is multi-device: conflicts merge (entry sections merge by `submitted_at`, moments union by `id`) rather than blind-overwrite, so a phone and a laptop can both write without clobbering each other. An offline write queues locally and replays automatically once you're back online, with a bounded retry (5 attempts, then it's dropped and surfaced as a pending count in Settings). Full design record: [`../docs/09_Sync_Architecture.md`](../docs/09_Sync_Architecture.md).

If sync ever looks stuck, Settings has a manual "Sync with Drive" button and a "Reconnect Google Drive" fallback for when silent re-authentication fails (common on mobile browsers that restrict third-party cookies).

## Project structure

```
src/
├── types/              — DailyEntry, Moment, Meta TypeScript types
├── lib/
│   ├── db/              — IndexedDB schema + queries (idb): entry, moment, fileIndex, syncQueue
│   └── drive/            — Google Drive API client, file-index cache, high-level sync operations
├── store/               — Zustand stores (auth, today, sync status)
├── screens/              — one folder per route (Home, Morning, Evening, Highlights, DayView,
│                            Insights, Search, Settings, Onboarding)
└── components/            — BottomNav, FAB, MomentCapture, MomentCard, MetricCircles, RememberToggle
```

## What's working

- Onboarding (name, reminder times, Drive connect) → bootstraps a `Mosaic/` Drive folder
- Morning check-in, moment capture (14 types, optional photo), Evening commit — all write to Drive + IndexedDB
- Home, Highlights, Day View, Search, dark mode
- Multi-device sync: field-level entry merge, union-by-id moment merge, offline retry queue with coalescing, periodic full-history pull, reconnect handling

## Not yet built

- Insights screen (charts, streaks, monthly averages) — Phase 3
- Push notifications (Firebase FCM) — Phase 4
- Vercel deploy is manual today (no CI)

## Known issues

Tracked in detail in [`../docs/08_MVP_Roadmap.md`](../docs/08_MVP_Roadmap.md#known-issues--follow-ups):

- Onboarding's chosen notification times aren't actually persisted to `meta.json` yet (hardcoded to 08:00/21:00) — needs fixing before Phase 4 notifications depend on it.
- `listFolder`/`searchFolder` cap at 1000 results with no pagination — fine for now, will silently drop older files once a folder crosses that count.
