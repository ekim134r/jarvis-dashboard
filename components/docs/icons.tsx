import React from "react";

const icons = [
  {
    name: "Spark",
    path: "M12 2l1.8 4.6L18 8l-4.2 1.4L12 14l-1.8-4.6L6 8l4.2-1.4L12 2z"
  },
  {
    name: "Orbit",
    path: "M12 3a9 9 0 100 18 9 9 0 000-18zM12 7a5 5 0 110 10 5 5 0 010-10z"
  },
  {
    name: "Pulse",
    path: "M4 12h4l2-4 4 8 2-4h4"
  },
  {
    name: "Stack",
    path: "M4 7l8-4 8 4-8 4-8-4zm0 6l8 4 8-4"
  },
  {
    name: "Grid",
    path: "M4 4h7v7H4V4zm9 0h7v7h-7V4zM4 13h7v7H4v-7zm9 0h7v7h-7v-7z"
  },
  {
    name: "Wave",
    path: "M3 12c3-6 6-6 9 0s6 6 9 0"
  },
  {
    name: "Focus",
    path: "M4 4h6v2H6v4H4V4zm10 0h6v6h-2V6h-4V4zM4 14h2v4h4v2H4v-6zm14 0h2v6h-6v-2h4v-4z"
  },
  {
    name: "Bolt",
    path: "M13 2L5 14h6l-1 8 8-12h-6l1-8z"
  },
  {
    name: "Layers",
    path: "M12 3l9 5-9 5-9-5 9-5zm0 12l9 5-9 5-9-5 9-5z"
  },
  {
    name: "Signal",
    path: "M4 12h3m3 0h3m3 0h3M6 18h12M8 6h8"
  },
  {
    name: "Bridge",
    path: "M4 14h16M6 14V9a6 6 0 0112 0v5"
  },
  {
    name: "Compass",
    path: "M12 2l3 7-7 3-3-7 7-3zM9 15l7-3 3 7-7 3-3-7z"
  }
];

export function Icons() {
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
      {icons.map((icon) => (
        <div
          key={icon.name}
          className="group flex items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-sm transition-all hover:-translate-y-1 hover:border-primary/30 hover:shadow-lg"
        >
          <div className="grid h-12 w-12 place-items-center rounded-xl bg-primary/10 text-primary shadow-inner">
            <svg
              className="h-6 w-6 transition-transform duration-300 group-hover:rotate-[-6deg]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.6}
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d={icon.path} />
            </svg>
          </div>
          <div>
            <div className="text-sm font-semibold text-text">{icon.name}</div>
            <div className="text-[11px] text-muted">Lucide style</div>
          </div>
        </div>
      ))}
    </div>
  );
}
