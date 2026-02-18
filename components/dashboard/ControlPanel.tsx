"use client";

import React, { useEffect, useState } from "react";
import type { AgentState, Task, Column } from "@/lib/types";

type ControlPanelProps = {
  agentState: AgentState | null;
  tasks: Task[];
  columns: Column[];
};

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

function formatTokens(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `${(n / 1_000).toFixed(0)}k`;
  return String(n);
}

const STATUS_CONFIG = {
  active: {
    label: "Active",
    dot: "bg-success animate-pulse",
    glow: "shadow-[0_0_12px_3px_rgba(67,255,182,0.3)]",
    badge: "text-success bg-success/10 border-success/25",
  },
  idle: {
    label: "Idle",
    dot: "bg-warning",
    glow: "",
    badge: "text-warning bg-warning/10 border-warning/25",
  },
  stopped: {
    label: "Stopped",
    dot: "bg-muted/40",
    glow: "",
    badge: "text-muted bg-muted/10 border-border",
  },
  error: {
    label: "Error",
    dot: "bg-danger",
    glow: "",
    badge: "text-danger bg-danger/10 border-danger/25",
  },
} as const;

type StatusKey = keyof typeof STATUS_CONFIG;

export default function ControlPanel({ agentState, tasks, columns }: ControlPanelProps) {
  const [time, setTime] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setTime(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  const rawStatus = agentState?.status ?? "stopped";
  const status: StatusKey = rawStatus in STATUS_CONFIG ? (rawStatus as StatusKey) : "stopped";
  const cfg = STATUS_CONFIG[status];

  // Tasks that need the user's attention: "Waiting" column or P0 open tasks
  const waitingCol = columns.find(
    (c) => c.key === "waiting" || c.title?.toLowerCase().includes("wait") || c.title?.toLowerCase().includes("ceo")
  );
  const needsTasks = waitingCol
    ? tasks.filter((t) => t.columnId === waitingCol.id).slice(0, 4)
    : tasks.filter((t) => t.priority === "P0").slice(0, 4);

  // Latest run
  const latestRun = agentState?.recentRuns?.[0];
  const activeRuns = agentState?.activeRuns ?? 0;

  const hour = time.getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <aside className="hidden xl:flex w-[272px] shrink-0">
      <div className="sticky top-6 flex h-fit w-full flex-col gap-4 rounded-2xl border border-white/10 bg-surface/80 p-4 shadow-xl backdrop-blur-2xl dark:border-white/5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
              {greeting}
            </p>
            <p className="text-xs font-semibold text-text">
              {time.toLocaleTimeString("de-DE", { hour: "2-digit", minute: "2-digit" })}
            </p>
          </div>
          <div
            className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${cfg.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${cfg.dot} ${cfg.glow}`} />
            {cfg.label}
          </div>
        </div>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Active / Last Run */}
        <section>
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
            {activeRuns > 0 ? "Running now" : "Last activity"}
          </p>

          {latestRun ? (
            <div className="rounded-xl border border-border bg-surface-muted/60 p-3">
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <p className="truncate text-xs font-semibold text-text">
                    {latestRun.shortLog?.split("\n")[0]?.slice(0, 48) || `${latestRun.type} run`}
                  </p>
                  <p className="mt-0.5 text-[10px] text-muted">{timeAgo(latestRun.startedAt)}</p>
                </div>
                <span
                  className={`mt-0.5 shrink-0 rounded-md px-1.5 py-0.5 text-[9px] font-bold uppercase ${
                    latestRun.status === "running"
                      ? "bg-primary/15 text-primary"
                      : latestRun.status === "success"
                        ? "bg-success/15 text-success"
                        : "bg-danger/15 text-danger"
                  }`}
                >
                  {latestRun.status}
                </span>
              </div>
              <div className="mt-2 flex items-center gap-2">
                <span className="rounded-md border border-border bg-surface px-1.5 py-0.5 text-[9px] font-semibold text-muted uppercase">
                  {latestRun.type}
                </span>
                <span className="text-[9px] text-muted">{latestRun.model}</span>
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface-muted/40 p-3 text-center">
              <p className="text-xs text-muted">No recent runs</p>
            </div>
          )}
        </section>

        {/* Needs You */}
        <section>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted">Needs you</p>
            {needsTasks.length > 0 && (
              <span className="flex h-4 w-4 items-center justify-center rounded-full bg-warning/20 text-[9px] font-bold text-warning">
                {needsTasks.length}
              </span>
            )}
          </div>

          {needsTasks.length > 0 ? (
            <div className="flex flex-col gap-1.5">
              {needsTasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-start gap-2 rounded-xl border border-border bg-surface-muted/50 px-3 py-2.5"
                >
                  <span
                    className={`mt-0.5 shrink-0 rounded px-1 py-0.5 text-[8px] font-bold ${
                      task.priority === "P0"
                        ? "bg-danger/15 text-danger"
                        : task.priority === "P1"
                          ? "bg-warning/15 text-warning"
                          : "bg-border text-muted"
                    }`}
                  >
                    {task.priority}
                  </span>
                  <p className="min-w-0 flex-1 truncate text-[11px] font-medium text-text">
                    {task.title}
                  </p>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-surface-muted/40 p-3 text-center">
              <p className="text-xs text-muted">Queue clear</p>
              <p className="mt-0.5 text-[10px] text-muted/60">Nothing waiting on you</p>
            </div>
          )}
        </section>

        {/* Divider */}
        <div className="h-px bg-border" />

        {/* Quick Metrics */}
        {agentState?.metrics && (
          <section>
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.2em] text-muted">
              Today
            </p>
            <div className="grid grid-cols-2 gap-2">
              <div className="rounded-xl border border-border bg-surface-muted/50 p-2.5 text-center">
                <p className="text-base font-bold text-primary">
                  {formatTokens(agentState.metrics.tokensUsedDaily)}
                </p>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">Tokens</p>
              </div>
              <div className="rounded-xl border border-border bg-surface-muted/50 p-2.5 text-center">
                <p className="text-base font-bold text-text">
                  {agentState.metrics.messagesCount}
                </p>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">Messages</p>
              </div>
              <div className="rounded-xl border border-border bg-surface-muted/50 p-2.5 text-center">
                <p className="text-base font-bold text-text">
                  {agentState.metrics.toolCallsCount}
                </p>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">Tools</p>
              </div>
              <div className="rounded-xl border border-border bg-surface-muted/50 p-2.5 text-center">
                <p className="text-base font-bold text-text">
                  ${agentState.metrics.totalCost.toFixed(2)}
                </p>
                <p className="text-[9px] font-semibold uppercase tracking-wider text-muted">Cost</p>
              </div>
            </div>
          </section>
        )}

        {/* Memory Indicator */}
        <div className="rounded-xl border border-border bg-surface-muted/40 p-3">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-primary/10">
              <svg className="h-3.5 w-3.5 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.519C4.195 15.325 4 16.294 4 17.5c0 1.933 1.567 3.5 3.5 3.5h9c1.933 0 3.5-1.567 3.5-3.5 0-1.206-.195-2.175-1-2.981l-4.091-4.11a2.25 2.25 0 01-.659-1.591V3.104" />
              </svg>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-semibold text-text">Memory RAG</p>
              <p className="text-[9px] text-muted">VPS · :9001</p>
            </div>
            <span className="h-2 w-2 rounded-full bg-success/60" />
          </div>
        </div>

      </div>
    </aside>
  );
}
