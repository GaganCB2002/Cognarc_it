import React from "react";
import { cn } from "@/lib/utils";

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "success" | "warning" | "danger" | "outline";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
        {
          "border-transparent bg-st-bg-elevated text-st-text-primary": variant === "default",
          "border-transparent bg-st-success/20 text-st-success": variant === "success",
          "border-transparent bg-st-warning/20 text-st-warning": variant === "warning",
          "border-transparent bg-st-danger/20 text-st-danger": variant === "danger",
          "text-st-text-secondary border-st-border": variant === "outline",
        },
        className
      )}
      {...props}
    />
  );
}
