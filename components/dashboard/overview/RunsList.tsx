import React, { useState } from "react";
import { AgentRun } from "@/lib/types";

type RunsListProps = {
  runs: AgentRun[];
};

export default function RunsList({ runs }: RunsListProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <div className="flex flex-col overflow-hidden rounded-3xl glass-panel h-full max-h-[600px]">
      <div className="border-b border-white/10 bg-white/5 px-5 py-3 backdrop-blur-md flex justify-between items-center">
        <h3 className="font-semibold text-text text-sm uppercase tracking-wide">Agent Runs</h3>
        <span className="text-xs text-muted font-mono bg-black/5 dark:bg-white/10 px-2 py-0.5 rounded-full">{runs.length} recent</span>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2 scrollbar-thin scrollbar-thumb-white/20">
        {runs.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-center text-muted">
            <p className="text-sm">No recent runs recorded.</p>
          </div>
        ) : (
          runs.map((run) => (
            <div
              key={run.id}
              onClick={() => toggleExpand(run.id)}
              className={`cursor-pointer rounded-xl border transition-all duration-300 ${
                expandedId === run.id
                  ? "glass-panel-active shadow-lg translate-x-1"
                  : "border-transparent bg-white/40 dark:bg-white/5 hover:bg-white/60 dark:hover:bg-white/10 hover:translate-x-0.5 hover:shadow-sm"
              }`}
            >
              <div className="flex items-center justify-between p-3">
                <div className="flex items-center gap-3">
                    {/* Status Icon */}
                    <div className={`grid h-2 w-2 place-items-center rounded-full ${
                        run.status === 'running' ? 'bg-blue-500 animate-pulse' : 
                        run.status === 'success' ? 'bg-emerald-500' : 'bg-rose-500'
                    }`} />
                    
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-bold text-text uppercase">{run.type}</span>
                            <span className="text-[10px] text-muted border border-border px-1 rounded bg-surface">{run.model}</span>
                        </div>
                        <span className="text-[10px] text-muted">{new Date(run.startedAt).toLocaleTimeString()}</span>
                    </div>
                </div>

                <div className="text-right">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                        run.status === 'running' ? 'bg-blue-500/10 text-blue-500' :
                        run.status === 'success' ? 'bg-emerald-500/10 text-emerald-500' :
                        'bg-rose-500/10 text-rose-500'
                    }`}>
                        {run.status}
                    </span>
                </div>
              </div>

              {/* Expandable Log Area */}
              {expandedId === run.id && (
                <div className="border-t border-border/50 bg-black/90 p-3 font-mono text-[10px] leading-relaxed text-gray-300 rounded-b-lg">
                    <pre className="whitespace-pre-wrap break-all">{run.shortLog}</pre>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
