import { NextResponse, type NextRequest } from "next/server";

export const runtime = "nodejs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { assertSafeSkillName, ensureSkillsDir, SKILLS_DIR } from "@/lib/skills";

const SECRET_PATTERNS: Array<{ name: string; re: RegExp }> = [
  { name: "OpenAI key", re: /\bsk-[a-zA-Z0-9]{20,}\b/ },
  { name: "Bearer token", re: /Authorization:\s*Bearer\s+[A-Za-z0-9._-]{10,}/i },
  { name: "Private key", re: /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/ },
  { name: "AWS Access Key", re: /\bAKIA[0-9A-Z]{16}\b/ },
  { name: "Generic api key assignment", re: /\b(api[_-]?key|secret|token|password)\b\s*[:=]\s*["'][^"']{8,}["']/i },
];

function runGit(args: string[]) {
  return execFileSync("git", args, { cwd: SKILLS_DIR, encoding: "utf8" }).trimEnd();
}

export async function POST(req: NextRequest) {
  ensureSkillsDir();

  try {
    const body = (await req.json()) as { message?: string; skill?: string };
    const message = (body.message || "").trim();
    const skill = (body.skill || "").trim();

    if (!message) {
      return NextResponse.json({ ok: false, error: "missing-message" }, { status: 400 });
    }

    // Ensure this is a git work tree.
    try {
      runGit(["rev-parse", "--is-inside-work-tree"]);
    } catch {
      return NextResponse.json({ ok: false, error: "skills-not-a-git-repo", skillsDir: SKILLS_DIR }, { status: 400 });
    }

    if (skill) {
      assertSafeSkillName(skill);
      runGit(["add", "--", path.join(SKILLS_DIR, skill)]);
    } else {
      runGit(["add", "-A"]);
    }

    const diff = runGit(["diff", "--cached"]);
    const findings = SECRET_PATTERNS.filter((p) => p.re.test(diff)).map((p) => p.name);
    if (findings.length) {
      // Unstage everything; require user to fix.
      try {
        runGit(["reset"]);
      } catch {
        // ignore
      }
      return NextResponse.json(
        {
          ok: false,
          error: "security-review-failed",
          findings,
          hint: "Potential secrets detected in staged diff. Remove/rotate secrets and try again.",
        },
        { status: 400 }
      );
    }

    // No changes?
    const status = runGit(["status", "--porcelain"]);
    if (!status) {
      return NextResponse.json({ ok: false, error: "no-changes" }, { status: 400 });
    }

    runGit(["commit", "-m", message]);
    const head = runGit(["rev-parse", "HEAD"]);
    return NextResponse.json({ ok: true, head });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "commit-failed" }, { status: 500 });
  }
}
