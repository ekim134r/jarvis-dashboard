import React from "react";
import type { Column, Task, Tag } from "@/lib/types";
import TaskCard from "./TaskCard";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import EmptyState from "@/components/ui/EmptyState";
import { BoardSkeleton } from "@/components/ui/Skeletons";

type BoardViewProps = {
  columns: Column[];
  tasksByColumn: Record<string, Task[]>;
  tags: Tag[];
  dragOverColumnId: string | null;
  loading: boolean;
  setDragOverColumnId: (id: string | null) => void;
  handleDrop: (e: React.DragEvent<HTMLDivElement>, column: Column) => void;
  handleDragStart: (e: React.DragEvent<HTMLButtonElement>, taskId: string) => void;
  setSelectedTaskId: (id: string) => void;
  newTaskTitles: Record<string, string>;
  setNewTaskTitles: (titles: Record<string, string> | ((prev: Record<string, string>) => Record<string, string>)) => void;
  createTask: (columnId: string) => void;
};

export default function BoardView({
  columns,
  tasksByColumn,
  tags,
  dragOverColumnId,
  loading,
  setDragOverColumnId,
  handleDrop,
  handleDragStart,
  setSelectedTaskId,
  newTaskTitles,
  setNewTaskTitles,
  createTask,
}: BoardViewProps) {
  const [parent] = useAutoAnimate();
  const taskCount = columns.reduce((sum, column) => sum + (tasksByColumn[column.id]?.length ?? 0), 0);

  const focusFirstInput = () => {
    const input = document.querySelector<HTMLInputElement>("#board-section input");
    input?.focus();
  };

  return (
    <section id="board-section" className="view-shell view-board reveal rounded-2xl border border-border bg-surface p-6 shadow-md transition-all hover:shadow-lg">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted">Task Board</p>
          <h2 className="font-display text-xl font-bold text-text">Prioritized Flow</h2>
        </div>
        <div className="flex gap-2">
          <div className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-medium text-muted">Drag & drop</div>
          <div className="rounded-full border border-border bg-transparent px-3 py-1 text-xs font-medium text-muted">Quality gate: Done</div>
        </div>
      </div>

      {loading ? (
        <BoardSkeleton />
      ) : (
        <>
          {taskCount === 0 && (
            <div className="mb-6">
              <EmptyState
                title="No tasks yet"
                description="Create your first task and start shaping the flow."
                actionLabel="Create a task"
                onAction={focusFirstInput}
              />
            </div>
          )}
          <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-4" ref={parent}>
            {columns.map((column) => {
              const columnTasks = tasksByColumn[column.id] ?? [];
              return (
                <div
                  key={column.id}
                  className={`flex min-h-[400px] min-w-[280px] snap-start flex-col gap-3 rounded-xl border p-3 transition-colors ${
                    dragOverColumnId === column.id
                      ? "border-primary bg-primary/5 shadow-[0_0_0_2px_var(--primary-soft)]"
                      : "border-border bg-surface-muted"
                  }`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setDragOverColumnId(column.id);
                  }}
                  onDragLeave={() => setDragOverColumnId(null)}
                  onDrop={(e) => handleDrop(e, column)}
                >
                  <div className="flex items-center justify-between px-1">
                    <h3 className="font-bold text-text">{column.title}</h3>
                    <span className="rounded bg-black/5 px-1.5 py-0.5 text-xs font-medium text-muted dark:bg-white/10">
                      {columnTasks.length}
                    </span>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        tags={tags}
                        onDragStart={(e) => handleDragStart(e, task.id)}
                        onClick={() => setSelectedTaskId(task.id)}
                      />
                    ))}

                    {/* Add Task Input */}
                    <div className="group flex flex-col gap-2 rounded-xl border border-transparent bg-black/5 p-2 focus-within:border-primary/30 focus-within:bg-surface focus-within:shadow-sm dark:bg-white/5 dark:focus-within:bg-surface-strong">
                      <input
                        type="text"
                        placeholder="Add a task..."
                        className="w-full bg-transparent px-1 text-sm text-text placeholder:text-muted focus:outline-none"
                        value={newTaskTitles[column.id] ?? ""}
                        onChange={(e) => {
                          const val = e.target.value;
                          setNewTaskTitles((prev) => ({ ...prev, [column.id]: val }));
                        }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") createTask(column.id);
                        }}
                      />
                      <button
                        onClick={() => createTask(column.id)}
                        className="ml-auto rounded-lg bg-primary px-3 py-1 text-xs font-bold text-white opacity-0 transition-opacity focus:opacity-100 group-focus-within:opacity-100"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </section>
  );
}
