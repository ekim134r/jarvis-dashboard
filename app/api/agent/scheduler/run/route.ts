import { NextResponse } from "next/server";
import { isInBatchWindow, runNightScheduler } from "@/lib/ai/scheduler";

export const runtime = "nodejs";

export async function POST() {
  try {
    if (!isInBatchWindow()) {
      return NextResponse.json({ ok: false, reason: "Outside batch window" });
    }
    const result = await runNightScheduler();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Scheduler failed" },
      { status: 500 }
    );
  }
}
