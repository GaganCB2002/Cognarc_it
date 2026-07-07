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
          "inline-flex items-center justify-center rounded-md font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-st-accent disabled:pointer-events-none disabled:opacity-50",
          {
            "bg-st-accent text-black hover:bg-st-accent-hover": variant === "primary",
            "bg-st-bg-elevated text-st-text-primary hover:bg-st-border": variant === "secondary",
            "border border-st-border bg-transparent hover:bg-st-bg-elevated": variant === "outline",
            "hover:bg-st-bg-elevated text-st-text-primary": variant === "ghost",
            "bg-st-danger text-white hover:opacity-90": variant === "danger",
            "h-9 px-3 text-sm": size === "sm",
            "h-10 px-4 py-2": size === "md",
            "h-11 px-8 text-lg": size === "lg",
          },
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";
