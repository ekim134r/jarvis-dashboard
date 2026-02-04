import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import { decryptString, encryptString } from "@/lib/crypto";
import type { Task } from "@/lib/types";

export const runtime = "nodejs";

type Params = { params: { id: string } };

type TaskPatchPayload = Partial<Omit<Task, "sensitiveNotes" | "privateNumbers">> & {
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

export async function GET(_request: Request, { params }: Params) {
  const db = await readDb();
  const task = db.tasks.find((item) => item.id === params.id);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(toApiTask(task));
}

export async function PATCH(request: Request, { params }: Params) {
  const patch = (await request.json()) as TaskPatchPayload;
  const db = await readDb();
  const index = db.tasks.findIndex((item) => item.id === params.id);

  if (index === -1) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const existing = db.tasks[index];
  const nextPatch: Partial<Task> = { ...patch };
  if (Object.prototype.hasOwnProperty.call(patch, "sensitiveNotes")) {
    nextPatch.sensitiveNotes = encryptString(patch.sensitiveNotes ?? "");
  }
  if (Object.prototype.hasOwnProperty.call(patch, "privateNumbers")) {
    nextPatch.privateNumbers = encryptString(patch.privateNumbers ?? "");
  }
  const updated: Task = {
    ...existing,
    ...nextPatch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString()
  };

  db.tasks[index] = updated;
  await writeDb(db);

  return NextResponse.json(toApiTask(updated));
}

export async function DELETE(_request: Request, { params }: Params) {
  const db = await readDb();
  const index = db.tasks.findIndex((item) => item.id === params.id);

  if (index === -1) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const [removed] = db.tasks.splice(index, 1);
  await writeDb(db);

  return NextResponse.json(removed);
}
