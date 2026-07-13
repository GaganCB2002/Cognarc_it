"use client";

import React, { useEffect, useState, useRef, useCallback } from "react";
import { api, API_URL } from "@/lib/api";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";
import { io as socketIO, Socket } from "socket.io-client";
import {
  Activity, Server, Database, Globe, Monitor, ShieldCheck,
  RefreshCw, AlertTriangle,
  Terminal
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";

type ServiceStatus = "checking" | "connected" | "disconnected" | "error";

interface ServiceState {
  status: ServiceStatus;
  lastSync: Date | null;
  responseTime: number | null;
  error: string | null;
  details?: Record<string, unknown>;
}

const initialService: ServiceState = {
  status: "checking",
  lastSync: null,
  responseTime: null,
  error: null,
};

function StatusDot({ status }: { status: ServiceStatus }) {
  const colors = {
    connected: "bg-st-success shadow-[0_0_8px_rgba(16,185,129,0.5)]",
    checking: "bg-yellow-400 shadow-[0_0_8px_rgba(250,204,21,0.5)]",
    disconnected: "bg-st-text-muted",
    error: "bg-st-danger shadow-[0_0_8px_rgba(239,68,68,0.5)]",
  };
  return (
    <span className={`relative inline-flex w-2.5 h-2.5 rounded-full ${colors[status]} ${status === "checking" ? "animate-pulse" : ""}`}>
      {status === "checking" && (
        <span className="absolute inset-0 rounded-full bg-yellow-400/40 animate-ping" />
      )}
    </span>
  );
}

function ServiceCard({
  icon,
  title,
  subtitle,
  service,
  onRetry,
  details,
}: {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  service: ServiceState;
  onRetry?: () => void;
  details?: { label: string; value: string }[];
}) {
  const statusLabel = {
    connected: "Connected",
    checking: "Checking...",
    disconnected: "Disconnected",
    error: "Error",
  };

  const statusColors = {
    connected: "text-st-success border-st-success/20 bg-st-success/5",
    checking: "text-yellow-500 border-yellow-500/20 bg-yellow-500/5",
    disconnected: "text-st-text-muted border-st-border bg-st-bg-elevated",
    error: "text-st-danger border-st-danger/20 bg-st-danger/5",
  };

  return (
    <Card className="p-5 border-st-border bg-st-bg-elevated">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-st-bg-primary rounded-lg">{icon}</div>
          <div>
            <h3 className="font-bold text-st-text-primary">{title}</h3>
            <p className="text-xs text-st-text-muted mt-0.5">{subtitle}</p>
          </div>
        </div>
        <div className={`flex items-center gap-2 px-2.5 py-1 rounded-lg border text-xs font-medium ${statusColors[service.status]}`}>
          <StatusDot status={service.status} />
          {statusLabel[service.status]}
        </div>
      </div>

      <div className="space-y-1.5 text-xs">
        {service.responseTime !== null && (
          <div className="flex justify-between text-st-text-secondary">
            <span>Response Time</span>
            <span className="font-mono text-st-text-primary">{service.responseTime}ms</span>
          </div>
        )}
        {service.lastSync && (
          <div className="flex justify-between text-st-text-secondary">
            <span>Last Sync</span>
            <span className="font-mono text-st-text-primary">
              {formatDistanceToNow(service.lastSync, { addSuffix: true })}
            </span>
          </div>
        )}
        {service.status === "connected" && service.lastSync && (
          <div className="flex justify-between text-st-text-secondary">
            <span>Last Updated</span>
            <span className="font-mono text-st-text-primary">{format(service.lastSync, "HH:mm:ss")}</span>
          </div>
        )}
        {details?.map((d, i) => (
          <div key={i} className="flex justify-between text-st-text-secondary">
            <span>{d.label}</span>
            <span className="font-mono text-st-text-primary truncate max-w-[200px]">{d.value}</span>
          </div>
        ))}
        {service.error && (
          <div className="mt-2 p-2 rounded-lg bg-st-danger/5 border border-st-danger/10 text-st-danger flex items-start gap-1.5">
            <AlertTriangle className="w-3 h-3 mt-0.5 shrink-0" />
            <span className="text-[11px]">{service.error}</span>
          </div>
        )}
      </div>

      <div className="mt-4 pt-3 border-t border-st-border flex items-center justify-between">
        <span className="text-[10px] text-st-text-muted">
          {service.status === "connected" ? "Operational" : service.status === "checking" ? "Probing..." : "Unreachable"}
        </span>
        <div className="flex gap-2">
          {onRetry && (
            <button
              onClick={onRetry}
              className="flex items-center gap-1 text-xs text-st-accent hover:text-st-accent-hover transition-colors"
            >
              <RefreshCw className={`w-3 h-3 ${service.status === "checking" ? "animate-spin" : ""}`} />
              Retry
            </button>
          )}
        </div>
      </div>
    </Card>
  );
}

export default function DiagnosticsPage() {
  const { user } = useAuth();
  const [backend, setBackend] = useState<ServiceState>(initialService);
  const [database, setDatabase] = useState<ServiceState>(initialService);
  const [socket, setSocket] = useState<ServiceState>(initialService);
  const [browserExt, setBrowserExt] = useState<ServiceState>(initialService);
  const [desktopAgent, setDesktopAgent] = useState<ServiceState>(initialService);
  const [socketInstance, setSocketInstance] = useState<Socket | null>(null);
  const [socketLatency, setSocketLatency] = useState<number | null>(null);
  const [lastPollTime, setLastPollTime] = useState<Date>(new Date());
  const pollingRef = useRef<boolean>(false);

  const checkBackend = useCallback(async () => {
    const start = Date.now();
    try {
      const res = await fetch(`${API_URL.replace('/api', '')}/health`, { signal: AbortSignal.timeout(5000) });
      const data = await res.json();
      setBackend({
        status: res.ok ? "connected" : "error",
        lastSync: new Date(),
        responseTime: Date.now() - start,
        error: res.ok ? null : `HTTP ${res.status}`,
        details: data.status ? { Version: "1.0.0", Status: data.status } : undefined,
      });
    } catch (err) {
      setBackend(prev => ({
        ...prev,
        status: "error",
        lastSync: new Date(),
        responseTime: null,
        error: err instanceof Error ? err.message : "Connection failed",
      }));
    }
  }, []);

  const checkDatabase = useCallback(async () => {
    const start = Date.now();
    try {
      const res = await fetch(`${API_URL}/database/status`, {
        signal: AbortSignal.timeout(5000),
        headers: { Authorization: `Bearer ${api.getToken()}` },
      });
      const data = await res.json();
      setDatabase({
        status: data.success && data.status === "connected" ? "connected" : "error",
        lastSync: new Date(),
        responseTime: Date.now() - start,
        error: data.success ? null : "Database unreachable",
        details: data.provider ? { Provider: data.provider } : undefined,
      });
    } catch (err) {
      setDatabase(prev => ({
        ...prev,
        status: "disconnected",
        lastSync: new Date(),
        responseTime: null,
        error: err instanceof Error ? err.message : "Connection failed",
      }));
    }
  }, []);

  const checkSocket = useCallback(() => {
    if (!user?.id) return;
    if (socketInstance?.connected) {
      const start = Date.now();
      socketInstance.emit("ping", () => {
        setSocketLatency(Date.now() - start);
      });
      setSocket({
        status: "connected",
        lastSync: new Date(),
        responseTime: socketLatency,
        error: null,
        details: { "Socket ID": socketInstance.id || "—" },
      });
    }
  }, [user?.id, socketInstance, socketLatency]);

  const checkTelemetry = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await api.get<{
        liveTab?: { timestamp: string };
        liveApp?: { timestamp: string };
      }>("/tracking/sessions/live");

      const data = res as unknown as { liveTab?: { timestamp: string }; liveApp?: { timestamp: string } };
      const now = Date.now();

      if (data?.liveTab?.timestamp) {
        const tabTime = new Date(data.liveTab.timestamp).getTime();
        const connected = now - tabTime < 60000;
        setBrowserExt({
          status: connected ? "connected" : "disconnected",
          lastSync: new Date(data.liveTab.timestamp),
          responseTime: null,
          error: connected ? null : "No recent telemetry (60s threshold)",
        });
      } else {
        setBrowserExt(prev => ({
          ...prev,
          status: "disconnected",
          lastSync: prev.lastSync,
          responseTime: null,
          error: "No live tab data. Start a tracking session.",
        }));
      }

      if (data?.liveApp?.timestamp) {
        const appTime = new Date(data.liveApp.timestamp).getTime();
        const connected = now - appTime < 60000;
        setDesktopAgent({
          status: connected ? "connected" : "disconnected",
          lastSync: new Date(data.liveApp.timestamp),
          responseTime: null,
          error: connected ? null : "No recent telemetry (60s threshold)",
        });
      } else {
        setDesktopAgent(prev => ({
          ...prev,
          status: "disconnected",
          lastSync: prev.lastSync,
          responseTime: null,
          error: "No live app data. Start a tracking session.",
        }));
      }
    } catch {
      // Telemetry endpoint may 401 if not authenticated properly
    }
  }, [user?.id]);

  const pollAll = useCallback(async () => {
    if (pollingRef.current) return;
    pollingRef.current = true;
    try {
      await Promise.allSettled([checkBackend(), checkDatabase(), checkTelemetry()]);
      checkSocket();
      setLastPollTime(new Date());
    } finally {
      pollingRef.current = false;
    }
  }, [checkBackend, checkDatabase, checkSocket, checkTelemetry]);

  // Initialize Socket.IO (connects even without auth token for diagnostics)
  useEffect(() => {
    const socketUrl = API_URL.replace('/api', '');
    const token = api.getToken();

    const socket = socketIO(socketUrl, {
      withCredentials: true,
      auth: token ? { token } : {},
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 10000,
      timeout: 10000,
    });

    socket.on("connect", () => {
      setSocket({
        status: "connected",
        lastSync: new Date(),
        responseTime: null,
        error: null,
        details: { "Socket ID": socket.id || "—" },
      });
    });

    socket.on("disconnect", (reason) => {
      setSocket({
        status: "disconnected",
        lastSync: new Date(),
        responseTime: null,
        error: `Disconnected: ${reason}`,
      });
    });

    socket.on("connect_error", (err) => {
      setSocket(prev => ({
        ...prev,
        status: "error",
        lastSync: new Date(),
        error: err.message,
      }));
    });

    // Latency measurement
    socket.on("pong", (latency: number) => {
      setSocketLatency(latency);
    });

    setSocketInstance(socket);

    return () => {
      socket.disconnect();
      setSocketInstance(null);
      setSocket(initialService);
    };
  }, [user?.id]);

  // Polling interval
  useEffect(() => {
    pollAll();
    const interval = setInterval(pollAll, 5000);
    return () => clearInterval(interval);
  }, [pollAll]);

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-st-accent uppercase mb-1">System Health Monitor</p>
          <h1 className="text-3xl font-bold text-st-text-primary">Diagnostics</h1>
          <p className="text-sm text-st-text-secondary mt-1">
            Live end-to-end telemetry system health monitor.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-[10px] text-st-text-muted font-mono">
            Last poll: {format(lastPollTime, "HH:mm:ss")}
          </span>
          <button
            onClick={pollAll}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-st-accent/10 text-st-accent rounded-lg text-xs font-medium hover:bg-st-accent/20 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Refresh
          </button>
        </div>
      </div>

      {/* Service Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <ServiceCard
          icon={<Server className="w-5 h-5 text-st-accent" />}
          title="Backend API"
          subtitle="REST API service layer"
          service={backend}
          onRetry={checkBackend}
          details={backend.details ? Object.entries(backend.details).map(([label, value]) => ({ label, value: String(value) })) : undefined}
        />

        <ServiceCard
          icon={<Database className="w-5 h-5 text-blue-400" />}
          title="Database"
          subtitle="PostgreSQL persistence"
          service={database}
          onRetry={checkDatabase}
          details={database.details ? Object.entries(database.details).map(([label, value]) => ({ label, value: String(value) })) : undefined}
        />

        <ServiceCard
          icon={<Activity className="w-5 h-5 text-green-400" />}
          title="Socket.IO"
          subtitle="Real-time WebSocket"
          service={socket}
          onRetry={() => {
            if (socketInstance) {
              socketInstance.connect();
            }
          }}
          details={[
            ...(socket.details ? Object.entries(socket.details).map(([label, value]) => ({ label, value: String(value) })) : []),
            ...(socketLatency !== null ? [{ label: "Latency", value: `${socketLatency}ms` }] : []),
          ]}
        />

        <ServiceCard
          icon={<Globe className="w-5 h-5 text-cyan-400" />}
          title="Browser Extension"
          subtitle="Chrome/Edge telemetry"
          service={browserExt}
          onRetry={checkTelemetry}
        />

        <ServiceCard
          icon={<Monitor className="w-5 h-5 text-purple-400" />}
          title="Desktop Agent"
          subtitle="Active window monitor"
          service={desktopAgent}
          onRetry={checkTelemetry}
        />

        <Card className="p-5 border-st-border bg-st-bg-elevated">
          <div className="flex items-start gap-4">
            <div className="p-2 bg-st-accent/10 rounded-lg text-st-accent shrink-0">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-st-text-primary mb-1">Health Status Summary</h3>
              <p className="text-xs text-st-text-muted mb-3">
                {[backend, database, socket, browserExt, desktopAgent].filter(s => s.status === "connected").length} of 5 services connected.
                {socket.status !== "connected" && " Socket.IO needs attention."}
                {backend.status !== "connected" && " Backend API is unreachable."}
              </p>
              <div className="flex flex-wrap gap-2">
                {(["backend", "database", "socket", "browserExt", "desktopAgent"] as const).map((key) => {
                  const services = { backend, database, socket, browserExt, desktopAgent };
                  const s = services[key];
                  const labels: Record<string, string> = {
                    backend: "API",
                    database: "DB",
                    socket: "Socket",
                    browserExt: "Ext",
                    desktopAgent: "Agent",
                  };
                  return (
                    <span
                      key={key}
                      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-medium border ${
                        s.status === "connected"
                          ? "text-st-success border-st-success/20 bg-st-success/5"
                          : s.status === "checking"
                          ? "text-yellow-500 border-yellow-500/20 bg-yellow-500/5"
                          : "text-st-danger border-st-danger/20 bg-st-danger/5"
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        s.status === "connected" ? "bg-st-success" : s.status === "checking" ? "bg-yellow-500" : "bg-st-danger"
                      }`} />
                      {labels[key]}
                    </span>
                  );
                })}
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Setup Guide */}
      <div className="bg-st-bg-elevated border border-st-border rounded-xl p-6 flex gap-4 items-start">
        <Terminal className="w-6 h-6 text-st-accent shrink-0" />
        <div className="min-w-0">
          <h4 className="font-bold mb-1">Enable Telemetry Services</h4>
          <p className="text-sm text-st-text-secondary mb-4">
            Browser extension and desktop agent require local setup. Telemetry data appears after starting a tracking session.
          </p>
          <div className="bg-st-bg-primary p-4 rounded-lg text-xs font-mono text-st-text-muted space-y-2">
            <p>1. Start the desktop agent:</p>
            <p className="text-white">cd extension/desktop && npm start</p>
            <p className="mt-2">2. Load the browser extension:</p>
            <p className="text-white">Chrome → Extensions → Load unpacked → extension/browser</p>
            <p className="mt-2">3. Start a tracking session from the sidebar or /tracking</p>
          </div>
        </div>
      </div>
    </div>
  );
}
