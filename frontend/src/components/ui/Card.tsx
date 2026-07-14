"use client";

import React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative rounded-xl border border-st-border bg-st-bg-card text-st-text-primary shadow-sm glass-dash-card",
        "before:pointer-events-none before:absolute before:inset-0 before:rounded-xl before:bg-gradient-to-b before:from-white/[0.03] before:to-transparent",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";
