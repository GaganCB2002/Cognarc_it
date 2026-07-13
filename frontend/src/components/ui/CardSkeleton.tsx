import { cn } from "@/lib/utils";
import { Skeleton } from "./Skeleton";

export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-st-border bg-st-bg-card p-4", className)}>
      <div className="flex items-center gap-3 mb-3">
        <Skeleton className="w-10 h-10 rounded-lg shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-3 w-1/2" />
        </div>
      </div>
      <Skeleton className="h-3 w-full mb-2" />
      <Skeleton className="h-3 w-5/6 mb-2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

export function StatCardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-st-border bg-st-bg-card p-4", className)}>
      <div className="flex items-center justify-between mb-3">
        <Skeleton className="w-4 h-4 rounded" />
        <Skeleton className="w-8 h-8 rounded-lg" />
      </div>
      <Skeleton className="h-8 w-1/2 mb-1" />
      <Skeleton className="h-3 w-1/3" />
    </div>
  );
}

export function ChartSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-st-border bg-st-bg-card p-4", className)}>
      <Skeleton className="h-4 w-1/4 mb-4" />
      <Skeleton className="h-48 w-full rounded-lg" />
    </div>
  );
}
