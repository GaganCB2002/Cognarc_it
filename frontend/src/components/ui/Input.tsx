import React from "react";
import { cn } from "@/lib/utils";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, label, error, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label className="text-sm font-medium text-st-text-secondary">
            {label}
          </label>
        )}
        <input
          type={type}
          className={cn(
            "flex h-10 w-full rounded-lg border border-st-border bg-st-bg-elevated/50 px-3 py-2 text-sm text-st-text-primary ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-st-text-muted/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-st-accent/40 focus-visible:border-st-accent/30 focus-visible:bg-st-bg-elevated disabled:cursor-not-allowed disabled:opacity-40 transition-all duration-200",
            error && "border-st-danger/60 focus-visible:ring-st-danger/40 focus-visible:border-st-danger/50",
            className
          )}
          ref={ref}
          {...props}
        />
        {error && <span className="text-xs text-st-danger">{error}</span>}
      </div>
    );
  }
);
Input.displayName = "Input";
