import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readDb, writeDb } from "@/lib/db";
import { pushNotification } from "@/lib/notify";
import type { LabSession } from "@/lib/types";

export const runtime = "nodejs";

type SessionPayload = Partial<LabSession>;

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.labSessions);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as SessionPayload;
  const frameworkId = (payload.frameworkId || "").trim();
  if (!frameworkId) {
    return NextResponse.json({ error: "frameworkId is required" }, { status: 400 });
  }

  const db = await readDb();
  const framework = db.labFrameworks.find((item) => item.id === frameworkId);
  if (!framework) {
    return NextResponse.json({ error: "Framework not found" }, { status: 404 });
  }

  const now = new Date().toISOString();
  const session: LabSession = {
    id: randomUUID(),
    frameworkId,
    title: payload.title?.trim() || `${framework.title} Session`,
    answers: payload.answers || {},
    notes: payload.notes ?? "",
    createdAt: now
  };

  db.labSessions.unshift(session);

  pushNotification(db, {
    source: "labs",
    type: "session_saved",
    title: `Labs: Session saved — ${framework.title}`,
    body: `${Object.keys(session.answers || {}).length} answers · ${session.title}`
  });

  await writeDb(db);
  return NextResponse.json(session, { status: 201 });
}
