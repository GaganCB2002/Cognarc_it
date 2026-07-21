"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area, PieChart, Pie, Cell,
} from "recharts";
import { motion } from "framer-motion";
import {
  Activity, Clock, Target, Zap, TrendingUp, TrendingDown, Minus,
  BarChart3, LineChart as LineChartIcon, PieChart as PieChartIcon,
  ArrowUpRight, ArrowDownRight, Calendar, Download, MoreHorizontal,
} from "lucide-react";
import api from "@/lib/api";

const defaultKPIs = [
  { title: "Total Focus Time", value: 28.5, unit: "hrs", icon: Clock, change: 12.5, gradient: "from-amber-500/20 to-amber-500/5", accent: "text-amber-400", chart: [4, 6, 5, 7, 8, 6, 5] },
  { title: "Productivity Score", value: 92, unit: "/100", icon: Zap, change: 5.2, gradient: "from-violet-500/20 to-violet-500/5", accent: "text-violet-400", chart: [80, 85, 82, 90, 92, 88, 95] },
  { title: "Tasks Completed", value: 45, unit: "", icon: Target, change: -2.1, gradient: "from-emerald-500/20 to-emerald-500/5", accent: "text-emerald-400", chart: [8, 6, 10, 7, 9, 3, 2] },
  { title: "Learning Streak", value: 14, unit: "days", icon: Activity, change: 0, gradient: "from-cyan-500/20 to-cyan-500/5", accent: "text-cyan-400", chart: [7, 8, 9, 10, 11, 12, 14] },
];

const defaultProductivityData = [
  { name: "Mon", coding: 4, reading: 2, ai: 1, total: 7 },
  { name: "Tue", coding: 3, reading: 1, ai: 2, total: 6 },
  { name: "Wed", coding: 5, reading: 3, ai: 1.5, total: 9.5 },
  { name: "Thu", coding: 6, reading: 2, ai: 3, total: 11 },
  { name: "Fri", coding: 4, reading: 4, ai: 2, total: 10 },
  { name: "Sat", coding: 2, reading: 1, ai: 0.5, total: 3.5 },
  { name: "Sun", coding: 1, reading: 1, ai: 0, total: 2 },
];

const defaultActivityDistribution = [
  { name: "Coding", value: 45, color: "#8B5CF6" },
  { name: "Reading", value: 25, color: "#10B981" },
  { name: "AI Study", value: 15, color: "#F59E0B" },
  { name: "Review", value: 10, color: "#06B6D4" },
  { name: "Planning", value: 5, color: "#EF4444" },
  { name: "Other", value: 0, color: "#666666" },
];

function AnimatedNumber({ value, suffix = "", duration = 1500 }: { value: number; suffix?: string; duration?: number }) {
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    let startTime: number | null = null;
    let animationFrame: number;

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = Math.min((timestamp - startTime) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(eased * value));

      if (progress < 1) {
        animationFrame = requestAnimationFrame(animate);
      }
    };

    animationFrame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(animationFrame);
  }, [value, duration]);

  return <span ref={ref}>{display}{suffix}</span>;
}

function SparklineChart({ data, color }: { data: number[]; color: string }) {
  const width = 80;
  const height = 32;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const points = data.map((v, i) => `${(i / (data.length - 1)) * width},${height - ((v - min) / range) * (height - 4) - 2}`).join(" ");
  const gradientId = `sparkline-${data.join("")}`;

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} className="shrink-0">
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.2} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polyline
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        points={points}
      />
      <polygon
        points={`0,${height} ${points} ${width},${height}`}
        fill={`url(#${gradientId})`}
      />
    </svg>
  );
}

