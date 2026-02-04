import { NextResponse } from "next/server";
import { createTag, readDb, writeDb } from "@/lib/db";
import type { Tag } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.tags);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<Tag>;

  if (!payload.label) {
    return NextResponse.json({ error: "label is required" }, { status: 400 });
  }

  const db = await readDb();
  const tag = createTag({ label: payload.label, color: payload.color });
  db.tags.push(tag);
  await writeDb(db);

  return NextResponse.json(tag, { status: 201 });
}
