"use client";

import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { api } from '@/lib/api';

export type SessionStatus = 'IDLE' | 'ACTIVE' | 'PAUSED';

interface SessionState {
  status: SessionStatus;
  sessionId: string | null;
  duration: number;
  projectName: string;
  location: { lat: number; lng: number } | null;
  focusScore: number;
  productivityScore: number;
}

interface SessionContextValue {
  session: SessionState;
  startSession: (projectName?: string) => Promise<void>;
  pauseSession: () => Promise<void>;
  resumeSession: () => Promise<void>;
  stopSession: () => Promise<any>;
}

const SessionContext = createContext<SessionContextValue | undefined>(undefined);

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<SessionState>({
    status: 'IDLE',
    sessionId: null,
    duration: 0,
    projectName: '',
    location: null,
    focusScore: 100,
    productivityScore: 100,
  });

  const pathname = usePathname();
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const getLocation = (): Promise<{ lat: number; lng: number } | null> => {
    return new Promise((resolve) => {
      if (typeof navigator !== 'undefined' && navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
          () => resolve(null),
          { timeout: 3000 }
        );
      } else {
        resolve(null);
      }
    });
  };

  const fetchCurrentSession = async () => {
    try {
      const res = (await api.get('/tracking/sessions/current')) as any;
      if (res?.data && res.data.isActive) {
        setSession({
          status: 'ACTIVE',
          sessionId: res.data.id,
          duration: res.data.totalDuration || 0,
          projectName: res.data.projectName || 'General Deep Work',
          location: null,
          focusScore: 100,
          productivityScore: 100,
        });
      }
    } catch (error) {
      // No active session or error
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

  useEffect(() => {
    if (session.status === 'ACTIVE' && session.sessionId && pathname) {
      const module = pathname.split('/')[1] || 'home';
      api.post(`/tracking/sessions/${session.sessionId}/activities`, {
        trackingSessionId: session.sessionId,
        eventType: 'PAGE_VIEW',
        category: 'LEARNING',
        module,
        label: `Viewed ${module}`
      }).catch(() => {});
    }
  }, [pathname, session.status, session.sessionId]);

  const startSession = async (projectName: string = 'General Deep Work') => {
    const loc = await getLocation();
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
        location: loc,
        focusScore: 100,
        productivityScore: 100,
      });
    } catch (err: any) {
      if (err.message && err.message.includes('already exists')) {
        // Auto-recover if the server says an active session exists
        await fetchCurrentSession();
        throw new Error('You had an active session running elsewhere. We have synced it for you! You can now stop it.');
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
        projectName: '',
        location: null,
        focusScore: 100,
        productivityScore: 100,
      });
      const reportData = res.data?.report || res.data;
      return reportData;
    } catch (error) {
      console.error('Failed to stop session', error);
      return null;
    }
  };

  return (
    <SessionContext.Provider value={{ session, startSession, pauseSession, resumeSession, stopSession }}>
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
