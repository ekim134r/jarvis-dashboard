import React from "react";

export function IconsFallback() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {Array.from({ length: 8 }).map((_, idx) => (
        <div
          key={idx}
          className="flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm animate-pulse"
        >
          <div className="h-12 w-12 rounded-xl bg-surface-muted" />
          <div className="flex-1 space-y-2">
            <div className="h-3 w-24 rounded-full bg-surface-muted" />
            <div className="h-2 w-16 rounded-full bg-surface-muted" />
          </div>
        </div>
      ))}
    </div>
  );
}
