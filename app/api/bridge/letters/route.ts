import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readDb, writeDb } from "@/lib/db";

export const runtime = "nodejs";

type Letter = {
  id: string;
  from: "jarvis" | "claw";
  to: "jarvis" | "claw";
  title: string;
  payload: string; // encrypted blob (client-side AES-GCM)
  status: "queued" | "claimed" | "done" | "failed";
  claimedBy?: string;
  createdAt: string;
  updatedAt: string;
};

function nowIso() {
  return new Date().toISOString();
}

function requireAgent(value: unknown): value is "jarvis" | "claw" {
  return value === "jarvis" || value === "claw";
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return NextResponse.json({ ok: false, error: "invalid json" }, { status: 400 });
  }

  const from = (body as any).from;
  const to = (body as any).to;
  const title = typeof (body as any).title === "string" ? (body as any).title.trim() : "";
  const payload = typeof (body as any).payload === "string" ? (body as any).payload : "";

  if (!requireAgent(from) || !requireAgent(to)) {
    return NextResponse.json({ ok: false, error: "from/to must be jarvis|claw" }, { status: 400 });
  }
  if (!title) {
    return NextResponse.json({ ok: false, error: "missing title" }, { status: 400 });
  }
  if (!payload) {
    return NextResponse.json({ ok: false, error: "missing payload" }, { status: 400 });
  }

  const db = await readDb();
  db.letters = Array.isArray(db.letters) ? db.letters : [];

  const now = nowIso();
  const letter: Letter = {
    id: randomUUID(),
    from,
    to,
    title,
    payload,
    status: "queued",
    createdAt: now,
    updatedAt: now
  };

  db.letters.unshift(letter);
  db.letters = db.letters.slice(0, 500);
  await writeDb(db);

  return NextResponse.json({ ok: true, id: letter.id });
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const to = searchParams.get("for");
  const limit = Math.min(Number(searchParams.get("limit") ?? "20") || 20, 100);

  if (to && !requireAgent(to)) {
    return NextResponse.json({ ok: false, error: "for must be jarvis|claw" }, { status: 400 });
  }

  const db = await readDb();
  const letters = Array.isArray(db.letters) ? db.letters : [];
  const filtered = to ? letters.filter((l: Letter) => l.to === to) : letters;

  // do not leak payload unless explicitly requested
  const includePayload = searchParams.get("include") === "payload";
  const sanitized = filtered.slice(0, limit).map((l: Letter) => {
    if (includePayload) return l;
    const { payload, ...rest } = l;
    return rest;
  });

  return NextResponse.json({ ok: true, letters: sanitized });
}

export async function PATCH(req: Request) {
  const body = await req.json().catch(() => null);
  const id = body?.id;
  const status = body?.status;
  if (typeof id !== "string" || !id) {
    return NextResponse.json({ ok: false, error: "missing id" }, { status: 400 });
  }
  if (!["queued", "claimed", "done", "failed"].includes(status)) {
    return NextResponse.json({ ok: false, error: "invalid status" }, { status: 400 });
  }

  const db = await readDb();
  db.letters = Array.isArray(db.letters) ? db.letters : [];
  const idx = db.letters.findIndex((l: any) => l.id === id);
  if (idx === -1) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

  db.letters[idx] = { ...db.letters[idx], status, updatedAt: nowIso() };
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
