"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/interview-hub/SearchInput";
import { TopicChip } from "@/components/interview-hub/TopicChip";
import { DifficultyBadge } from "@/components/interview-hub/DifficultyBadge";
import { Pagination } from "@/components/interview-hub/Pagination";
import { CardSkeleton } from "@/components/interview-hub/LoadingSkeleton";
import { EmptyState } from "@/components/interview-hub/EmptyState";
import api from "@/lib/api";

import {
  Code2, Play, CheckCircle2, XCircle, Loader2, Clock, MemoryStick,
  ArrowLeft, ChevronRight, Sparkles, Terminal, FileCode,
} from "lucide-react";

interface CodingProblem {
  id: string;
  title: string;
  difficulty: string;
  description: string;
  tags: string[];
  acceptance: number;
  sampleTestCases: { input: string; output: string }[];
}

interface SubmitResult {
  passed: number;
  total: number;
  runtime?: number;
  memory?: number;
}

interface AIReviewResult {
  review: string;
}

const difficulties = ["All", "Easy", "Medium", "Hard"];

const languages = [
  { id: "javascript", label: "JavaScript" },
  { id: "python", label: "Python" },
  { id: "java", label: "Java" },
  { id: "cpp", label: "C++" },
  { id: "csharp", label: "C#" },
  { id: "go", label: "Go" },
  { id: "rust", label: "Rust" },
];

const starterCode: Record<string, string> = {
  javascript: "function solution(input) {\n  // Write your code here\n  \n}",
  python: "def solution(input):\n    # Write your code here\n    pass",
  java: "class Solution {\n    public void solution(String input) {\n        // Write your code here\n    }\n}",
  cpp: "#include <iostream>\nusing namespace std;\n\nvoid solution(string input) {\n    // Write your code here\n}",
  csharp: "public class Solution {\n    public void Solution(string input) {\n        // Write your code here\n    }\n}",
  go: "package main\n\nfunc solution(input string) {\n    // Write your code here\n}",
  rust: "fn solution(input: &str) {\n    // Write your code here\n}",
};

