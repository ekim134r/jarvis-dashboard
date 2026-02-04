import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type { Column, Database, Script, Tag, Task } from "@/lib/types";

const DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = path.join(DATA_DIR, "db.json");

const DEFAULT_COLUMNS: Column[] = [
  { id: "col_inbox", title: "Inbox", key: "inbox", order: 0 },
  { id: "col_next", title: "Next", key: "next", order: 1 },
  { id: "col_doing", title: "Doing", key: "doing", order: 2 },
  { id: "col_waiting", title: "Waiting", key: "waiting", order: 3 },
  { id: "col_done", title: "Done", key: "done", order: 4 }
];

function createDefaultDb(): Database {
  return {
    tasks: [],
    columns: DEFAULT_COLUMNS.map((column) => ({ ...column })),
    tags: [],
    scripts: []
  };
}

function normalizeDatabase(input: Partial<Database> | undefined): Database {
  const safe = input ?? {};
  return {
    tasks: Array.isArray(safe.tasks) ? safe.tasks : [],
    columns:
      Array.isArray(safe.columns) && safe.columns.length > 0
        ? safe.columns
        : createDefaultDb().columns,
    tags: Array.isArray(safe.tags) ? safe.tags : [],
    scripts: Array.isArray(safe.scripts) ? safe.scripts : []
  };
}

export async function readDb(): Promise<Database> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    return normalizeDatabase(JSON.parse(raw));
  } catch (error) {
    const defaults = createDefaultDb();
    await writeDb(defaults);
    return defaults;
  }
}

export async function writeDb(data: Database): Promise<void> {
  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(DB_PATH, JSON.stringify(data, null, 2), "utf-8");
}

export function createTask(partial: Partial<Task> & { title: string; columnId: string }): Task {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    title: partial.title.trim(),
    columnId: partial.columnId,
    priority: partial.priority ?? "Medium",
    tags: partial.tags ?? [],
    description: partial.description ?? "",
    notes: partial.notes ?? "",
    checklist: partial.checklist ?? [],
    definitionOfDone: partial.definitionOfDone ?? [],
    links: partial.links ?? [],
    createdAt: now,
    updatedAt: now
  };
}

export function createColumn(partial: Pick<Column, "title"> & Partial<Column>): Column {
  return {
    id: partial.id ?? randomUUID(),
    title: partial.title.trim(),
    key: partial.key,
    order: partial.order ?? 0
  };
}

export function createTag(partial: Pick<Tag, "label"> & Partial<Tag>): Tag {
  return {
    id: partial.id ?? randomUUID(),
    label: partial.label.trim(),
    color: partial.color ?? "#94a3b8"
  };
}

export function createScript(partial: Pick<Script, "name" | "command"> & Partial<Script>): Script {
  const now = new Date().toISOString();
  return {
    id: partial.id ?? randomUUID(),
    name: partial.name.trim(),
    description: partial.description ?? "",
    command: partial.command.trim(),
    tags: partial.tags ?? [],
    favorite: partial.favorite ?? false,
    createdAt: now,
    updatedAt: now
  };
}

export function getDefaultColumns(): Column[] {
  return DEFAULT_COLUMNS;
}
