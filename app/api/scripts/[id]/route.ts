import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import type { Script } from "@/lib/types";
import { requireFsUnlocked } from "@/lib/fsLock";

export const runtime = "nodejs";

type Params = { params: { id: string } };

export async function GET(_request: Request, { params }: Params) {
  const db = await readDb();
  const script = db.scripts.find((item) => item.id === params.id);

  if (!script) {
    return NextResponse.json({ error: "Script not found" }, { status: 404 });
  }

  return NextResponse.json(script);
}

export async function PATCH(request: Request, { params }: Params) {
  const gate = requireFsUnlocked();
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: "locked" }, { status: gate.status });
  }

  const patch = (await request.json()) as Partial<Script>;
  const db = await readDb();
  const index = db.scripts.findIndex((item) => item.id === params.id);

  if (index === -1) {
    return NextResponse.json({ error: "Script not found" }, { status: 404 });
  }

  const existing = db.scripts[index];
  const updated: Script = {
    ...existing,
    ...patch,
    id: existing.id,
    createdAt: existing.createdAt,
    updatedAt: new Date().toISOString()
  };

  db.scripts[index] = updated;
  await writeDb(db);

  return NextResponse.json(updated);
}

export async function DELETE(_request: Request, { params }: Params) {
  const gate = requireFsUnlocked();
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: "locked" }, { status: gate.status });
  }

  const db = await readDb();
  const index = db.scripts.findIndex((item) => item.id === params.id);

  if (index === -1) {
    return NextResponse.json({ error: "Script not found" }, { status: 404 });
  }

  const [removed] = db.scripts.splice(index, 1);
  await writeDb(db);

  return NextResponse.json(removed);
}
