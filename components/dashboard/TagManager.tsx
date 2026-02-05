import React from "react";
import type { Tag } from "@/lib/types";

type TagManagerProps = {
  tags: Tag[];
  activeTags: string[];
  toggleTagFilter: (id: string) => void;
  setShowTagManager: (show: boolean) => void;
};

export default function TagManager({
  tags,
  activeTags,
  toggleTagFilter,
  setShowTagManager,
}: TagManagerProps) {
  return (
    <section id="tag-panel" className="mb-6 rounded-2xl border border-border bg-surface p-6 shadow-sm transition-all hover:shadow-md">
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted">Filters</p>
            <h3 className="font-display text-lg font-bold text-text">Tag Focus</h3>
          </div>
          <button
            onClick={() => setShowTagManager(true)}
            className="text-sm font-medium text-muted hover:text-primary transition-colors"
          >
            Manage tags →
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2">
          {tags.length === 0 ? (
            <div className="text-sm text-muted italic">No tags created yet.</div>
          ) : (
            tags.map((tag) => {
              const isActive = activeTags.includes(tag.id);
              return (
                <button
                  key={tag.id}
                  onClick={() => toggleTagFilter(tag.id)}
                  className={`flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
                    isActive
                      ? "border-primary/30 ring-2 ring-primary/10 saturate-100"
                      : "border-border opacity-70 saturate-50 hover:opacity-100 hover:saturate-100"
                  }`}
                  style={{
                    backgroundColor: isActive ? `${tag.color}20` : "transparent",
                    color: isActive ? "var(--text)" : "var(--muted)",
                    borderColor: isActive ? tag.color : "var(--border)",
                  }}
                >
                  <span
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: tag.color }}
                  />
                  {tag.label}
                </button>
              );
            })
          )}
        </div>
      </div>
    </section>
  );
}
