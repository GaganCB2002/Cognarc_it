"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/interview-hub/SearchInput";
import { TopicChip } from "@/components/interview-hub/TopicChip";
import { QuestionCard } from "@/components/interview-hub/QuestionCard";
import { Pagination } from "@/components/interview-hub/Pagination";
import { CardSkeleton } from "@/components/interview-hub/LoadingSkeleton";
import { EmptyState } from "@/components/interview-hub/EmptyState";
import api from "@/lib/api";
import { Loader2, Sparkles, Filter } from "lucide-react";

interface Question {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  difficulty: string;
  tags: string[];
  company?: string;
  frequency?: number;
  category?: string;
  similar?: { question: string; difficulty: string }[];
}

interface GenerateResponse {
  questions: Question[];
}

const categories = ["All", "Java", "Python", "React", "JavaScript", "Node.js", "SQL", "MongoDB", "AWS", "System Design", "Data Structures", "Algorithms", "Django", "Spring Boot", "Docker", "Kubernetes", "Git", "Linux"];

const difficulties = ["All", "Beginner", "Intermediate", "Advanced", "Expert"];

export default function QuestionsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [savedIds, setSavedIds] = useState<Set<string>>(new Set());
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const pageSize = 6;

  const fetchQuestions = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedCategory !== "All") params.set("category", selectedCategory);
      if (selectedDifficulty !== "All") params.set("difficulty", selectedDifficulty);
      if (searchQuery) params.set("search", searchQuery);
      params.set("page", String(currentPage));
      params.set("limit", String(pageSize));
      const data = await api.get<{ questions: Question[]; total: number }>(`/interview/questions?${params.toString()}`);
      setQuestions(data.questions || []);
      setTotalCount(data.total || 0);
    } catch {
      setQuestions([]);
      setTotalCount(0);
    } finally {
      setLoading(false);
    }
  }, [selectedCategory, selectedDifficulty, searchQuery, currentPage]);

  useEffect(() => { fetchQuestions(); }, [fetchQuestions]);

  const totalPages = Math.ceil(totalCount / pageSize);

  const handleSave = async (id: string) => {
    try {
      if (savedIds.has(id)) {
        await api.delete(`/interview/saved/${id}`);
        setSavedIds(prev => { const n = new Set(prev); n.delete(id); return n; });
      } else {
        await api.post("/interview/saved", { itemType: "question", itemId: id });
        setSavedIds(prev => { const n = new Set(prev); n.add(id); return n; });
      }
    } catch {
      // ignore
    }
  };

  const handleGenerate = async () => {
    setGenerating(true);
    try {
      const cat = selectedCategory !== "All" ? selectedCategory : undefined;
      const diff = selectedDifficulty !== "All" ? selectedDifficulty : undefined;
      const data = await api.post<GenerateResponse>("/interview/questions/generate", {
        category: cat,
        difficulty: diff,
        count: 6,
        type: "interview",
      });
      if (data.questions) {
        setQuestions(prev => [...data.questions, ...prev]);
        setTotalCount(prev => prev + data.questions.length);
      }
    } catch {
      // ignore
    } finally {
      setGenerating(false);
    }
  };

  const handleCategoryChange = (cat: string) => {
    setSelectedCategory(cat);
    setCurrentPage(1);
  };

  const handleDifficultyChange = (diff: string) => {
    setSelectedDifficulty(diff);
    setCurrentPage(1);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-st-text-primary tracking-tight">Interview Question Library</h1>
        <p className="text-sm text-st-text-secondary">Browse, search, and practice interview questions</p>
      </motion.div>

      {/* Search & Generate */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={searchQuery}
          onChange={(v) => { setSearchQuery(v); setCurrentPage(1); }}
          placeholder="Search questions, topics, tags..."
          className="flex-1"
        />
        <Button variant="primary" size="md" onClick={handleGenerate} disabled={generating}>
          {generating ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
          {generating ? "Generating..." : "AI Generate"}
        </Button>
      </motion.div>

      {/* Category Filter */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2">
        {categories.map((cat) => (
          <TopicChip key={cat} label={cat} selected={selectedCategory === cat} onClick={() => handleCategoryChange(cat)} />
        ))}
      </motion.div>

      {/* Difficulty Filter */}
      <div className="flex items-center gap-2">
        <Filter className="w-4 h-4 text-st-text-muted" />
        {difficulties.map((diff) => (
          <TopicChip key={diff} label={diff} selected={selectedDifficulty === diff} onClick={() => handleDifficultyChange(diff)} />
        ))}
      </div>

      {/* Questions List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => <CardSkeleton key={i} />)}
        </div>
      ) : questions.length === 0 ? (
        <EmptyState
          icon={Sparkles}
          title="No questions found"
          description={searchQuery ? "Try different search terms or filters" : "Select a category to browse questions"}
        />
      ) : (
        <motion.div layout className="space-y-3">
          <p className="text-xs text-st-text-muted">{totalCount} questions found</p>
          {questions.map((q) => (
            <QuestionCard key={q.id} question={q} onSave={handleSave} isSaved={savedIds.has(q.id)} />
          ))}
        </motion.div>
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}
