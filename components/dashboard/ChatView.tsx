"use client";

import React, { useEffect, useRef } from "react";
import type { ChatMessage } from "@/lib/types";

type ModelMode = "flash" | "flash-reasoning" | "pro";
type ThinkingLevel = "low" | "medium" | "high";

type ChatViewProps = {
  messages: ChatMessage[];
  input: string;
  setInput: (val: string) => void;
  onSend: () => void;
  loading: boolean;
  modelMode: ModelMode;
  setModelMode: (mode: ModelMode) => void;
  thinkingLevel: ThinkingLevel;
  setThinkingLevel: (level: ThinkingLevel) => void;
};

export default function ChatView({
  messages,
  input,
  setInput,
  onSend,
  loading,
  modelMode,
  setModelMode,
  thinkingLevel,
  setThinkingLevel,
}: ChatViewProps) {
  const endRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  return (
    <section id="chat-section" className="view-shell view-chat reveal rounded-2xl border border-border bg-surface p-6 shadow-md">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-1 text-[11px] font-bold uppercase tracking-wider text-muted">Live Chat</p>
          <h2 className="font-display text-xl font-bold text-text">Moltbot Console</h2>
        </div>
        <div className="flex flex-wrap items-center gap-2 rounded-full border border-border bg-surface-muted px-3 py-1 text-xs font-medium text-muted">
          <span>Realtime</span>
          <span className="h-1 w-1 rounded-full bg-muted" />
          <span>No Batch</span>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_260px]">
        <div className="flex h-[480px] flex-col overflow-hidden rounded-2xl border border-border bg-surface-muted/50">
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 ? (
              <div className="flex h-full flex-col items-center justify-center gap-3 text-center text-sm text-muted">
                <div className="rounded-2xl border border-dashed border-border bg-surface px-4 py-3">
                  Start a realtime conversation with Moltbot.
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm shadow-sm ${
                      msg.role === "user"
                        ? "bg-primary text-white"
                        : "bg-surface text-text border border-border"
                    }`}
                  >
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                    {msg.model && (
                      <div className="mt-1 text-[10px] text-muted/80">Model: {msg.model}</div>
                    )}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl border border-border bg-surface px-4 py-2 text-sm text-muted">
                  Thinking…
                </div>
              </div>
            )}
            <div ref={endRef} />
          </div>
          <div className="border-t border-border bg-surface px-4 py-3">
            <div className="flex items-center gap-2">
              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                className="flex-1 resize-none rounded-xl border border-border bg-surface-muted/50 px-3 py-2 text-sm text-text focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/10"
                placeholder="Ask Moltbot…"
              />
              <button
                onClick={onSend}
                disabled={loading || !input.trim()}
                className="rounded-xl bg-primary px-4 py-2 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-transform hover:-translate-y-0.5 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        <aside className="rounded-2xl border border-border bg-surface-muted/40 p-4">
          <div className="text-sm font-bold text-text">Model routing</div>
          <label className="mt-3 block text-xs font-semibold text-muted">
            Mode
            <select
              value={modelMode}
              onChange={(e) => setModelMode(e.target.value as ModelMode)}
              className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
            >
              <option value="flash">Flash</option>
              <option value="flash-reasoning">Flash-Reasoning</option>
              <option value="pro">Pro</option>
            </select>
          </label>

          <label className="mt-4 block text-xs font-semibold text-muted">
            Thinking level
            <select
              value={thinkingLevel}
              onChange={(e) => setThinkingLevel(e.target.value as ThinkingLevel)}
              className="mt-2 w-full rounded-xl border border-border bg-surface px-3 py-2 text-sm text-text focus:border-primary focus:outline-none"
            >
              <option value="low">Low</option>
              <option value="medium">Medium</option>
              <option value="high">High</option>
            </select>
          </label>

          <div className="mt-4 rounded-xl border border-border bg-surface px-3 py-2 text-xs text-muted">
            Flash favors speed, Pro favors depth. Thinking levels are clamped by policy.
          </div>
        </aside>
      </div>
    </section>
  );
}
