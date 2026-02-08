"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import DashboardHeader from "@/components/dashboard/DashboardHeader";
import Sidebar from "@/components/dashboard/Sidebar";
import OverviewGrid from "@/components/dashboard/overview/OverviewGrid";
import TagManager from "@/components/dashboard/TagManager";
import TagManagerModal from "@/components/dashboard/TagManagerModal";
import BoardView from "@/components/dashboard/BoardView";
import PlannerView from "@/components/dashboard/PlannerView";
import PreferencesView from "@/components/dashboard/PreferencesView";
import ExperimentsView from "@/components/dashboard/ExperimentsView";
import LabsView from "@/components/dashboard/LabsView";
import SkillsView from "@/components/dashboard/SkillsView";
import ScriptsView from "@/components/dashboard/ScriptsView";
import IntegrationsView from "@/components/dashboard/IntegrationsView";
import { OverviewSkeleton } from "@/components/ui/Skeletons";
import { useToast } from "@/components/ui/ToastProvider";

import type {
  Column,
  Experiment,
  ExperimentResult,
  ExperimentStatus,
  Level,
  Preference,
  PreferenceDecision,
  Priority,
  Script,
  Tag,
  Task,
  AgentState
} from "@/lib/types";

const levelWeight: Record<Level, number> = {
  Low: 1,
  Medium: 2,
  High: 3
};

const priorityWeight: Record<Priority, number> = {
  P0: 4,
  P1: 3,
  P2: 2,
  P3: 1
};

const heroDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric"
});

function createClientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

