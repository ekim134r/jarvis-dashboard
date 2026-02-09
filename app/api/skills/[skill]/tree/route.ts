import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

import fs from "node:fs";
import path from "node:path";
import { canEditFile, resolveSkillDir } from "@/lib/skills";

type FileEntry = {
  relPath: string;
  kind: "file" | "dir";
  editable: boolean;
};

function walk(root: string, relBase = "") {
  const out: FileEntry[] = [];
  const absBase = path.join(root, relBase);
  const dirents = fs.readdirSync(absBase, { withFileTypes: true });

  for (const d of dirents) {
    if (d.name === ".git") continue;
    const relPath = path.posix.join(relBase.replaceAll("\\", "/"), d.name);
    if (d.isDirectory()) {
      out.push({ relPath, kind: "dir", editable: false });
      out.push(...walk(root, relPath));
    } else if (d.isFile()) {
      out.push({ relPath, kind: "file", editable: canEditFile(relPath) });
    }
  }

  return out;
}

export async function GET(_req: NextRequest, ctx: { params: { skill: string } }) {
  try {
    const skillDir = resolveSkillDir(ctx.params.skill);
    const entries = walk(skillDir).sort((a, b) => a.relPath.localeCompare(b.relPath));
    return NextResponse.json({ ok: true, skill: ctx.params.skill, entries });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 400 });
  }
}
