import type { Task } from "@/lib/types";
import { readDb, writeDb } from "@/lib/db";
import { recordUsageEvent } from "@/lib/ai/telemetry";

type WorkItem = {
  id: string;
  text: string;
  taskId: string;
  taskTitle: string;
  priority: string;
  description: string;
  notes: string;
};

type BatchResult = {
  batchId: string;
  fileId: string;
  model: string;
  taskIds: string[];
};

const DEFAULT_MODEL = "gpt-4o-mini";

function hasSubtasks(task: Task) {
  const dodCount = task.definitionOfDone?.length ?? 0;
  const checklistCount = task.checklist?.length ?? 0;
  return dodCount + checklistCount > 0;
}

export function isBatchEligibleTask(task: Task) {
  const lowPriority = task.priority === "P2" || task.priority === "P3";
  return !!task.swarmRequired && lowPriority && hasSubtasks(task);
}

export function buildWorkItems(task: Task, chunkSize = 1): WorkItem[] {
  const dod = task.definitionOfDone ?? [];
  const checklist = task.checklist ?? [];
  const source = dod.length > 0 ? dod : checklist;
  const items = source.map((item) => ({
    id: item.id,
    text: item.text,
    taskId: task.id,
    taskTitle: task.title,
    priority: task.priority,
    description: task.description || "",
    notes: task.notes || ""
  }));
  if (chunkSize <= 1) return items;

  const chunks: WorkItem[] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    const subset = items.slice(i, i + chunkSize);
    chunks.push({
      id: subset.map((s) => s.id).join("_"),
      text: subset.map((s) => s.text).join("\n"),
      taskId: task.id,
      taskTitle: task.title,
      priority: task.priority,
      description: task.description || "",
      notes: task.notes || ""
    });
  }
  return chunks;
}

export async function queueBatchForTasks(taskIds: string[]): Promise<BatchResult> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured on the server.");
  }

  const db = await readDb();
  const tasks = db.tasks.filter((task) => taskIds.includes(task.id));
  if (tasks.length === 0) {
    throw new Error("No tasks found.");
  }

  const chunkSize = Number(process.env.MOLTBOT_BATCH_CHUNK_SIZE || 1);
  const workItems = tasks.flatMap((task) => buildWorkItems(task, chunkSize));
  if (workItems.length === 0) {
    throw new Error("No subtasks to batch.");
  }

  const model = process.env.JARVIS_BATCH_MODEL || DEFAULT_MODEL;
  const system = [
    "You are Jarvis Swarm Orchestrator.",
    "Produce a concise execution plan for the subtask.",
    "Return JSON with keys: summary, actions, risks, expected_output.",
    "Keep outputs under 200 words."
  ].join(" ");

  const jsonl = workItems
    .map((item, index) =>
      JSON.stringify({
        custom_id: `${item.taskId}_${index}_${item.id}`,
        method: "POST",
        url: "/v1/responses",
        body: {
          model,
          input: [
            { role: "system", content: system },
            {
              role: "user",
              content: [
                `Task: ${item.taskTitle}`,
                item.description ? `Description: ${item.description}` : null,
                `Subtask: ${item.text}`,
                `Priority: ${item.priority}`,
                `Notes: ${item.notes || "none"}`
              ]
                .filter(Boolean)
                .join("\n")
            }
          ]
        }
      })
    )
    .join("\n");

  const form = new FormData();
  form.append("purpose", "batch");
  form.append(
    "file",
    new Blob([jsonl], { type: "application/jsonl" }),
    `jarvis-batch-${Date.now()}.jsonl`
  );

  const fileRes = await fetch("https://api.openai.com/v1/files", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`
    },
    body: form
  });
  const fileJson = await fileRes.json();
  if (!fileRes.ok) {
    throw new Error(`OpenAI file upload failed: ${JSON.stringify(fileJson)}`);
  }

  const batchRes = await fetch("https://api.openai.com/v1/batches", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      input_file_id: fileJson.id,
      endpoint: "/v1/responses",
      completion_window: "24h",
      metadata: {
        source: "jarvis-dashboard"
      }
    })
  });
  const batchJson = await batchRes.json();
  if (!batchRes.ok) {
    throw new Error(`OpenAI batch creation failed: ${JSON.stringify(batchJson)}`);
  }

  const now = new Date().toISOString();
  db.tasks = db.tasks.map((task) =>
    taskIds.includes(task.id)
      ? {
          ...task,
          processingMode: "batch",
          batchJobId: batchJson.id,
          updatedAt: now
        }
      : task
  );
  await writeDb(db);

  await recordUsageEvent({
    kind: "batch",
    tokens: workItems.length * 512,
    model,
    taskIds
  });

  return {
    batchId: batchJson.id,
    fileId: fileJson.id,
    model,
    taskIds
  };
}
