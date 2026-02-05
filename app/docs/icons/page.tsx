import { Suspense } from "react";
import { Icons } from "@/components/docs/icons";
import { IconsFallback } from "@/components/docs/icons-fallback";

export default function IconsPage() {
  return (
    <main className="min-h-screen bg-bg px-6 py-10">
      <div className="mx-auto w-full max-w-5xl">
        <div className="mb-6">
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-primary/80">
            Icons
          </p>
          <h1 className="font-display text-3xl font-bold text-text">Lucide Icons</h1>
          <p className="mt-2 text-sm text-muted">
            A lightweight, animated icon set for dashboards and labs.
          </p>
        </div>

        <Suspense fallback={<IconsFallback />}>
          <Icons />
        </Suspense>
      </div>
    </main>
  );
}
