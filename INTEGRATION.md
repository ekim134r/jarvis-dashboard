# Jarvis Dashboard Integration Guide

This guide documents the connection points for integrating external tools and agents with the Jarvis Dashboard. The dashboard exposes a clean REST interface via Next.js Route Handlers under `app/api/*`.

If you are building an “Agent Code tool” or external automation, **start with `OPENCLAW.md`**. It is the canonical contract for the agent interface and should be treated as the primary spec.

---

## 1. Quick Start

1. Start the dev server: `npm run dev`
2. Base URL (local): `http://localhost:3000`
3. Health check: `GET /api/health`

---

## 2. API Index (Connection Points)

### Core Entities

**Columns**
- `GET /api/columns`
- `POST /api/columns`  
  Body: `{ title, key?, order? }`
- `GET /api/columns/:id`
- `PATCH /api/columns/:id`  
  Body: `{ title?, key?, order? }`
- `DELETE /api/columns/:id`

**Tasks**
- `GET /api/tasks`
- `POST /api/tasks`  
  Body: `{ title, columnId, priority?, tags?, description?, notes?, sensitiveNotes?, privateNumbers?, checklist?, definitionOfDone?, links?, estimateHours?, dueDate?, dependencies?, impact?, effort?, confidence?, swarmRequired?, processingMode?, batchJobId? }`
- `GET /api/tasks/:id`
- `PATCH /api/tasks/:id`  
  Body: Any task field above (same shape as create).
- `DELETE /api/tasks/:id`

**Tags**
- `GET /api/tags`
- `POST /api/tags`  
  Body: `{ label, color? }`
- `GET /api/tags/:id`
- `PATCH /api/tags/:id`  
  Body: `{ label?, color? }`
- `DELETE /api/tags/:id`

**Scripts**
- `GET /api/scripts`
- `POST /api/scripts`  
  Body: `{ name, command, description?, tags?, favorite? }`
- `GET /api/scripts/:id`
- `PATCH /api/scripts/:id`  
  Body: `{ name?, command?, description?, tags?, favorite? }`
- `DELETE /api/scripts/:id`

**Preferences**
- `GET /api/preferences`
- `POST /api/preferences`  
  Body: `{ prompt, leftLabel?, rightLabel?, tags?, notes? }`
- `GET /api/preferences/:id`
- `PATCH /api/preferences/:id`  
  Body: `{ prompt?, leftLabel?, rightLabel?, tags?, notes?, decision?, confidence? }`
- `DELETE /api/preferences/:id`

**Experiments**
- `GET /api/experiments`
- `POST /api/experiments`  
  Body: `{ title, hypothesis?, metric?, status?, result?, startDate?, endDate?, owner?, tags?, notes? }`
- `GET /api/experiments/:id`
- `PATCH /api/experiments/:id`  
  Body: `{ title?, hypothesis?, metric?, status?, result?, startDate?, endDate?, owner?, tags?, notes? }`
- `DELETE /api/experiments/:id`

**Labs**
- `GET /api/labs/frameworks`
- `POST /api/labs/frameworks`  
  Body: `{ title, goal?, context?, screenType?, outputFormat?, outputLength?, aiTemplate?, questions?, assetRequests? }`
- `GET /api/labs/frameworks/:id`
- `PATCH /api/labs/frameworks/:id`
- `DELETE /api/labs/frameworks/:id`
- `GET /api/labs/sessions`
- `POST /api/labs/sessions`  
  Body: `{ frameworkId, title?, answers?, notes? }`
- `GET /api/labs/sessions/:id`
- `DELETE /api/labs/sessions/:id`
- `GET /api/labs/prompts`
- `POST /api/labs/prompts`  
  Body: `{ title, objective?, outputFormat?, outputLength?, prompt?, response? }`
- `GET /api/labs/prompts/:id`
- `PATCH /api/labs/prompts/:id`
- `DELETE /api/labs/prompts/:id`

