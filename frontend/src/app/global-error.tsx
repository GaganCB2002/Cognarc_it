"use client";

import { useEffect } from "react";

export default function GlobalError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("Global Error Caught:", _error);
    const msg = _error?.message?.toLowerCase() || "";
    if (msg.includes("chunk") || msg.includes("module") || msg.includes("factory")) {
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }, [_error]);

  return (
    <html>
      <body className="bg-st-bg-primary text-st-text-primary antialiased">
        <div className="flex flex-col items-center justify-center min-h-screen p-8 text-center gap-4">
          <div className="w-16 h-16 rounded-full bg-st-danger/10 flex items-center justify-center">
            <svg className="w-8 h-8 text-st-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold">Something went wrong</h2>
          <p className="text-sm text-st-text-muted max-w-md">
            A critical error occurred. Please try again or return home.
          </p>
          <div className="flex items-center gap-3 mt-2">
            <button
              onClick={reset}
              className="inline-flex items-center justify-center rounded-lg bg-st-accent text-black px-5 py-2.5 text-sm font-medium hover:bg-st-accent-hover transition-colors"
            >
              Try Again
            </button>
            <button
              onClick={() => window.location.replace("/")}
              className="inline-flex items-center justify-center rounded-lg border border-st-border text-st-text-secondary px-5 py-2.5 text-sm font-medium hover:bg-st-bg-elevated hover:text-st-text-primary transition-colors"
            >
              Go Home
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
