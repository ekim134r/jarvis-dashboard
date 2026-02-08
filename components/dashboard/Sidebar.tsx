"use client";

import React from "react";

type ViewId =
  | "board"
  | "planner"
  | "preferences"
  | "experiments"
  | "labs"
  | "skills"
  | "scripts"
  | "integrations";

type SidebarProps = {
  activeView: ViewId;
  setActiveView: (view: ViewId) => void;
};

const views = [
  {
    id: "board",
    label: "Board",
    icon: "M9 4.5v15m6-15v15m-10.875 0h15.75c.621 0 1.125-.504 1.125-1.125V5.625c0-.621-.504-1.125-1.125-1.125H4.125C3.504 4.5 3 5.004 3 5.625v12.75c0 .621.504 1.125 1.125 1.125z"
  },
  {
    id: "planner",
    label: "Planner",
    icon: "M6.75 3v2.25M17.25 3v2.25M3 18.75V7.5a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 7.5v11.25m-18 0A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75m-18 0v-7.5A2.25 2.25 0 015.25 9h13.5A2.25 2.25 0 0121 11.25v7.5"
  },
  {
    id: "preferences",
    label: "Preferences",
    icon: "M6 13.5V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 9.75V10.5"
  },
  {
    id: "experiments",
    label: "Experiments",
    icon: "M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.519C4.195 15.325 4 16.294 4 17.5c0 1.933 1.567 3.5 3.5 3.5h9c1.933 0 3.5-1.567 3.5-3.5 0-1.206-.195-2.175-1-2.981l-4.091-4.11a2.25 2.25 0 01-.659-1.591V3.104"
  },
  {
    id: "labs",
    label: "Labs",
    icon: "M12 3v4.5m0 0H7.5m4.5 0h4.5M6.75 7.5h10.5M6 21h12a1.5 1.5 0 001.5-1.5v-3.879a3 3 0 00-.879-2.121l-2.742-2.742a1.5 1.5 0 01-.439-1.06V7.5H8.56v2.198a1.5 1.5 0 01-.439 1.06L5.38 13.5A3 3 0 004.5 15.621V19.5A1.5 1.5 0 006 21z"
  },
  {
    id: "skills",
    label: "Skills",
    icon: "M5.25 6.75h13.5m-13.5 3.75h13.5m-13.5 3.75h9.75M7.5 3.75h9A2.25 2.25 0 0118.75 6v12A2.25 2.25 0 0116.5 20.25h-9A2.25 2.25 0 015.25 18V6A2.25 2.25 0 017.5 3.75z"
  },
  {
    id: "scripts",
    label: "Scripts",
    icon: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5",
    locked: true
  },
  {
    id: "integrations",
    label: "Integrations",
    icon: "M12 6.75a2.25 2.25 0 110-4.5 2.25 2.25 0 010 4.5zM12 21.75a2.25 2.25 0 110-4.5 2.25 2.25 0 010 4.5zM21.75 12a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM6.75 12a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zM13.32 6.38l4.2 3.24M6.48 14.38l4.2 3.24M6.48 9.62l4.2-3.24M13.32 17.62l4.2-3.24",
    locked: true
  }
] as const;

const allViews = [...views] as const;

const groups: { label: string; ids: ViewId[] }[] = [
  { label: "Core", ids: ["board", "planner", "preferences", "labs"] },
  { label: "Ops", ids: ["skills", "experiments"] },
  { label: "AI Control", ids: ["scripts", "integrations"] }
];

const mobileViewOrder: ViewId[] = ["board", "planner", "labs", "preferences", "skills", "experiments"];

export default function Sidebar({ activeView, setActiveView }: SidebarProps) {
  const viewMap = new Map(allViews.map((view) => [view.id, view]));

  return (
    <>
      <aside className="hidden lg:flex w-[240px] shrink-0">
        <div className="sticky top-6 flex h-fit w-full flex-col gap-6 rounded-3xl border border-border bg-surface/80 p-4 shadow-xl backdrop-blur-2xl">
          <div className="flex items-center gap-3">
            <div className="grid h-11 w-11 place-items-center rounded-2xl bg-white/20 text-lg font-bold text-primary shadow-sm backdrop-blur-md dark:bg-white/10">
              J
            </div>
            <div>
              <div className="text-sm font-bold text-text">Jarvis</div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.2em] text-muted">
                Workbench
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {groups.map((group) => (
              <div key={group.label} className="space-y-2">
                <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/80">
                  {group.label}
                </div>
                <div className="flex flex-col gap-1">
                  {group.ids.map((id) => {
                    const view = viewMap.get(id);
                    if (!view) return null;
                    const isActive = activeView === view.id;
                    const isLocked = "locked" in view && view.locked;
                    return (
                      <button
                        key={view.id}
                        onClick={() => {
                          if (!isLocked) setActiveView(view.id);
                        }}
                        disabled={isLocked}
                        aria-disabled={isLocked}
                        className={`group flex items-center gap-3 rounded-2xl px-3 py-2 text-sm font-semibold transition-all ${
                          isActive
                            ? "bg-primary/10 text-primary ring-1 ring-primary/20 shadow-sm"
                            : isLocked
                              ? "text-muted/50 cursor-not-allowed"
                              : "text-muted hover:bg-black/5 hover:text-text dark:hover:bg-white/5"
                        }`}
                      >
                        <div
                          className={`grid h-9 w-9 place-items-center rounded-xl border transition-colors ${
                            isActive
                              ? "border-primary/30 bg-primary/10 text-primary"
                              : isLocked
                                ? "border-border bg-surface text-muted/50"
                                : "border-border bg-surface text-muted"
                          }`}
                        >
                          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d={view.icon} />
                          </svg>
                        </div>
                        <span>{view.label}</span>
                        {isLocked && (
                          <span className="ml-auto rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[9px] font-bold text-muted">
                            AI
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-auto rounded-2xl border border-border bg-surface-muted/60 p-3 text-xs text-muted">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/80">
              Status
            </div>
            <div className="mt-2 flex items-center gap-2 text-text">
              <span className="h-2 w-2 rounded-full bg-success" />
              Ready to work
            </div>
          </div>
        </div>
      </aside>

      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-white/20 pb-safe pt-2 px-4 shadow-[0_-4px_20px_rgba(0,0,0,0.1)]">
        <div className="flex justify-between items-center max-w-md mx-auto">
          {mobileViewOrder.map((id) => {
            const view = viewMap.get(id);
            if (!view) return null;
            return (
            <button
              key={view.id}
              onClick={() => setActiveView(view.id)}
              className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-200 ${
                activeView === view.id
                  ? "text-primary -translate-y-2"
                  : "text-muted hover:text-text active:scale-95"
              }`}
              aria-label={view.label}
              aria-current={activeView === view.id ? "page" : undefined}
            >
              <div
                className={`relative flex items-center justify-center h-10 w-10 rounded-2xl transition-all ${
                  activeView === view.id ? "bg-primary text-white shadow-lg shadow-primary/30" : "bg-transparent"
                }`}
              >
                <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={activeView === view.id ? 2.5 : 2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d={view.icon} />
                </svg>
                {activeView === view.id && (
                  <span className="absolute -bottom-1 h-1 w-8 rounded-full bg-primary/20 blur-sm" />
                )}
              </div>
              <span
                className={`mt-1 text-[10px] font-bold transition-opacity ${
                  activeView === view.id ? "opacity-100 text-primary" : "opacity-60"
                }`}
              >
                {view.label}
              </span>
            </button>
          );
          })}
        </div>
      </nav>
    </>
  );
}
