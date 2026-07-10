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
  const { isLoading: customAuthLoading, userKey } = useCustomAuth();
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (isLoaded && !isSignedIn) {
      router.push("/");
    }
  }, [isSignedIn, isLoaded, router]);

  if (!isLoaded) {
    return (
      <div className="flex h-screen bg-st-bg-primary items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-st-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!isSignedIn) {
    return null;
  }

  // Wait for custom JWT exchange to complete before rendering children
  if (customAuthLoading) {
    return (
      <div className="flex h-screen bg-st-bg-primary items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-st-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-st-bg-primary overflow-hidden">
      <Sidebar />

      <main
        className="flex-1 flex flex-col min-w-0 overflow-hidden relative transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]"
      >
        <div key={userKey} className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>

      <ChatBotWidget />
    </div>
  );
}
