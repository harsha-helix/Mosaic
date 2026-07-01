
# 09 — Sync Architecture (Decision Record)

> Resolves a contradiction between `06_Technical_Architecture.md` (as written) and `lib/drive/operations.ts` (as built), and closes the gap left by the unused `syncQueue` IndexedDB store. This doc is the source of truth for sync going forward — `06` and `08` have been updated to match it.

---

## The contradiction this resolves

`06_Technical_Architecture.md` originally specified:
- Conflict rule: **"Drive wins."** Whole-file overwrite, no merge.
- Assumption: **single-device**, multi-device conflict resolution explicitly deferred (`08_MVP_Roadmap.md` Explicit Deferrals).

But `operations.ts` already implements something different and more capable:
- `mergeEntry()` — merges `morning` and `evening` sections independently by comparing `submitted_at`.
- `pullAllEntries()` / `pullAllMoments()` — full-history merge (not overwrite) into IndexedDB.
- `bootstrapDrive()` — searches Drive for an existing `Mosaic/` folder before creating one, specifically "for cross-device support."
- `hydrateToday()` — merges remote into local on every app open.

Separately, the `syncQueue` object store (`lib/db/schema.ts`) and its accessors (`enqueueSyncItem`, `getPendingSyncItems`, `removeSyncItem`) are fully wired in the schema but **never called anywhere**. Every push site (`Morning`, `Evening`, `MomentCapture`) does:

```ts
silentSignIn().then(() => pushEntry(updated)).catch(console.warn)
```

A failed push today just disappears into the console. Nothing retries it.

**Decision:** commit to the multi-device merge model that's already mostly built, finish it properly, and build the retry queue for real rather than deleting it. Both `06` and `08` are updated to reflect this — "single-device" and "Drive wins" language is removed.

---

## 1. Conflict resolution model

**Rule: merge, never blind-overwrite, at the granularity each file naturally supports.**

| File | Merge granularity | Logic |
|---|---|---|
| `entries/YYYY-MM-DD.json` | Section (`morning` / `evening`) | Keep whichever section has the newer `submitted_at`. Already correct in `mergeEntry()` — no change needed. |
| `moments/YYYY-MM-DD.json` | Individual moment (`id`) | Union by `id`. Already correct in `pullAllMoments()` / `hydrateToday()` — no change needed. |
| `media/{id}.{ext}` | Whole file | Immutable once written (a moment's photo is never edited in place) — no merge needed, only a presence check before re-upload. |
| `meta.json` | Whole file | Last-write-wins is acceptable — it's device-local config (display name, notification times) that a user edits on one device at a time. Not worth field-level merging. |

This means the existing merge functions are the correct, final design — they don't need rewriting. What's missing is making them run **automatically and periodically**, not just on manual "Sync with Drive" tap.

---

## 2. Sync triggers

| Trigger | Function | Scope | When |
|---|---|---|---|
| App open (every time) | `hydrateToday()` | Today's entry + moments only | Already wired in `App.tsx`. No change. |
| App open (periodic) | `syncFromDrive()` (entries + moments, full history) | All days | **New.** Run if `now - meta.last_synced_at > 6 hours`. Keeps a second device's older edits flowing in without requiring a manual tap, without hammering the Drive API on every single open. |
| Reconnect | `flushSyncQueue()` (see §3) | Whatever's queued | **New.** `window.addEventListener('online', ...)` in `App.tsx`. |
| Manual | `fullSync()` (Settings screen) | All days, both directions | Unchanged — still useful as a user-visible "force it now" escape hatch. |
| On write | `pushEntry` / `pushMoments` / `pushMedia` | That one file | Unchanged (optimistic push after local write) — but now falls into the queue on failure instead of `console.warn`. |

6 hours is a starting number, not a hard constraint — cheap to tune later. The cost is 2 Drive `files.list` calls (entries + moments folders) plus N `files.get` calls for whatever changed, which is well inside the 1,000 req/100s rate limit noted in `06`.

---

## 3. Retry queue

### Why the current `syncQueue` schema needs one change

```ts
// current — lib/db/schema.ts
interface SyncQueueItem {
  id: string
  operation: 'write' | 'upload'
  path: string
  payload: string        // ← breaks for photo uploads, which are Blobs
  created_at: string
  retries: number
}
```

`payload: string` works for `pushEntry`/`pushMoments` (JSON-serializable) but not `pushMedia` (a `Blob`). IndexedDB can store Blobs natively via `idb`, so widen the type:

```ts
interface SyncQueueItem {
  id: string
  operation: 'entry' | 'moments' | 'media'   // renamed from write/upload — matches the 3 push functions 1:1
  path: string                                // e.g. "entries/2026-07-01.json" or "media/{id}.jpg"
  payload: string | Blob                      // JSON string for entry/moments, Blob for media
  created_at: string
  retries: number
}
```

### Enqueue on failure

Each push site wraps its existing call:

```ts
silentSignIn()
  .then(() => pushEntry(updated))
  .catch(() => enqueueSyncItem('entry', 'entries/' + updated.date + '.json', JSON.stringify(updated)))
```

Same pattern for `pushMoments` (`'moments'`) and `pushMedia` (`'media'`, payload = the `Blob` directly).

### Flush algorithm — `flushSyncQueue()` (new, in `operations.ts`)

```
1. items = getPendingSyncItems()
2. if items.length === 0 → return
3. Coalesce: group by `path`, keep only the newest `created_at` per path.
   (Entry/moment pushes are whole-file overwrites — replaying stale
   intermediate versions is wasted work and can even reintroduce data
   the merge already superseded.)
4. For each surviving item, in created_at order:
     try: replay via the matching push function (pushEntry / pushMoments / pushMedia)
          → removeSyncItem(item.id) on success
     catch: increment retries; if retries >= 5, drop it (log, don't loop forever)
            on a dead file — surface this in Settings as a "sync problem" state) 
5. Call after: (a) hydrateToday on app open, (b) 'online' event, (c) after a manual fullSync.
```

Step 4's "drop after 5" is the one place this needs a product decision later: silently dropping data after repeated failure is a real loss for a journaling app. For now, surfacing a count in Settings ("2 items failed to sync") is enough — a full "offline write queue UI" is explicitly still deferred per `08`.

---

## 4. What does NOT change

- `lib/drive/client.ts` — the raw Drive API wrapper is fine as-is.
- `lib/drive/fileIndex.ts` — file ID caching is fine as-is.
- `mergeEntry`, `pullAllEntries`, `pullAllMoments`, `hydrateToday`, `pushAllToDrive`, `fullSync` — all correct, keep as-is.
- The `useSyncStore` status enum (`idle` / `syncing` / `error`) is enough for now; it just needs to also flip to `syncing` during the new periodic full sync and queue flush, not only during `hydrateToday`.

---

## 5. Done when

- A write made while offline survives an app close/reopen and lands on Drive automatically once back online, with no manual tap required.
- A second device's edit from more than 6 hours ago shows up on the first device's next open without hitting "Sync with Drive."
- Photo uploads recover from a dropped connection the same way JSON writes do.
- `06_Technical_Architecture.md` and `08_MVP_Roadmap.md` no longer say "Drive wins" or "single device."
