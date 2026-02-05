import { randomUUID } from "crypto";
import { readDb, writeDb } from "@/lib/db";
import type { WebhookEvent } from "@/lib/types";

export async function recordWebhookEvent(source: string, type: string, payload: unknown) {
  const db = await readDb();
  const event: WebhookEvent = {
    id: randomUUID(),
    source,
    type,
    payload,
    receivedAt: new Date().toISOString()
  };
  db.webhookEvents.unshift(event);
  db.webhookEvents = db.webhookEvents.slice(0, 500);
  await writeDb(db);
  return event;
}
