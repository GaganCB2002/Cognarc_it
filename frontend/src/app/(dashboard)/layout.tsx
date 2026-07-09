"use client";

import React, { useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Sidebar } from "@/components/ui/Sidebar";
import { useAuth } from "@/lib/auth-context";
import { useSidebarStore } from "@/store/sidebarStore";
import { ChatBotWidget } from "@/components/dashboard/ChatBotWidget";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const isCollapsed = useSidebarStore((state) => state.isCollapsed);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    } else if (!isLoading && isAuthenticated && user) {
      // Role-based routing check
      const expectedRolePrefix = `/${user.role ? user.role.toLowerCase().replace('_', '-') : 'student'}`;
      const rolePrefixes = ['/admin', '/hr', '/manager', '/employee', '/student', '/trainer', '/super-admin'];
      
      const isTryingToAccessAnotherRole = rolePrefixes.some(prefix => 
        pathname?.startsWith(prefix) && !pathname.startsWith(expectedRolePrefix)
      );

      // If they go to the root `/dashboard`, redirect to their specific dashboard
      if (pathname === '/dashboard') {
        router.push(`${expectedRolePrefix}/dashboard`);
      } else if (isTryingToAccessAnotherRole) {
        router.push("/unauthorized");
      }
    }
  }, [isAuthenticated, isLoading, router, user, pathname]);

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

      {/* Floating project-aware chatbot widget */}
      <ChatBotWidget />
    </div>
  );
}
