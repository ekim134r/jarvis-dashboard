"use client";

import { useEffect, useState } from "react";

function formatTime(date: Date) {
  return date.toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
}

function formatDate(date: Date) {
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "2-digit"
  });
}

export default function Clock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="flex flex-col justify-center">
      <div className="font-mono text-xl font-bold tracking-tight text-text tabular-nums leading-none">
        {now ? formatTime(now) : "--:--:--"}
      </div>
      <div className="text-[11px] font-bold uppercase tracking-wider text-muted opacity-80">
        {now ? formatDate(now) : "Loading..."}
      </div>
    </div>
  );
}
