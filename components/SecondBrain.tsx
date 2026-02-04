"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { DragEvent } from "react";
import { useAutoAnimate } from "@formkit/auto-animate/react";
import Clock from "@/components/Clock";
import ThemeToggle from "@/components/ThemeToggle";
import type {
  ChecklistItem,
  Column,
  Experiment,
  ExperimentResult,
  ExperimentStatus,
  Level,
  LinkItem,
  Preference,
  PreferenceDecision,
  Priority,
  Script,
  Tag,
  Task
} from "@/lib/types";

const priorities: Priority[] = ["Low", "Medium", "High"];
const levels: Level[] = ["Low", "Medium", "High"];
const experimentStatuses: ExperimentStatus[] = [
  "Idea",
  "Queued",
  "Running",
  "Analyzing",
  "Complete"
];
const experimentResults: ExperimentResult[] = [
  "Pending",
  "Positive",
  "Negative",
  "Inconclusive"
];
const levelWeight: Record<Level, number> = {
  Low: 1,
  Medium: 2,
  High: 3
};

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

const heroDateFormatter = new Intl.DateTimeFormat("en-US", {
  weekday: "long",
  month: "long",
  day: "numeric"
});

const shortDateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit"
});

function formatTimestamp(value?: string) {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return dateFormatter.format(parsed);
}

function formatShortDate(value?: string) {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return shortDateFormatter.format(parsed);
}

function formatInputDate(value?: string) {
  if (!value) return "";
  if (value.length >= 10) return value.slice(0, 10);
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return "";
  return parsed.toISOString().slice(0, 10);
}

function createClientId() {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2, 10);
}

