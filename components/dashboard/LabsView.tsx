"use client";

import React, { useEffect, useMemo, useState } from "react";
import type {
  LabAnswerValue,
  LabAssetRequest,
  LabFramework,
  LabQuestion,
  LabQuestionType,
  LabResearchPrompt,
  LabSession
} from "@/lib/types";
import { useToast } from "@/components/ui/ToastProvider";
import EmptyState from "@/components/ui/EmptyState";

type FrameworkDraft = {
  title: string;
  goal: string;
  context: string;
  screenType: string;
  outputFormat: string;
  outputLength: string;
  aiTemplate: string;
  questions: LabQuestion[];
  assetRequests: LabAssetRequest[];
};

type QuestionDraft = {
  label: string;
  type: LabQuestionType;
  required: boolean;
  helper: string;
  options: string;
};

type AssetDraft = {
  label: string;
  type: LabAssetRequest["type"];
  required: boolean;
  notes: string;
};

type SessionDraft = {
  title: string;
  notes: string;
  answers: Record<string, LabAnswerValue>;
};

type ResearchDraft = {
  title: string;
  objective: string;
  outputFormat: string;
  outputLength: string;
  constraints: string;
  prompt: string;
  response: string;
};

const QUESTION_TYPES: LabQuestionType[] = [
  "short",
  "long",
  "single",
  "multi",
  "scale",
  "tinder"
];

const ASSET_TYPES: LabAssetRequest["type"][] = [
  "image",
  "icon",
  "video",
  "copy",
  "data",
  "other"
];

const OUTPUT_FORMATS = ["Bullet list", "Narrative", "Table", "Checklist", "Spec"];
const OUTPUT_LENGTHS = ["Short", "Medium", "Long", "Custom"];

const DEFAULT_AI_TEMPLATE = `{
  "screen": "Name the screen or flow",
  "purpose": "Why this screen exists",
  "audience": "Who uses it",
  "layout": {
    "structure": "grid, split, list, canvas",
    "density": "low | medium | high"
  },
  "sections": [
    { "name": "Hero", "type": "header", "content": "..." },
    { "name": "Body", "type": "content", "content": "..." }
  ],
  "data": {
    "entities": [],
    "fields": [],
    "sample": {}
  },
  "interactions": {
    "primary": "Primary action",
    "secondary": "Secondary action",
    "empty_state": "What to show when empty",
    "loading_state": "Skeleton guidance"
  },
  "metrics": ["What success looks like"],
  "notes": "Constraints, tone, special rules"
}`;

