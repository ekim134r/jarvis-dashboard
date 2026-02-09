import fs from "node:fs";
import path from "node:path";

export const SKILLS_DIR = path.join(process.env.HOME || "", ".openclaw", "skills");

// Explicit allowlist for in-dashboard editing. Keep conservative.
export const EDIT_ALLOWED_EXTENSIONS = new Set([
  ".md",
  ".txt",
  ".json",
  ".yml",
  ".yaml",
  ".toml",
  ".js",
  ".cjs",
  ".mjs",
  ".ts",
  ".tsx",
  ".css",
  ".scss",
  ".html",
]);

export function assertSafeSkillName(name: string) {
  if (!name || typeof name !== "string") throw new Error("invalid-skill");
  // Avoid path traversal and weird characters.
  if (!/^[a-zA-Z0-9._-]+$/.test(name)) throw new Error("invalid-skill");
}

export function resolveSkillDir(skillName: string) {
  assertSafeSkillName(skillName);
  return path.join(SKILLS_DIR, skillName);
}

export function assertInsideSkillDir(skillDir: string, relPath: string) {
  if (!relPath || typeof relPath !== "string") throw new Error("invalid-path");
  if (path.isAbsolute(relPath)) throw new Error("invalid-path");
  // Normalize and block traversal.
  const norm = path.posix.normalize(relPath.replaceAll("\\", "/"));
  if (norm.startsWith("../") || norm === "..") throw new Error("invalid-path");

  const abs = path.join(skillDir, norm);
  const rel = path.relative(skillDir, abs);
  if (rel.startsWith("..") || path.isAbsolute(rel)) throw new Error("invalid-path");
  return { abs, norm };
}

export function canEditFile(relPath: string) {
  const ext = path.extname(relPath).toLowerCase();
  return EDIT_ALLOWED_EXTENSIONS.has(ext);
}

export function ensureSkillsDir() {
  fs.mkdirSync(SKILLS_DIR, { recursive: true });
  return SKILLS_DIR;
}
