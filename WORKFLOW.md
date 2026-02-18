# Workflow — Human-AI Collaboration

> How Mika and Jarvis work together. The philosophy, the daily rhythm, the mission lifecycle.
> This document defines the intended usage patterns — not just what the dashboard does, but *how* it's meant to be used.

---

## The Core Mental Model

**You are the architect. Jarvis is the execution team.**

An architect doesn't write every line of code or design every pixel. They define the vision, review the plans, make the decisions that require judgment, and sign off on the work. The team executes.

The dashboard is your architectural interface. You see the building at a glance. You drill into a section when something needs attention. You don't need to read every log to know if things are on track.

---

## Daily Rhythm

### Morning (5–15 minutes)

The Night Shift Report is waiting on the Home view.

```
NIGHT SHIFT REPORT                          Since yesterday 10pm

✓  Luminos auth-flow — 4 tasks completed
✓  OpenClaw: new skill installed (research-v2)
✗  Side project: test suite failed (2 errors → see details)
⚡  9 agent runs · 84k tokens · $1.20

[Dismiss]
```

You scan this in 30 seconds. You know what happened. If something failed, you tap "details" to see the log summary. You don't read raw logs — Jarvis summarizes them.

**Then:** Check the "Needs You" queue. These are decisions that Jarvis is waiting on before continuing. Approve, reject, or redirect each one. Takes 2–5 minutes.

### During the Day (on demand)

You have an idea or a new goal. You open the dashboard:

1. Go to **Projects → [relevant space]**
2. Click **"+ New Mission"**
3. Describe the goal in one sentence
4. Wait for Jarvis to generate a plan (30–60 seconds)
5. Review the plan — adjust if needed
6. Approve → Jarvis starts executing

You close the dashboard and go do your creative work. Jarvis handles the execution.

### Evening (5 minutes)

Before logging off:
- Check **Needs You** — clear the queue so Jarvis isn't blocked overnight
- Check **Projects** — anything at 100% that needs your sign-off?
- Optional: create new missions for overnight execution

---

## The Mission Lifecycle

Every goal follows this sequence:

```
DEFINE → PLAN → REVIEW → EXECUTE → DONE → REPORT
```

### 1. Define

You write one sentence. Not a spec. Not a requirements doc. One sentence:

> "Implement the complete auth flow for Luminos including Google SSO"

That's enough. Jarvis asks clarifying questions if needed — in the dashboard, not via chat.

### 2. Plan

Jarvis generates a structured plan:

```
Mission: Luminos Auth Flow
──────────────────────────────────────────
Subagent 1: Google OAuth setup           ~45min
Subagent 2: Session management           ~1h
Subagent 3: Frontend auth UI             ~2h  ← depends on 1+2
Subagent 4: Tests + deployment           ~30min
──────────────────────────────────────────
Total: ~4.5h  ·  3 subagents parallel
Deadline check: By tomorrow 8am ✓
```

The plan shows dependencies, estimated time, which subagents handle which part. You can see immediately if the approach makes sense.

### 3. Review

This is the critical step. **The plan is shown to you before anything starts.**

You can:
- **Approve** → execution begins immediately
- **Edit** → change priorities, reassign subagents, adjust scope
- **Reject** → explain what's wrong, Jarvis replans
- **Defer** → save for later (mission status: "Queued")

This review step exists because the biggest failure mode in AI work is *executing in the wrong direction for 4 hours*. Five minutes of review prevents that.

### 4. Execute

After approval, Jarvis starts running subagents. You see:

```
Luminos Auth Flow                              [In Progress]

● Subagent 1: Google OAuth      ████████████  Done ✓
● Subagent 2: Session mgmt      ████░░░░░░░░  Running (40%)
○ Subagent 3: Frontend UI       ░░░░░░░░░░░░  Waiting (blocked by 2)
○ Subagent 4: Tests             ░░░░░░░░░░░░  Queued
```

The dashboard shows this without you having to do anything. If a subagent gets blocked or fails, it appears in "Needs You" with a specific question.

### 5. Done + Report

When all subagents complete, the mission moves to Done and a summary is sent to Telegram:

```
✅ Luminos Auth Flow — Complete
Time: 3h 47min · Cost: $4.20 · 156k tokens
3/4 tasks passed tests ⚠️  1 item needs review
→ Dashboard: [link]
```

The summary stays in the Night Shift Report for the next morning review.

