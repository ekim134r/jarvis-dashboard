import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import type { Experiment } from "@/lib/types";

export const runtime = "nodejs";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  const db = await readDb();
  const experiment = db.experiments.find((item) => item.id === params.id);

  if (!experiment) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }

  return NextResponse.json(experiment);
}

export async function PATCH(request: Request, { params }: Params) {
  const patch = (await request.json()) as Partial<Experiment>;
  const db = await readDb();
  const index = db.experiments.findIndex((item) => item.id === params.id);

  if (index === -1) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }

  const existing = db.experiments[index];
  const updated: Experiment = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString()
  };

  db.experiments[index] = updated;
  await writeDb(db);

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const db = await readDb();
  const index = db.experiments.findIndex((item) => item.id === params.id);

  if (index === -1) {
    return NextResponse.json({ error: "Experiment not found" }, { status: 404 });
  }

  const [removed] = db.experiments.splice(index, 1);
  await writeDb(db);

  return NextResponse.json(removed);
}
