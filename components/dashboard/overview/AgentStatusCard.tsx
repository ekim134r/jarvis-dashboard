import React from "react";
import { AgentStatus } from "@/lib/types";

type AgentStatusCardProps = {
  status: AgentStatus;
  lastActive: string;
};

export default function AgentStatusCard({ status, lastActive }: AgentStatusCardProps) {
  const isOnline = status === "active" || status === "idle";
  const statusColor =
    status === "active"
      ? "bg-emerald-500"
      : status === "idle"
      ? "bg-amber-500"
      : "bg-rose-500";
  
  const statusText =
    status === "active"
      ? "Online & Processing"
      : status === "idle"
      ? "Online & Waiting"
      : "Offline";

  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-sm font-semibold text-muted uppercase tracking-wider">
          OpenClaw Status
        </h3>
        <div className={`flex items-center gap-2 rounded-full bg-surface-muted px-2.5 py-1`}>
            <div className={`relative flex h-2.5 w-2.5`}>
              {isOnline && (
                 <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${statusColor} opacity-75`}></span>
              )}
              <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${statusColor}`}></span>
            </div>
            <span className="text-xs font-medium text-text">{statusText}</span>
        </div>
      </div>

      <div className="space-y-4">
         <div className="flex items-end gap-2">
            <span className="text-4xl font-bold text-text tracking-tight">
                {status === 'active' ? 'Active' : status.charAt(0).toUpperCase() + status.slice(1)}
            </span>
         </div>
         <p className="text-sm text-muted">
            Last active: <span className="text-text font-medium">{new Date(lastActive).toLocaleTimeString()}</span>
         </p>
      </div>
      
      {/* Decorative background element */}
      <div className="pointer-events-none absolute -bottom-6 -right-6 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
    </div>
  );
}
