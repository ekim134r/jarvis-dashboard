import React from "react";
import { AgentState } from "@/lib/types";

type OpsBarProps = {
  agentState: AgentState;
  vps?: { health?: string; uptimeSec?: number } | null;
};

function formatUptime(seconds?: number) {
  if (!seconds || !Number.isFinite(seconds)) return "—";
  const s = Math.max(0, Math.floor(seconds));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

export default function OpsBar({ agentState, vps }: OpsBarProps) {
  const { status, gatewayStatus, activeRuns, lastDeploy, metrics } = agentState;
  
  const isDeploySuccess = lastDeploy.status === "success";
  const isGatewayOk = gatewayStatus === "ok";

  return (
    <div className="sticky top-4 z-50 mb-6 glass-panel rounded-2xl px-4 py-3 transition-all duration-300">
      <div className="flex flex-wrap items-center justify-between gap-4 overflow-x-auto scrollbar-hide md:flex-nowrap">
        {/* Active Jobs */}
        <div className="flex shrink-0 items-center gap-3">
          <div className="relative flex h-3 w-3">
            {activeRuns > 0 && (
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            )}
            <span
              className={`relative inline-flex h-3 w-3 rounded-full ${
                activeRuns > 0 ? "bg-primary" : "bg-muted"
              }`}
            />
          </div>
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Active Jobs</span>
            <span className="text-sm font-semibold text-text">
              {activeRuns > 0 ? `${activeRuns} Running` : "Idle"}
            </span>
          </div>
        </div>

        <div className="hidden h-8 w-px bg-border/50 sm:block" />

        {/* Last Deploy */}
        <div className="flex items-center gap-3">
          <div className={`h-2 w-2 rounded-full ${isDeploySuccess ? "bg-emerald-500" : "bg-amber-500"}`} />
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Last Deploy</span>
            <div className="flex items-center gap-2">
              <span className="rounded border border-border bg-surface-muted px-1.5 text-xs text-text">
                {lastDeploy.environment === "production" ? "PROD" : "PREVIEW"}
              </span>
              <a
                href={lastDeploy.url}
                target="_blank"
                rel="noopener noreferrer"
                className="max-w-[150px] truncate text-sm font-medium text-primary hover:underline"
              >
                {new URL(lastDeploy.url).hostname}
              </a>
            </div>
          </div>
        </div>

        <div className="hidden h-8 w-px bg-border/50 sm:block" />

        {/* VPS Status */}
        <div className="flex items-center gap-3">
          <div
            className={`h-2 w-2 rounded-full ${
              !vps
                ? "bg-muted"
                : vps.health && vps.health.toLowerCase() === "ok"
                ? "bg-emerald-500"
                : "bg-amber-500"
            }`}
          />
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">VPS</span>
            <span className="text-sm font-semibold text-text">
              {!vps ? "Not connected" : `${vps.health ?? "unknown"} • ${formatUptime(vps.uptimeSec)}`}
            </span>
          </div>
        </div>

        <div className="hidden h-8 w-px bg-border/50 sm:block" />

        {/* Gateway Status */}
        <div className="flex items-center gap-3">
          <div className={`h-2 w-2 rounded-full ${isGatewayOk ? "bg-emerald-500" : "bg-rose-500"}`} />
          <div className="flex flex-col">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Gateway</span>
            <span className="text-sm font-semibold text-text">{isGatewayOk ? "Operational" : "Degraded"}</span>
          </div>
        </div>

        <div className="hidden h-8 w-px bg-border/50 lg:block" />

        {/* Token Spend */}
        <div className="ml-auto flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs font-bold uppercase tracking-wider text-muted">Token Spend (Today)</span>
            <div className="flex items-baseline gap-1">
              <span className="text-sm font-bold text-text">{metrics.tokensUsedDaily.toLocaleString()}</span>
              <span className="text-[10px] font-medium text-emerald-500">↓ 12%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
