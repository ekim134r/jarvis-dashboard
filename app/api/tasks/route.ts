import { NextResponse } from "next/server";
import { createTask, readDb, writeDb } from "@/lib/db";
import type { Task } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.tasks);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<Task>;

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
    checklist: payload.checklist,
    definitionOfDone: payload.definitionOfDone,
    links: payload.links
  });

  db.tasks.push(task);
  await writeDb(db);

  return NextResponse.json(task, { status: 201 });
}
