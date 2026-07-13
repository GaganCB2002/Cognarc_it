"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "./api";

export interface Notification {
  id: string;
  title: string;
  body: string;
  type: "REMINDER" | "ACHIEVEMENT" | "SYSTEM" | "MENTOR";
  isRead: boolean;
  actionUrl?: string | null;
  createdAt: string;
}

interface NotificationsState {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  error: string | null;
}

export function useNotifications() {
  const [state, setState] = useState<NotificationsState>({
    notifications: [],
    unreadCount: 0,
    loading: true,
    error: null,
  });
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; notifications?: Notification[]; unreadCount?: number }>("/notifications?limit=50");
      if (res.success) {
        setState({
          notifications: res.notifications || [],
          unreadCount: res.unreadCount || 0,
          loading: false,
          error: null,
        });
      }
    } catch {
      setState((prev) => ({ ...prev, loading: false, error: "Failed to load notifications" }));
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    intervalRef.current = setInterval(fetchNotifications, 15000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [fetchNotifications]);

  const markAsRead = useCallback(async (id: string) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
        unreadCount: Math.max(0, prev.unreadCount - 1),
      }));
    } catch {}
  }, []);

  const markAllAsRead = useCallback(async () => {
    try {
      await api.patch("/notifications/read-all");
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
        unreadCount: 0,
      }));
    } catch {}
  }, []);

  const deleteNotification = useCallback(async (id: string) => {
    try {
      await api.delete(`/notifications/${id}`);
      setState((prev) => ({
        ...prev,
        notifications: prev.notifications.filter((n) => n.id !== id),
        unreadCount: prev.notifications.find((n) => n.id === id && !n.isRead) ? prev.unreadCount - 1 : prev.unreadCount,
      }));
    } catch {}
  }, []);

  const getRelativeTime = useCallback((dateStr: string) => {
    const now = Date.now();
    const date = new Date(dateStr).getTime();
    const diff = now - date;
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;
    return new Date(dateStr).toLocaleDateString();
  }, []);

  return {
    ...state,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    getRelativeTime,
  };
}
