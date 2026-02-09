import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { requireFsUnlocked } from "@/lib/fsLock";

export const runtime = "nodejs";

export async function GET() {
  const gate = requireFsUnlocked();
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: "locked" }, { status: gate.status });
  }

  try {
    const db = await readDb();
    return NextResponse.json({
      tasks: db.tasks,
      columns: db.columns,
      tags: db.tags,
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load tasks." }, { status: 500 });
  }
}
