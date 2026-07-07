"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import {
  CheckCircle2, Circle, Clock, Plus, Filter, LayoutGrid, List,
  Calendar, Tag, Paperclip, ChevronDown, Search, Archive
} from "lucide-react";

type Task = {
  id: string; title: string; description: string; priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  status: "TODO" | "IN_PROGRESS" | "DONE"; dueDate: string; category: string; tags: string[];
  checklist: { text: string; done: boolean }[];
};

const mockTasks: Task[] = [
  { id: "1", title: "Review Kafka Partitioning Logic", description: "Memory consolidation phase. Review the whitepaper and notes.", priority: "CRITICAL", status: "TODO", dueDate: "2026-07-08", category: "System Design", tags: ["review", "kafka"], checklist: [{ text: "Read whitepaper", done: true }, { text: "Write notes", done: false }] },
  { id: "2", title: "Complete Dynamic Programming Quiz", description: "Knapsack and LCS variations.", priority: "MEDIUM", status: "TODO", dueDate: "2026-07-09", category: "Algorithms", tags: ["practice"], checklist: [] },
  { id: "3", title: "Build REST API Authentication", description: "Implement JWT auth with refresh tokens.", priority: "HIGH", status: "IN_PROGRESS", dueDate: "2026-07-10", category: "Backend", tags: ["coding", "auth"], checklist: [{ text: "Setup JWT", done: true }, { text: "Refresh tokens", done: false }, { text: "Tests", done: false }] },
  { id: "4", title: "Read CAP Theorem Paper", description: "Brewer's CAP theorem deep dive.", priority: "MEDIUM", status: "DONE", dueDate: "2026-07-06", category: "Distributed Systems", tags: ["reading"], checklist: [{ text: "Read paper", done: true }, { text: "Write summary", done: true }] },
  { id: "5", title: "Docker Multi-stage Builds", description: "Optimize container images with multi-stage builds.", priority: "LOW", status: "DONE", dueDate: "2026-07-05", category: "DevOps", tags: ["docker"], checklist: [] },
  { id: "6", title: "Design Database Schema for Analytics", description: "Create normalized schema for telemetry data.", priority: "HIGH", status: "IN_PROGRESS", dueDate: "2026-07-11", category: "Database", tags: ["design", "analytics"], checklist: [{ text: "ER Diagram", done: true }, { text: "Migration script", done: false }] },
];

const priorityColors: Record<string, string> = { CRITICAL: "danger", HIGH: "warning", MEDIUM: "outline", LOW: "success" };

