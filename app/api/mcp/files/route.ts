import { NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import { requireFsUnlocked } from "@/lib/fsLock";

export const runtime = "nodejs";

type FileEntry = {
  path: string;
  absolutePath: string;
  exists: boolean;
  size?: number;
  modifiedAt?: string;
  content?: string;
};

function normalizePath(input: string) {
  return path.isAbsolute(input) ? input : path.join(process.cwd(), input);
}

async function buildEntry(input: string, includeContent: boolean): Promise<FileEntry> {
  const absolutePath = normalizePath(input);
  try {
    const stat = await fs.stat(absolutePath);
    const entry: FileEntry = {
      path: input,
      absolutePath,
      exists: true,
      size: stat.size,
      modifiedAt: stat.mtime.toISOString()
    };
    if (includeContent) {
      entry.content = await fs.readFile(absolutePath, "utf-8");
    }
    return entry;
  } catch {
    return { path: input, absolutePath, exists: false };
  }
}

export async function GET(request: Request) {
  const gate = requireFsUnlocked();
  if (!gate.ok) {
    return NextResponse.json({ ok: false, error: "locked" }, { status: gate.status });
  }

  try {
    const url = new URL(request.url);
    const includeContent = url.searchParams.get("include") === "content";
    const list = (process.env.MOLTBOT_STABLE_CONTEXT_FILES || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const entries = await Promise.all(list.map((item) => buildEntry(item, includeContent)));
    return NextResponse.json({
      source: "MOLTBOT_STABLE_CONTEXT_FILES",
      files: entries
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to load files." }, { status: 500 });
  }
}
