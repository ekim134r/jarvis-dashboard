import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";

import fsp from "node:fs/promises";
import { assertInsideSkillDir, canEditFile, resolveSkillDir } from "@/lib/skills";

export async function GET(req: NextRequest, ctx: { params: { skill: string } }) {
  try {
    const rel = req.nextUrl.searchParams.get("rel") || "";
    const skillDir = resolveSkillDir(ctx.params.skill);
    const { abs, norm } = assertInsideSkillDir(skillDir, rel);

    const content = await fsp.readFile(abs, "utf8");
    return NextResponse.json({ ok: true, relPath: norm, content, editable: canEditFile(norm) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 400 });
  }
}

export async function PUT(req: NextRequest, ctx: { params: { skill: string } }) {
  try {
    const body = (await req.json()) as { relPath?: string; content?: string };
    const rel = (body.relPath || "").trim();
    const content = body.content ?? "";

    const skillDir = resolveSkillDir(ctx.params.skill);
    const { abs, norm } = assertInsideSkillDir(skillDir, rel);

    if (!canEditFile(norm)) {
      return NextResponse.json({ ok: false, error: "extension-not-allowed" }, { status: 403 });
    }

    await fsp.writeFile(abs, content, "utf8");
    return NextResponse.json({ ok: true, relPath: norm });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 400 });
  }
}