function getTagColor(tagId: string, tags: Tag[]) {
  return tags.find((tag) => tag.id === tagId)?.color ?? "#94a3b8";
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
const SIGNAL_TTL_MS = 1000 * 60 * 60 * 48;

export default function SecondBrain() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
  const [activeView, setActiveView] = useState<
    "board" | "planner" | "preferences" | "experiments" | "scripts"
  >("board");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const [pendingMove, setPendingMove] = useState<PendingMove | null>(null);
  const [newTaskTitles, setNewTaskTitles] = useState<Record<string, string>>({});
  const [dragOverColumnId, setDragOverColumnId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showTagManager, setShowTagManager] = useState(false);
  const [tagDraft, setTagDraft] = useState<TagDraft>({
    label: "",
    color: "#94a3b8"
  });
  const [preferences, setPreferences] = useState<Preference[]>([]);
  const [experiments, setExperiments] = useState<Experiment[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [trackingEnabled, setTrackingEnabled] = useState(true);
  const [weeklyCapacity, setWeeklyCapacity] = useState(24);
  const [planDrafts, setPlanDrafts] = useState<
    Record<string, Partial<Task>>
  >({});
  const [preferenceDraft, setPreferenceDraft] = useState<PreferenceDraft>({
    prompt: "",
    leftLabel: "No",
    rightLabel: "Yes",
    tags: [],
    notes: ""
  });
  const [preferenceConfidence, setPreferenceConfidence] = useState(3);
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
  const [editingExperimentId, setEditingExperimentId] = useState<string | null>(
    null
  );
  const [scriptDraft, setScriptDraft] = useState<ScriptDraft>({
    name: "",
    description: "",
    command: "",
    tags: [],
    favorite: false
  });
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null);
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);
  const preferenceCardRef = useRef<HTMLDivElement | null>(null);
  const [signalsRef] = useAutoAnimate<HTMLDivElement>();
  const [experimentsRef] = useAutoAnimate<HTMLDivElement>();
  const [scriptsRef] = useAutoAnimate<HTMLDivElement>();

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

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

  const columnsSorted = useMemo(() => {
    return [...columns].sort((a, b) => a.order - b.order);
  }, [columns]);

  const filteredTasks = useMemo(() => {
    const query = search.trim().toLowerCase();
    const matchesQuery = (task: Task) => {
      if (!query) return true;
      const haystack = `${task.title} ${task.description} ${task.notes}`
        .toLowerCase()
        .trim();
      return haystack.includes(query);
    };

    const matchesTags = (task: Task) => {
      if (activeTags.length === 0) return true;
      return task.tags.some((tagId) => activeTags.includes(tagId));
    };

    return tasks
      .filter((task) => matchesQuery(task) && matchesTags(task))
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  }, [tasks, search, activeTags]);

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
      Low: 1,
      Medium: 2,
      High: 3
    };
    return [...openTasks].sort((a, b) => {
      const aDue = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
      const bDue = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
      if (aDue !== bDue) return aDue - bDue;
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    });
  }, [openTasks]);

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
          experimentsData
        ] = await Promise.all([
          fetchJson<Column[]>("/api/columns"),
          fetchJson<Task[]>("/api/tasks"),
          fetchJson<Tag[]>("/api/tags"),
          fetchJson<Script[]>("/api/scripts"),
          fetchJson<Preference[]>("/api/preferences"),
          fetchJson<Experiment[]>("/api/experiments")
        ]);
        setColumns(columnsData);
        setTasks(tasksData);
        setTags(tagsData);
        setScripts(scriptsData);
        setPreferences(preferencesData);
        setExperiments(experimentsData);
      } catch (err) {
        setError("Unable to load data. Please refresh the page.");
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
    window.localStorage.setItem(
      TRACKING_STORAGE_KEY,
      trackingEnabled ? "on" : "off"
    );
  }, [trackingEnabled]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(CAPACITY_STORAGE_KEY, `${weeklyCapacity}`);
  }, [weeklyCapacity]);

  const updateTask = async (taskId: string, patch: Partial<Task>) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === taskId
          ? {
              ...task,
              ...patch,
              updatedAt: new Date().toISOString()
            }
          : task
      )
    );

    try {
      const response = await fetch(`/api/tasks/${taskId}`.trim(), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      if (!response.ok) {
        throw new Error("Failed to update task");
      }
      const updated = (await response.json()) as Task;
      setTasks((prev) =>
        prev.map((task) => (task.id === taskId ? updated : task))
      );
    } catch (err) {
      setError("Task update failed. Please retry.");
    }
  };

  const createTask = async (columnId: string) => {
    const title = newTaskTitles[columnId]?.trim();
    if (!title) return;

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, columnId })
      });
      if (!response.ok) {
        throw new Error("Failed to create task");
      }
      const created = (await response.json()) as Task;
      setTasks((prev) => [...prev, created]);
      setNewTaskTitles((prev) => ({ ...prev, [columnId]: "" }));
      logSignal("task_created", `Task created: ${created.title}`);
    } catch (err) {
      setError("Task creation failed. Please retry.");
    }
  };

  const deleteTask = async (taskId: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== taskId));
    if (selectedTaskId === taskId) {
      setSelectedTaskId(null);
    }

    try {
      await fetch(`/api/tasks/${taskId}`.trim(), { method: "DELETE" });
      logSignal("task_deleted", `Task deleted: ${taskId}`);
    } catch (err) {
      setError("Task deletion failed. Please retry.");
    }
  };

  const toggleTagFilter = (tagId: string) => {
    setActiveTags((prev) =>
      prev.includes(tagId)
        ? prev.filter((id) => id !== tagId)
        : [...prev, tagId]
    );
  };

  const createTag = async () => {
    const label = tagDraft.label.trim();
    if (!label) return;

    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label, color: tagDraft.color })
      });
      if (!response.ok) {
        throw new Error("Failed to create tag");
      }
      const created = (await response.json()) as Tag;
      setTags((prev) => [...prev, created]);
      setTagDraft({ label: "", color: "#94a3b8" });
      logSignal("tag_created", `Tag created: ${created.label}`);
    } catch (err) {
      setError("Tag creation failed. Please retry.");
    }
  };

  const toggleScriptTag = (tagId: string) => {
    setScriptDraft((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter((id) => id !== tagId)
        : [...prev.tags, tagId]
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
        const response = await fetch(`/api/scripts/${editingScriptId}`.trim(), {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          throw new Error("Failed to update script");
        }
        const updated = (await response.json()) as Script;
        setScripts((prev) =>
          prev.map((script) => (script.id === updated.id ? updated : script))
        );
        logSignal("script_updated", `Script updated: ${updated.name}`);
      } else {
        const response = await fetch("/api/scripts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          throw new Error("Failed to create script");
        }
        const created = (await response.json()) as Script;
        setScripts((prev) => [...prev, created]);
        logSignal("script_created", `Script created: ${created.name}`);
      }

      setScriptDraft({
        name: "",
        description: "",
        command: "",
        tags: [],
        favorite: false
      });
      setEditingScriptId(null);
    } catch (err) {
      setError("Script save failed. Please retry.");
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
    setScriptDraft({
      name: "",
      description: "",
      command: "",
      tags: [],
      favorite: false
    });
  };

  const toggleFavoriteScript = async (script: Script) => {
    try {
      const response = await fetch(`/api/scripts/${script.id}`.trim(), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ favorite: !script.favorite })
      });
      if (!response.ok) {
        throw new Error("Failed to update script");
      }
      const updated = (await response.json()) as Script;
      setScripts((prev) =>
        prev.map((item) => (item.id === updated.id ? updated : item))
      );
    } catch (err) {
      setError("Script update failed. Please retry.");
    }
  };

  const deleteScript = async (scriptId: string) => {
    setScripts((prev) => prev.filter((script) => script.id !== scriptId));
    try {
      await fetch(`/api/scripts/${scriptId}`.trim(), { method: "DELETE" });
    } catch (err) {
      setError("Script deletion failed. Please retry.");
    }
  };

  const handleCopyScript = async (script: Script) => {
    try {
      await navigator.clipboard.writeText(script.command);
      setCopiedScriptId(script.id);
      window.setTimeout(() => setCopiedScriptId(null), 1400);
      logSignal("script_copied", `Script copied: ${script.name}`);
    } catch (err) {
      setError("Clipboard copy failed. Please retry.");
    }
  };

  const togglePreferenceTag = (tagId: string) => {
    setPreferenceDraft((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter((id) => id !== tagId)
        : [...prev.tags, tagId]
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
      const response = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        throw new Error("Failed to create preference");
      }
      const created = (await response.json()) as Preference;
      setPreferences((prev) => [...prev, created]);
      setPreferenceDraft({
        prompt: "",
        leftLabel: "No",
        rightLabel: "Yes",
        tags: [],
        notes: ""
      });
      logSignal("preference_created", `Preference added: ${created.prompt}`);
    } catch (err) {
      setError("Preference save failed. Please retry.");
    }
  };

  const updatePreference = async (
    preferenceId: string,
    patch: Partial<Preference>
  ) => {
    setPreferences((prev) =>
      prev.map((item) =>
        item.id === preferenceId
          ? {
              ...item,
              ...patch,
              updatedAt: new Date().toISOString()
            }
          : item
      )
    );

    try {
      const response = await fetch(`/api/preferences/${preferenceId}`.trim(), {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patch)
      });
      if (!response.ok) {
        throw new Error("Failed to update preference");
      }
      const updated = (await response.json()) as Preference;
      setPreferences((prev) =>
        prev.map((item) => (item.id === preferenceId ? updated : item))
      );
    } catch (err) {
      setError("Preference update failed. Please retry.");
    }
  };

  const deletePreference = async (preferenceId: string) => {
    setPreferences((prev) => prev.filter((item) => item.id !== preferenceId));
    try {
      await fetch(`/api/preferences/${preferenceId}`.trim(), {
        method: "DELETE"
      });
      logSignal("preference_deleted", `Preference removed`);
    } catch (err) {
      setError("Preference deletion failed. Please retry.");
    }
  };

  const animatePreferenceCard = async (direction: PreferenceDecision) => {
    if (!preferenceCardRef.current) return;
    try {
      const anime = (await import("animejs")).default;
      const xOffset =
        direction === "left" ? -220 : direction === "right" ? 220 : 0;
      await anime({
        targets: preferenceCardRef.current,
        translateX: xOffset,
        rotate: xOffset === 0 ? 0 : xOffset > 0 ? 6 : -6,
        opacity: 0,
        duration: 240,
        easing: "easeInOutQuad"
      }).finished;
    } catch (err) {
      // no-op for animation failure
    } finally {
      if (preferenceCardRef.current) {
        preferenceCardRef.current.style.transform = "";
        preferenceCardRef.current.style.opacity = "1";
      }
    }
  };

  const handlePreferenceDecision = async (
    preference: Preference,
    decision: PreferenceDecision
  ) => {
    await animatePreferenceCard(decision);
    updatePreference(preference.id, {
      decision,
      confidence: preferenceConfidence
    });
    logSignal(
      "preference_scored",
      `Preference ${decision}: ${preference.prompt}`
    );
    setPreferenceConfidence(3);
  };

  const toggleExperimentTag = (tagId: string) => {
    setExperimentDraft((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter((id) => id !== tagId)
        : [...prev.tags, tagId]
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

    try {
      if (editingExperimentId) {
        const response = await fetch(
          `/api/experiments/${editingExperimentId}`.trim(),
          {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          }
        );
        if (!response.ok) {
          throw new Error("Failed to update experiment");
        }
        const updated = (await response.json()) as Experiment;
        setExperiments((prev) =>
          prev.map((item) => (item.id === updated.id ? updated : item))
        );
        logSignal("experiment_updated", `Experiment updated: ${updated.title}`);
      } else {
        const response = await fetch("/api/experiments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
        });
        if (!response.ok) {
          throw new Error("Failed to create experiment");
        }
        const created = (await response.json()) as Experiment;
        setExperiments((prev) => [...prev, created]);
        logSignal("experiment_created", `Experiment created: ${created.title}`);
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
      setError("Experiment save failed. Please retry.");
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
    setExperiments((prev) => prev.filter((item) => item.id !== experimentId));
    try {
      await fetch(`/api/experiments/${experimentId}`.trim(), {
        method: "DELETE"
      });
      logSignal("experiment_deleted", `Experiment deleted`);
    } catch (err) {
      setError("Experiment deletion failed. Please retry.");
    }
  };

  const isDefinitionDone = (task: Task) => {
    if (!task.definitionOfDone || task.definitionOfDone.length === 0) return true;
    return task.definitionOfDone.every((item) => item.done);
  };

  const moveTask = (taskId: string, columnId: string) => {
    updateTask(taskId, { columnId });
    const task = tasks.find((item) => item.id === taskId);
    const column = columns.find((item) => item.id === columnId);
    if (task && column) {
      logSignal("task_moved", `${task.title} → ${column.title}`);
    }
  };

  const handleDragStart = (
    event: DragEvent<HTMLButtonElement>,
    taskId: string
  ) => {
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

    if (column.key === "done" && !isDefinitionDone(task)) {
      setPendingMove({ taskId, columnId: column.id });
      return;
    }

    moveTask(taskId, column.id);
  };

  const taskCount = tasks.length;
  const heroDate = heroDateFormatter.format(new Date());

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
      const priorityScore = levelWeight[task.priority];
      const impactScore = task.impact ? levelWeight[task.impact] : 2;
      const effortPenalty = task.effort ? levelWeight[task.effort] - 1 : 0;
      let dueScore = 0;
      if (task.dueDate) {
        const diffDays =
          (new Date(task.dueDate).getTime() - now) / (1000 * 60 * 60 * 24);
        if (diffDays <= 3) dueScore = 3;
        else if (diffDays <= 7) dueScore = 2;
        else if (diffDays <= 14) dueScore = 1;
      }
      const score = priorityScore + impactScore + dueScore - effortPenalty;
      return { task, score };
    });

    return scored
      .sort((a, b) => b.score - a.score)
      .slice(0, 6)
      .map((item) => item.task);
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

  const preferenceQueue = useMemo(() => {
    return preferences.filter((pref) => pref.decision === "unset");
  }, [preferences]);

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

  const openSection = (
    view: "board" | "planner" | "preferences" | "experiments" | "scripts",
    sectionId: string
  ) => {
    setActiveView(view);
    if (typeof window === "undefined") return;
    window.setTimeout(() => scrollToSection(sectionId), 60);
  };

  const updatePlanDraft = (taskId: string, patch: Partial<Task>) => {
    setPlanDrafts((prev) => ({
      ...prev,
      [taskId]: {
        ...prev[taskId],
        ...patch
      }
    }));
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
    if (task) {
      logSignal("plan_updated", `Plan updated: ${task.title}`);
    }
  };

  const getPlanValue = <T extends keyof Task>(
    task: Task,
    key: T
  ): Task[T] => {
    const draft = planDrafts[task.id];
    if (draft && key in draft) {
      return draft[key] as Task[T];
    }
    return task[key];
  };

  const scrollToSection = (sectionId: string) => {
    if (typeof document === "undefined") return;
    const target = document.getElementById(sectionId);
    if (target) {
      target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <main className="dashboard">
      <header className="dashboard-topbar">
        <div className="topbar-inner">
          <div className="brand-block">
            <div className="brand-mark" aria-hidden="true">
              <span>J</span>
            </div>
            <div className="brand-copy">
              <div className="brand-title">Jarvis Dashboard</div>
              <div className="brand-subtitle">Second Brain · Workbench</div>
            </div>
          </div>

          <div className="topbar-tabs">
            <div className="view-switch" role="tablist" aria-label="Views">
            <button
              type="button"
              role="tab"
              aria-selected={activeView === "board"}
              className={`view-button ${activeView === "board" ? "active" : ""}`}
              onClick={() => setActiveView("board")}
            >
              Board
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeView === "planner"}
              className={`view-button ${
                activeView === "planner" ? "active" : ""
              }`}
              onClick={() => setActiveView("planner")}
            >
              Planner
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeView === "preferences"}
              className={`view-button ${
                activeView === "preferences" ? "active" : ""
              }`}
              onClick={() => setActiveView("preferences")}
            >
              Preferences
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeView === "experiments"}
              className={`view-button ${
                activeView === "experiments" ? "active" : ""
              }`}
              onClick={() => setActiveView("experiments")}
            >
              Experiments
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeView === "scripts"}
              className={`view-button ${activeView === "scripts" ? "active" : ""}`}
              onClick={() => setActiveView("scripts")}
            >
              Scripts
            </button>
            </div>
          </div>

          <div className="topbar-actions">
            <div className="topbar-search">
              <label className="sr-only" htmlFor="task-search">
                Search tasks
              </label>
              <input
                id="task-search"
                type="search"
                placeholder="Search tasks, notes, tags…"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
              <kbd aria-hidden="true">/</kbd>
            </div>
            <div className="topbar-stats">
              <div>
                <span>Total</span>
                <strong>{taskCount}</strong>
              </div>
              <div>
                <span>Open</span>
                <strong>{openTaskCount}</strong>
              </div>
              <div>
                <span>Done</span>
                <strong>{doneCount}</strong>
              </div>
            </div>
            <ThemeToggle />
            <div className="topbar-time" title="Local time">
              <Clock />
            </div>
          </div>
        </div>
      </header>

      <section className="dashboard-hero reveal">
        <div className="hero-copy">
          <p className="hero-date">{heroDate}</p>
          <h1>Today’s focus.</h1>
          <p>
            You have <strong>{openTaskCount}</strong> open tasks across{" "}
            <strong>{columns.length}</strong> lanes.
          </p>
        </div>
        <div className="hero-actions">
          <button
            type="button"
            className="ghost-button"
            onClick={() => scrollToSection("tag-panel")}
          >
            Filter
          </button>
          <button
            type="button"
            className="primary-button"
            onClick={() => openSection("board", "board-section")}
          >
            New Task
          </button>
        </div>
      </section>

      <section className="insight-card reveal">
        <div className="insight-header">
          <div>
            <p className="section-eyebrow">Activity Pulse</p>
            <h2>Team Velocity</h2>
          </div>
          <div className="insight-kpi">
            <strong>+12%</strong>
            <span>vs last week</span>
          </div>
        </div>
        <div className="insight-chart">
          <div className="chart-grid" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <svg viewBox="0 0 1000 200" preserveAspectRatio="none">
            <defs>
              <linearGradient id="chartGradient" x1="0" x2="0" y1="0" y2="1">
                <stop offset="0%" stopColor="#2513ec" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#2513ec" stopOpacity="0" />
              </linearGradient>
            </defs>
            <path
              d="M0 150 C 150 150, 150 50, 300 50 C 450 50, 450 120, 600 120 C 750 120, 750 30, 900 30 L 1000 30 L 1000 200 L 0 200 Z"
              fill="url(#chartGradient)"
            />
            <path
              d="M0 150 C 150 150, 150 50, 300 50 C 450 50, 450 120, 600 120 C 750 120, 750 30, 900 30 L 1000 30"
              fill="none"
              stroke="#2513ec"
              strokeWidth="3"
              strokeLinecap="round"
            />
            <circle cx="300" cy="50" r="5" fill="#ffffff" stroke="#2513ec" strokeWidth="3" />
            <circle cx="600" cy="120" r="5" fill="#ffffff" stroke="#2513ec" strokeWidth="3" />
            <circle cx="900" cy="30" r="7" fill="#2513ec" stroke="#ffffff" strokeWidth="3" />
          </svg>
        </div>
        <div className="insight-metrics">
          <div>
            <span>Total tasks</span>
            <strong>{taskCount}</strong>
          </div>
          <div>
            <span>Open tasks</span>
            <strong>{openTaskCount}</strong>
          </div>
          <div>
            <span>Done tasks</span>
            <strong>{doneCount}</strong>
          </div>
        </div>
      </section>

      <section id="tag-panel" className="filters-panel reveal">
        <div className="tag-filters">
          <div className="tag-filter-header">
            <div>
              <p className="section-eyebrow">Filters</p>
              <h3>Tag focus</h3>
            </div>
            <button
              className="ghost-button"
              type="button"
              onClick={() => setShowTagManager(true)}
            >
              Manage tags
            </button>
          </div>
          <div className="tag-filter-list">
            {tags.length === 0 ? (
              <div className="empty-note">No tags yet.</div>
            ) : (
              tags.map((tag) => (
                <button
                  key={tag.id}
                  type="button"
                  className={`tag-pill ${
                    activeTags.includes(tag.id) ? "active" : ""
                  }`}
                  style={{ background: tag.color }}
                  onClick={() => toggleTagFilter(tag.id)}
                >
                  {tag.label}
                </button>
              ))
            )}
          </div>
        </div>
      </section>

      {error ? <div className="alert">{error}</div> : null}

      {activeView === "board" ? (
      <section id="board-section" className="board-shell reveal">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">Task Board</p>
            <h2>Prioritized Flow</h2>
          </div>
          <div className="section-actions">
            <div className="pill">Drag & drop</div>
            <div className="pill ghost">Quality gate: Done</div>
          </div>
        </div>

        {loading ? (
          <div className="loading">Loading board...</div>
        ) : (
          <div className="board">
            {columnsSorted.map((column) => {
              const columnTasks = tasksByColumn[column.id] ?? [];
              return (
                <div
                  key={column.id}
                  className={`column ${
                    dragOverColumnId === column.id ? "drag-over" : ""
                  }`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setDragOverColumnId(column.id);
                  }}
                  onDragLeave={() => setDragOverColumnId(null)}
                  onDrop={(event) => handleDrop(event, column)}
                >
                  <div className="column-header">
                    <div>
                      <h3>{column.title}</h3>
                      <span>{columnTasks.length} cards</span>
                    </div>
                  </div>

                  <div className="column-body">
                    {columnTasks.map((task) => (
                      <button
                        key={task.id}
                        type="button"
                        className="task-card"
                        draggable
                        onDragStart={(event) => handleDragStart(event, task.id)}
                        onClick={() => setSelectedTaskId(task.id)}
                      >
                        <div className="task-title">{task.title}</div>
                        <div className="task-tags">
                          {task.tags.length === 0 ? (
                            <span className="muted">No tags</span>
                          ) : (
                            task.tags.map((tagId) => {
                              const tag = tags.find((item) => item.id === tagId);
                              return (
                                <span
                                  key={tagId}
                                  className="tag-label"
                                  style={{ background: getTagColor(tagId, tags) }}
                                >
                                  {tag?.label ?? "Tag"}
                                </span>
                              );
                            })
                          )}
                        </div>
                        <div className="task-meta">
                          <span className={`priority ${task.priority}`}>
                            {task.priority}
                          </span>
                          <span>
                            Created {formatTimestamp(task.createdAt)}
                          </span>
                          <span>
                            Updated {formatTimestamp(task.updatedAt)}
                          </span>
                        </div>
                      </button>
                    ))}

                    <div className="task-card composer">
                      <input
                        type="text"
                        placeholder="Add a task..."
                        value={newTaskTitles[column.id] ?? ""}
                        onChange={(event) =>
                          setNewTaskTitles((prev) => ({
                            ...prev,
                            [column.id]: event.target.value
                          }))
                        }
                        onKeyDown={(event) => {
                          if (event.key === "Enter") {
                            createTask(column.id);
                          }
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => createTask(column.id)}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
      ) : null}

      {activeView === "planner" ? (
      <section id="planner-section" className="planner-shell reveal">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">Task Planner</p>
            <h2>Capacity & Focus Strategy</h2>
          </div>
          <div className="section-actions">
            <div className="pill">{openTasks.length} open tasks</div>
            <div className="pill ghost">Load {plannedHours.toFixed(1)}h</div>
          </div>
        </div>

        <div className="planner-grid">
          <div className="planner-left">
            <div className="planner-card">
              <div className="planner-card-header">
                <h3>Capacity Radar</h3>
                <span className="muted">Weekly planning</span>
              </div>
              <label>
                Capacity hours
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={weeklyCapacity}
                  onChange={(event) =>
                    setWeeklyCapacity(Number(event.target.value || 0))
                  }
                />
              </label>
              <div className="capacity-bar">
                <div style={{ width: `${Math.min(capacityUsage * 100, 100)}%` }} />
              </div>
              <div className="capacity-meta">
                <div>
                  <span>Planned</span>
                  <strong>{plannedHours.toFixed(1)}h</strong>
                </div>
                <div>
                  <span>Capacity</span>
                  <strong>{weeklyCapacity}h</strong>
                </div>
                <div>
                  <span>Load</span>
                  <strong>{Math.round(capacityUsage * 100)}%</strong>
                </div>
              </div>
            </div>

            <div className="planner-card">
              <div className="planner-card-header">
                <h3>Focus Queue</h3>
                <span className="muted">Auto-ranked by impact</span>
              </div>
              {focusQueue.length === 0 ? (
                <p className="muted">No focus tasks yet.</p>
              ) : (
                <div className="focus-list">
                  {focusQueue.map((task) => (
                    <div key={task.id} className="focus-item">
                      <div>
                        <strong>{task.title}</strong>
                        <span>
                          Due {formatShortDate(task.dueDate)} ·{" "}
                          {task.estimateHours ?? "--"}h
                        </span>
                      </div>
                      <span className={`priority ${task.priority}`}>
                        {task.priority}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="planner-card">
              <div className="planner-card-header">
                <h3>Dependency Watch</h3>
                <span className="muted">Blocked by prerequisites</span>
              </div>
              {blockedTasks.length === 0 ? (
                <p className="muted">No blockers detected.</p>
              ) : (
                <div className="blocked-list">
                  {blockedTasks.map((task) => (
                    <div key={task.id} className="blocked-item">
                      <strong>{task.title}</strong>
                      <span>
                        {(task.dependencies ?? []).length} dependencies
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="planner-card">
              <div className="planner-card-header">
                <h3>Telemetry Stream</h3>
                <button
                  type="button"
                  className="ghost-button"
                  onClick={() => setTrackingEnabled((prev) => !prev)}
                >
                  {trackingEnabled ? "Tracking On" : "Tracking Off"}
                </button>
              </div>
              <p className="muted">
                Signals are kept temporarily for analysis (48h retention).
              </p>
              <div className="signals-list" ref={signalsRef}>
                {signals.length === 0 ? (
                  <div className="empty-note">No signals captured yet.</div>
                ) : (
                  signals.slice(0, 6).map((signal) => (
                    <div key={signal.id} className="signal-item">
                      <span>{signal.message}</span>
                      <span>{formatShortDate(signal.createdAt)}</span>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="planner-right">
            <div className="planner-table">
              <div className="planner-row planner-header">
                <span>Task</span>
                <span>Priority</span>
                <span>Due</span>
                <span>Est</span>
                <span>Impact</span>
                <span>Effort</span>
                <span>Deps</span>
              </div>
              {plannerTasks.length === 0 ? (
                <div className="empty-state">No open tasks.</div>
              ) : (
                plannerTasks.map((task) => {
                  const deps = task.dependencies ?? [];
                  const unresolved = deps.filter((depId) => !doneTaskIds.has(depId));
                  const impactValue = (getPlanValue(task, "impact") ??
                    "Medium") as Level;
                  const effortValue = (getPlanValue(task, "effort") ??
                    "Medium") as Level;
                  const dueValue = formatInputDate(
                    getPlanValue(task, "dueDate") as string | undefined
                  );
                  const estimateValue = getPlanValue(
                    task,
                    "estimateHours"
                  ) as number | undefined;
                  return (
                    <div key={task.id} className="planner-row">
                      <div className="planner-task">
                        <strong>{task.title}</strong>
                        <span>Updated {formatShortDate(task.updatedAt)}</span>
                      </div>
                      <span className={`priority ${task.priority}`}>
                        {task.priority}
                      </span>
                      <input
                        type="date"
                        value={dueValue}
                        onChange={(event) => {
                          const value = event.target.value;
                          updatePlanDraft(task.id, {
                            dueDate: value
                              ? new Date(value).toISOString()
                              : undefined
                          });
                        }}
                        onBlur={() => commitPlanDraft(task.id)}
                      />
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={estimateValue ?? ""}
                        onChange={(event) => {
                          const value = event.target.value;
                          const parsed = Number(value);
                          updatePlanDraft(task.id, {
                            estimateHours:
                              value === "" || Number.isNaN(parsed)
                                ? undefined
                                : parsed
                          });
                        }}
                        onBlur={() => commitPlanDraft(task.id)}
                      />
                      <select
                        value={impactValue}
                        onChange={(event) =>
                          updatePlanDraft(task.id, {
                            impact: event.target.value as Level
                          })
                        }
                        onBlur={() => commitPlanDraft(task.id)}
                      >
                        {levels.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                      <select
                        value={effortValue}
                        onChange={(event) =>
                          updatePlanDraft(task.id, {
                            effort: event.target.value as Level
                          })
                        }
                        onBlur={() => commitPlanDraft(task.id)}
                      >
                        {levels.map((level) => (
                          <option key={level} value={level}>
                            {level}
                          </option>
                        ))}
                      </select>
                      <div className="planner-deps">
                        <span>{deps.length}</span>
                        {unresolved.length > 0 ? (
                          <span className="muted">Blocked</span>
                        ) : (
                          <span className="muted">Clear</span>
                        )}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {activeView === "preferences" ? (
      <section id="preferences-section" className="preferences-shell reveal">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">Preference Lab</p>
            <h2>Decision Calibration</h2>
          </div>
          <div className="section-actions">
            <div className="pill">{preferenceQueue.length} in queue</div>
            <div className="pill ghost">{preferenceStats.total} total</div>
          </div>
        </div>

        <div className="preferences-grid">
          <div className="preferences-left">
            <div className="preference-stack">
              <div className="preference-card" ref={preferenceCardRef}>
                {preferenceQueue.length === 0 ? (
                  <div className="empty-state">
                    Preference queue is empty.
                  </div>
                ) : (
                  <>
                    <p className="section-eyebrow">OpenClaw prompt</p>
                    <h3>{preferenceQueue[0].prompt}</h3>
                    <p className="muted">
                      Choose the direction that best matches your intent.
                    </p>
                    <div className="preference-meter">
                      <label>
                        Confidence
                        <input
                          type="range"
                          min="1"
                          max="5"
                          value={preferenceConfidence}
                          onChange={(event) =>
                            setPreferenceConfidence(Number(event.target.value))
                          }
                        />
                      </label>
                      <span>{preferenceConfidence}/5</span>
                    </div>
                    <div className="preference-actions">
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() =>
                          handlePreferenceDecision(preferenceQueue[0], "left")
                        }
                      >
                        {preferenceQueue[0].leftLabel || "No"}
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() =>
                          handlePreferenceDecision(preferenceQueue[0], "skip")
                        }
                      >
                        Skip
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          handlePreferenceDecision(preferenceQueue[0], "right")
                        }
                      >
                        {preferenceQueue[0].rightLabel || "Yes"}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            <div className="preference-stats">
              <div>
                <span>Right</span>
                <strong>{preferenceStats.right}</strong>
              </div>
              <div>
                <span>Left</span>
                <strong>{preferenceStats.left}</strong>
              </div>
              <div>
                <span>Skipped</span>
                <strong>{preferenceStats.skip}</strong>
              </div>
            </div>
          </div>

          <div className="preferences-right">
            <div className="preference-form">
              <h3>New Preference Prompt</h3>
              <label>
                Prompt
                <textarea
                  rows={3}
                  value={preferenceDraft.prompt}
                  onChange={(event) =>
                    setPreferenceDraft((prev) => ({
                      ...prev,
                      prompt: event.target.value
                    }))
                  }
                />
              </label>
              <div className="preference-row">
                <label>
                  Left label
                  <input
                    type="text"
                    value={preferenceDraft.leftLabel}
                    onChange={(event) =>
                      setPreferenceDraft((prev) => ({
                        ...prev,
                        leftLabel: event.target.value
                      }))
                    }
                  />
                </label>
                <label>
                  Right label
                  <input
                    type="text"
                    value={preferenceDraft.rightLabel}
                    onChange={(event) =>
                      setPreferenceDraft((prev) => ({
                        ...prev,
                        rightLabel: event.target.value
                      }))
                    }
                  />
                </label>
              </div>
              <label>
                Notes / OpenClaw hint
                <textarea
                  rows={2}
                  value={preferenceDraft.notes}
                  onChange={(event) =>
                    setPreferenceDraft((prev) => ({
                      ...prev,
                      notes: event.target.value
                    }))
                  }
                />
              </label>
              <div className="script-tags">
                <span>Tags</span>
                {tags.length === 0 ? (
                  <p className="muted">Create tags to label preferences.</p>
                ) : (
                  <div className="tag-select">
                    {tags.map((tag) => (
                      <label key={tag.id} className="tag-checkbox">
                        <input
                          type="checkbox"
                          checked={preferenceDraft.tags.includes(tag.id)}
                          onChange={() => togglePreferenceTag(tag.id)}
                        />
                        <span style={{ background: tag.color }} />
                        {tag.label}
                      </label>
                    ))}
                  </div>
                )}
              </div>
              <div className="form-actions">
                <button type="button" onClick={submitPreference}>
                  Add preference
                </button>
              </div>
            </div>

            <div className="preference-list">
              {preferences.length === 0 ? (
                <div className="empty-state">No preferences captured.</div>
              ) : (
                preferences.map((preference) => (
                  <div key={preference.id} className="preference-row-card">
                    <div>
                      <strong>{preference.prompt}</strong>
                      <p className="muted">
                        Decision: {preference.decision}
                      </p>
                    </div>
                    <div className="preference-actions-inline">
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() =>
                          updatePreference(preference.id, {
                            decision: "unset"
                          })
                        }
                      >
                        Reset
                      </button>
                      <button
                        type="button"
                        className="ghost-button danger"
                        onClick={() => deletePreference(preference.id)}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </section>
      ) : null}

      {activeView === "experiments" ? (
      <section id="experiments-section" className="experiments-shell reveal">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">Experiment Tracker</p>
            <h2>Hypotheses & Test Outcomes</h2>
          </div>
          <div className="section-actions">
            <div className="pill">{experiments.length} experiments</div>
          </div>
        </div>

        <div className="experiments-layout">
          <div className="experiment-form">
            <h3>{editingExperimentId ? "Edit Experiment" : "New Experiment"}</h3>
            <label>
              Title
              <input
                type="text"
                value={experimentDraft.title}
                onChange={(event) =>
                  setExperimentDraft((prev) => ({
                    ...prev,
                    title: event.target.value
                  }))
                }
              />
            </label>
            <label>
              Hypothesis
              <textarea
                rows={3}
                value={experimentDraft.hypothesis}
                onChange={(event) =>
                  setExperimentDraft((prev) => ({
                    ...prev,
                    hypothesis: event.target.value
                  }))
                }
              />
            </label>
            <label>
              Metric
              <input
                type="text"
                value={experimentDraft.metric}
                onChange={(event) =>
                  setExperimentDraft((prev) => ({
                    ...prev,
                    metric: event.target.value
                  }))
                }
              />
            </label>
            <div className="experiment-row">
              <label>
                Status
                <select
                  value={experimentDraft.status}
                  onChange={(event) =>
                    setExperimentDraft((prev) => ({
                      ...prev,
                      status: event.target.value as ExperimentStatus
                    }))
                  }
                >
                  {experimentStatuses.map((status) => (
                    <option key={status} value={status}>
                      {status}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Result
                <select
                  value={experimentDraft.result}
                  onChange={(event) =>
                    setExperimentDraft((prev) => ({
                      ...prev,
                      result: event.target.value as ExperimentResult
                    }))
                  }
                >
                  {experimentResults.map((result) => (
                    <option key={result} value={result}>
                      {result}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="experiment-row">
              <label>
                Start date
                <input
                  type="date"
                  value={experimentDraft.startDate}
                  onChange={(event) =>
                    setExperimentDraft((prev) => ({
                      ...prev,
                      startDate: event.target.value
                    }))
                  }
                />
              </label>
              <label>
                End date
                <input
                  type="date"
                  value={experimentDraft.endDate}
                  onChange={(event) =>
                    setExperimentDraft((prev) => ({
                      ...prev,
                      endDate: event.target.value
                    }))
                  }
                />
              </label>
            </div>
            <label>
              Owner
              <input
                type="text"
                value={experimentDraft.owner}
                onChange={(event) =>
                  setExperimentDraft((prev) => ({
                    ...prev,
                    owner: event.target.value
                  }))
                }
              />
            </label>
            <label>
              Notes
              <textarea
                rows={3}
                value={experimentDraft.notes}
                onChange={(event) =>
                  setExperimentDraft((prev) => ({
                    ...prev,
                    notes: event.target.value
                  }))
                }
              />
            </label>
            <div className="script-tags">
              <span>Tags</span>
              {tags.length === 0 ? (
                <p className="muted">Create tags to label experiments.</p>
              ) : (
                <div className="tag-select">
                  {tags.map((tag) => (
                    <label key={tag.id} className="tag-checkbox">
                      <input
                        type="checkbox"
                        checked={experimentDraft.tags.includes(tag.id)}
                        onChange={() => toggleExperimentTag(tag.id)}
                      />
                      <span style={{ background: tag.color }} />
                      {tag.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <div className="form-actions">
              <button type="button" onClick={submitExperiment}>
                {editingExperimentId ? "Save changes" : "Save experiment"}
              </button>
              {editingExperimentId ? (
                <button
                  type="button"
                  className="ghost-button"
                  onClick={cancelEditExperiment}
                >
                  Cancel
                </button>
              ) : null}
            </div>
          </div>

          <div className="experiment-grid" ref={experimentsRef}>
            {experiments.length === 0 ? (
              <div className="empty-state">No experiments yet.</div>
            ) : (
              experiments.map((experiment) => (
                <div key={experiment.id} className="experiment-card">
                  <div className="experiment-header">
                    <div>
                      <h3>{experiment.title}</h3>
                      <p>{experiment.hypothesis || "No hypothesis"}</p>
                    </div>
                    <span className="status-pill" data-status={experiment.status}>
                      {experiment.status}
                    </span>
                  </div>
                  <div className="experiment-meta">
                    <span>Metric: {experiment.metric || "--"}</span>
                    <span>Result: {experiment.result}</span>
                  </div>
                  <div className="experiment-dates">
                    <span>
                      Start {formatShortDate(experiment.startDate)}
                    </span>
                    <span>End {formatShortDate(experiment.endDate)}</span>
                  </div>
                  <div className="script-tags">
                    {experiment.tags.length === 0 ? (
                      <span className="muted">No tags</span>
                    ) : (
                      experiment.tags.map((tagId) => (
                        <span
                          key={tagId}
                          className="tag-dot"
                          style={{ background: getTagColor(tagId, tags) }}
                        />
                      ))
                    )}
                  </div>
                  <div className="script-actions">
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => startEditExperiment(experiment)}
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      className="ghost-button danger"
                      onClick={() => deleteExperiment(experiment.id)}
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
      ) : null}

      {activeView === "scripts" ? (
      <section id="scripts-section" className="scripts-shell reveal">
        <div className="section-header">
          <div>
            <p className="section-eyebrow">Scripts</p>
            <h2>Mini-Scripts Registry</h2>
          </div>
          <div className="section-actions">
            <div className="pill">{scripts.length} scripts</div>
          </div>
        </div>

        <div className="scripts-layout">
          <div className="script-form">
            <h3>{editingScriptId ? "Edit Script" : "New Script"}</h3>
            <label>
              Name
              <input
                type="text"
                value={scriptDraft.name}
                onChange={(event) =>
                  setScriptDraft((prev) => ({
                    ...prev,
                    name: event.target.value
                  }))
                }
              />
            </label>
            <label>
              Description
              <textarea
                rows={3}
                value={scriptDraft.description}
                onChange={(event) =>
                  setScriptDraft((prev) => ({
                    ...prev,
                    description: event.target.value
                  }))
                }
              />
            </label>
            <label>
              Command
              <textarea
                rows={3}
                value={scriptDraft.command}
                onChange={(event) =>
                  setScriptDraft((prev) => ({
                    ...prev,
                    command: event.target.value
                  }))
                }
              />
            </label>
            <div className="script-tags">
              <span>Tags</span>
              {tags.length === 0 ? (
                <p className="muted">Create tags to label scripts.</p>
              ) : (
                <div className="tag-select">
                  {tags.map((tag) => (
                    <label key={tag.id} className="tag-checkbox">
                      <input
                        type="checkbox"
                        checked={scriptDraft.tags.includes(tag.id)}
                        onChange={() => toggleScriptTag(tag.id)}
                      />
                      <span style={{ background: tag.color }} />
                      {tag.label}
                    </label>
                  ))}
                </div>
              )}
            </div>
            <label className="favorite-toggle">
              <input
                type="checkbox"
                checked={scriptDraft.favorite}
                onChange={(event) =>
                  setScriptDraft((prev) => ({
                    ...prev,
                    favorite: event.target.checked
                  }))
                }
              />
              Favorite
            </label>
            <div className="form-actions">
              <button type="button" onClick={submitScript}>
                {editingScriptId ? "Save changes" : "Save script"}
              </button>
              {editingScriptId ? (
                <button type="button" className="ghost-button" onClick={cancelEditScript}>
                  Cancel
                </button>
              ) : null}
            </div>
          </div>

          <div className="script-grid" ref={scriptsRef}>
            {scripts.length === 0 ? (
              <div className="empty-state">No scripts yet.</div>
            ) : (
              scripts
                .slice()
                .sort((a, b) => Number(b.favorite) - Number(a.favorite))
                .map((script) => (
                  <div key={script.id} className="script-card">
                    <div className="script-header">
                      <div>
                        <h3>{script.name}</h3>
                        <p>{script.description || "No description"}</p>
                      </div>
                      <button
                        type="button"
                        className={
                          script.favorite ? "icon-button active" : "icon-button"
                        }
                        onClick={() => toggleFavoriteScript(script)}
                        aria-label={
                          script.favorite
                            ? "Unfavorite script"
                            : "Favorite script"
                        }
                      >
                        ★
                      </button>
                    </div>
                    <div className="script-command">
                      <code>{script.command}</code>
                    </div>
                    <div className="script-tags">
                      {script.tags.length === 0 ? (
                        <span className="muted">No tags</span>
                      ) : (
                        script.tags.map((tagId) => (
                          <span
                            key={tagId}
                            className="tag-dot"
                            style={{ background: getTagColor(tagId, tags) }}
                          />
                        ))
                      )}
                    </div>
                    <div className="script-actions">
                      <button
                        type="button"
                        onClick={() => handleCopyScript(script)}
                      >
                        {copiedScriptId === script.id ? "Copied" : "Copy"}
                      </button>
                      <button
                        type="button"
                        className="ghost-button"
                        onClick={() => startEditScript(script)}
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        className="ghost-button danger"
                        onClick={() => deleteScript(script.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                ))
            )}
          </div>
        </div>
      </section>
      ) : null}

      {selectedTask ? (
        <TaskDrawer
          task={selectedTask}
          tags={tags}
          tasks={tasks}
          onClose={() => setSelectedTaskId(null)}
          onUpdate={updateTask}
          onDelete={deleteTask}
        />
      ) : null}

      {pendingMove ? (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Definition of Done incomplete</h3>
            <p>
              This task has unchecked Definition of Done items. Move it to Done
              anyway?
            </p>
            <div className="modal-actions">
              <button
                type="button"
                onClick={() => {
                  moveTask(pendingMove.taskId, pendingMove.columnId);
                  setPendingMove(null);
                }}
              >
                Move anyway
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setPendingMove(null)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {showTagManager ? (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Manage Tags</h3>
            <label>
              Label
              <input
                type="text"
                value={tagDraft.label}
                onChange={(event) =>
                  setTagDraft((prev) => ({
                    ...prev,
                    label: event.target.value
                  }))
                }
              />
            </label>
            <label>
              Color
              <input
                type="color"
                value={tagDraft.color}
                onChange={(event) =>
                  setTagDraft((prev) => ({
                    ...prev,
                    color: event.target.value
                  }))
                }
              />
            </label>
            <div className="modal-actions">
              <button type="button" onClick={createTag}>
                Add tag
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setShowTagManager(false)}
              >
                Close
              </button>
            </div>
            <div className="tag-list">
              {tags.length === 0 ? (
                <p className="muted">No tags created.</p>
              ) : (
                tags.map((tag) => (
                  <div key={tag.id} className="tag-row">
                    <span className="tag-swatch" style={{ background: tag.color }} />
                    <span>{tag.label}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

type TaskDrawerProps = {
  task: Task;
  tags: Tag[];
  tasks: Task[];
  onClose: () => void;
  onUpdate: (taskId: string, patch: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
};

function TaskDrawer({
  task,
  tags,
  tasks,
  onClose,
  onUpdate,
  onDelete
}: TaskDrawerProps) {
  const [draft, setDraft] = useState({
    title: task.title,
    description: task.description,
    notes: task.notes,
    priority: task.priority,
    tags: task.tags,
    estimateHours: task.estimateHours ?? 0,
    dueDate: formatInputDate(task.dueDate),
    impact: task.impact ?? "Medium",
    effort: task.effort ?? "Medium",
    dependencies: task.dependencies ?? [],
    confidence: task.confidence ?? 3
  });
  const [privateDraft, setPrivateDraft] = useState({
    sensitiveNotes: task.sensitiveNotes ?? "",
    privateNumbers: task.privateNumbers ?? ""
  });
  const [privateVisible, setPrivateVisible] = useState(false);
  const [accessGranted, setAccessGranted] = useState(false);
  const [showAccessPrompt, setShowAccessPrompt] = useState(false);
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [newDefinitionItem, setNewDefinitionItem] = useState("");
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.sessionStorage.getItem("jarvis_private_access");
    setAccessGranted(stored === "true");
  }, []);

  useEffect(() => {
    setDraft({
      title: task.title,
      description: task.description,
      notes: task.notes,
      priority: task.priority,
      tags: task.tags,
      estimateHours: task.estimateHours ?? 0,
      dueDate: formatInputDate(task.dueDate),
      impact: task.impact ?? "Medium",
      effort: task.effort ?? "Medium",
      dependencies: task.dependencies ?? [],
      confidence: task.confidence ?? 3
    });
    setPrivateDraft({
      sensitiveNotes: task.sensitiveNotes ?? "",
      privateNumbers: task.privateNumbers ?? ""
    });
    setPrivateVisible(false);
    setShowAccessPrompt(false);
  }, [task]);

  const toggleTag = (tagId: string) => {
    setDraft((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter((id) => id !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  const toggleDependency = (taskId: string) => {
    setDraft((prev) => ({
      ...prev,
      dependencies: prev.dependencies.includes(taskId)
        ? prev.dependencies.filter((id) => id !== taskId)
        : [...prev.dependencies, taskId]
    }));
  };

  const saveDraft = () => {
    onUpdate(task.id, {
      title: draft.title.trim() || task.title,
      description: draft.description,
      notes: draft.notes,
      sensitiveNotes: privateDraft.sensitiveNotes,
      privateNumbers: privateDraft.privateNumbers,
      priority: draft.priority,
      tags: draft.tags,
      estimateHours: draft.estimateHours,
      dueDate: draft.dueDate ? new Date(draft.dueDate).toISOString() : undefined,
      impact: draft.impact,
      effort: draft.effort,
      dependencies: draft.dependencies,
      confidence: draft.confidence
    });
  };

  const requestPrivateReveal = () => {
    if (privateVisible) {
      setPrivateVisible(false);
      return;
    }
    if (accessGranted) {
      setPrivateVisible(true);
      return;
    }
    setShowAccessPrompt(true);
  };

  const allowPrivateAccess = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem("jarvis_private_access", "true");
    }
    setAccessGranted(true);
    setShowAccessPrompt(false);
    setPrivateVisible(true);
  };

  const updateChecklist = (items: ChecklistItem[]) => {
    onUpdate(task.id, { checklist: items });
  };

  const updateDefinition = (items: ChecklistItem[]) => {
    onUpdate(task.id, { definitionOfDone: items });
  };

  const toggleChecklistItem = (items: ChecklistItem[], itemId: string) => {
    return items.map((item) =>
      item.id === itemId ? { ...item, done: !item.done } : item
    );
  };

  const addChecklistItem = (
    items: ChecklistItem[],
    text: string
  ): ChecklistItem[] => {
    const trimmed = text.trim();
    if (!trimmed) return items;
    return [
      ...items,
      {
        id: createClientId(),
        text: trimmed,
        done: false
      }
    ];
  };

  const removeChecklistItem = (items: ChecklistItem[], itemId: string) => {
    return items.filter((item) => item.id !== itemId);
  };

  const addLink = (links: LinkItem[]) => {
    const label = newLinkLabel.trim();
    const url = newLinkUrl.trim();
    if (!label || !url) return;

    const next: LinkItem[] = [
      ...links,
      {
        id: createClientId(),
        label,
        url
      }
    ];
    onUpdate(task.id, { links: next });
    setNewLinkLabel("");
    setNewLinkUrl("");
  };

  const removeLink = (links: LinkItem[], linkId: string) => {
    const next = links.filter((link) => link.id !== linkId);
    onUpdate(task.id, { links: next });
  };

  const checklist = task.checklist ?? [];
  const definition = task.definitionOfDone ?? [];
  const links = task.links ?? [];

  return (
    <>
      <div className="drawer-overlay" onClick={onClose} />
      <aside className="drawer">
        <div className="drawer-header">
          <div>
            <p className="eyebrow">Task Detail</p>
            <h2>{task.title}</h2>
          </div>
          <button type="button" className="ghost-button" onClick={onClose}>
            Close
          </button>
        </div>

        <div className="drawer-body">
          <label>
            Title
            <input
              type="text"
              value={draft.title}
              onChange={(event) =>
                setDraft((prev) => ({ ...prev, title: event.target.value }))
              }
            />
          </label>

          <label>
            Priority
            <select
              value={draft.priority}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  priority: event.target.value as Priority
                }))
              }
            >
              {priorities.map((priority) => (
                <option key={priority} value={priority}>
                  {priority}
                </option>
              ))}
            </select>
          </label>

          <div className="drawer-section">
            <span className="section-label">Tags</span>
            {tags.length === 0 ? (
              <p className="muted">No tags yet.</p>
            ) : (
              <div className="tag-select">
                {tags.map((tag) => (
                  <label key={tag.id} className="tag-checkbox">
                    <input
                      type="checkbox"
                      checked={draft.tags.includes(tag.id)}
                      onChange={() => toggleTag(tag.id)}
                    />
                    <span style={{ background: tag.color }} />
                    {tag.label}
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="drawer-section">
            <div className="section-header">
              <div>
                <p className="section-eyebrow">Planning</p>
                <h3>Effort & Timing</h3>
              </div>
            </div>
            <div className="planning-grid">
              <label>
                Due date
                <input
                  type="date"
                  value={draft.dueDate}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      dueDate: event.target.value
                    }))
                  }
                />
              </label>
              <label>
                Estimate (hours)
                <input
                  type="number"
                  min="0"
                  step="0.5"
                  value={draft.estimateHours ?? 0}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      estimateHours: Number(event.target.value || 0)
                    }))
                  }
                />
              </label>
            </div>
            <div className="planning-grid">
              <label>
                Impact
                <select
                  value={draft.impact}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      impact: event.target.value as Level
                    }))
                  }
                >
                  {levels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Effort
                <select
                  value={draft.effort}
                  onChange={(event) =>
                    setDraft((prev) => ({
                      ...prev,
                      effort: event.target.value as Level
                    }))
                  }
                >
                  {levels.map((level) => (
                    <option key={level} value={level}>
                      {level}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <label>
              Confidence ({draft.confidence}/5)
              <input
                type="range"
                min="1"
                max="5"
                value={draft.confidence}
                onChange={(event) =>
                  setDraft((prev) => ({
                    ...prev,
                    confidence: Number(event.target.value)
                  }))
                }
              />
            </label>
            <div className="dependency-block">
              <span className="section-label">Dependencies</span>
              {tasks.filter((item) => item.id !== task.id).length === 0 ? (
                <p className="muted">No other tasks yet.</p>
              ) : (
                <div className="tag-select">
                  {tasks
                    .filter((item) => item.id !== task.id)
                    .map((item) => (
                      <label key={item.id} className="tag-checkbox">
                        <input
                          type="checkbox"
                          checked={draft.dependencies.includes(item.id)}
                          onChange={() => toggleDependency(item.id)}
                        />
                        <span className="tag-dot" />
                        {item.title}
                      </label>
                    ))}
                </div>
              )}
            </div>
          </div>

          <label>
            Description
            <textarea
              rows={4}
              value={draft.description}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  description: event.target.value
                }))
              }
            />
          </label>

          <label>
            Notes
            <textarea
              rows={4}
              value={draft.notes}
              onChange={(event) =>
                setDraft((prev) => ({
                  ...prev,
                  notes: event.target.value
                }))
              }
            />
          </label>

          <div className="drawer-section private-section">
            <div className="section-header">
              <div>
                <p className="section-eyebrow">Private</p>
                <h3>Encrypted fields</h3>
              </div>
              <div className="private-actions">
                <button
                  type="button"
                  className="ghost-button"
                  onClick={requestPrivateReveal}
                >
                  {privateVisible ? "Hide" : "Reveal"}
                </button>
              </div>
            </div>
            <p className="muted">
              Stored encrypted at rest. Reveal to view or edit.
            </p>
            <div className="private-fields">
              <label>
                Sensitive notes
                <textarea
                  rows={3}
                  className={`private-field ${privateVisible ? "reveal" : ""}`}
                  value={privateVisible ? privateDraft.sensitiveNotes : ""}
                  placeholder={
                    privateVisible
                      ? "Add sensitive notes…"
                      : "Hidden. Click Reveal to view."
                  }
                  onChange={(event) =>
                    setPrivateDraft((prev) => ({
                      ...prev,
                      sensitiveNotes: event.target.value
                    }))
                  }
                  disabled={!privateVisible}
                />
              </label>
              <label>
                Private numbers
                <textarea
                  rows={3}
                  className={`private-field ${privateVisible ? "reveal" : ""}`}
                  value={privateVisible ? privateDraft.privateNumbers : ""}
                  placeholder={
                    privateVisible
                      ? "Store countable info (JSON, lists, totals)…"
                      : "Hidden. Click Reveal to view."
                  }
                  onChange={(event) =>
                    setPrivateDraft((prev) => ({
                      ...prev,
                      privateNumbers: event.target.value
                    }))
                  }
                  disabled={!privateVisible}
                />
              </label>
            </div>
          </div>

          <div className="drawer-section">
            <div className="section-header">
              <div>
                <p className="section-eyebrow">Checklist</p>
                <h3>Subtasks</h3>
              </div>
            </div>
            <div className="checklist">
              {checklist.length === 0 ? (
                <p className="muted">No subtasks yet.</p>
              ) : (
                checklist.map((item) => (
                  <label key={item.id} className="check-item">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() =>
                        updateChecklist(toggleChecklistItem(checklist, item.id))
                      }
                    />
                    <span>{item.text}</span>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() =>
                        updateChecklist(removeChecklistItem(checklist, item.id))
                      }
                    >
                      Remove
                    </button>
                  </label>
                ))
              )}
            </div>
            <div className="check-add">
              <input
                type="text"
                placeholder="Add a subtask"
                value={newChecklistItem}
                onChange={(event) => setNewChecklistItem(event.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  const next = addChecklistItem(checklist, newChecklistItem);
                  updateChecklist(next);
                  setNewChecklistItem("");
                }}
              >
                Add
              </button>
            </div>
          </div>

          <div className="drawer-section">
            <div className="section-header">
              <div>
                <p className="section-eyebrow">Definition of Done</p>
                <h3>Quality Checklist</h3>
              </div>
              <span className="pill">
                {definition.filter((item) => item.done).length}/{
                  definition.length
                }
              </span>
            </div>
            <div className="checklist">
              {definition.length === 0 ? (
                <p className="muted">No quality checklist yet.</p>
              ) : (
                definition.map((item) => (
                  <label key={item.id} className="check-item">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() =>
                        updateDefinition(toggleChecklistItem(definition, item.id))
                      }
                    />
                    <span>{item.text}</span>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() =>
                        updateDefinition(removeChecklistItem(definition, item.id))
                      }
                    >
                      Remove
                    </button>
                  </label>
                ))
              )}
            </div>
            <div className="check-add">
              <input
                type="text"
                placeholder="Add a quality check"
                value={newDefinitionItem}
                onChange={(event) => setNewDefinitionItem(event.target.value)}
              />
              <button
                type="button"
                onClick={() => {
                  const next = addChecklistItem(definition, newDefinitionItem);
                  updateDefinition(next);
                  setNewDefinitionItem("");
                }}
              >
                Add
              </button>
            </div>
          </div>

          <div className="drawer-section">
            <div className="section-header">
              <div>
                <p className="section-eyebrow">Links</p>
                <h3>References</h3>
              </div>
            </div>
            <div className="link-list">
              {links.length === 0 ? (
                <p className="muted">No links yet.</p>
              ) : (
                links.map((link) => (
                  <div key={link.id} className="link-item">
                    <div>
                      <strong>{link.label}</strong>
                      <a href={link.url} target="_blank" rel="noreferrer">
                        {link.url}
                      </a>
                    </div>
                    <button
                      type="button"
                      className="ghost-button"
                      onClick={() => removeLink(links, link.id)}
                    >
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
            <div className="link-add">
              <input
                type="text"
                placeholder="Label"
                value={newLinkLabel}
                onChange={(event) => setNewLinkLabel(event.target.value)}
              />
              <input
                type="url"
                placeholder="https://"
                value={newLinkUrl}
                onChange={(event) => setNewLinkUrl(event.target.value)}
              />
              <button type="button" onClick={() => addLink(links)}>
                Add link
              </button>
            </div>
          </div>

          <div className="drawer-footer">
            <div className="timestamp">
              Created {formatTimestamp(task.createdAt)}
            </div>
            <div className="timestamp">
              Updated {formatTimestamp(task.updatedAt)}
            </div>
          </div>
        </div>

        <div className="drawer-actions">
          <button type="button" onClick={saveDraft}>
            Save changes
          </button>
          <button
            type="button"
            className="ghost-button danger"
            onClick={() => onDelete(task.id)}
          >
            Delete task
          </button>
        </div>
      </aside>

      {showAccessPrompt ? (
        <div className="modal-overlay">
          <div className="modal">
            <h3>Allow access to private fields now?</h3>
            <p className="muted">
              Private fields are encrypted at rest. Allowing access will reveal
              them on this device for this session.
            </p>
            <div className="modal-actions">
              <button type="button" onClick={allowPrivateAccess}>
                Allow
              </button>
              <button
                type="button"
                className="ghost-button"
                onClick={() => setShowAccessPrompt(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
