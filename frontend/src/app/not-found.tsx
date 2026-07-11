"use client";

import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-st-bg-primary p-8 text-center gap-4">
      <div className="w-20 h-20 rounded-2xl bg-st-accent/10 flex items-center justify-center">
        <svg className="w-10 h-10 text-st-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z" />
        </svg>
      </div>
      <h1 className="text-3xl font-bold text-st-text-primary tracking-tight">Page not found</h1>
      <p className="text-sm text-st-text-muted max-w-md">
        The page you&apos;re looking for doesn&apos;t exist or has been moved.
      </p>
      <div className="flex items-center gap-3 mt-2">
        <Link
          href="/"
          className="inline-flex items-center justify-center rounded-lg bg-st-accent text-black px-5 py-2.5 text-sm font-medium hover:bg-st-accent-hover transition-colors"
        >
          Go Home
        </Link>
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center justify-center rounded-lg border border-st-border text-st-text-secondary px-5 py-2.5 text-sm font-medium hover:bg-st-bg-elevated hover:text-st-text-primary transition-colors"
        >
          Go Back
        </button>
      </div>
    </div>
  );
}
