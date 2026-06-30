
# Mosaic - Product Design Notes (Draft v0.1)

> Working document summarizing our design discussions before implementation.

---

# Vision

**Mosaic** is a personal repository for a life.

It is built for a single user.

It is not intended to become a mass-market wellness app.

The goal is to create something that Future Me will appreciate years from now.

Core philosophy:

> The goal is not to remember every day.
> The goal is to notice every day.

---

# Product Philosophy

Mosaic is inspired by Git.

Not because life should feel like software, but because Git has an elegant philosophy:

- Preserve history
- Small commits
- Never overwrite the past
- Build something meaningful one change at a time

Conceptual mapping:

| Git | Mosaic |
|-----|---------|
| Repository | Your life |
| Commit | A completed day |
| Commit Message | Daily summary |
| History | Timeline |
| Branch | Long-running life project (future) |
| Release | Major life milestone (future) |

The app should borrow Git's philosophy, **not** its visual style.

---

# What Mosaic Is

- Personal memory operating system
- Daily reflection tool
- Quantified-self tracker
- Memory archive
- AI-assisted life analysis

# What Mosaic Is NOT

- Habit tracker
- Productivity app
- Calendar
- Social network
- Generic journal

---

# Core Principles

- Capture > Organize
- Numbers tell how
- Memories tell why
- AI augments memory
- Preserve history
- Tiny interactions
- Human first
- Beautiful but lightweight

---

# Three Daily Rhythms

## Morning

Purpose:

Orient yourself before the day begins.

Fields:

- Mood
- Energy
- Anxiety
- Excitement
- Today's intention
- Today's priority
- One thing to notice today

---

## Throughout the Day

Everything is logged as a Moment.

Moment types discussed:

- Beautiful Thing
- Photo
- Gratitude
- Anxiety
- Idea
- Quote
- Insight
- Conversation
- Reading
- Music
- Workout
- Coffee
- Place
- Achievement

Target interaction:

5–10 seconds.

Capture first.

Organize later.

---

## Evening

Commit the day.

Metrics:

- Spark
- Mood
- Sleep
- Coffee
- Exercise
- Reading
- Deep Work

Reflection:

- Biggest win
- Biggest challenge
- What energized me?
- What drained me?
- One sentence journal
- Commit message
- Day title

---

# Data Categories

## Quantitative

- Sleep duration
- Coffee
- Exercise
- Reading time
- Screen time
- Deep work
- Mood
- Energy
- Anxiety
- Water (optional)

These become graphs and trends.

---

## Qualitative

- Photos
- Journal
- Gratitude
- Ideas
- Beautiful moments
- Conversations
- Quotes
- Insights

These become searchable memories.

---

# AI Vision

AI never edits raw memories.

Instead it:

- Finds patterns
- Generates monthly reports
- Summarizes weeks and months
- Connects similar memories
- Enables semantic search
- Builds a long-term narrative

Monthly questions AI should answer:

- When did I feel most alive?
- What changed this month?
- What contributed to my Spark?
- Which people shaped this month?
- What should Future Me remember?

---

# Architecture

Three independent systems:

```
UI
 ↓
GitHub Storage
 ↓
Local AI Analysis
```

Responsibilities:

App:
- Capture
- Browse
- Search
- Display reports

GitHub:
- Source of truth
- Version control
- Backup

Local AI:
- Embeddings
- Reports
- Insights
- Pattern detection

---

# Repository Structure

```
mosaic/

app/

data/
    entries/
    events/
    media/
    analysis/

scripts/

docs/
```

---

# Data Model (Initial)

## Daily Entry

One file per day.

Contains:

Morning

- Mood
- Energy
- Anxiety
- Excitement
- Intention
- Priority

Evening

- Spark
- Mood
- Sleep
- Coffee
- Reading
- Exercise
- Deep Work
- Reflection
- Commit Message
- Day Title

---

## Moment

Independent object.

Fields:

- id
- date
- time
- type
- text
- photo (optional)
- tags
- emotion (optional)
- location (future)

Reason:

Allows searching all moments without loading every daily entry.

---

## Media

Photos stored separately.

Moments reference media.

---

## Analysis

Generated.

Never manually edited.

Contains:

- Reports
- Trends
- Embeddings
- Correlations

---

# MVP Pages

1. Home
2. Morning Check-in
3. Add Moment
4. Evening Commit
5. Timeline
6. Day View
7. Insights
8. Search
9. Settings

---

# User Experience

Morning

→ Open Mosaic
→ Set intention

During day

→ Press +
→ Capture moments in seconds

Night

→ Reflect
→ Commit the day

---

# Future Ideas (Parking Lot)

Ideas intentionally postponed:

- Vault / Worth Remembering
- Branches
- Releases
- Working Tree
- Monthly Pull Requests
- Animated commit graph
- Advanced AI memory retrieval
- Rich semantic relationships
- Timeline comparisons

These are exciting but should not be part of the initial MVP.

---

# Documentation Plan

```
docs/

00_Manifesto.md
01_Product_Vision.md
02_Design_Principles.md
03_User_Flows.md
04_Information_Architecture.md
05_Data_Model.md
06_Technical_Architecture.md
07_UI_Specification.md
08_MVP_Roadmap.md
99_Parking_Lot.md
```

---

# Development Philosophy

Design first.

Code second.

The order should be:

Vision
↓
Philosophy
↓
User Flows
↓
Information Architecture
↓
Data Model
↓
Technical Architecture
↓
UI Specification
↓
Implementation

The objective is to remove ambiguity before writing code.

---

# Success Metric

The MVP succeeds if:

"I naturally open Mosaic every morning and every evening for at least 30 days."

Not because I force myself to.

Because I want to.
