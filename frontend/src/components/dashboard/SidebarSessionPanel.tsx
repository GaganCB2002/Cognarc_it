"use client";

import React, { useState } from 'react';
import { useSession } from '@/contexts/SessionContext';
import { Button } from '@/components/ui/Button';
import { Play, Pause, Square, Activity, MapPin } from 'lucide-react';

function formatDuration(seconds: number) {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
}

export function SidebarSessionPanel() {
  const { session, startSession, pauseSession, resumeSession, stopSession } = useSession();
  const [showReport, setShowReport] = useState(false);
  const [lastReport, setLastReport] = useState<any>(null);

  const handleStop = async () => {
    const report = await stopSession();
    if (report) {
      setLastReport(report);
      setShowReport(true);
    }
  };

  if (session.status === 'IDLE') {
    return (
      <>
        <Button onClick={() => startSession()} variant="primary" className="w-full justify-center">
          <Play className="w-4 h-4 mr-2" />
          START SESSION
        </Button>

        {/* Temporary overlay just to show the generated report for demonstration */}
        {showReport && lastReport && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-st-bg-primary border border-st-border rounded-xl p-6 max-w-lg w-full shadow-2xl">
              <h3 className="text-xl font-bold text-st-text-primary mb-2">Session Completed</h3>
              <p className="text-sm text-st-text-secondary mb-4">AI generated summary of your deep work session.</p>
              
              <div className="space-y-4 text-sm">
                <div className="flex justify-between bg-st-bg-elevated p-3 rounded-lg border border-st-border">
                  <span className="text-st-text-muted">Duration</span>
                  <span className="font-mono text-st-accent font-bold">{formatDuration(lastReport.durationSeconds || 0)}</span>
                </div>
                
                <div className="bg-st-bg-elevated p-4 rounded-lg border border-st-border space-y-2">
                  <p className="text-st-text-primary font-medium flex items-center gap-2">
                    <Activity className="w-4 h-4 text-st-accent" /> AI Insights
                  </p>
                  <p className="text-st-text-secondary text-xs leading-relaxed">
                    {lastReport.summary || "You maintained a strong focus during this session. Good job engaging with the learning materials and tracking your progress."}
                  </p>
                </div>
              </div>

              <Button onClick={() => setShowReport(false)} className="w-full mt-6" variant="outline">
                Close Report
              </Button>
            </div>
          </div>
        )}
      </>
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

      {session.location && (
        <div className="flex items-center gap-1.5 text-[10px] text-st-text-secondary">
          <MapPin className="w-3 h-3 text-st-accent" />
          Location tracked locally
        </div>
      )}

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
        <Button onClick={handleStop} variant="outline" className="flex-1 px-0 border-st-danger text-st-danger hover:bg-st-danger/10" size="sm">
          <Square className="w-4 h-4 fill-current" />
        </Button>
      </div>
    </div>
  );
}
