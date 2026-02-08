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

const DEFAULT_DATA_DIR = path.join(process.cwd(), "data");
const DB_PATH = process.env.JARVIS_DB_PATH
  ? path.resolve(process.env.JARVIS_DB_PATH)
  : path.join(DEFAULT_DATA_DIR, "db.json");
const DATA_DIR = path.dirname(DB_PATH);

const DEFAULT_COLUMNS: Column[] = [
  { id: "col_inbox", title: "Inbox", key: "inbox", order: 0 },
  { id: "col_next", title: "Next", key: "next", order: 1 },
  { id: "col_doing", title: "Doing", key: "doing", order: 2 },
  { id: "col_waiting", title: "Waiting", key: "waiting", order: 3 },
  { id: "col_done", title: "Done", key: "done", order: 4 }
];

function createDefaultDb(): Database {
  const now = new Date().toISOString();
  return {
    tasks: [],
    columns: DEFAULT_COLUMNS.map((column) => ({ ...column })),
    tags: [],
    scripts: [],
    preferences: [],
    experiments: [],
    chatThreads: [],
    webhookEvents: [],
    usageEvents: [],
    usageAlerts: [],
    routineCache: [],
    labFrameworks: [],
    labSessions: [],
    labResearchPrompts: [],
    agents: { jarvis: null, claw: null },
    letters: [],
    agent: {
      status: "idle",
      gatewayStatus: "ok",
      metrics: {
        tokensUsedDaily: 0,
        tokensUsedWeekly: 0,
        messagesCount: 0,
        toolCallsCount: 0,
        totalCost: 0,
        uptime: 0,
        requestsProcessed: 0
      },
      lastDeploy: {
        id: "deploy_boot",
        environment: "production",
        url: "https://jarvis-dashboard-dun.vercel.app",
        status: "success",
        timestamp: now
      },
      activeRuns: 0,
      recentRuns: [],
      lastActive: now
    }
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
    projects: Array.isArray((safe as any).projects) ? ((safe as any).projects as any) : [],
    ui: (safe as any).ui && typeof (safe as any).ui === "object" ? ((safe as any).ui as any) : { activeProjectId: "proj_all" },
    tags: Array.isArray(safe.tags) ? safe.tags : [],
    scripts: Array.isArray(safe.scripts) ? safe.scripts : [],
    preferences: Array.isArray(safe.preferences) ? safe.preferences : [],
    experiments: Array.isArray(safe.experiments) ? safe.experiments : [],
    chatThreads: Array.isArray(safe.chatThreads) ? safe.chatThreads : [],
    webhookEvents: Array.isArray(safe.webhookEvents) ? safe.webhookEvents : [],
    usageEvents: Array.isArray(safe.usageEvents) ? safe.usageEvents : [],
    usageAlerts: Array.isArray(safe.usageAlerts) ? safe.usageAlerts : [],
    routineCache: Array.isArray(safe.routineCache) ? safe.routineCache : [],
    labFrameworks: Array.isArray(safe.labFrameworks) ? safe.labFrameworks : [],
    labSessions: Array.isArray(safe.labSessions) ? safe.labSessions : [],
    labResearchPrompts: Array.isArray(safe.labResearchPrompts) ? safe.labResearchPrompts : [],
    agents:
      safe.agents && typeof safe.agents === "object"
        ? (safe.agents as any)
        : createDefaultDb().agents,
    letters: Array.isArray((safe as any).letters) ? ((safe as any).letters as any) : [],
    agent: safe.agent ? safe.agent : createDefaultDb().agent
  };
}

function normalizeTask(task: Partial<Task>): Task {
  const now = new Date().toISOString();
  return {
    id: task.id ?? randomUUID(),
    title: task.title ?? "",
    columnId: task.columnId ?? DEFAULT_COLUMNS[0]?.id ?? "col_inbox",
    priority: task.priority ?? "P2",
    projectId: (task as any).projectId,
    tags: Array.isArray(task.tags) ? task.tags : [],
    description: task.description ?? "",
    nextAction: task.nextAction ?? "",
    swarmRequired: task.swarmRequired ?? false,
    processingMode: task.processingMode ?? "realtime",
    batchJobId: task.batchJobId,
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

export function createTask(
  partial: Partial<Task> & { title: string; columnId: string; projectId?: string }
): Task {
  const now = new Date().toISOString();
  return {
    id: randomUUID(),
    title: partial.title.trim(),
    columnId: partial.columnId,
    projectId: partial.projectId ?? "proj_all",
    priority: partial.priority ?? "P2",
    tags: partial.tags ?? [],
    description: partial.description ?? "",
    nextAction: partial.nextAction ?? "",
    swarmRequired: partial.swarmRequired ?? false,
    processingMode: partial.processingMode ?? "realtime",
    batchJobId: partial.batchJobId,
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
