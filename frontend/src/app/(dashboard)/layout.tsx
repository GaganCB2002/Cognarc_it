"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import { useAuth as useCustomAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/ui/Sidebar";
import { useSidebarStore } from "@/store/sidebarStore";
import { ChatBotWidget } from "@/components/dashboard/ChatBotWidget";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isSignedIn, isLoaded } = useAuth();
  const { isLoading: customAuthLoading, userKey, isAuthenticated: isCustomAuthenticated } = useCustomAuth();
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoaded && !isSignedIn && !isCustomAuthenticated) {
      router.replace("/");
    }
  }, [isSignedIn, isLoaded, isCustomAuthenticated, router]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen bg-gradient-to-b from-st-bg-primary via-st-bg-primary to-st-bg-secondary items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-st-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-st-text-muted">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!isSignedIn && !isCustomAuthenticated) {
    return null;
  }

  if (customAuthLoading) {
    return (
      <div className="flex h-screen bg-gradient-to-b from-st-bg-primary via-st-bg-primary to-st-bg-secondary items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-st-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-st-text-muted">Authenticating session...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-b from-st-bg-primary via-st-bg-primary to-st-bg-secondary overflow-hidden">
      <Sidebar />

      <main
        className="flex-1 flex flex-col min-w-0 overflow-hidden relative transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
      >
        {/* Subtle gradient decoration */}
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-st-accent/[0.02] blur-[120px] rounded-full pointer-events-none -z-0" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-st-accent/[0.01] blur-[100px] rounded-full pointer-events-none -z-0" />

        <div key={userKey} className="flex-1 overflow-y-auto px-6 py-6 relative z-10">
          {children}
        </div>
      </main>

      <ChatBotWidget />
    </div>
  );
}
