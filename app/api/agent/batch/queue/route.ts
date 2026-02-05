import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { isBatchEligibleTask, queueBatchForTasks } from "@/lib/ai/batch";

export const runtime = "nodejs";

type QueueBody = {
  mode?: "merge" | "single" | "background";
  taskIds?: string[];
};

function countSubtasks(task: { definitionOfDone?: any[]; checklist?: any[] }) {
  return (task.definitionOfDone?.length ?? 0) + (task.checklist?.length ?? 0);
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as QueueBody;
    const mode = body.mode ?? "merge";

    const db = await readDb();
    let targetIds: string[] = body.taskIds ?? [];

    if (mode === "merge" || mode === "background") {
      const maxTasks = Number(process.env.MOLTBOT_BATCH_MERGE_MAX_TASKS || 10);
      const maxSubtasks = Number(process.env.MOLTBOT_BATCH_MERGE_MAX_SUBTASKS || 3);
      const eligible = db.tasks.filter((task) => isBatchEligibleTask(task));
      const merged = eligible
        .filter((task) => countSubtasks(task) <= maxSubtasks)
        .sort((a, b) => new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime())
        .slice(0, maxTasks)
        .map((task) => task.id);
      targetIds = merged;
    }

    if (targetIds.length === 0) {
      return NextResponse.json({ ok: false, error: "No eligible tasks to batch." }, { status: 400 });
    }

    const result = await queueBatchForTasks(targetIds);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Batch queue failed" },
      { status: 500 }
    );
  }
}
