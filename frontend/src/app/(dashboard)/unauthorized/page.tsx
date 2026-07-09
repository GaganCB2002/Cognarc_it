import React from "react";
import Link from "next/link";
import { AlertTriangle } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="flex flex-col items-center justify-center h-full min-h-[60vh] space-y-6">
      <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center">
        <AlertTriangle className="w-10 h-10 text-red-500" />
      </div>
      <h1 className="text-3xl font-bold text-st-text-primary">Access Denied</h1>
      <p className="text-st-text-secondary text-center max-w-md">
        You do not have permission to view this dashboard. Please return to your assigned dashboard.
      </p>
      <Link 
        href="/dashboard"
        className="px-6 py-2 bg-st-accent hover:bg-st-accent-hover text-white rounded-lg font-medium transition-colors"
      >
        Go to My Dashboard
      </Link>
    </div>
  );
}
