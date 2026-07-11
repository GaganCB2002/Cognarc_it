"use client";

import React from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  onFilterClick?: () => void;
  className?: string;
}

export function SearchInput({ value, onChange, placeholder = "Search...", onFilterClick, className }: SearchInputProps) {
  return (
    <div className={cn("relative flex items-center gap-2", className)}>
      <div className="relative flex-1">
        <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-st-text-muted" />
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2 bg-st-bg-elevated border border-st-border rounded-lg text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none focus:border-st-accent/50 transition-colors"
        />
        {value && (
          <button onClick={() => onChange("")} className="absolute right-2 top-1/2 -translate-y-1/2 text-st-text-muted hover:text-st-text-primary">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
      {onFilterClick && (
        <button
          onClick={onFilterClick}
          className="p-2 rounded-lg bg-st-bg-elevated border border-st-border text-st-text-muted hover:text-st-text-primary hover:border-st-accent/30 transition-all"
        >
          <SlidersHorizontal className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}