export default function TasksPage() {
  const [viewMode, setViewMode] = useState<"kanban" | "list">("kanban");
  const [filter, setFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = mockTasks.filter(t => {
    if (filter !== "ALL" && t.status !== filter) return false;
    if (searchQuery && !t.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const columns = [
    { key: "TODO", label: "To Do", color: "border-blue-400" },
    { key: "IN_PROGRESS", label: "In Progress", color: "border-st-accent" },
    { key: "DONE", label: "Completed", color: "border-st-success" },
  ];

  const TaskCard = ({ task }: { task: Task }) => (
    <Card className="p-4 hover:border-st-accent/30 transition-all cursor-pointer group">
      <div className="flex justify-between items-start mb-2">
        <h4 className="font-semibold text-sm text-st-text-primary group-hover:text-st-accent transition-colors">{task.title}</h4>
        <Badge variant={priorityColors[task.priority] as any}>{task.priority}</Badge>
      </div>
      <p className="text-xs text-st-text-muted mb-3 line-clamp-2">{task.description}</p>
      {task.checklist.length > 0 && (
        <div className="mb-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="flex-1 h-1.5 bg-st-bg-elevated rounded-full overflow-hidden">
              <div className="h-full bg-st-accent rounded-full" style={{ width: `${(task.checklist.filter(c => c.done).length / task.checklist.length) * 100}%` }} />
            </div>
            <span className="text-[10px] text-st-text-muted">{task.checklist.filter(c => c.done).length}/{task.checklist.length}</span>
          </div>
        </div>
      )}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-st-text-muted flex items-center gap-1"><Calendar className="w-3 h-3" />{task.dueDate}</span>
        </div>
        <div className="flex gap-1">
          {task.tags.slice(0, 2).map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-st-bg-elevated text-st-text-muted">{t}</span>)}
        </div>
      </div>
    </Card>
  );

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-st-accent uppercase mb-1">Task Management</p>
          <h1 className="text-3xl font-bold text-st-text-primary">Tasks</h1>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-st-text-muted" />
            <input type="text" placeholder="Search tasks..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-st-bg-elevated border border-st-border rounded-lg text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none focus:border-st-accent/50 w-64" />
          </div>
          <div className="flex bg-st-bg-elevated rounded-lg border border-st-border overflow-hidden">
            <button onClick={() => setViewMode("kanban")} className={`p-2 ${viewMode === "kanban" ? "bg-st-accent/10 text-st-accent" : "text-st-text-muted hover:text-st-text-primary"}`}><LayoutGrid className="w-4 h-4" /></button>
            <button onClick={() => setViewMode("list")} className={`p-2 ${viewMode === "list" ? "bg-st-accent/10 text-st-accent" : "text-st-text-muted hover:text-st-text-primary"}`}><List className="w-4 h-4" /></button>
          </div>
          <Button variant="primary" size="sm"><Plus className="w-4 h-4 mr-1" />New Task</Button>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2">
        {["ALL", "TODO", "IN_PROGRESS", "DONE"].map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${filter === f ? "bg-st-accent text-black" : "bg-st-bg-elevated text-st-text-secondary hover:text-st-text-primary border border-st-border"}`}>
            {f === "ALL" ? "All" : f === "IN_PROGRESS" ? "In Progress" : f === "TODO" ? "To Do" : "Done"}
            <span className="ml-1.5 opacity-70">({f === "ALL" ? mockTasks.length : mockTasks.filter(t => t.status === f).length})</span>
          </button>
        ))}
      </div>

      {/* Kanban View */}
      {viewMode === "kanban" ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 flex-1 min-h-0">
          {columns.map(col => (
            <div key={col.key} className="flex flex-col gap-4">
              <div className={`flex items-center justify-between border-b-2 ${col.color} pb-3`}>
                <h3 className="font-semibold text-sm text-st-text-primary">{col.label}</h3>
                <Badge variant="outline">{filtered.filter(t => t.status === col.key).length}</Badge>
              </div>
              <div className="space-y-3 flex-1 overflow-y-auto">
                {filtered.filter(t => t.status === col.key).map(task => <TaskCard key={task.id} task={task} />)}
              </div>
            </div>
          ))}
        </div>
      ) : (
        /* List View */
        <Card className="p-0 overflow-hidden flex-1">
          <div className="divide-y divide-st-border">
            <div className="grid grid-cols-12 gap-4 p-4 text-xs font-semibold text-st-text-muted uppercase tracking-wider bg-st-bg-elevated">
              <div className="col-span-1">Status</div><div className="col-span-4">Task</div><div className="col-span-2">Priority</div>
              <div className="col-span-2">Category</div><div className="col-span-2">Due Date</div><div className="col-span-1">Progress</div>
            </div>
            {filtered.map(task => (
              <div key={task.id} className="grid grid-cols-12 gap-4 p-4 items-center hover:bg-st-bg-elevated transition-colors cursor-pointer">
                <div className="col-span-1">{task.status === "DONE" ? <CheckCircle2 className="w-5 h-5 text-st-success" /> : <Circle className="w-5 h-5 text-st-text-muted" />}</div>
                <div className="col-span-4">
                  <h4 className={`font-medium text-sm ${task.status === "DONE" ? "line-through text-st-text-muted" : "text-st-text-primary"}`}>{task.title}</h4>
                  <p className="text-xs text-st-text-muted mt-0.5 truncate">{task.description}</p>
                </div>
                <div className="col-span-2"><Badge variant={priorityColors[task.priority] as any}>{task.priority}</Badge></div>
                <div className="col-span-2"><span className="text-sm text-st-text-secondary">{task.category}</span></div>
                <div className="col-span-2"><span className="text-sm text-st-text-muted flex items-center gap-1"><Clock className="w-3 h-3" />{task.dueDate}</span></div>
                <div className="col-span-1">
                  {task.checklist.length > 0 ? (
                    <span className="text-xs text-st-text-muted">{task.checklist.filter(c => c.done).length}/{task.checklist.length}</span>
                  ) : <span className="text-xs text-st-text-muted">—</span>}
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
