"use client";

import React, { useEffect, useState } from "react";
import { api, API_URL } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";
import { io as socketIO } from "socket.io-client";
import { Activity, Server, Database, Globe, Monitor, ShieldCheck, AlertCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

const StatusBadge = ({ status }: { status: "connected" | "error" | "checking" | boolean }) => {
  if (status === "checking") return <span className="px-2 py-1 text-xs bg-yellow-500/10 text-yellow-500 rounded font-medium border border-yellow-500/20">CHECKING</span>;
  if (status === true || status === "connected") return <span className="px-2 py-1 text-xs bg-st-success/10 text-st-success rounded font-medium border border-st-success/20 flex items-center gap-1"><div className="w-1.5 h-1.5 rounded-full bg-st-success animate-pulse"/> CONNECTED</span>;
  return <span className="px-2 py-1 text-xs bg-st-danger/10 text-st-danger rounded font-medium border border-st-danger/20 flex items-center gap-1"><AlertCircle className="w-3 h-3"/> DISCONNECTED</span>;
};

export default function DiagnosticsPage() {
  const { user } = useAuth();
  const [dbStatus, setDbStatus] = useState<"connected" | "error" | "checking">("checking");
  const [socketStatus, setSocketStatus] = useState<"connected" | "error" | "checking">("checking");
  const [browserExtStatus, setBrowserExtStatus] = useState<{ connected: boolean; lastEvent: Date | null }>({ connected: false, lastEvent: null });
  const [desktopAppStatus, setDesktopAppStatus] = useState<{ connected: boolean; lastEvent: Date | null }>({ connected: false, lastEvent: null });
  const [socketClient, setSocketClient] = useState<ReturnType<typeof socketIO> | null>(null);

  useEffect(() => {
    const checkConnections = async () => {
      try {
        const healthRes = await fetch(API_URL.replace('/api', '/health'));
        if (!healthRes.ok) {
          setDbStatus("error");
          return;
        }
        setDbStatus("connected");
        
        if (user?.id) {
          try {
            const res = await api.get<{ success: boolean; data: { liveTab?: { timestamp: string }; liveApp?: { timestamp: string } } }>("/tracking/sessions/live");
            if (res.data) {
              const now = Date.now();
              const { liveTab, liveApp } = res.data;
              
              if (liveTab && liveTab.timestamp) {
                const tabTime = new Date(liveTab.timestamp).getTime();
                setBrowserExtStatus({
                  connected: (now - tabTime) < 30000, // active within 30 seconds
                  lastEvent: new Date(liveTab.timestamp)
                });
              }
              
              if (liveApp && liveApp.timestamp) {
                const appTime = new Date(liveApp.timestamp).getTime();
                setDesktopAppStatus({
                  connected: (now - appTime) < 30000,
                  lastEvent: new Date(liveApp.timestamp)
                });
              }
            }
          } catch {
            // Ignore telemetry fetch errors (e.g. 401 when not fully authed) to keep dbStatus accurate
          }
        }
      } catch {
        setDbStatus("error");
      }
    };

    checkConnections();
    const interval = setInterval(checkConnections, 5000);

    // 2. Test Socket.IO
    if (user?.id) {
      const socketUrl = API_URL.replace('/api', '');
      const token = api.getToken();
      const socket = socketIO(socketUrl, { withCredentials: true, auth: { token } });
      
      socket.on("connect", () => setSocketStatus("connected"));
      socket.on("disconnect", () => setSocketStatus("error"));
      socket.on("connect_error", () => setSocketStatus("error"));
      
      setSocketClient(socket);
      
      return () => {
        clearInterval(interval);
        socket.disconnect();
        setSocketClient(null);
        setSocketStatus("checking");
      };
    }
    
    return () => {
      clearInterval(interval);
      setSocketClient(null);
    };
  }, [user?.id]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8 relative">
      <div>
        <h1 className="text-3xl font-bold text-st-text-primary">Developer Diagnostics</h1>
        <p className="text-st-text-secondary mt-1">Live end-to-end telemetry system health monitor.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="p-5 border-st-border bg-st-bg-elevated">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-st-bg-primary rounded-lg text-st-accent"><Server className="w-5 h-5"/></div>
              <h3 className="font-bold">Backend API</h3>
            </div>
            <StatusBadge status={dbStatus} />
          </div>
          <p className="text-sm text-st-text-muted">Main REST API and service layer status.</p>
          <div className="mt-4 pt-4 border-t border-st-border text-xs text-st-text-secondary truncate">URL: {API_URL}</div>
        </Card>

        <Card className="p-5 border-st-border bg-st-bg-elevated">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-st-bg-primary rounded-lg text-blue-400"><Database className="w-5 h-5"/></div>
              <h3 className="font-bold">Database</h3>
            </div>
            <StatusBadge status={dbStatus} />
          </div>
          <p className="text-sm text-st-text-muted">PostgreSQL database persistence pipeline.</p>
          <div className="mt-4 pt-4 border-t border-st-border text-xs text-st-text-secondary">Provider: Prisma</div>
        </Card>

        <Card className="p-5 border-st-border bg-st-bg-elevated">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-st-bg-primary rounded-lg text-green-400"><Activity className="w-5 h-5"/></div>
              <h3 className="font-bold">Socket.IO</h3>
            </div>
            <StatusBadge status={socketStatus} />
          </div>
          <p className="text-sm text-st-text-muted">Real-time WebSocket broadcasting server.</p>
          <div className="mt-4 pt-4 border-t border-st-border text-xs text-st-text-secondary truncate">
            {socketClient?.id ? `Socket ID: ${socketClient.id}` : 'Connecting...'}
          </div>
        </Card>

        <Card className="p-5 border-st-border bg-st-bg-elevated lg:col-span-1">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-st-bg-primary rounded-lg text-cyan-400"><Globe className="w-5 h-5"/></div>
              <h3 className="font-bold">Browser Extension</h3>
            </div>
            <StatusBadge status={browserExtStatus.connected} />
          </div>
          <p className="text-sm text-st-text-muted">Google Chrome / Edge active tab telemetry pipeline.</p>
          <div className="mt-4 pt-4 border-t border-st-border text-xs text-st-text-secondary flex items-center justify-between">
            <span>Last Event:</span>
            <span className={browserExtStatus.connected ? "text-st-success font-mono" : "font-mono"}>
              {browserExtStatus.lastEvent ? formatDistanceToNow(browserExtStatus.lastEvent, { addSuffix: true }) : "Never"}
            </span>
          </div>
        </Card>

        <Card className="p-5 border-st-border bg-st-bg-elevated lg:col-span-1">
          <div className="flex justify-between items-start mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-st-bg-primary rounded-lg text-purple-400"><Monitor className="w-5 h-5"/></div>
              <h3 className="font-bold">Desktop Agent</h3>
            </div>
            <StatusBadge status={desktopAppStatus.connected} />
          </div>
          <p className="text-sm text-st-text-muted">Node.js system-level active window monitoring daemon.</p>
          <div className="mt-4 pt-4 border-t border-st-border text-xs text-st-text-secondary flex items-center justify-between">
            <span>Last Event:</span>
            <span className={desktopAppStatus.connected ? "text-st-success font-mono" : "font-mono"}>
              {desktopAppStatus.lastEvent ? formatDistanceToNow(desktopAppStatus.lastEvent, { addSuffix: true }) : "Never"}
            </span>
          </div>
        </Card>
      </div>

      <div className="bg-st-bg-elevated border border-st-border rounded-xl p-6 flex gap-4 items-start">
        <ShieldCheck className="w-6 h-6 text-st-accent shrink-0" />
        <div className="min-w-0">
          <h4 className="font-bold mb-1">Important Note About Data Detection</h4>
          <p className="text-sm text-st-text-secondary mb-4">
            The tracking dashboard will intentionally display <b>&quot;No tab detected&quot;</b> or <b>&quot;No app detected&quot;</b> if the telemetry services are not running. For security and privacy reasons, web browsers sandbox websites and strictly prevent them from reading your other open tabs or desktop applications.
          </p>
          <div className="bg-st-bg-primary p-4 rounded-lg text-sm font-mono text-st-text-muted space-y-2 overflow-x-auto">
            <p>To enable live tracking, you must launch the agents locally:</p>
            <p className="text-white whitespace-nowrap">1. Start the desktop agent: <span className="text-purple-400 bg-purple-400/10 px-1 rounded">cd frontend/extension/desktop && npm start</span></p>
            <p className="text-white whitespace-nowrap">2. Load the browser extension: <span className="text-blue-400 bg-blue-400/10 px-1 rounded">Chrome {'>'} Extensions {'>'} Load unpacked {'>'} frontend/extension/browser</span></p>
          </div>
        </div>
      </div>
    </div>
  );
}
