import React from "react";
import { cn } from "@/lib/utils";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(
  ({ className, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        "rounded-xl border border-st-border bg-gradient-to-b from-st-bg-card to-st-bg-elevated/80 text-st-text-primary shadow-sm",
        className
      )}
      {...props}
    />
  )
);
Card.displayName = "Card";
