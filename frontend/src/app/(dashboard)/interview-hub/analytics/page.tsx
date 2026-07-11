"use client";

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { StatsCard } from "@/components/interview-hub/StatsCard";
import { TopicChip } from "@/components/interview-hub/TopicChip";
import { CardSkeleton, StatsSkeleton } from "@/components/interview-hub/LoadingSkeleton";
import api from "@/lib/api";
import {
  BookOpen, HelpCircle, Code2, Users,
  Flame,
} from "lucide-react";
import {
  LineChart, Line, PieChart as RePieChart, Pie, Cell,
  RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart,
} from "recharts";

interface Analytics {
  questionsSolved: number;
  mcqsCompleted: number;
  codingProblems: number;
  interviewSessions: number;
  weakTopics: { subject: string; score: number }[];
  strongTopics: { subject: string; score: number }[];
  dailyProgress: { name: string; questions: number; mcq: number; coding: number }[];
  weeklyProgress: { name: string; questions: number; mcq: number; coding: number }[];
  streak: number;
}

interface Progress {
  correct: number;
  incorrect: number;
  skipped: number;
  topicBreakdown: { topic: string; questions: number; accuracy: number }[];
  streakData: { day: number; active: boolean; count: number }[];
}

const timeRanges = ["Daily", "Weekly", "Monthly"];

