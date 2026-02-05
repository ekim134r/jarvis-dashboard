import { NextResponse } from "next/server";
import { recordWebhookEvent } from "@/lib/webhooks";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const event = await recordWebhookEvent("calendar", "event", payload);
    return NextResponse.json({ ok: true, event });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
