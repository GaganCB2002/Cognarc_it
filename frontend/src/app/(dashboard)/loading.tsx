import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";

export default function DashboardLoading() {
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      <DashboardSkeleton />
    </div>
  );
}
