import React, { useEffect, useRef } from "react";
import { AgentMetrics } from "@/lib/types";

type MetricsPanelProps = {
  metrics: AgentMetrics;
};

const CountUp = ({ value, className }: { value: number; className?: string }) => {
  const ref = useRef<HTMLParagraphElement>(null);
  const prev = useRef<number>(0);
  
  useEffect(() => {
    if (!ref.current) return;
    const node = ref.current;
    const prefersReduced =
      typeof window !== "undefined" &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (prefersReduced) {
      node.textContent = value.toLocaleString();
      prev.current = value;
      return;
    }

    const startValue = prev.current ?? 0;
    const diff = value - startValue;
    const duration = 900;
    const start = performance.now();
    let frame = 0;

    const easeOut = (t: number) => 1 - Math.pow(1 - t, 3);
    const tick = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = easeOut(progress);
      const nextValue = Math.round(startValue + diff * eased);
      node.textContent = nextValue.toLocaleString();
      if (progress < 1) {
        frame = requestAnimationFrame(tick);
      }
    };

    frame = requestAnimationFrame(tick);
    prev.current = value;

    return () => {
      if (frame) cancelAnimationFrame(frame);
    };
  }, [value]);

  return <p ref={ref} className={className}>{value.toLocaleString()}</p>;
};

export default function MetricsPanel({ metrics }: MetricsPanelProps) {
  return (
    <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
      {/* Daily Tokens */}
      <div className="group rounded-xl border border-border bg-surface p-4 shadow-sm transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
        <p className="text-xs font-bold uppercase text-muted group-hover:text-primary transition-colors">Daily Tokens</p>
        <CountUp value={metrics.tokensUsedDaily} className="mt-1 text-2xl font-bold text-text" />
        <p className="text-[10px] text-muted">Today&apos;s total</p>
      </div>

      {/* Weekly Tokens */}
      <div className="group rounded-xl border border-border bg-surface p-4 shadow-sm transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
        <p className="text-xs font-bold uppercase text-muted group-hover:text-primary transition-colors">7-Day Rolling</p>
        <CountUp value={metrics.tokensUsedWeekly} className="mt-1 text-2xl font-bold text-text" />
        <p className="text-[10px] text-muted">Total volume</p>
      </div>

      {/* Messages */}
      <div className="group rounded-xl border border-border bg-surface p-4 shadow-sm transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
        <p className="text-xs font-bold uppercase text-muted group-hover:text-primary transition-colors">Messages / Day</p>
        <CountUp value={metrics.messagesCount} className="mt-1 text-2xl font-bold text-text" />
        <p className="text-[10px] text-muted">Interactions</p>
      </div>

      {/* Tool Calls */}
      <div className="group rounded-xl border border-border bg-surface p-4 shadow-sm transition-all hover:border-primary/20 hover:shadow-lg hover:shadow-primary/5">
        <p className="text-xs font-bold uppercase text-muted group-hover:text-primary transition-colors">Tool Calls / Day</p>
        <div className="flex items-end gap-2">
            <CountUp value={metrics.toolCallsCount} className="mt-1 text-2xl font-bold text-text" />
            <span className="mb-1 text-[10px] font-medium text-emerald-500">Target: Low</span>
        </div>
        <p className="text-[10px] text-muted">Efficiency metric</p>
      </div>
    </div>
  );
}
