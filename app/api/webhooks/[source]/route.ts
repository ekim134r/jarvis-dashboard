import { NextResponse } from "next/server";
import { recordWebhookEvent } from "@/lib/webhooks";

export const runtime = "nodejs";

type Params = { params: { source: string } };

export async function POST(request: Request, { params }: Params) {
  try {
    const payload = await request.json();
    const type = request.headers.get("x-event-type") || "event";
    const event = await recordWebhookEvent(params.source, type, payload);
    return NextResponse.json({ ok: true, event });
  } catch (error) {
    return NextResponse.json({ error: "Invalid webhook payload" }, { status: 400 });
  }
}
