"use client";

import React, { useState, useEffect } from "react";
import { format } from "date-fns";

export function LiveClock() {
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-xs font-semibold font-mono text-st-accent bg-st-bg-elevated border border-st-border px-3 py-1.5 rounded-lg flex items-center gap-2 shrink-0">
      <span className="w-1.5 h-1.5 rounded-full bg-st-accent animate-pulse" />
      {format(currentTime, "yyyy-MM-dd HH:mm:ss")}
    </div>
  );
}
