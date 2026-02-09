import { NextResponse } from "next/server";
import { readDb } from "@/lib/db";
import fs from "node:fs/promises";
import path from "node:path";

export const runtime = "nodejs";

function getDataDir() {
  const dbPath = process.env.JARVIS_DB_PATH
    ? path.resolve(process.env.JARVIS_DB_PATH)
    : path.join(process.cwd(), "data", "db.json");
  return path.dirname(dbPath);
}

export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || "";
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const db = await readDb();
  const assets = ((db as any).assets ?? []) as any[];
  const entry = assets.find((a) => a?.id === id);
  if (!entry || entry.kind !== "file" || !entry.storedPath) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const dataDir = getDataDir();
  const abs = path.resolve(dataDir, entry.storedPath);
  if (!abs.startsWith(path.resolve(dataDir) + path.sep)) {
    return NextResponse.json({ error: "invalid path" }, { status: 400 });
  }

  const buf = await fs.readFile(abs);
  return new NextResponse(buf, {
    headers: {
      "Content-Type": entry.mimeType || "application/octet-stream",
      "Cache-Control": "no-store",
    },
  });
}
