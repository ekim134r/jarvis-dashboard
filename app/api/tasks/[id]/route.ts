import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import type { Task } from "@/lib/types";

export const runtime = "nodejs";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  const db = await readDb();
  const task = db.tasks.find((item) => item.id === params.id);

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  return NextResponse.json(task);
}

export async function PATCH(request: Request, { params }: Params) {
  const patch = (await request.json()) as Partial<Task>;
  const db = await readDb();
  const index = db.tasks.findIndex((item) => item.id === params.id);

  if (index === -1) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const existing = db.tasks[index];
  const updated: Task = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString()
  };

  db.tasks[index] = updated;
  await writeDb(db);

  return NextResponse.json(updated);
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
