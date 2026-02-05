import React from "react";

type HeroProps = {
  heroDate: string;
  openTaskCount: number;
  columnCount: number;
  scrollToSection: (id: string) => void;
  openSection: (id: string) => void;
};

export default function Hero({
  heroDate,
  openTaskCount,
  columnCount,
  scrollToSection,
  openSection,
}: HeroProps) {
  return (
    <section className="group relative mb-6 overflow-hidden rounded-[2rem] border border-white/20 bg-gradient-to-br from-surface to-surface-muted p-8 shadow-lg transition-all hover:shadow-xl dark:border-white/10 dark:from-surface dark:to-surface-strong">
      <div className="pointer-events-none absolute -right-20 -top-20 h-96 w-96 rounded-full bg-primary/5 blur-3xl transition-opacity group-hover:opacity-75" />
      
      <div className="relative z-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-primary/80">
            {heroDate}
          </p>
          <h1 className="mb-3 font-display text-4xl font-bold tracking-tight text-text md:text-5xl lg:text-6xl">
            Today’s focus.
          </h1>
          <p className="text-lg text-muted">
            You have <strong className="text-text">{openTaskCount}</strong> open tasks across{" "}
            <strong className="text-text">{columnCount}</strong> lanes.
          </p>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => scrollToSection("tag-panel")}
            className="rounded-xl border border-border bg-surface px-5 py-3 text-sm font-semibold text-text shadow-sm transition-all hover:-translate-y-0.5 hover:bg-surface-muted hover:shadow-md active:translate-y-0"
          >
            Filter View
          </button>
          <button
            onClick={() => openSection("board")}
            className="rounded-xl bg-primary px-6 py-3 text-sm font-semibold text-white shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary-strong hover:shadow-lg active:translate-y-0"
          >
            New Task
          </button>
        </div>
      </div>
    </section>
  );
}
