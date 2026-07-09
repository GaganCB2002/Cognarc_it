"use client";

import { useEffect, useRef, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import { api, API_URL } from './api';

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

  const queueEvent = (
    eventType: string,
    category: string = 'OTHER',
    moduleName?: string,
    label?: string,
    duration: number = 0,
    metadata?: any
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
  };

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

  }, [pathname, sessionId, isActive]);

  const flushEvents = useCallback(async () => {
    if (eventQueue.current.length === 0) return;
    const eventsToSend = [...eventQueue.current];
    eventQueue.current = [];
    try {
      await api.post(`/tracking/sessions/batch-activities`, { events: eventsToSend });
    } catch {
      eventQueue.current.push(...eventsToSend);
    }
  }, []);

  useEffect(() => {
    if (!isActive || !sessionId) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const clickable = target.closest('button, a, [role="button"], input[type="submit"]');
      if (clickable) {
        const text = clickable.textContent?.trim().slice(0, 40) || (clickable as HTMLInputElement).value || clickable.getAttribute('aria-label') || 'element';
        queueEvent('CLICK', 'TASK', activePage.current, `Clicked "${text}"`, 0, { tag: clickable.tagName });
      }
    };

    const handleCopy = (e: ClipboardEvent) => {
      const text = (e.target as HTMLElement)?.textContent?.trim().slice(0, 60);
      if (text) queueEvent('COPY', 'TASK', activePage.current, `Copied text`, 0, { preview: text });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        queueEvent('KEYBOARD_SHORTCUT', 'TASK', activePage.current, 'Save shortcut (Ctrl+S)');
      }
    };

    const handleFormSubmit = (e: SubmitEvent) => {
      const form = e.target as HTMLFormElement;
      const action = form.action || form.getAttribute('action') || 'unknown';
      queueEvent('FORM_SUBMIT', 'TASK', activePage.current, `Form submitted`, 0, { action });
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

    let idleCheckInterval = setInterval(() => {
      const idleTime = Date.now() - lastActiveTime.current;
      if (idleTime > 60000) {
        queueEvent('USER_IDLE', 'IDLE', activePage.current, 'User idle for > 60s', Math.round(idleTime / 1000));
        lastActiveTime.current = Date.now();
      }
    }, 15000);

    let uploadInterval = setInterval(() => {
      flushEvents();
    }, 5000);

    const handleBeforeUnload = () => {
      if (eventQueue.current.length > 0) {
        navigator.sendBeacon(
          `${API_URL}/tracking/sessions/batch-activities`,
          new Blob([JSON.stringify({ events: eventQueue.current })], { type: 'application/json' })
        );
      }
    };

    window.addEventListener('click', handleClick, true);
    document.addEventListener('copy', handleCopy);
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('submit', handleFormSubmit, true);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('scroll', handleScroll);
    window.addEventListener('beforeunload', handleBeforeUnload);

    lastActiveTime.current = Date.now();

    return () => {
      window.removeEventListener('click', handleClick, true);
      document.removeEventListener('copy', handleCopy);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('submit', handleFormSubmit, true);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('scroll', handleScroll);
      window.removeEventListener('beforeunload', handleBeforeUnload);
      clearInterval(idleCheckInterval);
      clearInterval(uploadInterval);
    };
  }, [sessionId, isActive, flushEvents]);

}
