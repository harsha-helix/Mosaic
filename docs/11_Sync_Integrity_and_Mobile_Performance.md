
# 11 — Sync Integrity & Mobile Performance (Decision Record)

> Written 2026-07-02 after inspecting the live Drive folder and the sync code. Supersedes nothing — extends `09_Sync_Architecture.md`. This phase exists because the user's stated pains are "data seemed to vanish," "auth churn," and "the phone is laggy and images don't sync." All three are traced to concrete causes below. **This is the highest-priority work — trust in the data underpins everything else.**

---

## Evidence (observed 2026-07-02)

Reading the live `Mosaic/` Drive folder directly:

- **8 duplicate `meta.json` files** at the folder root, created 2026-07-01 04:02 → 2026-07-02 04:25. Each has a different `created_at`; the newest has `last_synced_at == created_at` (a fresh bootstrap reset).
- `entries/` is clean — exactly one file per day. The corruption is confined to `meta.json`.
- Only one `Mosaic/` root folder exists (no folder split-brain yet, but the same bug class could produce one).

## Root cause

The bug chain in `lib/drive/operations.ts` (`bootstrapDrive`) and `lib/drive/fileIndex.ts`:

1. `bootstrapDrive()` step 3 decides whether `meta.json` exists by calling `getFileId('meta.json')` — **a lookup against the local IndexedDB file index only**. It never checks Drive, even though step 2's `listFolder(mosaicId)` response already contains the root file listing.
2. `buildFileIndex()` walks only the `entries/`, `moments/`, `media/` subfolders. **Root files are never indexed**, so `meta.json`'s Drive ID can never enter the index from a Drive listing — only from the one device that created it.
3. Therefore every bootstrap on a device with an empty/cleared index (new device, cleared site data, the sign-out → "Reconnect Google Drive" flow that mobile auth churn forces) creates a fresh `meta.json`. Drive permits duplicate filenames, so they accumulate silently.

Consequences: each device reads/writes a *different* `meta.json`, so `last_synced_at` diverges per device — the 6-hour periodic full sync fires (or doesn't) inconsistently, which presents to the user as "data vanishes on the other device until some later moment." Combined with mobile silent-sign-in failures (already bounded by the 8s timeout in `client.ts`), the app can look arbitrary about when it syncs.

---

## Decisions

### D1. `buildFileIndex()` must index root files

Add the `Mosaic/` root listing (already available in `bootstrapDrive` step 2) to the index: `meta.json → fileId`. If multiple `meta.json` entries exist, index the **canonical** one (see D3).

### D2. Bootstrap must be Drive-truth-first and idempotent

In `bootstrapDrive()` step 3, decide existence from the step-2 `children` listing, not from the local index:

```
metaFiles = children.filter(f => f.name === 'meta.json')
if (metaFiles.length >= 1) → canonical = resolve per D3; setFileId('meta.json', canonical.id)
else → create it (only case where creation is allowed)
```

Additionally, guard `bootstrapDrive` with an in-flight promise (module-level mutex) so concurrent callers (app open + first push) can't race two bootstraps.

### D3. One-time repair + permanent dedupe rule for `meta.json`

`repairMeta()` (new, in `operations.ts`), run automatically whenever bootstrap sees more than one `meta.json`:

1. Fetch all copies' content + Drive `createdTime`/`modifiedTime` metadata.
2. Canonical = the copy with the **oldest `created_at`** (preserves the true "when did I start Mosaic" date).
3. Merge into canonical: `display_name` and `notifications` from the **most recently modified** copy (user's latest settings win); `last_synced_at` = now.
4. PATCH canonical, **trash** the rest (Drive trash, not hard delete — recoverable for 30 days).
5. Update file index.

This makes the historic damage self-heal on next app open, and makes the dupe state impossible to persist.

### D4. Media sync reliability + capture-time downscaling

"Images don't sync on the phone" has two contributing causes: multi-MB camera photos uploaded raw over mobile connections, and (pre-Phase-2.5) upload failures being swallowed. Decisions:

- **Downscale at capture, before anything is stored**: canvas resize to max 1600px long edge, JPEG quality 0.8. Typical camera photo drops from 3–8 MB to 200–500 KB. This is both a reliability fix (uploads complete before the mobile browser suspends the tab) and the single biggest phone-perf win.
- **Generate a ~256px thumbnail at capture** and store it in IndexedDB keyed by `media_id`. Every list surface (Highlights, Search, Day View, Home) renders from the local thumbnail — never from a Drive fetch. Full-size image is fetched from Drive only on tap (moment detail), through the existing `mediaCache`.
- Media uploads must go through the Phase-2.5 retry queue (verify `pushMedia` failure path actually enqueues the Blob — this was the stated design in `09`, confirm it's wired).
- **Presence check before replay**: before re-uploading a queued media item, check the file index / Drive for `media/{id}.*` to avoid duplicate media files from retries.

### D5. Auth churn mitigation (mobile)

The 8s-bounded `silentSignIn` is right. Additional decisions, in order of value:

1. **Never block or prompt for reads.** The app is local-first; a missing token only matters for background push. No UI path may hang or nag on a failed silent sign-in — writes queue (already true post-2.5), and a small status chip in Settings (and optionally Home) shows `synced / pending N / needs sign-in`.
2. **Opportunistic refresh on `visibilitychange`**: when the app becomes visible and the token is expired/missing, fire one silent attempt in the background. Mobile silent sign-in succeeds much more often immediately after the user has interacted with the page.
3. **Sign-out must not clear the file index or data stores.** Clearing IndexedDB on sign-out/reconnect is what forced re-bootstraps (→ D2/D3 bug). Reconnect = token refresh only; data and index stay.

### D6. Phone performance budget

Findings already flagged in `10_UIUX_Audit.md` §4 plus new ones:

- `HomeScreen` calls `getAllEntries()` / `getAllMoments()` (full history) on every mount. Replace with **date-range IndexedDB queries** (last 7 days for averages; single newest `remember` moment via an index, not a full scan). This is a hard rule going forward: **no unbounded `getAll*` on any render path.** Search is the only allowed full scan, and it should move to an on-demand scan with a yielding loop.
- Photos render from local thumbnails only (D4) — no Drive fetch on list render.
- `listFolder`/`searchFolder`: add the `pageToken` loop (known issue in `08`), and add `appProperties: { mosaic: 'root' }` on folder creation so future root discovery doesn't depend on listing *all* app files and filtering by name.
- Full-history periodic sync must not run on the UI thread at app-open time in one burst — chunk it (e.g., 10 files at a time, `await` gaps) so first paint and first interaction stay fast on a mid-range Android phone.

### D7. Fix notification-times persistence (carried from `08` Known Issues)

`Onboarding` must pass its collected times through to `bootstrapDrive(displayName, notifications)` (the parameter already exists — the call site drops it), and Settings gets editable morning/evening times + display name back (per audit finding), writing via `updateMeta`.

---

## Acceptance criteria

- Fresh device sign-in against existing Drive data results in **zero** new files created at the Mosaic root; `created_at` in `meta.json` never changes.
- After the repair runs once, exactly one `meta.json` exists (others in Drive trash), and both devices read/write the same file ID.
- A photo captured on the phone appears (as a thumbnail) on the laptop after its next sync, and no media file exists twice in `media/`.
- Home mounts without reading full history; interaction is smooth on the phone (subjective bar: no visible jank on open, capture sheet opens instantly).
- Sign-out → sign-in on the phone does not re-onboard, re-bootstrap, or lose the pending queue.
