"use client";

import React, { useEffect, useMemo, useState } from "react";

const LS_BASE_URL = "jarvis_integrations_n8n_baseUrl_v1";
const LS_API_KEY = "jarvis_integrations_n8n_apiKey_v1";
const LS_AUTH_MODE = "jarvis_integrations_n8n_authMode_v1";

type AuthMode = "bearer" | "header";

type TestResult =
  | { state: "idle" }
  | { state: "testing" }
  | { state: "ok"; payload: any }
  | { state: "error"; message: string; payload?: any };

function mask(s: string) {
  if (!s) return "";
  if (s.length <= 10) return "••••••";
  return `${s.slice(0, 4)}••••••••${s.slice(-4)}`;
}

export default function IntegrationsView() {
  const [baseUrl, setBaseUrl] = useState("");
  const [apiKey, setApiKey] = useState("");
  const [authMode, setAuthMode] = useState<AuthMode>("header");
  const [reveal, setReveal] = useState(false);
  const [result, setResult] = useState<TestResult>({ state: "idle" });

  useEffect(() => {
    if (typeof window === "undefined") return;
    const storedBase = window.localStorage.getItem(LS_BASE_URL);
    const storedKey = window.localStorage.getItem(LS_API_KEY);
    const storedMode = window.localStorage.getItem(LS_AUTH_MODE) as AuthMode | null;
    if (storedBase) setBaseUrl(storedBase);
    if (storedKey) setApiKey(storedKey);
    if (storedMode === "bearer" || storedMode === "header") setAuthMode(storedMode);
    else {
      // heuristics
      if ((storedKey ?? "").startsWith("eyJ")) setAuthMode("bearer");
    }
  }, []);

  const hasSaved = useMemo(() => {
    if (typeof window === "undefined") return false;
    return !!window.localStorage.getItem(LS_BASE_URL) && !!window.localStorage.getItem(LS_API_KEY);
  }, []);

  const saveLocal = () => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(LS_BASE_URL, baseUrl.trim());
    window.localStorage.setItem(LS_API_KEY, apiKey);
    window.localStorage.setItem(LS_AUTH_MODE, authMode);
    setResult({ state: "ok", payload: { saved: true } });
    setTimeout(() => setResult({ state: "idle" }), 900);
  };

  const clearLocal = () => {
    if (typeof window === "undefined") return;
    window.localStorage.removeItem(LS_BASE_URL);
    window.localStorage.removeItem(LS_API_KEY);
    window.localStorage.removeItem(LS_AUTH_MODE);
    setBaseUrl("");
    setApiKey("");
    setAuthMode("header");
    setReveal(false);
    setResult({ state: "idle" });
  };

  const testConnection = async () => {
    setResult({ state: "testing" });
    try {
      const res = await fetch("/api/integrations/n8n/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ baseUrl, apiKey, authMode }),
      });
      const payload = await res.json();
      if (payload?.ok) setResult({ state: "ok", payload });
      else setResult({ state: "error", message: payload?.hint || payload?.error || "Test failed", payload });
    } catch (err) {
      setResult({ state: "error", message: "Network error" });
    }
  };

  return (
    <section className="view-shell view-integrations reveal rounded-[2rem] border border-border bg-surface p-6 shadow-2xl shadow-black/5 dark:shadow-black/20">
      <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="mb-2 text-[10px] font-black uppercase tracking-[0.2em] text-primary/80">Integrations</p>
          <h2 className="font-display text-3xl font-bold tracking-tight text-text">n8n Cloud</h2>
          <p className="mt-2 max-w-2xl text-sm text-muted">
            Token wird <span className="font-semibold text-text">nur in deinem Browser</span> gespeichert (localStorage) —
            nicht im Repo, nicht in der DB.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className={`rounded-full border px-3 py-1 text-xs font-bold ${hasSaved ? "border-success/30 bg-success/10 text-success" : "border-border bg-surface-muted text-muted"}`}>
            {hasSaved ? "Saved locally" : "Not configured"}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_420px]">
        {/* Left: Form */}
        <div className="rounded-[1.75rem] border border-border bg-surface p-6">
          <div className="grid grid-cols-1 gap-4">
            <label className="block">
              <span className="mb-2 block text-xs font-bold text-text/80">Base URL</span>
              <input
                value={baseUrl}
                onChange={(e) => setBaseUrl(e.target.value)}
                placeholder="https://<dein-workspace>.app.n8n.cloud"
                className="w-full rounded-xl border border-border bg-surface-muted/50 px-4 py-3 text-sm font-semibold text-text shadow-sm transition-all placeholder:font-normal placeholder:text-muted/50 focus:border-primary focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10"
              />
              <p className="mt-2 text-[11px] text-muted">
                Beispiel: <span className="font-mono">https://acme.app.n8n.cloud</span>
              </p>
            </label>

            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              <label className="md:col-span-2 block">
                <span className="mb-2 block text-xs font-bold text-text/80">API Key / Token</span>
                <div className="relative">
                  <input
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                    type={reveal ? "text" : "password"}
                    placeholder="paste token here"
                    className="w-full rounded-xl border border-border bg-surface-muted/50 px-4 py-3 pr-20 text-sm font-semibold text-text shadow-sm transition-all placeholder:font-normal placeholder:text-muted/50 focus:border-primary focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10"
                  />
                  <button
                    type="button"
                    onClick={() => setReveal((v) => !v)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-lg border border-border bg-surface px-3 py-1.5 text-[11px] font-bold text-muted hover:text-text"
                  >
                    {reveal ? "Hide" : "Show"}
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-muted">Mask: <span className="font-mono">{mask(apiKey)}</span></p>
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-bold text-text/80">Auth Mode</span>
                <select
                  value={authMode}
                  onChange={(e) => setAuthMode(e.target.value as AuthMode)}
                  className="w-full rounded-xl border border-border bg-surface-muted/50 px-4 py-3 text-sm font-semibold text-text shadow-sm transition-all focus:border-primary focus:bg-surface focus:outline-none focus:ring-4 focus:ring-primary/10"
                >
                  <option value="header">X-N8N-API-KEY</option>
                  <option value="bearer">Authorization: Bearer</option>
                </select>
                <p className="mt-2 text-[11px] text-muted">Wenn 401/403: Modus wechseln.</p>
              </label>
            </div>

            <div className="mt-2 flex flex-wrap gap-3">
              <button
                onClick={saveLocal}
                className="group inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-5 py-3 text-sm font-bold text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary-strong hover:shadow-xl hover:shadow-primary/30 active:translate-y-0"
              >
                Save locally
                <svg className="h-4 w-4 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
                </svg>
              </button>

              <button
                onClick={testConnection}
                disabled={result.state === "testing"}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-surface px-5 py-3 text-sm font-bold text-text shadow-sm transition-all hover:-translate-y-0.5 hover:bg-surface-muted active:translate-y-0 disabled:opacity-60"
              >
                {result.state === "testing" ? "Testing…" : "Test connection"}
              </button>

              <button
                onClick={clearLocal}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-danger/25 bg-danger/10 px-5 py-3 text-sm font-bold text-danger transition-all hover:bg-danger/15"
              >
                Clear
              </button>
            </div>

            {result.state === "error" && (
              <div className="mt-4 rounded-xl border border-danger/30 bg-danger/10 p-4 text-danger">
                <div className="text-sm font-bold">{result.message}</div>
                {result.payload && (
                  <pre className="mt-3 max-h-[220px] overflow-auto rounded-lg bg-black/5 p-3 text-[11px] text-text/80 dark:bg-white/5">
                    {JSON.stringify(result.payload, null, 2)}
                  </pre>
                )}
              </div>
            )}

            {result.state === "ok" && result.payload?.probe && (
              <div className="mt-4 rounded-xl border border-success/30 bg-success/10 p-4 text-success">
                <div className="text-sm font-bold">Connected</div>
                <div className="mt-1 text-[11px]">Probe: <span className="font-mono">{result.payload.probe}</span></div>
              </div>
            )}
          </div>
        </div>

        {/* Right: How it works */}
        <aside className="rounded-[1.75rem] border border-border bg-surface p-6">
          <h3 className="font-display text-lg font-bold text-text">Security model</h3>
          <ul className="mt-3 space-y-2 text-sm text-muted">
            <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" /> Token stays in <span className="font-semibold text-text">localStorage</span> (this device + browser).</li>
            <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" /> Test call hits our server route but we <span className="font-semibold text-text">do not persist</span> the token.</li>
            <li className="flex gap-2"><span className="mt-1 h-1.5 w-1.5 rounded-full bg-primary" /> If the token leaks: revoke + rotate in n8n Cloud.</li>
          </ul>

          <div className="mt-6 rounded-2xl border border-border bg-surface-muted/40 p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-muted">Next step</p>
            <p className="mt-2 text-sm text-text">
              Sobald das steht, kann ich in der App n8n-Aktionen bauen (z.B. Run Workflow, List Runs, Trigger).
            </p>
          </div>
        </aside>
      </div>
    </section>
  );
}
