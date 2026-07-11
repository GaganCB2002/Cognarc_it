"use client";

import React, { useEffect, useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import Image from "next/image";
import { User, Award, Code, BookOpen, Flame, Calendar, Clock, TrendingUp, Folder, Edit, Camera, ExternalLink, Code2, Link2, Globe, Briefcase } from "lucide-react";
import { api } from "@/lib/api";
import { format } from "date-fns";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [profileData, setProfileData] = useState<{
    createdAt: string;
    avatar?: string;
    name: string;
    email: string;
    role: string;
    profile?: {
      bio?: string;
      skills?: string[];
      currentLevel?: string;
      weeklyHours?: number;
      githubUrl?: string;
      linkedinUrl?: string;
      portfolioUrl?: string;
    };
  } | null>(null);
  const [stats, setStats] = useState<{
    currentStreak?: number;
    studySessionsCount?: number;
    tasksCompleted?: number;
    longestStreak?: number;
  } | null>(null);

  const fetchProfileData = async () => {
    try {
      setLoading(true);
      const [meRes, statsRes] = await Promise.all([
        api.get<{ user: {
          createdAt: string;
          avatar?: string;
          name: string;
          email: string;
          role: string;
          profile?: {
            bio?: string;
            skills?: string[];
            currentLevel?: string;
            weeklyHours?: number;
            githubUrl?: string;
            linkedinUrl?: string;
            portfolioUrl?: string;
          };
        } }>("/auth/me"),
        api.get<{ stats: {
          currentStreak?: number;
          studySessionsCount?: number;
          tasksCompleted?: number;
          longestStreak?: number;
        } }>("/users/stats")
      ]);
      setProfileData(meRes.user);
      setStats(statsRes.stats);
    } catch (err) {
      console.error("Failed to fetch profile", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfileData();
  }, []);

  const jobPortals = [
    { name: "LinkedIn Jobs", url: "https://www.linkedin.com/jobs/" },
    { name: "Naukri", url: "https://www.naukri.com/" },
    { name: "Indeed", url: "https://www.indeed.com/" },
    { name: "Glassdoor", url: "https://www.glassdoor.com/Job/" },
    { name: "Wellfound (AngelList)", url: "https://wellfound.com/jobs" },
    { name: "Instahyre", url: "https://www.instahyre.com/" },
    { name: "Hired", url: "https://hired.com/" },
    { name: "Toptal", url: "https://www.toptal.com/" },
    { name: "Internshala", url: "https://internshala.com/jobs/" },
    { name: "Cutshort", url: "https://cutshort.io/" },
    { name: "Hirect", url: "https://hirect.in/" },
    { name: "Monster", url: "https://www.monster.com/" },
    { name: "SimplyHired", url: "https://www.simplyhired.com/" },
    { name: "ZipRecruiter", url: "https://www.ziprecruiter.com/" },
    { name: "Remote OK", url: "https://remoteok.com/" },
    { name: "We Work Remotely", url: "https://weworkremotely.com/" }
  ];

  const achievements = [
    { icon: Flame, title: "14-Day Streak", desc: "Consistent learner", earned: (stats?.currentStreak || 0) >= 14 },
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

  if (loading) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-st-accent border-t-transparent rounded-full" />
      </div>
    );
  }

  const profile = profileData?.profile || {};
  const skills = profile.skills || ["JavaScript", "TypeScript", "React", "Next.js", "Node.js"];
  const joinDate = profileData?.createdAt ? format(new Date(profileData.createdAt), "MMMM yyyy") : "Recently";

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8 pr-2">
      {/* Profile Header */}
      <Card className="p-8">
        <div className="flex flex-col md:flex-row items-start gap-6">
          <div className="relative shrink-0">
            {profileData?.avatar ? (
              <Image src={profileData.avatar} alt="Profile" width={96} height={96} unoptimized className="w-24 h-24 rounded-full border-2 border-st-accent/30 object-cover" />
            ) : (
              <div className="w-24 h-24 rounded-full bg-st-bg-elevated flex items-center justify-center border-2 border-st-accent/30">
                <User className="w-10 h-10 text-st-text-muted" />
              </div>
            )}
            <button className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-st-accent flex items-center justify-center hover:bg-st-accent-hover transition-colors"
              onClick={() => document.getElementById("avatar-upload")?.click()}>
              <Camera className="w-4 h-4 text-black" />
            </button>
            <input id="avatar-upload" type="file" accept="image/*" className="hidden"
              onChange={(e) => { const file = e.target.files?.[0]; if (file) console.log("Upload avatar:", file.name); }} />
          </div>
          <div className="flex-1 w-full">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold text-st-text-primary">{profileData?.name || "Developer"}</h1>
                <p className="text-sm text-st-text-secondary mt-1">{profile.bio || "Full-stack developer passionate about distributed systems and AI."}</p>
                <div className="flex flex-wrap items-center gap-4 mt-3">
                  <Badge variant="success">{profile.currentLevel || "Mid-level Engineer"}</Badge>
                  <span className="text-xs text-st-text-muted flex items-center gap-1"><Calendar className="w-3 h-3" />Joined {joinDate}</span>
                  <span className="text-xs text-st-text-muted flex items-center gap-1"><Flame className="w-3 h-3 text-orange-400" />{stats?.currentStreak || 0}-day streak</span>
                </div>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.open("/settings", "_self")}><Edit className="w-3 h-3 mr-1" />Edit Profile</Button>
            </div>
            <div className="flex gap-3 mt-5">
              {[
                { icon: Code2, label: "GitHub", url: profile.githubUrl || "https://github.com" },
                { icon: Link2, label: "LinkedIn", url: profile.linkedinUrl || "https://linkedin.com" },
                { icon: Globe, label: "Portfolio", url: profile.portfolioUrl || "#" },
              ].map((link, i) => (
                <button key={i} onClick={() => link.url !== "#" && window.open(link.url, "_blank")}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-st-bg-elevated border border-st-border text-xs text-st-text-secondary hover:text-st-text-primary hover:border-st-accent/30 transition-colors">
                  <link.icon className="w-3 h-3" />{link.label}<ExternalLink className="w-2.5 h-2.5 opacity-50" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: "Study Sessions", value: stats?.studySessionsCount || 0, icon: Clock },
          { label: "Tasks Done", value: stats?.tasksCompleted || 0, icon: TrendingUp },
          { label: "Longest Streak", value: stats?.longestStreak || 0, icon: Flame },
          { label: "Weekly Goal", value: `${profile.weeklyHours || 0} hrs`, icon: Folder },
        ].map((s, i) => (
          <Card key={i} className="p-5 text-center bg-st-bg-elevated/50">
            <s.icon className="w-6 h-6 text-st-accent mx-auto mb-2" />
            <p className="text-2xl font-bold text-st-text-primary">{s.value}</p>
            <p className="text-xs text-st-text-muted">{s.label}</p>
          </Card>
        ))}
      </div>

      {/* Job Portals - New Section */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-st-text-primary flex items-center gap-2">
            <Briefcase className="w-5 h-5 text-st-accent" /> Job Portals
          </h3>
          <span className="text-xs text-st-text-muted">For 0-2 Years Experience</span>
        </div>
        <p className="text-sm text-st-text-secondary mb-5">Quick access to the most popular job portals for software engineering roles.</p>
        
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
          {jobPortals.map((portal) => (
            <button 
              key={portal.name}
              onClick={() => window.open(portal.url, "_blank")}
              className="flex flex-col items-center justify-center gap-2 p-4 rounded-xl border border-st-border bg-st-bg-primary hover:border-st-accent/50 hover:bg-st-bg-elevated transition-all group"
            >
              <div className="w-10 h-10 rounded-full bg-st-bg-elevated flex items-center justify-center group-hover:scale-110 transition-transform">
                <Image src={`https://www.google.com/s2/favicons?domain=${new URL(portal.url).hostname}&sz=64`} alt={portal.name} width={20} height={20} unoptimized className="w-5 h-5" onError={(e) => (e.currentTarget.style.display = 'none')} />
              </div>
              <span className="text-xs font-medium text-st-text-primary text-center leading-tight">{portal.name}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Skills */}
        <Card className="p-6">
          <h3 className="text-lg font-bold text-st-text-primary mb-4">Skills</h3>
          <div className="flex flex-wrap gap-2">
            {skills.map((skill: string) => (
              <Badge key={skill} variant="outline" className="px-3 py-1.5 text-sm bg-st-bg-elevated">{skill}</Badge>
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
                <div className={`w-3 h-3 rounded-full ${a.color} shrink-0 mt-1`} />
                {i < activityTimeline.length - 1 && <div className="w-0.5 h-10 bg-st-border my-1" />}
              </div>
              <div className="pb-4">
                <p className="text-sm font-medium text-st-text-primary">{a.text}</p>
                <p className="text-xs text-st-text-muted mt-0.5">{a.time}</p>
              </div>
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
