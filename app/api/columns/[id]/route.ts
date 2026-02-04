import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import type { Column } from "@/lib/types";

export const runtime = "nodejs";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  const db = await readDb();
  const column = db.columns.find((item) => item.id === params.id);

  if (!column) {
    return NextResponse.json({ error: "Column not found" }, { status: 404 });
  }

  return NextResponse.json(column);
}

export async function PATCH(request: Request, { params }: Params) {
  const patch = (await request.json()) as Partial<Column>;
  const db = await readDb();
  const index = db.columns.findIndex((item) => item.id === params.id);

  if (index === -1) {
    return NextResponse.json({ error: "Column not found" }, { status: 404 });
  }

  const existing = db.columns[index];
  const updated: Column = {
    ...existing,
    ...patch,
    id: existing.id
  };

  db.columns[index] = updated;
  await writeDb(db);

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const db = await readDb();
  const index = db.columns.findIndex((item) => item.id === params.id);

  if (index === -1) {
    return NextResponse.json({ error: "Column not found" }, { status: 404 });
  }

  const [removed] = db.columns.splice(index, 1);
  await writeDb(db);

  return NextResponse.json(removed);
}
