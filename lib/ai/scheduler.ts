import { readDb } from "@/lib/db";
import { isBatchEligibleTask, queueBatchForTasks } from "@/lib/ai/batch";

function parseTime(input: string) {
  const [h, m] = input.split(":").map((value) => Number(value));
  if (Number.isNaN(h) || Number.isNaN(m)) return null;
  return { h, m };
}

export function isInBatchWindow(now = new Date()) {
  const start = parseTime(process.env.MOLTBOT_BATCH_WINDOW_START || "22:00");
  const end = parseTime(process.env.MOLTBOT_BATCH_WINDOW_END || "06:00");
  if (!start || !end) return true;

  const minutes = now.getHours() * 60 + now.getMinutes();
  const startMinutes = start.h * 60 + start.m;
  const endMinutes = end.h * 60 + end.m;

  if (startMinutes <= endMinutes) {
    return minutes >= startMinutes && minutes <= endMinutes;
  }
  return minutes >= startMinutes || minutes <= endMinutes;
}

function hasTag(taskTags: string[], labels: string[], tagMap: Map<string, string>) {
  return taskTags.some((id) => labels.includes((tagMap.get(id) || "").toLowerCase()));
}

export async function runNightScheduler() {
  const db = await readDb();
  const tagMap = new Map(db.tags.map((tag) => [tag.id, tag.label]));
  const candidates = db.tasks.filter((task) => {
    if (!isBatchEligibleTask(task)) return false;
    const labels = ["later", "next"];
    return hasTag(task.tags, labels, tagMap);
  });

  const maxTasks = Number(process.env.MOLTBOT_BATCH_MERGE_MAX_TASKS || 10);
  const taskIds = candidates.slice(0, maxTasks).map((task) => task.id);
  if (taskIds.length === 0) {
    return { ok: false, reason: "No eligible tasks" };
  }

  const result = await queueBatchForTasks(taskIds);
  return { ok: true, ...result };
}
