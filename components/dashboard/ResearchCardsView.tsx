"use client";

import React, { useEffect, useMemo, useState } from "react";
import Ajv, { type ErrorObject } from "ajv";
import EmptyState from "@/components/ui/EmptyState";
import { useToast } from "@/components/ui/ToastProvider";
import type { ResearchCard } from "@/lib/types";

type Draft = {
  title: string;
  background: string;
  question: string;
  constraints: string;
  outputSchema: string;
  prompt: string;
  result: string;
};

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...options });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

const DEFAULT_SCHEMA = JSON.stringify(
  {
    type: "object",
    additionalProperties: false,
    properties: {
      executive_summary: { type: "array", items: { type: "string" } },
      key_findings: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            claim: { type: "string" },
            confidence: { type: "number", minimum: 0, maximum: 1 },
            evidence: { type: "array", items: { type: "string" } }
          },
          required: ["claim", "confidence", "evidence"]
        }
      },
      sources: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          properties: {
            title: { type: "string" },
            url: { type: "string" }
          },
          required: ["title", "url"]
        }
      },
      risks_unknowns: { type: "array", items: { type: "string" } },
      next_actions: { type: "array", items: { type: "string" } }
    },
    required: ["executive_summary", "key_findings", "sources", "risks_unknowns", "next_actions"]
  },
  null,
  2
);

function createBromPrompt(input: {
  title: string;
  background: string;
  question: string;
  constraints: string;
  outputSchema: string;
}) {
  const schemaBlock = input.outputSchema?.trim() ? input.outputSchema.trim() : DEFAULT_SCHEMA;

  return [
    "BROM PATTERN (Research Card)",
    "",
    "ROLE:",
    "You are a meticulous research analyst. You verify claims, cite sources, and clearly separate facts from assumptions.",
    "",
    "BACKGROUND:",
    input.background?.trim() || "(Add background/context)",
    "",
    "QUESTION:",
    input.question?.trim() || input.title?.trim() || "(Add the research question)",
    "",
    "CONSTRAINTS:",
    input.constraints?.trim() || "- Use current sources\\n- Prefer primary sources\\n- Be explicit about uncertainty",
    "",
    "OUTPUT REQUIREMENTS:",
    "- Return ONLY valid JSON.",
    "- The JSON MUST validate against the JSON Schema below.",
    "- No markdown, no code fences, no prose outside JSON.",
    "",
    "JSON SCHEMA:",
    schemaBlock,
    "",
    "RESEARCH METHOD:",
    "1) Break the question into sub-questions.",
    "2) Gather evidence from multiple credible sources.",
    "3) Cross-check contradictions; call out unknowns.",
    "4) Produce the JSON result.",
    ""
  ].join("\n");
}

function formatAjvErrors(errors: ErrorObject[] | null | undefined) {
  if (!errors || errors.length === 0) return "";
  return errors
    .map((err) => {
      const path = err.instancePath || "(root)";
      const msg = err.message || "invalid";
      const extra = err.params ? ` (${JSON.stringify(err.params)})` : "";
      return `- ${path}: ${msg}${extra}`;
    })
    .join("\n");
}

