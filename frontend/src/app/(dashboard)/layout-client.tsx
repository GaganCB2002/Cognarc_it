"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Sidebar } from "@/components/ui/Sidebar";
import { Header } from "@/components/ui/Header";
import { useNotifications } from "@/lib/useNotifications";
import { Bell, CheckCircle2, Info, TriangleAlert, X, ChevronRight, Clock } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const typeIcons: Record<string, React.ComponentType<{ className?: string }>> = {
  REMINDER: Bell,
  ACHIEVEMENT: CheckCircle2,
  SYSTEM: Info,
  MENTOR: TriangleAlert,
};

const typeColors: Record<string, string> = {
  REMINDER: "text-blue-400 bg-blue-500/10",
  ACHIEVEMENT: "text-emerald-400 bg-emerald-500/10",
  SYSTEM: "text-st-accent bg-st-accent/10",
  MENTOR: "text-amber-400 bg-amber-500/10",
};

const typeBorderColors: Record<string, string> = {
  REMINDER: "border-l-blue-500/30",
  ACHIEVEMENT: "border-l-emerald-500/30",
  SYSTEM: "border-l-st-accent/30",
  MENTOR: "border-l-amber-500/30",
};

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { isLoading, isAuthenticated, userKey } = useAuth();
  const router = useRouter();
  const [showNotifications, setShowNotifications] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const menuNotifIdRef = useRef<string | null>(null);

  const {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getRelativeTime,
  } = useNotifications();

  const [menuNotifId, setMenuNotifId] = useState<string | null>(null);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setShowNotifications(false);
        setMenuNotifId(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkRead = useCallback(async (id: string) => {
    await markAsRead(id);
    setMenuNotifId(null);
  }, [markAsRead]);

  const handleDelete = useCallback(async (id: string) => {
    await deleteNotification(id);
    setMenuNotifId(null);
  }, [deleteNotification]);

  if (isLoading) {
    return (
      <div className="flex h-screen bg-gradient-to-b from-st-bg-primary via-st-bg-primary to-st-bg-secondary items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-2 border-st-accent border-t-transparent rounded-full animate-spin" />
          <p className="text-xs text-st-text-muted">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="flex h-screen bg-gradient-to-b from-st-bg-primary via-st-bg-primary to-st-bg-secondary overflow-hidden">
      <Sidebar />

      <main className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-st-accent/[0.02] blur-[120px] rounded-full pointer-events-none -z-0" />
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-st-accent/[0.01] blur-[100px] rounded-full pointer-events-none -z-0" />

        <Header
          showNotifications={showNotifications}
          setShowNotifications={setShowNotifications}
          notificationsCount={unreadCount}
          notifRef={notifRef}
        >
          <AnimatePresence>
            {showNotifications && (
              <motion.div
                initial={{ opacity: 0, y: -5, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -5, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute right-0 top-full mt-2 w-[380px] bg-st-bg-elevated border border-st-border rounded-xl shadow-2xl z-50 overflow-hidden"
              >
                {/* Header */}
                <div className="flex items-center justify-between px-4 py-3 border-b border-st-border/20">
                  <div className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-st-text-muted" />
                    <p className="text-sm font-semibold text-st-text-primary">Notifications</p>
                    {unreadCount > 0 && (
                      <span className="inline-flex items-center justify-center h-5 min-w-[20px] px-1.5 rounded-full bg-st-accent/20 text-[10px] font-bold text-st-accent">
                        {unreadCount}
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setShowNotifications(false)}
                    className="p-1 rounded-md text-st-text-muted hover:text-st-text-primary hover:bg-st-bg-card transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Body */}
                <div className="max-h-[400px] overflow-y-auto">
                  {loading ? (
                    <div className="p-4 space-y-3">
                      {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex gap-3 animate-fade-in" style={{ animationDelay: `${i * 80}ms` }}>
                          <div className="w-8 h-8 rounded-lg skeleton-shimmer shrink-0" />
                          <div className="flex-1 space-y-2">
                            <div className="h-3 w-3/4 skeleton-shimmer rounded" />
                            <div className="h-2.5 w-1/2 skeleton-shimmer rounded" />
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : error ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 px-6 text-center">
                      <TriangleAlert className="w-8 h-8 text-st-danger/50" />
                      <p className="text-xs text-st-text-muted">{error}</p>
                      <p className="text-[10px] text-st-text-muted/60">Pull to refresh or check your connection</p>
                    </div>
                  ) : notifications.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2">
                      <Bell className="w-8 h-8 text-st-text-muted/30" />
                      <p className="text-xs text-st-text-muted">No notifications yet</p>
                      <p className="text-[10px] text-st-text-muted/60">We&apos;ll let you know when something arrives</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-st-border/10">
                      {notifications.map((notif) => {
                        const Icon = typeIcons[notif.type] || Bell;
                        const colorClass = typeColors[notif.type] || typeColors.REMINDER;
                        const borderClass = typeBorderColors[notif.type] || typeBorderColors.REMINDER;
                        const isMenuOpen = menuNotifId === notif.id;
                        return (
                          <div
                            key={notif.id}
                            className={cn(
                              "relative flex gap-3 px-4 py-3 transition-colors border-l-2",
                              borderClass,
                              notif.isRead ? "bg-transparent" : "bg-st-bg-card/30",
                              "hover:bg-st-bg-card/50"
                            )}
                          >
                            {/* Icon */}
                            <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5", colorClass)}>
                              <Icon className="w-4 h-4" />
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-start gap-2">
                                <p className={cn(
                                  "text-sm leading-snug flex-1 min-w-0",
                                  notif.isRead ? "text-st-text-secondary" : "text-st-text-primary font-medium"
                                )}>
                                  {notif.title}
                                </p>
                                {/* Unread dot */}
                                {!notif.isRead && (
                                  <span className="w-2 h-2 rounded-full bg-st-accent shrink-0 mt-1.5" />
                                )}
                              </div>
                              {notif.body && (
                                <p className="text-xs text-st-text-muted mt-1 leading-relaxed break-words">
                                  {notif.body}
                                </p>
                              )}
                              <div className="flex items-center gap-3 mt-1.5">
                                <span className="text-[10px] text-st-text-muted/60 flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {getRelativeTime(notif.createdAt)}
                                </span>
                              </div>
                            </div>

                            {/* Action Menu */}
                            <div className="relative shrink-0">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setMenuNotifId(isMenuOpen ? null : notif.id);
                                  menuNotifIdRef.current = notif.id;
                                }}
                                className="p-1 rounded-md text-st-text-muted hover:text-st-text-primary hover:bg-st-bg-card transition-colors opacity-0 group-hover:opacity-100"
                                style={{ opacity: isMenuOpen ? 1 : undefined }}
                              >
                                <ChevronRight className="w-4 h-4" />
                              </button>

                              {isMenuOpen && (
                                <div className="absolute right-0 top-8 w-36 bg-st-bg-elevated border border-st-border rounded-lg shadow-xl z-50 py-1">
                                  {!notif.isRead && (
                                    <button
                                      onClick={() => handleMarkRead(notif.id)}
                                      className="w-full text-left px-3 py-2 text-xs text-st-text-secondary hover:bg-st-bg-card hover:text-st-text-primary transition-colors"
                                    >
                                      Mark as read
                                    </button>
                                  )}
                                  <button
                                    onClick={() => handleDelete(notif.id)}
                                    className="w-full text-left px-3 py-2 text-xs text-st-danger hover:bg-st-bg-card transition-colors"
                                  >
                                    Delete
                                  </button>
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Footer */}
                {notifications.length > 0 && (
                  <div className="flex items-center justify-between px-4 py-2.5 border-t border-st-border/20 bg-st-bg-card/20">
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-st-accent hover:text-st-accent-hover transition-colors font-medium"
                    >
                      Mark all as read
                    </button>
                    <button
                      onClick={() => setShowNotifications(false)}
                      className="text-xs text-st-text-muted hover:text-st-text-primary transition-colors"
                    >
                      Close
                    </button>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </Header>

        <motion.main
          key={userKey}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.2 }}
          className="flex-1 overflow-y-auto px-6 py-6 relative z-10"
        >
          {children}
        </motion.main>
      </main>

    </div>
  );
}
