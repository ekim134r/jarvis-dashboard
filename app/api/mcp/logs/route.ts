import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import { requireFsUnlocked } from "@/lib/fsLock";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const gate = requireFsUnlocked();
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: "locked" }, { status: gate.status });
  }

  try {
    const url = new URL(request.url);
    const limit = Number(url.searchParams.get("limit") || 100);
    const capped = Number.isFinite(limit) ? Math.max(1, Math.min(limit, 500)) : 100;

    const db = await readDb();
    return NextResponse.json({
      usageEvents: db.usageEvents.slice(0, capped),
      usageAlerts: db.usageAlerts.slice(0, capped),
      webhookEvents: db.webhookEvents.slice(0, capped)
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load logs." }, { status: 500 });
  }
}
