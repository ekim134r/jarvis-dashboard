"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type AssetCategory =
  | "Inspo"
  | "UI"
  | "Motion"
  | "Typography"
  | "Color"
  | "Layout"
  | "Competitor";

type AssetStatus = "keep" | "maybe" | "trash";

type AssetEntry = {
  id: string;
  kind: "file" | "url";
  title?: string;
  category: AssetCategory;
  status: AssetStatus;
  rating: 1 | 2 | 3 | 4 | 5;
  tags: string[];
  sourceUrl?: string;
  useCase?: string;
  fileName?: string;
  mimeType?: string;
  sizeBytes?: number;
  storedPath?: string;
  createdAt: string;
  updatedAt: string;
};

type Payload = { assets: AssetEntry[] };

const categories: AssetCategory[] = [
  "Inspo",
  "UI",
  "Motion",
  "Typography",
  "Color",
  "Layout",
  "Competitor",
];

function cls(...xs: Array<string | false | null | undefined>) {
  return xs.filter(Boolean).join(" ");
}

export default function AssetsView() {
  const [payload, setPayload] = useState<Payload>({ assets: [] });
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const [category, setCategory] = useState<AssetCategory | "all">("all");
  const [status, setStatus] = useState<AssetStatus | "all">("all");
  const [q, setQ] = useState("");

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const refresh = async () => {
    try {
      setError(null);
      const res = await fetch("/api/assets", { cache: "no-store" });
      if (!res.ok) throw new Error("failed");
      const json = (await res.json()) as Payload;
      setPayload(json);
    } catch {
      setError("Failed to load assets.");
    }
  };

  useEffect(() => {
    refresh();
  }, []);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return (payload.assets ?? []).filter((a) => {
      if (category !== "all" && a.category !== category) return false;
      if (status !== "all" && a.status !== status) return false;
      if (!query) return true;
      const hay = `${a.title ?? ""} ${a.useCase ?? ""} ${(a.tags ?? []).join(" ")} ${a.sourceUrl ?? ""}`
        .toLowerCase()
        .trim();
      return hay.includes(query);
    });
  }, [payload.assets, q, category, status]);

  const uploadFile = async (file: File, meta?: Partial<AssetEntry>) => {
    const form = new FormData();
    form.set("file", file);
    form.set("category", (meta?.category as any) ?? "Inspo");
    form.set("status", (meta?.status as any) ?? "keep");
    form.set("rating", String((meta?.rating as any) ?? 4));
    form.set("tags", (meta?.tags ?? []).join(", "));
    if (meta?.title) form.set("title", meta.title);
    if (meta?.useCase) form.set("useCase", meta.useCase);
    if (meta?.sourceUrl) form.set("sourceUrl", meta.sourceUrl);

    setBusy(true);
    try {
      const res = await fetch("/api/assets", { method: "POST", body: form });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "upload failed");
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const addUrl = async (url: string) => {
    setBusy(true);
    try {
      const res = await fetch("/api/assets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, category: "Inspo", status: "keep", rating: 4, tags: [] }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error || "failed");
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  const onDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files ?? []);
    const first = files[0];
    if (!first) return;
    if (!first.type.startsWith("image/")) return;
    await uploadFile(first);
  };

  const onPaste = async (e: React.ClipboardEvent<HTMLDivElement>) => {
    const items = Array.from(e.clipboardData.items);
    const img = items.find((i) => i.type.startsWith("image/"));
    if (!img) return;
    const file = img.getAsFile();
    if (!file) return;
    await uploadFile(file);
  };

  return (
    <div
      className="space-y-4"
      onPaste={onPaste}
    >
      <div className="rounded-3xl border border-border bg-surface/80 p-5 shadow-xl backdrop-blur-2xl">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-sm font-bold text-text">Assets</div>
            <div className="mt-1 text-xs text-muted">
              Drag & drop or paste images. Save Dribbble links as URL-only entries.
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              className={cls(
                "h-9 rounded-2xl border px-3 text-sm font-semibold",
                busy
                  ? "border-border text-muted cursor-not-allowed"
                  : "border-border bg-surface/70 text-text hover:bg-surface"
              )}
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
            >
              Upload
            </button>
            <button
              className={cls(
                "h-9 rounded-2xl border px-3 text-sm font-semibold",
                busy
                  ? "border-border text-muted cursor-not-allowed"
                  : "border-border bg-surface/70 text-text hover:bg-surface"
              )}
              disabled={busy}
              onClick={() => {
                const url = window.prompt("Paste URL (Dribbble/Behance/etc.)");
                if (!url) return;
                addUrl(url.trim());
              }}
            >
              Save URL
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                await uploadFile(f);
                e.currentTarget.value = "";
              }}
            />
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search tags / use-case / url"
            className="h-9 w-full max-w-[360px] rounded-2xl border border-border bg-surface/70 px-3 text-sm font-semibold text-text shadow-sm backdrop-blur focus:outline-none focus:ring-2 focus:ring-primary/30"
          />

          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as any)}
            className="h-9 rounded-2xl border border-border bg-surface/70 px-3 text-sm font-semibold text-text shadow-sm backdrop-blur focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as any)}
            className="h-9 rounded-2xl border border-border bg-surface/70 px-3 text-sm font-semibold text-text shadow-sm backdrop-blur focus:outline-none focus:ring-2 focus:ring-primary/30"
          >
            <option value="all">All</option>
            <option value="keep">Keep</option>
            <option value="maybe">Maybe</option>
            <option value="trash">Trash</option>
          </select>

          <div className="ml-auto text-xs text-muted">
            {filtered.length} / {(payload.assets ?? []).length}
          </div>
        </div>
      </div>

      {error ? (
        <div className="rounded-3xl border border-danger/30 bg-danger/10 p-5 text-danger">
          {error}
        </div>
      ) : null}

      <div
        onDragOver={(e) => {
          e.preventDefault();
        }}
        onDrop={onDrop}
        className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3"
      >
        {filtered.map((a) => {
          const isFile = a.kind === "file";
          const imgSrc = isFile ? `/api/assets/file?id=${encodeURIComponent(a.id)}` : undefined;
          return (
            <div
              key={a.id}
              className="overflow-hidden rounded-3xl border border-border bg-surface/60 shadow-sm backdrop-blur"
            >
              <div className="relative aspect-[16/10] bg-black/10 dark:bg-white/5">
                {imgSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={imgSrc}
                    alt={a.title ?? a.fileName ?? "asset"}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center p-6 text-center text-sm text-muted">
                    <div>
                      <div className="font-semibold text-text">URL only</div>
                      <div className="mt-1 break-all text-xs">{a.sourceUrl}</div>
                    </div>
                  </div>
                )}

                <div className="absolute left-3 top-3 rounded-full bg-black/50 px-2.5 py-1 text-[11px] font-semibold text-white">
                  {a.category}
                </div>

                <div
                  className={cls(
                    "absolute right-3 top-3 rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1",
                    a.status === "keep"
                      ? "bg-emerald-500/15 text-emerald-200 ring-emerald-500/20"
                      : a.status === "trash"
                        ? "bg-rose-500/15 text-rose-200 ring-rose-500/20"
                        : "bg-amber-500/15 text-amber-200 ring-amber-500/20"
                  )}
                >
                  {a.status}
                </div>
              </div>

              <div className="space-y-2 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-text">
                      {a.title ?? a.fileName ?? a.id}
                    </div>
                    <div className="mt-1 text-xs text-muted">
                      {a.useCase ? a.useCase : a.sourceUrl ? a.sourceUrl : ""}
                    </div>
                  </div>
                  <div className="shrink-0 text-xs font-bold text-muted">{a.rating}/5</div>
                </div>

                {(a.tags ?? []).length ? (
                  <div className="flex flex-wrap gap-1.5">
                    {a.tags.slice(0, 8).map((t) => (
                      <span
                        key={t}
                        className="rounded-full border border-border bg-surface/70 px-2 py-0.5 text-[11px] font-semibold text-muted"
                      >
                        {t}
                      </span>
                    ))}
                  </div>
                ) : null}

                {a.sourceUrl ? (
                  <div className="flex items-center justify-between gap-2">
                    <a
                      href={a.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-xs font-semibold text-primary hover:underline"
                    >
                      Open source
                    </a>
                    {isFile ? (
                      <button
                        className="text-xs font-semibold text-muted hover:text-text"
                        onClick={() => {
                          navigator.clipboard.writeText(imgSrc || "");
                        }}
                      >
                        Copy URL
                      </button>
                    ) : null}
                  </div>
                ) : null}
              </div>
            </div>
          );
        })}

        {filtered.length === 0 ? (
          <div className="col-span-full rounded-3xl border border-border bg-surface/60 p-8 text-center text-sm text-muted">
            No assets yet. Drag an image here or paste from clipboard.
          </div>
        ) : null}
      </div>
    </div>
  );
}
