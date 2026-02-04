import { NextResponse } from "next/server";
import { createPreference, readDb, writeDb } from "@/lib/db";
import type { Preference } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.preferences);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<Preference>;

  if (!payload.prompt) {
    return NextResponse.json(
      { error: "prompt is required" },
      { status: 400 }
    );
  }

  const db = await readDb();
  const preference = createPreference({
    prompt: payload.prompt,
    leftLabel: payload.leftLabel,
    rightLabel: payload.rightLabel,
    tags: payload.tags,
    decision: payload.decision,
    confidence: payload.confidence,
    notes: payload.notes
  });

  db.preferences.push(preference);
  await writeDb(db);

  return NextResponse.json(preference, { status: 201 });
}
