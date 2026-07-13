"use client";

import React, { useState, useEffect } from "react";

const loadingMessages = [
  "Preparing your workspace...",
  "Loading dashboard...",
  "Syncing your data...",
  "Connecting AI...",
  "Fetching your files...",
  "Optimizing performance...",
  "Finalizing setup...",
  "Almost ready...",
];

const iconPaths = [
  "M12 2L2 7l10 5 10-5-10-5z",
  "M2 17l10 5 10-5M2 12l10 5 10-5",
  "M12 22V12",
];

export function FullPageLoader({ message, progress }: { message?: string; progress?: number }) {
  const [msgIndex, setMsgIndex] = useState(0);
  const [dotCount, setDotCount] = useState(0);

  useEffect(() => {
    if (message) return;
    const msgInterval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % loadingMessages.length);
    }, 3000);
    return () => clearInterval(msgInterval);
  }, [message]);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDotCount(prev => (prev + 1) % 4);
    }, 500);
    return () => clearInterval(dotInterval);
  }, []);

  const displayMsg = message || loadingMessages[msgIndex];
  const dots = ".".repeat(dotCount) + "\u00A0".repeat(3 - dotCount);

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-st-bg-primary"
      role="status"
      aria-label="Loading"
    >
      {/* Animated Logo */}
      <div className="relative mb-8">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-st-accent to-st-accent-hover flex items-center justify-center shadow-2xl shadow-st-accent/20 animate-breathe">
          <svg
            className="w-10 h-10 text-white"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            {iconPaths.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </svg>
        </div>
        {/* Glow */}
        <div className="absolute -inset-4 bg-st-accent/10 rounded-3xl blur-2xl -z-10" />
      </div>

      {/* Loading Text */}
      <p className="text-sm font-medium text-st-text-secondary mb-4 h-5 text-center">
        {displayMsg}
        <span className="tabular-nums w-6 inline-block text-left">{dots}</span>
      </p>

      {/* Progress Bar */}
      <div className="w-48 h-1 bg-st-bg-elevated rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-st-accent to-st-accent-hover rounded-full transition-all duration-500 ease-out"
          style={{ width: `${progress ?? 35}%` }}
        />
      </div>

      <p className="text-[10px] text-st-text-muted mt-2 font-mono" aria-hidden="true">
        {progress ?? 35}%
      </p>
    </div>
  );
}

export function LoadingOverlay({ show, message }: { show: boolean; message?: string }) {
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-st-bg-primary/80 backdrop-blur-sm">
      <div className="flex flex-col items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-st-accent to-st-accent-hover flex items-center justify-center animate-breathe shadow-lg shadow-st-accent/20">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2L2 7l10 5 10-5-10-5z" />
            <path d="M2 17l10 5 10-5" />
          </svg>
        </div>
        <p className="text-xs text-st-text-secondary">
          {message || "Loading..."}
          <span className="animate-pulse">...</span>
        </p>
      </div>
    </div>
  );
}
