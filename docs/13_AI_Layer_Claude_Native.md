
# 13 — AI Layer: Claude-Native (Decision Record)

> Written 2026-07-02. Replaces the vision doc's undefined "Local AI Analysis" box with a concrete, zero-infrastructure design. Verified today: Claude (Pro plan, Google Drive connector) can read the live `Mosaic/` folder directly — entries, moments, and meta were read during this session, and the read even surfaced a real sync bug (`11_Sync_Integrity_and_Mobile_Performance.md`). No download/upload step is needed.

---

## The split: deterministic in-app, narrative in Claude

**Numbers the app computes; meaning Claude writes.** Rationale: streaks, averages, and charts are deterministic, cheap, and wanted *daily and offline* — they belong in the app (lean Phase 3 stays). Pattern-finding, correlation-with-context, and narrative ("what should Future Me remember about this month?") need a mind reading the words, not just the numbers — and building that in-app means API keys, cost, and prompt plumbing for something that runs once a week. Claude already has Drive access; the app's only job is to render what Claude writes back.

| Layer | Runs | Produces |
|---|---|---|
| In-app Insights (lean) | On device, instant, offline | Streak, days-this-month, 7/30/90d charts (Spark, Sleep, Mood+Energy, Anxiety), moments/day, coffee & nicotine counts |
| Claude weekly report | Cowork scheduled task, Mondays | `analysis/weekly/YYYY-Www.json` written to Drive |
| Claude monthly report | Cowork scheduled task, 1st of month | `analysis/monthly/YYYY-MM.json` written to Drive |

AI never edits raw data (vision doc rule). `analysis/` is generated-only; the app treats it as read-only.

---

## Report file schema

One JSON file per report, in the existing Drive folder, human-readable like everything else:

```json
{
  "kind": "weekly",
  "period": "2026-W28",
  "generated_at": "2026-07-13T03:00:00Z",
  "title": "the week the sync finally held",
  "body_md": "## How the week felt\n...",
  "highlights": [
    { "date": "2026-07-09", "moment_id": "1752…-a3f2", "why": "…" }
  ],
  "metrics_echo": { "spark_avg": 7.2, "days_committed": 6 },
  "questions": ["You logged anxiety 4× on work days but never weekends — what's different?"]
}
```

`body_md` is the report (markdown). `highlights` point back at real moments so the app can link them. `questions` are prompts the user may answer as journal entries — the report talks *back*. `metrics_echo` lets the app sanity-check that Claude read the right period.

### Weekly report content (light pulse, ~1 min read)

How the week felt (from evening reflections + moments, not just numbers) · 2–3 resurfaced moments worth re-seeing · one pattern or correlation observed · one question.

### Monthly report content (retrospective, ~5 min read)

Answers the vision doc's five questions directly: When did I feel most alive? What changed this month? What contributed to Spark? Which people shaped the month? What should Future Me remember? Plus: threads that look like emerging branches (long-running stories), and a one-paragraph "letter to Future Me."

---

## Operational setup (no app code)

Two Cowork scheduled tasks (owner sets these up once in a Claude session):

1. **Weekly** — cron `0 8 * * 1` (Mon 8am): read last 7 days of `entries/` + `moments/` from Drive, write `analysis/weekly/YYYY-Www.json` per schema, keep `body_md` grounded in actual quoted moments (no invented events; if a claim can't be tied to a file, drop it).
2. **Monthly** — cron `0 8 1 * *`: same over the calendar month, write `analysis/monthly/YYYY-MM.json`.

Notes: the Drive connector writes via `create_file`; the task prompt must include the schema and the folder ID. If a week has <3 committed days, the report should say so honestly rather than pad. Privacy is accepted by decision: journal content already lives in Google Drive; reports route it through Claude under the same account owner.

---

## In-app rendering (small, Phase 5)

The Insights screen gains a **Reports** section below the charts: list of report cards (kind, period, title), tap → rendered markdown view, `highlights` rendered as tappable MomentCards deep-linking to Day View. Reports sync down through the existing pull path (add `analysis/` to `buildFileIndex` + periodic sync). Empty state: "Your first weekly report arrives Monday."

## Acceptance criteria

- Monday's task produces a valid `analysis/weekly/` file with every `highlights.moment_id` resolving to a real moment.
- The app renders it offline after one sync, and a tapped highlight opens the right Day View.
- The user reads the weekly report and at least once captures a moment/journal answering one of its `questions` — the loop closing is the point.
