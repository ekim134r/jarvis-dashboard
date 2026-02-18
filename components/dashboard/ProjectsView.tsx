"use client";

import React, { useState, useMemo } from "react";
import type { Task, Column } from "@/lib/types";

// ─── Space config ────────────────────────────────────────────────────────────

type SpaceId = "personal" | "luminos" | "side" | "openclaw";

const SPACES: {
  id: SpaceId;
  label: string;
  subtitle: string;
  from: string;
  border: string;
  ringColor: string;
  textColor: string;
  dotColor: string;
  icon: string;
  matcher: (t: Task) => boolean;
}[] = [
  {
    id: "personal",
    label: "Personal",
    subtitle: "Self-improvement · Alltag",
    from: "from-violet-500/15",
    border: "border-violet-500/20",
    ringColor: "#8b5cf6",
    textColor: "text-violet-400",
    dotColor: "bg-violet-400",
    icon: "M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z",
    matcher: (t) =>
      t.projectId === "personal" ||
      t.projectType === "Personal" ||
      (t.tags?.includes("personal") ?? false),
  },
  {
    id: "luminos",
    label: "Luminos",
    subtitle: "SaaS · Hauptprojekt",
    from: "from-sky-500/15",
    border: "border-sky-500/20",
    ringColor: "#0ea5e9",
    textColor: "text-sky-400",
    dotColor: "bg-sky-400",
    icon: "M3.75 13.5l10.5-11.25L12 10.5h8.25L9.75 21.75 12 13.5H3.75z",
    matcher: (t) =>
      t.projectId === "luminos" ||
      t.projectType === "Large Project" ||
      (t.tags?.includes("luminos") ?? false),
  },
  {
    id: "side",
    label: "Side Projects",
    subtitle: "Ideen · Experimente · Quick wins",
    from: "from-emerald-500/15",
    border: "border-emerald-500/20",
    ringColor: "#10b981",
    textColor: "text-emerald-400",
    dotColor: "bg-emerald-400",
    icon: "M12 18v-5.25m0 0a6.01 6.01 0 001.5-.189m-1.5.189a6.01 6.01 0 01-1.5-.189m3.75 7.478a12.06 12.06 0 01-4.5 0m3.75 2.383a14.406 14.406 0 01-3 0M14.25 18v-.192c0-.983.658-1.823 1.508-2.316a7.5 7.5 0 10-7.517 0c.85.493 1.509 1.333 1.509 2.316V18",
    matcher: (t) =>
      t.projectId === "side" ||
      t.projectType === "Software" ||
      (t.tags?.includes("side") ?? false),
  },
  {
    id: "openclaw",
    label: "OpenClaw",
    subtitle: "AI Setup · Agent Infra · Jarvis",
    from: "from-amber-500/15",
    border: "border-amber-500/20",
    ringColor: "#f59e0b",
    textColor: "text-amber-400",
    dotColor: "bg-amber-400",
    icon: "M8.25 3v1.5M4.5 8.25H3m18 0h-1.5M4.5 12H3m18 0h-1.5m-15 3.75H3m18 0h-1.5M8.25 19.5V21M12 3v1.5m0 15V21m3.75-18v1.5m0 15V21m-9-1.5h10.5a2.25 2.25 0 002.25-2.25V6.75a2.25 2.25 0 00-2.25-2.25H6.75A2.25 2.25 0 004.5 6.75v10.5a2.25 2.25 0 002.25 2.25zm.75-12h9v9h-9v-9z",
    matcher: (t) =>
      t.projectId === "openclaw" ||
      (t.tags?.includes("openclaw") ?? false) ||
      (t.tags?.includes("ai") ?? false),
  },
];

// ─── Progress Ring ────────────────────────────────────────────────────────────

function Ring({ pct, color, size = 80 }: { pct: number; color: string; size?: number }) {
  const r = size / 2 - 7;
  const circ = 2 * Math.PI * r;
  const filled = circ * (Math.min(pct, 100) / 100);
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{ transform: "rotate(-90deg)" }}
    >
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke="rgba(255,255,255,0.07)"
        strokeWidth="5"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth="5"
        strokeDasharray={`${filled} ${circ}`}
        strokeLinecap="round"
        style={{ transition: "stroke-dasharray 0.9s cubic-bezier(0.4,0,0.2,1)" }}
      />
    </svg>
  );
}

// ─── Column key helpers ───────────────────────────────────────────────────────

function colStatus(col: Column | undefined): "done" | "active" | "waiting" | "queue" | "inbox" {
  const key = col?.key?.toLowerCase() ?? col?.title?.toLowerCase() ?? "";
  if (key.includes("done") || key.includes("finish") || key.includes("complet")) return "done";
  if (key.includes("doing") || key.includes("in-progress") || key.includes("active")) return "active";
  if (key.includes("wait") || key.includes("block") || key.includes("ceo")) return "waiting";
  if (key.includes("next") || key.includes("queue") || key.includes("ready")) return "queue";
  return "inbox";
}