---

## The Decision Queue ("Needs You")

The most important part of the dashboard. Things here block Jarvis from continuing.

Types of decisions that appear here:

| Type | Example |
|------|---------|
| **Design choice** | "Option A (minimal) or Option B (full-featured)?" |
| **Approval needed** | "Plan for Luminos v2 ready — approve to start" |
| **Blocked task** | "Task X blocked by missing API key — provide or skip?" |
| **Review request** | "Auth PR ready — please review before deploy" |
| **Clarification** | "Should the new feature target mobile first or desktop?" |

Each item shows:
- What's blocked / waiting
- Enough context to decide without digging
- Action buttons: Approve, Reject, Comment

Clear the queue before going offline. A blocked decision = a blocked subagent = wasted overnight capacity.

---

## Multi-Project Execution

Jarvis runs all 4 project spaces in parallel. There's no "focus on one thing at a time" constraint — that's a human limitation, not an AI one.

What this means in practice:

```
Personal:        Running  — "Daily review synthesis" (cron, every morning)
Luminos:         Running  — "Auth flow" mission (3 subagents active)
Side Projects:   Idle     — Last mission completed yesterday
OpenClaw:        Running  — "Research agent v2" (1 subagent)
```

The Projects view shows this at a glance. Each space has its own progress ring — you see which projects are moving and which are idle.

**Rule:** Each project space has at most one "active mission" at a time. Multiple missions can be queued, but only one runs — this prevents subagent conflicts and keeps context clean.

---

## What Goes on Telegram vs. What Stays on the Dashboard

| Goes to Telegram | Stays on Dashboard |
|-----------------|-------------------|
| Task completed | Project progress % |
| Task failed + summary | Decisions waiting |
| Agent stuck (needs you) | Mission plan for review |
| Night shift summary | Activity charts |
| Routine check-ins | Memory/preferences |
| Deployment results | System health |

**Principle:** Telegram is push (Jarvis → you). Dashboard is pull (you → Jarvis). You open the dashboard when you want to work. Telegram interrupts you when something needs attention.

---

## Human in the Loop — Non-Negotiable

Autonomous AI without human oversight drifts. The dashboard enforces a human-in-the-loop workflow through structure:

1. **Plan review before execution** — nothing starts without approval
2. **Visible "Needs You" queue** — decisions can't silently pile up
3. **Night shift report** — you see everything that happened
4. **Preference calibration** — Jarvis learns your taste over time, but you always see what it learned

The goal is not to remove yourself from the process. The goal is to be involved at the *right level* — strategy and decisions, not implementation details.

---

## The "Video Editor" Mental Model

As a video editor, you're used to:
- **Non-linear timelines** — working on multiple scenes in parallel without losing the whole
- **Preview before render** — seeing the output before committing
- **Keyboard shortcuts for everything you do 100x/day** — friction kills creativity
- **Visual feedback** — color, shape, and position carry meaning without reading text

The dashboard is designed with this mental model:
- **Projects view** = the timeline — parallel tracks visible at a glance
- **Plan review** = preview before render — you see the output before Jarvis commits to it
- **Status dots, progress rings, color-coded spaces** = visual feedback without text
- **5-item navigation** = the tools you use every session, not every tool ever built

---

## Memory and Taste Calibration

Over time, Jarvis learns what you like. The **Preferences** view (Brain → Taste) is where this happens:

- Jarvis proposes options (A vs. B)
- You swipe left/right or tap to choose
- Each choice is stored with context and confidence
- Next time Jarvis makes a similar decision, it references this history

This isn't a one-time setup — it's an ongoing calibration. Every design choice you make teaches Jarvis your aesthetic. Every rejected plan tells it what approach to avoid.

Think of it as training a junior designer who gets better with every project they work on for you.

---

## Common Failure Modes (and How to Avoid Them)

| Failure | Cause | Prevention |
|---------|-------|-----------|
| Jarvis goes wrong direction | Vague goal definition | Write goals as outcomes, not processes |
| Queue backs up | Not reviewing "Needs You" | Clear queue before logging off |
| Subagents conflict | Two missions touching same code | One active mission per project space |
| Context lost between sessions | No memory/RAG integration | Memory service must be running on :9001 |
| Wasted compute overnight | No plan review | Never skip the plan review step |
| Dashboard feels overwhelming | Too many screens open | Use the 5-screen navigation, hide the rest |
