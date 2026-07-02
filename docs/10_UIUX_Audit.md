
# 10 — UI/UX Audit (2026-07-01)

> Findings from reading every screen and shared component against `07_UI_Specification.md`, `04_Information_Architecture.md`, and the roadmap in `08_MVP_Roadmap.md`. Scope: Phases 0–2.5 (everything currently built). Phase 3 (Insights) and Phase 4 (Notifications) are stubs/unbuilt, so they're noted but not audited in depth.

---

## Summary

The build is faithful to the spec on layout, color tokens, and copy — tokens (colors, radii, fonts) are wired correctly through Tailwind and used consistently. The gaps are concentrated in three places: the "signature" motion moments the spec singles out as the app's personality (Day Glyph, mosaic tile drop, screen transitions) were never built; captured photos disappear after capture because nothing reads them back from Drive; and the same moment-card UI has been rewritten four separate times with small drifts between each copy. None of these are hard fixes, but they're the difference between "a form that saves JSON" and the "lively, vibrant, alive" feeling the spec explicitly asks for.

---

## 1. Missing signature moments

These are called out by name in the spec as the things that make Mosaic feel different from a generic form. None are implemented yet.

**Day Glyph** (spec §3, Morning Check-in). The 4-axis radar shape that's supposed to render on "Save morning," shrink into the Today status strip, and then get reused as the day's visual signature in Day View and Highlights — doesn't exist anywhere in the code. `MorningScreen` saves and navigates straight to `/` with no intermediate visual at all. This is the single most-repeated visual idea in the spec (it's referenced in three different screens) and currently has zero implementation.

**Today mosaic tile strip** (spec §4, Moment Capture). The spec's Home mockup replaces the moment count with an actual row of colored tiles, one per moment captured that day, with a tile animating from the Save button into the strip on capture. `HomeScreen` currently renders `{momentCount} moments` as plain text (line 126-128 of `Home/index.tsx`), and `MomentCapture.handleSave` calls `onClose()` with no animation at all — the sheet just vanishes. This is the app's stated MVP seed for the "lifetime mosaic grid" long-term vision; right now there's no mosaic anywhere in the mosaic app.

**Screen/sheet transitions** (spec, Motion table). The spec specifies slide-up screen transitions (300ms), spring bottom-sheet open (250ms), and spring dismiss (200ms). `App.tsx` uses plain `react-router-dom` `Routes`/`Route` with no transition layer (no Framer Motion, no View Transitions API, nothing), so every navigation is an instant cut. `MomentCapture`'s bottom sheet is conditionally rendered with fixed positioning and no enter animation — it pops in instantly rather than sliding up. Given how much of the spec's "feel" is carried by motion, this is worth prioritizing over new features.

**Commit Ceremony** (spec §5) is the one piece of signature motion that *is* built, and it's close: terminal type-out + confetti + fade both exist in `Evening/index.tsx`. Two deviations from spec worth a look: the spec's step 1 is "button pulses → screen fades to black," which isn't present (it cuts straight to the dark screen), and the terminal lines currently appear a full line at a time on a 400ms interval rather than character-by-character, so it reads more like a slideshow than a typing effect.

---

## 2. Captured photos are never shown again

`MomentType` moments can carry a `media_id`, and `MomentCapture` uploads the file to Drive via `pushMedia`. But grepping the whole `src/` tree for `<img>` turns up exactly one instance — the live preview inside the capture sheet itself (`MomentCapture.tsx:157`). Once a photo moment is saved:

