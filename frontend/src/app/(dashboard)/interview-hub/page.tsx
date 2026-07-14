"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatsCard } from "@/components/interview-hub/StatsCard";
import { StatsSkeleton } from "@/components/interview-hub/LoadingSkeleton";
import api from "@/lib/api";
import {
  MessageSquare,
  HelpCircle,
  Code2,
  Users,
  Flame,
  ArrowRight,
  Sparkles,
  BookOpen,
  Brain,
  Target,
  Clock,
  ChevronRight,
  TrendingUp,
  ListChecks,
  Calendar,
} from "lucide-react";

interface Analytics {
  questionsSolved: number;
  mcqsCompleted: number;
  codingProblems: number;
  interviewSessions: number;
  streak: number;
  weakTopics?: { subject: string; score: number }[];
  strongTopics?: { subject: string; score: number }[];
}

interface Recommendation {
  name: string;
  category: string;
  questions: number;
  difficulty: string;
}

interface RecentActivityItem {
  id: string;
  title: string;
  type: string;
  timestamp: string;
}

const quickActions = [
  { name: "Ask AI", desc: "Interview Q&A with AI", icon: MessageSquare, href: "/interview-hub/ai-qa", color: "text-st-accent", bg: "bg-st-accent/10" },
  { name: "A&A", desc: "Ask & answer practice", icon: HelpCircle, href: "/interview-hub/ask-answer", color: "text-pink-400", bg: "bg-pink-500/10" },
  { name: "Practice MCQs", desc: "Multiple choice questions", icon: ListChecks, href: "/interview-hub/mcq", color: "text-emerald-400", bg: "bg-emerald-500/10" },
  { name: "Coding Challenge", desc: "Solve coding problems", icon: Code2, href: "/interview-hub/coding", color: "text-blue-400", bg: "bg-blue-500/10" },
  { name: "Mock Interview", desc: "Simulated interviews", icon: Users, href: "/interview-hub/mock-interview", color: "text-purple-400", bg: "bg-purple-500/10" },
];

const activityIcons: Record<string, React.ElementType> = {
  question: HelpCircle,
  mcq: ListChecks,
  coding: Code2,
  interview: Users,
};

