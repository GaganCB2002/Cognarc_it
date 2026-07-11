"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface TopicChipProps {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
}

export function TopicChip({ label, selected, onClick, className }: TopicChipProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all cursor-pointer",
        selected
          ? "bg-st-accent/10 border-st-accent/30 text-st-accent"
          : "bg-st-bg-elevated border-st-border text-st-text-secondary hover:border-st-accent/30 hover:text-st-text-primary",
        className
      )}
    >
      {label}
    </button>
  );
}
