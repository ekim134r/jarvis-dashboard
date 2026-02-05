import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readDb, writeDb } from "@/lib/db";
import type { LabResearchPrompt } from "@/lib/types";

export const runtime = "nodejs";

type PromptPayload = Partial<LabResearchPrompt>;

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.labResearchPrompts);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as PromptPayload;
  const title = (payload.title || "").trim();
  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const prompt: LabResearchPrompt = {
    id: randomUUID(),
    title,
    objective: payload.objective ?? "",
    outputFormat: payload.outputFormat ?? "",
    outputLength: payload.outputLength ?? "",
    prompt: payload.prompt ?? "",
    response: payload.response ?? "",
    createdAt: now
  };

  const db = await readDb();
  db.labResearchPrompts.unshift(prompt);
  await writeDb(db);
  return NextResponse.json(prompt, { status: 201 });
}