export default function InterviewHubPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [analyticsData, recsData, recentData] = await Promise.all([
          api.get<Analytics>("/interview/analytics").catch(() => null),
          api.get<Recommendation[]>("/interview/recommendations").catch(() => [] as Recommendation[]),
          api.get<RecentActivityItem[]>("/interview/search?type=all&limit=4").catch(() => [] as RecentActivityItem[]),
        ]);
        if (analyticsData) setAnalytics(analyticsData);
        if (Array.isArray(recsData)) setRecommendations(recsData);
        if (Array.isArray(recentData)) setRecentActivity(recentData);
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const stats = analytics
    ? [
        { icon: HelpCircle, label: "Questions Solved", value: analytics.questionsSolved, color: "text-st-accent", bg: "bg-st-accent/10" },
        { icon: ListChecks, label: "MCQs Done", value: analytics.mcqsCompleted, color: "text-emerald-400", bg: "bg-emerald-500/10" },
        { icon: Code2, label: "Coding Problems", value: analytics.codingProblems, color: "text-blue-400", bg: "bg-blue-500/10" },
        { icon: Users, label: "Interview Sessions", value: analytics.interviewSessions, color: "text-purple-400", bg: "bg-purple-500/10" },
      ]
    : [];

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-st-accent/10 border border-st-accent/20 text-[10px] font-semibold text-st-accent uppercase tracking-wider">
              <Sparkles className="w-3 h-3" />
              Interview Hub
            </span>
          </div>
          <h1 className="text-2xl font-bold text-st-text-primary tracking-tight">Master Your Interviews</h1>
          <p className="text-sm text-st-text-secondary mt-0.5">Practice, prepare, and ace your next interview</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r from-st-accent/10 to-st-accent/5 rounded-lg border border-st-accent/15">
            <Flame className="w-[18px] h-[18px] text-st-accent" />
            <span className="text-sm font-semibold text-st-text-primary">{analytics?.streak || 0} Day Streak</span>
          </div>
          <Link href="/interview-hub/analytics">
            <Button variant="outline" size="sm">
              <TrendingUp className="w-4 h-4 mr-1.5" />
              Analytics
            </Button>
          </Link>
        </div>
      </motion.div>

      {/* Stats Grid */}
      {loading ? (
        <StatsSkeleton />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {stats.map((stat, i) => (
            <StatsCard key={i} {...stat} />
          ))}
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {quickActions.map((action) => (
          <Link key={action.name} href={action.href}>
            <Card className="p-4 hover:border-st-accent/20 transition-all duration-200 cursor-pointer group card-hover">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg ${action.bg} flex items-center justify-center group-hover:scale-110 transition-transform duration-200`}>
                  <action.icon className={`w-5 h-5 ${action.color}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <span className="font-medium text-sm text-st-text-primary block truncate">{action.name}</span>
                  <span className="text-[10px] text-st-text-muted">{action.desc}</span>
                </div>
                <ArrowRight className="w-3.5 h-3.5 text-st-text-muted group-hover:text-st-accent transition-colors shrink-0" />
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left + Center */}
        <div className="lg:col-span-2 space-y-6">
          {/* Recommended Topics */}
          {recommendations.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-st-accent" />
                  <h2 className="text-base font-semibold text-st-text-primary tracking-tight">Today&apos;s Recommended Topics</h2>
                </div>
                <Link href="/interview-hub/questions" className="text-xs text-st-accent hover:text-st-accent-hover transition-colors font-medium">
                  View all <ChevronRight className="w-3 h-3 inline ml-0.5" />
                </Link>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {recommendations.slice(0, 4).map((topic, i) => (
                  <Link key={i} href="/interview-hub/questions">
                    <Card className="p-4 hover:border-st-accent/20 transition-all duration-200 cursor-pointer card-hover">
                      <div className="flex justify-between items-start mb-2">
                        <Badge variant="outline" className="text-[10px]">{topic.category}</Badge>
                        <Badge variant={topic.difficulty === "Expert" ? "danger" : topic.difficulty === "Advanced" ? "warning" : "outline"} className="text-[10px]">
                          {topic.difficulty}
                        </Badge>
                      </div>
                      <h3 className="text-sm font-medium text-st-text-primary mb-2">{topic.name}</h3>
                      <div className="flex items-center gap-1 text-xs text-st-text-muted">
                        <BookOpen className="w-3 h-3" />
                        {topic.questions} questions
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Recent Activity */}
          {recentActivity.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-st-accent" />
                  <h2 className="text-base font-semibold text-st-text-primary tracking-tight">Recent Activity</h2>
                </div>
                <Link href="/interview-hub/history" className="text-xs text-st-accent hover:text-st-accent-hover transition-colors font-medium">
                  View all <ChevronRight className="w-3 h-3 inline ml-0.5" />
                </Link>
              </div>
              <Card className="p-0 overflow-hidden">
                <div className="divide-y divide-st-border/80">
                  {recentActivity.map((activity) => {
                    const Icon = (activityIcons[activity.type] || HelpCircle) as React.ComponentType<{ className?: string }>;
                    return (
                      <div key={activity.id} className="flex items-center gap-3 p-3.5 hover:bg-st-bg-elevated/50 transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-st-accent/10 flex items-center justify-center shrink-0">
                          <Icon className="w-4 h-4 text-st-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-st-text-primary">{activity.title}</p>
                          <p className="text-xs text-st-text-muted">{activity.timestamp}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Right Sidebar */}
        <div className="space-y-6">
          {/* Learning Streak */}
          <Card className="p-5 bg-gradient-to-br from-st-accent/[0.08] to-st-accent/[0.03] border-st-accent/15">
            <div className="text-center">
              <div className="w-16 h-16 rounded-2xl bg-st-accent/10 flex items-center justify-center mx-auto mb-3">
                <Flame className="w-8 h-8 text-st-accent" />
              </div>
              <h3 className="text-3xl font-bold text-st-text-primary">{analytics?.streak || 0} Day Streak</h3>
              <p className="text-xs text-st-text-muted mt-1">Keep learning every day!</p>
              <div className="flex justify-center gap-1.5 mt-4">
                {Array.from({ length: 7 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-medium ${
                      i < (analytics?.streak || 0) ? "bg-st-accent/20 text-st-accent border border-st-accent/30" : "bg-st-bg-elevated text-st-text-muted border border-st-border"
                    }`}
                  >
                    {["M", "T", "W", "T", "F", "S", "S"][i]}
                  </div>
                ))}
              </div>
            </div>
          </Card>

          {/* Quick Stats */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Brain className="w-4 h-4 text-st-accent" />
              <h2 className="text-base font-semibold text-st-text-primary tracking-tight">Progress</h2>
            </div>
            <Card className="p-4 space-y-3">
              {[
                { label: "Technical Questions", value: `${Math.min(100, Math.round(((analytics?.questionsSolved || 0) / 100) * 100))}%`, pct: Math.min(100, ((analytics?.questionsSolved || 0) / 100) * 100) },
                { label: "MCQ Accuracy", value: `${Math.min(100, Math.round(((analytics?.mcqsCompleted || 0) / 200) * 100))}%`, pct: Math.min(100, ((analytics?.mcqsCompleted || 0) / 200) * 100) },
                { label: "Coding Problems", value: `${Math.min(100, Math.round(((analytics?.codingProblems || 0) / 50) * 100))}%`, pct: Math.min(100, ((analytics?.codingProblems || 0) / 50) * 100) },
              ].map((item) => (
                <div key={item.label}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-xs text-st-text-secondary">{item.label}</span>
                    <span className="text-xs font-medium text-st-text-primary">{item.value}</span>
                  </div>
                  <div className="w-full h-1.5 bg-st-bg-elevated rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{ width: `${item.pct}%`, background: `linear-gradient(90deg, #FFCF70, #E5B254)` }}
                    />
                  </div>
                </div>
              ))}
            </Card>
          </div>

          {/* Upcoming */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-st-accent" />
              <h2 className="text-base font-semibold text-st-text-primary tracking-tight">Upcoming</h2>
            </div>
            <Card className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-st-accent" />
                <div className="flex-1">
                  <p className="text-sm text-st-text-primary">Google SDE Interview</p>
                  <p className="text-xs text-st-text-muted">In 3 days</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-2 h-2 rounded-full bg-emerald-400" />
                <div className="flex-1">
                  <p className="text-sm text-st-text-primary">System Design Review</p>
                  <p className="text-xs text-st-text-muted">In 5 days</p>
                </div>
              </div>
              <Link href="/interview-hub/mock-interview">
                <Button variant="outline" size="sm" className="w-full mt-2">Schedule Mock Interview</Button>
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