- Highlights' `MomentCard` doesn't render it (spec's mockup explicitly shows a photo thumbnail in the card).
- Search's `ResultCard` doesn't render it.
- Day View's `CompactMomentCard` doesn't render it.
- Home's "Last beautiful thing" card doesn't render it, even though the spec mockup shows a thumbnail there specifically.

`readFileBytes(fileId)` already exists in `lib/drive/client.ts` and is unused outside of media upload — the retrieval half was never wired to any screen. For an app whose whole premise is "capture first, look back later," this means the Photo moment type is currently a dead end once you leave the capture sheet. This is the highest-impact fix in this audit relative to effort — the plumbing exists, it just needs a thumbnail component and something to resolve `media_id` → object URL (with an IndexedDB or in-memory cache so it isn't re-fetched from Drive every render).

---

## 3. Component duplication (four MomentCards)

There's a dedicated `components/MomentCard/MomentCard.tsx`, but it's dead code — nothing imports it. Instead, `Highlights`, `Search`, and `DayView` each define their own inline card:

| Screen | Component | Text size | Padding | Shadow | Type indicator |
|---|---|---|---|---|---|
| `components/MomentCard` (unused) | `MomentCard` | 15px | 16px | yes | emoji |
| Highlights | inline `MomentCard` | 14px | 16px | yes | colored dot |
| Search | `ResultCard` | 14px | 16px | yes | colored dot |
| Day View | `CompactMomentCard` | 13px | 12px | **no** | colored dot |

Three of the four have converged on the same pattern (dot + label, not emoji), which is good — but the fact that convergence happened by copy-paste rather than a shared component means any future change (say, adding the photo thumbnail from finding #2) has to be made in three places by hand, and Day View has already silently drifted (no shadow, tighter padding, smaller text). Recommend consolidating into one `MomentCard` with a `variant: 'default' | 'compact'` prop — the compact variant already exists in spirit as `CompactMomentCard`, it just needs to move into the shared component and pick up the shadow for consistency, or a documented reason why Day View is deliberately flatter (it's read-only/dense, which is a reasonable design rationale — worth making it an explicit variant rather than an accidental one).

---

## 4. Smaller spec deviations, screen by screen

**Home.** The Today status strip reads `● Morning · N moments · Evening ●` — functional, but note the dot placement is asymmetric (dot *before* "Morning", dot *after* "Evening"), which reads a little oddly next to each other. The evening emoji is 🏙️ where spec calls for 🌆; both land in "evening cityscape" territory so this is minor. More substantively: the 7-day averages and "last beautiful thing" queries (`getAllEntries()`, `getAllMoments()`) load the *entire* history on every Home mount rather than the last-7-days slice the IA doc specifies — fine at current data volume, but worth capping with a date-range query before this becomes a habit that slows Home down as the journal grows over months.

**Morning / Evening.** Both match the spec's field list and MetricCircles usage closely. Evening's back button reads the literal word "back" instead of an arrow glyph (`←`), which is inconsistent with Morning's back button on the same nav pattern one screen over — small but easy to fix.

**Onboarding.** Spec calls for a "brief success state" between Drive auth succeeding and navigating to Home; current code calls `setSignedIn` and navigates immediately after `syncFromDrive()` resolves. Given first-run is a one-time impression, a half-second checkmark/confetti beat here would cost little and set the tone the spec is going for.

**Settings.** This screen has diverged the most from `07_UI_Specification.md` — and for a defensible reason: the spec's Settings (notification times, Drive connection, name field) predates the sync-hardening work from Phase 2.5, and the shipped version replaced it with Account / Sync (with pending-item count, manual sync, reconnect) / About / Sign out. Functionally this is a reasonable pivot given how much sync debugging has happened recently (see git log — most of the last 10 commits touch sync). But the spec doc itself hasn't been updated to reflect it, and two things that *are* in the spec are now missing entirely: editable morning/evening reminder times, and an editable display name. Worth a decision: either restore those fields to Settings, or update `07_UI_Specification.md` to match reality so the spec stays a trustworthy reference (this is also flagged in `08_MVP_Roadmap.md`'s Known Issues — reminder times are hardcoded to 08:00/21:00 regardless of what Onboarding collects).

**Insights.** Not built — literally a "Coming soon" placeholder. Expected, since this is Phase 3 on the roadmap, not a regression.

**RememberToggle.** Spec's motion table calls for "wiggle + color pop" on toggle; implementation does a scale pop only (1 → 1.2), no wiggle/rotation. Low effort to add if the wiggle is wanted, or worth quietly dropping from the spec if scale-only reads better in practice (worth a quick before/after check rather than assuming the spec is right by default).

---

## 5. What's working well (keep doing this)

Worth naming explicitly so it doesn't get lost in a list of gaps: color tokens, spacing, and border-radius are pulled from `tailwind.config.ts` correctly everywhere — there's no ad-hoc hex drift across screens. `MetricCircles` matches the spec's pixel spec exactly (28px circles, 6px gap, tap-to-fill-N, tap-again-to-clear). FAB position and size match spec to the pixel (`bottom-20 right-6` = 80px/24px, `w-14 h-14` = 56px). The offline-first sync architecture (IndexedDB first, background Drive push, retry queue) is more robust than the original spec called for and is a genuine strength, not a gap.

---

## Prioritized recommendations

Roughly in order of impact-for-effort, not strict priority:

1. **Wire up photo playback.** `readFileBytes` already exists — add a thumbnail component that resolves `media_id` to a cached object URL, and use it in Highlights, Search, Day View, and Home's "last beautiful thing" card. This directly un-breaks a moment type that's currently write-only.
2. **Consolidate the four MomentCard implementations** into one shared component with `default`/`compact` variants, and delete the unused one in `components/MomentCard/`. Do this *before* adding the photo thumbnail so it only needs to be added once.
3. **Build the Day Glyph.** It's referenced in three places in the spec (Morning save, Today strip, Day View header) and currently exists in none of them — this is the single highest-leverage missing piece for making the app feel distinctive rather than form-like.
4. **Add a lightweight transition layer** (Framer Motion or CSS view-transitions) for route changes and the MomentCapture sheet's open/dismiss. Even just the bottom-sheet slide-up would close a lot of the "feels like a form" gap, since it's the most-used interaction in the app (every moment capture touches it).
5. **Build the Today mosaic tile strip** on Home — pairs naturally with #4 since the tile-drop animation needs a transition layer to land well.
6. **Reconcile Settings with the spec** — either restore reminder-time/name editing, or update `07_UI_Specification.md` so it stops being stale. Low effort either way, but leaving it silently diverged will compound confusion later (especially since Phase 4 notifications depend on reminder times being correct — already flagged in the roadmap's Known Issues).
7. **Small polish pass**: Evening's "back" → "←" for consistency with Morning; Onboarding success beat before navigating to Home; decide on RememberToggle wiggle.

Insights (Phase 3) and Notifications (Phase 4) aren't included above since they're net-new builds, not refinements — happy to scope either as a separate task.
