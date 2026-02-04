import { promises as fs } from "fs";
import path from "path";
import { randomUUID } from "crypto";
import type {
  Column,
  Database,
  Experiment,
  Preference,
  Script,
  Tag,
  Task
} from "@/lib/types";

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
    scripts: [],
    preferences: [],
    experiments: []
  };
}

function normalizeDatabase(input: Partial<Database> | undefined): Database {
  const safe = input ?? {};
  return {
    tasks: Array.isArray(safe.tasks)
      ? safe.tasks.map((task) => normalizeTask(task))
      : [],
    columns:
      Array.isArray(safe.columns) && safe.columns.length > 0
        ? safe.columns
        : createDefaultDb().columns,
    tags: Array.isArray(safe.tags) ? safe.tags : [],
    scripts: Array.isArray(safe.scripts) ? safe.scripts : [],
    preferences: Array.isArray(safe.preferences) ? safe.preferences : [],
    experiments: Array.isArray(safe.experiments) ? safe.experiments : []
  };
}

function normalizeTask(task: Partial<Task>): Task {
  const now = new Date().toISOString();
  return {
    id: task.id ?? randomUUID(),
    title: task.title ?? "",
    columnId: task.columnId ?? DEFAULT_COLUMNS[0]?.id ?? "col_inbox",
    priority: task.priority ?? "Medium",
    tags: Array.isArray(task.tags) ? task.tags : [],
    description: task.description ?? "",
    notes: task.notes ?? "",
    sensitiveNotes: task.sensitiveNotes ?? "",
    privateNumbers: task.privateNumbers,
    checklist: Array.isArray(task.checklist) ? task.checklist : [],
    definitionOfDone: Array.isArray(task.definitionOfDone)
      ? task.definitionOfDone
      : [],
    links: Array.isArray(task.links) ? task.links : [],
    estimateHours: task.estimateHours,
    dueDate: task.dueDate,
    dependencies: Array.isArray(task.dependencies) ? task.dependencies : [],
    impact: task.impact ?? "Medium",
    effort: task.effort ?? "Medium",
    confidence: task.confidence ?? 3,
    createdAt: task.createdAt ?? now,
    updatedAt: task.updatedAt ?? now
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
    sensitiveNotes: partial.sensitiveNotes ?? "",
    privateNumbers: partial.privateNumbers,
    checklist: partial.checklist ?? [],
    definitionOfDone: partial.definitionOfDone ?? [],
    links: partial.links ?? [],
    estimateHours: partial.estimateHours,
    dueDate: partial.dueDate,
    dependencies: partial.dependencies ?? [],
    impact: partial.impact ?? "Medium",
    effort: partial.effort ?? "Medium",
    confidence: partial.confidence ?? 3,
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

export function createPreference(
  partial: Pick<Preference, "prompt"> & Partial<Preference>
): Preference {
  const now = new Date().toISOString();
  return {
    id: partial.id ?? randomUUID(),
    prompt: partial.prompt.trim(),
    leftLabel: partial.leftLabel?.trim() || "No",
    rightLabel: partial.rightLabel?.trim() || "Yes",
    tags: partial.tags ?? [],
    decision: partial.decision ?? "unset",
    confidence: partial.confidence ?? 3,
    notes: partial.notes ?? "",
    createdAt: now,
    updatedAt: now
  };
}

export function createExperiment(
  partial: Pick<Experiment, "title"> & Partial<Experiment>
): Experiment {
  const now = new Date().toISOString();
  return {
    id: partial.id ?? randomUUID(),
    title: partial.title.trim(),
    hypothesis: partial.hypothesis ?? "",
    metric: partial.metric ?? "",
    status: partial.status ?? "Idea",
    result: partial.result ?? "Pending",
    startDate: partial.startDate,
    endDate: partial.endDate,
    owner: partial.owner,
    notes: partial.notes ?? "",
    tags: partial.tags ?? [],
    createdAt: now,
    updatedAt: now
  };
}

export function getDefaultColumns(): Column[] {
  return DEFAULT_COLUMNS;
}