function KpiCard({ kpi, index, isLoading }: { kpi: typeof defaultKPIs[0]; index: number; isLoading: boolean }) {
  if (isLoading) {
    return (
      <div className="glass-light rounded-2xl p-6">
        <div className="skeleton-shimmer rounded-lg h-5 w-24 mb-4" />
        <div className="skeleton-shimmer rounded-lg h-10 w-32 mb-3" />
        <div className="skeleton-shimmer rounded-lg h-4 w-20" />
      </div>
    );
  }

  const TrendIcon = kpi.change > 0 ? TrendingUp : kpi.change < 0 ? TrendingDown : Minus;
  const trendColor = kpi.change > 0 ? "text-emerald-400" : kpi.change < 0 ? "text-red-400" : "text-st-text-muted";
  const ArrowIcon = kpi.change > 0 ? ArrowUpRight : kpi.change < 0 ? ArrowDownRight : Minus;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.4, ease: "easeOut" }}
      className="group relative overflow-hidden rounded-2xl border border-st-border/50 bg-st-bg-card/80 backdrop-blur-sm p-6 card-hover"
    >
      <div className={`absolute inset-0 bg-gradient-to-br ${kpi.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-white/[0.02] to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-gradient-to-br ${kpi.gradient} border border-white/5`}>
              <kpi.icon className={`w-5 h-5 ${kpi.accent}`} />
            </div>
            <span className="text-sm font-medium text-st-text-secondary">{kpi.title}</span>
          </div>
          <div className={`flex items-center gap-1 text-xs font-semibold ${trendColor}`}>
            <ArrowIcon className="w-3.5 h-3.5" />
            <span>{Math.abs(kpi.change)}%</span>
          </div>
        </div>

        <div className="flex items-end justify-between">
          <div>
            <div className="text-3xl font-bold text-st-text-primary tracking-tight">
              <AnimatedNumber value={kpi.value} />{kpi.unit}
            </div>
            <div className="flex items-center gap-1.5 mt-1.5">
              <TrendIcon className={`w-3.5 h-3.5 ${trendColor}`} />
              <span className={`text-xs font-medium ${trendColor}`}>
                {kpi.change > 0 ? "+" : ""}{kpi.change}% vs last week
              </span>
            </div>
          </div>
          <SparklineChart data={kpi.chart} color={
            kpi.change > 0 ? "#10B981" : kpi.change < 0 ? "#EF4444" : "#666666"
          } />
        </div>
      </div>
    </motion.div>
  );
}

interface TooltipPayloadEntry {
  color: string;
  name: string;
  value: number;
  payload: { color: string };
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: TooltipPayloadEntry[]; label?: string }) {
  if (!active || !payload) return null;
  return (
    <div className="glass rounded-xl px-4 py-3 shadow-xl border border-st-border/50 min-w-[140px]">
      <p className="text-xs font-semibold text-st-text-muted mb-2">{label}</p>
      {payload.map((entry: TooltipPayloadEntry, i: number) => (
        <div key={i} className="flex items-center justify-between gap-4 py-0.5">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
            <span className="text-xs text-st-text-secondary">{entry.name}</span>
          </div>
          <span className="text-xs font-semibold text-st-text-primary">{entry.value}{entry.name === "Score" || entry.name === "Focus" ? "%" : "h"}</span>
        </div>
      ))}
    </div>
  );
}

function CustomPieTooltip({ active, payload }: { active?: boolean; payload?: TooltipPayloadEntry[] }) {
  if (!active || !payload) return null;
  const data = payload[0];
  return (
    <div className="glass rounded-xl px-4 py-3 shadow-xl border border-st-border/50">
      <div className="flex items-center gap-2 mb-1">
        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: data.payload.color }} />
        <span className="text-xs font-semibold text-st-text-secondary">{data.name}</span>
      </div>
      <p className="text-sm font-bold text-st-text-primary">{data.value}%</p>
    </div>
  );
}

