"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { format } from "date-fns";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { GlobalSearch } from "@/components/ui/GlobalSearch";
import { HeaderSessionPanel } from "@/components/dashboard/HeaderSessionPanel";
import { UserButton, useUser } from "@clerk/nextjs";
import {
  Bell,
  Upload,
  FileText,
  CheckSquare,
  MessageSquare,
  Calendar,
  Sparkles,
  ChevronRight,
  Bot
} from "lucide-react";
import { 
  SiYoutube, 
  SiLeetcode, 
  SiGeeksforgeeks, 
  SiHackerrank, 
  SiGithub, 
  SiStackoverflow
} from "react-icons/si";
import { toast } from "react-hot-toast";

interface HeaderProps {
  showNotifications: boolean;
  setShowNotifications: (v: boolean) => void;
  notificationsCount: number;
  notifRef: React.RefObject<HTMLDivElement | null>;
  children: React.ReactNode;
}

export function Header({ 
  showNotifications, 
  setShowNotifications, 
  notificationsCount, 
  notifRef, 
  children
}: HeaderProps) {
  const pathname = usePathname();
  const { user, isLoaded } = useUser();
  
  const paths = pathname.split("/").filter(Boolean);
  const breadcrumbs = paths.map((p) => p.charAt(0).toUpperCase() + p.slice(1));
  
  const today = format(new Date(), "EEEE, MMMM d, yyyy");
  const hour = new Date().getHours();
  let greeting = "Good Evening";
  if (hour < 12) greeting = "Good Morning";
  else if (hour < 18) greeting = "Good Afternoon";

  const firstName = isLoaded && user ? user.firstName : "Gagan";

  const shortcuts = [
    { name: "YouTube", icon: SiYoutube, color: "hover:text-[#FF0000]", url: "https://youtube.com" },
    { name: "LeetCode", icon: SiLeetcode, color: "hover:text-[#FFA116]", url: "https://leetcode.com" },
    { name: "GeeksforGeeks", icon: SiGeeksforgeeks, color: "hover:text-[#2F8D46]", url: "https://geeksforgeeks.org" },
    { name: "HackerRank", icon: SiHackerrank, color: "hover:text-[#00EA64]", url: "https://hackerrank.com" },
    { name: "GitHub", icon: SiGithub, color: "hover:text-st-text-primary", url: "https://github.com" },
    { name: "Stack Overflow", icon: SiStackoverflow, color: "hover:text-[#F58025]", url: "https://stackoverflow.com" },
    { name: "ChatGPT", icon: Bot, color: "hover:text-[#10A37F]", url: "https://chat.openai.com" },
    { name: "Gemini", icon: Sparkles, color: "hover:text-[#8E75FF]", url: "https://gemini.google.com" },
    { name: "Perplexity", icon: Bot, color: "hover:text-[#22B8CD]", url: "https://perplexity.ai" },
  ];

  const quickActions = [
    { name: "Upload", icon: Upload, onClick: () => toast("Upload dialog opened") },
    { name: "New Note", icon: FileText, onClick: () => { window.location.href = "/notes"; } },
    { name: "New Task", icon: CheckSquare, onClick: () => { window.location.href = "/tasks"; } },
    { name: "AI Chat", icon: MessageSquare, onClick: () => toast("AI Chat opened") },
    { name: "Event", icon: Calendar, onClick: () => { window.location.href = "/calendar"; } },
  ];

  return (
    <header className="flex items-center justify-between px-6 py-3 bg-st-bg-card/70 backdrop-blur-xl border-b border-st-border sticky top-0 z-40 gap-4 shadow-sm">
      
      <div className="flex flex-col min-w-[200px]">
        <div className="flex items-center text-xs font-medium text-st-text-muted mb-0.5">
          <span>Home</span>
          {breadcrumbs.map((crumb, idx) => (
            <React.Fragment key={idx}>
              <ChevronRight className="w-3 h-3 mx-1 opacity-50" />
              <span className={idx === breadcrumbs.length - 1 ? "text-st-accent font-semibold" : ""}>
                {crumb}
              </span>
            </React.Fragment>
          ))}
        </div>
        <h1 className="text-sm font-semibold text-st-text-primary flex items-center gap-2">
          {greeting}, {firstName} <span className="animate-wave inline-block origin-bottom-right">👋</span>
        </h1>
        <p className="text-[10px] text-st-text-muted">{today}</p>
      </div>

      <div className="flex-1 flex justify-center max-w-lg hidden md:flex">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-3 shrink-0">
        <div className="hidden lg:flex items-center gap-0.5 px-3 py-1.5 bg-st-bg-elevated/60 rounded-xl border border-st-border">
          {shortcuts.map((shortcut) => (
            <a
              key={shortcut.name}
              href={shortcut.url}
              target="_blank"
              rel="noopener noreferrer"
              title={shortcut.name}
              className={`p-1.5 text-st-text-muted transition-all duration-200 hover:-translate-y-0.5 ${shortcut.color}`}
            >
              <shortcut.icon className="w-4 h-4" />
            </a>
          ))}
        </div>

        <div className="hidden xl:flex items-center gap-0.5">
          {quickActions.map((action) => (
            <button
              key={action.name}
              onClick={action.onClick}
              title={action.name}
              className="p-2 text-st-text-secondary hover:text-st-accent hover:bg-st-accent-soft rounded-lg transition-colors"
            >
              <action.icon className="w-[18px] h-[18px]" />
            </button>
          ))}
        </div>

        <div className="hidden sm:block">
          <HeaderSessionPanel />
        </div>

        <div className="w-px h-5 bg-st-border hidden md:block" />

        <div className="flex items-center gap-1.5">
          <ThemeToggle />

          <div className="relative" ref={notifRef}>
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative flex items-center justify-center w-9 h-9 rounded-lg text-st-text-secondary hover:text-st-accent hover:bg-st-accent-soft transition-all duration-200"
              aria-label="Notifications"
            >
              <Bell className="w-[18px] h-[18px]" />
              {notificationsCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-st-danger border-2 border-st-bg-card flex items-center justify-center text-[8px] font-bold text-white shadow-sm">
                  {notificationsCount}
                </span>
              )}
            </button>
            {children}
          </div>
        </div>

        <div className="pl-2 border-l border-st-border">
          {isLoaded ? (
            <UserButton 
              appearance={{
                elements: {
                  avatarBox: "w-9 h-9 border border-st-border shadow-sm rounded-lg"
                }
              }}
            />
          ) : (
            <div className="w-9 h-9 rounded-lg bg-st-bg-elevated border border-st-border animate-pulse" />
          )}
        </div>

      </div>
    </header>
  );
}
