"use client";

import React, { useEffect, useRef } from "react";
import Clock from "@/components/Clock";
import ThemeToggle from "@/components/ThemeToggle";
import ProjectSwitcher from "@/components/dashboard/ProjectSwitcher";

type DashboardHeaderProps = {
  search: string;
  setSearch: (value: string) => void;
  taskCount: number;
  openTaskCount: number;
  doneCount: number;
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
};

export default function DashboardHeader({
  search,
  setSearch,
  taskCount,
  openTaskCount,
  doneCount,
  activeProjectId,
  setActiveProjectId,
}: DashboardHeaderProps) {
  const searchInputRef = useRef<HTMLInputElement | null>(null);
  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null;
      const isTypingContext =
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          (target as HTMLElement).isContentEditable);

      if (isTypingContext) return;

      const isCmdK = (event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k";
      const isSlash = !event.metaKey && !event.ctrlKey && !event.altKey && event.key === "/";

      if (isCmdK || isSlash) {
        event.preventDefault();
        searchInputRef.current?.focus();
      }

      if (event.key === "Escape") {
        const active = document.activeElement;
        if (active === searchInputRef.current) {
          event.preventDefault();
          searchInputRef.current?.blur();
        }
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  return (
    <>
      <header className="glass-panel sticky top-3 z-40 mb-6 rounded-3xl px-4 py-3 transition-all duration-300">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white/20 text-lg font-bold text-primary shadow-sm backdrop-blur-md dark:bg-white/10 dark:text-white">
              J
            </div>
            <div className="mr-3">
              <h1 className="font-display text-base font-bold text-text">Jarvis</h1>
              <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
                Workbench
              </p>
            </div>

            <div className="relative flex w-full max-w-[260px] items-center gap-2 rounded-full border border-black/5 bg-white/40 px-3 py-2 transition-all focus-within:border-primary/50 focus-within:bg-white/60 focus-within:ring-2 focus-within:ring-primary/20 dark:bg-black/20 dark:focus-within:bg-black/40 lg:w-auto">
              <svg
                className="h-4 w-4 text-muted shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <input
                ref={searchInputRef}
                type="search"
                placeholder="Search tasks, scripts, experiments…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full min-w-0 bg-transparent text-sm text-text placeholder:text-muted/70 focus:outline-none"
              />
              <kbd className="hidden rounded border border-border bg-surface px-1.5 py-0.5 text-[11px] font-bold text-muted lg:block">
                /
              </kbd>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="hidden xl:grid grid-cols-3 gap-3 divide-x divide-border rounded-full border border-border bg-surface px-4 py-2 text-center text-xs shadow-sm">
              <div>
                <span className="block text-muted">Total</span>
                <strong className="text-text">{taskCount}</strong>
              </div>
              <div className="pl-3">
                <span className="block text-muted">Open</span>
                <strong className="text-text">{openTaskCount}</strong>
              </div>
              <div className="pl-3">
                <span className="block text-muted">Done</span>
                <strong className="text-text">{doneCount}</strong>
              </div>
            </div>

            <ProjectSwitcher
              activeProjectId={activeProjectId}
              setActiveProjectId={setActiveProjectId}
            />

            <ThemeToggle />

            <div className="hidden lg:block min-w-[160px] rounded-xl border border-border bg-surface px-3 py-2 text-right">
              <Clock />
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