function formatInputDate(value?: string) {
  if (!value) return "";
  if (value.length >= 10) return value.slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`Request failed: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

type PendingMove = {
  taskId: string;
  columnId: string;
};

type Signal = {
  id: string;
  type: string;
  message: string;
  createdAt: string;
};

type ScriptDraft = {
  name: string;
  description: string;
  command: string;
  tags: string[];
  favorite: boolean;
};

type TagDraft = {
  label: string;
  color: string;
};

type PreferenceDraft = {
  prompt: string;
  leftLabel: string;
  rightLabel: string;
  tags: string[];
  notes: string;
};

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

const SIGNAL_STORAGE_KEY = "jarvis_signals_v1";
const TRACKING_STORAGE_KEY = "jarvis_tracking_enabled";
const CAPACITY_STORAGE_KEY = "jarvis_capacity_hours";
const VIEW_STORAGE_KEY = "jarvis_active_view_v1";
const SIGNAL_TTL_MS = 1000 * 60 * 60 * 48;

export default function SecondBrain() {
  // State
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [agentState, setAgentState] = useState<AgentState | null>(null);
  const [vpsStatus, setVpsStatus] = useState<{ health?: string; uptimeSec?: number } | null>(null);
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<
    "board" | "planner" | "preferences" | "experiments" | "labs" | "skills" | "scripts" | "integrations"
  >("board");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(VIEW_STORAGE_KEY);
    if (
      stored === "board" ||
      stored === "planner" ||
      stored === "preferences" ||
      stored === "experiments" ||
      stored === "labs" ||
      stored === "skills"
    ) {
      setActiveView(stored);
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(VIEW_STORAGE_KEY, activeView);
  }, [activeView]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [activeView]);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [newTaskTitles, setNewTaskTitles] = useState<Record<string, string>>({});
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTagManager, setShowTagManager] = useState(false);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const toast = useToast();
  
  // Tag Mgmt
  const [tagDraft, setTagDraft] = useState<TagDraft>({
    label: "",
    color: "#94a3b8"
  });

  // Prefs
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [preferenceDraft, setPreferenceDraft] = useState<PreferenceDraft>({
    prompt: "",
    leftLabel: "No",
    rightLabel: "Yes",
    tags: [],
    notes: ""
  });
  const [preferenceConfidence, setPreferenceConfidence] = useState(3);
  const preferenceCardRef = useRef<HTMLDivElement | null>(null);

  // Exps
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [experimentDraft, setExperimentDraft] = useState<ExperimentDraft>({
    title: "",
    hypothesis: "",
    metric: "",
    status: "Idea",
    result: "Pending",
    startDate: "",
    endDate: "",
    owner: "",
    tags: [],
    notes: ""
  });
  const [editingExperimentId, setEditingExperimentId] = useState<string | null>(null);

  // Scripts
  const [scriptDraft, setScriptDraft] = useState<ScriptDraft>({
    name: "",
    description: "",
    command: "",
    tags: [],
    favorite: false
  });
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null);
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);

  // Signals
  const [signals, setSignals] = useState<Signal[]>([]);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [weeklyCapacity, setWeeklyCapacity] = useState(24);
  const [planDrafts, setPlanDrafts] = useState<Record<string, Partial<Task>>>({});

  // Helpers
  const persistSignals = (next: Signal[]) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(SIGNAL_STORAGE_KEY, JSON.stringify(next));
  };

  const logSignal = (type: string, message: string) => {
    if (!trackingEnabled) return;
    const signal: Signal = {
      id: createClientId(),
      type,
      message,
      createdAt: new Date().toISOString()
    };
    setSignals((prev) => {
      const next = [signal, ...prev].slice(0, 60);
      persistSignals(next);
      return next;
    });
  };

  const notifySuccess = (title: string, description?: string) => {
    toast.success(title, description);
  };

  const notifyError = (title: string, description?: string) => {
    toast.error(title, description);
  };

  // Derived
  const columnsSorted = useMemo(() => [...columns].sort((a, b) => a.order - b.order), [columns]);

  const ACTIVE_PROJECT_KEY = "jarvis_active_project_v1";
  const [activeProjectId, setActiveProjectId] = useState<string>("proj_all");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(ACTIVE_PROJECT_KEY);
    if (stored) setActiveProjectId(stored);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(ACTIVE_PROJECT_KEY, activeProjectId);
  }, [activeProjectId]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matchesQuery = (task: Task) => {
      if (!query) return true;
      const haystack = `${task.title} ${task.description} ${task.notes}`.toLowerCase().trim();
      return haystack.includes(query);
    };
    const matchesTags = (task: Task) => {
      if (activeTags.length === 0) return true;
      return task.tags.some((tagId) => activeTags.includes(tagId));
    };
    const matchesProject = (task: Task) => {
      if (!activeProjectId || activeProjectId === "proj_all") return true;
      return task.projectId === activeProjectId;
    };
    return tasks
      .filter((task) => matchesProject(task) && matchesQuery(task) && matchesTags(task))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [tasks, search, activeTags, activeProjectId]);

  const tasksByColumn = useMemo(() => {
    const map: Record<string, Task[]> = {};
    for (const column of columnsSorted) {
      map[column.id] = [];
    }
    for (const task of filteredTasks) {
      if (!map[task.columnId]) {
        map[task.columnId] = [];
      }
      map[task.columnId].push(task);
    }
    return map;
  }, [columnsSorted, filteredTasks]);

  const openTaskCount = useMemo(() => {
    return tasks.filter((task) => {
      const column = columns.find((col) => col.id === task.columnId);
      return column?.key !== "done";
    }).length;
  }, [tasks, columns]);

  const doneCount = useMemo(() => {
    return tasks.filter((task) => {
      const column = columns.find((col) => col.id === task.columnId);
      return column?.key === "done";
    }).length;
  }, [tasks, columns]);

  const openTasks = useMemo(() => {
    return tasks.filter((task) => {
      const column = columns.find((col) => col.id === task.columnId);
      return column?.key !== "done";
    });
  }, [tasks, columns]);

  const plannerTasks = useMemo(() => {
    const priorityWeight: Record<Priority, number> = {
      P3: 1,
      P2: 2,
      P1: 3,
      P0: 4
    };
    return [...openTasks].sort((a, b) => {
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      if (aDue !== bDue) return aDue - bDue;
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  }, [openTasks]);

  // Effects
  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [
          columnsData,
          tasksData,
          tagsData,
          scriptsData,
          preferencesData,
          experimentsData,
          agentData,
          vpsPayload
        ] = await Promise.all([
          fetchJson<Column[]>("/api/columns"),
          fetchJson<Task[]>("/api/tasks"),
          fetchJson<Tag[]>("/api/tags"),
          fetchJson<Script[]>("/api/scripts"),
          fetchJson<Preference[]>("/api/preferences"),
          fetchJson<Experiment[]>("/api/experiments"),
          fetchJson<AgentState>("/api/agent/data"),
          fetchJson<{ ok: boolean; data?: any; error?: string }>("/api/integrations/vps/status").catch(() => ({ ok: false, data: null }))
        ]);
        setColumns(columnsData);
        setTasks(tasksData);
        setTags(tagsData);
        setScripts(scriptsData);
        setPreferences(preferencesData);
        setExperiments(experimentsData);
        setAgentState(agentData);
        if (vpsPayload?.ok && vpsPayload.data && typeof vpsPayload.data === "object") {
          const d: any = vpsPayload.data;
          setVpsStatus({ health: d.health, uptimeSec: d.uptimeSec });
        } else {
          // Missing env or transient failures shouldn't nuke the whole dashboard
          setVpsStatus(null);
        }
      } catch (err) {
        setError("Unable to load data. Please refresh the page.");
        notifyError("Unable to load data", "Please refresh the page.");
        // Keep dashboard usable even if some integrations fail
        setVpsStatus(null);
      } finally {
        setLoading(false);
      }
    };
    loadAll();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedTracking = window.localStorage.getItem(TRACKING_STORAGE_KEY);
    setTrackingEnabled(storedTracking !== "off");
    const storedCapacity = window.localStorage.getItem(CAPACITY_STORAGE_KEY);
    if (storedCapacity) {
      const parsed = Number(storedCapacity);
      if (!Number.isNaN(parsed)) {
        setWeeklyCapacity(parsed);
      }
    }
    const storedSignals = window.localStorage.getItem(SIGNAL_STORAGE_KEY);
    if (storedSignals) {
      try {
        const parsed = JSON.parse(storedSignals) as Signal[];
        const now = Date.now();
        const filtered = parsed.filter((item) => {
          const time = new Date(item.createdAt).getTime();
          return now - time <= SIGNAL_TTL_MS;
        });
        setSignals(filtered);
      } catch (err) {
        setSignals([]);
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(TRACKING_STORAGE_KEY, trackingEnabled ? "on" : "off");
  }, [trackingEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CAPACITY_STORAGE_KEY, `${weeklyCapacity}`);
  }, [weeklyCapacity]);

  // Actions
  const updateTask = async (taskId: string, patch: Partial<Task>) => {
    const previous = tasks;
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId ? { ...task, ...patch, updatedAt: new Date().toISOString() } : task
      )
    );
    try {
      await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
    } catch (err) {
      setTasks(previous);
      notifyError("Task update failed", "Reverted to the last saved state.");
    }
  };

  const createTask = async (columnId: string) => {
    const title = newTaskTitles[columnId]?.trim();
    if (!title) return;

    const tempId = `temp_${createClientId()}`;
    const now = new Date().toISOString();
    const tempTask: Task = {
      id: tempId,
      title,
      columnId,
      projectId: activeProjectId,
      priority: "P2",
      tags: [],
      description: "",
      nextAction: "",
      notes: "",
      sensitiveNotes: "",
      privateNumbers: undefined,
      checklist: [],
      definitionOfDone: [],
      links: [],
      estimateHours: undefined,
      dueDate: undefined,
      dependencies: [],
      impact: "Medium",
      effort: "Medium",
      confidence: 3,
      createdAt: now,
      updatedAt: now
    };

    setTasks((prev) => [...prev, tempTask]);
    setNewTaskTitles((prev) => ({ ...prev, [columnId]: "" }));

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, columnId, projectId: activeProjectId })
      });
      if (!response.ok) throw new Error("Failed");
      const created = (await response.json()) as Task;
      setTasks((prev) => prev.map((task) => (task.id === tempId ? created : task)));
      logSignal("task_created", `Task created: ${created.title}`);
      notifySuccess("Task created", created.title);
    } catch (err) {
      setTasks((prev) => prev.filter((task) => task.id !== tempId));
      setNewTaskTitles((prev) => ({ ...prev, [columnId]: title }));
      notifyError("Task creation failed", "Your draft is still in the input.");
    }
  };

  const toggleTagFilter = (tagId: string) => {
    setActiveTags((prev) =>
      prev.includes(tagId) ? prev.filter((id) => id !== tagId) : [...prev, tagId]
    );
  };

  const hasSubtasks = (task: Task) => {
    const dodCount = task.definitionOfDone?.length ?? 0;
    const checklistCount = task.checklist?.length ?? 0;
    return dodCount + checklistCount > 0;
  };

  const isBatchEligible = (task: Task) => {
    const lowPriority = task.priority === "P2" || task.priority === "P3";
    return !!task.swarmRequired && lowPriority && hasSubtasks(task);
  };

  const queueBatchForTask = async (task: Task) => {
    try {
      const response = await fetch("/api/agent/batch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ taskId: task.id })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error || "Batch request failed");
      }
      await updateTask(task.id, { batchJobId: payload.batchId, processingMode: "batch" });
      notifySuccess("Batch queued", `Batch ID: ${payload.batchId}`);
    } catch (err) {
      notifyError("Batch queue failed", "Reverting to realtime processing.");
      await updateTask(task.id, { processingMode: "realtime" });
    }
  };

  const setTaskSwarmRequired = async (taskId: string, value: boolean) => {
    await updateTask(taskId, { swarmRequired: value });
  };

  const setTaskProcessingMode = async (taskId: string, mode: "realtime" | "batch") => {
    const task = tasks.find((item) => item.id === taskId);
    if (!task) return;
    if (mode === "batch") {
      if (!isBatchEligible({ ...task, swarmRequired: task.swarmRequired })) {
        notifyError("Batch not eligible", "Needs subtasks, low priority, and swarm enabled.");
        return;
      }
      await updateTask(taskId, { processingMode: "batch" });
      await queueBatchForTask({ ...task, processingMode: "batch" });
      return;
    }
    await updateTask(taskId, { processingMode: "realtime", batchJobId: undefined });
  };

  const resetTagDraft = () => {
    setTagDraft({ label: "", color: "#94a3b8" });
    setEditingTagId(null);
  };

  const submitTag = async () => {
    const label = tagDraft.label.trim();
    if (!label) return;

    if (editingTagId) {
      const previous = tags;
      const patch = { label, color: tagDraft.color };
      setTags((prev) =>
        prev.map((tag) => (tag.id === editingTagId ? { ...tag, ...patch } : tag))
      );
      try {
        const response = await fetch(`/api/tags/${editingTagId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch)
        });
        const updated = await response.json();
        setTags((prev) => prev.map((tag) => (tag.id === updated.id ? updated : tag)));
        notifySuccess("Tag updated", updated.label);
        resetTagDraft();
      } catch (err) {
        setTags(previous);
        notifyError("Tag update failed", "Reverted to last saved state.");
      }
      return;
    }

    const tempId = `temp_${createClientId()}`;
    const tempTag: Tag = { id: tempId, label, color: tagDraft.color };
    setTags((prev) => [...prev, tempTag]);
    resetTagDraft();

    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(tempTag)
      });
      const created = await response.json();
      setTags((prev) => prev.map((tag) => (tag.id === tempId ? created : tag)));
      notifySuccess("Tag created", created.label);
    } catch (err) {
      setTags((prev) => prev.filter((tag) => tag.id !== tempId));
      notifyError("Tag creation failed", "Try again when you're back online.");
    }
  };

  const deleteTag = async (tagId: string) => {
    const previous = tags;
    setTags((prev) => prev.filter((tag) => tag.id !== tagId));
    try {
      await fetch(`/api/tags/${tagId}`, { method: "DELETE" });
      notifySuccess("Tag deleted");
    } catch (err) {
      setTags(previous);
      notifyError("Tag deletion failed", "Reverted the tag.");
    }
  };

  // Script Actions
  const toggleScriptTag = (tagId: string) => {
    setScriptDraft((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId) ? prev.tags.filter((id) => id !== tagId) : [...prev.tags, tagId]
    }));
  };

  const submitScript = async () => {
    const payload = {
      name: scriptDraft.name.trim(),
      description: scriptDraft.description.trim(),
      command: scriptDraft.command.trim(),
      tags: scriptDraft.tags,
      favorite: scriptDraft.favorite
    };
    if (!payload.name || !payload.command) return;

    try {
      if (editingScriptId) {
        setScripts((prev) =>
          prev.map((script) =>
            script.id === editingScriptId ? { ...script, ...payload } : script
          )
        );
        const response = await fetch(`/api/scripts/${editingScriptId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const updated = await response.json();
        setScripts((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
        logSignal("script_updated", `Script updated: ${updated.name}`);
        notifySuccess("Script updated", updated.name);
      } else {
        const tempId = `temp_${createClientId()}`;
        const now = new Date().toISOString();
        const tempScript: Script = {
          id: tempId,
          name: payload.name,
          description: payload.description,
          command: payload.command,
          tags: payload.tags,
          favorite: payload.favorite,
          createdAt: now,
          updatedAt: now
        };
        setScripts((prev) => [...prev, tempScript]);
        const response = await fetch("/api/scripts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const created = await response.json();
        setScripts((prev) => prev.map((s) => (s.id === tempId ? created : s)));
        logSignal("script_created", `Script created: ${created.name}`);
        notifySuccess("Script created", created.name);
      }
      setScriptDraft({ name: "", description: "", command: "", tags: [], favorite: false });
      setEditingScriptId(null);
    } catch (err) {
      notifyError("Script save failed", "Changes were not saved.");
      if (editingScriptId) {
        try {
          const response = await fetch("/api/scripts");
          const refreshed = await response.json();
          setScripts(refreshed);
        } catch {
          // ignore secondary failure
        }
      } else {
        setScripts((prev) => prev.filter((script) => !script.id.startsWith("temp_")));
      }
    }
  };

  const startEditScript = (script: Script) => {
    setEditingScriptId(script.id);
    setScriptDraft({
      name: script.name,
      description: script.description,
      command: script.command,
      tags: script.tags,
      favorite: script.favorite
    });
  };

  const cancelEditScript = () => {
    setEditingScriptId(null);
    setScriptDraft({ name: "", description: "", command: "", tags: [], favorite: false });
  };

  const toggleFavoriteScript = async (script: Script) => {
    const previous = scripts;
    setScripts((prev) =>
      prev.map((item) =>
        item.id === script.id ? { ...item, favorite: !script.favorite } : item
      )
    );
    try {
      const response = await fetch(`/api/scripts/${script.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: !script.favorite })
      });
      const updated = await response.json();
      setScripts((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      notifySuccess(script.favorite ? "Removed favorite" : "Marked as favorite", updated.name);
    } catch (err) {
      setScripts(previous);
      notifyError("Script update failed", "Reverted favorite state.");
    }
  };

  const deleteScript = async (scriptId: string) => {
    const previous = scripts;
    setScripts((prev) => prev.filter((s) => s.id !== scriptId));
    try {
      await fetch(`/api/scripts/${scriptId}`, { method: "DELETE" });
      notifySuccess("Script deleted");
    } catch (err) {
      setScripts(previous);
      notifyError("Script deletion failed", "Reverted the script.");
    }
  };

  const handleCopyScript = async (script: Script) => {
    try {
      await navigator.clipboard.writeText(script.command);
      setCopiedScriptId(script.id);
      setTimeout(() => setCopiedScriptId(null), 1400);
      logSignal("script_copied", `Script copied: ${script.name}`);
      toast.info("Copied to clipboard", script.name);
    } catch (err) {
      notifyError("Copy failed", "Clipboard permission denied.");
    }
  };

  // Pref Actions
  const togglePreferenceTag = (tagId: string) => {
    setPreferenceDraft((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId) ? prev.tags.filter((id) => id !== tagId) : [...prev.tags, tagId]
    }));
  };

  const submitPreference = async () => {
    const payload = {
      prompt: preferenceDraft.prompt.trim(),
      leftLabel: preferenceDraft.leftLabel.trim(),
      rightLabel: preferenceDraft.rightLabel.trim(),
      tags: preferenceDraft.tags,
      notes: preferenceDraft.notes.trim()
    };
    if (!payload.prompt) return;

    try {
      const tempId = `temp_${createClientId()}`;
      const now = new Date().toISOString();
      const tempPreference: Preference = {
        id: tempId,
        prompt: payload.prompt,
        leftLabel: payload.leftLabel || "No",
        rightLabel: payload.rightLabel || "Yes",
        tags: payload.tags,
        decision: "unset",
        confidence: preferenceConfidence,
        notes: payload.notes,
        createdAt: now,
        updatedAt: now
      };
      setPreferences((prev) => [...prev, tempPreference]);
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const created = await response.json();
      setPreferences((prev) => prev.map((pref) => (pref.id === tempId ? created : pref)));
      setPreferenceDraft({ prompt: "", leftLabel: "No", rightLabel: "Yes", tags: [], notes: "" });
      logSignal("preference_created", `Preference added: ${created.prompt}`);
      notifySuccess("Preference created", created.prompt);
    } catch (err) {
      setPreferences((prev) => prev.filter((pref) => !pref.id.startsWith("temp_")));
      notifyError("Preference save failed", "Please try again.");
    }
  };

  const updatePreference = async (preferenceId: string, patch: Partial<Preference>) => {
    const previous = preferences;
    setPreferences((prev) =>
      prev.map((item) =>
        item.id === preferenceId ? { ...item, ...patch, updatedAt: new Date().toISOString() } : item
      )
    );
    try {
      await fetch(`/api/preferences/${preferenceId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
    } catch (err) {
      setPreferences(previous);
      notifyError("Preference update failed", "Reverted to previous state.");
    }
  };

  const deletePreference = async (preferenceId: string) => {
    const previous = preferences;
    setPreferences((prev) => prev.filter((item) => item.id !== preferenceId));
    try {
      await fetch(`/api/preferences/${preferenceId}`, { method: "DELETE" });
      logSignal("preference_deleted", `Preference removed`);
      notifySuccess("Preference deleted");
    } catch (err) {
      setPreferences(previous);
      notifyError("Preference deletion failed", "Reverted the card.");
    }
  };

  const animatePreferenceCard = async (direction: PreferenceDecision) => {
    if (!preferenceCardRef.current) return;
    try {
      if (
        typeof window !== "undefined" &&
        window.matchMedia("(prefers-reduced-motion: reduce)").matches
      ) {
        return;
      }
      const xOffset = direction === "left" ? -220 : direction === "right" ? 220 : 0;
      if (xOffset === 0) return;
      const card = preferenceCardRef.current;
      card.style.willChange = "transform, opacity";
      const animation = card.animate(
        [
          { transform: "translateX(0px) rotate(0deg)", opacity: 1 },
          { transform: `translateX(${xOffset}px) rotate(${xOffset > 0 ? 6 : -6}deg)`, opacity: 0 }
        ],
        { duration: 220, easing: "cubic-bezier(0.22, 1, 0.36, 1)" }
      );
      await animation.finished;
    } catch (err) {
      // ignore
    } finally {
      if (preferenceCardRef.current) {
        preferenceCardRef.current.style.transform = "";
        preferenceCardRef.current.style.opacity = "1";
        preferenceCardRef.current.style.willChange = "";
      }
    }
  };

  const handlePreferenceDecision = async (preference: Preference, decision: PreferenceDecision) => {
    await animatePreferenceCard(decision);
    updatePreference(preference.id, { decision, confidence: preferenceConfidence });
    logSignal("preference_scored", `Preference ${decision}: ${preference.prompt}`);
    setPreferenceConfidence(3);
  };

  // Exp Actions
  const toggleExperimentTag = (tagId: string) => {
    setExperimentDraft((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId) ? prev.tags.filter((id) => id !== tagId) : [...prev.tags, tagId]
    }));
  };

  const submitExperiment = async () => {
    const payload = {
      title: experimentDraft.title.trim(),
      hypothesis: experimentDraft.hypothesis.trim(),
      metric: experimentDraft.metric.trim(),
      status: experimentDraft.status,
      result: experimentDraft.result,
      startDate: experimentDraft.startDate || undefined,
      endDate: experimentDraft.endDate || undefined,
      owner: experimentDraft.owner.trim() || undefined,
      tags: experimentDraft.tags,
      notes: experimentDraft.notes.trim()
    };
    if (!payload.title) return;

    const previousExperiments = experiments;
    try {
      if (editingExperimentId) {
        setExperiments((prev) =>
          prev.map((exp) =>
            exp.id === editingExperimentId ? { ...exp, ...payload } : exp
          )
        );
        const response = await fetch(`/api/experiments/${editingExperimentId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const updated = await response.json();
        setExperiments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
        logSignal("experiment_updated", `Experiment updated: ${updated.title}`);
        notifySuccess("Experiment updated", updated.title);
      } else {
        const tempId = `temp_${createClientId()}`;
        const now = new Date().toISOString();
        const tempExperiment: Experiment = {
          id: tempId,
          title: payload.title,
          hypothesis: payload.hypothesis,
          metric: payload.metric,
          status: payload.status,
          result: payload.result,
          startDate: payload.startDate,
          endDate: payload.endDate,
          owner: payload.owner,
          notes: payload.notes,
          tags: payload.tags,
          createdAt: now,
          updatedAt: now
        };
        setExperiments((prev) => [...prev, tempExperiment]);
        const response = await fetch("/api/experiments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        const created = await response.json();
        setExperiments((prev) => prev.map((exp) => (exp.id === tempId ? created : exp)));
        logSignal("experiment_created", `Experiment created: ${created.title}`);
        notifySuccess("Experiment created", created.title);
      }
      setExperimentDraft({
        title: "",
        hypothesis: "",
        metric: "",
        status: "Idea",
        result: "Pending",
        startDate: "",
        endDate: "",
        owner: "",
        tags: [],
        notes: ""
      });
      setEditingExperimentId(null);
    } catch (err) {
      setExperiments(previousExperiments);
      notifyError("Experiment save failed", "Please try again.");
    }
  };

  const startEditExperiment = (experiment: Experiment) => {
    setEditingExperimentId(experiment.id);
    setExperimentDraft({
      title: experiment.title,
      hypothesis: experiment.hypothesis,
      metric: experiment.metric,
      status: experiment.status,
      result: experiment.result,
      startDate: formatInputDate(experiment.startDate),
      endDate: formatInputDate(experiment.endDate),
      owner: experiment.owner ?? "",
      tags: experiment.tags,
      notes: experiment.notes
    });
  };

  const cancelEditExperiment = () => {
    setEditingExperimentId(null);
    setExperimentDraft({
      title: "",
      hypothesis: "",
      metric: "",
      status: "Idea",
      result: "Pending",
      startDate: "",
      endDate: "",
      owner: "",
      tags: [],
      notes: ""
    });
  };

  const deleteExperiment = async (experimentId: string) => {
    const previous = experiments;
    setExperiments((prev) => prev.filter((item) => item.id !== experimentId));
    try {
      await fetch(`/api/experiments/${experimentId}`, { method: "DELETE" });
      logSignal("experiment_deleted", `Experiment deleted`);
      notifySuccess("Experiment deleted");
    } catch (err) {
      setExperiments(previous);
      notifyError("Experiment deletion failed", "Reverted the card.");
    }
  };

  // Drag & Drop
  const moveTask = (taskId: string, columnId: string) => {
    updateTask(taskId, { columnId });
    const task = tasks.find((item) => item.id === taskId);
    const column = columns.find((item) => item.id === columnId);
    if (task && column) {
      logSignal("task_moved", `${task.title} → ${column.title}`);
    }
  };

  const handleDragStart = (event: DragEvent<HTMLButtonElement>, taskId: string) => {
    event.dataTransfer.setData("text/plain", taskId);
    event.dataTransfer.effectAllowed = "move";
  };

  const handleDrop = (event: DragEvent<HTMLDivElement>, column: Column) => {
    event.preventDefault();
    const taskId = event.dataTransfer.getData("text/plain");
    setDragOverColumnId(null);

    if (!taskId) return;
    const task = tasks.find((item) => item.id === taskId);
    if (!task || task.columnId === column.id) return;

    if (column.key === "done" && task.definitionOfDone && task.definitionOfDone.length > 0) {
      // Simple validation for now
      if (!task.definitionOfDone.every(i => i.done)) {
        setPendingMove({ taskId, columnId: column.id });
        return; 
      }
    }
    moveTask(taskId, column.id);
  };

  // Planner
  const plannedHours = useMemo(() => {
    return openTasks.reduce((total, task) => {
      const value = task.estimateHours ?? 0;
      return total + (Number.isFinite(value) ? value : 0);
    }, 0);
  }, [openTasks]);

  const capacityUsage = useMemo(() => {
    if (weeklyCapacity <= 0) return 0;
    return Math.min(plannedHours / weeklyCapacity, 1.5);
  }, [plannedHours, weeklyCapacity]);

  const focusQueue = useMemo(() => {
    const now = Date.now();
    const scored = openTasks.map((task) => {
      const priorityScore = priorityWeight[task.priority];
      const impactScore = task.impact ? levelWeight[task.impact] : 2;
      const effortPenalty = task.effort ? levelWeight[task.effort] - 1 : 0;
      let dueScore = 0;
      if (task.dueDate) {
        const diffDays = (new Date(task.dueDate).getTime() - now) / (1000 * 60 * 60 * 24);
        if (diffDays <= 3) dueScore = 3;
        else if (diffDays <= 7) dueScore = 2;
        else if (diffDays <= 14) dueScore = 1;
      }
      const score = priorityScore + impactScore + dueScore - effortPenalty;
      return { task, score };
    });
    return scored.sort((a, b) => b.score - a.score).slice(0, 6).map((item) => item.task);
  }, [openTasks]);

  const doneTaskIds = useMemo(() => {
    return new Set(
      tasks
        .filter((task) => {
          const column = columns.find((col) => col.id === task.columnId);
          return column?.key === "done";
        })
        .map((task) => task.id)
    );
  }, [tasks, columns]);

  const blockedTasks = useMemo(() => {
    return openTasks.filter((task) => {
      const deps = task.dependencies ?? [];
      return deps.some((depId) => !doneTaskIds.has(depId));
    });
  }, [openTasks, doneTaskIds]);

  const preferenceQueue = useMemo(() => preferences.filter((pref) => pref.decision === "unset"), [preferences]);
  const preferenceStats = useMemo(() => {
    return preferences.reduce(
      (acc, pref) => {
        acc.total += 1;
        if (pref.decision === "left") acc.left += 1;
        if (pref.decision === "right") acc.right += 1;
        if (pref.decision === "skip") acc.skip += 1;
        return acc;
      },
      { total: 0, left: 0, right: 0, skip: 0 }
    );
  }, [preferences]);

  const updatePlanDraft = (taskId: string, patch: Partial<Task>) => {
    setPlanDrafts((prev) => ({ ...prev, [taskId]: { ...prev[taskId], ...patch } }));
  };

  const commitPlanDraft = (taskId: string) => {
    const draft = planDrafts[taskId];
    if (!draft) return;
    updateTask(taskId, draft);
    setPlanDrafts((prev) => {
      const next = { ...prev };
      delete next[taskId];
      return next;
    });
    const task = tasks.find((item) => item.id === taskId);
    if (task) logSignal("plan_updated", `Plan updated: ${task.title}`);
  };

  const getPlanValue = (task: Task, key: keyof Task) => {
    const draft = planDrafts[task.id];
    if (draft && key in draft) return draft[key];
    return task[key];
  };

  const scrollToSection = (sectionId: string) => {
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  const openSection = (view: typeof activeView, sectionId?: string) => {
    setActiveView(view);
    if (sectionId) {
      setTimeout(() => scrollToSection(sectionId), 60);
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-[1600px] gap-6 px-4 pb-24 pt-4 lg:pb-6 lg:pt-6">
      <Sidebar activeView={activeView} setActiveView={setActiveView} />
      <main className="min-w-0 flex-1">
        {activeView === "board" && (
          <>
            <DashboardHeader
              search={search}
              setSearch={setSearch}
              taskCount={tasks.length}
              openTaskCount={openTaskCount}
              doneCount={doneCount}
              activeProjectId={activeProjectId}
              setActiveProjectId={setActiveProjectId}
            />

            {loading ? (
              <OverviewSkeleton />
            ) : (
              agentState && (
                <OverviewGrid
                  agentState={agentState}
                  heroDate={heroDateFormatter.format(new Date())}
                  vps={vpsStatus}
                />
              )
            )}
          </>
        )}

        {activeView === "board" && (
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-2 mb-6">
            <TagManager
              tags={tags}
              activeTags={activeTags}
              toggleTagFilter={toggleTagFilter}
              setShowTagManager={setShowTagManager}
            />
          </div>
        )}

        {error && (
          <div className="mb-6 rounded-xl border border-danger/30 bg-danger/10 p-4 text-danger">
            <strong>Error:</strong> {error}
          </div>
        )}

        <TagManagerModal
          open={showTagManager}
          tags={tags}
          tagDraft={tagDraft}
          setTagDraft={setTagDraft}
          editingTagId={editingTagId}
          setEditingTagId={setEditingTagId}
          onClose={() => {
            setShowTagManager(false);
            resetTagDraft();
          }}
          submitTag={submitTag}
          deleteTag={deleteTag}
        />

        {activeView === "board" && (
          <div className="animate-fade-in">
            <BoardView
              columns={columnsSorted}
              tasksByColumn={tasksByColumn}
              tags={tags}
              dragOverColumnId={dragOverColumnId}
              loading={loading}
              setDragOverColumnId={setDragOverColumnId}
              handleDrop={handleDrop}
              handleDragStart={handleDragStart}
              setSelectedTaskId={setSelectedTaskId}
              newTaskTitles={newTaskTitles}
              setNewTaskTitles={setNewTaskTitles}
              createTask={createTask}
            />
          </div>
        )}

        {activeView === "planner" && (
          <div className="animate-fade-in">
          <PlannerView
            openTasks={openTasks}
            plannedHours={plannedHours}
            weeklyCapacity={weeklyCapacity}
            setWeeklyCapacity={setWeeklyCapacity}
            capacityUsage={capacityUsage}
            focusQueue={focusQueue}
            blockedTasks={blockedTasks}
            trackingEnabled={trackingEnabled}
            setTrackingEnabled={setTrackingEnabled}
            signals={signals}
            plannerTasks={plannerTasks}
            doneTaskIds={doneTaskIds}
            getPlanValue={getPlanValue}
            updatePlanDraft={updatePlanDraft}
            commitPlanDraft={commitPlanDraft}
            setTaskSwarmRequired={setTaskSwarmRequired}
            setTaskProcessingMode={setTaskProcessingMode}
            isBatchEligible={isBatchEligible}
          />
        </div>
      )}

        {activeView === "preferences" && (
          <div className="animate-fade-in">
            <PreferencesView
              preferences={preferences}
              tags={tags}
              preferenceDraft={preferenceDraft}
              setPreferenceDraft={setPreferenceDraft}
              preferenceConfidence={preferenceConfidence}
              setPreferenceConfidence={setPreferenceConfidence}
              preferenceQueue={preferenceQueue}
              preferenceStats={preferenceStats}
              togglePreferenceTag={togglePreferenceTag}
              submitPreference={submitPreference}
              updatePreference={updatePreference}
              deletePreference={deletePreference}
              handlePreferenceDecision={handlePreferenceDecision}
              preferenceCardRef={preferenceCardRef}
            />
          </div>
        )}

        {activeView === "experiments" && (
          <div className="animate-fade-in">
            <ExperimentsView
              experiments={experiments}
              tags={tags}
              experimentDraft={experimentDraft}
              setExperimentDraft={setExperimentDraft}
              editingExperimentId={editingExperimentId}
              toggleExperimentTag={toggleExperimentTag}
              submitExperiment={submitExperiment}
              startEditExperiment={startEditExperiment}
              cancelEditExperiment={cancelEditExperiment}
              deleteExperiment={deleteExperiment}
            />
          </div>
        )}

        {activeView === "labs" && (
          <div className="animate-fade-in">
            <LabsView />
          </div>
        )}

        {activeView === "skills" && (
          <div className="animate-fade-in">
            <SkillsView />
          </div>
        )}

        {activeView === "scripts" && (
          <div className="animate-fade-in">
            <ScriptsView
              scripts={scripts}
              tags={tags}
              scriptDraft={scriptDraft}
              setScriptDraft={setScriptDraft}
              editingScriptId={editingScriptId}
              toggleScriptTag={toggleScriptTag}
              submitScript={submitScript}
              startEditScript={startEditScript}
              cancelEditScript={cancelEditScript}
              toggleFavoriteScript={toggleFavoriteScript}
              deleteScript={deleteScript}
              handleCopyScript={handleCopyScript}
            />
          </div>
        )}

        {activeView === "integrations" && (
          <div className="animate-fade-in">
            <IntegrationsView />
          </div>
        )}
      </main>
    </div>
  );
}
