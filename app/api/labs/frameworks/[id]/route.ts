import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import type { LabFramework } from "@/lib/types";

export const runtime = "nodejs";

type FrameworkPayload = Partial<LabFramework>;

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const db = await readDb();
  const framework = db.labFrameworks.find((item) => item.id === params.id);
  if (!framework) {
    return NextResponse.json({ error: "Framework not found" }, { status: 404 });
  }
  return NextResponse.json(framework);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const payload = (await request.json()) as FrameworkPayload;
  const db = await readDb();
  const index = db.labFrameworks.findIndex((item) => item.id === params.id);
  if (index === -1) {
    return NextResponse.json({ error: "Framework not found" }, { status: 404 });
  }

  const current = db.labFrameworks[index];
  const updated: LabFramework = {
    ...current,
    ...payload,
    id: current.id,
    title: (payload.title ?? current.title).trim(),
    questions: Array.isArray(payload.questions) ? payload.questions : current.questions,
    assetRequests: Array.isArray(payload.assetRequests)
      ? payload.assetRequests
      : current.assetRequests,
    updatedAt: new Date().toISOString()
  };
  db.labFrameworks[index] = updated;
  await writeDb(db);

  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const db = await readDb();
  const exists = db.labFrameworks.some((item) => item.id === params.id);
  if (!exists) {
    return NextResponse.json({ error: "Framework not found" }, { status: 404 });
  }
  db.labFrameworks = db.labFrameworks.filter((item) => item.id !== params.id);
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
