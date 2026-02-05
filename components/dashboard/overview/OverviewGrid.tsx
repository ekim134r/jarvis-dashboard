import React from "react";
import { AgentState } from "@/lib/types";
import OpsBar from "./OpsBar";
import RunsList from "./RunsList";
import MetricsPanel from "./MetricsPanel";

type OverviewGridProps = {
  agentState: AgentState;
  heroDate: string;
};

export default function OverviewGrid({ agentState, heroDate }: OverviewGridProps) {
  return (
    <div className="mb-6 flex flex-col gap-6">
      {/* 1. Now / Ops Bar */}
      <OpsBar agentState={agentState} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* Left Column: Metrics + Additional Info */}
        <div className="flex flex-col gap-6 lg:col-span-8">
            <MetricsPanel metrics={agentState.metrics} />
            
            {/* Context/Welcome Area - could be used for 'Current Focus' from data */}
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-surface to-surface-muted p-6 shadow-sm">
                <h2 className="text-xl font-bold text-text mb-2">Current Focus</h2>
                <p className="text-muted">
                    System is active. Check the &quot;Doing&quot; column for active development tasks.
                    Ensure all &quot;P0&quot; priority items have owners assigned.
                </p>
            </div>
        </div>

        {/* Right Column: Agent Activity Radar */}
        <div className="lg:col-span-4 h-full min-h-[400px]">
          <RunsList runs={agentState.recentRuns} />
        </div>
      </div>
    </div>
  );
}