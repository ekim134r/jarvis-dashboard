import { NextResponse } from "next/server";

function normalizeBaseUrl(input: string) {
  const trimmed = (input || "").trim().replace(/\/$/, "");
  if (!trimmed) return "";
  // Allow http:// for local dev, but default to https.
  if (!/^https?:\/\//i.test(trimmed)) return `https://${trimmed}`;
  return trimmed;
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { baseUrl?: string; apiKey?: string; authMode?: "bearer" | "header" };
    const baseUrl = normalizeBaseUrl(body.baseUrl ?? "");
    const apiKey = (body.apiKey ?? "").trim();
    const authMode = body.authMode ?? (apiKey.startsWith("eyJ") ? "bearer" : "header");

    if (!baseUrl) {
      return NextResponse.json({ ok: false, error: "Missing baseUrl" }, { status: 400 });
    }
    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "Missing apiKey" }, { status: 400 });
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    };

    if (authMode === "bearer") {
      headers.Authorization = `Bearer ${apiKey}`;
    } else {
      headers["X-N8N-API-KEY"] = apiKey;
    }

    // "Workflows" is a good lightweight probe. If your n8n plan/role blocks it,
    // we still surface the status.
    const probeUrl = `${baseUrl}/api/v1/workflows?limit=1`;

    const res = await fetch(probeUrl, {
      method: "GET",
      headers,
      cache: "no-store",
    });

    const text = await res.text();
    let json: unknown = null;
    try {
      json = text ? JSON.parse(text) : null;
    } catch {
      // ignore
    }

    if (!res.ok) {
      return NextResponse.json(
        {
          ok: false,
          status: res.status,
          statusText: res.statusText,
          hint:
            res.status === 401 || res.status === 403
              ? "Auth failed. Check token + auth mode (Bearer vs X-N8N-API-KEY)."
              : "Probe request failed.",
          response: json ?? text?.slice(0, 600) ?? "",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        ok: true,
        status: res.status,
        probe: "/api/v1/workflows?limit=1",
        responsePreview: json ?? "(non-json)",
      },
      { status: 200 }
    );
  } catch (err) {
    return NextResponse.json({ ok: false, error: "Bad request" }, { status: 400 });
  }
}
