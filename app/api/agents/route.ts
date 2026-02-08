import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";

export const runtime = "nodejs";

export async function GET() {
  const db = await readDb();
  return NextResponse.json({
    ok: true,
    agents: db.agents ?? { jarvis: null, claw: null }
  });
}
