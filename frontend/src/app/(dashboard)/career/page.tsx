"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge, type BadgeProps } from "@/components/ui/Badge";
import { Target, TrendingUp, FileText, Globe, ExternalLink, DollarSign, GraduationCap, MapPin, Bot, Send, Loader2, MessageCircle, X, CalendarIcon } from "lucide-react";
import api from "@/lib/api";

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

  const statusColors: Record<string, BadgeProps["variant"]> = { Applied: "outline", Interview: "warning", Screening: "success", Saved: "default" };

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
          <button key={tab.key} onClick={() => setActiveTab(tab.key as "roadmap" | "jobs" | "resume" | "interview")}
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
                <div className="col-span-2"><Badge variant={statusColors[job.status]}>{job.status}</Badge></div>
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

      {/* CareerBot Floating Chat Widget */}
      <CareerBotWidget />
    </div>
  );
}

function CareerBotWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    const userMsg = { role: "user" as const, content: text };
    setMessages(prev => [...prev, userMsg]);
    setSending(true);
    try {
      const res = await api.post<{ reply: string }>("/ai/agent-chat", {
        messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content }))
      });
      setMessages(prev => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err: unknown) {
      setMessages(prev => [...prev, { role: "assistant", content: `**Error:** ${err instanceof Error ? err.message : "Failed to get response."}` }]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-st-accent hover:bg-st-accent/90 shadow-lg shadow-st-accent/20 flex items-center justify-center transition-all hover:scale-105 group"
        title="CareerBot - AI Career Coach">
        <MessageCircle className="w-6 h-6 text-white" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-st-danger rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-pulse">AI</span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[420px] h-[560px] flex flex-col bg-st-bg-primary border border-st-border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5">
      <div className="flex items-center justify-between px-4 py-3 bg-st-accent/10 border-b border-st-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-st-accent/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-st-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-st-text-primary">CareerBot</p>
            <p className="text-[10px] text-st-text-muted">AI Career Coach — powered by Gemini</p>
          </div>
        </div>
        <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-st-bg-elevated transition-colors">
          <X className="w-4 h-4 text-st-text-muted" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-st-accent/10 flex items-center justify-center mb-4">
              <Bot className="w-6 h-6 text-st-accent" />
            </div>
            <h3 className="text-base font-bold text-st-text-primary mb-1">Career Coach</h3>
            <p className="text-xs text-st-text-secondary mb-4">AI assistant powered by Gemini. Ask questions, get career advice, or tell me to perform actions like adding calendar events, creating tasks, or writing notes.</p>
            <div className="grid grid-cols-2 gap-2 w-full">
              {[
                { icon: FileText, text: "Review my resume" },
                { icon: Target, text: "Interview tips for FAANG" },
                { icon: TrendingUp, text: "Skill roadmap for Senior Dev" },
                { icon: CalendarIcon, text: "Add study plan to calendar" },
              ].map((q, i) => (
                <button key={i} onClick={() => { setInput(q.text); inputRef.current?.focus(); }}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-st-bg-elevated border border-st-border hover:border-st-accent/30 transition-all text-left text-xs text-st-text-secondary cursor-pointer">
                  <q.icon className="w-3 h-3 text-st-accent shrink-0" />
                  <span className="line-clamp-1">{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-st-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-st-accent" />
                  </div>
                )}
                <div className={`max-w-[85%] rounded-xl px-3.5 py-2.5 ${msg.role === "user" ? "bg-st-accent/10 border border-st-accent/20" : "bg-st-bg-elevated border border-st-border"}`}>
                  <div className="text-xs text-st-text-primary whitespace-pre-wrap leading-relaxed [&_strong]:text-st-accent [&_code]:bg-st-bg [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[10px]">{msg.content}</div>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-lg bg-st-accent/10 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-st-accent" />
                </div>
                <div className="rounded-xl px-3.5 py-2.5 bg-st-bg-elevated border border-st-border">
                  <Loader2 className="w-3.5 h-3.5 text-st-accent animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      <div className="border-t border-st-border p-3">
        <div className="flex gap-2 items-end">
          <div className="flex-1 bg-st-bg-elevated border border-st-border rounded-xl px-3 py-2 focus-within:border-st-accent/50 transition-colors">
            <textarea ref={inputRef} value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown}
              placeholder="Ask about career advice..."
              className="w-full bg-transparent text-xs text-st-text-primary placeholder:text-st-text-muted focus:outline-none resize-none" rows={1} />
          </div>
          <button onClick={handleSend} disabled={sending || !input.trim()}
            className="h-9 w-9 rounded-xl bg-st-accent flex items-center justify-center shrink-0 hover:bg-st-accent/90 transition-colors disabled:opacity-40">
            {sending ? <Loader2 className="w-4 h-4 text-white animate-spin" /> : <Send className="w-4 h-4 text-white" />}
          </button>
        </div>
        <p className="text-[9px] text-st-text-muted mt-1.5 text-center">Powered by Google Gemini — ask questions or execute actions</p>
      </div>
    </div>
  );
}
