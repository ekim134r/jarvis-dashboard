"use client";

import { useEffect, useMemo, useState } from "react";

type SkillEntry = {
  name: string;
  path: string;
  hasSkillMd: boolean;
};

type Payload = {
  skillsDir: string;
  entries: SkillEntry[];
};

type TreeEntry = {
  relPath: string;
  kind: "file" | "dir";
  editable: boolean;
};

export default function SkillsView() {
  const [payload, setPayload] = useState<Payload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const [allowedExt, setAllowedExt] = useState<string[]>([]);

  // Install state
  const [zipFile, setZipFile] = useState<File | null>(null);
  const [installSkillName, setInstallSkillName] = useState<string>("");
  const [installOverwrite, setInstallOverwrite] = useState<boolean>(false);
  const [sourcePath, setSourcePath] = useState<string>("");

  // Editor state
  const [activeSkill, setActiveSkill] = useState<string | null>(null);
  const [tree, setTree] = useState<TreeEntry[]>([]);
  const [activeRelPath, setActiveRelPath] = useState<string | null>(null);
  const [fileContent, setFileContent] = useState<string>("");
  const [dirty, setDirty] = useState<boolean>(false);

  // Commit state
  const [commitMessage, setCommitMessage] = useState<string>("");
  const [commitBusy, setCommitBusy] = useState<boolean>(false);

  const refresh = async () => {
    const res = await fetch("/api/skills", { cache: "no-store" });
    if (!res.ok) throw new Error("failed");
    const json = (await res.json()) as Payload;
    setPayload(json);
  };

  useEffect(() => {
    const run = async () => {
      try {
        setError(null);
        setNotice(null);
        await refresh();
        const cfgRes = await fetch("/api/skills/config", { cache: "no-store" });
        if (cfgRes.ok) {
          const cfg = (await cfgRes.json()) as { editAllowedExtensions: string[] };
          setAllowedExt(cfg.editAllowedExtensions ?? []);
        }
      } catch {
        setError("Failed to load skills.");
      }
    };
    run();
  }, []);

  const activeTreeFiles = useMemo(() => tree.filter((t) => t.kind === "file"), [tree]);

  const loadTree = async (skillName: string) => {
    const res = await fetch(`/api/skills/${encodeURIComponent(skillName)}/tree`, { cache: "no-store" });
    const json = (await res.json()) as any;
    if (!res.ok || !json.ok) throw new Error(json.error || "tree-failed");
    setTree(json.entries as TreeEntry[]);
  };

  const openFile = async (skillName: string, relPath: string) => {
    const url = `/api/skills/${encodeURIComponent(skillName)}/file?rel=${encodeURIComponent(relPath)}`;
    const res = await fetch(url, { cache: "no-store" });
    const json = (await res.json()) as any;
    if (!res.ok || !json.ok) throw new Error(json.error || "file-read-failed");
    setActiveRelPath(json.relPath);
    setFileContent(json.content ?? "");
    setDirty(false);
  };

  const saveFile = async () => {
    if (!activeSkill || !activeRelPath) return;
    const res = await fetch(`/api/skills/${encodeURIComponent(activeSkill)}/file`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ relPath: activeRelPath, content: fileContent }),
    });
    const json = (await res.json()) as any;
    if (!res.ok || !json.ok) throw new Error(json.error || "save-failed");
    setDirty(false);
    setNotice(`Saved ${activeSkill}/${activeRelPath}`);
  };

  const installFromZip = async () => {
    if (!zipFile) return;
    const fd = new FormData();
    fd.set("file", zipFile);
    if (installSkillName.trim()) fd.set("skillName", installSkillName.trim());
    fd.set("overwrite", String(installOverwrite));

    const res = await fetch("/api/skills/install", { method: "POST", body: fd });
    const json = (await res.json()) as any;
    if (!res.ok || !json.ok) throw new Error(json.error || "install-failed");

    setNotice(`Installed ${json.skillName}`);
    setZipFile(null);
    setInstallSkillName("");
    await refresh();
  };

  const installFromFolder = async () => {
    if (!sourcePath.trim()) return;
    const res = await fetch("/api/skills/install", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        sourcePath: sourcePath.trim(),
        skillName: installSkillName.trim() || undefined,
        overwrite: installOverwrite,
      }),
    });
    const json = (await res.json()) as any;
    if (!res.ok || !json.ok) throw new Error(json.error || "install-failed");

    setNotice(`Installed ${json.skillName}`);
    setSourcePath("");
    setInstallSkillName("");
    await refresh();
  };

  const commitSkill = async () => {
    if (!activeSkill) return;
    if (!commitMessage.trim()) throw new Error("missing message");
    setCommitBusy(true);
    try {
      const res = await fetch("/api/skills/git/commit", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ message: commitMessage.trim(), skill: activeSkill }),
      });
      const json = (await res.json()) as any;
      if (!res.ok || !json.ok) {
        const extra = json.findings?.length ? ` Findings: ${json.findings.join(", ")}` : "";
        throw new Error((json.error || "commit-failed") + extra);
      }
      setNotice(`Committed ${activeSkill} @ ${String(json.head).slice(0, 7)}`);
      setCommitMessage("");
    } finally {
      setCommitBusy(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="rounded-3xl border border-border bg-surface/80 p-5 shadow-xl backdrop-blur-2xl">
        <div className="text-sm font-bold text-text">Skills Registry</div>
        <div className="mt-1 text-xs text-muted">
          Installed skills in{" "}
          <span className="font-mono">{payload?.skillsDir ?? "~/.openclaw/skills"}</span>
        </div>
        {allowedExt.length ? (
          <div className="mt-2 text-[11px] text-muted">
            Editable extensions: <span className="font-mono">{allowedExt.join(" ")}</span>
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="rounded-3xl border border-danger/30 bg-danger/10 p-5 text-danger">
          {error}
        </div>
      ) : null}

      {notice ? (
        <div className="rounded-3xl border border-border bg-surface/60 p-4 text-xs text-text">
          {notice}
        </div>
      ) : null}

      <div className="rounded-3xl border border-border bg-surface/60 p-4 shadow-sm backdrop-blur">
        <div className="text-sm font-semibold text-text">Install skill</div>
        <div className="mt-2 grid grid-cols-1 gap-3 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-surface/40 p-3">
            <div className="text-xs font-semibold text-text">From .zip</div>
            <div className="mt-2 flex flex-col gap-2">
              <input
                type="file"
                accept=".zip"
                onChange={(e) => setZipFile(e.target.files?.[0] ?? null)}
                className="text-xs text-muted"
              />
              <div className="flex gap-2">
                <input
                  value={installSkillName}
                  onChange={(e) => setInstallSkillName(e.target.value)}
                  placeholder="Skill name (optional)"
                  className="w-full rounded-xl border border-border bg-surface/50 px-3 py-2 text-xs text-text outline-none"
                />
                <button
                  onClick={() => installFromZip().catch((e) => setError(String(e.message || e)))}
                  disabled={!zipFile}
                  className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-text disabled:opacity-50"
                >
                  Install
                </button>
              </div>
              <label className="flex items-center gap-2 text-xs text-muted">
                <input
                  type="checkbox"
                  checked={installOverwrite}
                  onChange={(e) => setInstallOverwrite(e.target.checked)}
                />
                Overwrite if exists
              </label>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-surface/40 p-3">
            <div className="text-xs font-semibold text-text">From local folder path</div>
            <div className="mt-2 flex flex-col gap-2">
              <input
                value={sourcePath}
                onChange={(e) => setSourcePath(e.target.value)}
                placeholder="/path/to/skill-folder"
                className="w-full rounded-xl border border-border bg-surface/50 px-3 py-2 text-xs text-text outline-none"
              />
              <div className="flex gap-2">
                <input
                  value={installSkillName}
                  onChange={(e) => setInstallSkillName(e.target.value)}
                  placeholder="Skill name (optional)"
                  className="w-full rounded-xl border border-border bg-surface/50 px-3 py-2 text-xs text-text outline-none"
                />
                <button
                  onClick={() => installFromFolder().catch((e) => setError(String(e.message || e)))}
                  disabled={!sourcePath.trim()}
                  className="rounded-xl bg-white/10 px-3 py-2 text-xs font-semibold text-text disabled:opacity-50"
                >
                  Install
                </button>
              </div>
              <div className="text-[11px] text-muted">
                This copies a folder that already exists on the machine running the dashboard.
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {(payload?.entries ?? []).map((s) => (
          <div key={s.name} className="rounded-3xl border border-border bg-surface/60 p-4 shadow-sm backdrop-blur">
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="text-sm font-semibold text-text">{s.name}</div>
                <div className="mt-1 text-[11px] text-muted font-mono break-all">{s.path}</div>
              </div>
              <div className="flex items-center gap-2">
                <div
                  className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ring-1 ${
                    s.hasSkillMd
                      ? "bg-emerald-500/10 text-emerald-300 ring-emerald-500/20"
                      : "bg-amber-500/10 text-amber-300 ring-amber-500/20"
                  }`}
                >
                  {s.hasSkillMd ? "SKILL.md" : "missing SKILL.md"}
                </div>
                <button
                  onClick={() => {
                    setError(null);
                    setNotice(null);
                    const next = activeSkill === s.name ? null : s.name;
                    setActiveSkill(next);
                    setActiveRelPath(null);
                    setTree([]);
                    setDirty(false);
                    setFileContent("");
                    if (next) {
                      loadTree(next).catch((e) => setError(String(e.message || e)));
                    }
                  }}
                  className="rounded-xl bg-white/10 px-3 py-1.5 text-xs font-semibold text-text"
                >
                  {activeSkill === s.name ? "Close" : "Manage"}
                </button>
              </div>
            </div>

            {activeSkill === s.name ? (
              <div className="mt-4 grid grid-cols-1 gap-3 lg:grid-cols-2">
                <div className="rounded-2xl border border-border bg-surface/40 p-3">
                  <div className="flex items-center justify-between">
                    <div className="text-xs font-semibold text-text">Files</div>
                    <button
                      onClick={() => loadTree(s.name).catch((e) => setError(String(e.message || e)))}
                      className="rounded-lg bg-white/10 px-2 py-1 text-[11px] font-semibold text-text"
                    >
                      Refresh
                    </button>
                  </div>
                  <div className="mt-2 max-h-72 overflow-auto pr-1">
                    <div className="space-y-1">
                      {activeTreeFiles.map((f) => (
                        <button
                          key={f.relPath}
                          onClick={() =>
                            openFile(s.name, f.relPath).catch((e) => setError(String(e.message || e)))
                          }
                          className={`w-full rounded-lg px-2 py-1 text-left text-[11px] font-mono ${
                            f.editable
                              ? "bg-white/5 text-text hover:bg-white/10"
                              : "bg-black/10 text-muted opacity-60"
                          }`}
                          title={f.editable ? "Editable" : "Not editable (extension allowlist)"}
                        >
                          {f.relPath}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="rounded-2xl border border-border bg-surface/40 p-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="text-xs font-semibold text-text">
                      Editor {activeRelPath ? <span className="font-mono">({activeRelPath})</span> : null}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => saveFile().catch((e) => setError(String(e.message || e)))}
                        disabled={!activeRelPath || !dirty}
                        className="rounded-lg bg-white/10 px-2 py-1 text-[11px] font-semibold text-text disabled:opacity-50"
                      >
                        Save
                      </button>
                    </div>
                  </div>
                  <textarea
                    value={fileContent}
                    onChange={(e) => {
                      setFileContent(e.target.value);
                      setDirty(true);
                    }}
                    placeholder={activeRelPath ? "" : "Select a file to view/edit"}
                    className="mt-2 h-72 w-full resize-none rounded-xl border border-border bg-surface/50 p-3 text-[11px] font-mono text-text outline-none"
                  />

                  <div className="mt-3 rounded-xl border border-border bg-surface/50 p-3">
                    <div className="text-xs font-semibold text-text">Commit</div>
                    <div className="mt-2 flex gap-2">
                      <input
                        value={commitMessage}
                        onChange={(e) => setCommitMessage(e.target.value)}
                        placeholder={`Commit message for ${s.name}`}
                        className="w-full rounded-xl border border-border bg-surface/50 px-3 py-2 text-xs text-text outline-none"
                      />
                      <button
                        onClick={() =>
                          commitSkill().catch((e) => setError(String(e.message || e)))
                        }
                        disabled={!commitMessage.trim() || commitBusy}
                        className="rounded-xl bg-emerald-500/15 px-3 py-2 text-xs font-semibold text-emerald-200 disabled:opacity-50"
                        title="Runs a secret-scan on the staged diff before committing"
                      >
                        {commitBusy ? "Committing…" : "Commit"}
                      </button>
                    </div>
                    <div className="mt-2 text-[11px] text-muted">
                      Includes an invisible security review (blocks common secret patterns).
                    </div>
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        ))}
      </div>
    </div>
  );
}
