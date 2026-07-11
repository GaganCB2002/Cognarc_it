"use client";

import React from "react";
import { cn } from "@/lib/utils";

const difficultyConfig = {
  Beginner: { bg: "bg-st-success-bg", text: "text-st-success", border: "border-st-success/20" },
  Easy: { bg: "bg-st-success-bg", text: "text-st-success", border: "border-st-success/20" },
  Intermediate: { bg: "bg-st-warning-bg", text: "text-st-warning", border: "border-st-warning/20" },
  Medium: { bg: "bg-st-warning-bg", text: "text-st-warning", border: "border-st-warning/20" },
  Advanced: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  Hard: { bg: "bg-orange-500/10", text: "text-orange-400", border: "border-orange-500/20" },
  Expert: { bg: "bg-st-danger-bg", text: "text-st-danger", border: "border-st-danger/20" },
};

interface DifficultyBadgeProps {
  level: string;
  className?: string;
}

export function DifficultyBadge({ level, className }: DifficultyBadgeProps) {
  const config = difficultyConfig[level as keyof typeof difficultyConfig] || difficultyConfig.Intermediate;
  return (
    <span className={cn("inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium", config.bg, config.text, config.border, className)}>
      {level}
    </span>
  );
}
