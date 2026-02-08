"use client";

import { useEffect, useMemo, useState } from "react";
import type { Project } from "@/lib/types";

type ProjectSwitcherProps = {
  activeProjectId: string;
  setActiveProjectId: (id: string) => void;
};

export default function ProjectSwitcher({
  activeProjectId,
  setActiveProjectId,
}: ProjectSwitcherProps) {
  const [projects, setProjects] = useState<Project[]>([]);

  useEffect(() => {
    const run = async () => {
      try {
        const res = await fetch("/api/projects", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as Project[];
        setProjects(json);
      } catch {
        // ignore
      }
    };
    run();
  }, []);

  const active = useMemo(
    () => projects.find((p) => p.id === activeProjectId) ?? projects[0],
    [projects, activeProjectId]
  );

  return (
    <div className="flex items-center gap-2">
      <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/80">
        Project
      </div>
      <div className="relative">
        <select
          value={activeProjectId}
          onChange={(e) => setActiveProjectId(e.target.value)}
          className="h-9 rounded-2xl border border-border bg-surface/70 px-3 pr-9 text-sm font-semibold text-text shadow-sm backdrop-blur focus:outline-none focus:ring-2 focus:ring-primary/30"
        >
          {projects.map((p) => (
            <option key={p.id} value={p.id}>
              {p.title}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted">
          ▾
        </div>
      </div>
      {active?.guidelinesPath ? (
        <div className="hidden xl:block text-[11px] text-muted truncate max-w-[340px]">
          <span className="opacity-70">Guidelines:</span>{" "}
          <span className="font-mono">{active.guidelinesPath}</span>
        </div>
      ) : null}
    </div>
  );
}