function createId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...options });
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(payload?.error || `Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

const emptyFrameworkDraft: FrameworkDraft = {
  title: "",
  goal: "",
  context: "",
  screenType: "",
  outputFormat: OUTPUT_FORMATS[0],
  outputLength: OUTPUT_LENGTHS[1],
  aiTemplate: DEFAULT_AI_TEMPLATE,
  questions: [],
  assetRequests: []
};

const emptyQuestionDraft: QuestionDraft = {
  label: "",
  type: "short",
  required: true,
  helper: "",
  options: ""
};

const emptyAssetDraft: AssetDraft = {
  label: "",
  type: "image",
  required: true,
  notes: ""
};

const emptyResearchDraft: ResearchDraft = {
  title: "",
  objective: "",
  outputFormat: OUTPUT_FORMATS[0],
  outputLength: OUTPUT_LENGTHS[1],
  constraints: "",
  prompt: "",
  response: ""
};

export default function LabsView() {
  const toast = useToast();
  const [frameworks, setFrameworks] = useState<LabFramework[]>([]);
  const [sessions, setSessions] = useState<LabSession[]>([]);
  const [prompts, setPrompts] = useState<LabResearchPrompt[]>([]);
  const [selectedFrameworkId, setSelectedFrameworkId] = useState<string | null>(null);
  const [editingFrameworkId, setEditingFrameworkId] = useState<string | null>(null);
  const [frameworkDraft, setFrameworkDraft] = useState<FrameworkDraft>(emptyFrameworkDraft);
  const [questionDraft, setQuestionDraft] = useState<QuestionDraft>(emptyQuestionDraft);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [assetDraft, setAssetDraft] = useState<AssetDraft>(emptyAssetDraft);
  const [editingAssetId, setEditingAssetId] = useState<string | null>(null);
  const [sessionDraft, setSessionDraft] = useState<SessionDraft>({
    title: "",
    notes: "",
    answers: {}
  });
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [researchDraft, setResearchDraft] = useState<ResearchDraft>(emptyResearchDraft);
  const [showResearch, setShowResearch] = useState(false);
  const [dragQuestionId, setDragQuestionId] = useState<string | null>(null);
  const [dragOverQuestionId, setDragOverQuestionId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"run" | "build">("run");

  const selectedFramework = useMemo(
    () => frameworks.find((item) => item.id === selectedFrameworkId) || null,
    [frameworks, selectedFrameworkId]
  );

  const dataPoints = useMemo(
    () =>
      sessions.reduce(
        (sum, session) => sum + Object.keys(session.answers || {}).length,
        0
      ),
    [sessions]
  );

  useEffect(() => {
    const load = async () => {
      try {
        const [frameworkData, sessionData, promptData] = await Promise.all([
          fetchJson<LabFramework[]>("/api/labs/frameworks"),
          fetchJson<LabSession[]>("/api/labs/sessions"),
          fetchJson<LabResearchPrompt[]>("/api/labs/prompts")
        ]);
        setFrameworks(frameworkData);
        setSessions(sessionData);
        setPrompts(promptData);
        if (!selectedFrameworkId && frameworkData[0]) {
          selectFramework(frameworkData[0]);
        }
      } catch (error) {
        toast.error("Labs failed to load", "Check the console or reload.");
      }
    };
    load();
  }, []);

  useEffect(() => {
    if (!selectedFramework) return;
    setSessionDraft({
      title: `${selectedFramework.title} Session`,
      notes: "",
      answers: {}
    });
    setActiveQuestionIndex(0);
  }, [selectedFrameworkId]);

  const resetFrameworkDraft = () => {
    setEditingFrameworkId(null);
    setFrameworkDraft({
      ...emptyFrameworkDraft,
      aiTemplate: frameworkDraft.aiTemplate || DEFAULT_AI_TEMPLATE
    });
    setQuestionDraft(emptyQuestionDraft);
    setEditingQuestionId(null);
    setAssetDraft(emptyAssetDraft);
    setEditingAssetId(null);
  };

  const selectFramework = (framework: LabFramework) => {
    setSelectedFrameworkId(framework.id);
    setEditingFrameworkId(framework.id);
    setFrameworkDraft({
      title: framework.title,
      goal: framework.goal,
      context: framework.context,
      screenType: framework.screenType,
      outputFormat: framework.outputFormat || OUTPUT_FORMATS[0],
      outputLength: framework.outputLength || OUTPUT_LENGTHS[1],
      aiTemplate: framework.aiTemplate || DEFAULT_AI_TEMPLATE,
      questions: framework.questions || [],
      assetRequests: framework.assetRequests || []
    });
    setQuestionDraft(emptyQuestionDraft);
    setEditingQuestionId(null);
    setAssetDraft(emptyAssetDraft);
    setEditingAssetId(null);
  };

  const saveFramework = async () => {
    const payload = {
      title: frameworkDraft.title.trim(),
      goal: frameworkDraft.goal,
      context: frameworkDraft.context,
      screenType: frameworkDraft.screenType,
      outputFormat: frameworkDraft.outputFormat,
      outputLength: frameworkDraft.outputLength,
      aiTemplate: frameworkDraft.aiTemplate,
      questions: frameworkDraft.questions,
      assetRequests: frameworkDraft.assetRequests
    };
    if (!payload.title) {
      toast.error("Title required", "Name the framework.");
      return;
    }

    try {
      if (editingFrameworkId) {
        const updated = await fetchJson<LabFramework>(
          `/api/labs/frameworks/${editingFrameworkId}`,
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          }
        );
        setFrameworks((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        toast.success("Framework updated", updated.title);
      } else {
        const created = await fetchJson<LabFramework>("/api/labs/frameworks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        setFrameworks((prev) => [created, ...prev]);
        selectFramework(created);
        toast.success("Framework created", created.title);
      }
    } catch (error: any) {
      toast.error("Save failed", error.message || "Try again.");
    }
  };

  const deleteFramework = async (id: string) => {
    try {
      await fetchJson(`/api/labs/frameworks/${id}`, { method: "DELETE" });
      setFrameworks((prev) => prev.filter((item) => item.id !== id));
      if (selectedFrameworkId === id) {
        setSelectedFrameworkId(null);
        resetFrameworkDraft();
      }
      toast.success("Framework deleted");
    } catch (error: any) {
      toast.error("Delete failed", error.message || "Try again.");
    }
  };

  const parseOptions = (raw: string) =>
    raw
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);

  const addOrUpdateQuestion = () => {
    if (!questionDraft.label.trim()) {
      toast.error("Question needed", "Add a prompt.");
      return;
    }
    const options = ["single", "multi", "tinder"].includes(questionDraft.type)
      ? parseOptions(questionDraft.options)
      : [];
    const nextQuestion: LabQuestion = {
      id: editingQuestionId || createId(),
      label: questionDraft.label.trim(),
      type: questionDraft.type,
      required: questionDraft.required,
      helper: questionDraft.helper.trim(),
      options
    };

    setFrameworkDraft((prev) => {
      const questions = editingQuestionId
        ? prev.questions.map((q) => (q.id === editingQuestionId ? nextQuestion : q))
        : [...prev.questions, nextQuestion];
      return { ...prev, questions };
    });
    setQuestionDraft(emptyQuestionDraft);
    setEditingQuestionId(null);
  };

  const editQuestion = (question: LabQuestion) => {
    setEditingQuestionId(question.id);
    setQuestionDraft({
      label: question.label,
      type: question.type,
      required: question.required,
      helper: question.helper || "",
      options: (question.options || []).join("\n")
    });
  };

  const removeQuestion = (id: string) => {
    setFrameworkDraft((prev) => ({
      ...prev,
      questions: prev.questions.filter((q) => q.id !== id)
    }));
    if (editingQuestionId === id) {
      setEditingQuestionId(null);
      setQuestionDraft(emptyQuestionDraft);
    }
  };

  const reorderQuestions = (fromId: string, toId: string) => {
    if (fromId === toId) return;
    setFrameworkDraft((prev) => {
      const list = [...prev.questions];
      const fromIndex = list.findIndex((q) => q.id === fromId);
      const toIndex = list.findIndex((q) => q.id === toId);
      if (fromIndex === -1 || toIndex === -1) return prev;
      const [moved] = list.splice(fromIndex, 1);
      list.splice(toIndex, 0, moved);
      return { ...prev, questions: list };
    });
  };

  const addOrUpdateAsset = () => {
    if (!assetDraft.label.trim()) {
      toast.error("Asset label needed", "Name the asset.");
      return;
    }
    const nextAsset: LabAssetRequest = {
      id: editingAssetId || createId(),
      label: assetDraft.label.trim(),
      type: assetDraft.type,
      required: assetDraft.required,
      notes: assetDraft.notes.trim()
    };
    setFrameworkDraft((prev) => {
      const assetRequests = editingAssetId
        ? prev.assetRequests.map((asset) =>
            asset.id === editingAssetId ? nextAsset : asset
          )
        : [...prev.assetRequests, nextAsset];
      return { ...prev, assetRequests };
    });
    setAssetDraft(emptyAssetDraft);
    setEditingAssetId(null);
  };

  const editAsset = (asset: LabAssetRequest) => {
    setEditingAssetId(asset.id);
    setAssetDraft({
      label: asset.label,
      type: asset.type,
      required: asset.required ?? true,
      notes: asset.notes || ""
    });
  };

  const removeAsset = (id: string) => {
    setFrameworkDraft((prev) => ({
      ...prev,
      assetRequests: prev.assetRequests.filter((asset) => asset.id !== id)
    }));
    if (editingAssetId === id) {
      setEditingAssetId(null);
      setAssetDraft(emptyAssetDraft);
    }
  };

  const updateAnswer = (questionId: string, value: LabAnswerValue) => {
    setSessionDraft((prev) => ({
      ...prev,
      answers: {
        ...prev.answers,
        [questionId]: value
      }
    }));
  };

  const toggleMultiAnswer = (questionId: string, option: string) => {
    const existing = sessionDraft.answers[questionId];
    const current = Array.isArray(existing) ? existing : [];
    const next = current.includes(option)
      ? current.filter((item) => item !== option)
      : [...current, option];
    updateAnswer(questionId, next);
  };

  const activeQuestion = selectedFramework?.questions[activeQuestionIndex];
  const totalQuestions = selectedFramework?.questions.length || 0;
  const progress =
    totalQuestions > 0 ? ((activeQuestionIndex + 1) / totalQuestions) * 100 : 0;

  const saveSession = async () => {
    if (!selectedFramework) {
      toast.error("Select a framework", "Choose a lab framework first.");
      return;
    }
    try {
      const created = await fetchJson<LabSession>("/api/labs/sessions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frameworkId: selectedFramework.id,
          title: sessionDraft.title,
          notes: sessionDraft.notes,
          answers: sessionDraft.answers
        })
      });
      setSessions((prev) => [created, ...prev]);
      toast.success("Session saved", "Data points captured.");
      setSessionDraft((prev) => ({ ...prev, notes: "", answers: {} }));
      setActiveQuestionIndex(0);
    } catch (error: any) {
      toast.error("Session failed", error.message || "Try again.");
    }
  };

  const generatePrompt = () => {
    const lines = [
      "ROLE: You are a deep research agent operating in a long-running swarm.",
      `GOAL: ${researchDraft.objective || "Define the research goal."}`,
      `OUTPUT FORMAT: ${researchDraft.outputFormat || "Structured report"}`,
      `LENGTH: ${researchDraft.outputLength || "Medium (800-1200 words)"}`,
      researchDraft.constraints ? `CONSTRAINTS: ${researchDraft.constraints}` : null,
      "RESPONSE STRUCTURE:",
      "1) Executive summary (3-5 bullets)",
      "2) Key findings (numbered list)",
      "3) Evidence + sources (cite at least 5)",
      "4) Risks / Unknowns",
      "5) Suggested next actions"
    ].filter(Boolean);

    setResearchDraft((prev) => ({
      ...prev,
      prompt: lines.join("\n")
    }));
  };

  const savePrompt = async () => {
    if (!researchDraft.title.trim()) {
      toast.error("Title required", "Name the research request.");
      return;
    }
    try {
      const created = await fetchJson<LabResearchPrompt>("/api/labs/prompts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: researchDraft.title,
          objective: researchDraft.objective,
          outputFormat: researchDraft.outputFormat,
          outputLength: researchDraft.outputLength,
          prompt: researchDraft.prompt,
          response: researchDraft.response
        })
      });
      setPrompts((prev) => [created, ...prev]);
      toast.success("Prompt saved", "Research brief captured.");
      setResearchDraft(emptyResearchDraft);
    } catch (error: any) {
      toast.error("Save failed", error.message || "Try again.");
    }
  };

  const copyText = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success("Copied", label);
    } catch {
      toast.error("Copy failed", "Select and copy manually.");
    }
  };

  const frameworkBlueprint = selectedFramework
    ? JSON.stringify(
        {
          id: selectedFramework.id,
          title: selectedFramework.title,
          goal: selectedFramework.goal,
          context: selectedFramework.context,
          screenType: selectedFramework.screenType,
          output: {
            format: selectedFramework.outputFormat,
            length: selectedFramework.outputLength
          },
          questions: selectedFramework.questions,
          assetRequests: selectedFramework.assetRequests
        },
        null,
        2
      )
    : "";

  return (
    <section id="labs-section" className="view-shell view-labs reveal rounded-[2.25rem] border border-border bg-surface p-6 shadow-2xl shadow-black/5 dark:shadow-black/20">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-black uppercase tracking-[0.2em] text-primary/80">
            Human Intelligence Lab
          </p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-text">
            {viewMode === "run" ? "Run Session" : "Framework Studio"}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            {viewMode === "run"
              ? "Schritt-für-Schritt Fragen beantworten (Typeform/Tinder Style)."
              : "Frameworks bauen, Fragen definieren, Signals sammeln."}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex overflow-hidden rounded-full border border-border bg-surface-muted">
            <button
              type="button"
              onClick={() => setViewMode("run")}
              className={`px-3 py-1 text-xs font-bold transition-colors ${
                viewMode === "run"
                  ? "bg-primary/15 text-primary"
                  : "text-muted hover:text-text"
              }`}
            >
              Run
            </button>
            <button
              type="button"
              onClick={() => setViewMode("build")}
              className={`px-3 py-1 text-xs font-bold transition-colors ${
                viewMode === "build"
                  ? "bg-primary/15 text-primary"
                  : "text-muted hover:text-text"
              }`}
            >
              Build
            </button>
          </div>

          <div className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-bold text-muted">
            {frameworks.length} frameworks
          </div>
          <div className="rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-bold text-muted">
            {sessions.length} sessions
          </div>
          <div className="rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-bold text-primary">
            {dataPoints} data points
          </div>
        </div>
      </div>

      <div
        className={`grid grid-cols-1 gap-6 ${
          viewMode === "run"
            ? "xl:grid-cols-[340px_1fr]"
            : "xl:grid-cols-[340px_1fr_340px]"
        }`}
      >
        <div className="flex flex-col gap-6">
          {viewMode === "build" && (
            <div className="lab-grid rounded-2xl border border-border bg-surface-muted/60 p-5 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted/80">
                  Framework Studio
                </div>
                <div className="mt-1 text-lg font-bold text-text">Define the shape</div>
              </div>
              <button
                onClick={resetFrameworkDraft}
                className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-semibold text-muted hover:text-text"
              >
                New
              </button>
            </div>

            <div className="mt-4 flex flex-col gap-3">
              <label className="text-xs font-semibold text-muted">
                Title
                <input
                  value={frameworkDraft.title}
                  onChange={(e) =>
                    setFrameworkDraft((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="input-base mt-1"
                  placeholder="e.g. Mobile Onboarding Redesign"
                />
              </label>
              <label className="text-xs font-semibold text-muted">
                Goal
                <textarea
                  rows={2}
                  value={frameworkDraft.goal}
                  onChange={(e) =>
                    setFrameworkDraft((prev) => ({ ...prev, goal: e.target.value }))
                  }
                  className="input-base mt-1"
                  placeholder="What should the agent achieve?"
                />
              </label>
              <label className="text-xs font-semibold text-muted">
                Screen / Context
                <input
                  value={frameworkDraft.context}
                  onChange={(e) =>
                    setFrameworkDraft((prev) => ({ ...prev, context: e.target.value }))
                  }
                  className="input-base mt-1"
                  placeholder="e.g. Pricing page for SaaS"
                />
              </label>
              <label className="text-xs font-semibold text-muted">
                Screen type
                <input
                  value={frameworkDraft.screenType}
                  onChange={(e) =>
                    setFrameworkDraft((prev) => ({ ...prev, screenType: e.target.value }))
                  }
                  className="input-base mt-1"
                  placeholder="Landing, dashboard, modal, form"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-muted">
                  Output format
                  <select
                    value={frameworkDraft.outputFormat}
                    onChange={(e) =>
                      setFrameworkDraft((prev) => ({
                        ...prev,
                        outputFormat: e.target.value
                      }))
                    }
                    className="input-base mt-1"
                  >
                    {OUTPUT_FORMATS.map((format) => (
                      <option key={format} value={format}>
                        {format}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs font-semibold text-muted">
                  Output length
                  <select
                    value={frameworkDraft.outputLength}
                    onChange={(e) =>
                      setFrameworkDraft((prev) => ({
                        ...prev,
                        outputLength: e.target.value
                      }))
                    }
                    className="input-base mt-1"
                  >
                    {OUTPUT_LENGTHS.map((length) => (
                      <option key={length} value={length}>
                        {length}
                      </option>
                    ))}
                  </select>
                </label>
              </div>

              <button onClick={saveFramework} className="btn-primary w-full">
                {editingFrameworkId ? "Update framework" : "Create framework"}
              </button>
            </div>
          </div>
          )}

          <div className="rounded-2xl border border-border bg-surface-muted/60 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted/80">
                Framework Library
              </div>
              <div className="text-[11px] text-muted">{frameworks.length} total</div>
            </div>
            <div className="mt-3 flex flex-col gap-3">
              {frameworks.length === 0 ? (
                <EmptyState
                  title="No frameworks yet"
                  description="Create your first lab framework to start."
                />
              ) : (
                frameworks.map((framework) => (
                  <button
                    key={framework.id}
                    onClick={() => selectFramework(framework)}
                    className={`w-full rounded-xl border p-3 text-left transition-all ${
                      selectedFrameworkId === framework.id
                        ? "border-primary/40 bg-primary/10"
                        : "border-border bg-surface hover:border-primary/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-semibold text-text">{framework.title}</div>
                      <span className="rounded-full border border-border bg-surface-muted px-2 py-0.5 text-[10px] font-bold text-muted">
                        {framework.questions.length} Q
                      </span>
                    </div>
                    <div className="mt-1 text-[11px] text-muted line-clamp-2">
                      {framework.goal || "No goal yet"}
                    </div>
                    <div className="mt-3 flex gap-2">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteFramework(framework.id);
                        }}
                        className="rounded-full border border-danger/20 bg-danger/10 px-2 py-0.5 text-[10px] font-bold text-danger"
                      >
                        Delete
                      </button>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface-muted/60 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted/80">
                Session Log
              </div>
              <div className="text-[11px] text-muted">{sessions.length} total</div>
            </div>
            <div className="mt-3 flex flex-col gap-3">
              {sessions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-surface px-4 py-3 text-xs text-muted">
                  No sessions yet. Run one to capture data.
                </div>
              ) : (
                sessions.slice(0, 4).map((session) => (
                  <div
                    key={session.id}
                    className="rounded-xl border border-border bg-surface px-4 py-3"
                  >
                    <div className="text-sm font-semibold text-text">{session.title}</div>
                    <div className="mt-1 text-[11px] text-muted">
                      {Object.keys(session.answers || {}).length} answers ·{" "}
                      {new Date(session.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-col gap-6">
          {viewMode === "build" && (
            <div className="rounded-2xl border border-border bg-surface-muted/60 p-5 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted/80">
                    Question Builder
                  </div>
                <div className="mt-1 text-lg font-bold text-text">Typeform-ready prompts</div>
              </div>
              <div className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-semibold text-muted">
                {frameworkDraft.questions.length} questions
              </div>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-[1fr_140px]">
              <label className="text-xs font-semibold text-muted">
                Prompt
                <input
                  value={questionDraft.label}
                  onChange={(e) =>
                    setQuestionDraft((prev) => ({ ...prev, label: e.target.value }))
                  }
                  className="input-base mt-1"
                  placeholder="Ask the human something specific..."
                />
              </label>
              <label className="text-xs font-semibold text-muted">
                Type
                <select
                  value={questionDraft.type}
                  onChange={(e) =>
                    setQuestionDraft((prev) => ({
                      ...prev,
                      type: e.target.value as LabQuestionType
                    }))
                  }
                  className="input-base mt-1"
                >
                  {QUESTION_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {["single", "multi", "tinder"].includes(questionDraft.type) && (
              <label className="mt-3 block text-xs font-semibold text-muted">
                Options (one per line)
                <textarea
                  rows={2}
                  value={questionDraft.options}
                  onChange={(e) =>
                    setQuestionDraft((prev) => ({ ...prev, options: e.target.value }))
                  }
                  className="input-base mt-1"
                  placeholder="Option A\nOption B"
                />
              </label>
            )}

            <div className="mt-3 flex flex-wrap items-center gap-3">
              <label className="flex items-center gap-2 text-xs font-semibold text-muted">
                <input
                  type="checkbox"
                  checked={questionDraft.required}
                  onChange={(e) =>
                    setQuestionDraft((prev) => ({ ...prev, required: e.target.checked }))
                  }
                  className="rounded border-border text-primary focus:ring-primary"
                />
                Required
              </label>
              <input
                value={questionDraft.helper}
                onChange={(e) =>
                  setQuestionDraft((prev) => ({ ...prev, helper: e.target.value }))
                }
                className="input-base flex-1"
                placeholder="Helper text (optional)"
              />
              <button onClick={addOrUpdateQuestion} className="btn-secondary">
                {editingQuestionId ? "Update" : "Add"}
              </button>
            </div>
            <div className="mt-2 text-[11px] text-muted">
              Drag cards below to reorder the flow.
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              {frameworkDraft.questions.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-surface px-4 py-4 text-xs text-muted">
                  Add your first question to make the flow interactive.
                </div>
              ) : (
                frameworkDraft.questions.map((question) => (
                  <div
                    key={question.id}
                    draggable
                    onDragStart={() => setDragQuestionId(question.id)}
                    onDragEnd={() => {
                      setDragQuestionId(null);
                      setDragOverQuestionId(null);
                    }}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setDragOverQuestionId(question.id);
                    }}
                    onDrop={(e) => {
                      e.preventDefault();
                      if (dragQuestionId) {
                        reorderQuestions(dragQuestionId, question.id);
                      }
                      setDragOverQuestionId(null);
                    }}
                    className={`flex flex-wrap items-center justify-between gap-2 rounded-xl border px-4 py-3 transition-all ${
                      dragOverQuestionId === question.id
                        ? "border-primary/40 bg-primary/10"
                        : "border-border bg-surface"
                    }`}
                  >
                    <div>
                      <div className="text-sm font-semibold text-text">
                        {question.label}
                      </div>
                      <div className="text-[11px] text-muted">
                        {question.type}
                        {question.required ? " · required" : ""}
                      </div>
                      <div className="mt-1 text-[10px] text-muted/70">
                        Drag to reorder
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => editQuestion(question)}
                        className="rounded-full border border-border bg-surface-muted px-3 py-1 text-[10px] font-bold text-muted hover:text-text"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => removeQuestion(question.id)}
                        className="rounded-full border border-danger/20 bg-danger/10 px-3 py-1 text-[10px] font-bold text-danger"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          )}

          <div className="rounded-2xl border border-border bg-surface-muted/60 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted/80">
                  Human Session
                </div>
                <div className="mt-1 text-lg font-bold text-text">
                  Typeform + mini Tinder
                </div>
              </div>
              <div className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-semibold text-muted">
                {activeQuestionIndex + 1}/{Math.max(totalQuestions, 1)}
              </div>
            </div>

            {!selectedFramework ? (
              <div className="mt-4 rounded-xl border border-dashed border-border bg-surface px-4 py-6 text-sm text-muted">
                Select a framework to run a session.
              </div>
            ) : totalQuestions === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-border bg-surface px-4 py-6 text-sm text-muted">
                Add questions to make this session interactive.
              </div>
            ) : (
              <div className="mt-4 rounded-2xl border border-border bg-surface p-5">
                <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface-muted">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-primary/40 transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                {activeQuestion && (
                  <>
                    <div className="text-lg font-semibold text-text">
                      {activeQuestion.label}
                    </div>
                    {activeQuestion.helper && (
                      <div className="mt-1 text-xs text-muted">
                        {activeQuestion.helper}
                      </div>
                    )}

                    <div className="mt-4">
                      {activeQuestion.type === "short" && (
                        <input
                          value={(sessionDraft.answers[activeQuestion.id] as string) || ""}
                          onChange={(e) =>
                            updateAnswer(activeQuestion.id, e.target.value)
                          }
                          className="input-base"
                          placeholder="Short answer"
                        />
                      )}
                      {activeQuestion.type === "long" && (
                        <textarea
                          rows={4}
                          value={(sessionDraft.answers[activeQuestion.id] as string) || ""}
                          onChange={(e) =>
                            updateAnswer(activeQuestion.id, e.target.value)
                          }
                          className="input-base"
                          placeholder="Long answer"
                        />
                      )}
                      {activeQuestion.type === "single" && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {(activeQuestion.options || []).map((option) => (
                            <button
                              key={option}
                              type="button"
                              onClick={() => updateAnswer(activeQuestion.id, option)}
                              className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                                sessionDraft.answers[activeQuestion.id] === option
                                  ? "border-primary/40 bg-primary/10 text-primary"
                                  : "border-border bg-surface text-text"
                              }`}
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      )}
                      {activeQuestion.type === "multi" && (
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {(activeQuestion.options || []).map((option) => {
                            const current = sessionDraft.answers[activeQuestion.id];
                            const selected = Array.isArray(current)
                              ? current.includes(option)
                              : false;
                            return (
                              <button
                                key={option}
                                type="button"
                                onClick={() => toggleMultiAnswer(activeQuestion.id, option)}
                                className={`rounded-xl border px-3 py-2 text-sm font-semibold ${
                                  selected
                                    ? "border-primary/40 bg-primary/10 text-primary"
                                    : "border-border bg-surface text-text"
                                }`}
                              >
                                {option}
                              </button>
                            );
                          })}
                        </div>
                      )}
                      {activeQuestion.type === "scale" && (
                        <div className="flex items-center gap-4">
                          <input
                            type="range"
                            min={1}
                            max={5}
                            value={
                              (sessionDraft.answers[activeQuestion.id] as number) || 3
                            }
                            onChange={(e) =>
                              updateAnswer(activeQuestion.id, Number(e.target.value))
                            }
                            className="w-full"
                          />
                          <span className="rounded-full border border-border bg-surface px-3 py-1 text-xs font-bold text-muted">
                            {(sessionDraft.answers[activeQuestion.id] as number) || 3}
                          </span>
                        </div>
                      )}
                      {activeQuestion.type === "tinder" && (
                        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                          {(activeQuestion.options || ["Option A", "Option B"]).map(
                            (option) => (
                              <button
                                key={option}
                                type="button"
                                onClick={() => updateAnswer(activeQuestion.id, option)}
                                className={`rounded-2xl border px-4 py-4 text-sm font-semibold transition-all ${
                                  sessionDraft.answers[activeQuestion.id] === option
                                    ? "border-primary/40 bg-primary/10 text-primary"
                                    : "border-border bg-surface text-text hover:border-primary/20"
                                }`}
                              >
                                {option}
                              </button>
                            )
                          )}
                        </div>
                      )}
                    </div>

                    <div className="mt-6 flex flex-wrap items-center gap-2">
                      <button
                        onClick={() =>
                          setActiveQuestionIndex((prev) => Math.max(prev - 1, 0))
                        }
                        className="btn-ghost"
                        disabled={activeQuestionIndex === 0}
                      >
                        Back
                      </button>
                      <button
                        onClick={() =>
                          setActiveQuestionIndex((prev) =>
                            Math.min(prev + 1, totalQuestions - 1)
                          )
                        }
                        className="btn-secondary"
                        disabled={activeQuestionIndex >= totalQuestions - 1}
                      >
                        Next
                      </button>
                      <div className="flex-1" />
                      <button onClick={saveSession} className="btn-primary">
                        Save session
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            <div className="mt-4">
              <textarea
                rows={2}
                value={sessionDraft.notes}
                onChange={(e) =>
                  setSessionDraft((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="input-base"
                placeholder="Session notes or edge cases"
              />
            </div>
          </div>
        </div>

        {viewMode === "build" && (
          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-border bg-surface-muted/60 p-5 shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted/80">
                  AI Template
                </div>
                <div className="mt-1 text-lg font-bold text-text">
                  Instant blueprint for agents
                </div>
              </div>
              <button
                onClick={() =>
                  setFrameworkDraft((prev) => ({ ...prev, aiTemplate: DEFAULT_AI_TEMPLATE }))
                }
                className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-semibold text-muted hover:text-text"
              >
                Insert default
              </button>
            </div>

            <textarea
              rows={10}
              value={frameworkDraft.aiTemplate}
              onChange={(e) =>
                setFrameworkDraft((prev) => ({ ...prev, aiTemplate: e.target.value }))
              }
              className="mt-4 w-full rounded-xl border border-border bg-surface px-4 py-3 font-mono text-xs text-text shadow-sm focus:border-primary focus:outline-none"
            />
            <div className="mt-3 flex flex-wrap gap-2">
              <button
                onClick={() => copyText(frameworkDraft.aiTemplate, "Template copied")}
                className="btn-secondary"
              >
                Copy template
              </button>
              {frameworkBlueprint && (
                <button
                  onClick={() => copyText(frameworkBlueprint, "Framework JSON copied")}
                  className="btn-secondary"
                >
                  Copy framework JSON
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface-muted/60 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted/80">
                Asset Requests
              </div>
              <div className="text-[11px] text-muted">
                {frameworkDraft.assetRequests.length} assets
              </div>
            </div>
            <p className="mt-2 text-[11px] text-muted">
              Uploads are tracked by filename so the agent knows what to request.
            </p>
            <div className="mt-3 grid grid-cols-1 gap-3">
              <label className="text-xs font-semibold text-muted">
                Asset name
                <input
                  value={assetDraft.label}
                  onChange={(e) =>
                    setAssetDraft((prev) => ({ ...prev, label: e.target.value }))
                  }
                  className="input-base mt-1"
                  placeholder="e.g. Hero illustration"
                />
              </label>
              <div className="grid grid-cols-2 gap-3">
                <label className="text-xs font-semibold text-muted">
                  Type
                  <select
                    value={assetDraft.type}
                    onChange={(e) =>
                      setAssetDraft((prev) => ({
                        ...prev,
                        type: e.target.value as LabAssetRequest["type"]
                      }))
                    }
                    className="input-base mt-1"
                  >
                    {ASSET_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="flex items-center gap-2 text-xs font-semibold text-muted">
                  <input
                    type="checkbox"
                    checked={assetDraft.required}
                    onChange={(e) =>
                      setAssetDraft((prev) => ({ ...prev, required: e.target.checked }))
                    }
                    className="rounded border-border text-primary focus:ring-primary"
                  />
                  Required
                </label>
              </div>
              <textarea
                rows={2}
                value={assetDraft.notes}
                onChange={(e) =>
                  setAssetDraft((prev) => ({ ...prev, notes: e.target.value }))
                }
                className="input-base"
                placeholder="Usage notes or constraints"
              />
              <button onClick={addOrUpdateAsset} className="btn-secondary">
                {editingAssetId ? "Update asset" : "Add asset"}
              </button>
            </div>

            <div className="mt-4 grid grid-cols-1 gap-3">
              {frameworkDraft.assetRequests.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-surface px-4 py-4 text-xs text-muted">
                  Define asset requirements for AI or collaborators.
                </div>
              ) : (
                frameworkDraft.assetRequests.map((asset) => (
                  <div
                    key={asset.id}
                    className="rounded-xl border border-border bg-surface px-4 py-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="text-sm font-semibold text-text">
                          {asset.label}
                        </div>
                        <div className="text-[11px] text-muted">
                          {asset.type}
                          {asset.required ? " · required" : " · optional"}
                        </div>
                        {asset.notes && (
                          <div className="mt-1 text-[11px] text-muted">
                            {asset.notes}
                          </div>
                        )}
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <label className="cursor-pointer rounded-full border border-border bg-surface-muted px-3 py-1 text-[10px] font-bold text-muted">
                          Upload
                          <input
                            type="file"
                            className="hidden"
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (!file) return;
                              setFrameworkDraft((prev) => ({
                                ...prev,
                                assetRequests: prev.assetRequests.map((current) =>
                                  current.id === asset.id
                                    ? {
                                        ...current,
                                        uploadedFileName: file.name,
                                        uploadedAt: new Date().toISOString()
                                      }
                                    : current
                                )
                              }));
                            }}
                          />
                        </label>
                        <button
                          onClick={() => editAsset(asset)}
                          className="text-[10px] font-bold text-muted hover:text-text"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => removeAsset(asset.id)}
                          className="text-[10px] font-bold text-danger"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                    {asset.uploadedFileName && (
                      <div className="mt-2 text-[10px] text-muted">
                        Uploaded: {asset.uploadedFileName}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface-muted/60 p-5 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted/80">
                  Research Prompt
                </div>
                <div className="mt-1 text-lg font-bold text-text">
                  Deep research on demand
                </div>
              </div>
              <button
                onClick={() => setShowResearch((prev) => !prev)}
                className="rounded-full border border-border bg-surface px-3 py-1 text-[11px] font-semibold text-muted hover:text-text"
              >
                {showResearch ? "Hide" : "Show"}
              </button>
            </div>

            {!showResearch ? (
              <div className="mt-4 rounded-xl border border-dashed border-border bg-surface px-4 py-4 text-xs text-muted">
                Only surface this when the agent asks for a deep research prompt.
              </div>
            ) : (
              <div className="mt-4 space-y-3">
                <label className="text-xs font-semibold text-muted">
                  Title
                  <input
                    value={researchDraft.title}
                    onChange={(e) =>
                      setResearchDraft((prev) => ({ ...prev, title: e.target.value }))
                    }
                    className="input-base mt-1"
                    placeholder="Research: Market scan"
                  />
                </label>
                <label className="text-xs font-semibold text-muted">
                  Objective
                  <textarea
                    rows={2}
                    value={researchDraft.objective}
                    onChange={(e) =>
                      setResearchDraft((prev) => ({
                        ...prev,
                        objective: e.target.value
                      }))
                    }
                    className="input-base mt-1"
                    placeholder="What should the research deliver?"
                  />
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-xs font-semibold text-muted">
                    Output format
                    <select
                      value={researchDraft.outputFormat}
                      onChange={(e) =>
                        setResearchDraft((prev) => ({
                          ...prev,
                          outputFormat: e.target.value
                        }))
                      }
                      className="input-base mt-1"
                    >
                      {OUTPUT_FORMATS.map((format) => (
                        <option key={format} value={format}>
                          {format}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="text-xs font-semibold text-muted">
                    Output length
                    <select
                      value={researchDraft.outputLength}
                      onChange={(e) =>
                        setResearchDraft((prev) => ({
                          ...prev,
                          outputLength: e.target.value
                        }))
                      }
                      className="input-base mt-1"
                    >
                      {OUTPUT_LENGTHS.map((length) => (
                        <option key={length} value={length}>
                          {length}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="text-xs font-semibold text-muted">
                  Constraints
                  <input
                    value={researchDraft.constraints}
                    onChange={(e) =>
                      setResearchDraft((prev) => ({
                        ...prev,
                        constraints: e.target.value
                      }))
                    }
                    className="input-base mt-1"
                    placeholder="Time, sources, budget, exclusions"
                  />
                </label>

                <button onClick={generatePrompt} className="btn-secondary w-full">
                  Generate prompt
                </button>

                <textarea
                  rows={6}
                  value={researchDraft.prompt}
                  onChange={(e) =>
                    setResearchDraft((prev) => ({ ...prev, prompt: e.target.value }))
                  }
                  className="mt-2 w-full rounded-xl border border-border bg-surface px-4 py-3 font-mono text-xs text-text shadow-sm focus:border-primary focus:outline-none"
                  placeholder="Generated prompt will appear here"
                />
                <button
                  onClick={() => copyText(researchDraft.prompt, "Prompt copied")}
                  className="btn-secondary w-full"
                >
                  Copy prompt
                </button>

                <textarea
                  rows={4}
                  value={researchDraft.response}
                  onChange={(e) =>
                    setResearchDraft((prev) => ({ ...prev, response: e.target.value }))
                  }
                  className="input-base"
                  placeholder="Paste research output here"
                />
                <button onClick={savePrompt} className="btn-primary w-full">
                  Save research output
                </button>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-border bg-surface-muted/60 p-4 shadow-sm">
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-muted/80">
              Recent Research
            </div>
            <div className="mt-3 grid grid-cols-1 gap-3">
              {prompts.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border bg-surface px-4 py-3 text-xs text-muted">
                  No research prompts saved yet.
                </div>
              ) : (
                prompts.slice(0, 3).map((prompt) => (
                  <div
                    key={prompt.id}
                    className="rounded-xl border border-border bg-surface px-4 py-3"
                  >
                    <div className="text-sm font-semibold text-text">{prompt.title}</div>
                    <div className="mt-1 text-[11px] text-muted line-clamp-2">
                      {prompt.objective || prompt.prompt}
                    </div>
                    <button
                      onClick={() => copyText(prompt.prompt, "Prompt copied")}
                      className="mt-2 text-[10px] font-bold text-primary"
                    >
                      Copy prompt
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
        )}
      </div>
    </section>
  );
}
