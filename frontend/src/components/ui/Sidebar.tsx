"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BookOpen, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Users, 
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
  User
} from "lucide-react";
import { Button } from "@/components/ui/Button";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
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

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="w-64 border-r border-st-border bg-st-bg-secondary flex flex-col shrink-0 h-full">
      <div className="p-6 border-b border-st-border">
        <Link href="/dashboard" className="flex items-center gap-2 mb-1">
          <div className="w-6 h-6 bg-st-accent rounded-sm flex items-center justify-center">
            <span className="font-bold text-black text-sm">S</span>
          </div>
          <span className="text-lg font-semibold tracking-tight text-st-text-primary">StudyTrack</span>
        </Link>
        <p className="text-xs font-mono tracking-widest text-st-text-muted uppercase">Deep Work Mode</p>
      </div>

      <nav className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
        {navigation.map((item) => {
          const isActive = pathname === item.href || pathname?.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.name}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                isActive 
                  ? "bg-st-bg-elevated text-st-text-primary border-l-2 border-st-accent rounded-l-none" 
                  : "text-st-text-secondary hover:text-st-text-primary hover:bg-st-bg-elevated"
              }`}
            >
              <item.icon className="h-5 w-5 shrink-0" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-st-border">
        <Button variant="primary" className="w-full justify-center mb-6">
          START SESSION
        </Button>

        <div className="space-y-1">
          <button className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-st-text-secondary hover:text-st-text-primary hover:bg-st-bg-elevated transition-colors">
            <HelpCircle className="h-4 w-4" />
            Help
          </button>
          <button className="flex items-center gap-3 px-3 py-2 w-full rounded-md text-sm font-medium text-st-text-secondary hover:text-st-text-primary hover:bg-st-bg-elevated transition-colors">
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    </aside>
  );
}
