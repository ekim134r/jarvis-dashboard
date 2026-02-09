import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
import fs from "node:fs";
import fsp from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { assertSafeSkillName, ensureSkillsDir, SKILLS_DIR } from "@/lib/skills";

function pickSkillNameFromDir(dir: string) {
  // If the extracted dir has a single root folder, treat that as skill name.
  const dirents = fs.readdirSync(dir, { withFileTypes: true });
  const folders = dirents.filter((d) => d.isDirectory()).map((d) => d.name);
  if (folders.length === 1) return folders[0];
  return null;
}

function copyDir(src: string, dest: string) {
  fs.cpSync(src, dest, { recursive: true, force: true, errorOnExist: false });
}

export async function POST(req: NextRequest) {
  ensureSkillsDir();

  const contentType = req.headers.get("content-type") || "";
  try {
    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file");
      const skillNameRaw = (form.get("skillName") as string | null) ?? "";
      const overwrite = ((form.get("overwrite") as string | null) ?? "false") === "true";

      if (!(file instanceof File)) {
        return NextResponse.json({ ok: false, error: "missing-file" }, { status: 400 });
      }

      let skillName = skillNameRaw?.trim();
      const tmpBase = await fsp.mkdtemp(path.join(os.tmpdir(), "openclaw-skill-"));
      const zipPath = path.join(tmpBase, "upload.zip");
      const extractDir = path.join(tmpBase, "extract");
      await fsp.mkdir(extractDir, { recursive: true });

      const buf = Buffer.from(await file.arrayBuffer());
      await fsp.writeFile(zipPath, buf);

      // Extract using system unzip (macOS/Linux). Prefer quiet.
      execFileSync("unzip", ["-q", zipPath, "-d", extractDir], { stdio: "ignore" });

      if (!skillName) {
        skillName = pickSkillNameFromDir(extractDir) ?? "";
      }
      assertSafeSkillName(skillName);

      const dest = path.join(SKILLS_DIR, skillName);
      if (fs.existsSync(dest) && !overwrite) {
        return NextResponse.json({ ok: false, error: "exists", skillName }, { status: 409 });
      }

      // If extracted structure has single root folder, copy that folder contents.
      const single = pickSkillNameFromDir(extractDir);
      const src = single ? path.join(extractDir, single) : extractDir;

      await fsp.rm(dest, { recursive: true, force: true });
      copyDir(src, dest);

      return NextResponse.json({ ok: true, skillName, dest });
    }

    // JSON mode: install from existing local folder path.
    const body = (await req.json()) as { sourcePath?: string; skillName?: string; overwrite?: boolean };
    const sourcePath = (body.sourcePath || "").trim();
    let skillName = (body.skillName || "").trim();
    const overwrite = Boolean(body.overwrite);

    if (!sourcePath) {
      return NextResponse.json({ ok: false, error: "missing-sourcePath" }, { status: 400 });
    }

    const stat = await fsp.stat(sourcePath).catch(() => null);
    if (!stat || !stat.isDirectory()) {
      return NextResponse.json({ ok: false, error: "sourcePath-not-dir" }, { status: 400 });
    }

    if (!skillName) {
      skillName = path.basename(path.resolve(sourcePath));
    }
    assertSafeSkillName(skillName);

    const dest = path.join(SKILLS_DIR, skillName);
    if (fs.existsSync(dest) && !overwrite) {
      return NextResponse.json({ ok: false, error: "exists", skillName }, { status: 409 });
    }

    await fsp.rm(dest, { recursive: true, force: true });
    copyDir(sourcePath, dest);

    return NextResponse.json({ ok: true, skillName, dest });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "install-failed" },
      { status: 500 }
    );
  }
}
