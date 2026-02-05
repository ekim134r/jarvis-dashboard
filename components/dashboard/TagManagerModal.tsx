"use client";

import React from "react";
import type { Tag } from "@/lib/types";

type TagDraft = {
  label: string;
  color: string;
};

type TagManagerModalProps = {
  open: boolean;
  tags: Tag[];
  tagDraft: TagDraft;
  setTagDraft: (val: TagDraft | ((prev: TagDraft) => TagDraft)) => void;
  editingTagId: string | null;
  setEditingTagId: (id: string | null) => void;
  onClose: () => void;
  submitTag: () => void;
  deleteTag: (id: string) => void;
};

export default function TagManagerModal({
  open,
  tags,
  tagDraft,
  setTagDraft,
  editingTagId,
  setEditingTagId,
  onClose,
  submitTag,
  deleteTag
}: TagManagerModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 px-4 py-10 backdrop-blur-sm">
      <div className="w-full max-w-3xl rounded-3xl border border-border bg-surface p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <div>
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-muted/80">
              Tag Manager
            </div>
            <h3 className="text-2xl font-bold text-text">Curate your signals</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold text-muted hover:text-text"
          >
            Close
          </button>
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[320px_1fr]">
          <div className="rounded-2xl border border-border bg-surface-muted/70 p-4">
            <div className="text-sm font-bold text-text">
              {editingTagId ? "Edit tag" : "New tag"}
            </div>
            <label className="mt-4 block text-xs font-semibold text-muted">
              Label
              <input
                value={tagDraft.label}
                onChange={(e) => setTagDraft((prev) => ({ ...prev, label: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="e.g. Backend"
              />
            </label>
            <label className="mt-4 block text-xs font-semibold text-muted">
              Color
              <input
                value={tagDraft.color}
                onChange={(e) => setTagDraft((prev) => ({ ...prev, color: e.target.value }))}
                className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
                placeholder="#61f4ff"
              />
            </label>
            <div className="mt-4 flex gap-2">
              <button
                onClick={submitTag}
                className="flex-1 rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-md transition-transform hover:-translate-y-0.5"
              >
                {editingTagId ? "Update tag" : "Create tag"}
              </button>
              {editingTagId && (
                <button
                  onClick={() => {
                    setEditingTagId(null);
                    setTagDraft({ label: "", color: "#94a3b8" });
                  }}
                  className="rounded-xl border border-border bg-surface px-4 py-2 text-sm font-semibold text-muted hover:bg-surface-muted"
                >
                  Cancel
                </button>
              )}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface-muted/40 p-4">
            <div className="text-sm font-bold text-text">Existing tags</div>
            {tags.length === 0 ? (
              <div className="mt-4 rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted">
                No tags yet. Create your first signal bucket.
              </div>
            ) : (
              <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {tags.map((tag) => (
                  <div
                    key={tag.id}
                    className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2 transition-all hover:border-primary/30 hover:shadow-sm"
                  >
                    <span className="flex items-center gap-2">
                      <span
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: tag.color }}
                      />
                      <span className="text-sm font-semibold text-text">{tag.label}</span>
                    </span>
                    <span className="flex items-center gap-2">
                      <button
                        onClick={() => {
                          setEditingTagId(tag.id);
                          setTagDraft({ label: tag.label, color: tag.color });
                        }}
                        className="rounded-lg border border-border bg-surface px-2 py-1 text-[11px] font-semibold text-muted hover:text-text"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => deleteTag(tag.id)}
                        className="rounded-lg border border-danger/30 bg-danger/10 px-2 py-1 text-[11px] font-semibold text-danger"
                      >
                        Delete
                      </button>
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
