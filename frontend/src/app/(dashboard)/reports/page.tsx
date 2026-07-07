"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { BarChart3, Download, Calendar, FileText, Clock, Target, Code, BookOpen, Brain, Zap, TrendingUp, Coffee } from "lucide-react";

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("today");

  const periods = [
    { key: "today", label: "Today" },
    { key: "yesterday", label: "Yesterday" },
    { key: "weekly", label: "This Week" },
    { key: "monthly", label: "This Month" },
    { key: "yearly", label: "This Year" },
    { key: "custom", label: "Custom Range" },
  ];

  const reportData = {
    studyHours: 6.5, codingHours: 4.2, readingHours: 1.8, aiUsage: 45,
    tasksCompleted: 8, tasksPending: 5, projectsWorked: 3, filesUploaded: 2,
    pdfsStudied: 1, videosWatched: 2, revisionCompleted: 3, learningStreak: 14,
    productivityScore: 92, focusScore: 87, idleTime: 1.2, breakDuration: 0.8,
  };

  const metrics = [
    { icon: Clock, label: "Study Hours", value: `${reportData.studyHours}h`, color: "text-emerald-400" },
    { icon: Code, label: "Coding Hours", value: `${reportData.codingHours}h`, color: "text-purple-400" },
    { icon: BookOpen, label: "Reading Hours", value: `${reportData.readingHours}h`, color: "text-blue-400" },
    { icon: Brain, label: "AI Usage", value: `${reportData.aiUsage} msgs`, color: "text-st-accent" },
    { icon: Target, label: "Tasks Done", value: `${reportData.tasksCompleted}`, color: "text-emerald-400" },
    { icon: Target, label: "Tasks Pending", value: `${reportData.tasksPending}`, color: "text-st-warning" },
    { icon: Zap, label: "Productivity", value: `${reportData.productivityScore}%`, color: "text-st-accent" },
    { icon: TrendingUp, label: "Focus Score", value: `${reportData.focusScore}/100`, color: "text-blue-400" },
    { icon: Coffee, label: "Break Time", value: `${reportData.breakDuration}h`, color: "text-st-text-muted" },
    { icon: FileText, label: "PDFs Studied", value: `${reportData.pdfsStudied}`, color: "text-red-400" },
    { icon: Calendar, label: "Streak", value: `${reportData.learningStreak} days`, color: "text-orange-400" },
    { icon: BarChart3, label: "Projects", value: `${reportData.projectsWorked}`, color: "text-cyan-400" },
  ];

  return (
    <div className="h-full flex flex-col gap-6 pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-st-accent uppercase mb-1">AI-Powered Reports</p>
          <h1 className="text-3xl font-bold text-st-text-primary">Overall Report</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={() => window.print()}><Download className="w-4 h-4 mr-1" />Export PDF</Button>
          <Button variant="outline" size="sm" onClick={() => { const csv = "data:text/csv;charset=utf-8,Category,Hours\nLearning,42\nCoding,38\nReading,12\nTasks,8\nAI Assistant,6"; window.open(encodeURI(csv)); }}><Download className="w-4 h-4 mr-1" />Export CSV</Button>
        </div>
      </div>

      {/* Period Tabs */}
      <div className="flex gap-2 flex-wrap">
        {periods.map(p => (
          <button key={p.key} onClick={() => setSelectedPeriod(p.key)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${selectedPeriod === p.key ? "bg-st-accent text-black" : "bg-st-bg-elevated text-st-text-secondary hover:text-st-text-primary border border-st-border"}`}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {metrics.map((m, i) => (
          <Card key={i} className="p-4">
            <div className="flex items-center gap-2 mb-2">
              <m.icon className={`w-4 h-4 ${m.color}`} />
              <span className="text-xs text-st-text-muted">{m.label}</span>
            </div>
            <p className="text-xl font-bold text-st-text-primary">{m.value}</p>
          </Card>
        ))}
      </div>

      {/* AI Narrative Summary */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-st-accent" />
          <h3 className="text-lg font-bold text-st-text-primary">AI Narrative Summary</h3>
        </div>
        <div className="text-sm text-st-text-secondary leading-relaxed space-y-3">
          <p>Today was a highly productive day with a strong focus on system design and backend development. You logged <strong className="text-st-text-primary">6.5 hours of study time</strong> and <strong className="text-st-text-primary">4.2 hours of coding practice</strong>, significantly exceeding your daily targets.</p>
          <p><strong className="text-st-accent">Achievements:</strong> Completed 8 tasks including the Kafka partitioning review, finished 2 video lectures on distributed consensus, and maintained your 14-day learning streak. Your productivity score of 92% is among your highest this month.</p>
          <p><strong className="text-st-warning">Areas for Improvement:</strong> Break time was below recommended levels (0.8h vs 1.5h target). Consider scheduling more frequent short breaks to maintain sustained focus. Your reading time was lower than average — try to allocate more time to documentation.</p>
          <p><strong className="text-emerald-400">Recommendations:</strong> Based on your learning patterns, tomorrow would be ideal for a deep dive into Consistency Models before your Friday mock interview. Consider revising the Raft consensus notes from today&apos;s video lecture.</p>
        </div>
      </Card>

      {/* Strongest & Weakest Topics */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-bold text-st-text-primary mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-st-success" />Strongest Topics</h3>
          <div className="space-y-3">
            {["Docker & Containerization", "System Design Fundamentals", "JavaScript/TypeScript", "SQL & Database Design"].map((topic, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-st-text-primary">{topic}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-st-bg-elevated rounded-full overflow-hidden">
                    <div className="h-full bg-st-success rounded-full" style={{ width: `${95 - i * 8}%` }} />
                  </div>
                  <span className="text-xs text-st-text-muted w-8">{95 - i * 8}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
        <Card className="p-6">
          <h3 className="text-lg font-bold text-st-text-primary mb-4 flex items-center gap-2"><TrendingUp className="w-5 h-5 text-st-danger rotate-180" />Topics Needing Work</h3>
          <div className="space-y-3">
            {["Consistency Models", "Advanced Graph Algorithms", "Machine Learning Basics", "Cloud Architecture (AWS)"].map((topic, i) => (
              <div key={i} className="flex items-center justify-between">
                <span className="text-sm text-st-text-primary">{topic}</span>
                <div className="flex items-center gap-2">
                  <div className="w-24 h-2 bg-st-bg-elevated rounded-full overflow-hidden">
                    <div className="h-full bg-st-danger rounded-full" style={{ width: `${45 - i * 7}%` }} />
                  </div>
                  <span className="text-xs text-st-text-muted w-8">{45 - i * 7}%</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
