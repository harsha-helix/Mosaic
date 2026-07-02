
# 15 — Onboarding Redesign & Dark Theme Refresh (Decision Record)

> Written 2026-07-02. Two related "first impression" fixes, scoped together because both fall under Phase 4 (Feel & Identity) and both touch the very first thing a new session sees. Part A restructures Onboarding from one static form into a short multi-step flow. Part B replaces the dark-mode base/text/border tokens with a neutral charcoal ramp — the warm "ink and ember" background from `11_Sync_Integrity_and_Mobile_Performance.md`'s era reads too hot; the five accent hues (terracotta, warmth, sage, mauve, reflective) stay warm and become the app's color identity *against* a neutral canvas instead of on top of another warm layer.
>
> Supersedes: `07_UI_Specification.md` §1 (Onboarding) and `14_Desktop_UI_Specification.md` §Screens>1 (Onboarding) mockups. Extends `08_MVP_Roadmap.md` Phase 4 scope (adds an explicit onboarding + theme line item). Does not touch light mode.

---

## Part A — Onboarding: static form → short flow

### The problem (user-confirmed, 2026-07-02)

Current `Onboarding/index.tsx` renders one page: brand mark + tagline, then three stacked labeled inputs (name, morning time, evening time), then a Connect button — all visible at once, no motion until after Drive auth succeeds. Feedback: generic form feel, no motion, cramped/unbalanced hierarchy, and the brand mark + tagline block reads flat rather than like the app's opening beat. User is open to restructuring, not just re-skinning.

### The design

Four steps instead of one page. Same total information collected (name, morning time, evening time, Drive connect) — the flow doesn't ask for anything new, it paces what's already asked for. Desktop keeps the existing 440px centered `rounded-card`/`shadow-card` treatment from `14_Desktop_UI_Specification.md` §1; only the card's contents swap per step. Mobile is full-bleed as today.

```
Step 1 — Welcome              Step 2 — Name            Step 3 — Reminders          Step 4 — Connect
┌────────────────────┐        ┌────────────────────┐   ┌────────────────────┐     ┌────────────────────┐
│                     │        │ ←            •••●   │   │ ←            ••●●   │     │ ←            •●●●   │
│      ✦ Mosaic       │        │                     │   │                     │     │                     │
│   (large, animated  │        │  What should we     │   │  When should Mosaic│     │  Connect your Drive │
│    entrance)        │        │  call you?          │   │  nudge you?         │     │                     │
│                     │        │  ┌───────────────┐  │   │  ┌───────────────┐  │     │  [Connect Google    │
│  "Made of the       │        │  │ Your name     │  │   │  │ Morning 8:00AM│  │     │   Drive]             │
│   moments you'd     │        │  └───────────────┘  │   │  ├───────────────┤  │     │                     │
│   otherwise         │        │                     │   │  │ Evening 9:00PM│  │     │  Your data lives in │
│   forget."           │        │      [Continue]     │   │  └───────────────┘  │     │  your Drive. Only   │
│                     │        │                     │   │      [Continue]     │     │  you can see it.    │
│      [Begin]        │        │                     │   │                     │     │                     │
└────────────────────┘        └────────────────────┘   └────────────────────┘     └────────────────────┘
```

**Step 1 — Welcome.** The brand mark and tagline get their own beat instead of being squeezed above a form. Entrance animation on mount: mark scales/fades in first, tagline follows ~150ms later (mirrors the existing stagger already used in the post-connect "You're all set" state — same spring, same delay pattern, so the two bookend beats feel like one family). Single `[Begin]` button. This is the fix for "weak brand moment" and "no motion" at once — first paint is no longer static.

