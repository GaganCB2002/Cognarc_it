"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { LiveActivityWidget } from "@/components/dashboard/LiveActivityWidget";
import { api } from "@/lib/api";
import {
  Flame, CheckCircle2, Clock, PlayCircle, Pause, RotateCcw,
  BookOpen, Code, Brain, Calendar, FileText, TrendingUp,
  Target, Zap, ChevronRight, Bell, Upload, Sparkles,
  BarChart3, Folder
} from "lucide-react";

export default function DashboardPage() {
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [pomodoroCount, setPomodoroCount] = useState(0);

  // Dynamic Data States
  const [tasks, setTasks] = useState<any[]>([]);
  const [events, setEvents] = useState<any[]>([]);
  const [notesCount, setNotesCount] = useState(0);
  const [totalStudyHours, setTotalStudyHours] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (timerRunning && timerSeconds > 0) {
      interval = setInterval(() => setTimerSeconds(s => s - 1), 1000);
    } else if (timerSeconds === 0) {
      setTimerRunning(false);
      setPomodoroCount(c => c + 1);
      setTimerSeconds(25 * 60);
    }
    return () => clearInterval(interval);
  }, [timerRunning, timerSeconds]);

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        // Fetch in parallel for better performance
        const start = new Date().toISOString();
        const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const [tasksRes, calRes, notesRes, sessionsRes] = await Promise.all([
          api.get('/tasks') as Promise<any>,
          api.get(`/calendar?start=${start}&end=${end}`) as Promise<any>,
          api.get('/notes') as Promise<any>,
          api.get('/tracking/sessions') as Promise<any>
        ]);

        if (tasksRes?.data) setTasks(tasksRes.data);
        if (calRes?.data) setEvents(calRes.data);
        if (notesRes?.data) setNotesCount(notesRes.data.length);
        if (sessionsRes?.data) {
          const totalSecs = sessionsRes.data.reduce((acc: number, s: any) => acc + (s.duration || 0), 0);
          setTotalStudyHours(+(totalSecs / 3600).toFixed(1));
        }
      } catch (err) {
        console.error("Failed to load dashboard data", err);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

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

  const todaysTasks = tasks
    .filter(t => !t.dueDate || new Date(t.dueDate).toDateString() === new Date().toDateString() || t.status !== "DONE")
    .slice(0, 4);

  const completedTasksCount = tasks.filter(t => t.status === "DONE").length;

  return (
    <div className="max-w-7xl mx-auto space-y-8 pb-8 relative">
      {loading && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-st-bg-primary/50 backdrop-blur-sm">
          <div className="animate-spin w-8 h-8 border-2 border-st-accent border-t-transparent rounded-full" />
        </div>
      )}

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
          </Link>
          <div className="flex items-center gap-2 px-4 py-2 bg-st-bg-elevated rounded-lg border border-st-border">
            <Flame className="w-5 h-5 text-st-accent" />
            <span className="font-semibold text-st-text-primary">0 Day Streak</span>
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
        <Link href="/tracking">
          <Card className="p-5 hover:border-st-accent/30 transition-all cursor-pointer">
            <p className="text-xs font-medium text-st-text-secondary mb-1">Study Hours</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-st-text-primary">{totalStudyHours}</h3>
              <span className="text-xs text-st-text-muted">Total</span>
            </div>
          </Card>
        </Link>
        <Link href="/tasks">
          <Card className="p-5 hover:border-st-accent/30 transition-all cursor-pointer">
            <p className="text-xs font-medium text-st-text-secondary mb-1">Tasks Done</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-st-text-primary">{completedTasksCount}/{tasks.length}</h3>
            </div>
          </Card>
        </Link>
        <Link href="/productivity">
          <Card className="p-5 hover:border-st-accent/30 transition-all cursor-pointer">
            <p className="text-xs font-medium text-st-text-secondary mb-1">Productivity</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-st-accent">--%</h3>
            </div>
          </Card>
        </Link>
        <Link href="/analytics">
          <Card className="p-5 hover:border-st-accent/30 transition-all cursor-pointer">
            <p className="text-xs font-medium text-st-text-secondary mb-1">Focus Score</p>
            <div className="flex items-baseline gap-2">
              <h3 className="text-2xl font-bold text-st-text-primary">--</h3>
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
              <button onClick={() => { setTimerSeconds(25*60); setTimerRunning(false); setPomodoroCount(0); }} className="hover:opacity-70 transition-opacity">
                <RotateCcw className="w-3 h-3 text-st-accent" />
              </button>
            </div>
          </div>
          <h3 className="text-2xl font-bold text-st-text-primary font-mono">{formatTime(timerSeconds)}</h3>
          {pomodoroCount > 0 && (
            <p className="text-[10px] text-st-accent mt-1 font-medium">{pomodoroCount} session{pomodoroCount > 1 ? 's' : ''} completed</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Today's Plan */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold text-st-text-primary">Active Tasks</h2>
            <Link href="/tasks" className="text-xs text-st-accent hover:underline">View All →</Link>
          </div>
          <Card className="p-0 overflow-hidden">
            <div className="divide-y divide-st-border">
              {todaysTasks.length === 0 && <div className="p-6 text-center text-st-text-muted">No pending tasks!</div>}
              {todaysTasks.map((task, i) => (
                <Link key={task.id || i} href="/tasks" className="p-5 flex gap-4 items-start hover:bg-st-bg-elevated transition-colors cursor-pointer block">
                  <div className="mt-1">
                    <CheckCircle2 className={`w-5 h-5 ${task.status === "DONE" ? "text-st-success" : "text-st-text-muted"}`} />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start mb-1">
                      <h4 className={`font-semibold ${task.status === "DONE" ? "line-through text-st-text-muted" : "text-st-text-primary"}`}>{task.title}</h4>
                      <Badge variant={task.priority === "CRITICAL" ? "danger" : task.priority === "HIGH" ? "warning" : "outline"}>{task.priority || "MEDIUM"}</Badge>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-st-text-muted">
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
                      <span>{task.category || 'General'}</span>
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
              { label: "Study Hours", current: totalStudyHours, goal: 30, unit: "hrs" },
              { label: "Tasks Completed", current: completedTasksCount, goal: 20, unit: "" },
              { label: "Coding Practice", current: 0, goal: 15, unit: "hrs" },
              { label: "Documents Read", current: 0, goal: 5, unit: "" },
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
          {/* Live Activity Widget */}
          <LiveActivityWidget />

          {/* AI Recommendations */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-st-text-primary flex items-center gap-2"><Sparkles className="w-4 h-4 text-st-accent" />AI Insights</h2>
            </div>
            <Card className="p-5">
              <p className="text-sm text-st-text-secondary mb-4">
                Ask StudyBot about the codebase — architecture, routes, database schema, or how any feature works.
              </p>
              <p className="text-xs text-st-text-muted mb-3">
                Uses <strong className="text-st-accent">RAG</strong> — searches actual source files for accurate answers.
              </p>
              <Button variant="outline" className="w-full text-sm" onClick={() => {
                const event = new CustomEvent('opencode-chatbot-toggle');
                window.dispatchEvent(event);
              }}>
                Open StudyBot
              </Button>
            </Card>
          </div>

          {/* Calendar Preview */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-lg font-bold text-st-text-primary flex items-center gap-2"><Calendar className="w-4 h-4 text-st-accent" />Upcoming</h2>
              <Link href="/calendar" className="text-xs text-st-accent hover:underline">View →</Link>
            </div>
            <Card className="p-0 overflow-hidden divide-y divide-st-border">
              {events.length === 0 && <div className="p-4 text-center text-xs text-st-text-muted">No upcoming events.</div>}
              {events.slice(0, 3).map((evt, i) => (
                <div key={evt.id || i} className="p-3 flex items-center gap-3 hover:bg-st-bg-elevated transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${evt.eventType === 'MEETING' ? 'bg-orange-400' : 'bg-st-accent'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-st-text-primary truncate">{evt.title}</p>
                    <p className="text-xs text-st-text-muted">{new Date(evt.startTime).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </Card>
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
                  <p className="text-lg font-bold text-st-text-primary">--</p>
                  <p className="text-xs text-st-text-muted">PDFs</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-st-text-primary">--</p>
                  <p className="text-xs text-st-text-muted">Videos</p>
                </div>
                <div>
                  <p className="text-lg font-bold text-st-text-primary">{notesCount}</p>
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
