"use client";

import React, { useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useAuth } from '@/lib/auth-context';
import { api, API_URL } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Play, Pause, Square, Activity, MapPin, Loader2 } from 'lucide-react';

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function SidebarSessionPanel() {
  const { session, startSession, pauseSession, resumeSession, stopSession, isInitializing } = useSession();
  const { isAuthenticated: isSignedIn } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleStart = async () => {
    if (!isSignedIn) {
      setError("Sign in required");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await startSession();
    } catch (err: any) {
      setError(err.message || "Failed to start session");
    } finally {
      setLoading(false);
    }
  };

  const handleStop = async () => {
    const reportData = await stopSession();
    const sessionId = reportData?.session?.id || reportData?.id;
    if (sessionId) {
      const token = api.getToken();
      const downloadUrl = token
        ? `${API_URL}/tracking/sessions/${sessionId}/pdf?token=${encodeURIComponent(token)}`
        : `${API_URL}/tracking/sessions/${sessionId}/pdf`;
      window.open(downloadUrl, '_blank');
    }
  };

  if (isInitializing) {
    return (
      <Button disabled variant="outline" className="w-full justify-center opacity-50">
        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        Syncing...
      </Button>
    );
  }

  if (session.status === 'IDLE') {
    return (
      <div>
        <Button onClick={handleStart} disabled={loading} variant="primary" className="w-full justify-center">
          {loading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
          {loading ? "Starting..." : "START SESSION"}
        </Button>
        {error && <p className="text-xs text-st-danger text-center mt-1">{error}</p>}
      </div>
    );
  }

  return (
    <div className="bg-st-bg-elevated border border-st-border rounded-lg p-4 space-y-3">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold tracking-widest uppercase text-st-accent">
          {session.status === 'ACTIVE' ? 'Recording' : 'Paused'}
        </span>
        <span className={`w-2 h-2 rounded-full ${session.status === 'ACTIVE' ? 'bg-st-success animate-pulse' : 'bg-st-warning'}`} />
      </div>

      <div>
        <div className="font-mono text-2xl font-bold text-st-text-primary tabular-nums tracking-wider">
          {formatDuration(session.duration)}
        </div>
        <div className="text-xs text-st-text-muted mt-1 truncate">
          {session.projectName || 'General Deep Work'}
        </div>
      </div>

      <div className="flex items-center gap-2 pt-2">
        {session.status === 'ACTIVE' ? (
          <Button onClick={pauseSession} variant="outline" className="flex-1 px-0" size="sm">
            <Pause className="w-4 h-4" />
          </Button>
        ) : (
          <Button onClick={resumeSession} variant="outline" className="flex-1 px-0 border-st-success text-st-success hover:bg-st-success/10" size="sm">
            <Play className="w-4 h-4" />
          </Button>
        )}
        <Button onClick={handleStop} variant="outline" className="flex-1 px-0 border-st-danger text-st-danger hover:bg-st-danger/10" size="sm" title="Stop & Get PDF Report">
          <Square className="w-4 h-4 fill-current" />
        </Button>
      </div>
    </div>
  );
}
