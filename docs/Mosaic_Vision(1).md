
# Mosaic

> **Version control for a life well lived.**

## Vision

Mosaic is **not** a wellness tracker.

It is not a productivity app.
It is not another habit tracker.
It is a personal repository for your life.

**Mission**

> The goal is not to remember every day.  
> The goal is to notice every day.

Life is made of tiny moments that rarely feel important in isolation:

- A conversation
- A photograph
- A cup of coffee
- An anxious afternoon
- A beautiful sunset
- An idea scribbled in a hurry

Over months and years, those moments become a mosaic.

---

# Philosophy

Mosaic borrows the philosophy of Git rather than its appearance.

## Preserve history

Never overwrite yesterday.

If your perspective changes, add a new reflection rather than rewriting the old one.

History is valuable.

## Small commits

Interactions should be tiny.

- Morning: ~2 minutes
- Throughout the day: 5–15 second captures
- Evening: ~3 minute reflection

## Capture > Organize

When inspiration strikes, don't make the user decide where it belongs.

Press **+**. Capture it. Organize later.

## Numbers tell *how*.

## Memories tell *why*.

Both matter.

---

# Three Daily Rhythms

## 🌅 Morning

Purpose: orient yourself.

Fields:

- Mood
- Energy
- Anxiety
- Excitement
- Today's intention
- Today's priority
- One thing to notice today

---

## ☀️ Throughout the Day

Everything is a **Moment**.

Possible moment types:

- 📷 Photo
- 🌸 Beautiful thing
- 💡 Idea
- 🙏 Gratitude
- 😟 Anxiety
- ❤️ Conversation
- 📚 Reading
- 🎵 Music
- 📖 Quote
- 🏃 Workout
- ☕ Coffee
- 🌍 Place
- ✨ Insight

Each should take less than 10 seconds to log.

---

## 🌙 Evening

End the day with a **commit**.

Metrics:

- Spark
- Mood
- Sleep
- Coffee
- Reading
- Exercise
- Deep work

Reflection:

- Biggest win
- Biggest challenge
- What energized me?
- What drained me?
- One sentence journal
- Commit message
- Title for the day

---

# Git Inspired Concepts

## Every day is a commit

```text
feat: noticed beauty in ordinary places

+ 1 beautiful moment
+ 2 ideas
+ 1 gratitude
~ Sleep updated
~ Coffee updated
```

## Branches

Long-running stories.

Examples:

- Thesis
- Reading
- Fitness
- Photography
- Startup
- Moving Abroad

## Releases

```text
v5.0 - Started IITM Thesis
v6.0 - Graduated
v7.0 - Moved Abroad
```

## History

A chronological log of your life.

Not just metrics.

A story.

---

# Data Categories

## Quantitative

- Sleep
- Coffee
- Water
- Exercise
- Reading
- Screen time
- Deep work
- Mood
- Energy
- Anxiety

## Qualitative

- Photos
- Ideas
- Gratitude
- Journal
- Quotes
- Conversations
- Beautiful moments
- Insights

---

# Architecture

```text
        Mosaic

           │

 ┌─────────┼─────────┐
 │         │         │
UI      GitHub      Local AI
App     Storage     Analysis
```

The app collects.

GitHub stores.

The local AI understands.

---

# Repository Layout

```text
mosaic/
├── app/
├── data/
│   ├── entries/
│   ├── events/
│   ├── media/
│   └── analysis/
├── scripts/
├── docs/
└── README.md
```

---

# Product Statement

Mosaic is a repository for a human life.

It combines the structure of Git, the warmth of a journal, the curiosity of a scientist, and the perspective of a future biographer.

Every photo.
Every idea.
Every anxious afternoon.
Every quiet victory.

Each becomes another tile.

Over months and years, those tiles reveal the picture that no single day ever could.
