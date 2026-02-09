import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import type { ResearchCard } from "@/lib/types";

export const runtime = "nodejs";

type Params = { params: { id: string } };

type Patch = Partial<Omit<ResearchCard, "id" | "createdAt">>;

export async function GET(_request: Request, { params }: Params) {
  const db = await readDb();
  const card = (db.researchCards ?? []).find((item) => item.id === params.id);
  if (!card) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  return NextResponse.json(card);
}

export async function PATCH(request: Request, { params }: Params) {
  const patch = (await request.json()) as Patch;
  const db = await readDb();
  const list = db.researchCards ?? [];
  const index = list.findIndex((item) => item.id === params.id);
  if (index === -1) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const existing = list[index];
  const next: ResearchCard = {
    ...existing,
    ...patch,
    title: patch.title !== undefined ? String(patch.title).trim() : existing.title,
    updatedAt: new Date().toISOString()
  };

  list[index] = next;
  db.researchCards = list;
  await writeDb(db);
  return NextResponse.json(next);
}

export async function DELETE(_request: Request, { params }: Params) {
  const db = await readDb();
  const list = db.researchCards ?? [];
  const next = list.filter((item) => item.id !== params.id);
  if (next.length === list.length) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }
  db.researchCards = next;
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
