"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import { Clock, Zap, Brain, Code, BookOpen, Target, TrendingUp, Loader2 } from "lucide-react";

type AggregatedStats = {
  sessionIntensity: string;
  deepHours: number;
  profileType: string;
  profileDesc: string;
  coreProficiencies: string[];
  topSessions: Array<{ topic: string; desc: string; progress: number }>;
  activityPulse: number[];
  interviewQuestions: string[];
};

type Insights = {
  totalSessions: number;
  totalHours: number;
  avgSessionMinutes: number;
  bestSession: { id: string; durationMinutes: number; date: string } | null;
  avgProductivity: number;
  strongTopics: string[];
  weakTopics: string[];
  allTopics: string[];
  recommendations: string[];
  trend: string;
};

export default function ProductivityPage() {
  const [stats, setStats] = useState<AggregatedStats | null>(null);
  const [insights, setInsights] = useState<Insights | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, insightsRes] = await Promise.all([
          api.get<AggregatedStats>("/telemetry/stats"),
          api.get<{ totalSessions: number; totalHours: number; avgSessionMinutes: number; bestSession: { id: string; durationMinutes: number; date: string } | null; avgProductivity: number; strongTopics: string[]; weakTopics: string[]; allTopics: string[]; recommendations: string[]; trend: string }>("/insights/productivity"),
        ]);
        if (statsRes) setStats(statsRes);
        if (insightsRes) setInsights(insightsRes);
      } catch (err) {
        console.error("Productivity data fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-st-accent" />
      </div>
    );
  }

  const score = stats?.sessionIntensity ? parseInt(stats.sessionIntensity.match(/\d+/)?.[0] || "0") : 0;
  const deepHours = stats?.deepHours || 0;
  const codingTime = stats?.topSessions?.[0]?.topic || "N/A";
  const learningTime = stats?.topSessions?.[1]?.topic || "N/A";
  const recs = insights?.recommendations || [];

  return (
    <div className="h-full flex flex-col gap-6 pb-8 overflow-y-auto">
      <div>
        <p className="text-[10px] font-bold tracking-widest text-st-accent uppercase mb-1">Performance Metrics</p>
        <h1 className="text-3xl font-bold text-st-text-primary">Productivity Hub</h1>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { icon: Zap, label: "Daily Score", value: `${score}%`, sub: stats?.sessionIntensity || "N/A", color: "text-st-accent" },
          { icon: Clock, label: "Deep Hours", value: `${deepHours}h`, sub: "Total focus time", color: "text-emerald-400" },
          { icon: Code, label: "Top Session", value: codingTime, sub: "Most focused area", color: "text-purple-400" },
          { icon: BookOpen, label: "Learning", value: learningTime, sub: "Secondary focus", color: "text-blue-400" },
          { icon: Brain, label: "Sessions", value: `${insights?.totalSessions || 0}`, sub: "Completed", color: "text-cyan-400" },
          { icon: TrendingUp, label: "Avg Duration", value: `${insights?.avgSessionMinutes || 0}m`, sub: "Per session", color: "text-orange-400" },
        ].map((kpi, i) => (
          <Card key={i} className="p-4">
            <kpi.icon className={`w-5 h-5 ${kpi.color} mb-2`} />
            <p className="text-xs text-st-text-muted">{kpi.label}</p>
            <p className="text-xl font-bold text-st-text-primary">{kpi.value}</p>
            <p className="text-[10px] text-st-text-muted mt-0.5">{kpi.sub}</p>
          </Card>
        ))}
      </div>

      {stats?.activityPulse && stats.activityPulse.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-bold text-st-text-primary mb-4">28-Day Activity Pulse</h3>
          <div className="flex gap-1 items-end h-20">
            {stats.activityPulse.map((level, i) => (
              <div
                key={i}
                className="flex-1 rounded-t transition-all duration-300"
                style={{
                  height: level === 0 ? "4px" : level === 1 ? "33%" : level === 2 ? "66%" : "100%",
                  backgroundColor: level === 0 ? "#1A1A1A" : level === 1 ? "rgba(204,255,0,0.3)" : level === 2 ? "rgba(204,255,0,0.6)" : "#CCFF00",
                }}
                title={`Day ${i + 1}: Level ${level}`}
              />
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-st-text-muted mt-2">
            <span>28 days ago</span>
            <span>Today</span>
          </div>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-st-text-primary mb-4 flex items-center gap-2"><Brain className="w-5 h-5 text-st-accent" />Deep Work Sessions</h3>
          {stats?.topSessions && stats.topSessions.length > 0 ? (
            <div className="space-y-4">
              {stats.topSessions.map((s, i) => (
                <div key={i} className="p-4 bg-st-bg-elevated rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <h4 className="font-semibold text-sm text-st-text-primary">{s.topic}</h4>
                    <Badge variant="outline">{s.progress}% focus</Badge>
                  </div>
                  <p className="text-xs text-st-text-muted">{s.desc}</p>
                  <div className="mt-2 w-full h-1.5 bg-st-bg-primary rounded-full overflow-hidden">
                    <div className="h-full bg-st-accent rounded-full transition-all" style={{ width: `${s.progress}%` }} />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-st-text-muted py-8 text-center">Complete tracking sessions to see your deep work data.</p>
          )}
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-bold text-st-text-primary mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-st-accent" />Strong Topics</h3>
          {insights?.strongTopics && insights.strongTopics.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {insights.strongTopics.map((topic, i) => (
                <div key={i} className="p-4 rounded-lg border bg-st-accent/5 border-st-accent/20">
                  <p className="text-sm font-semibold text-st-text-primary">{topic}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-st-text-muted py-8 text-center">Complete more sessions to identify your strengths.</p>
          )}

          {insights?.weakTopics && insights.weakTopics.length > 0 && (
            <>
              <h3 className="text-lg font-bold text-st-text-primary mt-6 mb-4 flex items-center gap-2">Areas to Improve</h3>
              <div className="grid grid-cols-2 gap-3">
                {insights.weakTopics.map((topic, i) => (
                  <div key={i} className="p-4 rounded-lg border bg-st-bg-elevated border-st-border opacity-70">
                    <p className="text-sm font-semibold text-st-text-primary">{topic}</p>
                  </div>
                ))}
              </div>
            </>
          )}
        </Card>
      </div>

      <Card className="p-6 border-st-accent/20">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-st-accent" />
          <h3 className="text-lg font-bold text-st-text-primary">AI Productivity Insights</h3>
        </div>
        {recs.length > 0 ? (
          <ul className="space-y-2 text-sm text-st-text-secondary">
            {recs.map((rec, i) => (
              <li key={i} className="flex gap-2">
                <span className="text-st-accent shrink-0">•</span>
                {rec}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-st-text-muted">Complete a few sessions to get AI-powered insights.</p>
        )}
      </Card>
    </div>
  );
}