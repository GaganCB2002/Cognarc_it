"use client";

import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { api } from '@/lib/api';
import { useActivityTracker } from '@/lib/useActivityTracker';
import toast from 'react-hot-toast';

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
  stopSession: () => Promise<{ session?: { id: string }; id?: string } | null>;
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
  const isProcessing = useRef(false);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize micro-tracking when status is ACTIVE
  useActivityTracker({
    sessionId: session.sessionId,
    isActive: session.status === 'ACTIVE'
  });

  const fetchCurrentSession = useCallback(async () => {
    if (!api.getToken()) {
      setIsInitializing(false);
      return;
    }
    try {
      const res = (await api.get<{ id: string; status: string; startTime: string; totalPauseMs: number; pausedAt?: string; projectName?: string }>('/tracking/sessions/current'));
      if (res && (res.status === 'ACTIVE' || res.status === 'PAUSED')) {
        const start = new Date(res.startTime).getTime();
        const now = Date.now();
        const pauseMs = res.totalPauseMs || 0;
        
        let elapsed = now - start - pauseMs;
        if (res.status === 'PAUSED' && res.pausedAt) {
          const pausedAt = new Date(res.pausedAt).getTime();
          elapsed = pausedAt - start - pauseMs;
        }

        setSession({
          status: res.status as SessionStatus,
          sessionId: res.id,
          duration: Math.max(0, Math.round(elapsed / 1000)),
          projectName: res.projectName || 'General Deep Work',
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
  }, []);

  useEffect(() => {
    // Attempt to recover active session on mount
    fetchCurrentSession();
  }, [fetchCurrentSession]);

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
    if (isProcessing.current) return;
    isProcessing.current = true;

    const deviceName = typeof window !== 'undefined' ? window.navigator.userAgent : 'Unknown Device';

    try {
      const res = await api.post<{ id: string }>('/tracking/sessions/start', {
        deviceId: 'web-client',
        deviceName,
        projectName,
      });

      setSession({
        status: 'ACTIVE',
        sessionId: res.id,
        duration: 0,
        projectName,
        focusScore: 0,
        productivityScore: 0,
      });
      toast.success('Session started');
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Failed to start session');
      throw err;
    } finally {
      isProcessing.current = false;
    }
  };

  const pauseSession = async () => {
    if (isProcessing.current || !session.sessionId) return;
    isProcessing.current = true;
    try {
      await api.post(`/tracking/sessions/${session.sessionId}/pause`);
      setSession(prev => ({ ...prev, status: 'PAUSED' }));
      toast.success('Session paused');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to pause session';
      toast.error(msg);
      console.error('Failed to pause session', error);
    } finally {
      isProcessing.current = false;
    }
  };

  const resumeSession = async () => {
    if (isProcessing.current || !session.sessionId) return;
    isProcessing.current = true;
    try {
      await api.post(`/tracking/sessions/${session.sessionId}/resume`);
      setSession(prev => ({ ...prev, status: 'ACTIVE' }));
      toast.success('Session resumed');
    } catch (error) {
      const msg = error instanceof Error ? error.message : 'Failed to resume session';
      toast.error(msg);
      console.error('Failed to resume session', error);
    } finally {
      isProcessing.current = false;
    }
  };

  const stopSession = async () => {
    if (isProcessing.current || !session.sessionId) return null;
    isProcessing.current = true;
    try {
      const res = await api.post<{ report?: { session?: { id: string }; id?: string }; session?: { id: string }; id?: string }>(`/tracking/sessions/${session.sessionId}/stop`);
      setSession({
        status: 'IDLE',
        sessionId: null,
        duration: 0,
        projectName: null,
        focusScore: 0,
        productivityScore: 0,
      });
      const reportData = res.report || res.session || res;
      toast.success('Session completed');
      return reportData;
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Failed to stop session';
      toast.error(msg);
      console.error('Failed to stop session:', error);
      setSession({
        status: 'IDLE',
        sessionId: null,
        duration: 0,
        projectName: null,
        focusScore: 0,
        productivityScore: 0,
      });
      return null;
    } finally {
      isProcessing.current = false;
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
