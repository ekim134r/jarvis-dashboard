# Jarvis Second Brain

Single-user local productivity workspace for tasks, scripts, and operational memory.

## Requirements

- Node.js 18+

## Local Development

1. Install dependencies:

```bash
npm install
```

2. Run the dev server:

```bash
npm run dev
```

Visit `http://localhost:3000`.

## Run On LAN

To expose the dev server on your LAN:

```bash
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Then open `http://<your-ip>:3000` from another device on the network.

## Data Storage

Default: `data/db.json` in this repo.

Override (recommended for VPS / multiple instances): set

- `JARVIS_DB_PATH=/var/lib/jarvis-dashboard/jarvis.db.json` (example)

The app reads and writes via Next.js Route Handlers under `app/api/*`.

## Health Endpoint

`GET /api/health` returns:

```json
{ "status": "ok", "time": "2026-02-03T12:34:56.000Z" }
```
