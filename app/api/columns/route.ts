import { NextResponse } from "next/server";
import { createColumn, readDb, writeDb } from "@/lib/db";
import type { Column } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.columns);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<Column>;

  if (!payload.title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const db = await readDb();
  const column = createColumn({
    title: payload.title,
    key: payload.key,
    order: payload.order ?? db.columns.length
  });

  db.columns.push(column);
  await writeDb(db);

  return NextResponse.json(column, { status: 201 });
}
