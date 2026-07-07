"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  Flame, CheckCircle2, Clock, PlayCircle, Pause, RotateCcw,
  BookOpen, Code, Brain, Calendar, FileText, TrendingUp,
  Target, Zap, ChevronRight, Bell, Upload, Sparkles,
  BarChart3, Folder
} from "lucide-react";

export default function DashboardPage() {
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
  };

  const quickActions = [
    { name: "Start Study", icon: BookOpen, href: "/curriculum", color: "text-emerald-400" },
    { name: "New Task", icon: CheckCircle2, href: "/tasks", color: "text-blue-400" },
    { name: "Upload PDF", icon: Upload, href: "/knowledge-vault", color: "text-purple-400" },
    { name: "AI Chat", icon: Brain, href: "/ai-assistant", color: "text-st-accent" },
  ];

  const recentActivities = [
    { text: "Completed Docker Multi-stage Builds", time: "2 hours ago", color: "bg-st-success" },
    { text: "Uploaded 'Designing Data-Intensive Applications'", time: "Yesterday", color: "bg-st-accent" },
    { text: "Finished System Design Mock Interview", time: "2 days ago", color: "bg-blue-400" },
    { text: "Completed 15 LeetCode Problems", time: "3 days ago", color: "bg-purple-400" },
  ];

  const todaysTasks = [
    { title: "Review Kafka Partitioning Logic", priority: "Critical", time: "45 mins", category: "System Design", done: false },
    { title: "Complete Dynamic Programming Quiz", priority: "Medium", time: "30 mins", category: "Algorithms", done: false },
    { title: "Read CAP Theorem Paper", priority: "High", time: "60 mins", category: "Distributed Systems", done: true },
  ];

  const notifications = [
    { text: "Your learning streak is at 14 days!", type: "achievement" },
    { text: "New AI recommendation available", type: "info" },
    { text: "Task deadline approaching: System Design Review", type: "warning" },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-8">
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-st-accent uppercase mb-1">Command Center</p>
          <h1 className="text-3xl font-bold text-st-text-primary">Welcome back, Developer</h1>
          <p className="text-st-text-secondary mt-1">Ready for today&apos;s deep work session?</p>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/reports" className="relative p-2 rounded-lg bg-st-bg-elevated border border-st-border hover:border-st-accent/50 transition-colors">
            <Bell className="w-5 h-5 text-st-text-secondary" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-st-danger rounded-full text-[10px] flex items-center justify-center text-white font-bold">3</span>
          </Link>
          <div className="flex items-center gap-2 px-4 py-2 bg-st-bg-elevated rounded-lg border border-st-border">
            <Flame className="w-5 h-5 text-st-accent" />
            <span className="font-semibold text-st-text-primary">14 Day Streak</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {quickActions.map((action) => (
          <Link key={action.name} href={action.href}>
            <Card className="p-4 hover:border-st-accent/30 transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-st-bg-elevated flex items-center justify-center group-hover:bg-st-accent/10 transition-colors">
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <span className="font-medium text-sm text-st-text-primary">{action.name}</span>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Link href="/analytics">
          <Card className="p-5 hover:border-st-accent/30 transition-all cursor-pointer">
            <p className="text-xs font-medium text-st-text-secondary mb-1">Study Hours</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-st-text-primary">24.5</h3>
              <span className="text-xs text-st-success">+2.1h</span>
            </div>
          </Card>
        </Link>
        <Link href="/tasks">
          <Card className="p-5 hover:border-st-accent/30 transition-all cursor-pointer">
            <p className="text-xs font-medium text-st-text-secondary mb-1">Tasks Done</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-st-text-primary">12/18</h3>
              <span className="text-xs text-st-success">On track</span>
            </div>
          </Card>
        </Link>
        <Link href="/productivity">
          <Card className="p-5 hover:border-st-accent/30 transition-all cursor-pointer">
            <p className="text-xs font-medium text-st-text-secondary mb-1">Productivity</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-st-accent">92%</h3>
              <span className="text-xs text-st-success">+5%</span>
            </div>
          </Card>
        </Link>
        <Link href="/analytics">
          <Card className="p-5 hover:border-st-accent/30 transition-all cursor-pointer">
            <p className="text-xs font-medium text-st-text-secondary mb-1">Focus Score</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-st-text-primary">87</h3>
              <span className="text-xs text-st-warning">-2</span>
            </div>
          </Card>
        </Link>
        {/* Pomodoro Timer */}
        <Card className="p-5 bg-st-accent/10 border-st-accent/20">
          <div className="flex justify-between items-center mb-1">
            <p className="text-xs font-medium text-st-accent">Pomodoro</p>
            <div className="flex gap-1">
              <button onClick={() => setTimerRunning(!timerRunning)} className="hover:opacity-70 transition-opacity">
                {timerRunning ? <Pause className="w-4 h-4 text-st-accent" /> : <PlayCircle className="w-4 h-4 text-st-accent" />}
              </button>
              <button onClick={() => { setTimerSeconds(25*60); setTimerRunning(false); }} className="hover:opacity-70 transition-opacity">
                <RotateCcw className="w-3 h-3 text-st-accent" />
              </button>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-st-text-primary font-mono">{formatTime(timerSeconds)}</h3>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Plan */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-st-text-primary">Today&apos;s Plan</h2>
            <Link href="/tasks" className="text-xs text-st-accent hover:underline">View All →</Link>
          </div>
          <Card className="p-0 overflow-hidden">
            <div className="divide-y divide-st-border">
              {todaysTasks.map((task, i) => (
                <Link key={i} href="/tasks" className="p-5 flex gap-4 items-start hover:bg-st-bg-elevated transition-colors cursor-pointer block">
                  <div className="mt-1">
                    <CheckCircle2 className={`w-5 h-5 ${task.done ? "text-st-success" : "text-st-text-muted"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`font-semibold ${task.done ? "line-through text-st-text-muted" : "text-st-text-primary"}`}>{task.title}</h4>
                      <Badge variant={task.priority === "Critical" ? "danger" : task.priority === "High" ? "warning" : "outline"}>{task.priority}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-st-text-muted">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.time}</span>
                      <span>{task.category}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </Card>

          {/* Weekly Goals */}
          <div className="flex justify-between items-center mt-6">
            <h2 className="text-xl font-bold text-st-text-primary">Weekly Goals</h2>
            <Link href="/productivity" className="text-xs text-st-accent hover:underline">Details →</Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { label: "Study Hours", current: 18, goal: 30, unit: "hrs" },
              { label: "Tasks Completed", current: 12, goal: 20, unit: "" },
              { label: "Coding Practice", current: 8, goal: 15, unit: "hrs" },
              { label: "Documents Read", current: 3, goal: 5, unit: "" },
            ].map((g, i) => (
              <Card key={i} className="p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-st-text-secondary">{g.label}</span>
                  <span className="text-xs text-st-text-muted">{g.current}/{g.goal} {g.unit}</span>
                </div>
                <div className="w-full h-2 bg-st-bg-elevated rounded-full overflow-hidden">
                  <div className="h-full bg-st-accent rounded-full transition-all" style={{ width: `${Math.min((g.current / g.goal) * 100, 100)}%` }} />
                </div>
              </Card>
            ))}
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* AI Recommendations */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-st-text-primary flex items-center gap-2"><Sparkles className="w-4 h-4 text-st-accent" />AI Insights</h2>
            </div>
            <Card className="p-5">
              <p className="text-sm text-st-text-secondary mb-4">
                Based on your recent performance in System Design, I recommend reviewing <strong className="text-st-text-primary">Consistency Models</strong> before your mock interview on Friday.
              </p>
              <Link href="/ai-assistant">
                <Button variant="outline" className="w-full text-sm">Ask AI Assistant</Button>
              </Link>
            </Card>
          </div>

          {/* Calendar Preview */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-st-text-primary flex items-center gap-2"><Calendar className="w-4 h-4 text-st-accent" />Upcoming</h2>
              <Link href="/calendar" className="text-xs text-st-accent hover:underline">View →</Link>
            </div>
            <Card className="p-0 overflow-hidden divide-y divide-st-border">
              {[
                { text: "System Design Review", time: "Today 2:00 PM", color: "bg-blue-400" },
                { text: "Mock Interview", time: "Fri 10:00 AM", color: "bg-st-accent" },
                { text: "Sprint Planning", time: "Mon 9:00 AM", color: "bg-purple-400" },
              ].map((evt, i) => (
                <div key={i} className="p-3 flex items-center gap-3 hover:bg-st-bg-elevated transition-colors">
                  <div className={`w-2 h-2 rounded-full ${evt.color} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-st-text-primary truncate">{evt.text}</p>
                    <p className="text-xs text-st-text-muted">{evt.time}</p>
                  </div>
                </div>
              ))}
            </Card>
          </div>

          {/* Notifications */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-st-text-primary flex items-center gap-2"><Bell className="w-4 h-4 text-st-accent" />Notifications</h2>
            <div className="space-y-2">
              {notifications.map((n, i) => (
                <Card key={i} className="p-3 flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${n.type === "achievement" ? "bg-st-success" : n.type === "warning" ? "bg-st-warning" : "bg-blue-400"}`} />
                  <p className="text-sm text-st-text-secondary">{n.text}</p>
                </Card>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-st-text-primary">Recent Activity</h2>
            <div className="space-y-3">
              {recentActivities.map((a, i) => (
                <div key={i} className="flex gap-3">
                  <div className={`w-2 h-2 mt-2 rounded-full ${a.color} shrink-0`} />
                  <div>
                    <p className="text-sm font-medium text-st-text-primary">{a.text}</p>
                    <p className="text-xs text-st-text-muted">{a.time}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Knowledge Vault Summary */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-st-text-primary flex items-center gap-2"><Folder className="w-4 h-4 text-st-accent" />Knowledge Vault</h2>
              <Link href="/knowledge-vault" className="text-xs text-st-accent hover:underline">Open →</Link>
            </div>
            <Card className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                <div>
                  <p className="text-lg font-bold text-st-text-primary">12</p>
                  <p className="text-xs text-st-text-muted">PDFs</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-st-text-primary">5</p>
                  <p className="text-xs text-st-text-muted">Videos</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-st-text-primary">28</p>
                  <p className="text-xs text-st-text-muted">Notes</p>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
