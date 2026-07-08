"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Sidebar } from "@/components/ui/Sidebar";
import { useAuth } from "@/lib/auth-context";
import { useSidebarStore } from "@/store/sidebarStore";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading } = useAuth();
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-st-bg-primary items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-st-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-st-bg-primary overflow-hidden">
      <Sidebar />

      <main
        className="flex-1 flex flex-col min-w-0 overflow-hidden relative transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
      >
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
