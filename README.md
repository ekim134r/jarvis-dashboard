# Jarvis Dashboard

> **The architect's workspace for human-AI collaboration.**
> Not a chat interface. Not a task app. A command center for directing autonomous agents across multiple projects — with a plan-first philosophy and full visibility into what's running.

---

## What this is

You're the boss. You define goals, review plans, make decisions. Jarvis (your AI agent) does the work. This dashboard is where that handoff happens — clearly, intentionally, without noise.

The core loop:
1. **Define** a goal for a project
2. **Jarvis creates a plan** — task breakdown, subagent assignments, timeline
3. **You review and approve** — or adjust before execution starts
4. **Jarvis executes** — subagents run in parallel across projects
5. **You check in** — the dashboard shows what happened, what needs you, what's blocked

Everything Telegram-worthy (logs, routine updates, finish notifications) goes to Telegram. The dashboard is for decisions and oversight — not for reading wall-of-text logs.

---

## The 4 Project Spaces

The dashboard organizes all work into four fixed workspaces:

| Space | Purpose |
|-------|---------|
| **Personal** | Self-improvement, daily life, habits |
| **Luminos** | Main SaaS product — the big thing |
| **Side Projects** | Ideas, experiments, quick wins |
| **OpenClaw** | AI infrastructure, agent setup, Jarvis itself |

Tasks belong to a space via `projectId` or `projectType`. Within each space: missions (active goals), progress rings, and drill-down detail.

---

## Navigation (5 screens, that's it)

| Screen | What it is |
|--------|-----------|
| **Home** | Command center — what happened, what needs you, live agent status |
| **Projects** | All 4 spaces, progress rings, missions drill-down |
| **Brain** | What Jarvis knows — research, labs, preferences, experiments |
| **Canvas** | Excalidraw infinite canvas for visual thinking |
| **System** | Health, integrations, skills, scripts, cronjobs |

No feature creep. No "let me navigate to the sixth submenu to find this thing."

---

## Stack

```
Framework:    Next.js 14 (App Router)
Language:     TypeScript (strict)
Styling:      Tailwind CSS + custom CSS variables
Database:     JSON file (data/db.json) — zero dependencies
Canvas:       Excalidraw
Deployment:   Docker on VPS
Notifications: Telegram webhook
Memory/RAG:   Supermemory-compatible API on :9001
```

---

## Quick Start

```bash
# Install
npm install

# Dev server
npm run dev

# Dev server on LAN (for tablet/phone access)
npm run dev -- --hostname 0.0.0.0 --port 3000

# Production build
npm run build && npm start
```

Visit `http://localhost:3000`.

---

## Environment Variables

```bash
# Database (default: ./data/db.json)
JARVIS_DB_PATH=/var/lib/jarvis/db.json

# Memory/RAG API (Supermemory-compatible)
MEMORY_API_URL=http://127.0.0.1:9001

# FS Lock (security)
FS_LOCK_TOKEN=your-secret-token
```

Copy `.env.local.example` to `.env.local` and fill in values.

---

## Deployment (VPS)

The dashboard runs in Docker on a VPS. See `INTEGRATION.md` for full deployment docs.

```bash
ssh root@your-vps
cd /opt/apps/jarvis-dashboard
docker logs -f jarvis-dashboard-jarvis-dashboard-1
```

Health check: `GET /api/health` → `{ "status": "ok" }`

---

## Key Docs

| File | What it covers |
|------|---------------|
| [`DESIGN.md`](./DESIGN.md) | Visual design system, principles, component patterns |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md) | Technical architecture, component tree, data flow |
| [`WORKFLOW.md`](./WORKFLOW.md) | Human-AI collaboration workflow, mission lifecycle |
| [`OPENCLAW.md`](./OPENCLAW.md) | API manifest for Jarvis/agents to interact with the dashboard |
| [`TELEMETRY.md`](./TELEMETRY.md) | Telemetry integration docs |
| [`AGENTS.md`](./AGENTS.md) | Coding conventions for AI agents contributing to this repo |