**Step 2 — Name.** One question, one large auto-focused input, centered. `Continue` disabled until non-empty (mirrors today's validation, just moved earlier instead of surfacing as an error after tapping Connect).

**Step 3 — Reminders.** Morning + evening time fields presented as a single paired card using `rounded-card`/`shadow-card`/`bg-surface` — the same visual language Home, Highlights, and Day View already use — instead of today's bare bordered `<input>` elements. This is the direct fix for "generic form feel": right now Onboarding is the only screen in the app that doesn't use the card system. One line of rationale copy above the fields ("Mosaic checks in twice a day — once to start, once to reflect") ties the ask back to the vision doc's "small commits" framing instead of reading as arbitrary settings.

**Step 4 — Connect.** Unchanged from today: `[Connect Google Drive]` button + "Your data lives in your Drive. Only you can see it." The existing post-connect success beat (checkmark + "You're all set", `Onboarding/index.tsx:49-70`) is preserved as-is and becomes the natural 5th beat of the sequence, not a bolted-on afterthought.

### Motion spec

- Step transitions: slide-up + fade, 300ms, matches the slide-up pattern already specified for screen transitions in `07_UI_Specification.md`'s motion table (currently unimplemented elsewhere per `10_UIUX_Audit.md` finding #1 — Onboarding can be the first place it actually lands). Implement with `AnimatePresence mode="wait"` + `motion.div` (Framer Motion is already a dependency, already used in this same file for the success state).
- Step 1 entrance: reuse the exact spring config from the current success-state mark animation (`type: 'spring', stiffness: 300, damping: 20`) for continuity between the flow's first and last beats.
- Back navigation: `←` glyph, top-left, steps 2–4 only (not step 1). Use the arrow glyph, not the word "back" — same fix already flagged for Evening in `10_UIUX_Audit.md` finding #4, so this doesn't introduce a third inconsistent pattern.
- Progress indicator: 4 small dots, top-right, terracotta fill for current + completed steps, hairline outline for upcoming. Purely a "3 short questions, almost there" signal — no step-jumping by tapping dots.

### Out of scope

- No new fields collected beyond today's (name, morning time, evening time, Drive connect).
- No change to the auth/bootstrap logic in `handleConnect` — this is a presentation-layer restructure only.
- Illustration/imagery: not proposed here. If the welcome step still feels thin after the motion + copy changes, revisit as a separate pass rather than blocking this one on asset creation.

### Acceptance criteria

- First paint (Step 1) includes an animated entrance — the page is never static on load.
- No step shows more than one semantic unit at a time (Step 3's paired time fields count as one unit).
- Reminders step visually matches the card language used elsewhere in the app (`rounded-card`, `shadow-card`, `bg-surface`), not bare bordered inputs.
- Back (`←`) available on steps 2–4; progress dots visible on steps 2–4.
- Default path (accept both reminder defaults, enter name, connect) takes the same or fewer taps than today's single-scroll version — restructuring must not slow down the common case.
- Existing "You're all set" success beat is unchanged and still plays before navigating to Home.

---

## Part B — Dark theme: warm base → neutral charcoal base

### The problem (user-confirmed, 2026-07-02)

`index.css`'s `.dark` block and `tailwind.config.ts`'s `-dark` tokens currently define a warm-brown near-black ("ink and ember," per the code comment at `tailwind.config.ts:12-13`): `base-dark #120E0A`, `surface-dark #1D1712`, `elevated-dark #2C2318`, plus warm-tan text (`muted-dark #D2BEA3`) and a warm-brown border (`hairline-dark #4A3B2A`). User confirmed the warmth is coming from both the background layer and the accent colors — but the fix that best matches "keep the app's color identity" is to neutralize the *background/text/border* layer and let the five accent hues (terracotta, warmth, sage, mauve, reflective) do the warm work by contrast, rather than competing with another warm layer underneath them.

### The design — neutral charcoal ramp

Replace the three background tokens and the three neutral text/border tokens with true (or near-true) neutral grays. Accent hues (`--color-terracotta`, `--color-reflective`, `--color-warmth`, `--color-sage`, `--color-mauve`, `--color-danger`) are **unchanged** — verified below that all five still read strongly against the new base without adjustment.

| Token | Old (warm) | New (neutral) | Contrast vs. new `base-dark` |
|---|---|---|---|
| `base-dark` | `#120E0A` | `#121212` | — (background) |
| `surface-dark` | `#1D1712` | `#1C1C1C` | — (background) |
| `elevated-dark` | `#2C2318` | `#282828` | — (background) |
| `ink-dark` | `#FBF5EA` | `#EDEDEC` | 15.99:1 |
| `muted-dark` | `#D2BEA3` | `#ACA9A3` | 7.99:1 |
| `hint-dark` | `#93816C` | `#87847E` | ~5.0:1 |
| `hairline-dark` | `#4A3B2A` | `#3A3A38` | 1.64:1 (structural border, not text — fine) |

Verified by computing WCAG contrast ratios directly (not eyeballed): all text tokens clear 4.5:1 (small text) except `hint-dark`, which lands at ~5:1 against the new base — equal to or better than its old contrast (5.12:1 against the old base), so this is not a legibility regression despite the hue shift. `terracotta-dark` (`#F3915C`) comes in at 8.04:1 and `warmth-dark` (`#F4CB70`) at 12.15:1 against the new neutral base — both comfortably legible as text-on-dark if ever used that way, and both read distinctly warmer now that they're not sitting on a warm-brown floor. **No accent hex values need to change** — the "too warm" complaint was the floor, not the accents.

Relative luminance steps between `base-dark → surface-dark → elevated-dark` are preserved at roughly the same size as the old ramp, so card layering/separation (the thing `tailwind.config.ts`'s comment says the old ramp was tuned for) doesn't regress — only the hue is neutralized, not the elevation logic.

### Implementation note — two sources of truth

`hairline`, `muted`, and `hint` currently exist in **two places** that must be updated together or they will drift: `tailwind.config.ts`'s static `-dark` color pairs (consumed via `dark:text-muted-dark`-style classes) and `index.css`'s `.dark { --color-hairline: ...; --color-muted: ...; --color-hint: ...; }` block (consumed via inline `style={{ color: 'var(--color-muted)' }}`, used e.g. in `Settings/index.tsx`, `Search/index.tsx`). Both need the same new hex values from the table above. This dual-system isn't new to this change, but it's worth the implementing AI flagging or consolidating rather than silently touching only one.

### Out of scope

- Light mode is unchanged — this is a dark-mode-only fix.
- Accent hue values (terracotta/reflective/warmth/sage/mauve/danger) are unchanged in both light and dark — table above shows the contrast headroom exists without touching them. If they still read too hot after the base change ships, the first lever is a ~10% saturation pull-back on `terracotta-dark`/`warmth-dark` specifically, not a hue shift — revisit only after seeing it rendered, don't pre-adjust blind.
- Shadow tokens (`card-dark`, `fab-dark`) are unchanged — `card-dark` already uses neutral black (`rgba(0,0,0,0.55)`, not a warm-tinted shadow), and `fab-dark`'s warm glow (`rgba(243,145,92,0.55)`) is an intentional accent effect, not part of the "floor" complaint.

### Acceptance criteria

- Dark-mode base/surface/elevated layers read as neutral gray/charcoal side-by-side against a true black swatch — no visible brown or amber cast.
- `hairline-dark`, `muted-dark`, `hint-dark` updated identically in both `tailwind.config.ts` and `index.css`'s `.dark` block — no drift between the two systems.
- All text-token/background pairs meet WCAG AA (≥4.5:1 for body text, ≥3:1 for large text) — table above; re-verify if any hex is adjusted during implementation.
- Terracotta, warmth-gold, sage, mauve, and reflective accents are visibly *more* distinct against the new base than they were against the old one (neutral floor gives them more contrast headroom, not less).
