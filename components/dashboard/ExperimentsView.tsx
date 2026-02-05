import React from "react";
import type { Experiment, ExperimentStatus, ExperimentResult, Tag } from "@/lib/types";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import EmptyState from "@/components/ui/EmptyState";

type ExperimentDraft = {
  title: string;
  hypothesis: string;
  metric: string;
  status: ExperimentStatus;
  result: ExperimentResult;
  startDate: string;
  endDate: string;
  owner: string;
  tags: string[];
  notes: string;
};

type ExperimentsViewProps = {
  experiments: Experiment[];
  tags: Tag[];
  experimentDraft: ExperimentDraft;
  setExperimentDraft: (val: ExperimentDraft | ((prev: ExperimentDraft) => ExperimentDraft)) => void;
  editingExperimentId: string | null;
  toggleExperimentTag: (id: string) => void;
  submitExperiment: () => void;
  startEditExperiment: (exp: Experiment) => void;
  cancelEditExperiment: () => void;
  deleteExperiment: (id: string) => void;
};

const experimentStatuses: ExperimentStatus[] = ["Idea", "Queued", "Running", "Analyzing", "Complete"];
const experimentResults: ExperimentResult[] = ["Pending", "Positive", "Negative", "Inconclusive"];

export default function ExperimentsView({
  experiments,
  tags,
  experimentDraft,
  setExperimentDraft,
  editingExperimentId,
  toggleExperimentTag,
  submitExperiment,
  startEditExperiment,
  cancelEditExperiment,
  deleteExperiment,
}: ExperimentsViewProps) {
  const [gridRef] = useAutoAnimate<HTMLDivElement>();

  return (
    <section id="experiments-section" className="view-shell view-experiments reveal rounded-2xl border border-border bg-surface p-6 shadow-md">
       <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted">Experiment Tracker</p>
          <h2 className="font-display text-xl font-bold text-text">Hypotheses & Test Outcomes</h2>
        </div>
        <div className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-medium text-muted">
          {experiments.length} experiments
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[360px_1fr]">
        {/* Form */}
        <div className="h-fit rounded-xl border border-border bg-surface-muted p-5 shadow-sm">
          <h3 className="mb-4 font-bold text-text">{editingExperimentId ? "Edit Experiment" : "New Experiment"}</h3>
          <div className="flex flex-col gap-3">
             <label className="text-xs font-medium text-muted">
              Title
              <input type="text" className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
                value={experimentDraft.title} onChange={e => setExperimentDraft(p => ({...p, title: e.target.value}))} />
             </label>
             <label className="text-xs font-medium text-muted">
              Hypothesis
              <textarea rows={2} className="mt-1 w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:ring-1 focus:ring-primary outline-none" 
                value={experimentDraft.hypothesis} onChange={e => setExperimentDraft(p => ({...p, hypothesis: e.target.value}))} />
             </label>
             
             <div className="grid grid-cols-2 gap-3">
               <label className="text-xs font-medium text-muted">
                Status
                <select className="mt-1 w-full rounded-lg border border-border bg-surface px-2 py-2 text-sm text-text focus:border-primary outline-none"
                  value={experimentDraft.status} onChange={e => setExperimentDraft(p => ({...p, status: e.target.value as ExperimentStatus}))}>
                  {experimentStatuses.map(s => <option key={s} value={s}>{s}</option>)}
                </select>
               </label>
               <label className="text-xs font-medium text-muted">
                Result
                <select className="mt-1 w-full rounded-lg border border-border bg-surface px-2 py-2 text-sm text-text focus:border-primary outline-none"
                  value={experimentDraft.result} onChange={e => setExperimentDraft(p => ({...p, result: e.target.value as ExperimentResult}))}>
                  {experimentResults.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
               </label>
             </div>
             
             <div className="grid grid-cols-2 gap-3">
               <label className="text-xs font-medium text-muted">
                Start Date
                <input type="date" className="mt-1 w-full rounded-lg border border-border bg-surface px-2 py-2 text-sm text-text focus:border-primary outline-none"
                  value={experimentDraft.startDate} onChange={e => setExperimentDraft(p => ({...p, startDate: e.target.value}))} />
               </label>
               <label className="text-xs font-medium text-muted">
                End Date
                <input type="date" className="mt-1 w-full rounded-lg border border-border bg-surface px-2 py-2 text-sm text-text focus:border-primary outline-none"
                  value={experimentDraft.endDate} onChange={e => setExperimentDraft(p => ({...p, endDate: e.target.value}))} />
               </label>
             </div>

             <div className="space-y-2">
                 <span className="text-xs font-medium text-muted">Tags</span>
                 <div className="flex flex-wrap gap-2">
                   {tags.map((tag) => (
                     <button
                       key={tag.id}
                       type="button"
                       onClick={() => toggleExperimentTag(tag.id)}
                       className={`flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[10px] font-bold transition-all ${
                         experimentDraft.tags.includes(tag.id)
                           ? "ring-1 ring-inset saturate-100"
                           : "opacity-60 grayscale hover:opacity-100 hover:grayscale-0"
                       }`}
                       style={{ 
                         backgroundColor: experimentDraft.tags.includes(tag.id) ? `${tag.color}20` : 'transparent',
                         color: tag.color,
                         boxShadow: experimentDraft.tags.includes(tag.id) ? `inset 0 0 0 1px ${tag.color}` : `inset 0 0 0 1px var(--border)`
                       }}
                     >
                       <span className="h-1.5 w-1.5 rounded-full" style={{backgroundColor: tag.color}}/>
                       {tag.label}
                     </button>
                   ))}
                 </div>
              </div>

              <div className="mt-2 flex gap-2">
                <button
                  onClick={submitExperiment}
                  className="flex-1 rounded-lg bg-primary px-4 py-2 text-sm font-bold text-white shadow-md transition-transform hover:-translate-y-0.5 active:translate-y-0"
                >
                  {editingExperimentId ? "Update" : "Create"}
                </button>
                {editingExperimentId && (
                  <button
                    onClick={cancelEditExperiment}
                    className="rounded-lg border border-border bg-surface px-4 py-2 text-sm font-semibold text-muted hover:bg-surface-muted"
                  >
                    Cancel
                  </button>
                )}
              </div>
          </div>
        </div>

        {/* List */}
        <div ref={gridRef} className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2 content-start">
          {experiments.length === 0 ? (
            <EmptyState
              title="No experiments yet"
              description="Log your first hypothesis and start tracking outcomes."
            />
          ) : (
            experiments.map(exp => (
              <div key={exp.id} className="group relative flex flex-col gap-3 rounded-xl border border-border bg-surface p-5 shadow-sm transition-all hover:shadow-md">
                 <div className="flex items-start justify-between">
                    <h3 className="font-bold text-text line-clamp-1">{exp.title}</h3>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold border ${
                      exp.status === 'Running' ? 'border-primary/20 bg-primary/10 text-primary' :
                      exp.status === 'Complete' ? 'border-success/20 bg-success/10 text-success' :
                      'border-border bg-surface-muted text-muted'
                    }`}>
                      {exp.status}
                    </span>
                 </div>
                 
                 <p className="text-xs text-muted line-clamp-2">{exp.hypothesis}</p>
                 
                 <div className="mt-auto flex flex-wrap gap-2 pt-3 border-t border-border">
                    {exp.tags.map(tagId => {
                       const t = tags.find(x => x.id === tagId);
                       if(!t) return null;
                       return <span key={tagId} className="h-2 w-2 rounded-full" style={{backgroundColor: t.color}} title={t.label} />;
                    })}
                    <div className="ml-auto flex gap-2">
                       <button onClick={() => startEditExperiment(exp)} className="text-xs font-semibold text-muted hover:text-primary">Edit</button>
                       <button onClick={() => deleteExperiment(exp.id)} className="text-xs font-semibold text-muted hover:text-danger">Delete</button>
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
