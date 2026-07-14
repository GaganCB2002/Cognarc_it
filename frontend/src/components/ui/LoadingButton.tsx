"use client";

import React, { useState, useCallback } from "react";
import { cn } from "@/lib/utils";
import { Check, X, Loader2 } from "lucide-react";

interface Ripple {
  id: number;
  x: number;
  y: number;
}

export interface LoadingButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "danger" | "outline";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
  loadingText?: string;
  success?: boolean;
  error?: boolean;
  icon?: React.ReactNode;
}

export function LoadingButton({
  className,
  variant = "primary",
  size = "md",
  loading = false,
  loadingText,
  success = false,
  error = false,
  icon,
  children,
  disabled,
  onClick,
  ...props
}: LoadingButtonProps) {
  const [ripples, setRipples] = useState<Ripple[]>([]);

  const handleClick = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    const id = Date.now();
    setRipples(prev => [...prev, { id, x, y }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 600);
    onClick?.(e);
  }, [onClick]);

  return (
    <button
      className={cn(
        "relative inline-flex items-center justify-center rounded-xl font-medium transition-all duration-200 overflow-hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-st-accent/50 focus-visible:ring-offset-1 focus-visible:ring-offset-st-bg-primary disabled:pointer-events-none disabled:opacity-40 select-none",
        {
          "bg-gradient-to-b from-st-accent to-st-accent-hover text-white hover:from-st-accent-hover hover:to-st-accent hover:-translate-y-0.5 shadow-lg shadow-st-accent/20 hover:shadow-st-accent/30 active:shadow-md active:translate-y-px": variant === "primary",
          "bg-st-bg-elevated/80 text-st-text-primary border border-st-border hover:bg-st-bg-card hover:-translate-y-0.5 active:bg-st-bg-elevated shadow-sm": variant === "secondary",
          "border border-st-border bg-transparent text-st-text-secondary hover:text-st-text-primary hover:bg-st-bg-elevated/50 active:bg-st-bg-card": variant === "outline",
          "text-st-text-secondary hover:text-st-text-primary hover:bg-st-bg-elevated/50 active:bg-st-bg-card": variant === "ghost",
          "bg-gradient-to-b from-st-danger to-st-danger/80 text-white hover:from-st-danger/90 hover:to-st-danger hover:-translate-y-0.5 shadow-lg shadow-st-danger/20 hover:shadow-st-danger/30 active:shadow-md active:translate-y-px": variant === "danger",
          "h-8 px-3 text-xs gap-1.5": size === "sm",
          "h-10 px-4 text-sm gap-2": size === "md",
          "h-12 px-6 text-base gap-2.5": size === "lg",
        },
        success && "!bg-st-success !shadow-st-success/20 !translate-y-0",
        error && "!bg-st-danger !shadow-st-danger/20 animate-[shake_0.4s_ease-in-out] !translate-y-0",
        className
      )}
      onClick={handleClick}
      disabled={disabled || loading}
      {...props}
    >
      {ripples.map(ripple => (
        <span
          key={ripple.id}
          className="absolute pointer-events-none rounded-full bg-white/25 animate-[ripple_0.6s_ease-out]"
          style={{
            left: ripple.x - 10,
            top: ripple.y - 10,
            width: 20,
            height: 20,
          }}
        />
      ))}

      {loading ? (
        <>
          <Loader2 className="w-4 h-4 animate-spin" />
          {loadingText && <span>{loadingText}</span>}
        </>
      ) : success ? (
        <>
          <Check className="w-4 h-4" />
          <span>Done</span>
        </>
      ) : error ? (
        <>
          <X className="w-4 h-4" />
          <span>Failed</span>
        </>
      ) : (
        <>
          {icon}
          {children}
        </>
      )}
    </button>
  );
}