const STATUS_META = {
  active: { label: "Active", dot: "bg-primary animate-pulse-slow", text: "text-primary" },
  waiting: { label: "Waiting", dot: "bg-warning", text: "text-warning" },
  queue: { label: "Next", dot: "bg-muted", text: "text-muted" },
  inbox: { label: "Inbox", dot: "bg-muted/50", text: "text-muted/70" },
  done: { label: "Done", dot: "bg-success", text: "text-success" },
};

// ─── Mission Card ─────────────────────────────────────────────────────────────

function MissionCard({ task, status }: { task: Task; status: keyof typeof STATUS_META }) {
  const s = STATUS_META[status];
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface-muted/50 px-4 py-3 transition-colors hover:bg-surface-muted/80">
      <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${s.dot}`} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-text">{task.title}</p>
        {task.description && (
          <p className="mt-0.5 truncate text-[11px] text-muted">{task.description}</p>
        )}
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${
            task.priority === "P0"
              ? "bg-danger/15 text-danger"
              : task.priority === "P1"
                ? "bg-warning/15 text-warning"
                : "bg-border text-muted"
          }`}>{task.priority}</span>
          {task.owner && (
            <span className="rounded border border-border bg-surface px-1.5 py-0.5 text-[9px] font-semibold text-muted">
              {task.owner}
            </span>
          )}
          {task.tags?.slice(0, 2).map((tag) => (
            <span key={tag} className="rounded border border-border bg-surface px-1.5 py-0.5 text-[9px] text-muted">
              {tag}
            </span>
          ))}
        </div>
      </div>
      <span className={`mt-0.5 shrink-0 text-[9px] font-bold uppercase ${s.text}`}>{s.label}</span>
    </div>
  );
}

// ─── Space Detail ─────────────────────────────────────────────────────────────

