import React from "react";
import { AgentState, Task, Column } from "@/lib/types";
import RunsList from "./RunsList";
import MetricsPanel from "./MetricsPanel";
import { TaskCounts } from "./TaskStatsCards";

type OverviewGridProps = {
  agentState: AgentState;
  heroDate: string;
  vps?: { health?: string; uptimeSec?: number } | null;
  taskCounts: TaskCounts;
  tasks?: Task[];
  columns?: Column[];
};

const STATUS_STYLES = {
  active: {
    ring: "ring-success/30",
    bg: "bg-success/10",
    dot: "bg-success animate-pulse-slow shadow-[0_0_10px_3px_rgba(67,255,182,0.4)]",
    label: "Active",
    textColor: "text-success",
  },
  idle: {
    ring: "ring-warning/30",
    bg: "bg-warning/10",
    dot: "bg-warning",
    label: "Idle",
    textColor: "text-warning",
  },
  stopped: {
    ring: "ring-border",
    bg: "bg-surface-muted/60",
    dot: "bg-muted/40",
    label: "Stopped",
    textColor: "text-muted",
  },
  error: {
    ring: "ring-danger/30",
    bg: "bg-danger/10",
    dot: "bg-danger",
    label: "Error",
    textColor: "text-danger",
  },
} as const;

