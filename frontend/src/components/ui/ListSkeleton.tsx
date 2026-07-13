import { Skeleton } from "./Skeleton";

export function ListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-st-border bg-st-bg-card">
          <Skeleton className="w-9 h-9 rounded-lg shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/5" />
            <Skeleton className="h-3 w-2/5" />
          </div>
          <Skeleton className="w-16 h-6 rounded-md shrink-0" />
        </div>
      ))}
    </div>
  );
}

export function NotesListSkeleton({ items = 5 }: { items?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: items }).map((_, i) => (
        <div key={i} className="p-4 rounded-xl border border-st-border bg-st-bg-card space-y-2">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="w-4 h-4 rounded" />
          </div>
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
          <div className="flex gap-1">
            <Skeleton className="h-5 w-12 rounded-md" />
            <Skeleton className="h-5 w-16 rounded-md" />
          </div>
        </div>
      ))}
    </div>
  );
}

export function TaskCardSkeleton() {
  return (
    <div className="p-4 rounded-xl border border-st-border bg-st-bg-card space-y-3">
      <div className="flex items-start gap-2">
        <Skeleton className="w-4 h-4 rounded-full mt-0.5 shrink-0" />
        <div className="flex-1 space-y-2">
          <Skeleton className="h-4 w-4/5" />
          <Skeleton className="h-3 w-1/3" />
        </div>
        <Skeleton className="w-12 h-5 rounded-md shrink-0" />
      </div>
      <Skeleton className="h-3 w-full" />
    </div>
  );
}
