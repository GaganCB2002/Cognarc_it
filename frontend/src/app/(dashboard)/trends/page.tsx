"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Compass, ChevronDown, Loader2 } from "lucide-react";
import api from "@/lib/api";

type TelemetryStats = {
  sessionIntensity: string;
  deepHours: number;
  profileType: string;
  profileDesc: string;
  coreProficiencies: string[];
  topSessions: { topic: string; desc: string; progress: number }[];
  activityPulse: number[];
  interviewQuestions: string[];
};

export default function TrendsPage() {
  const [stats, setStats] = useState<TelemetryStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const data = await api.get<TelemetryStats>("/telemetry/stats");
        if (data) setStats(data);
      } catch (error) {
        console.error("Failed to fetch telemetry stats", error);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading || !stats) {
    return (
      <div className="flex items-center justify-center h-full min-h-[600px]">
        <div className="flex flex-col items-center gap-4 text-st-text-muted">
          <Loader2 className="w-8 h-8 animate-spin text-st-accent" />
          <p className="text-sm font-mono tracking-widest uppercase">Aggregating Telemetry...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-12 animate-in fade-in duration-500">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-st-border pb-6">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-st-accent uppercase mb-2">Mastery Analytics</p>
          <h1 className="text-3xl font-semibold text-st-text-primary">{stats.profileType}</h1>
        </div>
        
        <div className="flex gap-8">
          <div>
            <p className="text-[10px] font-semibold text-st-text-secondary uppercase">Session Intensity</p>
            <p className="text-xl font-semibold text-st-accent">{stats.sessionIntensity}</p>
          </div>
          <div>
            <p className="text-[10px] font-semibold text-st-text-secondary uppercase">Deep Hours</p>
            <p className="text-xl font-semibold text-st-accent">{stats.deepHours}h</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Profile Card (Left Column) */}
        <div className="lg:col-span-4">
          <Card className="p-8 h-full bg-st-bg-elevated/50 relative overflow-hidden">
            <Compass className="absolute -top-4 -right-4 w-32 h-32 text-st-border/30 opacity-50" strokeWidth={1} />
            
            <div className="w-12 h-12 border border-st-accent/40 rounded flex items-center justify-center mb-6 relative z-10">
              <Compass className="w-6 h-6 text-st-accent" strokeWidth={1.5} />
            </div>
            
            <h2 className="text-2xl font-medium text-st-text-primary mb-4 relative z-10">{stats.profileType}</h2>
            
            <p className="text-sm text-st-text-secondary leading-relaxed mb-8 relative z-10">
              {stats.profileDesc}
            </p>
            
            <div className="relative z-10">
              <p className="text-[10px] font-bold tracking-widest text-st-accent uppercase mb-4">Core Proficiencies</p>
              <div className="flex flex-wrap gap-2">
                {stats.coreProficiencies.map((prof) => (
                  <Badge key={prof} variant="outline" className="font-mono text-[10px] px-3 py-1 rounded-sm uppercase tracking-wider">
                    {prof}
                  </Badge>
                ))}
              </div>
            </div>
          </Card>
        </div>

        {/* Analytics (Right Column) */}
        <div className="lg:col-span-8 flex flex-col gap-8">
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {stats.topSessions.map((session, idx) => (
              <Card key={idx} className="p-6 bg-transparent border-st-border/60">
                <div className="flex items-center justify-between mb-4">
                   <p className="text-xs text-st-text-secondary font-medium">Top Session: {session.topic}</p>
                   <div className="w-1/3 h-[2px] bg-st-bg-elevated overflow-hidden">
                     <div className="h-full bg-st-accent" style={{ width: `${session.progress}%` }}></div>
                   </div>
                </div>
                <p className="text-sm text-st-text-muted italic">&quot;{session.desc}&quot;</p>
              </Card>
            ))}
          </div>

          {/* Activity Pulse */}
          <Card className="p-6 flex-1 border-st-border/60 bg-transparent">
            <h3 className="text-lg font-medium text-st-text-primary mb-6">Activity Pulse (28 Days)</h3>
            
            <div className="grid grid-cols-7 gap-2 mb-4">
              {stats.activityPulse.map((level, idx) => (
                <div 
                  key={idx} 
                  className={`aspect-square rounded-sm ${
                    level === 3 ? 'bg-st-accent' :
                    level === 2 ? 'bg-st-accent/50' :
                    level === 1 ? 'bg-st-bg-elevated' :
                    'bg-st-border/30'
                  } transition-colors hover:border hover:border-st-accent/50`}
                  title={`Activity level: ${level}`}
                ></div>
              ))}
            </div>
            
            <div className="flex justify-between items-center text-xs font-semibold text-st-text-muted">
              <span>Past 4 Weeks</span>
              <span>Telemetry Connected</span>
            </div>
          </Card>
          
        </div>
      </div>

      {/* Self-Examination Section */}
      <div className="pt-8">
        <div className="mb-8">
          <p className="text-[10px] font-bold tracking-widest text-st-accent uppercase mb-2">AI Telemetry Synthesis</p>
          <h2 className="text-2xl font-medium text-st-text-primary mb-2">Automated Interview Prep</h2>
          <p className="text-sm text-st-text-secondary">Predicted technical questions generated from your interaction with IDE and Browser documentation.</p>
        </div>

        <div className="space-y-0 border-t border-b border-st-border divide-y divide-st-border">
          {stats.interviewQuestions.map((question, i) => (
            <div key={i} className="py-6 flex items-center gap-6 cursor-pointer hover:bg-st-bg-elevated/30 transition-colors px-4 -mx-4 group">
              <span className="text-st-accent font-mono text-sm font-semibold">0{i + 1}.</span>
              <h3 className="flex-1 font-medium text-st-text-primary">{question}</h3>
              <ChevronDown className="w-5 h-5 text-st-text-muted group-hover:text-st-text-primary transition-colors" />
            </div>
          ))}
        </div>
        
        <div className="mt-12 p-8 border border-st-border border-dashed rounded-lg flex flex-col items-center justify-center gap-4 bg-st-bg-elevated/20">
          <p className="text-sm text-st-text-secondary">Ready to test your knowledge?</p>
          <Button variant="outline" className="border-st-accent text-st-accent hover:bg-st-accent hover:text-black uppercase tracking-wider text-xs font-bold px-6"
            onClick={() => window.open("/career", "_self")}>
            Start Mock Interview
          </Button>
        </div>
      </div>

    </div>
  );
}
