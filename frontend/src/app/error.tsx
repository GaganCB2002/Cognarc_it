"use client";

import { useEffect } from "react";
import { Button } from "@/components/ui/Button";

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("App Error Caught:", error);
    const msg = error?.message?.toLowerCase() || "";
    // If it's a chunk/module loading error, force a hard reload after a tiny delay
    if (msg.includes("chunk") || msg.includes("module") || msg.includes("factory")) {
      setTimeout(() => {
        window.location.reload();
      }, 500);
    }
  }, [error]);

  return (
    <div className="min-h-[400px] flex flex-col items-center justify-center p-8 text-center gap-4 w-full">
      <div className="w-16 h-16 rounded-full bg-st-danger/10 flex items-center justify-center">
        <svg className="w-8 h-8 text-st-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      </div>
      <h2 className="text-xl font-semibold text-st-text-primary">Something went wrong!</h2>
      <p className="text-sm text-st-text-muted max-w-md">
        An unexpected error occurred in this section of the application.
      </p>
      <div className="flex items-center gap-3 mt-4">
        <Button onClick={reset} variant="primary">
          Try Again
        </Button>
        <Button onClick={() => window.location.reload()} variant="secondary">
          Hard Reload
        </Button>
      </div>
    </div>
  );
}
