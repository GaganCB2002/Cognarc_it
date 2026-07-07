"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Briefcase, Target, TrendingUp, Award, FileText, Globe, BookOpen, Code, ChevronRight, ExternalLink, Building2, DollarSign, GraduationCap, MapPin } from "lucide-react";

export default function CareerPage() {
  const [activeTab, setActiveTab] = useState<"roadmap" | "jobs" | "resume" | "interview">("roadmap");

  const skills = [
    { name: "JavaScript/TypeScript", level: 90, status: "strong" },
    { name: "React/Next.js", level: 85, status: "strong" },
    { name: "Node.js/Express", level: 82, status: "strong" },
    { name: "System Design", level: 65, status: "learning" },
    { name: "Docker/Kubernetes", level: 60, status: "learning" },
    { name: "AWS/Cloud", level: 40, status: "gap" },
    { name: "Machine Learning", level: 25, status: "gap" },
    { name: "GraphQL", level: 45, status: "gap" },
  ];

  const jobs = [
    { company: "Google", role: "Senior Software Engineer", location: "Bangalore", salary: "$180K-$250K", status: "Applied", appliedDate: "3 days ago" },
    { company: "Meta", role: "Full Stack Engineer", location: "Remote", salary: "$170K-$230K", status: "Interview", appliedDate: "1 week ago" },
    { company: "Stripe", role: "Backend Engineer", location: "San Francisco", salary: "$190K-$260K", status: "Screening", appliedDate: "2 weeks ago" },
    { company: "Databricks", role: "Platform Engineer", location: "Remote", salary: "$160K-$220K", status: "Saved", appliedDate: "" },
  ];

  const certifications = [
    { name: "AWS Solutions Architect", provider: "Amazon", status: "In Progress", progress: 60 },
    { name: "Kubernetes Administrator (CKA)", provider: "CNCF", status: "Planned", progress: 0 },
    { name: "System Design Expert", provider: "Educative", status: "Completed", progress: 100 },
  ];

  const statusColors: Record<string, string> = { Applied: "outline", Interview: "warning", Screening: "success", Saved: "default" };

  return (
    <div className="h-full flex flex-col gap-6 pb-8 overflow-y-auto">
      <div>
        <p className="text-[10px] font-bold tracking-widest text-st-accent uppercase mb-1">Career Intelligence</p>
        <h1 className="text-3xl font-bold text-st-text-primary">Career Hub</h1>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-st-bg-elevated p-1 rounded-lg border border-st-border w-fit">
        {[
          { key: "roadmap", label: "Skill Roadmap" },
          { key: "jobs", label: "Job Tracker" },
          { key: "resume", label: "Resume & Portfolio" },
          { key: "interview", label: "Interview Prep" },
        ].map(tab => (
          <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${activeTab === tab.key ? "bg-st-accent text-black" : "text-st-text-secondary hover:text-st-text-primary"}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "roadmap" && (
        <div className="space-y-6">
          {/* Target Role */}
          <Card className="p-6 border-st-accent/20">
            <div className="flex items-center gap-3 mb-4">
              <Target className="w-6 h-6 text-st-accent" />
              <div>
                <h3 className="text-lg font-bold text-st-text-primary">Target: Senior Full Stack Engineer</h3>
                <p className="text-sm text-st-text-secondary">Estimated readiness: 3-6 months</p>
              </div>
            </div>
            <div className="w-full h-3 bg-st-bg-elevated rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-st-accent to-st-accent-hover rounded-full" style={{ width: "68%" }} />
            </div>
            <p className="text-xs text-st-text-muted mt-2">68% of required skills achieved</p>
          </Card>

          {/* Skills */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-st-text-primary mb-4">Skill Gap Analysis</h3>
            <div className="space-y-4">
              {skills.map((skill, i) => (
                <div key={i} className="flex items-center gap-4">
                  <span className="text-sm text-st-text-primary w-44 shrink-0">{skill.name}</span>
                  <div className="flex-1 h-2 bg-st-bg-elevated rounded-full overflow-hidden">
                    <div className={`h-full rounded-full ${skill.status === "strong" ? "bg-st-success" : skill.status === "learning" ? "bg-st-accent" : "bg-st-danger"}`} style={{ width: `${skill.level}%` }} />
                  </div>
                  <span className="text-xs text-st-text-muted w-8">{skill.level}%</span>
                  <Badge variant={skill.status === "strong" ? "success" : skill.status === "learning" ? "warning" : "danger"}>{skill.status}</Badge>
                </div>
              ))}
            </div>
          </Card>

          {/* Certifications */}
          <Card className="p-6">
            <h3 className="text-lg font-bold text-st-text-primary mb-4 flex items-center gap-2"><GraduationCap className="w-5 h-5 text-st-accent" />Certifications</h3>
            <div className="space-y-3">
              {certifications.map((cert, i) => (
                <div key={i} className="p-4 bg-st-bg-elevated rounded-lg flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-st-text-primary">{cert.name}</p>
                    <p className="text-xs text-st-text-muted">{cert.provider}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {cert.progress > 0 && cert.progress < 100 && (
                      <div className="w-20 h-2 bg-st-bg-primary rounded-full overflow-hidden">
                        <div className="h-full bg-st-accent rounded-full" style={{ width: `${cert.progress}%` }} />
                      </div>
                    )}
                    <Badge variant={cert.status === "Completed" ? "success" : cert.status === "In Progress" ? "warning" : "outline"}>{cert.status}</Badge>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      )}

      {activeTab === "jobs" && (
        <Card className="p-0 overflow-hidden">
          <div className="divide-y divide-st-border">
            <div className="grid grid-cols-12 gap-4 p-4 text-xs font-semibold text-st-text-muted uppercase tracking-wider bg-st-bg-elevated">
              <div className="col-span-3">Company & Role</div><div className="col-span-2">Location</div>
              <div className="col-span-2">Salary</div><div className="col-span-2">Status</div><div className="col-span-2">Applied</div><div className="col-span-1"></div>
            </div>
            {jobs.map((job, i) => (
              <div key={i} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-st-bg-elevated transition-colors cursor-pointer">
                <div className="col-span-3">
                  <p className="font-semibold text-sm text-st-text-primary">{job.company}</p>
                  <p className="text-xs text-st-text-muted">{job.role}</p>
                </div>
                <div className="col-span-2 text-sm text-st-text-secondary flex items-center gap-1"><MapPin className="w-3 h-3" />{job.location}</div>
                <div className="col-span-2 text-sm text-st-text-secondary flex items-center gap-1"><DollarSign className="w-3 h-3" />{job.salary}</div>
                <div className="col-span-2"><Badge variant={statusColors[job.status] as any}>{job.status}</Badge></div>
                <div className="col-span-2 text-xs text-st-text-muted">{job.appliedDate || "—"}</div>
                <div className="col-span-1"><ExternalLink className="w-4 h-4 text-st-text-muted hover:text-st-accent" /></div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {activeTab === "resume" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-6">
            <h3 className="text-lg font-bold text-st-text-primary mb-4 flex items-center gap-2"><FileText className="w-5 h-5 text-st-accent" />Resume Progress</h3>
            <div className="space-y-4">
              {["Contact Info", "Summary", "Experience", "Projects", "Skills", "Education"].map((section, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-st-text-primary">{section}</span>
                  <Badge variant={i < 4 ? "success" : "outline"}>{i < 4 ? "Complete" : "Pending"}</Badge>
                </div>
              ))}
            </div>
            <Button variant="primary" className="w-full mt-4">Edit Resume</Button>
          </Card>
          <Card className="p-6">
            <h3 className="text-lg font-bold text-st-text-primary mb-4 flex items-center gap-2"><Globe className="w-5 h-5 text-st-accent" />Portfolio Progress</h3>
            <div className="space-y-4">
              {["Hero Section", "About Me", "Projects Showcase", "Blog Section", "Contact Form", "Deployment"].map((section, i) => (
                <div key={i} className="flex items-center justify-between">
                  <span className="text-sm text-st-text-primary">{section}</span>
                  <Badge variant={i < 3 ? "success" : "outline"}>{i < 3 ? "Complete" : "Pending"}</Badge>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">Edit Portfolio</Button>
          </Card>
        </div>
      )}

      {activeTab === "interview" && (
        <div className="space-y-4">
          {[
            { category: "System Design", questions: 12, completed: 8 },
            { category: "Data Structures & Algorithms", questions: 25, completed: 18 },
            { category: "Behavioral", questions: 10, completed: 4 },
            { category: "JavaScript Deep Dive", questions: 15, completed: 12 },
          ].map((cat, i) => (
            <Card key={i} className="p-5 hover:border-st-accent/30 transition-all cursor-pointer">
              <div className="flex items-center justify-between mb-3">
                <h4 className="font-semibold text-st-text-primary">{cat.category}</h4>
                <span className="text-sm text-st-text-muted">{cat.completed}/{cat.questions} completed</span>
              </div>
              <div className="w-full h-2 bg-st-bg-elevated rounded-full overflow-hidden">
                <div className="h-full bg-st-accent rounded-full" style={{ width: `${(cat.completed / cat.questions) * 100}%` }} />
              </div>
            </Card>
          ))}
          <Button variant="primary" className="w-full">Start Mock Interview Session</Button>
        </div>
      )}
    </div>
  );
}
