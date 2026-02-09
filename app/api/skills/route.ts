import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";
import { ensureSkillsDir, SKILLS_DIR } from "@/lib/skills";

export const runtime = "nodejs";

type SkillEntry = {
  name: string;
  path: string;
  hasSkillMd: boolean;
};

export async function GET() {
  const skillsDir = ensureSkillsDir();
  let entries: SkillEntry[] = [];

  try {
    const dirents = fs.readdirSync(skillsDir, { withFileTypes: true });
    entries = dirents
      .filter((d) => d.isDirectory())
      .map((d) => {
        const p = path.join(skillsDir, d.name);
        const has = fs.existsSync(path.join(p, "SKILL.md"));
        return { name: d.name, path: p, hasSkillMd: has };
      })
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    entries = [];
  }

  return NextResponse.json({ skillsDir: SKILLS_DIR, entries });
}
