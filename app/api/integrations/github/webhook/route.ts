import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { recordWebhookEvent } from "@/lib/webhooks";

export const runtime = "nodejs";

function verifySignature(secret: string, body: string, signature: string | null) {
  if (!signature) return false;
  const hmac = createHmac("sha256", secret);
  hmac.update(body);
  const expected = `sha256=${hmac.digest("hex")}`;
  const expectedBuf = Buffer.from(expected);
  const signatureBuf = Buffer.from(signature);
  if (expectedBuf.length !== signatureBuf.length) return false;
  return timingSafeEqual(expectedBuf, signatureBuf);
}

export async function POST(request: Request) {
  const secret = process.env.GITHUB_WEBHOOK_SECRET;
  const signature = request.headers.get("x-hub-signature-256");
  const event = request.headers.get("x-github-event") || "event";

  const rawBody = await request.text();
  if (secret && !verifySignature(secret, rawBody, signature)) {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  let payload: unknown;
  try {
    payload = rawBody ? JSON.parse(rawBody) : {};
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const recorded = await recordWebhookEvent("github", event, payload);
  return NextResponse.json({ ok: true, event: recorded });
}
