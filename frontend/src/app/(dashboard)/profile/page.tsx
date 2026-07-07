"use client";

import React from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { User, Award, Code, BookOpen, Flame, Calendar, Clock, TrendingUp, FileText, Folder, Edit, Camera, ExternalLink, Code2, Link2, Globe } from "lucide-react";

export default function ProfilePage() {
  const skills = ["JavaScript", "TypeScript", "React", "Next.js", "Node.js", "PostgreSQL", "Docker", "System Design", "Git"];
  
  const achievements = [
    { icon: Flame, title: "14-Day Streak", desc: "Consistent learner", earned: true },
    { icon: Code, title: "500+ Lines", desc: "Code champion", earned: true },
    { icon: BookOpen, title: "10 PDFs Read", desc: "Knowledge seeker", earned: true },
    { icon: Award, title: "Top 10%", desc: "Productivity elite", earned: false },
  ];

  const activityTimeline = [
    { text: "Completed Docker Multi-stage Builds", time: "2 hours ago", color: "bg-st-success" },
    { text: "Uploaded DDIA PDF to Knowledge Vault", time: "Yesterday", color: "bg-st-accent" },
    { text: "Finished System Design Mock Interview", time: "2 days ago", color: "bg-blue-400" },
    { text: "Completed 15 LeetCode Problems", time: "3 days ago", color: "bg-purple-400" },
    { text: "Started AWS Certification Course", time: "1 week ago", color: "bg-orange-400" },
    { text: "Created Kafka Partitioning Notes", time: "1 week ago", color: "bg-cyan-400" },
  ];

  const stats = [
    { label: "Study Hours", value: "248", icon: Clock },
    { label: "Tasks Done", value: "156", icon: TrendingUp },
    { label: "Documents", value: "42", icon: FileText },
    { label: "Projects", value: "8", icon: Folder },
  ];

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      {/* Profile Header */}
      <Card className="p-8">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="relative">
            <div className="w-24 h-24 rounded-full bg-st-bg-elevated flex items-center justify-center border-2 border-st-accent/30">
              <User className="w-10 h-10 text-st-text-muted" />
            </div>
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-st-accent flex items-center justify-center hover:bg-st-accent-hover transition-colors"
              onClick={() => document.getElementById("avatar-upload")?.click()}>
              <Camera className="w-4 h-4 text-black" />
            </button>
            <input id="avatar-upload" type="file" accept="image/*" className="hidden"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) console.log("Upload avatar:", file.name); }} />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-2xl font-bold text-st-text-primary">Developer</h1>
                <p className="text-sm text-st-text-secondary mt-1">Full-stack developer passionate about distributed systems and AI.</p>
                <div className="flex items-center gap-4 mt-3">
                  <Badge variant="success">Mid-level Engineer</Badge>
                  <span className="text-xs text-st-text-muted flex items-center gap-1"><Calendar className="w-3 h-3" />Joined June 2026</span>
                  <span className="text-xs text-st-text-muted flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" />14-day streak</span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.open("/settings", "_self")}><Edit className="w-3 h-3 mr-1" />Edit Profile</Button>
            </div>
            <div className="flex gap-3 mt-4">
              {[
                { icon: Code2, label: "GitHub", url: "https://github.com" },
                { icon: Link2, label: "LinkedIn", url: "https://linkedin.com" },
                { icon: Globe, label: "Portfolio", url: "#" },
              ].map((link, i) => (
                <button key={i} onClick={() => window.open(link.url, "_blank")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-st-bg-elevated border border-st-border text-xs text-st-text-secondary hover:text-st-text-primary hover:border-st-accent/30 transition-colors">
                  <link.icon className="w-3 h-3" />{link.label}<ExternalLink className="w-2.5 h-2.5" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="p-5 text-center">
            <s.icon className="w-6 h-6 text-st-accent mx-auto mb-2" />
            <p className="text-2xl font-bold text-st-text-primary">{s.value}</p>
            <p className="text-xs text-st-text-muted">{s.label}</p>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-st-text-primary mb-4">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map(skill => (
              <Badge key={skill} variant="outline" className="px-3 py-1.5 text-sm">{skill}</Badge>
            ))}
          </div>
        </Card>

        {/* Achievements */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-st-text-primary mb-4 flex items-center gap-2"><Award className="w-5 h-5 text-st-accent" />Achievements</h3>
          <div className="grid grid-cols-2 gap-3">
            {achievements.map((a, i) => (
              <div key={i} className={`p-3 rounded-lg border flex items-center gap-3 ${a.earned ? "bg-st-accent/5 border-st-accent/20" : "bg-st-bg-elevated border-st-border opacity-50"}`}>
                <a.icon className={`w-5 h-5 ${a.earned ? "text-st-accent" : "text-st-text-muted"}`} />
                <div>
                  <p className="text-sm font-medium text-st-text-primary">{a.title}</p>
                  <p className="text-xs text-st-text-muted">{a.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Activity Timeline */}
      <Card className="p-6">
        <h3 className="text-lg font-bold text-st-text-primary mb-4">Activity Timeline</h3>
        <div className="space-y-4">
          {activityTimeline.map((a, i) => (
            <div key={i} className="flex gap-4 items-start">
              <div className="flex flex-col items-center">
                <div className={`w-3 h-3 rounded-full ${a.color} shrink-0`} />
                {i < activityTimeline.length - 1 && <div className="w-0.5 h-8 bg-st-border" />}
              </div>
              <div>
                <p className="text-sm font-medium text-st-text-primary">{a.text}</p>
                <p className="text-xs text-st-text-muted">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
