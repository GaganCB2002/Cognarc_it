"use client";

import React, { useEffect, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  BookOpen,
  Calendar as CalendarIcon,
  CheckSquare,
  FileText,
  Database,
  FileSearch,
  Video,
  BarChart,
  PieChart,
  Activity,
  Briefcase,
  Settings,
  User,
  Menu,
  Shield,
  Server,
  ChevronLeft,
  BrainCircuit,
  MessageCircle,
  HelpCircle,
  LogOut,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/lib/auth-context";
import { useSidebarStore } from "@/store/sidebarStore";
import { cn } from "@/lib/utils";

interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

const navigation: NavItem[] = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Tracking", href: "/tracking", icon: Activity },
  { name: "Diagnostics", href: "/diagnostics", icon: Server },
  { name: "Learning", href: "/curriculum", icon: BookOpen },
  { name: "Calendar", href: "/calendar", icon: CalendarIcon },
  { name: "Tasks", href: "/tasks", icon: CheckSquare },
  { name: "Notes", href: "/notes", icon: FileText },
  { name: "Knowledge Vault", href: "/knowledge-vault", icon: Database },
  { name: "PDF Intelligence", href: "/pdf-intelligence", icon: FileSearch },
  { name: "Video Intelligence", href: "/video-intelligence", icon: Video },
  { name: "Reports", href: "/reports", icon: BarChart },
  { name: "Analytics", href: "/analytics", icon: PieChart },
  { name: "Productivity", href: "/productivity", icon: Activity },
  { name: "Career", href: "/career", icon: Briefcase },
  { name: "Interview Hub", href: "/interview-hub", icon: BrainCircuit },
  { name: "Contact Us", href: "/contact-us", icon: MessageCircle },
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
  const { user, logout } = useAuth();
  const { isCollapsed, isMobileOpen, toggle, setMobileOpen } = useSidebarStore();
  const isMobile = useMediaQuery("(max-width: 767px)");
  const isTablet = useMediaQuery("(min-width: 768px) and (max-width: 1023px)");
  const sidebarRef = useRef<HTMLDivElement>(null);

  const handleLogout = async () => {
    try {
      await logout();
    } catch {
      window.location.href = "/";
    }
  };

  const dynamicNavigation = user?.role === "ADMIN" || user?.role === "SUPER_ADMIN"
    ? [...navigation, { name: "Admin Dashboard", href: "/admin", icon: Shield }]
    : navigation;

  useEffect(() => {
    if (isTablet) {
      useSidebarStore.getState().collapse();
    } else if (!isMobile && !isTablet) {
      useSidebarStore.getState().expand();
    }
  }, [isTablet, isMobile]);

  useEffect(() => {
    if (isMobile) setMobileOpen(false);
  }, [pathname, isMobile, setMobileOpen]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isMobileOpen) setMobileOpen(false);
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
      style={{ willChange: "width" }}
      className={cn(
        "flex flex-col shrink-0 h-full transition-[width] duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]",
        "bg-st-bg-sidebar border-r border-st-border",
        isCollapsed ? "w-[68px]" : "w-64"
      )}
    >
      <div className={cn("flex items-center shrink-0 relative", isCollapsed ? "p-3 justify-center" : "p-4 justify-between")}>
        <div className="absolute bottom-0 left-4 right-4 h-px bg-gradient-to-r from-transparent via-st-border to-transparent" />
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center gap-2.5 min-w-0 group">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-st-accent to-st-accent-hover flex items-center justify-center shadow-lg shadow-st-accent/15 shrink-0 group-hover:shadow-st-accent/25 transition-shadow duration-200">
              <span className="font-bold text-white text-sm">S</span>
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold tracking-tight text-st-text-primary leading-tight">StudyTrack</span>
              <span className="text-[10px] text-st-text-muted leading-tight">Learning OS</span>
            </div>
          </Link>
        )}
        {isCollapsed && (
          <Link href="/dashboard" className="flex items-center justify-center">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-st-accent to-st-accent-hover flex items-center justify-center shadow-lg shadow-st-accent/15">
              <span className="font-bold text-white text-sm">S</span>
            </div>
          </Link>
        )}
        <button
          onClick={toggle}
          className={cn(
            "flex items-center justify-center rounded-lg text-st-text-muted hover:text-st-text-primary hover:bg-st-bg-elevated transition-all duration-200",
            isCollapsed ? "w-8 h-8 mx-auto mt-2" : "w-8 h-8"
          )}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-expanded={!isCollapsed}
        >
          <ChevronLeft className={cn("w-4 h-4 transition-transform duration-300", isCollapsed && "rotate-180")} />
        </button>
      </div>

      <nav className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto overflow-x-hidden">
        {dynamicNavigation.map((item: NavItem) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "relative flex items-center gap-3 rounded-lg text-sm font-medium transition-all duration-150 group",
                isCollapsed ? "justify-center px-0 py-2.5 mx-auto w-10" : "px-3 py-2.5",
                isActive
                  ? "text-st-accent bg-st-accent-soft"
                  : "text-st-text-secondary hover:text-st-text-primary hover:bg-st-bg-elevated/80"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <div className={cn(
                "relative z-10 flex items-center justify-center w-5 h-5 shrink-0",
                isActive ? "text-st-accent" : "text-st-text-muted group-hover:text-st-text-primary transition-colors duration-150"
              )}>
                <item.icon className="w-[18px] h-[18px]" strokeWidth={isActive ? 2.5 : 1.5} />
              </div>
              <AnimatePresence>
                {!isCollapsed && (
                  <motion.span
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.15 }}
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
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  className="relative z-10 ml-auto w-1.5 h-1.5 rounded-full bg-st-accent shrink-0"
                />
              )}
            </Link>
          );
        })}
      </nav>

      <div className={cn("border-t border-st-border shrink-0 space-y-1", isCollapsed ? "p-2" : "p-4")}>
        {!isCollapsed ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="space-y-1"
          >
            <button className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-st-text-secondary hover:text-st-text-primary hover:bg-st-bg-elevated/80 transition-all duration-150">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <span>Help & Support</span>
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-3 px-3 py-2 w-full rounded-lg text-sm font-medium text-st-danger hover:bg-st-danger/10 transition-all duration-150"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              <span>Logout</span>
            </button>
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.15 }}
            className="flex flex-col items-center gap-1"
          >
            <button className="w-9 h-9 flex items-center justify-center rounded-lg text-st-text-muted hover:text-st-text-primary hover:bg-st-bg-elevated transition-all duration-200" aria-label="Help">
              <HelpCircle className="w-4 h-4" />
            </button>
            <button
              onClick={handleLogout}
              className="w-9 h-9 flex items-center justify-center rounded-lg text-st-danger hover:bg-st-danger/10 transition-all duration-200"
              aria-label="Logout"
            >
              <LogOut className="w-4 h-4" />
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
          className="fixed top-3 left-3 z-50 w-9 h-9 flex items-center justify-center rounded-lg bg-st-bg-card border border-st-border text-st-text-secondary hover:text-st-text-primary transition-all duration-200 md:hidden shadow-sm"
          aria-label="Open navigation menu"
        >
          <Menu className="w-[18px] h-[18px]" />
        </button>

        <AnimatePresence>
          {isMobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
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
                  {React.cloneElement(sidebarContent as React.ReactElement<{ style?: React.CSSProperties }>, {
                    style: { borderRight: "1px solid var(--color-st-border)", willChange: "transform" }
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
