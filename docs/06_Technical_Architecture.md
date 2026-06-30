
# 06 — Technical Architecture

> Defines the tech stack, data layer, Google Drive integration, PWA setup, push notifications, project structure, and routing for Mosaic MVP.

---

## Stack Overview

| Concern | Choice | Reason |
|---|---|---|
| Framework | React 18 + TypeScript | Ecosystem, PWA support, component model |
| Build tool | Vite | Fast dev server, best PWA plugin |
| PWA | vite-plugin-pwa (Workbox) | Service worker + manifest generation |
| Styling | Tailwind CSS | Mobile-first utility classes, fast to build |
| Routing | React Router v6 | Standard, flat route structure fits the app |
| Async state | TanStack Query v5 | Drive fetches, caching, background refetch |
| Local state | Zustand | Lightweight, minimal boilerplate |
| Local DB | IndexedDB via `idb` | Offline cache, write queue |
| Drive client | Google Drive API v3 + Google Identity Services | Only free option that fits the data model |
| Push notifications | Firebase FCM (free Spark plan) | Reliable push to Android PWA when app is closed |
| Notification schedule | Firebase Cloud Functions + Cloud Scheduler | 2 scheduled jobs (8am, 9pm); well within free tier |
| Charts | Recharts | Lightweight, composable, works with Tailwind |

**Everything is free.** Google Drive (15 GB), Firebase Spark plan (125K function invocations/month, 3 Cloud Scheduler jobs/month).

---

## System Diagram

```
┌─────────────────────────────────────────┐
│              PWA (React)                │
│                                         │
│  ┌──────────┐    ┌────────────────────┐ │
│  │  Zustand │    │  TanStack Query    │ │
│  │  (UI     │    │  (Drive fetches +  │ │
│  │   state) │    │   cache layer)     │ │
│  └──────────┘    └────────┬───────────┘ │
│                           │             │
│  ┌────────────────────────▼───────────┐ │
│  │         IndexedDB (idb)            │ │
│  │   local cache + offline queue      │ │
│  └────────────────────────┬───────────┘ │
│                           │             │
│  ┌────────────────────────▼───────────┐ │
│  │      Drive Sync Layer              │ │
│  │   (read / write / conflict check)  │ │
│  └────────────────────────┬───────────┘ │
└──────────────────────────-│─────────────┘
                            │
              Google Drive API v3
                            │
              ┌─────────────▼─────────────┐
              │       Google Drive        │
              │   entries/ moments/       │
              │   media/  meta.json       │
              └───────────────────────────┘

Firebase (separate, notifications only)
  Cloud Scheduler ──► Cloud Function ──► FCM ──► Android PWA
```

---

## Data Layer Architecture

Mosaic is **local-first**: all reads and writes hit IndexedDB immediately. Drive is synced in the background. The UI never waits for a network call.

### Write flow

```
User action (e.g. save moment)
  │
  ▼
Write to IndexedDB (optimistic — instant)
  │
  ├──► Update UI via Zustand / React Query cache
  │
  └──► Queue Drive sync (background)
         │
         ▼
       Drive API write
         │
         ├── success → mark synced in IndexedDB
         └── failure → retry on next open / online event
```

### Read flow

```
App opens / screen mounts
  │
  ▼
Read from IndexedDB (instant — shown immediately)
  │
  └──► Background: fetch from Drive
         │
         ├── data unchanged → no-op
         └── data newer    → update IndexedDB + refresh UI
```

### Sync strategy

- **On app open:** compare `meta.json → last_synced_at` against IndexedDB state. Pull any files modified after last sync.
- **On write:** push immediately if online; queue if offline.
- **Conflict rule (MVP):** Drive wins. If Drive has a newer version of a file than IndexedDB, Drive overwrites local. This is safe because Mosaic is single-user and single-device for MVP.

---

## Google Drive Integration

### Auth

- **Library:** Google Identity Services (GIS) — the current Google OAuth 2.0 web library.
- **Scope:** `https://www.googleapis.com/auth/drive.file`
  - Grants access only to files the app created. Cannot read the user's other Drive files.
- **Token storage:** Access token stored in memory (not localStorage). Refreshed silently via GIS on expiry.

### File operations

| Operation | Drive API call |
|---|---|
| Read a JSON file | `GET /drive/v3/files/{id}?alt=media` |
| List files in a folder | `GET /drive/v3/files?q='{folderId}'+in+parents` |
| Create a JSON file | `POST /upload/drive/v3/files?uploadType=multipart` |
| Update a JSON file | `PATCH /upload/drive/v3/files/{id}?uploadType=media` |
| Upload a photo | `POST /upload/drive/v3/files?uploadType=multipart` |

### File ID caching

Drive API requires a file's ID (not its name) for reads and updates. On first load, the app lists the Mosaic folder and builds a local map:

```ts
// Stored in IndexedDB
type FileIndex = {
  [path: string]: string  // e.g. "entries/2026-06-28.json" → "1BxiMV..."
}
```

New files are registered in this index when created. This avoids a `files.list` call on every read.

### Rate limits

Drive API: 1,000 requests / 100 seconds per user. A typical Mosaic session (open app, load home, log a moment, close) is 3–5 requests. No risk of hitting limits.

---

## Push Notifications

