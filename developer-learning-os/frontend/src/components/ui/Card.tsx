import React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-st-border bg-st-bg-card text-st-text-primary shadow-sm",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";
