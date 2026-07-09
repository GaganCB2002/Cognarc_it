"use client";

import React, { useState, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { BarChart3, Download, Calendar, FileText, Clock, Target, Code, BookOpen, Brain, Zap, TrendingUp, Coffee, Loader2 } from "lucide-react";

export default function ReportsPage() {
  const [selectedPeriod, setSelectedPeriod] = useState("DAILY");
  const [sessions, setSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadSessions() {
      try {
        const res = await api.get('/tracking/sessions') as any;
        if (res && res.sessions) {
          setSessions(res.sessions.filter((s: any) => s.status === 'COMPLETED'));
        }
      } catch (err) {
        console.error("Failed to load reports", err);
      } finally {
        setLoading(false);
      }
    }
    loadSessions();
  }, []);

  const periods = [
    { key: "DAILY", label: "Today" },
    { key: "WEEKLY", label: "This Week" },
    { key: "MONTHLY", label: "This Month" },
    { key: "QUARTERLY", label: "Quarterly" },
    { key: "YEARLY", label: "This Year" },
  ];

  const reportData = {
    tasksCompleted: 8, tasksPending: 5, productivityScore: 92, focusScore: 87,
    breakDuration: 0.8, learningStreak: 14, projectsWorked: 3, pdfsStudied: 1
  };

  const metrics = [
    { icon: Clock, label: "Study Hours", value: `6.5h`, color: "text-emerald-400" },
    { icon: Code, label: "Coding Hours", value: `4.2h`, color: "text-purple-400" },
    { icon: BookOpen, label: "Reading Hours", value: `1.8h`, color: "text-blue-400" },
    { icon: Brain, label: "AI Usage", value: `45 msgs`, color: "text-st-accent" },
    { icon: Target, label: "Tasks Done", value: `${reportData.tasksCompleted}`, color: "text-emerald-400" },
    { icon: Target, label: "Tasks Pending", value: `${reportData.tasksPending}`, color: "text-st-warning" },
    { icon: Zap, label: "Productivity", value: `${reportData.productivityScore}%`, color: "text-st-accent" },
    { icon: TrendingUp, label: "Focus Score", value: `${reportData.focusScore}/100`, color: "text-blue-400" },
    { icon: Coffee, label: "Break Time", value: `${reportData.breakDuration}h`, color: "text-st-text-muted" },
    { icon: FileText, label: "PDFs Studied", value: `${reportData.pdfsStudied}`, color: "text-red-400" },
    { icon: Calendar, label: "Streak", value: `${reportData.learningStreak} days`, color: "text-orange-400" },
    { icon: BarChart3, label: "Projects", value: `${reportData.projectsWorked}`, color: "text-cyan-400" },
  ];

  const [generatingPdf, setGeneratingPdf] = useState(false);

  const handleGeneratePeriodicPdf = async () => {
    try {
      setGeneratingPdf(true);
      // Calculate date ranges based on selectedPeriod
      const to = new Date();
      const from = new Date();
      
      switch (selectedPeriod) {
        case 'DAILY':
          from.setHours(0, 0, 0, 0);
          break;
        case 'WEEKLY':
          from.setDate(from.getDate() - 7);
          break;
        case 'MONTHLY':
          from.setMonth(from.getMonth() - 1);
          break;
        case 'QUARTERLY':
          from.setMonth(from.getMonth() - 3);
          break;
        case 'YEARLY':
          from.setFullYear(from.getFullYear() - 1);
          break;
      }

      // 1. Ask backend to generate periodic report and aggregate telemetry
      const res = await api.post('/reports/periodic', {
        type: selectedPeriod,
        from: from.toISOString(),
        to: to.toISOString()
      }) as any;

      if (res && res.data && res.data.id) {
        // 2. Download the resulting PDF
        const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/reports/${res.data.id}/pdf`;
        window.open(downloadUrl, '_blank');
      }
    } catch (err) {
      console.error("Failed to generate periodic PDF", err);
      toast.error("Failed to generate report. Please try again.");
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDownload = (sessId: string) => {
    const downloadUrl = `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'}/tracking/sessions/${sessId}/pdf`;
    window.open(downloadUrl, '_blank');
  };

  return (
    <div className="h-full flex flex-col gap-6 pb-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-st-accent uppercase mb-1">AI-Powered Reports</p>
          <h1 className="text-3xl font-bold text-st-text-primary">Overall Report</h1>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" size="sm" onClick={handleGeneratePeriodicPdf} disabled={generatingPdf}>
            {generatingPdf ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : <Download className="w-4 h-4 mr-1" />}
            {generatingPdf ? "Generating..." : "Export PDF"}
          </Button>
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

      {/* Completed Sessions List */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-st-text-primary mb-4 flex items-center gap-2">
          <FileText className="w-5 h-5 text-st-accent" />
          Completed Deep Work Sessions & PDF Reports
        </h3>
        
        {loading ? (
          <div className="flex justify-center p-8">
            <Loader2 className="w-6 h-6 animate-spin text-st-accent" />
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-sm text-st-text-muted text-center py-6">No completed sessions found. Start deep work to generate report PDF.</p>
        ) : (
          <div className="space-y-3">
            {sessions.map((sess) => (
              <div key={sess.id} className="flex items-center justify-between p-3 rounded-lg bg-st-bg-elevated border border-st-border hover:border-st-accent/45 transition-all">
                <div>
                  <h4 className="font-semibold text-sm text-st-text-primary">{sess.projectName || 'General Deep Work Session'}</h4>
                  <p className="text-xs text-st-text-muted mt-0.5">
                    Logged on {new Date(sess.startTime).toLocaleDateString()} at {new Date(sess.startTime).toLocaleTimeString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="text-xs font-mono">
                    {Math.round((new Date(sess.endTime).getTime() - new Date(sess.startTime).getTime() - sess.totalPauseMs) / 60000)} mins
                  </Badge>
                  <Button size="sm" variant="outline" onClick={() => handleDownload(sess.id)}>
                    <Download className="w-3.5 h-3.5 mr-1.5" /> PDF
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* AI Narrative Summary */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Brain className="w-5 h-5 text-st-accent" />
          <h3 className="text-lg font-bold text-st-text-primary">AI Narrative Summary</h3>
        </div>
        <div className="text-sm text-st-text-secondary leading-relaxed space-y-3">
          <p>Today was a highly productive day with a strong focus on system design and backend development. You logged <strong className="text-st-text-primary">6.5 hours of study time</strong> and <strong className="text-st-text-primary">4.2 hours of coding practice</strong>, significantly exceeding your daily targets.</p>
          <p><strong className="text-st-accent">Achievements:</strong> Completed 8 tasks including the Kafka partitioning review, finished 2 video lectures on distributed consensus, and maintained your 14-day learning streak. Your productivity score of 92% is among your highest this month.</p>
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
