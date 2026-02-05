# OpenClaw Integration Manifest

This document describes the Agent Interface for the Jarvis Dashboard.
Bots and external agents (OpenClaw) should use the following endpoints to interact with the system.

## 1. Agent State (Context Window)
**Endpoint:** `GET /api/agent/state`
**Description:** Returns a high-level snapshot of the current system state, optimized for LLM context windows. Use this to "orient" yourself before taking action.

**Response Structure:**
```json
{
  "system": { "timestamp": "...", "mode": "production" },
  "metrics": { "total_open_tasks": 12, "high_priority_load": 3 },
  "focus_queue": [ ... ],
  "active_experiments": [ ... ],
  "pending_preferences": [ ... ]
}
```

## 2. Command Execution
**Endpoint:** `POST /api/agent/command`
**Description:** A unified RPC-style endpoint to perform actions on the dashboard.

### Supported Actions:

#### `create_task`
Creates a new task in the default (or specified) column.
```json
{
  "action": "create_task",
  "payload": {
    "title": "Review PR #102",
    "priority": "High",
    "description": "Check for security flaws",
    "tags": ["dev", "security"]
  }
}
```

#### `log_experiment`
Logs a new hypothesis to the Experiment Tracker.
```json
{
  "action": "log_experiment",
  "payload": {
    "title": "Dark Mode A/B Test",
    "hypothesis": "Dark mode will increase dwell time by 10%",
    "metric": "Avg Session Duration",
    "tags": ["ux"]
  }
}
```

#### `add_preference_card`
Adds a new card to the "Tinder" Decision Deck.
```json
{
  "action": "add_preference_card",
  "payload": {
    "prompt": "Migrate to Tailwind v4?",
    "leftLabel": "Wait",
    "rightLabel": "Upgrade",
    "notes": "• Better performance
• Breaking changes"
  }
}
```

## 3. Batch Processing (Cost Optimization)
**Endpoint:** `POST /api/agent/batch`  
**Description:** Queue a task for batch processing via the OpenAI Batch API. The task must be low‑priority (P2/P3), have subtasks, and require a swarm.

```json
{ "taskId": "task_123" }
```

## 4. Batch Queue (Smart Task Shaping)
**Endpoint:** `POST /api/agent/batch/queue`  
**Description:** Auto-merge multiple small tasks into a single batch job to reduce cost.

```json
{ "mode": "merge", "taskIds": ["task_1", "task_2"] }
```

## 5. Routine Cache (Cache-First)
**Endpoint:** `POST /api/agent/routine`  
**Description:** Check cache first, then call LLM for routine tasks. Returns cached responses when available.

```json
{ "key": "weekly-summary", "message": "Summarize this week...", "ttlSeconds": 86400 }
```

## 6. Night Scheduler
**Endpoint:** `POST /api/agent/scheduler/run`  
**Description:** Trigger the batch scheduler within the configured window.
