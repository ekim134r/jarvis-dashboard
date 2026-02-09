import { NextResponse } from "next/server";
import { readDb, writeDb } from "@/lib/db";
import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { requireFsUnlocked } from "@/lib/fsLock";

export const runtime = "nodejs";

type AssetCategory =
  | "Inspo"
  | "UI"
  | "Motion"
  | "Typography"
  | "Color"
  | "Layout"
  | "Competitor";

type AssetStatus = "keep" | "maybe" | "trash";

type AssetEntry = {
  id: string;
  kind: "file" | "url";
  title?: string;
  category: AssetCategory;
  status: AssetStatus;
  rating: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  sourceUrl?: string;
  useCase?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  storedPath?: string; // relative to data/
  createdAt: string;
  updatedAt: string;
};

const allowedMime = new Set([
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif",
]);

function getDataDir() {
  const dbPath = process.env.JARVIS_DB_PATH
    ? path.resolve(process.env.JARVIS_DB_PATH)
    : path.join(process.cwd(), "data", "db.json");
  return path.dirname(dbPath);
}

function safeFileExt(mime: string) {
  if (mime === "image/png") return "png";
  if (mime === "image/jpeg") return "jpg";
  if (mime === "image/webp") return "webp";
  if (mime === "image/gif") return "gif";
  return "bin";
}

export async function GET() {
  const db = await readDb();
  const assets = ((db as any).assets ?? []) as AssetEntry[];
  return NextResponse.json({ assets });
}

export async function POST(req: Request) {
  const gate = requireFsUnlocked();
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: "locked" }, { status: gate.status });
  }

  const now = new Date().toISOString();
  const contentType = req.headers.get("content-type") || "";

  const db = await readDb();
  const assets = (((db as any).assets ?? []) as AssetEntry[]).slice();

  // URL-only mode (json)
  if (contentType.includes("application/json")) {
    const body = (await req.json()) as Partial<AssetEntry> & {
      url?: string;
    };

    const sourceUrl = body.sourceUrl || body.url;
    if (!sourceUrl || typeof sourceUrl !== "string") {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const entry: AssetEntry = {
      id: randomUUID(),
      kind: "url",
      title: body.title,
      category: (body.category as any) ?? "Inspo",
      status: (body.status as any) ?? "keep",
      rating: (body.rating as any) ?? 4,
      tags: Array.isArray(body.tags) ? body.tags : [],
      sourceUrl,
      useCase: body.useCase,
      createdAt: now,
      updatedAt: now,
    };

    assets.unshift(entry);
    (db as any).assets = assets.slice(0, 500);
    await writeDb(db);
    return NextResponse.json(entry, { status: 201 });
  }

  // File upload mode (multipart)
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Expected multipart/form-data or application/json" },
      { status: 400 }
    );
  }

  const form = await req.formData();
  const file = form.get("file");
  if (!file || !(file instanceof File)) {
    return NextResponse.json({ error: "file is required" }, { status: 400 });
  }

  if (!allowedMime.has(file.type)) {
    return NextResponse.json(
      { error: `Unsupported mime type: ${file.type}` },
      { status: 400 }
    );
  }

  const sizeLimit = 25 * 1024 * 1024;
  if (file.size > sizeLimit) {
    return NextResponse.json(
      { error: "File too large (max 25MB)" },
      { status: 400 }
    );
  }

  const category = (form.get("category") as string) || "Inspo";
  const status = (form.get("status") as string) || "keep";
  const ratingRaw = Number(form.get("rating") || 4);
  const rating = Math.min(5, Math.max(1, ratingRaw || 4)) as 1 | 2 | 3 | 4 | 5;
  const tagsRaw = (form.get("tags") as string) || "";
  const tags = tagsRaw
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean)
    .slice(0, 20);

  const sourceUrl = (form.get("sourceUrl") as string) || undefined;
  const useCase = (form.get("useCase") as string) || undefined;
  const title = (form.get("title") as string) || undefined;

  const id = randomUUID();
  const dataDir = getDataDir();
  const yyyyMm = now.slice(0, 7);
  const uploadsDir = path.join(dataDir, "uploads", yyyyMm);
  await fs.mkdir(uploadsDir, { recursive: true });

  const ext = safeFileExt(file.type);
  const storedName = `${id}.${ext}`;
  const storedAbs = path.join(uploadsDir, storedName);

  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(storedAbs, buf);

  const storedRel = path.relative(dataDir, storedAbs);

  const entry: AssetEntry = {
    id,
    kind: "file",
    title,
    category: category as any,
    status: status as any,
    rating,
    tags,
    sourceUrl,
    useCase,
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: file.size,
    storedPath: storedRel,
    createdAt: now,
    updatedAt: now,
  };

  assets.unshift(entry);
  (db as any).assets = assets.slice(0, 1000);
  await writeDb(db);

  return NextResponse.json(entry, { status: 201 });
}
