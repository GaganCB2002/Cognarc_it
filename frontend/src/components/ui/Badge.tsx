import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-st-bg-elevated text-st-text-secondary": variant === "default",
          "border-transparent bg-st-success-bg text-st-success": variant === "success",
          "border-transparent bg-st-warning-bg text-st-warning": variant === "warning",
          "border-transparent bg-st-danger-bg text-st-danger": variant === "danger",
          "text-st-text-muted border-st-border bg-transparent": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}
