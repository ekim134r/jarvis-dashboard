import { NextResponse } from "next/server";
import { recordWebhookEvent } from "@/lib/webhooks";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const header = request.headers.get("x-telegram-bot-api-secret-token");
  if (secret && header !== secret) {
    return NextResponse.json({ error: "Invalid secret token" }, { status: 401 });
  }

  try {
    const payload = await request.json();
    const event = await recordWebhookEvent("telegram", "update", payload);
    return NextResponse.json({ ok: true, event });
  } catch {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
}
