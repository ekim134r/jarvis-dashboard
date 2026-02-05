"use client";

import React from "react";

function SkeletonBlock({ className }: { className?: string }) {
  return (
    <div
      className={`animate-shimmer rounded-xl bg-white/40 dark:bg-white/5 ${className ?? ""}`}
    />
  );
}

export function OverviewSkeleton() {
  return (
    <div className="mb-6 flex flex-col gap-6">
      <div className="glass-panel rounded-2xl px-4 py-3">
        <div className="flex flex-wrap items-center gap-4">
          <SkeletonBlock className="h-4 w-32" />
          <SkeletonBlock className="h-4 w-40" />
          <SkeletonBlock className="h-4 w-36" />
          <SkeletonBlock className="ml-auto h-4 w-28" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        <div className="flex flex-col gap-6 lg:col-span-8">
          <div className="rounded-2xl border border-border bg-surface p-6">
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              {Array.from({ length: 6 }).map((_, idx) => (
                <div key={idx} className="rounded-xl border border-border bg-surface-muted p-4">
                  <SkeletonBlock className="h-3 w-20" />
                  <SkeletonBlock className="mt-3 h-6 w-16" />
                </div>
              ))}
            </div>
          </div>
          <div className="rounded-2xl border border-border bg-surface p-6">
            <SkeletonBlock className="h-4 w-28" />
            <SkeletonBlock className="mt-3 h-3 w-full" />
            <SkeletonBlock className="mt-2 h-3 w-4/5" />
          </div>
        </div>
        <div className="lg:col-span-4">
          <div className="h-full rounded-2xl border border-border bg-surface p-6">
            <SkeletonBlock className="h-4 w-24" />
            <div className="mt-4 flex flex-col gap-3">
              {Array.from({ length: 5 }).map((_, idx) => (
                <SkeletonBlock key={idx} className="h-8 w-full" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function BoardSkeleton() {
  return (
    <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4">
      {Array.from({ length: 4 }).map((_, idx) => (
        <div
          key={idx}
          className="flex min-h-[400px] min-w-[260px] snap-start flex-col gap-3 rounded-xl border border-border bg-surface-muted p-3"
        >
          <div className="flex items-center justify-between">
            <SkeletonBlock className="h-4 w-24" />
            <SkeletonBlock className="h-5 w-8" />
          </div>
          <div className="flex flex-col gap-3">
            {Array.from({ length: 4 }).map((__, cardIdx) => (
              <div key={cardIdx} className="rounded-xl border border-border bg-surface p-3">
                <SkeletonBlock className="h-3 w-32" />
                <SkeletonBlock className="mt-3 h-3 w-24" />
                <SkeletonBlock className="mt-4 h-2 w-full" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
