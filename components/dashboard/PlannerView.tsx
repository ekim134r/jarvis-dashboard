import React from "react";
import type { Task, Level } from "@/lib/types";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import EmptyState from "@/components/ui/EmptyState";

type PlannerViewProps = {
  openTasks: Task[];
  plannedHours: number;
  weeklyCapacity: number;
  setWeeklyCapacity: (val: number) => void;
  capacityUsage: number;
  focusQueue: Task[];
  blockedTasks: Task[];
  trackingEnabled: boolean;
  setTrackingEnabled: (val: boolean | ((prev: boolean) => boolean)) => void;
  signals: { id: string; message: string; createdAt: string }[];
  plannerTasks: Task[];
  doneTaskIds: Set<string>;
  getPlanValue: (task: Task, key: keyof Task) => any;
  updatePlanDraft: (taskId: string, patch: Partial<Task>) => void;
  commitPlanDraft: (taskId: string) => void;
  setTaskSwarmRequired: (taskId: string, value: boolean) => void;
  setTaskProcessingMode: (taskId: string, mode: "realtime" | "batch") => void;
  isBatchEligible: (task: Task) => boolean;
};

const levels: Level[] = ["Low", "Medium", "High"];

export default function PlannerView({
  openTasks,
  plannedHours,
  weeklyCapacity,
  setWeeklyCapacity,
  capacityUsage,
  focusQueue,
  blockedTasks,
  trackingEnabled,
  setTrackingEnabled,
  signals,
  plannerTasks,
  doneTaskIds,
  getPlanValue,
  updatePlanDraft,
  commitPlanDraft,
  setTaskSwarmRequired,
  setTaskProcessingMode,
  isBatchEligible,
}: PlannerViewProps) {
  const [signalsRef] = useAutoAnimate<HTMLDivElement>();

  return (
    <section id="planner-section" className="view-shell view-planner reveal rounded-2xl border border-border bg-surface p-6 shadow-md transition-all hover:shadow-lg">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted">Task Planner</p>
          <h2 className="font-display text-xl font-bold text-text">Capacity & Focus Strategy</h2>
        </div>
        <div className="flex gap-2">
          <div className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-medium text-muted">{openTasks.length} open tasks</div>
          <div className="rounded-full border border-border bg-transparent px-3 py-1 text-xs font-medium text-muted">Load {plannedHours.toFixed(1)}h</div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        <div className="flex flex-col gap-4">
          {/* Capacity Radar */}
          <div className="rounded-xl border border-border bg-surface-muted p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-text">Capacity Radar</h3>
              <span className="text-xs text-muted">Weekly planning</span>
            </div>
            <label className="mb-2 block text-xs font-medium text-muted">
              Capacity hours
              <input
                type="number"
                min="1"
                step="1"
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-1.5 text-sm focus:border-primary focus:ring-1 focus:ring-primary"
                value={weeklyCapacity}
                onChange={(e) => setWeeklyCapacity(Number(e.target.value || 0))}
              />
            </label>
            <div className="mb-3 h-2 overflow-hidden rounded-full bg-surface-strong">
              <div
                className="h-full bg-gradient-to-r from-primary to-primary/40 transition-all duration-500"
                style={{ width: `${Math.min(capacityUsage * 100, 100)}%` }}
              />
            </div>
            <div className="grid grid-cols-3 gap-2 text-center">
              <div className="rounded bg-surface p-2 shadow-sm">
                <span className="block text-[10px] uppercase text-muted">Planned</span>
                <strong className="text-sm text-text">{plannedHours.toFixed(1)}h</strong>
              </div>
              <div className="rounded bg-surface p-2 shadow-sm">
                <span className="block text-[10px] uppercase text-muted">Cap</span>
                <strong className="text-sm text-text">{weeklyCapacity}h</strong>
              </div>
              <div className="rounded bg-surface p-2 shadow-sm">
                <span className="block text-[10px] uppercase text-muted">Load</span>
                <strong className="text-sm text-text">{Math.round(capacityUsage * 100)}%</strong>
              </div>
            </div>
          </div>

          {/* Focus Queue */}
          <div className="rounded-xl border border-border bg-surface-muted p-4 shadow-sm">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-bold text-text">Focus Queue</h3>
              <span className="text-xs text-muted">Auto-ranked</span>
            </div>
            {focusQueue.length === 0 ? (
              <p className="text-xs italic text-muted">No focus tasks yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {focusQueue.map((task) => (
                  <div key={task.id} className="flex items-center justify-between rounded-lg border border-border bg-surface p-2.5 shadow-sm transition-transform hover:-translate-x-1">
                    <div>
                      <strong className="block text-sm font-semibold text-text line-clamp-1">{task.title}</strong>
                      <span className="text-[10px] text-muted">
                        Due {task.dueDate ? new Date(task.dueDate).toLocaleDateString(undefined, {month:'short', day:'2-digit'}) : "--"} · {task.estimateHours ?? "--"}h
                      </span>
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      task.priority === 'P0' ? 'bg-danger/10 text-danger' : 
                      task.priority === 'P1' ? 'bg-warning/10 text-warning' : 
                      'bg-surface-muted text-muted'
                    }`}>
                      {task.priority}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
          
          {/* Telemetry */}
          <div className="rounded-xl border border-border bg-surface-muted p-4 shadow-sm">
             <div className="mb-3 flex items-center justify-between">
                <h3 className="font-bold text-text">Telemetry</h3>
                <button 
                  onClick={() => setTrackingEnabled((p) => !p)}
                  className="rounded-full border border-border bg-surface px-2 py-0.5 text-[10px] font-medium transition-colors hover:bg-muted/10"
                >
                  {trackingEnabled ? "On" : "Off"}
                </button>
             </div>
             <div ref={signalsRef} className="flex max-h-[200px] flex-col gap-2 overflow-y-auto pr-1 text-xs">
               {signals.length === 0 ? (
                 <div className="text-muted italic">No signals captured.</div>
               ) : (
                 signals.slice(0, 6).map(signal => (
                   <div key={signal.id} className="flex justify-between gap-2 border-b border-black/5 pb-1 last:border-0 dark:border-white/5">
                      <span className="text-text">{signal.message}</span>
                      <span className="shrink-0 text-[10px] text-muted font-mono opacity-70">
                        {new Date(signal.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                      </span>
                   </div>
                 ))
               )}
             </div>
          </div>
        </div>

        {/* Right Table */}
        <div className="overflow-x-auto rounded-xl border border-border bg-surface-muted p-4 shadow-sm">
          <div className="flex flex-col gap-2 min-w-[760px]">
             <div className="grid grid-cols-[2fr_0.8fr_1fr_0.7fr_0.9fr_0.9fr_0.7fr_0.6fr_0.9fr] gap-2 px-2 text-[10px] font-bold uppercase tracking-wider text-muted">
               <span>Task</span>
               <span>Priority</span>
               <span>Due</span>
               <span>Est (h)</span>
               <span>Impact</span>
               <span>Effort</span>
               <span className="text-center">Deps</span>
               <span className="text-center">Swarm</span>
               <span>Mode</span>
             </div>
             
             {plannerTasks.length === 0 ? (
               <EmptyState
                 title="No tasks to plan"
                 description="Add tasks to the board to generate a capacity plan."
               />
             ) : (
               plannerTasks.map((task) => {
                 const deps = task.dependencies ?? [];
                 const unresolved = deps.filter((d) => !doneTaskIds.has(d));
                 const impactValue = (getPlanValue(task, "impact") ?? "Medium") as Level;
                const effortValue = (getPlanValue(task, "effort") ?? "Medium") as Level;
                const estimateValue = getPlanValue(task, "estimateHours") as number | undefined;
                const dueValue = getPlanValue(task, "dueDate") ? new Date(getPlanValue(task, "dueDate") as string).toISOString().slice(0, 10) : "";
                const eligible = isBatchEligible(task);

                return (
                   <div key={task.id} className="grid grid-cols-[2fr_0.8fr_1fr_0.7fr_0.9fr_0.9fr_0.7fr_0.6fr_0.9fr] items-center gap-2 rounded-lg border border-border bg-surface p-2 shadow-sm transition-colors hover:border-primary/30">
                     <div>
                       <strong className="block text-sm font-medium text-text truncate">{task.title}</strong>
                       <span className="text-[10px] text-muted">Updated {new Date(task.updatedAt).toLocaleDateString()}</span>
                     </div>
                     
                     <span className={`w-fit rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        task.priority === 'P0' ? 'bg-danger/10 text-danger' : 
                        task.priority === 'P1' ? 'bg-warning/10 text-warning' : 
                        'bg-surface-muted text-muted'
                      }`}>
                        {task.priority}
                     </span>

                     <input
                       type="date"
                       className="w-full rounded border border-border bg-transparent px-1 py-1 text-xs text-text focus:border-primary focus:outline-none"
                       value={dueValue}
                       onChange={(e) => updatePlanDraft(task.id, { dueDate: e.target.value ? new Date(e.target.value).toISOString() : undefined })}
                       onBlur={() => commitPlanDraft(task.id)}
                     />

                     <input
                       type="number"
                       min="0"
                       step="0.5"
                       className="w-full rounded border border-border bg-transparent px-1 py-1 text-xs text-text focus:border-primary focus:outline-none"
                       value={estimateValue ?? ""}
                       onChange={(e) => updatePlanDraft(task.id, { estimateHours: e.target.value ? Number(e.target.value) : undefined })}
                       onBlur={() => commitPlanDraft(task.id)}
                     />

                     <select
                       className="w-full rounded border border-border bg-transparent px-1 py-1 text-xs text-text focus:border-primary focus:outline-none"
                       value={impactValue}
                       onChange={(e) => updatePlanDraft(task.id, { impact: e.target.value as Level })}
                       onBlur={() => commitPlanDraft(task.id)}
                     >
                        {levels.map(l => <option key={l} value={l}>{l}</option>)}
                     </select>

                     <select
                       className="w-full rounded border border-border bg-transparent px-1 py-1 text-xs text-text focus:border-primary focus:outline-none"
                       value={effortValue}
                       onChange={(e) => updatePlanDraft(task.id, { effort: e.target.value as Level })}
                       onBlur={() => commitPlanDraft(task.id)}
                     >
                        {levels.map(l => <option key={l} value={l}>{l}</option>)}
                     </select>
                     
                     <div className="flex flex-col items-center justify-center text-[10px]">
                        <span className="font-bold">{deps.length}</span>
                        {unresolved.length > 0 ? (
                          <span className="text-danger">Blocked</span>
                        ) : (
                          <span className="text-success/80">Clear</span>
                        )}
                     </div>

                     <div className="flex items-center justify-center">
                       <label className="flex items-center gap-2 text-xs text-muted">
                         <input
                           type="checkbox"
                           checked={!!task.swarmRequired}
                           onChange={(e) => setTaskSwarmRequired(task.id, e.target.checked)}
                           className="h-4 w-4 rounded border-border text-primary focus:ring-primary"
                         />
                       </label>
                     </div>

                     <div className="flex flex-col gap-1">
                       <select
                         value={(task.processingMode ?? "realtime") as "realtime" | "batch"}
                         onChange={(e) => setTaskProcessingMode(task.id, e.target.value as "realtime" | "batch")}
                         className="w-full rounded border border-border bg-transparent px-1 py-1 text-xs text-text focus:border-primary focus:outline-none"
                       >
                         <option value="realtime">Realtime</option>
                         <option value="batch" disabled={!eligible}>
                           Batch
                         </option>
                       </select>
                       {task.batchJobId && (
                         <span className="text-[10px] text-muted">Batch: {task.batchJobId.slice(0, 10)}…</span>
                       )}
                       {!eligible && (
                         <span className="text-[10px] text-muted">Needs subtasks + low priority + swarm</span>
                       )}
                     </div>
                   </div>
                 );
               })
             )}
          </div>
        </div>
      </div>
    </section>
  );
}
