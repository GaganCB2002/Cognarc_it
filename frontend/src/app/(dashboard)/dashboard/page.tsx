"use client";
// cache-buster

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { LiveActivityWidget } from "@/components/dashboard/LiveActivityWidget";
import { DashboardSkeleton } from "@/components/ui/DashboardSkeleton";
import { api } from "@/lib/api";
import {
  Flame, CheckCircle2, Clock, PlayCircle, Pause, RotateCcw,
  BookOpen, Brain, Calendar, TrendingUp,
  Zap, ChevronRight, Bell, Upload, Sparkles,
  Folder, ArrowUpRight, CircleDashed
} from "lucide-react";

export default function DashboardPage() {
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(25 * 60);
  const [pomodoroCount, setPomodoroCount] = useState(0);

  const [tasks, setTasks] = useState<{ id?: string; title: string; status: string; priority: string; dueDate?: string; category?: string }[]>([]);
  const [events, setEvents] = useState<{ id?: string; title: string; eventType: string; startTime: string; endTime?: string }[]>([]);
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
        const start = new Date().toISOString();
        const end = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

        const [taskItems, calItems, notesItems, sessionsData] = await Promise.all([
          api.get<{ tasks: { id?: string; title: string; status: string; priority: string; dueDate?: string; category?: string }[] }>('/tasks'),
          api.get<{ id?: string; title: string; eventType: string; startTime: string; endTime?: string }[]>(`/calendar?start=${start}&end=${end}`),
          api.get<{ notes: unknown[] }>('/notes'),
          api.get<{ sessions: { duration: number }[] }>('/tracking/sessions')
        ]);

        if (taskItems && Array.isArray(taskItems.tasks)) setTasks(taskItems.tasks);
        if (Array.isArray(calItems)) setEvents(calItems);
        if (notesItems && Array.isArray(notesItems.notes)) setNotesCount(notesItems.notes.length);
        const sessionList = sessionsData?.sessions || [];
        if (Array.isArray(sessionList) && sessionList.length > 0) {
          const totalSecs = (sessionList as { duration: number }[]).reduce((acc: number, s: { duration: number }) => acc + (s.duration || 0), 0);
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
    { name: "Start Study", icon: BookOpen, href: "/curriculum" },
    { name: "New Task", icon: CheckCircle2, href: "/tasks" },
    { name: "Upload PDF", icon: Upload, href: "/knowledge-vault" },
    { name: "AI Chat", icon: Brain, href: "/ai-assistant" },
  ];

  const todaysTasks = tasks
    .filter(t => !t.dueDate || new Date(t.dueDate).toDateString() === new Date().toDateString() || t.status !== "DONE")
    .slice(0, 4);

  const completedTasksCount = tasks.filter(t => t.status === "DONE").length;

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8 relative">
      {loading ? <DashboardSkeleton /> : (
      <>
      {/* Header */}
      <div className="flex justify-between items-end">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-st-accent/10 border border-st-accent/20 text-[10px] font-semibold text-st-accent uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              Command Center
            </span>
          </div>
          <h1 className="text-2xl font-bold text-st-text-primary tracking-tight">Welcome back</h1>
          <p className="text-sm text-st-text-secondary mt-0.5">Ready for today&apos;s deep work session?</p>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/reports" className="relative p-2.5 rounded-lg bg-st-bg-card border border-st-border hover:bg-st-bg-elevated transition-all duration-200">
            <Bell className="w-[18px] h-[18px] text-st-text-secondary" />
          </Link>
          <div className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-st-accent/10 to-st-accent/5 rounded-lg border border-st-accent/15">
            <Flame className="w-[18px] h-[18px] text-st-accent" />
            <span className="text-sm font-semibold text-st-text-primary">0 Day Streak</span>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {quickActions.map((action) => (
          <Link key={action.name} href={action.href}>
            <Card className="p-4 hover:border-st-accent/20 transition-all duration-200 cursor-pointer group">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-st-accent-soft flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
                  <action.icon className="w-5 h-5 text-st-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm text-st-text-primary block truncate">{action.name}</span>
                  <span className="text-[10px] text-st-text-tertiary">Quick action</span>
                </div>
                <ArrowUpRight className="w-3.5 h-3.5 text-st-text-muted group-hover:text-st-accent transition-colors shrink-0" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {[
          { label: "Study Hours", icon: Clock, value: `${totalStudyHours}`, suffix: "total", href: "/tracking", accent: "text-st-success" },
          { label: "Tasks Done", icon: CheckCircle2, value: `${completedTasksCount}/${tasks.length}`, suffix: "", href: "/tasks", accent: "text-st-info" },
          { label: "Productivity", icon: TrendingUp, value: "--%", suffix: "", href: "/productivity", accent: "text-st-accent" },
          { label: "Focus Score", icon: Zap, value: "--", suffix: "", href: "/analytics", accent: "text-st-warning" },
        ].map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="p-4 hover:border-st-border/30 transition-all duration-200 cursor-pointer group relative overflow-hidden">
              <div className="absolute inset-0 opacity-[0.03] bg-gradient-to-br from-white to-transparent" />
              <div className="flex items-center gap-2 mb-1.5">
                <stat.icon className={`w-3.5 h-3.5 ${stat.accent}`} />
                <p className={`text-xs font-medium ${stat.accent}`}>{stat.label}</p>
              </div>
              <p className="text-2xl font-bold text-st-text-primary tracking-tight">
                {stat.value}
                {stat.suffix && <span className="text-xs font-normal text-st-text-tertiary ml-1">{stat.suffix}</span>}
              </p>
            </Card>
          </Link>
        ))}
        <Card className="p-4 group relative overflow-hidden">
          <div className="absolute inset-0 opacity-[0.03] bg-gradient-to-br from-white to-transparent" />
          <div className="flex justify-between items-center mb-1.5">
            <p className="text-xs font-medium text-st-accent">Pomodoro</p>
            <div className="flex gap-1">
              <button onClick={() => setTimerRunning(!timerRunning)} className="p-1 rounded hover:bg-st-accent/10 transition-colors">
                {timerRunning ? <Pause className="w-3.5 h-3.5 text-st-accent" /> : <PlayCircle className="w-3.5 h-3.5 text-st-accent" />}
              </button>
              <button onClick={() => { setTimerSeconds(25*60); setTimerRunning(false); setPomodoroCount(0); }} className="p-1 rounded hover:bg-st-accent/10 transition-colors">
                <RotateCcw className="w-3 h-3 text-st-accent" />
              </button>
            </div>
          </div>
          <p className="text-2xl font-bold text-st-text-primary font-mono tracking-tight">{formatTime(timerSeconds)}</p>
          {pomodoroCount > 0 && (
            <p className="text-[10px] text-st-accent mt-1 font-medium">{pomodoroCount} session{pomodoroCount > 1 ? 's' : ''} completed</p>
          )}
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Tasks */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-semibold text-st-text-primary tracking-tight">Active Tasks</h2>
              <Link href="/tasks" className="text-xs text-st-accent hover:text-st-accent-hover transition-colors font-medium">View all <ChevronRight className="w-3 h-3 inline ml-0.5" /></Link>
            </div>
            <Card className="p-0 overflow-hidden">
              <div className="divide-y divide-st-border/80">
                {todaysTasks.length === 0 && (
                  <div className="p-8 text-center">
                    <CircleDashed className="w-8 h-8 text-st-text-muted/30 mx-auto mb-2" />
                    <p className="text-sm text-st-text-muted">No pending tasks</p>
                    <p className="text-xs text-st-text-muted/60 mt-0.5">Create a new task to get started</p>
                  </div>
                )}
                {todaysTasks.map((task, i) => (
                  <Link key={task.id || i} href="/tasks" className="p-4 flex gap-3 items-start hover:bg-st-bg-elevated/50 transition-colors cursor-pointer group">
                    <div className="mt-0.5">
                      <CheckCircle2 className={`w-[18px] h-[18px] ${task.status === "DONE" ? "text-st-success" : "text-st-text-muted/40"}`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-2 mb-0.5">
                        <h4 className={`text-sm font-medium truncate ${task.status === "DONE" ? "line-through text-st-text-muted" : "text-st-text-primary"}`}>{task.title}</h4>
                        <Badge variant={task.priority === "CRITICAL" ? "danger" : task.priority === "HIGH" ? "warning" : "outline"}>{task.priority || "MEDIUM"}</Badge>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-st-text-muted">
                        <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
                        <span>{task.category || 'General'}</span>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </Card>
          </div>

          {/* Weekly Goals */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <h2 className="text-base font-semibold text-st-text-primary tracking-tight">Weekly Goals</h2>
              <Link href="/productivity" className="text-xs text-st-accent hover:text-st-accent-hover transition-colors font-medium">Details <ChevronRight className="w-3 h-3 inline ml-0.5" /></Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {[
                { label: "Study Hours", current: totalStudyHours, goal: 30, unit: "hrs" },
                { label: "Tasks Completed", current: completedTasksCount, goal: 20, unit: "" },
                { label: "Coding Practice", current: 0, goal: 15, unit: "hrs" },
                { label: "Documents Read", current: 0, goal: 5, unit: "" },
              ].map((g, i) => {
                const pct = Math.min((g.current / g.goal) * 100, 100);
                return (
                  <Card key={i} className="p-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-st-text-secondary">{g.label}</span>
                      <span className="text-xs text-st-text-muted font-medium">{g.current}/{g.goal} {g.unit}</span>
                    </div>
                    <div className="w-full h-2 bg-st-bg-elevated rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500 ease-out"
                        style={{
                          width: `${pct}%`,
                          background: pct > 0
                            ? `linear-gradient(90deg, ${pct > 50 ? 'var(--color-st-success)' : 'var(--color-st-warning)'}, ${pct > 75 ? '#2DD4A0' : '#D49520'})`
                            : 'var(--color-st-bg-elevated)'
                        }}
                      />
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-6">
          {/* Live Activity Widget */}
          <LiveActivityWidget />

          {/* Upcoming Events */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-st-accent" />
                <h2 className="text-base font-semibold text-st-text-primary tracking-tight">Upcoming</h2>
              </div>
              <Link href="/calendar" className="text-xs text-st-accent hover:text-st-accent-hover transition-colors font-medium">View <ChevronRight className="w-3 h-3 inline ml-0.5" /></Link>
            </div>
            <Card className="p-0 overflow-hidden divide-y divide-st-border/80">
              {events.length === 0 && (
                <div className="p-5 text-center">
                  <p className="text-xs text-st-text-muted">No upcoming events</p>
                </div>
              )}
              {events.slice(0, 3).map((evt, i) => (
                <div key={evt.id || i} className="p-3.5 flex items-center gap-3 hover:bg-st-bg-elevated/50 transition-colors">
                  <div className={`w-2 h-2 rounded-full shrink-0 ${evt.eventType === 'MEETING' ? 'bg-orange-400' : 'bg-st-accent'}`} />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-st-text-primary truncate">{evt.title}</p>
                    <p className="text-xs text-st-text-muted">{new Date(evt.startTime).toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </Card>
          </div>

          {/* Knowledge Vault */}
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <Folder className="w-4 h-4 text-st-accent" />
                <h2 className="text-base font-semibold text-st-text-primary tracking-tight">Knowledge Vault</h2>
              </div>
              <Link href="/knowledge-vault" className="text-xs text-st-accent hover:text-st-accent-hover transition-colors font-medium">Open <ChevronRight className="w-3 h-3 inline ml-0.5" /></Link>
            </div>
            <Card className="p-4">
              <div className="grid grid-cols-3 gap-4 text-center">
                {[
                  { label: "PDFs", value: "--" },
                  { label: "Videos", value: "--" },
                  { label: "Notes", value: notesCount.toString() },
                ].map((item) => (
                  <div key={item.label}>
                    <p className="text-lg font-bold text-st-text-primary tracking-tight">{item.value}</p>
                    <p className="text-[10px] text-st-text-muted mt-0.5 uppercase tracking-wider">{item.label}</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </>
    )}
    </div>
  );
}