const chartTooltipStyle = {
  contentStyle: {
    background: "#181818",
    border: "1px solid #1E1E1E",
    borderRadius: "8px",
    fontSize: "12px",
    color: "#EDEDED",
  },
};

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState("Weekly");
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [progress, setProgress] = useState<Progress | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [analyticsData, progressData] = await Promise.all([
          api.get<Analytics>("/interview/analytics"),
          api.get<Progress>("/interview/progress"),
        ]);
        setAnalytics(analyticsData);
        setProgress(progressData);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-8">
        <StatsSkeleton />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {[1,2,3,4].map(i => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  const lineData = analytics?.dailyProgress || [];
  const pieData = progress
    ? [
        { name: "Correct", value: progress.correct, color: "#22C55E" },
        { name: "Incorrect", value: progress.incorrect, color: "#EF4444" },
        { name: "Skipped", value: progress.skipped, color: "#555555" },
      ]
    : [];
  const radarData = analytics?.weakTopics && analytics?.strongTopics
    ? [...analytics.weakTopics, ...analytics.strongTopics].slice(0, 8)
    : [];
  const topicBreakdown = progress?.topicBreakdown || [];
  const streakData = progress?.streakData || Array.from({ length: 30 }).map((_, i) => ({
    day: i + 1,
    active: false,
    count: 0,
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-st-text-primary tracking-tight">Learning Analytics</h1>
        <p className="text-sm text-st-text-secondary">Track your interview preparation progress</p>
      </motion.div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <StatsCard icon={HelpCircle} label="Total Questions" value={analytics?.questionsSolved || 0} color="text-st-accent" bg="bg-st-accent/10" />
        <StatsCard icon={BookOpen} label="MCQs Completed" value={analytics?.mcqsCompleted || 0} color="text-emerald-400" bg="bg-emerald-500/10" />
        <StatsCard icon={Code2} label="Coding Problems" value={analytics?.codingProblems || 0} color="text-blue-400" bg="bg-blue-500/10" />
        <StatsCard icon={Users} label="Interview Sessions" value={analytics?.interviewSessions || 0} color="text-purple-400" bg="bg-purple-500/10" />
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center gap-2">
        {timeRanges.map(range => (
          <TopicChip key={range} label={range} selected={timeRange === range} onClick={() => setTimeRange(range)} />
        ))}
        <div className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-st-accent/10 border border-st-accent/20">
          <Flame className="w-4 h-4 text-st-accent" />
          <span className="text-sm font-semibold text-st-text-primary">{analytics?.streak || 0} Day Streak</span>
        </div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Questions Over Time */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-st-text-primary mb-4">Questions Solved Over Time</h3>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={lineData}>
              <defs>
                <linearGradient id="colorQ" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#FFCF70" stopOpacity={0.2} />
                  <stop offset="95%" stopColor="#FFCF70" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid stroke="#1E1E1E" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#555555" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis stroke="#555555" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip {...chartTooltipStyle} />
              <Area type="monotone" dataKey="questions" stroke="#FFCF70" fill="url(#colorQ)" strokeWidth={2} />
              <Area type="monotone" dataKey="mcq" stroke="#22C55E" fill="none" strokeWidth={2} strokeDasharray="4 4" />
              <Area type="monotone" dataKey="coding" stroke="#3B82F6" fill="none" strokeWidth={2} strokeDasharray="4 4" />
            </AreaChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-2">
            {[{ label: "Questions", color: "#FFCF70" }, { label: "MCQs", color: "#22C55E" }, { label: "Coding", color: "#3B82F6" }].map(item => (
              <span key={item.label} className="flex items-center gap-1.5 text-[10px] text-st-text-muted">
                <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                {item.label}
              </span>
            ))}
          </div>
        </Card>

        {/* MCQ Performance Pie */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-st-text-primary mb-4">MCQ Performance</h3>
          <div className="flex items-center justify-center">
            <ResponsiveContainer width="100%" height={250}>
              <RePieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip {...chartTooltipStyle} />
              </RePieChart>
            </ResponsiveContainer>
          </div>
          <div className="flex justify-center gap-4">
            {pieData.map(item => (
              <span key={item.name} className="flex items-center gap-1.5 text-[10px] text-st-text-muted">
                <span className="w-2 h-2 rounded-full" style={{ background: item.color }} />
                {item.name}: {item.value}
              </span>
            ))}
          </div>
        </Card>

        {/* Strong vs Weak Topics */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-st-text-primary mb-4">Strong vs Weak Topics</h3>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="#1E1E1E" />
              <PolarAngleAxis dataKey="subject" stroke="#555555" fontSize={10} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} stroke="#1E1E1E" fontSize={9} />
              <Radar name="Score" dataKey="score" stroke="#FFCF70" fill="#FFCF70" fillOpacity={0.2} strokeWidth={2} />
              <Tooltip {...chartTooltipStyle} />
            </RadarChart>
          </ResponsiveContainer>
        </Card>

        {/* Average Score Trend */}
        <Card className="p-4">
          <h3 className="text-sm font-semibold text-st-text-primary mb-4">Average Score Trend</h3>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineData}>
              <CartesianGrid stroke="#1E1E1E" strokeDasharray="3 3" />
              <XAxis dataKey="name" stroke="#555555" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis domain={[0, 100]} stroke="#555555" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip {...chartTooltipStyle} />
              <Line type="monotone" dataKey="questions" name="Score" stroke="#FFCF70" strokeWidth={2} dot={{ fill: "#FFCF70", r: 3 }} />
            </LineChart>
          </ResponsiveContainer>
        </Card>
      </div>

      {/* Topics Breakdown */}
      {topicBreakdown.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-st-text-primary">Topics Breakdown</h3>
          <Card className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {topicBreakdown.map(topic => (
                <div key={topic.topic}>
                  <div className="flex justify-between items-center mb-1.5">
                    <span className="text-xs text-st-text-secondary">{topic.topic}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-st-text-muted">{topic.questions} questions</span>
                      <span className="text-xs font-medium" style={{ color: topic.accuracy >= 80 ? "#22C55E" : topic.accuracy >= 65 ? "#F59E0B" : "#EF4444" }}>
                        {topic.accuracy}%
                      </span>
                    </div>
                  </div>
                  <div className="w-full h-1.5 bg-st-bg-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${topic.accuracy}%`,
                        background: `linear-gradient(90deg, ${topic.accuracy >= 80 ? "#22C55E" : topic.accuracy >= 65 ? "#F59E0B" : "#EF4444"}, ${topic.accuracy >= 80 ? "#16A34A" : topic.accuracy >= 65 ? "#D97706" : "#DC2626"})`,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {/* Learning Streak Calendar */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-st-text-primary">This Month&apos;s Activity</h3>
        <Card className="p-4">
          <div className="grid grid-cols-10 gap-1.5">
            {streakData.map((day, i) => (
              <div
                key={i}
                className={`aspect-square rounded-lg flex items-center justify-center text-[9px] font-medium transition-all ${
                  day.active
                    ? "bg-st-accent/20 text-st-accent border border-st-accent/30"
                    : "bg-st-bg-elevated text-st-text-muted border border-st-border"
                }`}
                title={`Day ${day.day}: ${day.count} activities`}
              >
                {day.count || ""}
              </div>
            ))}
          </div>
          <div className="flex items-center justify-center gap-4 mt-3 text-[10px] text-st-text-muted">
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-st-accent/20 border border-st-accent/30" />
              Active day
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-st-bg-elevated border border-st-border" />
              Inactive
            </span>
          </div>
        </Card>
      </div>
    </div>
  );
}
