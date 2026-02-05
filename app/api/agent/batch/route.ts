import { NextResponse } from "next/server";
import { queueBatchForTasks, isBatchEligibleTask } from "@/lib/ai/batch";
import { readDb } from "@/lib/db";

export const runtime = "nodejs";

type BatchRequestBody = {
  taskId?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as BatchRequestBody;
    if (!body.taskId) {
      return NextResponse.json({ error: "taskId is required" }, { status: 400 });
    }

    const db = await readDb();
    const task = db.tasks.find((item) => item.id === body.taskId);

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    if (!isBatchEligibleTask(task)) {
      return NextResponse.json(
        {
          error: "Task is not eligible for batch processing.",
          details: {
            swarmRequired: !!task.swarmRequired,
            hasSubtasks: (task.definitionOfDone?.length ?? 0) + (task.checklist?.length ?? 0) > 0,
            lowPriority: task.priority === "P2" || task.priority === "P3"
          }
        },
        { status: 400 }
      );
    }

    const result = await queueBatchForTasks([task.id]);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Batch request failed" },
      { status: 500 }
    );
  }
}
