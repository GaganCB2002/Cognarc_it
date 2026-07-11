"use client";

import React, { useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { useAuth } from '@/lib/auth-context';
import { api, API_URL } from '@/lib/api';
import { Play, Pause, Square, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function HeaderSessionPanel() {
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
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to start session");
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
      <div className="flex items-center gap-2 px-3 py-1.5 bg-st-bg-elevated rounded-lg border border-st-border opacity-50 text-st-text-muted text-xs font-medium">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>Syncing...</span>
      </div>
    );
  }

  if (session.status === 'IDLE') {
    return (
      <div className="relative">
        <button
          onClick={handleStart}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 bg-st-accent hover:bg-st-accent-hover text-white rounded-lg text-xs font-semibold transition-all duration-200 shadow-sm disabled:opacity-70"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          {loading ? "STARTING..." : "START SESSION"}
        </button>
        {error && <span className="absolute top-full left-0 mt-1 text-[10px] text-st-danger whitespace-nowrap">{error}</span>}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-3 px-3 py-1.5 bg-st-bg-card border border-st-border rounded-lg shadow-sm">
      
      {/* Status Dot & Timer */}
      <div className="flex items-center gap-2 pr-3 border-r border-st-border/50">
        <span className={cn("w-2 h-2 rounded-full", session.status === 'ACTIVE' ? 'bg-st-success animate-pulse' : 'bg-st-warning')} />
        <span className="font-mono text-sm font-bold text-st-text-primary tabular-nums tracking-wider mt-0.5">
          {formatDuration(session.duration)}
        </span>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-1">
        {session.status === 'ACTIVE' ? (
          <button 
            onClick={pauseSession}
            title="Pause Session"
            className="p-1.5 text-st-text-muted hover:text-st-warning hover:bg-st-warning/10 rounded-md transition-colors"
          >
            <Pause className="w-4 h-4" />
          </button>
        ) : (
          <button 
            onClick={resumeSession}
            title="Resume Session"
            className="p-1.5 text-st-text-muted hover:text-st-success hover:bg-st-success/10 rounded-md transition-colors"
          >
            <Play className="w-4 h-4" />
          </button>
        )}
        <button 
          onClick={handleStop}
          title="Stop & Get Report"
          className="p-1.5 text-st-text-muted hover:text-st-danger hover:bg-st-danger/10 rounded-md transition-colors"
        >
          <Square className="w-4 h-4 fill-current" />
        </button>
      </div>
    </div>
  );
}