function SpaceDetail({
  spaceId,
  tasks,
  columns,
  onBack,
}: {
  spaceId: SpaceId;
  tasks: Task[];
  columns: Column[];
  onBack: () => void;
}) {
  const space = SPACES.find((s) => s.id === spaceId)!;
  const colMap = new Map(columns.map((c) => [c.id, c]));

  const grouped = useMemo(() => {
    const spaceTasks = tasks.filter(space.matcher);
    const groups: Record<keyof typeof STATUS_META, Task[]> = {
      active: [],
      waiting: [],
      queue: [],
      inbox: [],
      done: [],
    };
    for (const t of spaceTasks) {
      const col = colMap.get(t.columnId);
      const status = colStatus(col);
      groups[status].push(t);
    }
    return groups;
  }, [tasks, columns, spaceId]);

  const total = Object.values(grouped).flat().length;
  const done = grouped.done.length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const sections: { key: keyof typeof STATUS_META; label: string }[] = [
    { key: "active", label: "Active now" },
    { key: "waiting", label: "Waiting / Blocked" },
    { key: "queue", label: "Up next" },
    { key: "inbox", label: "Inbox" },
    { key: "done", label: "Done" },
  ];

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 rounded-xl border border-border bg-surface/70 px-3 py-2 text-xs font-semibold text-muted transition-colors hover:bg-surface hover:text-text"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          All Projects
        </button>

        <div className="flex items-center gap-3">
          <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${space.from} border ${space.border}`}>
            <svg className={`h-5 w-5 ${space.textColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
              <path strokeLinecap="round" strokeLinejoin="round" d={space.icon} />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-bold text-text">{space.label}</h2>
            <p className="text-xs text-muted">{space.subtitle}</p>
          </div>
        </div>

        <div className="ml-auto flex items-center gap-3">
          <Ring pct={pct} color={space.ringColor} size={48} />
          <div>
            <p className={`text-xl font-bold ${space.textColor}`}>{pct}%</p>
            <p className="text-[10px] text-muted">{done}/{total} done</p>
          </div>
        </div>
      </div>

      {/* Mission groups */}
      <div className="flex flex-col gap-6">
        {sections.map(({ key, label }) => {
          const group = grouped[key];
          if (group.length === 0) return null;
          return (
            <section key={key}>
              <div className="mb-2 flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${STATUS_META[key].dot}`} />
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">{label}</p>
                <span className="ml-1 rounded-full border border-border bg-surface px-1.5 py-0.5 text-[9px] font-semibold text-muted">
                  {group.length}
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {group.map((task) => (
                  <MissionCard key={task.id} task={task} status={key} />
                ))}
              </div>
            </section>
          );
        })}

        {total === 0 && (
          <div className="rounded-2xl border border-dashed border-border py-16 text-center">
            <p className="text-sm font-semibold text-text">No missions yet</p>
            <p className="mt-1 text-xs text-muted">
              Tasks with <code className="font-mono bg-surface px-1 rounded">projectId: &quot;{spaceId}&quot;</code> appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Space Card ───────────────────────────────────────────────────────────────

function SpaceCard({
  space,
  tasks,
  columns,
  onClick,
}: {
  space: (typeof SPACES)[number];
  tasks: Task[];
  columns: Column[];
  onClick: () => void;
}) {
  const colMap = new Map(columns.map((c) => [c.id, c]));
  const spaceTasks = tasks.filter(space.matcher);

  const total = spaceTasks.length;
  const done = spaceTasks.filter((t) => colStatus(colMap.get(t.columnId)) === "done").length;
  const active = spaceTasks.filter((t) => colStatus(colMap.get(t.columnId)) === "active").length;
  const waiting = spaceTasks.filter((t) => colStatus(colMap.get(t.columnId)) === "waiting").length;
  const pct = total > 0 ? Math.round((done / total) * 100) : 0;

  const statusLabel =
    active > 0 ? "Active" : total === 0 ? "Empty" : done === total ? "Complete" : "Idle";

  return (
    <button
      onClick={onClick}
      className={`group relative flex w-full flex-col overflow-hidden rounded-2xl border bg-gradient-to-br ${space.from} to-transparent ${space.border} p-6 text-left shadow-sm backdrop-blur-md transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg`}
    >
      {/* Top row: icon + status */}
      <div className="flex items-start justify-between">
        <div className={`flex h-11 w-11 items-center justify-center rounded-xl border ${space.border} bg-white/5`}>
          <svg className={`h-5 w-5 ${space.textColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d={space.icon} />
          </svg>
        </div>
        <span className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${
          active > 0
            ? `${space.border} ${space.textColor} bg-white/5`
            : "border-border text-muted bg-transparent"
        }`}>
          <span className={`h-1.5 w-1.5 rounded-full ${active > 0 ? space.dotColor + " animate-pulse-slow" : "bg-muted/40"}`} />
          {statusLabel}
        </span>
      </div>

      {/* Label + subtitle */}
      <div className="mt-4">
        <h3 className="text-xl font-bold text-text">{space.label}</h3>
        <p className="mt-0.5 text-xs text-muted">{space.subtitle}</p>
      </div>

      {/* Progress ring + number */}
      <div className="mt-5 flex items-center gap-4">
        <div className="relative">
          <Ring pct={pct} color={space.ringColor} size={72} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={`text-base font-bold ${space.textColor}`}>{pct}%</span>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <Chip label={`${total} tasks`} />
          {active > 0 && <Chip label={`${active} active`} accent />}
          {waiting > 0 && <Chip label={`${waiting} waiting`} warning />}
        </div>
      </div>

      {/* Progress bar */}
      <div className="mt-5 h-1 w-full overflow-hidden rounded-full bg-white/8">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{
            width: `${pct}%`,
            backgroundColor: space.ringColor,
            boxShadow: `0 0 8px ${space.ringColor}60`,
          }}
        />
      </div>

      {/* Arrow */}
      <div className="absolute right-5 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-hover:opacity-100">
        <svg className="h-5 w-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
        </svg>
      </div>
    </button>
  );
}

function Chip({ label, accent, warning }: { label: string; accent?: boolean; warning?: boolean }) {
  return (
    <span className={`inline-block rounded-lg px-2 py-0.5 text-[10px] font-semibold ${
      warning
        ? "bg-warning/10 text-warning"
        : accent
          ? "bg-primary/10 text-primary"
          : "bg-white/6 text-muted"
    }`}>
      {label}
    </span>
  );
}

// ─── Main View ────────────────────────────────────────────────────────────────

type ProjectsViewProps = {
  tasks: Task[];
  columns: Column[];
};

export default function ProjectsView({ tasks, columns }: ProjectsViewProps) {
  const [selected, setSelected] = useState<SpaceId | null>(null);

  if (selected) {
    return (
      <SpaceDetail
        spaceId={selected}
        tasks={tasks}
        columns={columns}
        onBack={() => setSelected(null)}
      />
    );
  }

  // Unassigned tasks (don't match any space)
  const assignedIds = new Set(
    tasks.filter((t) => SPACES.some((s) => s.matcher(t))).map((t) => t.id)
  );
  const unassigned = tasks.filter((t) => !assignedIds.has(t.id));

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div className="mb-6 flex items-end justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Workspaces</p>
          <h1 className="mt-0.5 text-2xl font-bold text-text">Projects</h1>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted">
          <span>{tasks.length} total tasks</span>
          <span className="text-border">·</span>
          <span className="text-success">{tasks.filter((t) => {
            const col = columns.find((c) => c.id === t.columnId);
            return colStatus(col) === "done";
          }).length} done</span>
        </div>
      </div>

      {/* 4 Space Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {SPACES.map((space) => (
          <SpaceCard
            key={space.id}
            space={space}
            tasks={tasks}
            columns={columns}
            onClick={() => setSelected(space.id)}
          />
        ))}
      </div>

      {/* Unassigned */}
      {unassigned.length > 0 && (
        <div className="mt-8">
          <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
            Unassigned · {unassigned.length} tasks
          </p>
          <div className="rounded-2xl border border-dashed border-border bg-surface-muted/30 p-4">
            <div className="flex flex-col gap-1.5">
              {unassigned.slice(0, 6).map((task) => {
                const col = columns.find((c) => c.id === task.columnId);
                const status = colStatus(col);
                return <MissionCard key={task.id} task={task} status={status} />;
              })}
              {unassigned.length > 6 && (
                <p className="pt-1 text-center text-xs text-muted">+{unassigned.length - 6} more</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
