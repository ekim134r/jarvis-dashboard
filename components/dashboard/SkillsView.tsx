"use client";

import { useEffect, useState } from "react";

type SkillEntry = {
  name: string;
  path: string;
  hasSkillMd: boolean;
};

type Payload = {
  skillsDir: string;
  entries: SkillEntry[];
};

export default function SkillsView() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const run = async () => {
      try {
        setError(null);
        const res = await fetch("/api/skills", { cache: "no-store" });
        if (!res.ok) throw new Error("failed");
        const json = (await res.json()) as Payload;
        setPayload(json);
      } catch (e) {
        setError("Failed to load skills.");
      }
    };
    run();
  }, []);

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-surface/80 p-5 shadow-xl backdrop-blur-2xl">
        <div className="text-sm font-bold text-text">Skills Registry</div>
        <div className="mt-1 text-xs text-muted">
          Installed skills in <span className="font-mono">{payload?.skillsDir ?? "~/.openclaw/skills"}</span>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-danger/30 bg-danger/10 p-5 text-danger">
          {error}
        </div>
      ) : null}

      <div className="grid grid-cols-1 gap-3">
        {(payload?.entries ?? []).map((s) => (
          <div
            key={s.name}
            className="rounded-3xl border border-border bg-surface/60 p-4 shadow-sm backdrop-blur"
          >
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-text">{s.name}</div>
                <div className="mt-1 text-[11px] text-muted font-mono break-all">{s.path}</div>
              </div>
              <div
                className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
                  s.hasSkillMd
                    ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20"
                    : "bg-amber-500/10 text-amber-300 ring-amber-500/20"
                }`}
              >
                {s.hasSkillMd ? "SKILL.md" : "missing SKILL.md"}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