**Live Chat**
- `GET /api/chat`  
  Returns recent chat threads (most recent first).
- `POST /api/chat`  
  Body: `{ message, threadId?, modelMode?, thinkingLevel? }`
  - `modelMode`: `flash | flash-reasoning | pro`
  - `thinkingLevel`: `low | medium | high` (clamped by policy)
  - Rate‑limited via `MOLTBOT_RATE_LIMIT_RPM`
  - Budget‑capped via `MOLTBOT_DAILY_TOKEN_BUDGET`

---

## 3. Agent-Specific Endpoints (OpenClaw Contract)

### `GET /api/agent/state`
Returns a compact “context window” snapshot designed for LLMs:
- System metadata
- High-level metrics
- Focus queue
- Active experiments
- Pending preference cards

### `GET /api/agent/data`
Returns the full `AgentState` object used by the dashboard UI.

### `POST /api/agent/command`
Unified RPC-style endpoint for common actions.

Supported actions:
- `create_task`
- `log_experiment`
- `add_preference_card`
- `list_tasks`

Example payload:
```json
{
  "action": "create_task",
  "payload": {
    "title": "Review PR #102",
    "priority": "P1",
    "tags": ["dev", "security"]
  }
}
```

### `POST /api/agent/batch`
Queues a task for batch processing via the OpenAI Batch API.  
Requires: `swarmRequired=true`, low priority (P2/P3), and at least one subtask.

Body:
```json
{ "taskId": "task_123" }
```

Response:
```json
{ "ok": true, "batchId": "batch_...", "fileId": "file_...", "model": "gpt-4o-mini" }
```

### `POST /api/agent/batch/queue`
Auto-merge small eligible tasks into a single batch request (cost saving).

Body:
```json
{ "mode": "merge", "taskIds": ["task_1", "task_2"] }
```

### `POST /api/agent/scheduler/run`
Triggers the night batch scheduler (respects `MOLTBOT_BATCH_WINDOW_*`).

### `POST /api/agent/routine`
Cache-first routine task runner. Checks cache before calling the LLM.

Body:
```json
{ "key": "weekly-summary", "message": "Summarize this week...", "ttlSeconds": 86400 }
```

Response:
```json
{ "ok": true, "cached": true, "key": "weekly-summary", "value": "..." }
```

---

## 4. MCP Layer (Single Source of Truth)

**Manifest**
- `GET /api/mcp/manifest`

**Tasks**
- `GET /api/mcp/tasks`  
Returns tasks + columns + tags.

**Files**
- `GET /api/mcp/files`  
Uses `MOLTBOT_STABLE_CONTEXT_FILES` to list stable files.  
Add `?include=content` to embed file contents.

**Logs**
- `GET /api/mcp/logs`  
Returns usage events, alerts, and webhook activity.

---

## 5. Integrations (n8n)

**Connection test**
- `POST /api/integrations/n8n/test`
  Body: `{ baseUrl, apiKey, authMode }`
  - `authMode`: `"header"` or `"bearer"`
  - Response includes `ok`, `status`, and a `probe` path.

---

## 6. Connections

**Telegram**
- `POST /api/integrations/telegram/webhook`
  - Optional secret: `TELEGRAM_WEBHOOK_SECRET` sent in `x-telegram-bot-api-secret-token`

**GitHub**
- `POST /api/integrations/github/webhook`
  - Optional secret: `GITHUB_WEBHOOK_SECRET` using `x-hub-signature-256`

**Calendar**
- `POST /api/integrations/calendar/webhook`

**Generic Webhooks**
- `POST /api/webhooks/:source`
  - Set `x-event-type` header to classify events.

---

## 7. Data Model Reference

The canonical types live in `lib/types.ts`:
- `Task`, `Column`, `Tag`, `Script`, `Preference`, `Experiment`
- `AgentState` for the agent dashboard
- `LabFramework`, `LabSession`, `LabResearchPrompt` for the Labs engine

