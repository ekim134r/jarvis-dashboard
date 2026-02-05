import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
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
