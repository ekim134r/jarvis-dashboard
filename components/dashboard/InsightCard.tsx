import React from "react";

type InsightCardProps = {
  taskCount: number;
  openTaskCount: number;
  doneCount: number;
};

export default function InsightCard({
  taskCount,
  openTaskCount,
  doneCount,
}: InsightCardProps) {
  return (
    <section className="group relative mb-6 overflow-hidden rounded-2xl border border-border bg-surface p-6 shadow-md transition-all hover:shadow-lg dark:bg-surface/50">
      {/* Header */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-muted">Activity Pulse</p>
          <h2 className="font-display text-xl font-bold text-text">Team Velocity</h2>
        </div>
        <div className="text-right">
          <strong className="block text-3xl font-bold tracking-tight text-text">+12%</strong>
          <span className="text-xs font-medium text-success">vs last week</span>
        </div>
      </div>

      {/* Chart */}
      <div className="relative mb-6 h-48 w-full overflow-hidden">
        {/* Grid lines */}
        <div className="absolute inset-0 flex flex-col justify-between opacity-10">
          <div className="border-t border-muted" />
          <div className="border-t border-muted" />
          <div className="border-t border-muted" />
        </div>
        
        {/* SVG Chart */}
        <svg
          viewBox="0 0 1000 200"
          preserveAspectRatio="none"
          className="h-full w-full"
        >
          <defs>
            <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="var(--primary)" stopOpacity="0.25" />
              <stop offset="100%" stopColor="var(--primary)" stopOpacity="0" />
            </linearGradient>
          </defs>
          <path
            d="M0 150 C 150 150, 150 50, 300 50 C 450 50, 450 120, 600 120 C 750 120, 750 30, 900 30 L 1000 30 L 1000 200 L 0 200 Z"
            fill="url(#chartGradient)"
          />
          <path
            d="M0 150 C 150 150, 150 50, 300 50 C 450 50, 450 120, 600 120 C 750 120, 750 30, 900 30 L 1000 30"
            fill="none"
            stroke="var(--primary)"
            strokeWidth="3"
            strokeLinecap="round"
            className="drop-shadow-md"
          />
          <circle cx="300" cy="50" r="6" className="fill-surface stroke-primary stroke-[3px]" />
          <circle cx="600" cy="120" r="6" className="fill-surface stroke-primary stroke-[3px]" />
          <circle cx="900" cy="30" r="8" className="fill-primary stroke-white stroke-[3px]" />
        </svg>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-3 gap-4 border-t border-border pt-4">
        <div>
          <span className="text-xs text-muted">Total tasks</span>
          <strong className="block text-lg font-semibold text-text">{taskCount}</strong>
        </div>
        <div>
          <span className="text-xs text-muted">Open tasks</span>
          <strong className="block text-lg font-semibold text-text">{openTaskCount}</strong>
        </div>
        <div>
          <span className="text-xs text-muted">Done tasks</span>
          <strong className="block text-lg font-semibold text-text">{doneCount}</strong>
        </div>
      </div>
    </section>
  );
}
