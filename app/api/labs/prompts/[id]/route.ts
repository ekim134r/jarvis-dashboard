import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import type { LabResearchPrompt } from "@/lib/types";

export const runtime = "nodejs";

type PromptPayload = Partial<LabResearchPrompt>;

export async function GET(_: Request, { params }: { params: { id: string } }) {
  const db = await readDb();
  const prompt = db.labResearchPrompts.find((item) => item.id === params.id);
  if (!prompt) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }
  return NextResponse.json(prompt);
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const payload = (await request.json()) as PromptPayload;
  const db = await readDb();
  const index = db.labResearchPrompts.findIndex((item) => item.id === params.id);
  if (index === -1) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }

  const current = db.labResearchPrompts[index];
  const updated: LabResearchPrompt = {
    ...current,
    ...payload,
    id: current.id,
    title: (payload.title ?? current.title).trim()
  };
  db.labResearchPrompts[index] = updated;
  await writeDb(db);
  return NextResponse.json(updated);
}

export async function DELETE(_: Request, { params }: { params: { id: string } }) {
  const db = await readDb();
  const exists = db.labResearchPrompts.some((item) => item.id === params.id);
  if (!exists) {
    return NextResponse.json({ error: "Prompt not found" }, { status: 404 });
  }
  db.labResearchPrompts = db.labResearchPrompts.filter((item) => item.id !== params.id);
  await writeDb(db);
  return NextResponse.json({ ok: true });
}
