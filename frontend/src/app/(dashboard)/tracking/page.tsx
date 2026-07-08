"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useSession } from "@/contexts/SessionContext";
import { 
  Play, 
  Pause, 
  Square, 
  Clock, 
  Monitor, 
  Globe, 
  Activity, 
  Zap,
  Code,
  BookOpen,
  Coffee,
  MonitorSmartphone,
  Server
} from "lucide-react";
import { format } from "date-fns";

type DashboardData = {
  session: any;
  stats: any;
  desktopApps: Array<{ name: string; category: string; duration: number }>;
  browserDomains: Array<{ name: string; category: string; duration: number }>;
  recentActivities: any[];
};

export default function TrackingDashboard() {
  const { session, startSession, pauseSession, resumeSession, stopSession, isInitializing } = useSession();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timerDisplay, setTimerDisplay] = useState("00:00:00");

  const fetchDashboardData = async () => {
    try {
      const res = await api.get<{ success: boolean; data: DashboardData }>("/sessions/dashboard");
      if (res.success && res.data) {
        setData(res.data);
      } else {
        setData(null);
      }
    } catch (error) {
      console.error("Failed to fetch dashboard data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(() => {
      if (session && session.status === "ACTIVE") {
        fetchDashboardData();
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [session]);

  const formatTimer = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const formatDuration = (seconds: number) => {
    if (!seconds) return "0s";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  };

  if (isInitializing || loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-st-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col gap-6 pb-8 overflow-y-auto pr-2">
      <div>
        <p className="text-[10px] font-bold tracking-widest text-st-accent uppercase mb-1">Live Tracking</p>
        <h1 className="text-3xl font-bold text-st-text-primary">Tracking Dashboard</h1>
      </div>

      {/* Hero Section */}
      <Card className="p-8 border-st-border bg-st-bg-elevated relative overflow-hidden">
        {/* Animated background pulse for active session */}
        {session?.status === "ACTIVE" && (
          <div className="absolute top-0 right-0 w-64 h-64 bg-st-accent/5 rounded-full blur-3xl animate-pulse -mr-20 -mt-20 pointer-events-none" />
        )}
        
        <div className="flex flex-col md:flex-row justify-between items-center relative z-10 gap-6">
          <div className="flex items-center gap-6">
            <div className={`w-24 h-24 rounded-full flex items-center justify-center border-4 ${session?.status === 'ACTIVE' ? 'border-st-accent text-st-accent shadow-[0_0_15px_rgba(204,255,0,0.3)]' : session?.status === 'PAUSED' ? 'border-yellow-500 text-yellow-500' : 'border-st-border text-st-text-muted'}`}>
              <Activity className={`w-10 h-10 ${session?.status === 'ACTIVE' ? 'animate-pulse' : ''}`} />
            </div>
            
            <div>
              <h2 className="text-4xl font-black font-mono tracking-wider text-st-text-primary mb-2">
                {session?.status === 'IDLE' ? '00:00:00' : formatTimer(session?.duration || 0)}
              </h2>
              <div className="flex items-center gap-3">
                <Badge variant={session?.status === 'ACTIVE' ? 'success' : session?.status === 'PAUSED' ? 'warning' : 'outline'} className="uppercase tracking-widest">
                  {session?.status || 'NO ACTIVE SESSION'}
                </Badge>
                {session && session.status !== 'IDLE' && (
                  <span className="text-sm text-st-text-secondary flex items-center gap-1">
                    <MonitorSmartphone className="w-4 h-4" /> {session.projectName || 'General Deep Work'}
                  </span>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!session || session.status === "IDLE" ? (
              <Button onClick={() => startSession()} size="lg" className="font-bold text-black gap-2">
                <Play className="w-5 h-5 fill-current" /> Start Session
              </Button>
            ) : (
              <>
                {session.status === "ACTIVE" ? (
                  <Button onClick={() => pauseSession()} variant="secondary" size="lg" className="gap-2">
                    <Pause className="w-5 h-5 fill-current" /> Pause
                  </Button>
                ) : (
                  <Button onClick={() => resumeSession()} variant="secondary" size="lg" className="gap-2">
                    <Play className="w-5 h-5 fill-current" /> Resume
                  </Button>
                )}
                <Button onClick={() => stopSession()} variant="danger" size="lg" className="gap-2">
                  <Square className="w-5 h-5 fill-current" /> Stop
                </Button>
              </>
            )}
          </div>
        </div>
      </Card>

      {/* KPI Cards */}
      {data && data.stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <Card className="p-4 bg-st-bg-elevated border-st-border">
            <Zap className="w-5 h-5 text-st-accent mb-2" />
            <p className="text-xs text-st-text-muted">Productivity Score</p>
            <p className="text-xl font-bold text-st-text-primary">{data.stats.productivityScore}%</p>
          </Card>
          <Card className="p-4 bg-st-bg-elevated border-st-border">
            <Activity className="w-5 h-5 text-cyan-400 mb-2" />
            <p className="text-xs text-st-text-muted">Focus Score</p>
            <p className="text-xl font-bold text-st-text-primary">{data.stats.focusScore}%</p>
          </Card>
          <Card className="p-4 bg-st-bg-elevated border-st-border">
            <Code className="w-5 h-5 text-purple-400 mb-2" />
            <p className="text-xs text-st-text-muted">Coding Time</p>
            <p className="text-xl font-bold text-st-text-primary">{formatDuration(data.stats.codingTime)}</p>
          </Card>
          <Card className="p-4 bg-st-bg-elevated border-st-border">
            <BookOpen className="w-5 h-5 text-blue-400 mb-2" />
            <p className="text-xs text-st-text-muted">Learning Time</p>
            <p className="text-xl font-bold text-st-text-primary">{formatDuration(data.stats.learningTime)}</p>
          </Card>
          <Card className="p-4 bg-st-bg-elevated border-st-border">
            <Coffee className="w-5 h-5 text-orange-400 mb-2" />
            <p className="text-xs text-st-text-muted">Idle Estimate</p>
            <p className="text-xl font-bold text-st-text-primary">{formatDuration(data.stats.idleTime)}</p>
          </Card>
        </div>
      )}

      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Applications */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-st-text-primary mb-4 flex items-center gap-2">
              <Monitor className="w-5 h-5 text-st-accent" /> Desktop Usage
            </h3>
            {data.desktopApps.length > 0 ? (
              <div className="space-y-3">
                {data.desktopApps.map((app, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-st-bg-elevated rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-st-bg-primary rounded flex items-center justify-center text-xs font-bold text-st-text-secondary uppercase">
                        {app.name.substring(0, 2)}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-st-text-primary">{app.name}</p>
                        <p className="text-xs text-st-text-muted">{app.category}</p>
                      </div>
                    </div>
                    <span className="text-sm font-mono text-st-text-secondary">{formatDuration(app.duration)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-st-text-muted border-2 border-dashed border-st-border rounded-lg">
                <Server className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No desktop telemetry received yet.</p>
                <p className="text-xs mt-1">Ensure the Desktop Agent is running.</p>
              </div>
            )}
          </Card>

          {/* Top Websites */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-st-text-primary mb-4 flex items-center gap-2">
              <Globe className="w-5 h-5 text-blue-400" /> Browser Usage
            </h3>
            {data.browserDomains.length > 0 ? (
              <div className="space-y-3">
                {data.browserDomains.map((domain, i) => (
                  <div key={i} className="flex items-center justify-between p-3 bg-st-bg-elevated rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-st-bg-primary rounded flex items-center justify-center overflow-hidden">
                        <img src={`https://www.google.com/s2/favicons?domain=${domain.name}&sz=32`} alt="favicon" className="w-5 h-5" onError={(e) => (e.currentTarget.style.display = 'none')} />
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-st-text-primary truncate max-w-[200px]">{domain.name}</p>
                        <p className="text-xs text-st-text-muted">{domain.category}</p>
                      </div>
                    </div>
                    <span className="text-sm font-mono text-st-text-secondary">{formatDuration(domain.duration)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-8 text-center text-st-text-muted border-2 border-dashed border-st-border rounded-lg">
                <Globe className="w-8 h-8 mx-auto mb-2 opacity-50" />
                <p>No browser telemetry received yet.</p>
                <p className="text-xs mt-1">Ensure the Browser Extension is installed and active.</p>
              </div>
            )}
          </Card>
        </div>
      )}

      {/* Activity Timeline */}
      {data && data.recentActivities.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-st-text-primary mb-4 flex items-center gap-2">
            <Clock className="w-5 h-5 text-st-accent" /> Recent Activity
          </h3>
          <div className="space-y-0">
            {data.recentActivities.map((activity, i) => (
              <div key={activity.id} className="flex items-start gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-3 h-3 rounded-full bg-st-accent mt-1" />
                  {i !== data.recentActivities.length - 1 && (
                    <div className="w-0.5 h-full bg-st-border my-1 min-h-[30px]" />
                  )}
                </div>
                <div className="pb-6 w-full">
                  <div className="bg-st-bg-elevated p-3 rounded-lg flex justify-between items-center w-full">
                    <div>
                      <p className="text-sm font-medium text-st-text-primary">
                        {activity.label || activity.eventType.replace(/_/g, ' ')}
                      </p>
                      <p className="text-xs text-st-text-muted mt-0.5 flex gap-2 items-center">
                        <span className="uppercase tracking-widest">{activity.category}</span>
                        {activity.duration > 0 && <span>• {formatDuration(activity.duration)}</span>}
                      </p>
                    </div>
                    <span className="text-xs text-st-text-muted font-mono bg-st-bg-primary px-2 py-1 rounded">
                      {format(new Date(activity.createdAt), "HH:mm:ss")}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {!session && !data && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-st-text-muted">
          <Activity className="w-16 h-16 mb-4 opacity-20" />
          <h3 className="text-xl font-bold mb-2">No Active Session</h3>
          <p className="text-sm max-w-md text-center">
            Click "Start Session" to begin tracking your productivity across your desktop and browser.
          </p>
        </div>
      )}
    </div>
  );
}