export default function CodingPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedDifficulty, setSelectedDifficulty] = useState("All");
  const [selectedProblem, setSelectedProblem] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("javascript");
  const [code, setCode] = useState(starterCode.javascript);
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<SubmitResult | null>(null);
  const [aiReviewLoading, setAiReviewLoading] = useState(false);
  const [aiReview, setAiReview] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [problems, setProblems] = useState<CodingProblem[]>([]);
  const [problem, setProblem] = useState<CodingProblem | null>(null);
  const pageSize = 5;

  const fetchProblems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedDifficulty !== "All") params.set("difficulty", selectedDifficulty);
      if (searchQuery) params.set("search", searchQuery);
      params.set("page", String(currentPage));
      params.set("limit", String(pageSize));
      const data = await api.get<{ problems: CodingProblem[] }>(`/interview/coding?${params.toString()}`);
      setProblems(data.problems || []);
    } catch {
      setProblems([]);
    } finally {
      setLoading(false);
    }
  }, [selectedDifficulty, searchQuery, currentPage]);

  useEffect(() => { fetchProblems(); }, [fetchProblems]);

  const filtered = problems;
  const totalPages = Math.ceil(filtered.length / pageSize);

  const handleSelectProblem = async (id: string) => {
    setSelectedProblem(id);
    setResults(null);
    setAiReview(null);
    setCode(starterCode[selectedLanguage]);
    try {
      const data = await api.get<CodingProblem>(`/interview/coding/${id}`);
      setProblem(data);
    } catch {
      setProblem(null);
    }
  };

  const handleLanguageChange = (lang: string) => {
    setSelectedLanguage(lang);
    if (!code || code === starterCode[selectedLanguage]) {
      setCode(starterCode[lang]);
    }
  };

  const handleRun = async () => {
    setRunning(true);
    setResults(null);
    try {
      const data = await api.post<SubmitResult>(`/interview/coding/${selectedProblem}/submit`, { code, language: selectedLanguage });
      setResults(data);
    } catch {
      setResults({ passed: 0, total: 0 });
    } finally {
      setRunning(false);
    }
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setResults(null);
    try {
      const data = await api.post<SubmitResult>(`/interview/coding/${selectedProblem}/submit`, { code, language: selectedLanguage });
      setResults(data);
    } catch {
      setResults({ passed: 0, total: 0 });
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiReview = async () => {
    if (!problem) return;
    setAiReviewLoading(true);
    setAiReview(null);
    try {
      const data = await api.post<AIReviewResult>("/interview/coding/review", {
        code,
        language: selectedLanguage,
        problemDescription: problem.description,
      });
      setAiReview(data.review);
    } catch {
      setAiReview("**Error:** Failed to get AI review. Please try again.");
    } finally {
      setAiReviewLoading(false);
    }
  };

  if (selectedProblem && problem) {
    return (
      <div className="h-full flex flex-col space-y-4">
        <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-3">
          <button onClick={() => { setSelectedProblem(null); setProblem(null); }} className="p-1.5 rounded-lg hover:bg-st-bg-elevated transition-colors">
            <ArrowLeft className="w-4 h-4 text-st-text-muted" />
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-bold text-st-text-primary">{problem.title}</h1>
              <DifficultyBadge level={problem.difficulty} />
            </div>
            <div className="flex items-center gap-2 text-xs text-st-text-muted">
              <span>{problem.tags.join(", ")}</span>
              <span>&middot;</span>
              <span>{problem.acceptance}% acceptance</span>
            </div>
          </div>
        </motion.div>

        <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-4 min-h-0">
          {/* Problem Panel */}
          <div className="flex flex-col gap-3 overflow-y-auto">
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-st-text-primary mb-2">Description</h3>
              <p className="text-sm text-st-text-secondary leading-relaxed">{problem.description}</p>
            </Card>
            <Card className="p-4">
              <h3 className="text-sm font-semibold text-st-text-primary mb-2">Sample Test Cases</h3>
              <div className="space-y-2">
                {problem.sampleTestCases.map((tc, i) => (
                  <div key={i} className="p-3 rounded-lg bg-st-bg-elevated text-xs space-y-1">
                    <p><span className="text-st-text-muted">Input:</span> <span className="text-st-text-primary font-mono">{tc.input}</span></p>
                    <p><span className="text-st-text-muted">Output:</span> <span className="text-st-text-primary font-mono">{tc.output}</span></p>
                  </div>
                ))}
              </div>
            </Card>
            {results && (
              <Card className="p-4">
                <h3 className="text-sm font-semibold text-st-text-primary mb-2">Results</h3>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <span className={results.passed === results.total ? "text-st-success" : "text-st-warning"}>
                      {results.passed === results.total ? <CheckCircle2 className="w-4 h-4" /> : <XCircle className="w-4 h-4" />}
                    </span>
                    <span className="text-st-text-primary">{results.passed}/{results.total} test cases passed</span>
                  </div>
                  {results.runtime && (
                    <div className="flex items-center gap-2 text-xs text-st-text-muted">
                      <Clock className="w-3 h-3" /> Runtime: {results.runtime.toFixed(1)}ms
                      <MemoryStick className="w-3 h-3 ml-2" /> Memory: {results.memory?.toFixed(1)}MB
                    </div>
                  )}
                </div>
              </Card>
            )}
            {aiReview && (
              <Card className="p-4 border-st-accent/20">
                <h3 className="text-sm font-semibold text-st-accent mb-2 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4" /> AI Code Review
                </h3>
                <div className="text-sm text-st-text-secondary leading-relaxed [&_strong]:text-st-accent whitespace-pre-wrap">{aiReview}</div>
              </Card>
            )}
          </div>

          {/* Code Editor Panel */}
          <div className="flex flex-col gap-3">
            {/* Language selector */}
            <div className="flex items-center gap-2 flex-wrap">
              {languages.map(lang => (
                <TopicChip key={lang.id} label={lang.label} selected={selectedLanguage === lang.id} onClick={() => handleLanguageChange(lang.id)} />
              ))}
            </div>

            {/* Code editor */}
            <div className="flex-1 bg-st-bg-elevated border border-st-border rounded-xl overflow-hidden flex flex-col">
              <div className="flex items-center justify-between px-4 py-2 bg-st-bg-card border-b border-st-border">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-st-accent" />
                  <span className="text-xs text-st-text-muted font-mono">solution.{selectedLanguage}</span>
                </div>
              </div>
              <textarea
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="flex-1 w-full bg-st-bg-primary p-4 text-sm font-mono text-st-text-primary placeholder:text-st-text-muted focus:outline-none resize-none"
                style={{ tabSize: 2 }}
                spellCheck={false}
              />
            </div>

            {/* Action buttons */}
            <div className="flex items-center gap-3">
              <Button variant="secondary" size="sm" onClick={handleRun} disabled={running}>
                {running ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Play className="w-4 h-4 mr-1.5" />}
                Run
              </Button>
              <Button variant="primary" size="sm" onClick={handleSubmit} disabled={submitting}>
                {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Terminal className="w-4 h-4 mr-1.5" />}
                Submit
              </Button>
              <Button variant="outline" size="sm" onClick={handleAiReview} disabled={aiReviewLoading} className="ml-auto">
                {aiReviewLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Sparkles className="w-4 h-4 mr-1.5" />}
                AI Review
              </Button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Problem list view
  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-st-text-primary tracking-tight">Coding Practice</h1>
        <p className="text-sm text-st-text-secondary">Solve coding problems and improve your skills</p>
      </motion.div>

      <SearchInput
        value={searchQuery}
        onChange={(v) => { setSearchQuery(v); setCurrentPage(1); }}
        placeholder="Search problems..."
      />

      <div className="flex items-center gap-2">
        {difficulties.map(d => (
          <TopicChip key={d} label={d} selected={selectedDifficulty === d} onClick={() => { setSelectedDifficulty(d); setCurrentPage(1); }} />
        ))}
      </div>

      {loading ? (
        <div className="space-y-2">{[1,2,3].map(i => <CardSkeleton key={i} />)}</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((prob, i) => (
            <motion.div
              key={prob.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
            >
              <Card
                className="p-4 hover:border-st-accent/20 transition-all duration-200 cursor-pointer card-hover"
                onClick={() => handleSelectProblem(prob.id)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Code2 className="w-4 h-4 text-st-accent shrink-0" />
                      <h3 className="text-sm font-medium text-st-text-primary truncate">{prob.title}</h3>
                      <DifficultyBadge level={prob.difficulty} />
                    </div>
                    <div className="flex items-center gap-3 text-xs text-st-text-muted">
                      <span>{prob.tags.join(", ")}</span>
                      <span>&middot;</span>
                      <span>{prob.acceptance}% acceptance</span>
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-st-text-muted shrink-0" />
                </div>
              </Card>
            </motion.div>
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <EmptyState icon={Code2} title="No problems found" description="Try different search or filter" />
      )}

      <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
    </div>
  );
}