Tasks include encrypted fields:
- `sensitiveNotes`
- `privateNumbers`

These are encrypted at rest via `lib/crypto.ts` and decrypted on read. For persistent encryption across restarts, set `JARVIS_DB_KEY` to a 32‑byte key in hex or base64.

---

## 8. Error Handling + Retries

- `4xx` = invalid request or missing entity
- `5xx` = server failure or JSON parsing error
- Preferred client behavior:
  - Optimistic UI updates
  - Rollback on failure
  - Retry with exponential backoff for network errors

---

## 9. Model Routing + Thinking Policy

- **Routing modes:** `flash`, `flash-reasoning`, `pro`
- **Policy clamp:**
  - `flash` → always `low`
  - `flash-reasoning` → `medium` max
  - `pro` → `high` allowed
- **Local router (optional):** If `OLLAMA_ROUTER_URL` is set, the server can ask Ollama to choose a mode when none is provided.

---

## 10. Session Init + Prompt Caching

- On each chat session, only **SOUL**, **IDENTITY**, and **USER** are loaded into the system prompt.
- Stable context files can be preloaded via `MOLTBOT_STABLE_CONTEXT_FILES` (comma‑separated paths). These are cached in memory by file mtime and reused across requests.

---

## 11. Agent Code Tool Alignment

The **AI Coding Starter Kit** README positions the kit as a minimal, production‑ready agentic coding starter kit and a universal template. It highlights plug‑and‑play agent config, flexible stack selection, support for modern tools, and built‑in best practices. Align your Agent Code tool with the following:

1. Start from the **OpenClaw contract** (`OPENCLAW.md`) for agent operations.
2. Treat **Route Handlers** as the integration boundary — use `/api/agent/state` to orient before issuing actions.
3. Use **idempotent actions** where possible (e.g., check for duplicates before `create_task`).
4. Run the dashboard locally during development and validate with `/api/health`.

If you want deeper alignment (prompt templates or additional repo files), add those files or raw links and extend this guide.

---

## 12. Environment Variables

- `OPENAI_API_KEY`: Required for `/api/agent/batch` and `/api/chat`
- `JARVIS_BATCH_MODEL` (optional): Override batch model (default `gpt-4o-mini`)
- `MOLTBOT_BATCH_CHUNK_SIZE` (optional): Subtask chunk size for batch splitting
- `MOLTBOT_BATCH_MERGE_MAX_TASKS` (optional): Max tasks merged into a batch
- `MOLTBOT_BATCH_MERGE_MAX_SUBTASKS` (optional): Max subtasks per task in merge mode
- `MOLTBOT_BATCH_WINDOW_START`, `MOLTBOT_BATCH_WINDOW_END` (optional): Scheduler window, `HH:MM`
- `MOLTBOT_MODEL_FLASH`, `MOLTBOT_MODEL_FLASH_REASONING`, `MOLTBOT_MODEL_PRO`
- `MOLTBOT_SOUL`, `MOLTBOT_IDENTITY`, `MOLTBOT_USER`
- `MOLTBOT_STABLE_CONTEXT_FILES` (comma-separated paths)
- `MOLTBOT_ROUTINE_TTL_SECONDS` (optional): Default cache TTL for routine calls
- `MOLTBOT_RATE_LIMIT_RPM` (per IP)
- `MOLTBOT_DAILY_TOKEN_BUDGET`
- `MOLTBOT_MAX_OUTPUT_TOKENS`
- `MOLTBOT_FAIL_MODE` (`open` or `closed`)
- `MOLTBOT_USAGE_ALERT_TOKENS_HOURLY` (optional usage spike alert)
- `OLLAMA_ROUTER_URL`, `OLLAMA_ROUTER_MODEL` (optional model routing)
- `GITHUB_WEBHOOK_SECRET`, `TELEGRAM_WEBHOOK_SECRET`
