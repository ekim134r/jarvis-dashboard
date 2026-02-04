"use client";

import { useEffect, useMemo, useState } from "react";
import type { DragEvent } from "react";
import Clock from "@/components/Clock";
import type {
  ChecklistItem,
  Column,
  LinkItem,
  Priority,
  Script,
  Tag,
  Task
} from "@/lib/types";

const priorities: Priority[] = ["Low", "Medium", "High"];

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "2-digit",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit"
});

function formatTimestamp(value?: string) {
  if (!value) return "--";
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return value;
  return dateFormatter.format(parsed);
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

export default function SecondBrain() {
  const [columns, setColumns] = useState<Column[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [tags, setTags] = useState<Tag[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [search, setSearch] = useState("");
  const [activeTags, setActiveTags] = useState<string[]>([]);
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
  const [scriptDraft, setScriptDraft] = useState<ScriptDraft>({
    name: "",
    description: "",
    command: "",
    tags: [],
    favorite: false
  });
  const [editingScriptId, setEditingScriptId] = useState<string | null>(null);
  const [copiedScriptId, setCopiedScriptId] = useState<string | null>(null);

  const selectedTask = tasks.find((task) => task.id === selectedTaskId) ?? null;

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

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [columnsData, tasksData, tagsData, scriptsData] =
          await Promise.all([
            fetchJson<Column[]>("/api/columns"),
            fetchJson<Task[]>("/api/tasks"),
            fetchJson<Tag[]>("/api/tags"),
            fetchJson<Script[]>("/api/scripts")
          ]);
        setColumns(columnsData);
        setTasks(tasksData);
        setTags(tagsData);
        setScripts(scriptsData);
      } catch (err) {
        setError("Unable to load data. Please refresh the page.");
      } finally {
        setLoading(false);
      }
    };

    loadAll();
  }, []);

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
    } catch (err) {
      setError("Clipboard copy failed. Please retry.");
    }
  };

  const isDefinitionDone = (task: Task) => {
    if (!task.definitionOfDone || task.definitionOfDone.length === 0) return true;
    return task.definitionOfDone.every((item) => item.done);
  };

  const moveTask = (taskId: string, columnId: string) => {
    updateTask(taskId, { columnId });
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

  return (
    <main className="second-brain">
      <header className="page-header">
        <div>
          <p className="eyebrow">Second Brain</p>
          <h1>Jarvis Workbench</h1>
          <p className="subtext">
            A single-user command center for tasks, scripts, and operational
            memory.
          </p>
        </div>
        <div className="header-panels">
          <div className="stats-panel">
            <div>
              <span>Total tasks</span>
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
          <div className="time-panel">
            <div className="panel-label">Local Time</div>
            <Clock />
          </div>
        </div>
      </header>

      <section className="filters">
        <div className="search-block">
          <label htmlFor="task-search">Search tasks</label>
          <input
            id="task-search"
            type="search"
            placeholder="Search by title, notes, or description"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        <div className="tag-filters">
          <div className="tag-filter-header">
            <span>Filter tags</span>
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

      <section className="board-section">
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
                        className="card"
                        draggable
                        onDragStart={(event) => handleDragStart(event, task.id)}
                        onClick={() => setSelectedTaskId(task.id)}
                      >
                        <div className="card-title">{task.title}</div>
                        <div className="card-tags">
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
                        <div className="card-meta">
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

                    <div className="card composer">
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

      <section className="scripts-section">
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

          <div className="script-grid">
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

      {selectedTask ? (
        <TaskDrawer
          task={selectedTask}
          tags={tags}
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
  onClose: () => void;
  onUpdate: (taskId: string, patch: Partial<Task>) => void;
  onDelete: (taskId: string) => void;
};

function TaskDrawer({ task, tags, onClose, onUpdate, onDelete }: TaskDrawerProps) {
  const [draft, setDraft] = useState({
    title: task.title,
    description: task.description,
    notes: task.notes,
    priority: task.priority,
    tags: task.tags
  });
  const [newChecklistItem, setNewChecklistItem] = useState("");
  const [newDefinitionItem, setNewDefinitionItem] = useState("");
  const [newLinkLabel, setNewLinkLabel] = useState("");
  const [newLinkUrl, setNewLinkUrl] = useState("");

  useEffect(() => {
    setDraft({
      title: task.title,
      description: task.description,
      notes: task.notes,
      priority: task.priority,
      tags: task.tags
    });
  }, [task]);

  const toggleTag = (tagId: string) => {
    setDraft((prev) => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter((id) => id !== tagId)
        : [...prev.tags, tagId]
    }));
  };

  const saveDraft = () => {
    onUpdate(task.id, {
      title: draft.title.trim() || task.title,
      description: draft.description,
      notes: draft.notes,
      priority: draft.priority,
      tags: draft.tags
    });
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
    </>
  );
}
