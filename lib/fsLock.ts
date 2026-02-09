import crypto from "node:crypto";
import { cookies } from "next/headers";
import type { NextResponse } from "next/server";

const COOKIE_NAME = "jarvis_fs_session";

type SessionPayload = {
  iat: number;
  exp: number;
};

function getSecret() {
  return (
    process.env.DASH_SESSION_SECRET ||
    process.env.JARVIS_DASHBOARD_SESSION_SECRET ||
    process.env.DASH_PASS ||
    ""
  );
}

function b64url(input: Buffer | string) {
  const buf = Buffer.isBuffer(input) ? input : Buffer.from(input);
  return buf
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
}

function b64urlJson(obj: unknown) {
  return b64url(JSON.stringify(obj));
}

function b64urlToBuf(str: string) {
  const padLen = (4 - (str.length % 4)) % 4;
  const padded = str.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(padLen);
  return Buffer.from(padded, "base64");
}

function sign(data: string, secret: string) {
  return b64url(crypto.createHmac("sha256", secret).update(data).digest());
}

export function createFsSessionToken(now = Date.now(), ttlSeconds = 60 * 60 * 8) {
  const secret = getSecret();
  if (!secret) return null;

  const payload: SessionPayload = {
    iat: Math.floor(now / 1000),
    exp: Math.floor(now / 1000) + ttlSeconds
  };

  const body = b64urlJson(payload);
  const sig = sign(body, secret);
  return `${body}.${sig}`;
}

export function verifyFsSessionToken(token: string | undefined | null, now = Date.now()) {
  const secret = getSecret();
  if (!secret) return true; // lock disabled
  if (!token) return false;

  const [body, sig] = token.split(".");
  if (!body || !sig) return false;

  const expected = sign(body, secret);
  try {
    const a = Buffer.from(expected);
    const b = Buffer.from(sig);
    if (a.length !== b.length) return false;
    if (!crypto.timingSafeEqual(a, b)) return false;
  } catch {
    return false;
  }

  try {
    const payload = JSON.parse(b64urlToBuf(body).toString("utf8")) as SessionPayload;
    const nowSec = Math.floor(now / 1000);
    return typeof payload?.exp === "number" && nowSec < payload.exp;
  } catch {
    return false;
  }
}

export function isFsUnlocked() {
  const secret = getSecret();
  if (!secret) return true;

  const jar = cookies();
  const token = jar.get(COOKIE_NAME)?.value;
  return verifyFsSessionToken(token);
}

export function requireFsUnlocked() {
  if (!isFsUnlocked()) return { ok: false as const, status: 423 as const };
  return { ok: true as const };
}

export function setFsUnlockedCookie(res: NextResponse, token: string) {
  res.cookies.set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 8
  });
}

export function clearFsUnlockedCookie(res: NextResponse) {
  res.cookies.set({
    name: COOKIE_NAME,
    value: "",
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });
}

export function verifyUnlockPassword(password: string) {
  const expected = process.env.DASH_PASS || "";
  if (!expected) return true;

  const a = Buffer.from(String(password));
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}
