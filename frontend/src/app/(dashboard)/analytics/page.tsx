"use client";

import React from "react";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer,
  LineChart, Line, AreaChart, Area
} from "recharts";
import { Activity, Clock, Target, Zap } from "lucide-react";

const productivityData = [
  { name: "Mon", coding: 4, reading: 2, ai: 1 },
  { name: "Tue", coding: 3, reading: 1, ai: 2 },
  { name: "Wed", coding: 5, reading: 3, ai: 1.5 },
  { name: "Thu", coding: 6, reading: 2, ai: 3 },
  { name: "Fri", coding: 4, reading: 4, ai: 2 },
  { name: "Sat", coding: 2, reading: 1, ai: 0.5 },
  { name: "Sun", coding: 1, reading: 1, ai: 0 },
];

const focusScoreData = [
  { time: "09:00", score: 85 },
  { time: "11:00", score: 92 },
  { time: "13:00", score: 78 },
  { time: "15:00", score: 95 },
  { time: "17:00", score: 88 },
];

export default function AnalyticsPage() {
  return (
    <div className="p-8 h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-st-text-primary">Trends & Analytics</h1>
          <p className="text-st-text-secondary mt-1">Deep dive into your productivity metrics and learning patterns.</p>
        </div>
        <select className="bg-white border border-st-border rounded-lg px-4 py-2 text-sm font-medium">
          <option>Last 7 Days</option>
          <option>Last 30 Days</option>
          <option>This Year</option>
        </select>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {[
          { title: "Total Focus Time", value: "28.5 hrs", icon: Clock, change: "+12%" },
          { title: "Avg Productivity Score", value: "92/100", icon: Zap, change: "+5%" },
          { title: "Tasks Completed", value: "45", icon: Target, change: "-2%" },
          { title: "Learning Streak", value: "14 Days", icon: Activity, change: "🔥" },
        ].map((kpi, i) => (
          <div key={i} className="bg-white rounded-xl shadow-sm border border-st-border p-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-st-text-secondary">{kpi.title}</p>
              <h3 className="text-2xl font-bold text-gray-900 mt-2">{kpi.value}</h3>
              <p className={`text-xs mt-1 ${kpi.change.startsWith("-") ? "text-red-500" : "text-green-500"}`}>
                {kpi.change} from last week
              </p>
            </div>
            <div className="h-12 w-12 bg-st-bg-elevated rounded-full flex items-center justify-center">
              <kpi.icon className="h-6 w-6 text-st-accent" />
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Productivity Bar Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-st-border p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Activity Distribution (Hours)</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={productivityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} />
                <RechartsTooltip cursor={{fill: 'transparent'}} />
                <Legend iconType="circle" />
                <Bar dataKey="coding" name="Coding" stackId="a" fill="#8b5cf6" radius={[0, 0, 4, 4]} />
                <Bar dataKey="reading" name="Documentation" stackId="a" fill="#10b981" />
                <Bar dataKey="ai" name="AI Assistant" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Focus Score Area Chart */}
        <div className="bg-white rounded-xl shadow-sm border border-st-border p-6">
          <h3 className="text-lg font-bold text-gray-900 mb-6">Daily Focus Score Trend</h3>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={focusScoreData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ccff00" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ccff00" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="time" axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} />
                <RechartsTooltip />
                <Area type="monotone" dataKey="score" stroke="#ccff00" strokeWidth={3} fillOpacity={1} fill="url(#colorScore)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
