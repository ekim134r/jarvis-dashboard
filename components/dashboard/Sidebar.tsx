"use client";

import React from "react";

type ViewId =
  | "board"
  | "projects"
  | "planner"
  | "canvas"
  | "preferences"
  | "experiments"
  | "labs"
  | "assets"
  | "skills"
  | "research"
  | "scripts"
  | "integrations"
  | "health"
  | "features";

type SidebarProps = {
  activeView: ViewId;
  setActiveView: (view: ViewId) => void;
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
};

type NavItem = {
  id: ViewId;
  label: string;
  icon: string;
  locked?: boolean;
};

const navGroups: NavItem[][] = [
  [
    {
      id: "board",
      label: "Home",
      icon: "M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25",
    },
    {
      id: "projects",
      label: "Projects",
      icon: "M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25a2.25 2.25 0 01-2.25-2.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z",
    },
    {
      id: "canvas",
      label: "Canvas",
      icon: "M3.75 3.75v4.5m0-4.5h4.5m-4.5 0L9 9M3.75 20.25v-4.5m0 4.5h4.5m-4.5 0L9 15M20.25 3.75h-4.5m4.5 0v4.5m0-4.5L15 9m5.25 11.25h-4.5m4.5 0v-4.5m0 4.5L15 15",
    },
  ],
  [
    {
      id: "research",
      label: "Research",
      icon: "M10.5 3.75a6.75 6.75 0 104.22 12.01l4.76 4.77a.75.75 0 101.06-1.06l-4.77-4.76A6.75 6.75 0 0010.5 3.75z",
    },
    {
      id: "labs",
      label: "Labs",
      icon: "M9.75 3.104v5.714a2.25 2.25 0 01-.659 1.591L5 14.519C4.195 15.325 4 16.294 4 17.5c0 1.933 1.567 3.5 3.5 3.5h9c1.933 0 3.5-1.567 3.5-3.5 0-1.206-.195-2.175-1-2.981l-4.091-4.11a2.25 2.25 0 01-.659-1.591V3.104",
    },
    {
      id: "preferences",
      label: "Taste",
      icon: "M6 13.5V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m12-3V3.75m0 9.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 3.75V16.5m-6-9V3.75m0 3.75a1.5 1.5 0 010 3m0-3a1.5 1.5 0 000 3m0 9.75V10.5",
    },
    {
      id: "experiments",
      label: "Experiments",
      icon: "M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m5.231 13.481L15 17.25m-4.5-15H5.625c-.621 0-1.125.504-1.125 1.125v16.5c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9zm3.75 11.625a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z",
    },
    {
      id: "assets",
      label: "Assets",
      icon: "M2.25 15.75l5.159-5.159a2.25 2.25 0 013.182 0l5.159 5.159m-1.5-1.5l1.409-1.409a2.25 2.25 0 013.182 0l2.909 2.909m-18 3.75h16.5a1.5 1.5 0 001.5-1.5V6a1.5 1.5 0 00-1.5-1.5H3.75A1.5 1.5 0 002.25 6v12a1.5 1.5 0 001.5 1.5zm10.5-11.25h.008v.008h-.008V8.25zm.375 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z",
    },
  ],
  [
    {
      id: "health",
      label: "Health",
      icon: "M3 13.5h2.25L7.5 6l3 12 2.25-6h2.25L16.5 9l2.25 4.5H21",
    },
    {
      id: "skills",
      label: "Skills",
      icon: "M14.25 9.75L16.5 12l-2.25 2.25m-4.5 0L7.5 12l2.25-2.25M6 20.25h12A2.25 2.25 0 0020.25 18V6A2.25 2.25 0 0018 3.75H6A2.25 2.25 0 003.75 6v12A2.25 2.25 0 006 20.25z",
    },
    {
      id: "integrations",
      label: "Integrations",
      icon: "M13.5 16.875h3.375m0 0h3.375m-3.375 0V13.5m0 3.375v3.375M6 10.5h2.25a2.25 2.25 0 002.25-2.25V6a2.25 2.25 0 00-2.25-2.25H6A2.25 2.25 0 003.75 6v2.25A2.25 2.25 0 006 10.5zm0 9.75h2.25A2.25 2.25 0 0010.5 18v-2.25a2.25 2.25 0 00-2.25-2.25H6a2.25 2.25 0 00-2.25 2.25V18A2.25 2.25 0 006 20.25zm9.75-9.75H18a2.25 2.25 0 002.25-2.25V6A2.25 2.25 0 0018 3.75h-2.25A2.25 2.25 0 0013.5 6v2.25a2.25 2.25 0 002.25 2.25z",
    },
    {
      id: "scripts",
      label: "Scripts",
      icon: "M17.25 6.75L22.5 12l-5.25 5.25m-10.5 0L1.5 12l5.25-5.25m7.5-3l-4.5 16.5",
      locked: true,
    },
  ],
];

