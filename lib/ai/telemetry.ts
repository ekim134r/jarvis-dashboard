import { randomUUID } from "crypto";
import { readDb, writeDb } from "@/lib/db";
import type { UsageAlert, UsageEvent } from "@/lib/types";

type UsageInput = {
  kind: UsageEvent["kind"];
  tokens: number;
  model?: string;
  taskIds?: string[];
  tool?: string;
};

export async function recordUsageEvent(input: UsageInput) {
  const db = await readDb();
  const event: UsageEvent = {
    id: randomUUID(),
    kind: input.kind,
    tokens: input.tokens,
    model: input.model,
    taskIds: input.taskIds ?? [],
    tool: input.tool,
    createdAt: new Date().toISOString()
  };
  db.usageEvents.unshift(event);
  db.usageEvents = db.usageEvents.slice(0, 2000);

  const threshold = Number(process.env.MOLTBOT_USAGE_ALERT_TOKENS_HOURLY || 0);
  if (threshold > 0) {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    const total = db.usageEvents
      .filter((item) => new Date(item.createdAt).getTime() >= oneHourAgo)
      .reduce((sum, item) => sum + item.tokens, 0);
    if (total >= threshold) {
      const alert: UsageAlert = {
        id: randomUUID(),
        level: "warn",
        message: `Usage spike: ${total} tokens in the last hour.`,
        createdAt: new Date().toISOString()
      };
      db.usageAlerts.unshift(alert);
      db.usageAlerts = db.usageAlerts.slice(0, 200);
    }
  }

  await writeDb(db);
  return event;
}
