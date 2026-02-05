import React from "react";
import type { Task, Tag, Priority } from "@/lib/types";

type TaskCardProps = {
  task: Task;
  tags: Tag[];
  onClick: () => void;
  onDragStart: (e: React.DragEvent<HTMLButtonElement>) => void;
};

const getPriorityColor = (priority: Priority) => {
  switch (priority) {
    case "P0":
      return "border-rose-500/20 bg-rose-500/10 text-rose-500";
    case "P1":
      return "border-orange-500/20 bg-orange-500/10 text-orange-500";
    case "P2":
      return "border-blue-500/20 bg-blue-500/10 text-blue-500";
    case "P3":
      return "border-border bg-surface-muted text-muted";
    default:
      return "border-border bg-surface-muted text-muted";
  }
};

export default function TaskCard({ task, tags, onClick, onDragStart }: TaskCardProps) {
  const getTagColor = (tagId: string) =>
    tags.find((t) => t.id === tagId)?.color ?? "#94a3b8";

  const dodCount = task.definitionOfDone?.length ?? 0;
  const dodDone = task.definitionOfDone?.filter((i) => i.done).length ?? 0;

  const hasSwarm = task.swarmRequired;
  const isBatch = task.processingMode === "batch";

  return (
    <button
      type="button"
      draggable
      onDragStart={onDragStart}
      onClick={onClick}
      className="group relative flex w-full flex-col gap-2 rounded-xl border border-border bg-surface p-3.5 text-left shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-primary/20 active:scale-[0.98] active:cursor-grabbing cursor-grab dark:bg-surface-muted/50 dark:hover:bg-surface-muted/80"
    >
      {/* Hover Glow Effect */}
      <div className="absolute inset-0 -z-10 rounded-xl bg-gradient-to-br from-primary/0 to-primary/0 opacity-0 transition-opacity duration-300 group-hover:from-primary/5 group-hover:to-transparent group-hover:opacity-100" />
      
      <div className="flex items-start justify-between gap-2 w-full">
         <div className="font-semibold text-text line-clamp-2 text-sm">{task.title}</div>
         {/* Owner Avatar */}
         {task.owner && (
            <div
                className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border border-surface text-[9px] font-bold text-white shadow-sm ${
                task.owner === "Jarvis" ? "bg-purple-600" : "bg-blue-600"
                }`}
                title={`Owner: ${task.owner}`}
            >
                {task.owner.charAt(0)}
            </div>
         )}
      </div>

      {/* Next Action */}
      {task.nextAction && (
          <div className="flex items-center gap-1.5 text-[10px] text-muted">
             <span className="font-bold uppercase tracking-wider text-primary/80">Next:</span>
             <span className="truncate">{task.nextAction}</span>
          </div>
      )}

      {task.dueDate && (
        <div className="flex items-center gap-1.5 text-[10px] text-muted">
          <span className="font-bold uppercase tracking-wider text-warning/80">Due:</span>
          <span>{new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}</span>
        </div>
      )}
      
      {/* Definition of Done Indicator */}
      {dodCount > 0 && (
          <div className="w-full mt-1">
             <div className="flex justify-between text-[9px] text-muted mb-0.5">
                 <span className="uppercase tracking-wider opacity-70">DoD</span>
                 <span>{dodDone}/{dodCount}</span>
             </div>
             <div className="h-1 w-full rounded-full bg-surface-muted border border-border overflow-hidden">
                <div 
                    className="h-full bg-emerald-500 transition-all duration-300"
                    style={{ width: `${(dodDone / dodCount) * 100}%` }}
                />
             </div>
          </div>
      )}

      <div className="flex flex-wrap gap-1.5 mt-1">
        {task.tags.length > 0 && (
          task.tags.map((tagId) => (
            <span
              key={tagId}
              className="inline-flex items-center rounded-full border border-black/5 px-2 py-0.5 text-[10px] font-bold text-text dark:border-white/10"
              style={{ backgroundColor: `${getTagColor(tagId)}25` }}
            >
              <span 
                className="mr-1 h-1.5 w-1.5 rounded-full" 
                style={{ backgroundColor: getTagColor(tagId) }} 
              />
              {tags.find((t) => t.id === tagId)?.label ?? "Tag"}
            </span>
          ))
        )}
      </div>

      <div className="mt-1 flex items-center justify-between text-[10px] text-muted w-full">
        <div className="flex flex-wrap items-center gap-2">
          <span
            className={`rounded-full border px-2 py-0.5 font-bold ${getPriorityColor(task.priority)}`}
          >
            {task.priority}
          </span>
          {hasSwarm && (
            <span className="rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[9px] font-bold text-muted">
              Swarm
            </span>
          )}
          {isBatch && (
            <span className="rounded-full border border-primary/20 bg-primary/10 px-2 py-0.5 text-[9px] font-bold text-primary">
              Batch
            </span>
          )}
        </div>
        <span className="opacity-70">
          {new Date(task.updatedAt).toLocaleDateString(undefined, { month: 'short', day: 'numeric'})}
        </span>
      </div>
    </button>
  );
}
