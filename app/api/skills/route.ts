import { NextResponse } from "next/server";
import fs from "node:fs";
import path from "node:path";

type SkillEntry = {
  name: string;
  path: string;
  hasSkillMd: boolean;
};

export async function GET() {
  const skillsDir = path.join(process.env.HOME || "", ".openclaw", "skills");
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
  } catch (e) {
    entries = [];
  }

  return NextResponse.json({ skillsDir, entries });
}
