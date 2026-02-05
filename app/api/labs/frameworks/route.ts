import { NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { readDb, writeDb } from "@/lib/db";
import type { LabFramework } from "@/lib/types";

export const runtime = "nodejs";

type FrameworkPayload = Partial<LabFramework>;

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.labFrameworks);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as FrameworkPayload;
  const title = (payload.title || "").trim();
  if (!title) {
    return NextResponse.json({ error: "title is required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const framework: LabFramework = {
    id: randomUUID(),
    title,
    goal: payload.goal ?? "",
    context: payload.context ?? "",
    screenType: payload.screenType ?? "",
    outputFormat: payload.outputFormat ?? "",
    outputLength: payload.outputLength ?? "",
    aiTemplate: payload.aiTemplate ?? "",
    questions: Array.isArray(payload.questions) ? payload.questions : [],
    assetRequests: Array.isArray(payload.assetRequests) ? payload.assetRequests : [],
    createdAt: now,
    updatedAt: now
  };

  const db = await readDb();
  db.labFrameworks.unshift(framework);
  await writeDb(db);

  return NextResponse.json(framework, { status: 201 });
}
