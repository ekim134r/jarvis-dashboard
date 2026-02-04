import { NextResponse } from "next/server";
import { createTask, readDb, writeDb } from "@/lib/db";
import { decryptString, encryptString } from "@/lib/crypto";
import type { Task } from "@/lib/types";

export const runtime = "nodejs";

type TaskPayload = Partial<Omit<Task, "sensitiveNotes" | "privateNumbers">> & {
  sensitiveNotes?: string;
  privateNumbers?: string;
};

const toApiTask = (task: Task): Task => ({
  ...task,
  sensitiveNotes: decryptString(task.sensitiveNotes ?? ""),
  privateNumbers: task.privateNumbers
    ? decryptString(task.privateNumbers)
    : undefined
});

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.tasks.map(toApiTask));
}

export async function POST(request: Request) {
  const payload = (await request.json()) as TaskPayload;

  if (!payload.title || !payload.columnId) {
    return NextResponse.json(
      { error: "title and columnId are required" },
      { status: 400 }
    );
  }

  const db = await readDb();
  const task = createTask({
    title: payload.title,
    columnId: payload.columnId,
    priority: payload.priority,
    tags: payload.tags,
    description: payload.description,
    notes: payload.notes,
    sensitiveNotes: encryptString(payload.sensitiveNotes ?? ""),
    privateNumbers:
      payload.privateNumbers !== undefined
        ? encryptString(payload.privateNumbers ?? "")
        : undefined,
    checklist: payload.checklist,
    definitionOfDone: payload.definitionOfDone,
    links: payload.links,
    estimateHours: payload.estimateHours,
    dueDate: payload.dueDate,
    dependencies: payload.dependencies,
    impact: payload.impact,
    effort: payload.effort,
    confidence: payload.confidence
  });

  db.tasks.push(task);
  await writeDb(db);

  return NextResponse.json(toApiTask(task), { status: 201 });
}
