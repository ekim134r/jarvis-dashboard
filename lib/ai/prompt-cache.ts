import { promises as fs } from "fs";

type CacheEntry = {
  key: string;
  value: string;
  mtimeMs: number;
};

const cache = new Map<string, CacheEntry>();

async function readFileWithCache(filePath: string) {
  const stat = await fs.stat(filePath);
  const cached = cache.get(filePath);
  if (cached && cached.mtimeMs === stat.mtimeMs) {
    return cached.value;
  }
  const value = await fs.readFile(filePath, "utf-8");
  cache.set(filePath, { key: filePath, value, mtimeMs: stat.mtimeMs });
  return value;
}

export async function getStableContext(): Promise<string> {
  const raw = process.env.MOLTBOT_STABLE_CONTEXT_FILES;
  if (!raw) return "";
  const files = raw
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  if (files.length === 0) return "";
  const contents = await Promise.all(
    files.map(async (file) => {
      try {
        const text = await readFileWithCache(file);
        return `# ${file}\n${text}`;
      } catch {
        return `# ${file}\n(unavailable)`;
      }
    })
  );
  return contents.join("\n\n");
}
