# Architecture — Jarvis Dashboard

> Technical architecture: how the codebase is structured, how data flows, how components relate.

---

## Overview

```
Next.js 14 (App Router)
├── app/                    Server-side: pages, API routes, layout
├── components/             Client-side: all UI components
│   ├── dashboard/          View-level components (one per screen)
│   │   └── overview/       Sub-components for the Home view
│   └── ui/                 Reusable primitive components
└── lib/                    Utilities, types, database layer
```

The app is a **single-page dashboard** — no client-side routing between views. View state is managed in `SecondBrain.tsx` via a single `activeView` string, persisted to localStorage.

---

## Data Layer

### Database

All persistent data lives in a single JSON file (`data/db.json`). The structure is typed in `lib/types.ts`:

```typescript
type Database = {
  tasks:             Task[]
  columns:           Column[]
  projects:          Project[]
  tags:              Tag[]
  scripts:           Script[]
  preferences:       Preference[]
  experiments:       Experiment[]
  chatThreads:       ChatThread[]
  webhookEvents:     WebhookEvent[]
  usageEvents:       UsageEvent[]
  routineCache:      RoutineCacheEntry[]
  labFrameworks:     LabFramework[]
  labSessions:       LabSession[]
  labResearchPrompts: ResearchPrompt[]
  researchCards:     ResearchCard[]
  agents:            AgentState[]
  letters:           BridgeLetter[]
}
```

**Why JSON?** No infrastructure dependencies. The dashboard runs anywhere Node.js runs. Backups are `cp db.json db.backup.json`. Zero migrations. The tradeoff (no concurrent writes) is acceptable for a single-user tool. The FS lock (`lib/fsLock.ts`) prevents race conditions between concurrent API requests.

### Database Access

```typescript
// lib/db.ts
import { readDb, writeDb } from "@/lib/db"

// Read — returns typed Database, handles missing file gracefully
const db = await readDb()

// Write — persists entire object (replaces file)
await writeDb(db)

// Factory functions create valid objects with defaults
const task = createTask({ title: "My task", columnId: "col_1" })
```

### Encryption

Sensitive task fields (private notes, encrypted numbers) are encrypted at rest using AES-256-GCM via `lib/crypto.ts`:

```typescript
import { encryptString, decryptString } from "@/lib/crypto"
const encrypted = encryptString("sensitive data")
const plaintext = decryptString(encrypted)
```

---

## API Layer

All API routes live under `app/api/` and follow REST conventions.

### Route Structure

```
app/api/
├── tasks/route.ts              GET (list), POST (create)
├── tasks/[id]/route.ts         GET, PATCH, DELETE
├── columns/route.ts            GET, POST
├── agent/
│   ├── state/route.ts          GET — agent context for LLMs
│   ├── command/route.ts        POST — unified RPC for agent actions
│   ├── batch/route.ts          POST — queue batch processing
│   └── scheduler/run/route.ts  POST — trigger night scheduler
├── agents/route.ts             GET — list subagents
├── agents/[id]/state/route.ts  GET — individual agent status
├── preferences/route.ts        GET, POST
├── experiments/route.ts        GET, POST
├── labs/frameworks/route.ts    GET, POST
├── research-cards/route.ts     GET, POST
├── telemetry/summary/route.ts  GET — aggregated telemetry
├── webhooks/[source]/route.ts  POST — incoming webhook events
├── skills/route.ts             GET — list installed skills
├── assets/route.ts             GET, POST
└── health/route.ts             GET — health check
```

### API Conventions

Every route follows this pattern:

```typescript
export async function GET() {
  const db = await readDb()
  return NextResponse.json(db.tasks)
}

export async function POST(request: Request) {
  const body = await request.json()
  if (!body.title) {
    return NextResponse.json({ error: "title required" }, { status: 400 })
  }
  const db = await readDb()
  const task = createTask(body)
  db.tasks.push(task)
  await writeDb(db)
  return NextResponse.json(task, { status: 201 })
}
```

Errors always return `{ error: "message" }` with appropriate HTTP status codes.

---

## Component Architecture

### The State Hub: SecondBrain.tsx

`components/SecondBrain.tsx` is the central state manager. It:
- Fetches all data on mount (`loadAll()`)
- Holds all view state (tasks, columns, tags, scripts, preferences, experiments, agentState)
- Provides callbacks to all views (createTask, updateTask, deleteTask, etc.)
- Renders the active view based on `activeView` state

```
SecondBrain
├── State: tasks, columns, tags, agentState, activeView, ...
├── Sidebar  ← receives activeView + setActiveView
├── main
│   ├── [when activeView="board"]   → OverviewGrid + BoardView
│   ├── [when activeView="projects"] → ProjectsView
│   ├── [when activeView="canvas"]  → CanvasView
│   ├── [when activeView="brain"]   → BrainView (planned)
│   └── ... (each view)
└── ControlPanel  ← receives agentState + tasks + columns
```

