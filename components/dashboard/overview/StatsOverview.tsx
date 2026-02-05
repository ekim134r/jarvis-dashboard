import React, { useState } from "react";
import { AgentMetrics } from "@/lib/types";

type StatsOverviewProps = {
  metrics: AgentMetrics;
};

export default function StatsOverview({ metrics }: StatsOverviewProps) {
  const [showCosts, setShowCosts] = useState(false);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {/* Tokens Card */}
      <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-3 text-muted mb-2">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.384-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
           </svg>
           <span className="text-sm font-semibold">Token Usage</span>
        </div>
        <div className="flex items-baseline gap-1">
             <span className="text-2xl font-bold text-text">{metrics.tokensUsedDaily.toLocaleString()}</span>
             <span className="text-xs text-muted">today</span>
        </div>
         <div className="pointer-events-none absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-blue-500/5 blur-xl group-hover:bg-blue-500/10 transition-colors" />
      </div>

      {/* Costs Card */}
      <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:shadow-md">
         <div className="flex items-center justify-between text-muted mb-2">
            <div className="flex items-center gap-3">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sm font-semibold">Projected Cost</span>
            </div>
            <button 
                onClick={() => setShowCosts(!showCosts)} 
                className="text-xs hover:text-primary transition-colors"
            >
                {showCosts ? "Hide" : "Show"}
            </button>
        </div>
        <div className="flex items-baseline gap-1">
             {showCosts ? (
                 <>
                    <span className="text-2xl font-bold text-text">${metrics.totalCost.toFixed(2)}</span>
                    <span className="text-xs text-muted">USD</span>
                 </>
             ) : (
                 <span className="text-2xl font-bold text-muted blur-sm select-none">$**.**</span>
             )}
        </div>
        <div className="pointer-events-none absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-green-500/5 blur-xl group-hover:bg-green-500/10 transition-colors" />
      </div>

      {/* Requests/Uptime Card */}
      <div className="group relative overflow-hidden rounded-2xl border border-border bg-surface p-5 shadow-sm transition-all hover:shadow-md">
        <div className="flex items-center gap-3 text-muted mb-2">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
           </svg>
           <span className="text-sm font-semibold">Activity</span>
        </div>
        <div className="flex items-baseline gap-4">
             <div>
                <span className="block text-2xl font-bold text-text">{metrics.requestsProcessed}</span>
                <span className="text-xs text-muted">Requests</span>
             </div>
             <div className="w-px h-8 bg-border"></div>
             <div>
                <span className="block text-2xl font-bold text-text">{(metrics.uptime / 3600).toFixed(1)}h</span>
                <span className="text-xs text-muted">Uptime</span>
             </div>
        </div>
        <div className="pointer-events-none absolute -bottom-4 -right-4 h-16 w-16 rounded-full bg-purple-500/5 blur-xl group-hover:bg-purple-500/10 transition-colors" />
      </div>
    </div>
  );
}
