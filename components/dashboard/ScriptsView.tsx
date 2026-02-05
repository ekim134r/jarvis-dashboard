import React from "react";
import type { Script, Tag } from "@/lib/types";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import EmptyState from "@/components/ui/EmptyState";

type ScriptDraft = {
  name: string;
  description: string;
  command: string;
  tags: string[];
  favorite: boolean;
};

type ScriptsViewProps = {
  scripts: Script[];
  tags: Tag[];
  scriptDraft: ScriptDraft;
  setScriptDraft: (val: ScriptDraft | ((prev: ScriptDraft) => ScriptDraft)) => void;
  editingScriptId: string | null;
  toggleScriptTag: (tagId: string) => void;
  submitScript: () => void;
  startEditScript: (script: Script) => void;
  cancelEditScript: () => void;
  toggleFavoriteScript: (script: Script) => void;
  deleteScript: (id: string) => void;
  handleCopyScript: (script: Script) => void;
};

export default function ScriptsView({
  scripts,
  tags,
  scriptDraft,
  setScriptDraft,
  editingScriptId,
  toggleScriptTag,
  submitScript,
  startEditScript,
  cancelEditScript,
  toggleFavoriteScript,
  deleteScript,
  handleCopyScript,
}: ScriptsViewProps) {
  const [gridRef] = useAutoAnimate<HTMLDivElement>();

  return (
    <section id="scripts-section" className="view-shell view-scripts reveal rounded-2xl border border-border bg-surface p-6 shadow-md">
      <div className="mb-6">
        <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted">DevOps & Automation</p>
        <h2 className="font-display text-xl font-bold text-text">Script Library</h2>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
        {/* Form */}
        <div className="h-fit rounded-xl border border-border bg-surface-muted p-4 shadow-sm">
          <h3 className="mb-4 font-bold text-text">
            {editingScriptId ? "Edit Script" : "New Script"}
          </h3>
          <div className="flex flex-col gap-3">
            <label className="text-xs font-medium text-muted">
              Name
              <input
                type="text"
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={scriptDraft.name}
                onChange={(e) => setScriptDraft((p) => ({ ...p, name: e.target.value }))}
                placeholder="e.g. Deploy Production"
              />
            </label>
            <label className="text-xs font-medium text-muted">
              Description
              <textarea
                rows={2}
                className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                value={scriptDraft.description}
                onChange={(e) => setScriptDraft((p) => ({ ...p, description: e.target.value }))}
              />
            </label>
            <label className="text-xs font-medium text-muted">
              Command
              <textarea
                 rows={3}
                 className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 font-mono text-xs text-text focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                 value={scriptDraft.command}
                 onChange={(e) => setScriptDraft((p) => ({ ...p, command: e.target.value }))}
                 placeholder="#!/bin/bash..."
              />
            </label>
            
            <div className="space-y-2">
               <span className="text-xs font-medium text-muted">Tags</span>
               <div className="flex flex-wrap gap-2">
                 {tags.map((tag) => (
                   <button
                     key={tag.id}
                     type="button"
                     onClick={() => toggleScriptTag(tag.id)}
                     className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold transition-all ${
                       scriptDraft.tags.includes(tag.id)
                         ? "ring-1 ring-inset saturate-100"
                         : "opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
                     }`}
                     style={{ 
                       backgroundColor: scriptDraft.tags.includes(tag.id) ? `${tag.color}20` : 'transparent',
                       color: tag.color,
                       boxShadow: scriptDraft.tags.includes(tag.id) ? `inset 0 0 0 1px ${tag.color}` : `inset 0 0 0 1px var(--border)`
                     }}
                   >
                     <span className="h-1.5 w-1.5 rounded-full" style={{backgroundColor: tag.color}}/>
                     {tag.label}
                   </button>
                 ))}
               </div>
            </div>

            <label className="flex items-center gap-2 text-xs text-muted">
              <input
                type="checkbox"
                checked={scriptDraft.favorite}
                onChange={(e) => setScriptDraft((p) => ({ ...p, favorite: e.target.checked }))}
                className="rounded border-border text-primary focus:ring-primary"
              />
              Mark as favorite
            </label>

            <div className="mt-2 flex gap-2">
              <button
                onClick={submitScript}
                className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-md transition-transform hover:-translate-y-0.5 active:translate-y-0"
              >
                {editingScriptId ? "Update" : "Create"}
              </button>
              {editingScriptId && (
                <button
                  onClick={cancelEditScript}
                  className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-muted hover:bg-surface-muted"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>
        </div>

        {/* List */}
        <div ref={gridRef} className="grid grid-cols-1 content-start gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {scripts.length === 0 ? (
            <EmptyState
              title="No scripts yet"
              description="Add your first automation and keep the playbook sharp."
            />
          ) : (
            scripts.map((script) => (
              <div key={script.id} className="group relative flex flex-col justify-between gap-3 rounded-xl border border-border bg-surface p-4 shadow-sm transition-all hover:border-primary/20 hover:shadow-md">
                 <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-text">{script.name}</h3>
                      <p className="mt-1 text-xs text-muted line-clamp-2">{script.description}</p>
                    </div>
                    <button 
                      onClick={() => toggleFavoriteScript(script)}
                      className={`transition-colors ${script.favorite ? "text-warning" : "text-border hover:text-warning"}`}
                    >
                      ★
                    </button>
                 </div>
                 
                 <div className="relative group/cmd">
                   <pre className="overflow-x-auto rounded-lg border border-border bg-surface-muted p-2 text-[10px] font-mono text-muted">
                     {script.command}
                   </pre>
                   <button 
                     onClick={() => handleCopyScript(script)}
                     className="absolute right-1 top-1 rounded bg-surface shadow-sm border border-border px-1.5 py-0.5 text-[10px] opacity-0 transition-opacity group-hover/cmd:opacity-100 hover:text-primary"
                   >
                     Copy
                   </button>
                 </div>

                 <div className="flex items-center justify-between border-t border-border pt-3">
                    <div className="flex -space-x-1">
                       {script.tags.map(tagId => {
                         const t = tags.find(x => x.id === tagId);
                         if(!t) return null;
                         return (
                           <div key={tagId} className="h-2.5 w-2.5 rounded-full ring-2 ring-surface" style={{backgroundColor: t.color}} title={t.label} />
                         );
                       })}
                    </div>
                    <div className="flex gap-2">
                       <button onClick={() => startEditScript(script)} className="text-xs font-semibold text-muted hover:text-primary">Edit</button>
                       <button onClick={() => deleteScript(script.id)} className="text-xs font-semibold text-muted hover:text-danger">Delete</button>
                    </div>
                 </div>
              </div>
            ))
          )}
        </div>
      </div>
    </section>
  );
}
