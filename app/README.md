# Mosaic — app

> Version control for a life well lived.

## Phase 0 Setup

### 1. Install dependencies

From this directory, run:

```bash
npm install
```

### 2. Configure Google OAuth

Open `.env.local` and replace the placeholder with your real client ID:

```
VITE_GOOGLE_CLIENT_ID=YOUR_CLIENT_ID_HERE.apps.googleusercontent.com
```

To get a client ID:
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Create a project → **APIs & Services → Enable APIs** → enable **Google Drive API**
3. **APIs & Services → Credentials → Create Credentials → OAuth 2.0 Client ID**
4. Application type: **Web application**
5. Authorised JavaScript origins: `http://localhost:5173` (add your Vercel domain later)
6. Copy the Client ID into `.env.local`

### 3. Run locally

```bash
npm run dev
```

Open `http://localhost:5173`. The app redirects to `/onboarding` on first visit.

### 4. Deploy to Vercel

```bash
npm run build
# then push to GitHub and connect to Vercel, or:
npx vercel --prod
```

Add `VITE_GOOGLE_CLIENT_ID` as an environment variable in the Vercel dashboard.
Add your Vercel domain (`https://your-app.vercel.app`) to the OAuth client's authorised origins.

---

## Project structure

```
src/
├── types/          — DailyEntry, Moment, Meta TypeScript types
├── lib/
│   ├── db/         — IndexedDB schema + queries (idb)
│   └── drive/      — Google Drive API client + operations
├── store/          — Zustand stores (auth, today, sync)
├── screens/        — One folder per route (all stubs in Phase 0)
└── components/     — BottomNav, FAB
```

## What's working (Phase 0)

- ✅ Vite + React 19 + TypeScript scaffold
- ✅ Tailwind CSS with Mosaic design tokens
- ✅ Space Grotesk + Inter fonts
- ✅ React Router v6 — all routes defined
- ✅ Zustand + TanStack Query
- ✅ IndexedDB schema (entry, moment, fileIndex, syncQueue)
- ✅ TypeScript types for DailyEntry, Moment, Meta
- ✅ Google Drive client (readFile, writeFile, listFolder, uploadMedia)
- ✅ Drive bootstrap (creates Mosaic/ folder + meta.json on first auth)
- ✅ File index (path → Drive ID, stored in IndexedDB)
- ✅ Onboarding screen (name, reminder times, Drive connect)
- ✅ Bottom nav shell + routing
- ✅ PWA manifest + icons
- ✅ vercel.json for SPA routing

## Next: Phase 1 — Daily Loop

Morning check-in → Moments → Evening Commit → Drive sync.
