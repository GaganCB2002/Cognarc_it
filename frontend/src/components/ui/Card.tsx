"use client";

import React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "relative rounded-xl border border-st-border bg-st-bg-card text-st-text-primary shadow-sm backdrop-blur-sm",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";
