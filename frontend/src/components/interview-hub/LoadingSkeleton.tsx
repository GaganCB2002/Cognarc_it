"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps {
  className?: string;
}

function SkeletonBlock({ className }: SkeletonProps) {
  return <div className={cn("skeleton-shimmer rounded-lg", className)} />;
}

export function CardSkeleton() {
  return (
    <div className="rounded-xl border border-st-border bg-gradient-to-b from-st-bg-card to-st-bg-elevated/80 p-4 space-y-3">
      <div className="flex gap-2">
        <SkeletonBlock className="h-5 w-20" />
        <SkeletonBlock className="h-5 w-16" />
      </div>
      <SkeletonBlock className="h-4 w-full" />
      <SkeletonBlock className="h-4 w-3/4" />
      <div className="flex gap-3">
        <SkeletonBlock className="h-3 w-24" />
        <SkeletonBlock className="h-3 w-16" />
      </div>
    </div>
  );
}

export function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-st-bg-elevated/50">
          <SkeletonBlock className="w-8 h-8 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <SkeletonBlock className="h-3 w-3/4" />
            <SkeletonBlock className="h-2 w-1/2" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function StatsSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="rounded-xl border border-st-border bg-gradient-to-b from-st-bg-card to-st-bg-elevated/80 p-4">
          <div className="flex items-center gap-3">
            <SkeletonBlock className="w-10 h-10 rounded-lg shrink-0" />
            <div className="flex-1 space-y-2">
              <SkeletonBlock className="h-3 w-16" />
              <SkeletonBlock className="h-6 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function SkeletonPage() {
  return (
    <div className="space-y-6">
      <SkeletonBlock className="h-8 w-48" />
      <StatsSkeleton />
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
}