type StatusKey = keyof typeof STATUS_STYLES;

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${Math.round(n / 1_000)}k`;
  return String(n);
}

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

export default function OverviewGrid({ agentState, heroDate, vps, taskCounts, tasks = [], columns = [] }: OverviewGridProps) {
  const { status: rawStatus, metrics, recentRuns, activeRuns, lastActive, gatewayStatus } = agentState;
  const status: StatusKey = rawStatus in STATUS_STYLES ? (rawStatus as StatusKey) : "stopped";
  const sc = STATUS_STYLES[status];

  // Derive tasks that need attention
  const waitingCol = columns.find(
    (c) => c.key === "waiting" || c.title?.toLowerCase().includes("wait") || c.title?.toLowerCase().includes("ceo")
  );
  const doingCol = columns.find(
    (c) => c.key === "doing" || c.key === "in-progress" || c.title?.toLowerCase().includes("doing")
  );

  const attentionTasks = waitingCol
    ? tasks.filter((t) => t.columnId === waitingCol.id).slice(0, 3)
    : tasks.filter((t) => t.priority === "P0").slice(0, 3);

  const activeTasks = doingCol
    ? tasks.filter((t) => t.columnId === doingCol.id).slice(0, 3)
    : [];

  const completionPct = taskCounts.total > 0 ? Math.round((taskCounts.done / taskCounts.total) * 100) : 0;

  return (
    <div className="mb-6 flex flex-col gap-6 animate-fade-in">

      {/* ── Hero Row ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">

        {/* Agent Status — big card */}
        <div className={`col-span-1 rounded-2xl border bg-surface/80 p-5 shadow-sm backdrop-blur-md ring-1 ${sc.ring} ${sc.bg}`}>
          <div className="flex items-start justify-between">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Jarvis</p>
              <div className="mt-1 flex items-center gap-2.5">
                <span className={`h-3 w-3 rounded-full ${sc.dot}`} />
                <span className={`text-2xl font-bold ${sc.textColor}`}>{sc.label}</span>
              </div>
              <p className="mt-1.5 text-xs text-muted">
                Last active {timeAgo(lastActive)}
              </p>
            </div>
            {activeRuns > 0 && (
              <div className="rounded-xl bg-primary/10 px-3 py-1.5 text-center">
                <p className="text-xl font-bold text-primary">{activeRuns}</p>
                <p className="text-[9px] font-bold uppercase tracking-wider text-primary/70">Running</p>
              </div>
            )}
          </div>

          {/* Latest run log */}
          {recentRuns[0] && (
            <div className="mt-4 rounded-xl border border-border bg-surface-muted/60 px-3 py-2">
              <p className="truncate text-[11px] font-medium text-text">
                {recentRuns[0].shortLog?.split("\n")[0]?.slice(0, 60) || `${recentRuns[0].type} run`}
              </p>
              <div className="mt-1 flex items-center gap-2">
                <span className="text-[9px] uppercase text-muted">{recentRuns[0].type}</span>
                <span className="text-muted">·</span>
                <span className="text-[9px] text-muted">{timeAgo(recentRuns[0].startedAt)}</span>
                <span
                  className={`ml-auto rounded px-1.5 py-0.5 text-[8px] font-bold uppercase ${
                    recentRuns[0].status === "running"
                      ? "bg-primary/15 text-primary"
                      : recentRuns[0].status === "success"
                        ? "bg-success/15 text-success"
                        : "bg-danger/15 text-danger"
                  }`}
                >
                  {recentRuns[0].status}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* KPI Strip */}
        <div className="col-span-2 grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
          {[
            { label: "Open", value: taskCounts.open, sub: "tasks", color: "text-text" },
            { label: "Doing", value: taskCounts.inProgress, sub: "in progress", color: "text-primary" },
            { label: "Done", value: taskCounts.done, sub: `${completionPct}% complete`, color: "text-success" },
            { label: "Tokens", value: formatTokens(metrics.tokensUsedDaily), sub: "today", color: "text-text" },
          ].map((kpi) => (
            <div key={kpi.label} className="rounded-2xl border border-border bg-surface/80 p-4 backdrop-blur-md shadow-sm">
              <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted">{kpi.label}</p>
              <p className={`mt-1.5 text-3xl font-bold ${kpi.color}`}>{kpi.value}</p>
              <p className="mt-0.5 text-[10px] text-muted">{kpi.sub}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Work Row ─────────────────────────────────────── */}
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">

        {/* Left: Active Tasks + Needs You */}
        <div className="flex flex-col gap-4 lg:col-span-8">

          {/* What's being done */}
          {activeTasks.length > 0 && (
            <section className="rounded-2xl border border-border bg-surface/80 p-5 backdrop-blur-md shadow-sm">
              <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">In progress</p>
              <div className="flex flex-col gap-2">
                {activeTasks.map((task) => (
                  <div key={task.id} className="flex items-center gap-3 rounded-xl border border-border bg-surface-muted/50 px-4 py-3">
                    <span className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${
                      task.priority === "P0" ? "bg-danger/15 text-danger" : "bg-primary/10 text-primary"
                    }`}>{task.priority}</span>
                    <p className="min-w-0 flex-1 truncate text-sm font-medium text-text">{task.title}</p>
                    <span className="shrink-0 rounded-full bg-primary/10 w-2 h-2 animate-pulse-slow" />
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Needs You */}
          <section className="rounded-2xl border border-border bg-surface/80 p-5 backdrop-blur-md shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Needs you</p>
              {attentionTasks.length > 0 && (
                <span className="rounded-full border border-warning/30 bg-warning/10 px-2 py-0.5 text-[10px] font-bold text-warning">
                  {attentionTasks.length} waiting
                </span>
              )}
            </div>

            {attentionTasks.length > 0 ? (
              <div className="flex flex-col gap-2">
                {attentionTasks.map((task) => (
                  <div key={task.id} className="flex items-start gap-3 rounded-xl border border-warning/20 bg-warning/5 px-4 py-3">
                    <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold ${
                      task.priority === "P0" ? "bg-danger/15 text-danger" : "bg-warning/15 text-warning"
                    }`}>{task.priority}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-text">{task.title}</p>
                      {task.description && (
                        <p className="mt-0.5 line-clamp-1 text-xs text-muted">{task.description}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-border bg-surface-muted/40 py-6 text-center">
                <p className="text-sm font-semibold text-text">Queue clear</p>
                <p className="mt-1 text-xs text-muted">Nothing is waiting on you</p>
              </div>
            )}
          </section>

          {/* System Status Strip */}
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface/70 px-4 py-3 backdrop-blur-md">
            <StatusChip
              label="Gateway"
              ok={gatewayStatus === "ok"}
              warn={gatewayStatus === "warn"}
            />
            <StatusChip label="VPS" ok={vps?.health === "ok" || vps?.health === "healthy"} />
            <StatusChip label="Memory RAG" ok={true} />
            <div className="ml-auto text-[10px] font-semibold text-muted">{heroDate}</div>
          </div>
        </div>

        {/* Right: Activity + Metrics */}
        <div className="flex flex-col gap-4 lg:col-span-4">
          <section className="rounded-2xl border border-border bg-surface/80 p-5 backdrop-blur-md shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Recent runs</p>
            <RunsList runs={recentRuns} />
          </section>

          <section className="rounded-2xl border border-border bg-surface/80 p-5 backdrop-blur-md shadow-sm">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">7-day metrics</p>
            <MetricsPanel metrics={metrics} />
          </section>
        </div>
      </div>
    </div>
  );
}

function StatusChip({ label, ok, warn }: { label: string; ok: boolean; warn?: boolean }) {
  return (
    <div className="flex items-center gap-1.5 rounded-lg border border-border bg-surface-muted/60 px-2.5 py-1.5">
      <span className={`h-1.5 w-1.5 rounded-full ${ok ? "bg-success" : warn ? "bg-warning" : "bg-danger"}`} />
      <span className="text-[10px] font-semibold text-muted">{label}</span>
    </div>
  );
}
