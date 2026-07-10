"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';
import { useActivityTracker } from '@/lib/useActivityTracker';

export type SessionStatus = 'IDLE' | 'ACTIVE' | 'PAUSED';

interface SessionState {
  status: SessionStatus;
  sessionId: string | null;
  duration: number;
  projectName: string | null;
  focusScore: number;
  productivityScore: number;
}

export interface SessionContextType {
  session: SessionState;
  startSession: (projectName?: string) => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  stopSession: () => Promise<any>;
  isInitializing: boolean;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState>({
    status: 'IDLE',
    sessionId: null,
    duration: 0,
    projectName: null,
    focusScore: 0,
    productivityScore: 0,
  });
  const [isInitializing, setIsInitializing] = useState(true);

  const pathname = usePathname();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize micro-tracking when status is ACTIVE
  useActivityTracker({
    sessionId: session.sessionId,
    isActive: session.status === 'ACTIVE'
  });

  const fetchCurrentSession = async () => {
    if (!api.getToken()) {
      setIsInitializing(false);
      return;
    }
    try {
      const res = (await api.get('/tracking/sessions/current')) as any;
      if (res?.data && (res.data.status === 'ACTIVE' || res.data.status === 'PAUSED')) {
        const start = new Date(res.data.startTime).getTime();
        const now = Date.now();
        const pauseMs = res.data.totalPauseMs || 0;
        
        let elapsed = now - start - pauseMs;
        if (res.data.status === 'PAUSED' && res.data.pausedAt) {
          const pausedAt = new Date(res.data.pausedAt).getTime();
          elapsed = pausedAt - start - pauseMs;
        }

        setSession({
          status: res.data.status as SessionStatus,
          sessionId: res.data.id,
          duration: Math.max(0, Math.round(elapsed / 1000)),
          projectName: res.data.projectName || 'General Deep Work',
          focusScore: 0,
          productivityScore: 0,
        });
      } else {
        // Explicitly clear if no active session returned
        setSession(prev => prev.status !== 'IDLE' ? {
          ...prev, status: 'IDLE', sessionId: null, duration: 0
        } : prev);
      }
    } catch (error) {
      console.error('Failed to fetch current session:', error);
      setSession(prev => prev.status !== 'IDLE' ? {
        ...prev, status: 'IDLE' as SessionStatus, sessionId: null, duration: 0
      } : prev);
    } finally {
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    // Attempt to recover active session on mount
    fetchCurrentSession();
  }, []);

  useEffect(() => {
    if (session.status === 'ACTIVE') {
      timerRef.current = setInterval(() => {
        setSession(prev => ({ ...prev, duration: prev.duration + 1 }));
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [session.status]);

  const startSession = async (projectName: string = 'General Deep Work') => {
    const deviceName = typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown Device';

    try {
      const res = (await api.post('/tracking/sessions/start', {
        deviceId: 'web-client',
        deviceName,
        projectName,
      })) as any;

      setSession({
        status: 'ACTIVE',
        sessionId: res.data.id,
        duration: 0,
        projectName,
        focusScore: 0,
        productivityScore: 0,
      });
    } catch (err: any) {
      if (err.message && err.message.includes('already exists')) {
        // Auto-recover if the server says an active session exists
        // DO NOT throw an error to the user, just silently sync the state
        await fetchCurrentSession();
        return;
      }
      throw err;
    }
  };

  const pauseSession = async () => {
    if (!session.sessionId) return;
    try {
      await api.post(`/tracking/sessions/${session.sessionId}/pause`);
      setSession(prev => ({ ...prev, status: 'PAUSED' }));
    } catch (error) {
      console.error('Failed to pause session', error);
    }
  };

  const resumeSession = async () => {
    if (!session.sessionId) return;
    try {
      await api.post(`/tracking/sessions/${session.sessionId}/resume`);
      setSession(prev => ({ ...prev, status: 'ACTIVE' }));
    } catch (error) {
      console.error('Failed to resume session', error);
    }
  };

  const stopSession = async () => {
    if (!session.sessionId) return null;
    try {
      const res = (await api.post(`/tracking/sessions/${session.sessionId}/stop`)) as any;
      setSession({
        status: 'IDLE',
        sessionId: null,
        duration: 0,
        projectName: null,
        focusScore: 0,
        productivityScore: 0,
      });
      const reportData = res.data?.report || res.data;
      return reportData;
    } catch (error) {
      console.error('Failed to stop session', error);
      return null;
    }
  };

  return (
    <SessionContext.Provider value={{ session, startSession, pauseSession, resumeSession, stopSession, isInitializing }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
}
