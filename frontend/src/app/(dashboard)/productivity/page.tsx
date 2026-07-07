"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Activity, Clock, Zap, Brain, Code, BookOpen, Coffee, Target, TrendingUp, Flame, Eye, Moon } from "lucide-react";

export default function ProductivityPage() {
  const dailyBreakdown = [
    { hour: "9AM", coding: 2, reading: 0, study: 1, focus: 85 },
    { hour: "10AM", coding: 1, reading: 1, study: 0, focus: 90 },
    { hour: "11AM", coding: 0, reading: 0, study: 2, focus: 92 },
    { hour: "12PM", coding: 0, reading: 0, study: 0, focus: 40 },
    { hour: "1PM", coding: 1, reading: 0, study: 1, focus: 78 },
    { hour: "2PM", coding: 2, reading: 0, study: 0, focus: 88 },
    { hour: "3PM", coding: 1, reading: 1, study: 0, focus: 82 },
    { hour: "4PM", coding: 0, reading: 0, study: 1, focus: 75 },
    { hour: "5PM", coding: 1, reading: 0, study: 0, focus: 70 },
  ];

  const achievements = [
    { title: "Deep Focus Master", desc: "3+ hours of uninterrupted focus", icon: Eye, earned: true },
    { title: "Code Warrior", desc: "4+ hours of coding today", icon: Code, earned: true },
    { title: "Knowledge Seeker", desc: "Read 2+ documents", icon: BookOpen, earned: false },
    { title: "Streak King", desc: "14-day learning streak", icon: Flame, earned: true },
    { title: "Night Owl", desc: "Productive after 10 PM", icon: Moon, earned: false },
    { title: "Speed Learner", desc: "Complete 10 tasks in a day", icon: Zap, earned: false },
  ];

  const deepWorkSessions = [
    { topic: "Kafka Partitioning Review", duration: "1h 45m", focusScore: 95, time: "9:00 AM - 10:45 AM" },
    { topic: "Backend API Development", duration: "2h 10m", focusScore: 88, time: "1:00 PM - 3:10 PM" },
    { topic: "System Design Study", duration: "1h 30m", focusScore: 91, time: "3:30 PM - 5:00 PM" },
  ];

  return (
    <div className="h-full flex flex-col gap-6 pb-8 overflow-y-auto">
      <div>
        <p className="text-[10px] font-bold tracking-widest text-st-accent uppercase mb-1">Performance Metrics</p>
        <h1 className="text-3xl font-bold text-st-text-primary">Productivity Hub</h1>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {[
          { icon: Zap, label: "Daily Score", value: "92%", sub: "+5% vs avg", color: "text-st-accent" },
          { icon: Clock, label: "Total Active", value: "8.5h", sub: "Today", color: "text-emerald-400" },
          { icon: Code, label: "Coding Time", value: "4.2h", sub: "49% of day", color: "text-purple-400" },
          { icon: BookOpen, label: "Learning", value: "2.5h", sub: "3 sessions", color: "text-blue-400" },
          { icon: Eye, label: "Focus Time", value: "6.8h", sub: "Deep work", color: "text-cyan-400" },
          { icon: Coffee, label: "Break Time", value: "0.8h", sub: "Below target", color: "text-orange-400" },
        ].map((kpi, i) => (
          <Card key={i} className="p-4">
            <kpi.icon className={`w-5 h-5 ${kpi.color} mb-2`} />
            <p className="text-xs text-st-text-muted">{kpi.label}</p>
            <p className="text-xl font-bold text-st-text-primary">{kpi.value}</p>
            <p className="text-[10px] text-st-text-muted mt-0.5">{kpi.sub}</p>
          </Card>
        ))}
      </div>

      {/* Activity Heatmap */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-st-text-primary mb-4">Hourly Focus Distribution</h3>
        <div className="grid grid-cols-9 gap-3">
          {dailyBreakdown.map((slot, i) => (
            <div key={i} className="text-center">
              <div className={`aspect-square rounded-lg mb-2 flex items-center justify-center text-xs font-bold ${
                slot.focus >= 90 ? "bg-st-accent text-black" :
                slot.focus >= 80 ? "bg-st-accent/50 text-st-text-primary" :
                slot.focus >= 60 ? "bg-st-bg-elevated text-st-text-secondary" :
                "bg-st-border/30 text-st-text-muted"
              }`}>{slot.focus}</div>
              <span className="text-[10px] text-st-text-muted">{slot.hour}</span>
            </div>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Deep Work Sessions */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-st-text-primary mb-4 flex items-center gap-2"><Brain className="w-5 h-5 text-st-accent" />Deep Work Sessions</h3>
          <div className="space-y-4">
            {deepWorkSessions.map((s, i) => (
              <div key={i} className="p-4 bg-st-bg-elevated rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <h4 className="font-semibold text-sm text-st-text-primary">{s.topic}</h4>
                  <Badge variant={s.focusScore >= 90 ? "success" : "outline"}>{s.focusScore}% focus</Badge>
                </div>
                <div className="flex items-center gap-4 text-xs text-st-text-muted">
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{s.duration}</span>
                  <span>{s.time}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* Achievements */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-st-text-primary mb-4 flex items-center gap-2"><Target className="w-5 h-5 text-st-accent" />Achievements</h3>
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((a, i) => (
              <div key={i} className={`p-4 rounded-lg border ${a.earned ? "bg-st-accent/5 border-st-accent/20" : "bg-st-bg-elevated border-st-border opacity-50"}`}>
                <a.icon className={`w-5 h-5 mb-2 ${a.earned ? "text-st-accent" : "text-st-text-muted"}`} />
                <p className="text-sm font-semibold text-st-text-primary">{a.title}</p>
                <p className="text-xs text-st-text-muted">{a.desc}</p>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* AI Insights */}
      <Card className="p-6 border-st-accent/20">
        <div className="flex items-center gap-2 mb-3">
          <Brain className="w-5 h-5 text-st-accent" />
          <h3 className="text-lg font-bold text-st-text-primary">AI Productivity Insights</h3>
        </div>
        <ul className="space-y-2 text-sm text-st-text-secondary">
          <li className="flex gap-2"><span className="text-st-accent">•</span>Your peak productivity hours are between 9-11 AM. Schedule your hardest tasks during this window.</li>
          <li className="flex gap-2"><span className="text-st-accent">•</span>Break time is 47% below your target. Consider the Pomodoro technique (25 min work / 5 min break).</li>
          <li className="flex gap-2"><span className="text-st-accent">•</span>Coding productivity increased 15% compared to last week. Keep up the deep work sessions.</li>
          <li className="flex gap-2"><span className="text-st-accent">•</span>You&apos;re on a 14-day streak! Maintaining consistency is more valuable than intensity.</li>
        </ul>
      </Card>
    </div>
  );
}
