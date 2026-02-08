import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
  const url = process.env.VPS_STATUS_URL;
  const token = process.env.VPS_STATUS_TOKEN;

  if (!url) {
    return NextResponse.json(
      { ok: false, error: "Missing VPS_STATUS_URL" },
      { status: 500 }
    );
  }

  try {
    const res = await fetch(url, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      cache: "no-store"
    });

    const text = await res.text();
    let data: unknown = text;
    try {
      data = JSON.parse(text);
    } catch {
      // keep raw text
    }

    if (!res.ok) {
      return NextResponse.json(
        { ok: false, status: res.status, data },
        { status: 502 }
      );
    }

    return NextResponse.json({ ok: true, data });
  } catch (err) {
    return NextResponse.json(
      { ok: false, error: "VPS status fetch failed" },
      { status: 502 }
    );
  }
}