### Why not browser-native?

The Web Push API requires a server-side component to send pushes — there is no way to schedule a push notification from client-side JavaScript that fires when the app is closed. On Android, service workers cannot reliably self-schedule future wake-ups.

### Solution: Firebase FCM (free)

```
Cloud Scheduler (8:00 AM cron)
  │
  └──► Cloud Function (notify.ts)
         │
         └──► FCM send to user's FCM token
                │
                └──► Service worker receives push
                       │
                       └──► Shows system notification
                              │
                              └── User taps → opens Morning Check-in
```

**Cost:** Firebase Spark plan is free. 2 Cloud Scheduler jobs (morning + evening) = 2 of the 3 free slots. Cloud Functions: ~60 invocations/day × 30 = 1,800/month, well under the 125K free limit.

### FCM token

- Generated on first app load via Firebase SDK.
- Stored in `meta.json` on Drive so the Cloud Function knows where to send.
- Refreshed automatically by Firebase SDK if it expires.

### Notification payload

```json
{
  "morning": {
    "title": "Good morning",
    "body": "Set your intention for today.",
    "data": { "route": "/morning" }
  },
  "evening": {
    "title": "End the day",
    "body": "Commit before you sleep.",
    "data": { "route": "/evening" }
  }
}
```

---

## PWA Setup

### Manifest (`public/manifest.json`)

```json
{
  "name": "Mosaic",
  "short_name": "Mosaic",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#ffffff",
  "theme_color": "#000000",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png" }
  ]
}
```

### Service Worker

Managed by `vite-plugin-pwa` (Workbox). Strategy:

| Asset type | Caching strategy |
|---|---|
| App shell (HTML, JS, CSS) | Cache-first (precached at install) |
| Google Drive API responses | Network-first with IndexedDB fallback |
| Photos (media/) | Cache-first once loaded |
| FCM push handler | Registered in service worker |

---

## Routing

Flat route structure. No nested layouts except the main shell (bottom nav).

```
/                  → Home
/morning           → Morning Check-in
/evening           → Evening Commit
/highlights        → Highlights Timeline
/day/:date         → Day View  (e.g. /day/2026-06-28)
/insights          → Insights
/search            → Search
/settings          → Settings
/onboarding        → Onboarding (redirects to / after completion)
```

Deep link from notification tap:
- Morning push → app opens to `/morning`
- Evening push → app opens to `/evening`

---

## Project Structure

```
mosaic/
├── src/
│   ├── main.tsx               ← entry point
│   ├── App.tsx                ← router + shell
│   │
│   ├── screens/               ← one folder per route
│   │   ├── Home/
│   │   ├── Morning/
│   │   ├── Evening/
│   │   ├── Highlights/
│   │   ├── DayView/
│   │   ├── Insights/
│   │   ├── Search/
│   │   ├── Settings/
│   │   └── Onboarding/
│   │
│   ├── components/            ← shared UI
│   │   ├── MomentCapture/     ← type picker + capture overlay
│   │   ├── BottomNav/
│   │   ├── MetricSlider/
│   │   └── ...
│   │
│   ├── lib/
│   │   ├── drive/             ← Drive API client + file index
│   │   │   ├── client.ts
│   │   │   ├── fileIndex.ts
│   │   │   └── operations.ts
│   │   ├── db/                ← IndexedDB schema + access
│   │   │   ├── schema.ts
│   │   │   └── queries.ts
│   │   └── fcm/               ← Firebase init + token management
│   │       └── index.ts
│   │
│   ├── store/                 ← Zustand stores
│   │   ├── today.ts           ← today's entry + moments
│   │   └── sync.ts            ← sync queue state
│   │
│   └── types/                 ← TypeScript types (mirrors data model)
│       ├── entry.ts
│       ├── moment.ts
│       └── meta.ts
│
├── functions/                 ← Firebase Cloud Functions
│   └── src/
│       └── notify.ts          ← scheduled push sender
│
├── public/
│   ├── manifest.json
│   ├── icon-192.png
│   └── icon-512.png
│
├── docs/                      ← this folder
├── index.html
├── vite.config.ts
├── tailwind.config.ts
└── firebase.json
```

---

## Environment Setup

Two external services to configure before development:

### 1. Google Cloud Console
- Create project → enable Drive API
- Create OAuth 2.0 Web Client ID
- Add `localhost:5173` and production domain to authorised origins
- Scope: `drive.file`

### 2. Firebase
- Create project (Spark plan — free)
- Enable Cloud Messaging
- Create 2 Cloud Scheduler jobs:
  - `notify-morning`: `0 8 * * *` → calls `notifyMorning` function
  - `notify-evening`: `0 21 * * *` → calls `notifyEvening` function
- Deploy `functions/src/notify.ts`

Both configs stored in `.env.local` (never committed):

```
VITE_GOOGLE_CLIENT_ID=...
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=...
VITE_FIREBASE_MESSAGING_SENDER_ID=...
VITE_FIREBASE_APP_ID=...
```

---

## Out of Scope (MVP)

- Multi-device sync conflict resolution
- Offline write queue UI (errors handled silently with retry)
- Desktop-specific layout (responsive Tailwind handles basic desktop)
- AI / embeddings pipeline
- Android widget
- Export UI