export default function AnalyticsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPeriod, setSelectedPeriod] = useState("Last 7 Days");
  const [kpis, setKpis] = useState(defaultKPIs);
  const [productivityData, setProductivityData] = useState(defaultProductivityData);
  const [focusScoreData, setFocusScoreData] = useState([
    { time: "09:00", score: 85, previous: 78 },
    { time: "10:00", score: 92, previous: 82 },
    { time: "11:00", score: 78, previous: 80 },
    { time: "12:00", score: 95, previous: 85 },
    { time: "13:00", score: 88, previous: 75 },
    { time: "14:00", score: 82, previous: 79 },
    { time: "15:00", score: 90, previous: 83 },
    { time: "16:00", score: 76, previous: 72 },
    { time: "17:00", score: 85, previous: 70 },
  ]);
  const [weeklyAnalytics, setWeeklyAnalytics] = useState([
    { day: "Mon", focus: 88, tasks: 8, code: 4.2, learning: 2.1 },
    { day: "Tue", focus: 92, tasks: 6, code: 3.8, learning: 1.5 },
    { day: "Wed", focus: 78, tasks: 10, code: 5.1, learning: 3.2 },
    { day: "Thu", focus: 95, tasks: 7, code: 6.2, learning: 2.8 },
    { day: "Fri", focus: 85, tasks: 9, code: 4.5, learning: 4.0 },
    { day: "Sat", focus: 70, tasks: 3, code: 2.0, learning: 1.0 },
    { day: "Sun", focus: 65, tasks: 2, code: 1.0, learning: 0.5 },
  ]);
  const [activityDistribution, setActivityDistribution] = useState(defaultActivityDistribution);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
      try {
        const [dashboardRes, trendsRes, categoriesRes] = await Promise.allSettled([
          api.get<{ deepHours?: string; focusScore?: number; sessionsCompleted?: number }>('/analytics/dashboard'),
          api.get<{ date: string; durationMinutes: number; sessions: number }[]>('/analytics/weekly-trends'),
          api.get<{ category: string; duration: number }[]>('/analytics/category-breakdown'),
        ]);

        if (cancelled) return;

        if (dashboardRes.status === 'fulfilled' && dashboardRes.value) {
          const d = dashboardRes.value;
          setKpis(prev => {
            const newKpis = [...prev];
            if (d.deepHours !== undefined) newKpis[0] = { ...newKpis[0], value: parseFloat(d.deepHours) };
            if (d.focusScore !== undefined) newKpis[1] = { ...newKpis[1], value: Math.round(d.focusScore) };
            if (d.sessionsCompleted !== undefined) newKpis[2] = { ...newKpis[2], value: d.sessionsCompleted };
            return newKpis;
          });
        }

        if (trendsRes.status === 'fulfilled' && Array.isArray(trendsRes.value) && trendsRes.value.length > 0) {
          const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          const dayMap: Record<string, { durationMinutes: number; sessions: number }> = {};
          for (const item of trendsRes.value) {
            const date = new Date(item.date);
            const dayName = days[date.getDay()];
            dayMap[dayName] = { durationMinutes: item.durationMinutes, sessions: item.sessions };
          }
          const newWeekly = days.slice(1).concat(days[0]).filter(d => d !== 'Sun').concat(['Sun']).map(day => ({
            day,
            focus: dayMap[day] ? Math.min(100, Math.round((dayMap[day].durationMinutes / 480) * 100)) : 0,
            tasks: dayMap[day]?.sessions || 0,
            code: dayMap[day] ? +(dayMap[day].durationMinutes / 120).toFixed(1) : 0,
            learning: dayMap[day] ? +(dayMap[day].durationMinutes / 180).toFixed(1) : 0,
          }));
          setWeeklyAnalytics(newWeekly);

          const chartData = days.filter(d => d !== 'Sun').concat(['Sun']).map(day => {
            const d = dayMap[day];
            if (!d) return { name: day, coding: 0, reading: 0, ai: 0, total: 0 };
            const coding = +(d.durationMinutes / 120).toFixed(1);
            const reading = +(d.durationMinutes / 180).toFixed(1);
            const ai = +(d.durationMinutes / 240).toFixed(1);
            return { name: day, coding, reading, ai, total: +(coding + reading + ai).toFixed(1) };
          });
          setProductivityData(chartData);

          const scoreData = days.filter(d => d !== 'Sun').map((day, i) => ({
            time: `${8 + i}:00`,
            score: dayMap[day] ? Math.min(100, Math.round((dayMap[day].durationMinutes / 480) * 100)) : 70 + Math.round(Math.random() * 15),
            previous: 70 + Math.round(Math.random() * 15),
          }));
          setFocusScoreData(scoreData);
        }

        if (categoriesRes.status === 'fulfilled' && Array.isArray(categoriesRes.value) && categoriesRes.value.length > 0) {
          const colors = ["#8B5CF6", "#10B981", "#F59E0B", "#06B6D4", "#EF4444", "#EC4899", "#6366F1"];
          const totalDur = categoriesRes.value.reduce((s: number, c: { category: string; duration: number }) => s + c.duration, 0) || 1;
          const dist = categoriesRes.value.map((c: { category: string; duration: number }, i: number) => ({
            name: c.category.charAt(0).toUpperCase() + c.category.slice(1),
            value: Math.round((c.duration / totalDur) * 100),
            color: colors[i % colors.length],
          }));
          setActivityDistribution(dist);
        }
      } catch (e) {
        console.warn('[Analytics] Failed to fetch data, using defaults:', e);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };
    fetchData();
    return () => { cancelled = true; };
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: "easeOut" as const } },
  };

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      className="p-6 lg:p-8 h-full flex flex-col gap-6"
    >
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <motion.span
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.3 }}
            className="text-[10px] font-bold tracking-widest text-st-accent uppercase"
          >
            Data & Insights
          </motion.span>
          <h1 className="text-2xl lg:text-3xl font-bold text-st-text-primary mt-1">Trends & Analytics</h1>
          <p className="text-sm text-st-text-secondary mt-1">Deep dive into your productivity metrics and learning patterns.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-st-bg-card/80 border border-st-border/50 text-sm">
            <Calendar className="w-4 h-4 text-st-text-muted" />
            <select
              value={selectedPeriod}
              onChange={(e) => setSelectedPeriod(e.target.value)}
              className="bg-transparent border-none text-st-text-primary text-sm font-medium focus:outline-none cursor-pointer"
            >
              <option>Last 7 Days</option>
              <option>Last 30 Days</option>
              <option>This Year</option>
            </select>
          </div>
          <button className="p-2 rounded-xl bg-st-bg-card/80 border border-st-border/50 text-st-text-secondary hover:text-st-text-primary hover:border-st-accent/30 transition-all" aria-label="Download report">
            <Download className="w-4 h-4" />
          </button>
          <button className="p-2 rounded-xl bg-st-bg-card/80 border border-st-border/50 text-st-text-secondary hover:text-st-text-primary hover:border-st-accent/30 transition-all" aria-label="More options">
            <MoreHorizontal className="w-4 h-4" />
          </button>
        </div>
      </motion.div>

      <motion.div variants={itemVariants} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-5">
        {kpis.map((kpi, i) => (
          <KpiCard key={kpi.title} kpi={kpi} index={i} isLoading={isLoading} />
        ))}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-st-border/50 bg-st-bg-card/80 backdrop-blur-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500/20 to-violet-500/5 flex items-center justify-center">
                <BarChart3 className="w-4.5 h-4.5 text-violet-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-st-text-primary">Activity Distribution</h3>
                <p className="text-xs text-st-text-muted">Hours spent per activity</p>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productivityData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1A" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 12 }} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: "12px", color: "#999" }}
                />
                <Bar
                  dataKey="coding"
                  name="Coding"
                  stackId="a"
                  fill="#8B5CF6"
                  radius={[0, 0, 4, 4]}
                  animationDuration={1200}
                />
                <Bar
                  dataKey="reading"
                  name="Documentation"
                  stackId="a"
                  fill="#10B981"
                  animationDuration={1200}
                  animationBegin={200}
                />
                <Bar
                  dataKey="ai"
                  name="AI Assistant"
                  stackId="a"
                  fill="#F59E0B"
                  radius={[4, 4, 0, 0]}
                  animationDuration={1200}
                  animationBegin={400}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-st-border/50 bg-st-bg-card/80 backdrop-blur-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center">
                <LineChartIcon className="w-4.5 h-4.5 text-emerald-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-st-text-primary">Productivity Trend</h3>
                <p className="text-xs text-st-text-muted">Focus score over time</p>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={focusScoreData} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="scoreGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10B981" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="previousGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#06B6D4" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1A" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 12 }} domain={[0, 100]} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: "12px", color: "#999" }}
                />
                <Area
                  type="monotone"
                  dataKey="previous"
                  name="Last Week"
                  stroke="#06B6D4"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fillOpacity={1}
                  fill="url(#previousGradient)"
                  animationDuration={1200}
                  animationBegin={200}
                />
                <Area
                  type="monotone"
                  dataKey="score"
                  name="This Week"
                  stroke="#10B981"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#scoreGradient)"
                  animationDuration={1200}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <motion.div
          variants={itemVariants}
          className="lg:col-span-2 rounded-2xl border border-st-border/50 bg-st-bg-card/80 backdrop-blur-sm p-6"
        >
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center">
                <BarChart3 className="w-4.5 h-4.5 text-amber-400" />
              </div>
              <div>
                <h3 className="text-base font-semibold text-st-text-primary">Weekly Analytics</h3>
                <p className="text-xs text-st-text-muted">Daily performance breakdown</p>
              </div>
            </div>
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={weeklyAnalytics} margin={{ top: 5, right: 5, left: -15, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#1A1A1A" />
                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 12 }} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: "#666", fontSize: 12 }} />
                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: "12px", color: "#999" }}
                />
                <Line
                  type="monotone"
                  dataKey="focus"
                  name="Focus Score"
                  stroke="#8B5CF6"
                  strokeWidth={2.5}
                  dot={{ fill: "#8B5CF6", r: 4, strokeWidth: 0 }}
                  activeDot={{ fill: "#8B5CF6", r: 6, strokeWidth: 2, stroke: "#1A1A1A" }}
                  animationDuration={1200}
                />
                <Line
                  type="monotone"
                  dataKey="tasks"
                  name="Tasks Done"
                  stroke="#10B981"
                  strokeWidth={2.5}
                  dot={{ fill: "#10B981", r: 4, strokeWidth: 0 }}
                  activeDot={{ fill: "#10B981", r: 6, strokeWidth: 2, stroke: "#1A1A1A" }}
                  animationDuration={1200}
                  animationBegin={200}
                />
                <Line
                  type="monotone"
                  dataKey="code"
                  name="Coding (hrs)"
                  stroke="#F59E0B"
                  strokeWidth={2.5}
                  dot={{ fill: "#F59E0B", r: 4, strokeWidth: 0 }}
                  activeDot={{ fill: "#F59E0B", r: 6, strokeWidth: 2, stroke: "#1A1A1A" }}
                  animationDuration={1200}
                  animationBegin={400}
                />
                <Line
                  type="monotone"
                  dataKey="learning"
                  name="Learning (hrs)"
                  stroke="#06B6D4"
                  strokeWidth={2.5}
                  dot={{ fill: "#06B6D4", r: 4, strokeWidth: 0 }}
                  activeDot={{ fill: "#06B6D4", r: 6, strokeWidth: 2, stroke: "#1A1A1A" }}
                  animationDuration={1200}
                  animationBegin={600}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div
          variants={itemVariants}
          className="rounded-2xl border border-st-border/50 bg-st-bg-card/80 backdrop-blur-sm p-6"
        >
          <div className="flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500/20 to-cyan-500/5 flex items-center justify-center">
              <PieChartIcon className="w-4.5 h-4.5 text-cyan-400" />
            </div>
            <div>
              <h3 className="text-base font-semibold text-st-text-primary">Distribution</h3>
              <p className="text-xs text-st-text-muted">Activity breakdown</p>
            </div>
          </div>
          <div className="h-[300px] w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <RechartsTooltip content={<CustomPieTooltip />} />
                <Pie
                  data={activityDistribution}
                  cx="50%"
                  cy="50%"
                  innerRadius={65}
                  outerRadius={100}
                  paddingAngle={3}
                  dataKey="value"
                  animationDuration={1200}
                  animationBegin={200}
                >
                  {activityDistribution.map((entry, i) => (
                    <Cell key={i} fill={entry.color} stroke="transparent" />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {activityDistribution.map((item) => (
              <div key={item.name} className="flex items-center gap-2 px-2 py-1.5 rounded-lg hover:bg-st-bg-elevated transition-colors">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                <span className="text-xs text-st-text-secondary truncate">{item.name}</span>
                <span className="text-xs font-semibold text-st-text-primary ml-auto">{item.value}%</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      <div className="flex items-center justify-center gap-8 py-4 text-xs text-st-text-muted border-t border-st-border/50">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-400" />
          <span>High Focus</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-amber-400" />
          <span>Medium Focus</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-400" />
          <span>Low Focus</span>
        </div>
      </div>
    </motion.div>
  );
}
