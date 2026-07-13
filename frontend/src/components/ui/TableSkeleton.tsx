import { Skeleton } from "./Skeleton";

export function TableSkeleton({ rows = 5, cols = 4 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border border-st-border overflow-hidden">
      <div className="grid grid-cols-12 gap-4 p-4 bg-st-bg-elevated">
        {Array.from({ length: cols }).map((_, i) => (
          <div key={i} className="col-span-3"><Skeleton className="h-3 w-3/4" /></div>
        ))}
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="grid grid-cols-12 gap-4 p-4 border-t border-st-border">
          {Array.from({ length: cols }).map((_, c) => (
            <div key={c} className="col-span-3"><Skeleton className="h-4 w-5/6" /></div>
          ))}
        </div>
      ))}
    </div>
  );
}