export default function ResearchCardsView() {
  const toast = useToast();
  const ajv = useMemo(() => new Ajv({ allErrors: true, strict: false }), []);

  const [cards, setCards] = useState<ResearchCard[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draft, setDraft] = useState<Draft>({
    title: "",
    background: "",
    question: "",
    constraints: "",
    outputSchema: DEFAULT_SCHEMA,
    prompt: "",
    result: ""
  });

  const [validation, setValidation] = useState<
    | { status: "idle" }
    | { status: "ok"; message: string }
    | { status: "error"; message: string; details?: string }
  >({ status: "idle" });

  const selectedCard = useMemo(
    () => cards.find((c) => c.id === selectedId) || null,
    [cards, selectedId]
  );

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchJson<ResearchCard[]>("/api/research-cards");
        setCards(data);
        if (!selectedId && data[0]) setSelectedId(data[0].id);
      } catch (error: any) {
        toast.error("Research Cards failed to load", error?.message || "Reload the page.");
      }
    };
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!selectedCard) return;
    setDraft({
      title: selectedCard.title,
      background: selectedCard.background,
      question: selectedCard.question,
      constraints: selectedCard.constraints,
      outputSchema: selectedCard.outputSchema || DEFAULT_SCHEMA,
      prompt: selectedCard.prompt,
      result: selectedCard.result
    });
    setValidation({ status: "idle" });
  }, [selectedId]);

  const newCard = async () => {
    try {
      const created = await fetchJson<ResearchCard>("/api/research-cards", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: "New research card",
          background: "",
          question: "",
          constraints: "",
          outputSchema: DEFAULT_SCHEMA,
          prompt: "",
          result: ""
        })
      });
      setCards((prev) => [created, ...prev]);
      setSelectedId(created.id);
      toast.success("Research card created", created.title);
    } catch (error: any) {
      toast.error("Create failed", error?.message || "Try again.");
    }
  };

  const saveCard = async () => {
    if (!selectedId) return;
    if (!draft.title.trim()) {
      toast.error("Title required", "Name this research card.");
      return;
    }

    try {
      const updated = await fetchJson<ResearchCard>(`/api/research-cards/${selectedId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(draft)
      });
      setCards((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));
      toast.success("Saved", updated.title);
    } catch (error: any) {
      toast.error("Save failed", error?.message || "Try again.");
    }
  };

  const deleteCard = async () => {
    if (!selectedId || !selectedCard) return;
    const current = selectedCard;

    try {
      await fetchJson(`/api/research-cards/${selectedId}`, { method: "DELETE" });
      setCards((prev) => prev.filter((c) => c.id !== selectedId));
      setSelectedId((prev) => {
        const remaining = cards.filter((c) => c.id !== prev);
        return remaining[0]?.id ?? null;
      });
      toast.success("Deleted", current.title);
    } catch (error: any) {
      toast.error("Delete failed", error?.message || "Try again.");
    }
  };

  const generatePrompt = () => {
    const prompt = createBromPrompt({
      title: draft.title,
      background: draft.background,
      question: draft.question,
      constraints: draft.constraints,
      outputSchema: draft.outputSchema
    });
    setDraft((prev) => ({ ...prev, prompt }));
    toast.success("Prompt generated", "Ready to copy.");
  };

  const copyPrompt = async () => {
    try {
      await navigator.clipboard.writeText(draft.prompt || "");
      toast.success("Copied", "Prompt copied to clipboard.");
    } catch {
      toast.error("Copy failed", "Select and copy manually.");
    }
  };

  const validateResult = () => {
    let schema: any;
    try {
      schema = JSON.parse(draft.outputSchema || "");
    } catch (err: any) {
      setValidation({
        status: "error",
        message: "Schema is not valid JSON.",
        details: String(err?.message || err)
      });
      return;
    }

    let data: any;
    try {
      data = JSON.parse(draft.result || "");
    } catch (err: any) {
      setValidation({
        status: "error",
        message: "Result is not valid JSON.",
        details: String(err?.message || err)
      });
      return;
    }

    try {
      const validate = ajv.compile(schema);
      const ok = validate(data);
      if (ok) {
        setValidation({ status: "ok", message: "Valid JSON (matches schema)." });
      } else {
        setValidation({
          status: "error",
          message: "JSON does not match schema.",
          details: formatAjvErrors(validate.errors)
        });
      }
    } catch (err: any) {
      setValidation({
        status: "error",
        message: "Validator failed to compile schema.",
        details: String(err?.message || err)
      });
    }
  };

  return (
    <section className="view-shell reveal rounded-[2.25rem] border border-border bg-surface p-6 shadow-2xl shadow-black/5 dark:shadow-black/20">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-primary/80">
            Research Cards
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-text">
            Brom prompt + schema validation
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Build a structured research brief, copy the Brom-style prompt, paste the model output,
            and validate it against a JSON Schema.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-bold text-muted">
            {cards.length} cards
          </div>
          <button onClick={newCard} className="btn-primary">
            New card
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[320px_1fr]">
        <div className="rounded-2xl border border-border bg-surface-muted/60 p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted/80">Library</div>
            <div className="text-[11px] text-muted">{cards.length} total</div>
          </div>

          <div className="mt-3 flex flex-col gap-3">
            {cards.length === 0 ? (
              <EmptyState
                title="No research cards yet"
                description="Create a card to start generating Brom prompts."
              />
            ) : (
              cards.map((card) => (
                <button
                  key={card.id}
                  onClick={() => setSelectedId(card.id)}
                  className={`w-full rounded-xl border p-3 text-left transition-all ${
                    selectedId === card.id
                      ? "border-primary/40 bg-primary/10"
                      : "border-border bg-surface hover:border-primary/20"
                  }`}
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-text line-clamp-2">{card.title}</div>
                    <span className="rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[10px] font-bold text-muted">
                      {new Date(card.updatedAt || card.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <div className="mt-1 text-[11px] text-muted line-clamp-2">
                    {card.question || card.background || "No details yet"}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-border bg-surface-muted/60 p-5 shadow-sm">
          {!selectedCard ? (
            <div className="rounded-xl border border-dashed border-border bg-surface px-4 py-6 text-sm text-muted">
              Select a card on the left (or create a new one).
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted/80">Editor</div>
                  <div className="mt-1 text-lg font-bold text-text">{selectedCard.title}</div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button onClick={saveCard} className="btn-primary">Save</button>
                  <button
                    onClick={deleteCard}
                    className="inline-flex items-center justify-center rounded-xl border border-danger/20 bg-danger/10 px-4 py-2 text-sm font-bold text-danger shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:bg-danger/15 active:translate-y-0 active:scale-95"
                  >
                    Delete
                  </button>
                </div>
              </div>

              <label className="text-xs font-semibold text-muted">
                Title
                <input
                  value={draft.title}
                  onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                  className="input-base mt-1"
                />
              </label>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <label className="text-xs font-semibold text-muted">
                  Background / Context
                  <textarea
                    rows={6}
                    value={draft.background}
                    onChange={(e) => setDraft((p) => ({ ...p, background: e.target.value }))}
                    className="input-base mt-1"
                  />
                </label>

                <label className="text-xs font-semibold text-muted">
                  Research question
                  <textarea
                    rows={6}
                    value={draft.question}
                    onChange={(e) => setDraft((p) => ({ ...p, question: e.target.value }))}
                    className="input-base mt-1"
                  />
                </label>
              </div>

              <label className="text-xs font-semibold text-muted">
                Constraints
                <textarea
                  rows={3}
                  value={draft.constraints}
                  onChange={(e) => setDraft((p) => ({ ...p, constraints: e.target.value }))}
                  className="input-base mt-1"
                />
              </label>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted/80">Brom prompt</div>
                      <div className="mt-1 text-sm font-semibold text-text">Generate → Copy → Run</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={generatePrompt} className="btn-secondary">Generate</button>
                      <button onClick={copyPrompt} className="btn-secondary" disabled={!draft.prompt.trim()}>
                        Copy
                      </button>
                    </div>
                  </div>

                  <textarea
                    rows={12}
                    value={draft.prompt}
                    onChange={(e) => setDraft((p) => ({ ...p, prompt: e.target.value }))}
                    className="mt-3 w-full rounded-xl border border-border bg-surface px-4 py-3 font-mono text-xs text-text shadow-sm focus:border-primary focus:outline-none"
                  />
                </div>

                <div className="rounded-2xl border border-border bg-surface p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted/80">JSON Schema</div>
                      <div className="mt-1 text-sm font-semibold text-text">What the output must match</div>
                    </div>
                    <button onClick={() => setDraft((p) => ({ ...p, outputSchema: DEFAULT_SCHEMA }))} className="btn-ghost">
                      Reset
                    </button>
                  </div>

                  <textarea
                    rows={12}
                    value={draft.outputSchema}
                    onChange={(e) => setDraft((p) => ({ ...p, outputSchema: e.target.value }))}
                    className="mt-3 w-full rounded-xl border border-border bg-surface px-4 py-3 font-mono text-xs text-text shadow-sm focus:border-primary focus:outline-none"
                  />
                </div>
              </div>

              <div className="rounded-2xl border border-border bg-surface p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted/80">Result JSON</div>
                    <div className="mt-1 text-sm font-semibold text-text">Paste the model output (must be JSON)</div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button onClick={validateResult} className="btn-secondary">Validate</button>
                    {validation.status === "ok" && (
                      <span className="rounded-full border border-success/20 bg-success/10 px-3 py-1 text-[11px] font-bold text-success">OK</span>
                    )}
                    {validation.status === "error" && (
                      <span className="rounded-full border border-danger/20 bg-danger/10 px-3 py-1 text-[11px] font-bold text-danger">Invalid</span>
                    )}
                  </div>
                </div>

                <textarea
                  rows={12}
                  value={draft.result}
                  onChange={(e) => setDraft((p) => ({ ...p, result: e.target.value }))}
                  className="mt-3 w-full rounded-xl border border-border bg-surface px-4 py-3 font-mono text-xs text-text shadow-sm focus:border-primary focus:outline-none"
                />

                {validation.status === "ok" && (
                  <div className="mt-3 rounded-xl border border-success/20 bg-success/10 px-4 py-3 text-sm text-success">
                    {validation.message}
                  </div>
                )}

                {validation.status === "error" && (
                  <div className="mt-3 rounded-xl border border-danger/20 bg-danger/10 px-4 py-3 text-sm text-danger">
                    <div className="font-semibold">{validation.message}</div>
                    {validation.details && (
                      <pre className="mt-2 whitespace-pre-wrap text-xs text-danger/90">{validation.details}</pre>
                    )}
                  </div>
                )}

                <div className="mt-3 text-[11px] text-muted">
                  Tip: The Brom prompt forces “JSON only” so you can paste the output directly and validate.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
