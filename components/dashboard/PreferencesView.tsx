import React, { useRef, useState, useEffect } from "react";
import type { Preference, PreferenceDecision, Tag } from "@/lib/types";
import { useAutoAnimate } from "@formkit/auto-animate/react";

type PreferenceDraft = {
  prompt: string;
  leftLabel: string;
  rightLabel: string;
  tags: string[];
  notes: string;
};

type PreferencesViewProps = {
  preferences: Preference[];
  tags: Tag[];
  preferenceDraft: PreferenceDraft;
  setPreferenceDraft: (val: PreferenceDraft | ((prev: PreferenceDraft) => PreferenceDraft)) => void;
  preferenceConfidence: number;
  setPreferenceConfidence: (val: number) => void;
  preferenceQueue: Preference[];
  preferenceStats: { total: number; left: number; right: number; skip: number };
  togglePreferenceTag: (id: string) => void;
  submitPreference: () => void;
  updatePreference: (id: string, patch: Partial<Preference>) => void;
  deletePreference: (id: string) => void;
  handlePreferenceDecision: (pref: Preference, decision: PreferenceDecision) => Promise<void>;
  preferenceCardRef: React.MutableRefObject<HTMLDivElement | null>;
};

export default function PreferencesView({
  preferences,
  tags,
  preferenceDraft,
  setPreferenceDraft,
  preferenceConfidence,
  setPreferenceConfidence,
  preferenceQueue,
  preferenceStats,
  togglePreferenceTag,
  submitPreference,
  updatePreference,
  deletePreference,
  handlePreferenceDecision,
  preferenceCardRef,
}: PreferencesViewProps) {
  const [listRef] = useAutoAnimate<HTMLDivElement>();
  
  // Swipe Logic State
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const cardElementRef = useRef<HTMLDivElement | null>(null);

  // Parse notes into "Data Points" (Bullet points)
  const getDataPoints = (text: string) => {
    return text.split("\n").filter(line => line.trim().length > 0);
  };

  // Drag Handlers
  const handlePointerDown = (e: React.PointerEvent) => {
    setDragStart({ x: e.clientX, y: e.clientY });
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!dragStart) return;
    const x = e.clientX - dragStart.x;
    const y = e.clientY - dragStart.y;
    setDragOffset({ x, y });
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (!dragStart) return;
    
    // Threshold to trigger decision
    const threshold = 120; // Slightly increased for "heavier" feel
    
    if (dragOffset.x > threshold) {
      handlePreferenceDecision(preferenceQueue[0], "right");
    } else if (dragOffset.x < -threshold) {
      handlePreferenceDecision(preferenceQueue[0], "left");
    }

    setDragStart(null);
    setDragOffset({ x: 0, y: 0 });
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  // Sync ref for the parent component's animation calls
  useEffect(() => {
    if (cardElementRef.current && preferenceCardRef) {
      preferenceCardRef.current = cardElementRef.current;
    }
  }, [preferenceCardRef]);

  // Calculate rotation based on drag (physics feel)
  const rotation = dragOffset.x * 0.04;
  const opacityRight = Math.max(0, Math.min(dragOffset.x / 100, 1));
  const opacityLeft = Math.max(0, Math.min(-dragOffset.x / 100, 1));

  return (
    <section id="preferences-section" className="view-shell view-preferences reveal rounded-[2rem] border border-border bg-surface p-6 shadow-2xl shadow-black/5 dark:shadow-black/20">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-primary/80">Project Decision Deck</p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-text">Swipe to Decide</h2>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 rounded-full border border-border bg-surface-muted/50 px-4 py-1.5 text-xs font-semibold text-muted backdrop-blur-md">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-primary"></span>
            </span>
            {preferenceQueue.length} cards remaining
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-[420px_1fr]">
        
        {/* SWIPE AREA */}
        <div className="flex flex-col gap-8">
          <div className="relative flex h-[460px] md:h-[580px] w-full items-center justify-center perspective-[1000px]">
             {/* Empty State */}
             {preferenceQueue.length === 0 && (
                <div className="flex h-full w-full flex-col items-center justify-center gap-6 rounded-[2rem] border-2 border-dashed border-border bg-surface-muted/30 p-10 text-center">
                  <div className="flex h-20 w-20 items-center justify-center rounded-full bg-surface shadow-sm">
                    <svg className="h-10 w-10 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-text">All caught up!</h3>
                    <p className="text-sm text-muted">No more projects to review at the moment.</p>
                  </div>
                  <button onClick={() => document.getElementById('new-card-form')?.scrollIntoView({ behavior: 'smooth'})} className="group flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary hover:text-primary-strong">
                    Create new card 
                    <span className="transition-transform group-hover:translate-y-0.5">↓</span>
                  </button>
                </div>
             )}

             {/* Background Cards (Stack Effect) */}
             {preferenceQueue.length > 1 && (
                <div className="absolute top-6 h-[540px] w-[92%] rounded-[2rem] border border-border bg-surface shadow-sm opacity-60" style={{ transform: 'translateZ(-20px)' }} />
             )}
             {preferenceQueue.length > 2 && (
                <div className="absolute top-10 h-[520px] w-[86%] rounded-[2rem] border border-border bg-surface shadow-sm opacity-30" style={{ transform: 'translateZ(-40px)' }} />
             )}

             {/* Active Card */}
             {preferenceQueue.length > 0 && (
              <div 
                ref={cardElementRef}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                className="absolute top-0 z-20 flex h-full w-full cursor-grab flex-col justify-between overflow-hidden rounded-[2rem] border border-white/20 bg-surface shadow-2xl transition-shadow hover:shadow-[0_20px_50px_-12px_rgba(0,0,0,0.15)] active:cursor-grabbing dark:border-white/5 dark:bg-surface-strong"
                style={{
                   transform: `translate(${dragOffset.x}px, ${dragOffset.y}px) rotate(${rotation}deg)`,
                   transition: dragStart ? 'none' : 'transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)',
                   boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)'
                }}
              >
                {/* Visual Indicators for Swipe */}
                <div className="pointer-events-none absolute left-8 top-8 z-30 rotate-[-12deg] rounded-xl border-[6px] border-success px-4 py-2 text-4xl font-black uppercase tracking-widest text-success opacity-0 drop-shadow-sm" style={{ opacity: opacityRight }}>
                  {preferenceQueue[0].rightLabel || "YES"}
                </div>
                <div className="pointer-events-none absolute right-8 top-8 z-30 rotate-[12deg] rounded-xl border-[6px] border-danger px-4 py-2 text-4xl font-black uppercase tracking-widest text-danger opacity-0 drop-shadow-sm" style={{ opacity: opacityLeft }}>
                  {preferenceQueue[0].leftLabel || "NO"}
                </div>

                {/* Card Header */}
                <div className="relative h-40 w-full shrink-0 overflow-hidden bg-gradient-to-br from-primary via-[#4f46e5] to-primary-strong p-6 text-white">
                   <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150 mix-blend-soft-light"></div>
                   
                   <div className="relative z-10 flex h-full flex-col justify-between">
                     <div className="flex justify-between items-start">
                        <div className="rounded-full bg-white/20 px-3 py-1 text-[10px] font-bold uppercase tracking-wider backdrop-blur-md">
                          Review
                        </div>
                     </div>
                     
                     <div className="flex flex-wrap gap-2">
                        {preferenceQueue[0].tags.map(tagId => {
                           const tag = tags.find(t => t.id === tagId);
                           if (!tag) return null;
                           return (
                             <span key={tagId} className="flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[10px] font-bold text-white shadow-sm backdrop-blur-md ring-1 ring-inset ring-white/20">
                               <span className="h-1.5 w-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
                               {tag.label}
                             </span>
                           );
                        })}
                     </div>
                   </div>
                </div>

                {/* Card Body */}
                <div className="flex flex-1 flex-col gap-5 p-7">
                   <div>
                     <span className="mb-2 block text-[10px] font-bold uppercase tracking-wider text-muted/80">Project Proposal</span>
                     <h3 className="font-display text-3xl font-bold leading-[1.1] text-text">
                       {preferenceQueue[0].prompt}
                     </h3>
                   </div>

                   {/* Data Points & Slider Container */}
                   <div className="flex flex-1 flex-col md:flex-row gap-5 overflow-hidden">
                      {/* Data Points */}
                      <div className="flex-1 space-y-3 overflow-y-auto pr-1">
                          {getDataPoints(preferenceQueue[0].notes).length === 0 ? (
                            <div className="flex items-center gap-2 rounded-lg bg-surface-muted/50 p-3 text-sm italic text-muted">
                              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              No additional data provided.
                            </div>
                          ) : (
                            getDataPoints(preferenceQueue[0].notes).map((line, i) => (
                              <div key={i} className="group flex items-start gap-3 rounded-lg border border-transparent p-2 transition-colors hover:border-border hover:bg-surface-muted/30">
                                <div className="mt-1.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                                  <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                                </div>
                                <span className="text-sm font-medium text-text/90 leading-relaxed">{line}</span>
                              </div>
                            ))
                          )}
                      </div>
                      
                      {/* Confidence Slider - Responsive (Horizontal Mobile / Vertical Desktop) */}
                      <div className="shrink-0 rounded-2xl border border-border bg-surface-muted/30 p-4 flex flex-col md:w-16 md:items-center">
                          <div className="mb-3 flex justify-between md:flex-col md:items-center md:gap-2 md:mb-0 md:h-full">
                            <span className="text-xs font-bold uppercase tracking-wider text-muted md:writing-vertical-lr md:rotate-180">Confidence</span>
                            <span className="text-xs font-bold text-primary">{preferenceConfidence}/5</span>
                            
                            <div className="flex items-center md:h-full md:w-full md:py-2">
                              {/* Mobile Horizontal */}
                              <input
                                type="range"
                                min="1"
                                max="5"
                                step="1"
                                className="md:hidden h-2 w-full cursor-pointer appearance-none rounded-full bg-border accent-primary hover:accent-primary-strong focus:outline-none focus:ring-2 focus:ring-primary/20"
                                value={preferenceConfidence}
                                onPointerDown={(e) => e.stopPropagation()} 
                                onChange={(e) => setPreferenceConfidence(Number(e.target.value))}
                              />
                              
                              {/* Desktop Vertical */}
                              <input
                                type="range"
                                min="1"
                                max="5"
                                step="1"
                                className="hidden md:block w-32 -rotate-90 cursor-pointer appearance-none rounded-full bg-border accent-primary hover:accent-primary-strong focus:outline-none focus:ring-2 focus:ring-primary/20 origin-center translate-y-10"
                                style={{ width: '120px', margin: 'auto' }} // Explicit width for rotation
                                value={preferenceConfidence}
                                onPointerDown={(e) => e.stopPropagation()} 
                                onChange={(e) => setPreferenceConfidence(Number(e.target.value))}
                              />
                            </div>
                          </div>
                          
                          {/* Ticks */}
                          <div className="mt-2 flex justify-between px-1 md:mt-0 md:h-32 md:flex-col md:justify-between md:w-1 md:py-3 md:items-center hidden">
                            <div className="h-1 w-0.5 bg-border md:w-1 md:h-0.5"></div>
                            <div className="h-1 w-0.5 bg-border md:w-1 md:h-0.5"></div>
                            <div className="h-1 w-0.5 bg-border md:w-1 md:h-0.5"></div>
                            <div className="h-1 w-0.5 bg-border md:w-1 md:h-0.5"></div>
                            <div className="h-1 w-0.5 bg-border md:w-1 md:h-0.5"></div>
                          </div>
                      </div>
                   </div>
                </div>

                {/* Card Actions */}
                <div className="grid grid-cols-3 gap-6 border-t border-border bg-surface-muted/30 p-6 backdrop-blur-sm">
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => handlePreferenceDecision(preferenceQueue[0], "left")}
                    className="group flex h-14 items-center justify-center rounded-2xl border border-danger/20 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-danger hover:shadow-lg hover:shadow-danger/10 active:translate-y-0 dark:bg-surface"
                    title="Reject (Left)"
                  >
                     <svg className="h-6 w-6 text-danger/80 transition-colors group-hover:scale-110 group-hover:text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" /></svg>
                  </button>
                  
                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => handlePreferenceDecision(preferenceQueue[0], "skip")}
                    className="flex h-14 items-center justify-center rounded-2xl border border-border bg-transparent text-xs font-bold uppercase tracking-wider text-muted transition-all hover:-translate-y-1 hover:bg-surface-muted hover:text-text hover:shadow-md active:translate-y-0"
                  >
                    Skip
                  </button>

                  <button
                    onPointerDown={(e) => e.stopPropagation()}
                    onClick={() => handlePreferenceDecision(preferenceQueue[0], "right")}
                    className="group flex h-14 items-center justify-center rounded-2xl border border-success/20 bg-white shadow-sm transition-all hover:-translate-y-1 hover:border-success hover:shadow-lg hover:shadow-success/10 active:translate-y-0 dark:bg-surface"
                    title="Approve (Right)"
                  >
                     <svg className="h-6 w-6 text-success/80 transition-colors group-hover:scale-110 group-hover:text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" /></svg>
                  </button>
                </div>
              </div>
             )}
          </div>

          {/* Stats Row */}
          <div className="flex justify-between divide-x divide-border rounded-2xl border border-border bg-surface p-4 text-center shadow-sm">
             <div className="flex-1 px-2">
               <div className="font-mono text-2xl font-bold text-danger">{preferenceStats.left}</div>
               <div className="text-[9px] font-bold uppercase tracking-widest text-muted/60">Rejected</div>
             </div>
             <div className="flex-1 px-2">
               <div className="font-mono text-2xl font-bold text-text opacity-40">{preferenceStats.skip}</div>
               <div className="text-[9px] font-bold uppercase tracking-widest text-muted/60">Skipped</div>
             </div>
             <div className="flex-1 px-2">
               <div className="font-mono text-2xl font-bold text-success">{preferenceStats.right}</div>
               <div className="text-[9px] font-bold uppercase tracking-widest text-muted/60">Approved</div>
             </div>
          </div>
        </div>

        {/* RIGHT SIDE: EASY SETUP FORM */}
        <div id="new-card-form" className="sticky top-6 h-fit flex flex-col gap-6">
          <div className="rounded-[2rem] border border-border bg-surface p-8 shadow-xl shadow-black/5 dark:shadow-black/20">
            <div className="mb-6 flex items-start justify-between">
              <div>
                 <span className="mb-2 inline-block rounded-full bg-gradient-to-r from-primary/10 to-primary/5 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">Easy Setup</span>
                 <h3 className="font-display text-xl font-bold text-text">Add Project Card</h3>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-muted text-muted">
                 <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>
              </div>
            </div>
            
            <div className="flex flex-col gap-5">
              <label className="block">
                <span className="mb-2 block text-xs font-bold text-text/80">Project Title</span>
                <input
                  type="text"
                  className="w-full rounded-xl border border-border bg-surface-muted/50 px-4 py-3 text-sm font-semibold text-text shadow-sm transition-all placeholder:font-normal placeholder:text-muted/50 focus:border-primary focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10"
                  value={preferenceDraft.prompt}
                  onChange={(e) => setPreferenceDraft((p) => ({ ...p, prompt: e.target.value }))}
                  placeholder="e.g. Redesign Landing Page"
                />
              </label>

              <div className="grid grid-cols-2 gap-4">
                 <label className="block">
                    <span className="mb-2 block text-xs font-bold text-text/80">Option A (Left)</span>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                         <div className="h-2 w-2 rounded-full bg-danger"></div>
                      </div>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-border bg-surface-muted/50 pl-8 pr-3 py-2.5 text-sm text-text transition-all focus:border-primary focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10"
                        value={preferenceDraft.leftLabel}
                        onChange={(e) => setPreferenceDraft((p) => ({ ...p, leftLabel: e.target.value }))}
                        placeholder="Discard"
                      />
                    </div>
                 </label>
                 <label className="block">
                    <span className="mb-2 block text-xs font-bold text-text/80">Option B (Right)</span>
                    <div className="relative">
                      <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                         <div className="h-2 w-2 rounded-full bg-success"></div>
                      </div>
                      <input
                        type="text"
                        className="w-full rounded-xl border border-border bg-surface-muted/50 pl-8 pr-3 py-2.5 text-sm text-text transition-all focus:border-primary focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10"
                        value={preferenceDraft.rightLabel}
                        onChange={(e) => setPreferenceDraft((p) => ({ ...p, rightLabel: e.target.value }))}
                        placeholder="Approve"
                      />
                    </div>
                 </label>
              </div>

              <label className="block">
                <div className="mb-2 flex items-center justify-between">
                   <span className="text-xs font-bold text-text/80">Key Data Points</span>
                   <span className="text-[10px] font-medium text-muted">Bullet points supported</span>
                </div>
                <textarea
                  rows={4}
                  className="w-full rounded-xl border border-border bg-surface-muted/50 px-4 py-3 text-sm text-text shadow-sm transition-all placeholder:text-muted/50 focus:border-primary focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10 resize-none"
                  value={preferenceDraft.notes}
                  onChange={(e) => setPreferenceDraft((p) => ({ ...p, notes: e.target.value }))}
                  placeholder={"• High Impact\n• Low Effort\n• Estimated Revenue: $5k"}
                />
              </label>
              
              <div>
                 <span className="mb-3 block text-xs font-bold text-text/80">Tags</span>
                 <div className="flex flex-wrap gap-2">
                   {tags.map((tag) => {
                     const isSelected = preferenceDraft.tags.includes(tag.id);
                     return (
                       <button
                         key={tag.id}
                         type="button"
                         onClick={() => togglePreferenceTag(tag.id)}
                         className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[10px] font-bold transition-all active:scale-95 ${
                           isSelected
                             ? "border-transparent ring-2 ring-inset"
                             : "border-border bg-surface text-muted hover:border-primary/30 hover:text-text"
                         }`}
                         style={{ 
                           backgroundColor: isSelected ? `${tag.color}15` : undefined,
                           color: isSelected ? tag.color : undefined,
                           borderColor: isSelected ? tag.color : undefined,
                           boxShadow: isSelected ? `0 2px 8px -2px ${tag.color}60` : undefined
                         }}
                       >
                         {isSelected && (
                            <span className="h-1.5 w-1.5 rounded-full animate-pulse" style={{backgroundColor: tag.color}}/>
                         )}
                         {tag.label}
                       </button>
                     );
                   })}
                   {tags.length === 0 && <p className="text-[10px] italic text-muted">Create tags in the Filter view first.</p>}
                 </div>
              </div>

              <button
                onClick={submitPreference}
                disabled={!preferenceDraft.prompt}
                className="group mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-6 py-4 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary-strong hover:shadow-xl hover:shadow-primary/30 active:translate-y-0 disabled:opacity-50 disabled:shadow-none"
              >
                <span>Add Card to Deck</span>
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" /></svg>
              </button>
            </div>
          </div>

          {/* Mini List of Previous Decisions */}
          <div className="rounded-[2rem] border border-border bg-surface p-6 shadow-sm">
             <h4 className="mb-4 text-xs font-bold uppercase tracking-wider text-muted">Recent History</h4>
             <div ref={listRef} className="flex flex-col gap-2">
               {preferences.filter(p => p.decision !== 'unset').slice(0, 5).map(pref => (
                 <div key={pref.id} className="group flex items-center justify-between rounded-xl border border-border bg-surface p-3 text-xs transition-colors hover:border-primary/20 hover:shadow-sm">
                    <span className="font-medium text-text truncate max-w-[150px]">{pref.prompt}</span>
                    <div className="flex items-center gap-3">
                       <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                         pref.decision === 'right' ? 'bg-success/10 text-success' : 
                         pref.decision === 'left' ? 'bg-danger/10 text-danger' : 'bg-surface-muted text-muted'
                       }`}>
                         {pref.decision === 'right' ? 'Approved' : pref.decision === 'left' ? 'Rejected' : 'Skipped'}
                       </span>
                       <button onClick={() => updatePreference(pref.id, { decision: 'unset' })} className="rounded-full p-1 text-muted hover:bg-surface-muted hover:text-text transition-colors" title="Undo decision">
                         <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" /></svg>
                       </button>
                    </div>
                 </div>
               ))}
               {preferences.filter(p => p.decision !== 'unset').length === 0 && (
                 <p className="py-4 text-center text-xs italic text-muted">No decisions made yet.</p>
               )}
             </div>
          </div>

        </div>
      </div>
    </section>
  );
}
