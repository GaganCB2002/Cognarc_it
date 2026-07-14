"use client";

import React, { Component, ErrorInfo, ReactNode } from "react";
import { TriangleAlert } from "lucide-react";

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center h-full min-h-[400px] w-full bg-st-bg-primary rounded-xl border border-st-border p-8 text-center">
          <TriangleAlert className="w-12 h-12 text-st-danger/80 mb-4" />
          <h2 className="text-lg font-bold text-st-text-primary mb-2">Something went wrong</h2>
          <p className="text-sm text-st-text-secondary mb-6 max-w-md">
            The application encountered an unexpected error while fetching data or rendering. 
            This usually happens if the backend server is temporarily unavailable.
          </p>
          <button
            onClick={() => {
              this.setState({ hasError: false });
              window.location.reload();
            }}
            className="px-6 py-2.5 bg-st-accent hover:bg-st-accent-hover text-white rounded-lg font-medium transition-colors"
          >
            Refresh Page
          </button>
        </div>
      );
    }

    return this.props.children;
  }
}
