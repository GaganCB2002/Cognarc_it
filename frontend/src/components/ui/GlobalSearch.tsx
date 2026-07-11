"use client";

import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Search, FileText, Video, MessageSquare, CheckSquare, Calendar, BookOpen, Settings, Users, Command, X } from "lucide-react";
import { cn } from "@/lib/utils";

export function GlobalSearch() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setIsOpen(true);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery("");
    }
  }, [isOpen]);

  const categories = [
    { icon: FileText, label: "Notes", color: "text-emerald-500", bg: "bg-emerald-500/10" },
    { icon: BookOpen, label: "Knowledge Vault", color: "text-amber-500", bg: "bg-amber-500/10" },
    { icon: MessageSquare, label: "Interview Qs", color: "text-rose-500", bg: "bg-rose-500/10" },
    { icon: FileText, label: "PDF Intelligence", color: "text-blue-500", bg: "bg-blue-500/10" },
    { icon: Video, label: "Video Intelligence", color: "text-purple-500", bg: "bg-purple-500/10" },
    { icon: MessageSquare, label: "AI Chats", color: "text-green-500", bg: "bg-green-500/10" },
    { icon: CheckSquare, label: "Tasks", color: "text-pink-500", bg: "bg-pink-500/10" },
    { icon: Calendar, label: "Calendar", color: "text-indigo-500", bg: "bg-indigo-500/10" },
    { icon: Users, label: "Users (Admin)", color: "text-cyan-500", bg: "bg-cyan-500/10" },
    { icon: Settings, label: "Settings", color: "text-slate-500", bg: "bg-slate-500/10" },
  ];

  const mockSuggestions = [
    { title: "Java Full Stack Developer Roadmap", type: "Learning Content", icon: BookOpen },
    { title: "Data Structures & Algorithms Notes", type: "Notes", icon: FileText },
    { title: "System Design Interview Questions", type: "Interview Qs", icon: MessageSquare },
    { title: "React Performance Optimization", type: "Video Intelligence", icon: Video },
    { title: "Machine Learning Basics PDF", type: "PDF Intelligence", icon: FileText },
    { title: "Weekly Team Sync", type: "Calendar", icon: Calendar },
    { title: "Fix Navigation Bug", type: "Tasks", icon: CheckSquare },
    { title: "Theme and Appearance Settings", type: "Settings", icon: Settings },
  ];

  const filteredSuggestions = query.length > 0 
    ? mockSuggestions.filter(s => 
        s.title.toLowerCase().includes(query.toLowerCase()) || 
        s.type.toLowerCase().includes(query.toLowerCase())
      )
    : [];

  return (
    <>
      {/* Trigger Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 w-64 md:w-80 bg-st-bg-elevated/50 hover:bg-st-bg-elevated border border-st-border rounded-lg text-sm text-st-text-muted transition-all duration-200"
      >
        <Search className="w-4 h-4" />
        <span className="flex-1 text-left truncate">Search anything...</span>
        <kbd className="hidden sm:inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-medium bg-st-bg-secondary text-st-text-muted border border-st-border">
          <Command className="w-3 h-3" /> K
        </kbd>
      </button>

      {/* Modal Overlay */}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh] sm:pt-[20vh] px-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
              onClick={() => setIsOpen(false)}
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="relative w-full max-w-2xl bg-st-bg-card border border-st-border rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[70vh]"
            >
              {/* Search Input Area */}
              <div className="flex items-center gap-3 px-4 py-4 border-b border-st-border">
                <Search className="w-5 h-5 text-st-accent" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search notes, tasks, AI chats..."
                  className="flex-1 bg-transparent text-st-text-primary text-base placeholder:text-st-text-muted focus:outline-none"
                />
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 text-st-text-muted hover:text-st-text-primary bg-st-bg-elevated rounded-md transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Results / Suggestions */}
              <div className="flex-1 overflow-y-auto p-2">
                {query.length === 0 ? (
                  <div className="p-2">
                    <p className="text-xs font-semibold text-st-text-muted mb-3 px-2 uppercase tracking-wider">Categories</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {categories.map((cat, i) => (
                        <button
                          key={i}
                          className="flex flex-col items-center justify-center p-4 gap-2 rounded-xl border border-st-border bg-st-bg-elevated/30 hover:bg-st-bg-elevated hover:border-st-accent/30 transition-all duration-200 group"
                        >
                          <div className={cn("p-2 rounded-lg transition-transform group-hover:scale-110", cat.bg, cat.color)}>
                            <cat.icon className="w-5 h-5" />
                          </div>
                          <span className="text-xs font-medium text-st-text-primary">{cat.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-2">
                    {filteredSuggestions.length > 0 ? (
                      <div className="flex flex-col gap-1">
                        <p className="text-xs font-semibold text-st-text-muted mb-2 px-2 uppercase tracking-wider">Suggestions</p>
                        {filteredSuggestions.map((suggestion, i) => (
                          <button
                            key={i}
                            className="flex items-center gap-3 w-full px-3 py-3 text-left rounded-lg hover:bg-st-bg-elevated transition-colors border border-transparent hover:border-st-border group"
                            onClick={() => {
                              setQuery(suggestion.title);
                              // router.push would go here
                            }}
                          >
                            <div className="p-2 rounded-lg bg-st-bg-elevated group-hover:bg-st-bg-card transition-colors">
                              <suggestion.icon className="w-4 h-4 text-st-accent" />
                            </div>
                            <div className="flex flex-col flex-1 min-w-0">
                              <span className="text-sm font-medium text-st-text-primary truncate">{suggestion.title}</span>
                              <span className="text-xs text-st-text-muted">{suggestion.type}</span>
                            </div>
                            <Command className="w-3 h-3 text-st-text-muted opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    ) : (
                      <div className="p-8 text-center">
                        <Search className="w-8 h-8 text-st-text-muted mx-auto mb-3 opacity-20" />
                        <p className="text-sm text-st-text-secondary">No results found for &quot;{query}&quot;.</p>
                        <p className="text-xs text-st-text-muted mt-1">Try searching for notes, tasks, or settings.</p>
                      </div>
                    )}
                  </div>
                )}
              </div>
              
              {/* Footer */}
              <div className="px-4 py-3 border-t border-st-border bg-st-bg-elevated/50 flex items-center justify-between text-xs text-st-text-muted">
                <div className="flex gap-4">
                  <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-st-bg-card border border-st-border font-medium">↑</kbd> <kbd className="px-1.5 py-0.5 rounded bg-st-bg-card border border-st-border font-medium">↓</kbd> to navigate</span>
                  <span className="flex items-center gap-1"><kbd className="px-1.5 py-0.5 rounded bg-st-bg-card border border-st-border font-medium">↵</kbd> to select</span>
                </div>
                <span><kbd className="px-1.5 py-0.5 rounded bg-st-bg-card border border-st-border font-medium">ESC</kbd> to close</span>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
