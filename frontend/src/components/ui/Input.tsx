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
            "flex h-10 w-full rounded-md border border-st-border bg-st-bg-elevated px-3 py-2 text-sm text-st-text-primary ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-st-text-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-st-accent disabled:cursor-not-allowed disabled:opacity-50",
            error && "border-st-danger focus-visible:ring-st-danger",
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
