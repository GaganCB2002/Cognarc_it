"use client";

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { api, API_URL } from './api';

interface TrackerProps {
  sessionId: string | null;
  isActive: boolean;
}

type TrackerEvent = {
  trackingSessionId: string | null;
  eventType: string;
  category: string;
  module: string;
  label?: string;
  duration: number;
  metadata?: Record<string, unknown>;
  createdAt: string;
};

export function useActivityTracker({ sessionId, isActive }: TrackerProps) {
  const pathname = usePathname();
  const eventQueue = useRef<TrackerEvent[]>([]);
  const lastActiveTime = useRef<number>(Date.now());
  const lastScrollPos = useRef<number>(0);
  const pageEnterTime = useRef<number>(Date.now());
  const activePage = useRef<string>('home');

  const queueEvent = useCallback((
    eventType: string,
    category: string = 'OTHER',
    moduleName?: string,
    label?: string,
    duration: number = 0,
    metadata?: Record<string, unknown>
  ) => {
    eventQueue.current.push({
      trackingSessionId: sessionId,
      eventType,
      category,
      module: moduleName || activePage.current,
      label,
      duration,
      metadata,
      createdAt: new Date().toISOString()
    });
    lastActiveTime.current = Date.now();
  }, [sessionId]);

  useEffect(() => {
    if (!isActive || !sessionId) return;

    const prevPage = activePage.current;
    const dwellDuration = Math.round((Date.now() - pageEnterTime.current) / 1000);
    
    if (dwellDuration > 1 && sessionId) {
      queueEvent('PAGE_DWELL', 'LEARNING', prevPage, `Spent ${dwellDuration}s on ${prevPage}`, dwellDuration);
    }

    const newModule = pathname.split('/')[1] || 'home';
    activePage.current = newModule;
    pageEnterTime.current = Date.now();

    queueEvent('PAGE_VIEW', 'LEARNING', newModule, `Visited ${newModule}`);

  }, [pathname, sessionId, isActive, queueEvent]);

  const flushEvents = useCallback(async () => {
    if (eventQueue.current.length === 0 || !sessionId) return;
    const eventsToSend = [...eventQueue.current].filter(e => e.trackingSessionId === sessionId);
    if (eventsToSend.length === 0) return;
    eventQueue.current = eventQueue.current.filter(e => e.trackingSessionId !== sessionId);
    try {
      await api.post(`/tracking/sessions/batch-activities`, { events: eventsToSend });
    } catch {
      eventQueue.current.push(...eventsToSend);
    }
  }, [sessionId]);

  useEffect(() => {
    if (!isActive || !sessionId) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        queueEvent('KEYBOARD_SHORTCUT', 'TASK', activePage.current, 'Save shortcut (Ctrl+S)');
      }
    };

    const handleVisibilityChange = () => {
      if (document.hidden) {
        queueEvent('TAB_HIDDEN', 'BREAK', activePage.current, 'Switched tab/minimized app');
      } else {
        queueEvent('TAB_VISIBLE', 'LEARNING', activePage.current, 'Returned to application');
        lastActiveTime.current = Date.now();
      }
    };

    let scrollTimeout: NodeJS.Timeout;
    const handleScroll = () => {
      clearTimeout(scrollTimeout);
      scrollTimeout = setTimeout(() => {
        const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
        if (scrollHeight <= 0) return;
        const pct = Math.round((window.scrollY / scrollHeight) * 100);
        if (Math.abs(pct - lastScrollPos.current) > 20) {
          queueEvent('PAGE_SCROLL', 'READING', activePage.current, `Scrolled page to ${pct}%`, 0, { percent: pct });
          lastScrollPos.current = pct;
        }
      }, 500);
    };

    const idleCheckInterval = setInterval(() => {
      const idleTime = Date.now() - lastActiveTime.current;
      if (idleTime > 60000) {
        queueEvent('USER_IDLE', 'IDLE', activePage.current, 'User idle for > 60s', Math.round(idleTime / 1000));
        lastActiveTime.current = Date.now();
      }
    }, 15000);

    const uploadInterval = setInterval(() => {
      flushEvents();
    }, 5000);

    const handleBeforeUnload = () => {
      if (eventQueue.current.length > 0) {
        const token = api.getToken();
        const url = token
          ? `${API_URL}/tracking/sessions/batch-activities?token=${encodeURIComponent(token)}`
          : `${API_URL}/tracking/sessions/batch-activities`;
        navigator.sendBeacon(
          url,
          new Blob([JSON.stringify({ events: eventQueue.current })], { type: 'application/json' })
        );
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('beforeunload', handleBeforeUnload);

    lastActiveTime.current = Date.now();

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(idleCheckInterval);
      clearInterval(uploadInterval);
    };
  }, [sessionId, isActive, flushEvents, queueEvent]);

}
