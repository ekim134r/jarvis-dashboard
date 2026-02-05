"use client";

import { useEffect, useMemo, useState } from "react";

type ThemeMode = "system" | "light" | "dark";

const STORAGE_KEY = "jarvis_theme_mode";

const modeLabels: Record<ThemeMode, string> = {
  system: "System",
  light: "Light",
  dark: "Dark"
};

function applyTheme(mode: ThemeMode) {
  if (typeof document === "undefined") return;
  const root = document.documentElement;
  root.classList.remove("light", "dark");
  if (mode === "light") {
    root.classList.add("light");
  }
  if (mode === "dark") {
    root.classList.add("dark");
  }
}

export default function ThemeToggle() {
  const [mode, setMode] = useState<ThemeMode>("system");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const stored = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    const nextMode =
      stored === "light" || stored === "dark" || stored === "system"
        ? stored
        : "system";
    setMode(nextMode);
    applyTheme(nextMode);
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, mode);
    applyTheme(mode);
  }, [mode]);

  const label = useMemo(() => modeLabels[mode], [mode]);

  const cycleMode = () => {
    setMode((current) => {
      if (current === "system") return "dark";
      if (current === "dark") return "light";
      return "system";
    });
  };

  return (
    <button 
      type="button" 
      className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-bold text-text shadow-sm transition-all hover:bg-surface-muted hover:shadow-md active:scale-95" 
      onClick={cycleMode}
    >
      Theme: {label}
    </button>
  );
}