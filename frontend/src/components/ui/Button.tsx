import React from "react";
import { cn } from "@/lib/utils";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", size = "md", ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          "inline-flex items-center justify-center rounded-lg font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-st-accent/50 focus-visible:ring-offset-1 focus-visible:ring-offset-st-bg-primary disabled:pointer-events-none disabled:opacity-40 select-none",
          {
            "bg-gradient-to-b from-st-accent to-st-accent-hover text-black hover:from-st-accent-hover hover:to-st-accent shadow-lg shadow-st-accent/15 hover:shadow-st-accent/25 active:shadow-md active:translate-y-px": variant === "primary",
            "bg-st-bg-elevated text-st-text-primary border border-st-border hover:bg-st-border hover:border-st-border-light active:bg-st-bg-card shadow-sm": variant === "secondary",
            "border border-st-border bg-transparent text-st-text-secondary hover:text-st-text-primary hover:bg-st-bg-elevated hover:border-st-border-light active:bg-st-bg-card": variant === "outline",
            "text-st-text-secondary hover:text-st-text-primary hover:bg-st-bg-elevated active:bg-st-bg-card": variant === "ghost",
            "bg-gradient-to-b from-st-danger to-red-600 text-white hover:from-red-600 hover:to-st-danger shadow-lg shadow-st-danger/15 hover:shadow-st-danger/25 active:shadow-md active:translate-y-px": variant === "danger",
            "h-8 px-3 text-xs gap-1.5": size === "sm",
            "h-10 px-4 text-sm gap-2": size === "md",
            "h-12 px-6 text-base gap-2.5": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
