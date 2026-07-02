
# 12 — Capture UX: Grouped Grid (Decision Record)

> Written 2026-07-02. Redesigns the Moment Capture type picker. User verdict on the current picker: "14 items feels like a lot, but all seem important." Decision: **keep all 14 types visible, organize them into semantic groups** so the eye scans a group first, then a type — two small scans instead of one big one. No type is removed, no extra tap is added.

---

## The problem

The current bottom sheet presents 14 types as one undifferentiated grid. Recognition time grows with list size when items are unordered; grouping restores near-constant scan time because the user learns *where* a type lives ("coffee is bottom-left") rather than searching the whole grid each time. The <10s capture budget from the vision doc is mostly spent in this picker today.

## The design

Four groups, ordered by capture frequency (most-reached-for group first). Same bottom sheet, same tap-to-open behavior — only the layout changes.

```
┌────────────────────────────────────┐
│  What kind of moment?              │
│                                    │
│  MIND                              │
│  💡 Idea   ✨ Insight              │
│  🙏 Gratitude   😟 Anxiety         │
│                                    │
│  WORLD                             │
│  🌸 Beautiful   📷 Photo           │
│  🌍 Place   🎵 Music               │
│                                    │
│  WORDS & PEOPLE                    │
│  ❤️ Conversation  📖 Quote  📚 Reading │
│                                    │
│  BODY                              │
│  ☕ Coffee   🚬 Nicotine   🏃 Workout │
└────────────────────────────────────┘
```

| Group | Types | Rationale |
|---|---|---|
| **Mind** | idea, insight, gratitude, anxiety | Inner states and thoughts — the most journal-like captures |
| **World** | beautiful, photo, place, music | Things noticed outside yourself |
| **Words & People** | conversation, quote, reading | Language coming in from others |
| **Body** | coffee, nicotine, workout | Physical, countable, often logged with no text |

### Layout spec

- Group label: 11px uppercase, tracking-wide, muted color (same token as existing section labels), 12px top margin between groups.
- Type cells: unchanged visual (emoji + label), 4-per-row grid within a group (3 for the 3-item groups), same tap targets (min 44px).
- The sheet grows slightly taller; it must still fit without inner scrolling on a 640px-tall viewport. If it can't, tighten cell padding before allowing scroll.
- Group order and membership are **fixed** (no frecency reordering) — spatial memory is the whole point; a stable layout is what makes the 5th use faster than the 1st.

### Quick-log for Body types

Body types (coffee, nicotine, workout) are usually logged with no text. For these three only: tapping the type **immediately saves** a text-less moment with a brief confirmation flourish (tile flies to status strip once the mosaic strip from `10_UIUX_Audit.md` exists; until then, a toast "☕ logged · add note?"). Tapping "add note" on the toast opens the normal capture screen pre-typed. This takes the most frequent captures from ~4 taps to 2 (FAB → type) without removing the ability to annotate.

All other types keep the current flow: type → capture screen (text, photo, Remember toggle) → save.

### Out of scope

- No type removal, no renames, no new types.
- No auto-classification of text → type (revisit only if grouped grid still feels slow after 2+ weeks of real use).

## Acceptance criteria

- All 14 types reachable in ≤2 taps from FAB; body types saved in exactly 2 taps.
- Sheet renders grouped with stable ordering; no scrolling needed at 360×640.
- A month from now the user reports reaching for types by *position* without reading labels — that's the success signal for grouping.