**Known issue:** SecondBrain.tsx is ~1400 lines. The roadmap (Task #26) is to split into focused hooks.

### View Components

Each view is a standalone component in `components/dashboard/`. They receive data as props and emit changes via callbacks. No views fetch their own data — everything comes from SecondBrain.

Exception: Some views manage their own internal state (ResearchCardsView, LabsView, AssetsView, SkillsView) and do their own fetching. These are self-contained and don't need the SecondBrain state.

### Overview Sub-Components

The Home view (`activeView="board"`) renders `OverviewGrid` which composes:

```
OverviewGrid
├── OpsBar              — sticky status: jobs, deploy, VPS, gateway, tokens
├── [Hero] AgentStatus  — big status card (active/idle/error + last run)
├── [KPIs] 4-card grid  — open tasks, in-progress, done, tokens
├── [Left]
│   ├── InProgress      — active tasks from "Doing" column
│   ├── NeedsYou        — tasks from "Waiting" column
│   └── StatusChips     — gateway, VPS, memory RAG health
└── [Right]
    ├── RunsList        — recent agent runs, expandable logs
    └── MetricsPanel    — 7-day rolling metrics
```

### ProjectsView Architecture

```
ProjectsView
├── State: selected (SpaceId | null)
├── [if !selected]
│   └── 4× SpaceCard  — progress ring, stats, click to drill
└── [if selected]
    └── SpaceDetail
        ├── Header: back button, space name, progress
        └── Sections by colStatus:
            ├── active  (doing/in-progress column)
            ├── waiting (waiting/blocked column)
            ├── queue   (next column)
            ├── inbox   (inbox column)
            └── done    (done column)
```

Task→Space assignment is handled by `matcher` functions in `SPACES` config. Tasks match a space by `projectId`, `projectType`, or `tags`. Unmatched tasks appear in the "Unassigned" section.

---

## External Integrations

### Memory / RAG System

Jarvis stores conversational memory in a Supermemory-compatible API on `:9001`. The dashboard integrates via `lib/memory/`:

```
lib/memory/
├── index.ts      — public API (recall, capture, remember, pipeline, profile)
├── recall.ts     — search memories before AI response
├── capture.ts    — extract and store facts after AI response
├── pipeline.ts   — wraps recall+capture in a MemoryPipeline class
└── profile.ts    — UserProfile: persistent facts about the user
```

If the memory service is unavailable, all operations fail gracefully (no dashboard crash).

### n8n Workflow Automation

Two n8n workflows in `n8n/`:
- `canvas-upload.workflow.json` — triggers when canvas is exported
- `luminos-intake.workflow.json` — handles Luminos intake form submissions

n8n connects via webhooks. The dashboard receives events at `/api/webhooks/[source]`.

### Telegram

Live activity reports, task completions, and error alerts go to Telegram. This is intentional — the dashboard is for decisions, Telegram is for notifications. The integration is configured in `IntegrationsView`.

---

## Security

### FS Lock

`lib/fsLock.ts` implements a session-based file system lock. Sensitive API endpoints (skills edit, git commit) require a valid session token. Prevents unauthorized writes from unauthenticated requests.

### Encrypted Fields

Task fields marked sensitive (`privateNote`, `encryptedValue`) are encrypted with AES-256-GCM before storage. The key is derived from `ENCRYPTION_KEY` env var.

### Secret Scanning

The skills git commit endpoint (`/api/skills/git/commit`) scans staged files for potential secrets (API keys, passwords) before committing. Rejects commits containing detected secrets.

---

## State Management Philosophy

**No external state library.** React `useState` + `useEffect` + prop passing is sufficient for a single-user dashboard. The component tree is shallow enough that prop drilling isn't a problem in practice.

The planned refactor (Task #26) moves state into custom hooks, not a state management library:
```typescript
// Planned — not yet implemented
const { tasks, createTask, updateTask, deleteTask } = useTasks()
const { agentState } = useAgentState()
const { columns } = useColumns()
```

This keeps everything in plain React while making SecondBrain.tsx maintainable.

---

## Performance Notes

- **No SSR for the dashboard** — all data is fetched client-side after mount. The JSON DB is too fast locally for SSR to matter.
- **content-visibility: auto** on view shells improves paint performance when many views exist.
- **No images in critical path** — glass UI is pure CSS, no image loading delays.
- **Polling** — `agentState` is polled every 30s. Everything else is loaded once on mount and updated optimistically on mutations.

---

## File Reference

```
components/
  SecondBrain.tsx               Main state hub, renders all views
  dashboard/
    Sidebar.tsx                 72px icon rail navigation
    ControlPanel.tsx            Right panel: agent status + decisions
    DashboardHeader.tsx         Search bar + project switcher (board view)
    ProjectsView.tsx            4 project spaces + drill-down
    BoardView.tsx               Kanban drag-drop board
    PlannerView.tsx             Capacity planning + focus queue
    PreferencesView.tsx         Tinder-style taste calibration
    ExperimentsView.tsx         Hypothesis tracking
    ResearchCardsView.tsx       BROM research cards
    LabsView.tsx                Research framework builder
    AssetsView.tsx              Design assets library
    SkillsView.tsx              Install + edit + commit AI skills
    ScriptsView.tsx             Shell command library
    IntegrationsView.tsx        n8n + API key configuration
    TelemetryView.tsx           AI health metrics
    CanvasView.tsx              Excalidraw infinite canvas
    overview/
      OverviewGrid.tsx          Home view layout
      OpsBar.tsx                Sticky system status bar
      RunsList.tsx              Agent run history + logs
      MetricsPanel.tsx          7-day rolling metrics
      TaskStatsCards.tsx        4 KPI cards
      AgentStatusCard.tsx       Agent online/idle/error status
      ActivityChart.tsx         24h activity distribution
  ui/
    Badges.tsx                  PriorityBadge, StatusBadge, OwnerBadge (planned)
    Skeletons.tsx               Loading state components
    ToastProvider.tsx           Toast notification context
    ErrorBoundary.tsx           Error boundary (planned)

lib/
  types.ts                      All TypeScript types
  db.ts                         Database read/write + factory functions
  crypto.ts                     AES-256-GCM encryption
  fsLock.ts                     File system lock for concurrent access
  memory/                       RAG memory system integration
  utils/
    display.ts                  Shared: timeAgo, formatTokens, colStatus (planned)
```
