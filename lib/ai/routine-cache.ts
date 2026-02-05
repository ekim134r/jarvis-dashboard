import { randomUUID } from "crypto";
import { readDb, writeDb } from "@/lib/db";
import type { RoutineCacheEntry } from "@/lib/types";

export async function getRoutineCache(key: string) {
  const db = await readDb();
  const entry = db.routineCache.find((item) => item.key === key);
  if (!entry) return null;
  if (entry.ttlSeconds) {
    const age = Date.now() - new Date(entry.createdAt).getTime();
    if (age > entry.ttlSeconds * 1000) return null;
  }
  return entry;
}

export async function setRoutineCache(
  key: string,
  value: string,
  ttlSeconds?: number
) {
  const db = await readDb();
  const entry: RoutineCacheEntry = {
    id: randomUUID(),
    key,
    value,
    ttlSeconds,
    createdAt: new Date().toISOString()
  };
  db.routineCache.unshift(entry);
  db.routineCache = db.routineCache.slice(0, 500);
  await writeDb(db);
  return entry;
}
