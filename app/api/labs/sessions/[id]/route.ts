import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const db = await readDb();
  const session = db.labSessions.find((item) => item.id === params.id);
  if (!session) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  return NextResponse.json(session);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const db = await readDb();
  const exists = db.labSessions.some((item) => item.id === params.id);
  if (!exists) {
    return NextResponse.json({ error: "Session not found" }, { status: 404 });
  }
  db.labSessions = db.labSessions.filter((item) => item.id !== params.id);
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
