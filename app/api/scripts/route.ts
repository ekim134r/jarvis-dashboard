import { NextResponse } from "next/server";
import { createScript, readDb, writeDb } from "@/lib/db";
import type { Script } from "@/lib/types";

export const runtime = "nodejs";

export async function GET() {
  const db = await readDb();
  return NextResponse.json(db.scripts);
}

export async function POST(request: Request) {
  const payload = (await request.json()) as Partial<Script>;

  if (!payload.name || !payload.command) {
    return NextResponse.json(
      { error: "name and command are required" },
      { status: 400 }
    );
  }

  const db = await readDb();
  const script = createScript({
    name: payload.name,
    command: payload.command,
    description: payload.description,
    tags: payload.tags,
    favorite: payload.favorite
  });

  db.scripts.push(script);
  await writeDb(db);

  return NextResponse.json(script, { status: 201 });
}
