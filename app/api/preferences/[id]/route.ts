import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import type { Preference } from "@/lib/types";

export const runtime = "nodejs";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  const db = await readDb();
  const preference = db.preferences.find((item) => item.id === params.id);

  if (!preference) {
    return NextResponse.json({ error: "Preference not found" }, { status: 404 });
  }

  return NextResponse.json(preference);
}

export async function PATCH(request: Request, { params }: Params) {
  const patch = (await request.json()) as Partial<Preference>;
  const db = await readDb();
  const index = db.preferences.findIndex((item) => item.id === params.id);

  if (index === -1) {
    return NextResponse.json({ error: "Preference not found" }, { status: 404 });
  }

  const existing = db.preferences[index];
  const updated: Preference = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString()
  };

  db.preferences[index] = updated;
  await writeDb(db);

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const db = await readDb();
  const index = db.preferences.findIndex((item) => item.id === params.id);

  if (index === -1) {
    return NextResponse.json({ error: "Preference not found" }, { status: 404 });
  }

  const [removed] = db.preferences.splice(index, 1);
  await writeDb(db);

  return NextResponse.json(removed);
}
