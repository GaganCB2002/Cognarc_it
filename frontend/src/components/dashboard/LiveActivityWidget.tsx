"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { Monitor, Globe, Activity } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useAuth } from "@/lib/auth-context";

type LiveEvent = {
  type: "BROWSER" | "DESKTOP";
  data: {
    id: string;
    title?: string;
    url?: string;
    domain?: string;
    activeApp?: string;
    windowTitle?: string;
    category?: string;
    timestamp: string;
  };
};

export function LiveActivityWidget() {
  const { user } = useAuth();
  const [latestEvent, setLatestEvent] = useState<LiveEvent | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!user?.id) return;

    // Connect to the backend socket
    const socketUrl = process.env.NEXT_PUBLIC_API_URL?.replace('/api', '') || "https://cognarc-it-1.onrender.com";
    const socket: Socket = io(socketUrl, {
      withCredentials: true,
    });

    socket.on("connect", () => {
      setIsConnected(true);
      // Join the user's specific room
      socket.emit("joinRoom", user.id);
    });

    socket.on("disconnect", () => {
      setIsConnected(false);
    });

    socket.on("live-tracking-update", (event: LiveEvent) => {
      setLatestEvent(event);
    });

    return () => {
      socket.disconnect();
    };
  }, [user?.id]);

  return (
    <Card className="p-5 border-st-accent/20 relative overflow-hidden">
      <div className="absolute top-0 right-0 p-3">
        <div className={`flex items-center gap-1.5 px-2 py-1 rounded-full text-[10px] font-medium border ${
          isConnected ? 'bg-st-success/10 text-st-success border-st-success/20' : 'bg-st-text-muted/10 text-st-text-muted border-st-text-muted/20'
        }`}>
          <div className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-st-success animate-pulse' : 'bg-st-text-muted'}`} />
          {isConnected ? 'LIVE' : 'OFFLINE'}
        </div>
      </div>
      
      <div className="flex items-center gap-2 mb-4">
        <Activity className="w-5 h-5 text-st-accent" />
        <h3 className="font-bold text-st-text-primary">Current Activity</h3>
      </div>

      {!latestEvent ? (
        <div className="flex flex-col items-center justify-center py-6 text-st-text-muted">
          <Monitor className="w-8 h-8 mb-2 opacity-20" />
          <p className="text-sm">Waiting for telemetry data...</p>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-start gap-3 p-3 bg-st-bg-elevated rounded-lg border border-st-border">
            {latestEvent.type === "BROWSER" ? (
              <Globe className="w-5 h-5 text-blue-400 mt-0.5 shrink-0" />
            ) : (
              <Monitor className="w-5 h-5 text-purple-400 mt-0.5 shrink-0" />
            )}
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold text-st-text-secondary uppercase tracking-wider mb-1">
                {latestEvent.type === "BROWSER" ? "Browser Tab" : "Desktop App"}
              </p>
              <p className="text-sm font-medium text-st-text-primary truncate" title={latestEvent.data.title || latestEvent.data.windowTitle}>
                {latestEvent.data.title || latestEvent.data.windowTitle || "Unknown Window"}
              </p>
              <p className="text-xs text-st-text-muted truncate mt-1">
                {latestEvent.data.domain || latestEvent.data.activeApp}
              </p>
            </div>
          </div>
          
          <div className="flex justify-between items-center text-[10px] text-st-text-muted">
            <span>Category: {latestEvent.data.category || 'Uncategorized'}</span>
            <span>{new Date(latestEvent.data.timestamp).toLocaleTimeString()}</span>
          </div>
        </div>
      )}
    </Card>
  );
}
