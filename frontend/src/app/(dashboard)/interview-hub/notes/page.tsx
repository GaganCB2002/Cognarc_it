"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/interview-hub/SearchInput";
import { TopicChip } from "@/components/interview-hub/TopicChip";
import { Pagination } from "@/components/interview-hub/Pagination";
import { CardSkeleton } from "@/components/interview-hub/LoadingSkeleton";
import { EmptyState } from "@/components/interview-hub/EmptyState";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  FileText, Pin, PinOff, Sparkles, FileDown, FileType,
  FileSpreadsheet, X, Loader2, Tag, BookOpen, StickyNote, GraduationCap,
  FileCode, BarChart3, Layers, Hash, TrendingUp,
} from "lucide-react";

interface Note {
  id: string;
  title: string;
  content: string;
  type: string;
  tags: string[];
  pinned: boolean;
  createdAt: string;
}

const noteTypes = ["All", "General", "Study", "Revision", "Flashcard", "Cheat Sheet", "Interview"];

const typeIcons: Record<string, React.ElementType> = {
  Study: BookOpen,
  General: StickyNote,
  Revision: GraduationCap,
  Flashcard: FileCode,
  "Cheat Sheet": FileCode,
  Interview: FileText,
};

export default function NotesPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [showGenerateModal, setShowGenerateModal] = useState(false);
  const [generateTopic, setGenerateTopic] = useState("");
  const [generateType, setGenerateType] = useState("Study");
  const [generating, setGenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [showSummaryModal, setShowSummaryModal] = useState(false);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [summaryData, setSummaryData] = useState<{
    totalNotes: number;
    topicsCovered: string[];
    tagsUsed: string[];
    mostCommonTopics: { topic: string; count: number }[];
    summaryText: string;
  } | null>(null);
  const pageSize = 6;

  const fetchNotes = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType !== "All") params.set("type", selectedType);
      if (searchQuery) params.set("search", searchQuery);
      params.set("page", String(currentPage));
      params.set("limit", String(pageSize));
      const data = await api.get<{ notes: Note[]; total: number }>(`/interview/notes?${params.toString()}`);
      setNotes(data.notes || []);
    } catch {
      setNotes([]);
    } finally {
      setLoading(false);
    }
  }, [selectedType, searchQuery, currentPage]);

  useEffect(() => { fetchNotes(); }, [fetchNotes]);

  const sorted = [...notes].sort((a, b) => {
    if (a.pinned && !b.pinned) return -1;
    if (!a.pinned && b.pinned) return 1;
    return 0;
  });

  const totalPages = Math.ceil(sorted.length / pageSize);
  const paginated = sorted.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  const togglePin = async (id: string) => {
    try {
      await api.patch(`/interview/notes/${id}`, { pinned: !notes.find(n => n.id === id)?.pinned });
      setNotes(prev => prev.map(n => n.id === id ? { ...n, pinned: !n.pinned } : n));
    } catch {
      // ignore
    }
  };

  const deleteNote = async (id: string) => {
    try {
      await api.delete(`/interview/notes/${id}`);
      setNotes(prev => prev.filter(n => n.id !== id));
    } catch {
      // ignore
    }
  };

  const handleGenerate = async () => {
    if (!generateTopic.trim()) return;
    setGenerating(true);
    try {
      const data = await api.post<{ note: Note }>("/interview/notes/generate", {
        topic: generateTopic.trim(),
        type: generateType,
      });
      if (data.note) {
        setNotes(prev => [data.note, ...prev]);
      }
      setShowGenerateModal(false);
      setGenerateTopic("");
    } catch {
      // ignore
    } finally {
      setGenerating(false);
    }
  };

  const handleSummarizeAll = async () => {
    setSummaryLoading(true);
    setShowSummaryModal(true);
    try {
      const data = await api.get<{ notes: Note[]; total: number }>("/interview/notes");
      const allNotes = data.notes || [];
      const allTags = allNotes.flatMap((n) => n.tags);
      const tagCounts = allTags.reduce<Record<string, number>>((acc, tag) => {
        acc[tag] = (acc[tag] || 0) + 1;
        return acc;
      }, {});
      const tagsUsed = Object.keys(tagCounts).sort((a, b) => tagCounts[b] - tagCounts[a]);
      const topicCounts = allNotes.reduce<Record<string, number>>((acc, note) => {
        const topic = note.title.split(" ").slice(0, 3).join(" ");
        acc[topic] = (acc[topic] || 0) + 1;
        return acc;
      }, {});
      const mostCommonTopics = Object.entries(topicCounts)
        .map(([topic, count]) => ({ topic, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);
      const topicsCovered = [...new Set(allNotes.map((n) => n.type))];
      const summaryText = allNotes
        .map((n) => `### ${n.title}\n${n.content}`)
        .join("\n\n");

      setSummaryData({
        totalNotes: allNotes.length,
        topicsCovered,
        tagsUsed: tagsUsed.slice(0, 10),
        mostCommonTopics,
        summaryText,
      });
    } catch {
      setSummaryData(null);
    } finally {
      setSummaryLoading(false);
    }
  };

  const downloadSummary = (format: "text" | "markdown") => {
    if (!summaryData) return;
    const content = format === "markdown"
      ? `# Notes Summary\n\nTotal Notes: ${summaryData.totalNotes}\nTopics: ${summaryData.topicsCovered.join(", ")}\n\n${summaryData.summaryText}`
      : `Notes Summary\n\nTotal Notes: ${summaryData.totalNotes}\nTopics: ${summaryData.topicsCovered.join(", ")}\n\n${summaryData.summaryText}`;
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `notes-summary.${format === "markdown" ? "md" : "txt"}`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-st-text-primary tracking-tight">Interview Notes</h1>
          <p className="text-sm text-st-text-secondary">Create and manage your interview preparation notes</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSummarizeAll}>
            <BarChart3 className="w-4 h-4 mr-1.5" /> Summarize All
          </Button>
          <Button variant="primary" size="sm" onClick={() => setShowGenerateModal(true)}>
            <Sparkles className="w-4 h-4 mr-1.5" /> AI Generate Notes
          </Button>
        </div>
      </motion.div>

      <SearchInput
        value={searchQuery}
        onChange={(v) => { setSearchQuery(v); setCurrentPage(1); }}
        placeholder="Search notes..."
      />

      <div className="flex flex-wrap gap-2">
        {noteTypes.map(type => (
          <TopicChip key={type} label={type} selected={selectedType === type} onClick={() => { setSelectedType(type); setCurrentPage(1); }} />
        ))}
      </div>

      {/* Generate Modal */}
      <AnimatePresence>
        {showGenerateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowGenerateModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-md mx-4"
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-st-text-primary">AI Generate Notes</h3>
                  <button onClick={() => setShowGenerateModal(false)} className="p-1 rounded-lg hover:bg-st-bg-elevated transition-colors">
                    <X className="w-4 h-4 text-st-text-muted" />
                  </button>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-medium text-st-text-secondary mb-1.5 block">Topic</label>
                    <input
                      type="text"
                      value={generateTopic}
                      onChange={(e) => setGenerateTopic(e.target.value)}
                      placeholder="e.g., Java Collections, React Hooks..."
                      className="w-full px-3 py-2 bg-st-bg-elevated border border-st-border rounded-lg text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none focus:border-st-accent/50"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-medium text-st-text-secondary mb-1.5 block">Note Type</label>
                    <div className="flex flex-wrap gap-2">
                      {["Study", "Revision", "Cheat Sheet", "Flashcard"].map(t => (
                        <TopicChip key={t} label={t} selected={generateType === t} onClick={() => setGenerateType(t)} />
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="primary"
                    className="w-full"
                    onClick={handleGenerate}
                    disabled={!generateTopic.trim() || generating}
                  >
                    {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Sparkles className="w-4 h-4 mr-2" />}
                    {generating ? "Generating..." : "Generate Notes"}
                  </Button>
                </div>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Notes Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {[1,2,3].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : sorted.length === 0 ? (
        <EmptyState icon={FileText} title="No notes found" description="Create a note or change filters" actionLabel="Generate with AI" onAction={() => setShowGenerateModal(true)} />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
          {paginated.map((note, i) => {
            const TypeIcon = (typeIcons[note.type] || FileText) as React.ComponentType<{ className?: string }>;
            return (
              <motion.div
                key={note.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className={cn("p-4 card-hover relative group", note.pinned && "border-st-accent/20")}>
                  <button
                    onClick={() => deleteNote(note.id)}
                    className="absolute top-2 right-2 p-1 rounded-lg text-st-text-muted opacity-0 group-hover:opacity-100 hover:text-st-danger hover:bg-st-danger-bg transition-all"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-st-accent/10 flex items-center justify-center">
                        <TypeIcon className="w-4 h-4 text-st-accent" />
                      </div>
                      <div>
                        <h3 className="text-sm font-medium text-st-text-primary">{note.title}</h3>
                        <div className="flex items-center gap-1.5">
                          <Badge variant="outline" className="text-[9px]">{note.type}</Badge>
                          <span className="text-[10px] text-st-text-muted">{note.createdAt}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => togglePin(note.id)}
                      className={cn("p-1.5 rounded-lg transition-colors", note.pinned ? "text-st-accent" : "text-st-text-muted hover:text-st-accent")}
                    >
                      {note.pinned ? <PinOff className="w-3.5 h-3.5" /> : <Pin className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-xs text-st-text-secondary leading-relaxed line-clamp-3 mb-3">{note.content}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {note.tags.map(tag => (
                      <Badge key={tag} variant="default" className="text-[9px] flex items-center gap-0.5">
                        <Tag className="w-2 h-2" /> {tag}
                      </Badge>
                    ))}
                  </div>
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Summary Modal */}
      <AnimatePresence>
        {showSummaryModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) setShowSummaryModal(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-2xl mx-4 max-h-[80vh] overflow-y-auto"
            >
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-base font-semibold text-st-text-primary">Notes Summary</h3>
                  <button onClick={() => setShowSummaryModal(false)} className="p-1 rounded-lg hover:bg-st-bg-elevated transition-colors">
                    <X className="w-4 h-4 text-st-text-muted" />
                  </button>
                </div>

                {summaryLoading ? (
                  <div className="flex items-center justify-center py-12">
                    <Loader2 className="w-6 h-6 animate-spin text-st-accent" />
                  </div>
                ) : summaryData ? (
                  <div className="space-y-4">
                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="p-3 rounded-xl bg-st-bg-elevated border border-st-border text-center">
                        <BarChart3 className="w-4 h-4 text-st-accent mx-auto mb-1" />
                        <p className="text-lg font-bold text-st-text-primary">{summaryData.totalNotes}</p>
                        <p className="text-[10px] text-st-text-muted">Total Notes</p>
                      </div>
                      <div className="p-3 rounded-xl bg-st-bg-elevated border border-st-border text-center">
                        <Layers className="w-4 h-4 text-st-accent mx-auto mb-1" />
                        <p className="text-lg font-bold text-st-text-primary">{summaryData.topicsCovered.length}</p>
                        <p className="text-[10px] text-st-text-muted">Topics</p>
                      </div>
                      <div className="p-3 rounded-xl bg-st-bg-elevated border border-st-border text-center">
                        <Hash className="w-4 h-4 text-st-accent mx-auto mb-1" />
                        <p className="text-lg font-bold text-st-text-primary">{summaryData.tagsUsed.length}</p>
                        <p className="text-[10px] text-st-text-muted">Tags Used</p>
                      </div>
                      <div className="p-3 rounded-xl bg-st-bg-elevated border border-st-border text-center">
                        <TrendingUp className="w-4 h-4 text-st-accent mx-auto mb-1" />
                        <p className="text-lg font-bold text-st-text-primary">{summaryData.mostCommonTopics[0]?.count || 0}</p>
                        <p className="text-[10px] text-st-text-muted">Most Frequent</p>
                      </div>
                    </div>

                    {/* Topics Covered */}
                    <div>
                      <p className="text-xs font-semibold text-st-text-primary mb-2">Topics Covered</p>
                      <div className="flex flex-wrap gap-1.5">
                        {summaryData.topicsCovered.map((topic) => (
                          <Badge key={topic} variant="outline" className="text-[10px]">{topic}</Badge>
                        ))}
                      </div>
                    </div>

                    {/* Most Common Topics */}
                    <div>
                      <p className="text-xs font-semibold text-st-text-primary mb-2">Most Common Topics</p>
                      <div className="space-y-1.5">
                        {summaryData.mostCommonTopics.map((item) => (
                          <div key={item.topic} className="flex items-center justify-between p-2 rounded-lg bg-st-bg-elevated/50">
                            <span className="text-xs text-st-text-primary">{item.topic}</span>
                            <Badge variant="default" className="text-[9px]">{item.count} notes</Badge>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tags */}
                    {summaryData.tagsUsed.length > 0 && (
                      <div>
                        <p className="text-xs font-semibold text-st-text-primary mb-2">Most Used Tags</p>
                        <div className="flex flex-wrap gap-1.5">
                          {summaryData.tagsUsed.map((tag) => (
                            <Badge key={tag} variant="default" className="text-[9px]">{tag}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Download Options */}
                    <div className="pt-3 border-t border-st-border/50">
                      <p className="text-xs font-medium text-st-text-secondary mb-2">Download Summary</p>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => downloadSummary("text")}>
                          <FileType className="w-3.5 h-3.5 mr-1" /> Text
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => downloadSummary("markdown")}>
                          <FileDown className="w-3.5 h-3.5 mr-1" /> Markdown
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-st-text-muted text-center py-4">Failed to load summary</p>
                )}
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />

      {/* Download Options */}
      {sorted.length > 0 && (
        <div className="flex items-center justify-center gap-3 pt-2">
          <span className="text-xs text-st-text-muted">Download all:</span>
          <Button variant="ghost" size="sm"><FileDown className="w-3.5 h-3.5 mr-1" /> PDF</Button>
          <Button variant="ghost" size="sm"><FileType className="w-3.5 h-3.5 mr-1" /> Markdown</Button>
          <Button variant="ghost" size="sm"><FileSpreadsheet className="w-3.5 h-3.5 mr-1" /> DOCX</Button>
        </div>
      )}
    </div>
  );
}
