import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import type { Tag } from "@/lib/types";

export const runtime = "nodejs";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  const db = await readDb();
  const tag = db.tags.find((item) => item.id === params.id);

  if (!tag) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  return NextResponse.json(tag);
}

export async function PATCH(request: Request, { params }: Params) {
  const patch = (await request.json()) as Partial<Tag>;
  const db = await readDb();
  const index = db.tags.findIndex((item) => item.id === params.id);

  if (index === -1) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  const existing = db.tags[index];
  const updated: Tag = {
    ...existing,
    ...patch,
    id: existing.id
  };

  db.tags[index] = updated;
  await writeDb(db);

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const db = await readDb();
  const index = db.tags.findIndex((item) => item.id === params.id);

  if (index === -1) {
    return NextResponse.json({ error: "Tag not found" }, { status: 404 });
  }

  const [removed] = db.tags.splice(index, 1);
  db.tasks = db.tasks.map((task) => ({
    ...task,
    tags: task.tags.filter((tagId) => tagId !== removed.id)
  }));

  await writeDb(db);
  return NextResponse.json(removed);
}
