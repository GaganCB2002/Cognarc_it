"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Calendar as CalendarIcon,
  TrendingUp,
  HelpCircle,
  LogOut,
  CheckSquare,
  FileText,
  Database,
  Bot,
  FileSearch,
  Video,
  BarChart,
  PieChart,
  Activity,
  Briefcase,
  Settings,
  User,
  Menu,
  X,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { SidebarSessionPanel } from "@/components/dashboard/SidebarSessionPanel";
import { useAuth } from "@/lib/auth-context";
import { useSidebarStore } from "@/store/sidebarStore";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tracking", href: "/tracking", icon: Activity },
  { name: "Learning", href: "/curriculum", icon: BookOpen },
  { name: "Calendar", href: "/calendar", icon: CalendarIcon },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Notes", href: "/notes", icon: FileText },
  { name: "Knowledge Vault", href: "/knowledge-vault", icon: Database },
  { name: "AI Assistant", href: "/ai-assistant", icon: Bot },
  { name: "PDF Intelligence", href: "/pdf-intelligence", icon: FileSearch },
  { name: "Video Intelligence", href: "/video-intelligence", icon: Video },
  { name: "Reports", href: "/reports", icon: BarChart },
  { name: "Analytics", href: "/analytics", icon: PieChart },
  { name: "Productivity", href: "/productivity", icon: Activity },
  { name: "Career", href: "/career", icon: Briefcase },
  { name: "Settings", href: "/settings", icon: Settings },
  { name: "Profile", href: "/profile", icon: User },
];

function useMediaQuery(query: string) {
  const [matches, setMatches] = React.useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    setMatches(media.matches);
    const listener = (e: MediaQueryListEvent) => setMatches(e.matches);
    media.addEventListener("change", listener);
    return () => media.removeEventListener("change", listener);
  }, [query]);

  return matches;
}

export function Sidebar() {
  const pathname = usePathname();
  const { logout } = useAuth();
  const { isCollapsed, isMobileOpen, toggle, setMobileOpen } = useSidebarStore();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
  const sidebarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isTablet) {
      useSidebarStore.getState().collapse();
    } else if (!isMobile && !isTablet) {
      useSidebarStore.getState().expand();
    }
  }, [isTablet, isMobile]);

  useEffect(() => {
    if (isMobile) {
      setMobileOpen(false);
    }
  }, [pathname, isMobile, setMobileOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileOpen) {
        setMobileOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isMobileOpen, setMobileOpen]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (isMobile && isMobileOpen && sidebarRef.current && !sidebarRef.current.contains(e.target as Node)) {
        setMobileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isMobile, isMobileOpen, setMobileOpen]);

  const sidebarContent = (
    <aside
      ref={sidebarRef}
      role="navigation"
      aria-label="Main navigation"
      className={cn(
        "flex flex-col shrink-0 h-full transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "bg-st-bg-secondary border-r border-st-border",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      <div className={cn("flex items-center border-b border-st-border shrink-0", isCollapsed ? "p-3 justify-center" : "p-4 justify-between")}>
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2 min-w-0">
            <div className="w-7 h-7 bg-st-accent rounded-md flex items-center justify-center shrink-0">
              <span className="font-bold text-black text-sm">S</span>
            </div>
            <span className="text-lg font-semibold tracking-tight text-st-text-primary truncate">StudyTrack</span>
          </Link>
        )}
        {isCollapsed && (
          <Link href="/dashboard" className="flex items-center justify-center">
            <div className="w-7 h-7 bg-st-accent rounded-md flex items-center justify-center">
              <span className="font-bold text-black text-sm">S</span>
            </div>
          </Link>
        )}
        <button
          onClick={toggle}
          className={cn(
            "flex items-center justify-center rounded-md text-st-text-secondary hover:text-st-text-primary hover:bg-st-bg-elevated transition-colors",
            isCollapsed ? "w-8 h-8 mx-auto" : "w-8 h-8"
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!isCollapsed}
        >
          <Menu className="w-4 h-4" />
        </button>
      </div>

      <nav className="flex-1 py-4 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-md text-sm font-medium transition-all duration-200 group",
                isCollapsed ? "justify-center px-0 py-2.5 mx-auto w-10" : "px-3 py-2.5",
                isActive
                  ? "text-st-text-primary"
                  : "text-st-text-secondary hover:text-st-text-primary hover:bg-st-bg-elevated/60"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              {isActive && (
                <motion.div
                  layoutId="sidebar-active"
                  className={cn(
                    "absolute inset-0 bg-st-accent/8 rounded-md",
                    isCollapsed ? "mx-auto w-10" : ""
                  )}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {isActive && !isCollapsed && (
                <motion.div
                  layoutId="sidebar-active-border"
                  className="absolute left-0 top-1 bottom-1 w-0.5 bg-st-accent rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <div className={cn(
                "relative z-10 flex items-center justify-center w-5 h-5 shrink-0",
                isActive ? "text-st-accent" : "text-st-text-secondary group-hover:text-st-text-primary transition-colors"
              )}>
                <item.icon className="w-4.5 h-4.5" strokeWidth={isActive ? 2.5 : 1.5} />
              </div>
              <AnimatePresence mode="wait">
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.15, ease: "easeInOut" }}
                    className="relative z-10 truncate text-sm"
                  >
                    {item.name}
                  </motion.span>
                )}
              </AnimatePresence>
              {!isCollapsed && isActive && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-st-accent shrink-0"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className={cn("border-t border-st-border shrink-0", isCollapsed ? "p-2" : "p-4")}>
        <AnimatePresence mode="wait">
          {!isCollapsed ? (
            <motion.div
              key="expanded"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
            >
              <SidebarSessionPanel />
            </motion.div>
          ) : (
            <motion.div
              key="collapsed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="flex flex-col items-center gap-1"
            >
              <button className="w-10 h-10 flex items-center justify-center rounded-md text-st-text-secondary hover:text-st-text-primary hover:bg-st-bg-elevated transition-colors" aria-label="Help">
                <HelpCircle className="w-4 h-4" />
              </button>
              <button
                onClick={logout}
                className="w-10 h-10 flex items-center justify-center rounded-md text-st-text-secondary hover:text-st-danger hover:bg-st-danger/10 transition-colors"
                aria-label="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>
        {!isCollapsed && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="space-y-1 mt-4"
          >
            <button className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-st-text-secondary hover:text-st-text-primary hover:bg-st-bg-elevated transition-colors">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>Help</span>
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-st-text-secondary hover:text-st-text-primary hover:bg-st-bg-elevated transition-colors"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Logout</span>
            </button>
          </motion.div>
        )}
      </div>
    </aside>
  );

  if (isMobile) {
    return (
      <>
        <button
          onClick={() => setMobileOpen(true)}
          className="fixed top-4 left-4 z-50 w-10 h-10 flex items-center justify-center rounded-lg bg-st-bg-secondary border border-st-border text-st-text-secondary hover:text-st-text-primary transition-colors md:hidden"
          aria-label="Open navigation menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <AnimatePresence>
          {isMobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/60 z-40 md:hidden"
                onClick={() => setMobileOpen(false)}
                aria-hidden="true"
              />
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="fixed left-0 top-0 bottom-0 z-50 md:hidden"
              >
                <div className="h-full">
                  {React.cloneElement(sidebarContent as React.ReactElement<any>, {
                    style: { borderRight: "1px solid #222" }
                  })}
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  return sidebarContent;
}
