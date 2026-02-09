import { NextResponse } from "next/server";
import {
  clearFsUnlockedCookie,
  createFsSessionToken,
  isFsUnlocked,
  setFsUnlockedCookie,
  verifyUnlockPassword
} from "@/lib/fsLock";

export const runtime = "nodejs";

export async function GET() {
  return NextResponse.json({ unlocked: isFsUnlocked() });
}

type UnlockPayload = { password?: string };

export async function POST(request: Request) {
  const payload = (await request.json().catch(() => ({}))) as UnlockPayload;
  const password = String(payload.password ?? "");

  if (!verifyUnlockPassword(password)) {
    return NextResponse.json({ ok: false, error: "invalid_password" }, { status: 401 });
  }

  const token = createFsSessionToken();
  const res = NextResponse.json({ ok: true, unlocked: true });
  if (token) setFsUnlockedCookie(res, token);
  return res;
}

export async function DELETE() {
  const res = NextResponse.json({ ok: true, unlocked: false });
  clearFsUnlockedCookie(res);
  return res;
}
