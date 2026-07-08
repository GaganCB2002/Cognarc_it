"use client";

import { useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { api } from './api';

interface TrackerProps {
  sessionId: string | null;
  isActive: boolean;
}

export function useActivityTracker({ sessionId, isActive }: TrackerProps) {
  const pathname = usePathname();
  const eventQueue = useRef<any[]>([]);
  const lastActiveTime = useRef<number>(Date.now());
  const lastScrollPos = useRef<number>(0);
  const pageEnterTime = useRef<number>(Date.now());
  const activePage = useRef<string>('home');

  useEffect(() => {
    if (!isActive || !sessionId) return;

    // 1. Dwell Time Tracking on Pathname Change
    const prevPage = activePage.current;
    const dwellDuration = Math.round((Date.now() - pageEnterTime.current) / 1000);
    
    if (dwellDuration > 1 && sessionId) {
      queueEvent('PAGE_DWELL', 'LEARNING', prevPage, `Spent ${dwellDuration}s on ${prevPage}`, dwellDuration);
    }

    const newModule = pathname.split('/')[1] || 'home';
    activePage.current = newModule;
    pageEnterTime.current = Date.now();

    // Log Page View immediately
    queueEvent('PAGE_VIEW', 'LEARNING', newModule, `Visited ${newModule}`);

  }, [pathname, sessionId, isActive]);

  useEffect(() => {
    if (!isActive || !sessionId) return;

    // Helper to queue activities
    const queueEvent = (
      eventType: string,
      category: string = 'OTHER',
      moduleName: string = activePage.current,
      label?: string,
      duration: number = 0,
      metadata?: any
    ) => {
      eventQueue.current.push({
        trackingSessionId: sessionId,
        eventType,
        category,
        module: moduleName,
        label,
        duration,
        metadata,
        createdAt: new Date().toISOString()
      });
      lastActiveTime.current = Date.now();
    };

    // 2. Click Interactions tracking
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const clickable = target.closest('button, a, [role="button"], input[type="submit"]');
      if (clickable) {
        const text = clickable.textContent?.trim().slice(0, 40) || (clickable as HTMLInputElement).value || clickable.getAttribute('aria-label') || 'element';
        queueEvent('CLICK', 'TASK', activePage.current, `Clicked "${text}"`, 0, { tag: clickable.tagName });
      }
    };

    // 3. Tab Visibility tracking
    const handleVisibilityChange = () => {
      if (document.hidden) {
        queueEvent('TAB_HIDDEN', 'BREAK', activePage.current, 'Switched tab/minimized app');
      } else {
        queueEvent('TAB_VISIBLE', 'LEARNING', activePage.current, 'Returned to application');
        lastActiveTime.current = Date.now();
      }
    };

    // 4. Scroll depth tracking (debounce style)
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

    // 5. Idle detection (60 seconds idle -> IDLE event)
    let idleCheckInterval = setInterval(() => {
      const idleTime = Date.now() - lastActiveTime.current;
      if (idleTime > 60000) {
        queueEvent('USER_IDLE', 'IDLE', activePage.current, 'User idle for > 60s', Math.round(idleTime / 1000));
        // Reset active time to prevent continuous spamming
        lastActiveTime.current = Date.now();
      }
    }, 15000);

    // 6. Batch upload events every 10 seconds to backend
    let uploadInterval = setInterval(() => {
      if (eventQueue.current.length === 0) return;

      const eventsToSend = [...eventQueue.current];
      eventQueue.current = [];

      // Send each sequentially to server API /tracking/sessions/:id/activities
      eventsToSend.forEach(async (ev) => {
        try {
          await api.post(`/tracking/sessions/${sessionId}/activities`, ev);
        } catch (err) {
          // If fail, put back in queue
          eventQueue.current.push(ev);
        }
      });
    }, 10000);

    // Event listeners registration
    window.addEventListener('click', handleClick, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('scroll', handleScroll);

    // Initial check update
    lastActiveTime.current = Date.now();

    return () => {
      window.removeEventListener('click', handleClick, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('scroll', handleScroll);
      clearInterval(idleCheckInterval);
      clearInterval(uploadInterval);
    };
  }, [sessionId, isActive]);

  // Utility queue helper
  const queueEvent = (
    eventType: string,
    category: string = 'OTHER',
    moduleName: string = activePage.current,
    label?: string,
    duration: number = 0,
    metadata?: any
  ) => {
    if (!sessionId) return;
    eventQueue.current.push({
      trackingSessionId: sessionId,
      eventType,
      category,
      module: moduleName,
      label,
      duration,
      metadata,
      createdAt: new Date().toISOString()
    });
  };
}
