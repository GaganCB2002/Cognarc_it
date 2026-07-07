"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import {
  FileText, Plus, Search, Pin, Tag, Folder, Save, Bold, Italic,
  Code, List, Link2, Image, Table, Sparkles, Clock, ChevronRight
} from "lucide-react";

type Note = {
  id: string; title: string; content: string; tags: string[]; folder: string;
  isPinned: boolean; updatedAt: string; wordCount: number;
};

const mockNotes: Note[] = [
  { id: "1", title: "Kafka Partitioning Deep Dive", content: "Kafka partitions are the unit of parallelism. Each partition is an ordered, immutable sequence of records...", tags: ["kafka", "distributed-systems"], folder: "System Design", isPinned: true, updatedAt: "2 hours ago", wordCount: 1420 },
  { id: "2", title: "Dynamic Programming Patterns", content: "Top-down (Memoization) vs Bottom-up (Tabulation). Key patterns: Knapsack, LCS, LIS, Matrix Chain...", tags: ["algorithms", "dp"], folder: "Algorithms", isPinned: true, updatedAt: "Yesterday", wordCount: 890 },
  { id: "3", title: "Docker Best Practices", content: "Use multi-stage builds. Keep images small. Use .dockerignore. Don't run as root...", tags: ["docker", "devops"], folder: "DevOps", isPinned: false, updatedAt: "3 days ago", wordCount: 650 },
  { id: "4", title: "React Server Components Notes", content: "RSC allows rendering on the server without hydration costs. Streaming with Suspense boundaries...", tags: ["react", "frontend"], folder: "Frontend", isPinned: false, updatedAt: "1 week ago", wordCount: 1100 },
  { id: "5", title: "Interview Prep - System Design", content: "Key topics: Load balancing, caching, database sharding, message queues, microservices...", tags: ["interview", "system-design"], folder: "Career", isPinned: false, updatedAt: "1 week ago", wordCount: 2300 },
];

const folders = ["All Notes", "System Design", "Algorithms", "DevOps", "Frontend", "Career"];

export default function NotesPage() {
  const [selectedFolder, setSelectedFolder] = useState("All Notes");
  const [selectedNote, setSelectedNote] = useState<Note | null>(mockNotes[0]);
  const [searchQuery, setSearchQuery] = useState("");
  const [noteContent, setNoteContent] = useState(mockNotes[0].content);

  const filtered = mockNotes.filter(n => {
    if (selectedFolder !== "All Notes" && n.folder !== selectedFolder) return false;
    if (searchQuery && !n.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-st-accent uppercase mb-1">Knowledge Base</p>
          <h1 className="text-3xl font-bold text-st-text-primary">Notes</h1>
        </div>
        <Button variant="primary" size="sm"><Plus className="w-4 h-4 mr-1" />New Note</Button>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden">
        {/* Folders Sidebar */}
        <div className="col-span-2 space-y-1">
          {folders.map(f => (
            <button key={f} onClick={() => setSelectedFolder(f)}
              className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${selectedFolder === f ? "bg-st-accent/10 text-st-accent" : "text-st-text-secondary hover:text-st-text-primary hover:bg-st-bg-elevated"}`}>
              <Folder className="w-4 h-4 shrink-0" />{f}
            </button>
          ))}
        </div>

        {/* Notes List */}
        <div className="col-span-3 flex flex-col gap-3 overflow-y-auto">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-st-text-muted" />
            <input type="text" placeholder="Search notes..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-st-bg-elevated border border-st-border rounded-lg text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none focus:border-st-accent/50" />
          </div>
          {filtered.map(note => (
            <Card key={note.id} onClick={() => { setSelectedNote(note); setNoteContent(note.content); }}
              className={`p-4 cursor-pointer transition-all ${selectedNote?.id === note.id ? "border-st-accent/50 bg-st-bg-elevated" : "hover:border-st-accent/20"}`}>
              <div className="flex items-start justify-between mb-1">
                <h4 className="font-semibold text-sm text-st-text-primary truncate flex-1">{note.title}</h4>
                {note.isPinned && <Pin className="w-3 h-3 text-st-accent shrink-0 ml-2" />}
              </div>
              <p className="text-xs text-st-text-muted line-clamp-2 mb-2">{note.content}</p>
              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {note.tags.slice(0, 2).map(t => <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-st-bg-primary text-st-text-muted">{t}</span>)}
                </div>
                <span className="text-[10px] text-st-text-muted">{note.updatedAt}</span>
              </div>
            </Card>
          ))}
        </div>

        {/* Editor */}
        <div className="col-span-7 flex flex-col gap-4 overflow-hidden">
          {selectedNote ? (
            <>
              <div className="flex items-center justify-between">
                <input type="text" defaultValue={selectedNote.title}
                  className="text-2xl font-bold bg-transparent text-st-text-primary focus:outline-none flex-1" />
                <div className="flex items-center gap-2">
                  <span className="text-xs text-st-text-muted flex items-center gap-1"><Clock className="w-3 h-3" />{selectedNote.updatedAt}</span>
                  <span className="text-xs text-st-text-muted">{selectedNote.wordCount} words</span>
                  <Button variant="outline" size="sm"><Sparkles className="w-3 h-3 mr-1" />AI Summary</Button>
                  <Button variant="primary" size="sm"><Save className="w-3 h-3 mr-1" />Save</Button>
                </div>
              </div>

              {/* Toolbar */}
              <div className="flex items-center gap-1 p-2 bg-st-bg-elevated rounded-lg border border-st-border">
                {[Bold, Italic, Code, List, Link2, Image, Table].map((Icon, i) => (
                  <button key={i} className="p-2 rounded hover:bg-st-bg-primary text-st-text-muted hover:text-st-text-primary transition-colors">
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>

              {/* Content Area */}
              <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)}
                className="flex-1 bg-st-bg-card border border-st-border rounded-lg p-6 text-sm text-st-text-primary leading-relaxed resize-none focus:outline-none focus:border-st-accent/30 font-mono"
                placeholder="Start writing..." />

              {/* Tags */}
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-st-text-muted" />
                {selectedNote.tags.map(t => <Badge key={t} variant="outline">{t}</Badge>)}
                <button className="text-xs text-st-text-muted hover:text-st-accent">+ Add tag</button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-st-text-muted">
              <div className="text-center">
                <FileText className="w-12 h-12 mx-auto mb-4 opacity-30" />
                <p>Select a note to start editing</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
