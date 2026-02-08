import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";

export const runtime = "nodejs";

const ALLOWED = new Set(["jarvis", "claw"]);

function nowIso() {
  return new Date().toISOString();
}

export async function POST(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const agentId = params.id;
  if (!ALLOWED.has(agentId)) {
    return NextResponse.json({ ok: false, error: "unknown agent" }, { status: 404 });
  }

  const payload = await _req.json().catch(() => null);
  if (!payload || typeof payload !== "object") {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const db = await readDb();

  db.agents = db.agents ?? { jarvis: null, claw: null };
  db.agents[agentId as "jarvis" | "claw"] = {
    updatedAt: nowIso(),
    state: payload
  };

  await writeDb(db);
  return NextResponse.json({ ok: true });
}

export async function GET(
  _req: Request,
  { params }: { params: { id: string } }
) {
  const agentId = params.id;
  if (!ALLOWED.has(agentId)) {
    return NextResponse.json({ ok: false, error: "unknown agent" }, { status: 404 });
  }

  const db = await readDb();
  const entry = db.agents?.[agentId as "jarvis" | "claw"] ?? null;
  return NextResponse.json({ ok: true, ...entry });
}
