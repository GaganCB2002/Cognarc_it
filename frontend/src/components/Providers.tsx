"use client";

import React from "react";
import { Toaster } from "react-hot-toast";
import { AuthProvider } from "@/lib/auth-context";
import { SessionProvider } from "@/contexts/SessionContext";
import { ThemeProvider } from "@/lib/theme-context";

class ErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("[ErrorBoundary]", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        this.props.fallback || (
          <div className="flex h-screen items-center justify-center bg-st-bg-primary">
            <div className="text-center max-w-md px-6">
              <div className="w-16 h-16 rounded-full bg-st-danger/10 flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl text-st-danger">!</span>
              </div>
              <h2 className="text-xl font-semibold text-st-text-primary mb-2">Something went wrong</h2>
              <p className="text-sm text-st-text-secondary mb-4">
                {this.state.error?.message || "An unexpected error occurred"}
              </p>
              <button
                onClick={() => this.setState({ hasError: false, error: null })}
                className="px-4 py-2 rounded-lg bg-st-accent text-black text-sm font-medium hover:bg-st-accent-hover transition-colors"
              >
                Try again
              </button>
            </div>
          </div>
        )
      );
    }
    return this.props.children;
  }
}

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary>
      <ThemeProvider>
        <AuthProvider>
          <SessionProvider>
            {children}
            <Toaster
            position="bottom-right"
            toastOptions={{
              style: {
                background: "var(--color-st-bg-card)",
                color: "var(--color-st-text-primary)",
                border: "1px solid var(--color-st-border)",
                borderRadius: "12px",
                fontSize: "13px",
                boxShadow: "0 4px 24px rgba(0,0,0,0.08)",
              },
              success: {
                iconTheme: { primary: "var(--color-st-success)", secondary: "var(--color-st-bg-card)" },
              },
              error: {
                iconTheme: { primary: "var(--color-st-danger)", secondary: "var(--color-st-bg-card)" },
              },
            }}
          />
          </SessionProvider>
        </AuthProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}