const mobileOrder: ViewId[] = [
  "board",
  "projects",
  "canvas",
  "research",
  "health",
];

function NavIcon({ item, isActive, onClick }: { item: NavItem; isActive: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      disabled={item.locked}
      aria-label={item.label}
      className={`group relative flex h-10 w-10 items-center justify-center rounded-xl transition-all duration-150 ${
        isActive
          ? "bg-primary/15 text-primary shadow-sm ring-1 ring-primary/25"
          : item.locked
            ? "cursor-not-allowed text-muted/30"
            : "text-muted hover:bg-white/8 hover:text-text dark:hover:bg-white/5"
      }`}
    >
      <svg className="h-[18px] w-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2.5 : 1.8}>
        <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
      </svg>

      {/* Active glow dot */}
      {isActive && (
        <span className="absolute -right-0.5 -top-0.5 h-2 w-2 rounded-full bg-primary shadow-[0_0_6px_2px_var(--primary-glow)]" />
      )}

      {/* Tooltip */}
      <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-[200] -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg border border-border bg-surface-strong px-2.5 py-1.5 text-[11px] font-semibold text-text opacity-0 shadow-xl transition-all duration-100 group-hover:translate-x-0 group-hover:opacity-100">
        {item.label}
        {item.locked && <span className="ml-1.5 text-muted/60">·  AI</span>}
      </span>
    </button>
  );
}

export default function Sidebar({ activeView, setActiveView }: SidebarProps) {
  const allItems = navGroups.flat();
  const viewMap = new Map(allItems.map((item) => [item.id, item]));

  return (
    <>
      {/* Desktop Icon Rail */}
      <aside className="hidden lg:flex w-[72px] shrink-0">
        <div className="sticky top-6 flex h-fit w-full flex-col items-center gap-1 rounded-2xl border border-white/10 bg-surface/80 py-4 shadow-xl backdrop-blur-2xl dark:border-white/5">
          {/* Monogram */}
          <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-primary/30 to-primary/10 text-sm font-bold text-primary ring-1 ring-primary/20">
            J
          </div>

          {/* Nav Groups */}
          {navGroups.map((group, gi) => (
            <React.Fragment key={gi}>
              {gi > 0 && (
                <div className="my-2 h-px w-8 rounded-full bg-border" />
              )}
              <div className="flex flex-col items-center gap-0.5">
                {group.map((item) => (
                  <NavIcon
                    key={item.id}
                    item={item}
                    isActive={activeView === item.id}
                    onClick={() => {
                      if (!item.locked) setActiveView(item.id);
                    }}
                  />
                ))}
              </div>
            </React.Fragment>
          ))}

          {/* Bottom spacer + status */}
          <div className="mt-4 flex flex-col items-center gap-1.5">
            <div className="h-px w-8 rounded-full bg-border" />
            <div className="group relative flex h-10 w-10 items-center justify-center">
              <span className="h-2.5 w-2.5 rounded-full bg-success shadow-[0_0_8px_2px_rgba(67,255,182,0.35)]" />
              <span className="pointer-events-none absolute left-[calc(100%+10px)] top-1/2 z-[200] -translate-y-1/2 translate-x-1 whitespace-nowrap rounded-lg border border-border bg-surface-strong px-2.5 py-1.5 text-[11px] font-semibold text-text opacity-0 shadow-xl transition-all duration-100 group-hover:translate-x-0 group-hover:opacity-100">
                System online
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Mobile Bottom Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 glass-panel border-t border-white/15 pb-safe pt-2 px-4 shadow-[0_-4px_24px_rgba(0,0,0,0.12)]">
        <div className="flex justify-around items-center max-w-sm mx-auto">
          {mobileOrder.map((id) => {
            const item = viewMap.get(id);
            if (!item) return null;
            const isActive = activeView === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveView(item.id)}
                aria-label={item.label}
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all duration-200 ${
                  isActive ? "text-primary" : "text-muted"
                }`}
              >
                <div
                  className={`flex h-9 w-9 items-center justify-center rounded-xl transition-all ${
                    isActive ? "bg-primary/15 ring-1 ring-primary/25" : ""
                  }`}
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isActive ? 2.5 : 1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d={item.icon} />
                  </svg>
                </div>
                <span className={`text-[9px] font-bold uppercase tracking-wider transition-opacity ${isActive ? "opacity-100" : "opacity-50"}`}>
                  {item.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
