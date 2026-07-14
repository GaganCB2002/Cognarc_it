"use client";

import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { CardSkeleton } from "@/components/interview-hub/LoadingSkeleton";
import api from "@/lib/api";
import {
  MessageSquare,
  Sparkles,
  Send,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  XCircle,
  TriangleAlert,
  Lightbulb,
  ArrowRight,
  BookOpen,
  RotateCcw,
  HelpCircle,
  BarChart3,
} from "lucide-react";

const TOPICS = [
  "Data Structures", "Algorithms", "System Design", "JavaScript",
  "React", "Node.js", "Python", "Java", "SQL", "MongoDB",
  "AWS", "Docker", "Kubernetes", "Git", "OOP", "REST API",
  "GraphQL", "Microservices", "Testing", "Security",
];

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Expert"];

interface EvaluationResult {
  score: number;
  strengths: string[];
  weaknesses: string[];
  correctConcepts: string[];
  missingConcepts: string[];
  improvement: string;
  sampleAnswer: string;
}

interface QuestionData {
  question: string;
  type: string;
  topics: string[];
  difficulty: string;
}

export default function AskAnswerPage() {
  const [topic, setTopic] = useState("System Design");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [loading, setLoading] = useState(false);
  const [evaluating, setEvaluating] = useState(false);
  const [question, setQuestion] = useState<QuestionData | null>(null);
  const [userAnswer, setUserAnswer] = useState("");
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [history, setHistory] = useState<{ question: QuestionData; answer: string; evaluation: EvaluationResult }[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const [expandedHistory, setExpandedHistory] = useState<number | null>(null);
  const answerRef = useRef<HTMLDivElement>(null);

  const generateQuestion = async () => {
    setLoading(true);
    setQuestion(null);
    setUserAnswer("");
    setEvaluation(null);
    try {
      const res = await api.post("/interview/questions/generate", {
        category: topic,
        difficulty,
        count: 1,
        type: "mixed",
      });
      const data = res as { questions?: QuestionData[] };
      if (data?.questions?.[0]) {
        setQuestion(data.questions[0]);
      } else {
        setQuestion({
          question: `Explain ${topic} concepts and their real-world applications in software engineering.`,
          type: "Theory",
          topics: [topic],
          difficulty,
        });
      }
    } catch {
      setQuestion({
        question: `What are the key principles of ${topic} and how would you apply them in a production environment?`,
        type: "Theory",
        topics: [topic],
        difficulty,
      });
    } finally {
      setLoading(false);
    }
  };

  const evaluateAnswer = async () => {
    if (!question || !userAnswer.trim()) return;
    setEvaluating(true);
    try {
      const prompt = `Evaluate this interview answer and return ONLY valid JSON:
{
  "score": 0-100,
  "strengths": ["strength1", "strength2"],
  "weaknesses": ["weakness1", "weakness2"],
  "correctConcepts": ["concept1", "concept2"],
  "missingConcepts": ["concept1", "concept2"],
  "improvement": "How to improve this answer",
  "sampleAnswer": "A model answer"
}

Question: "${question.question}"
User's Answer: "${userAnswer}"
Difficulty: ${difficulty}
Topic: ${topic}`;

      const res = await api.post<{ result?: { answer?: string } }>("/interview/ask", { question: prompt });
      const result = res?.result;

      if (result && result.answer) {
        let parsed: EvaluationResult;
        try {
          parsed = JSON.parse(result.answer);
        } catch {
          parsed = {
            score: Math.floor(Math.random() * 40) + 40,
            strengths: ["Attempted to answer"],
            weaknesses: ["Could not parse structured feedback"],
            correctConcepts: result.answer ? [topic] : [],
            missingConcepts: ["Detailed evaluation unavailable"],
            improvement: result.answer || "Review the topic thoroughly",
            sampleAnswer: "A comprehensive answer covering key concepts, real-world examples, and best practices.",
          };
        }
        setEvaluation(parsed);
        setHistory(prev => [...prev, { question: question, answer: userAnswer, evaluation: parsed }]);
      }
    } catch {
      setEvaluation({
        score: 65,
        strengths: ["You provided an answer"],
        weaknesses: ["Evaluation service unavailable"],
        correctConcepts: [topic],
        missingConcepts: ["Could not verify completeness"],
        improvement: "Review the topic and practice more",
        sampleAnswer: `A strong answer for "${topic}" should cover core concepts, use cases, trade-offs, and real-world examples.`,
      });
    } finally {
      setEvaluating(false);
    }
  };

  const resetAll = () => {
    setQuestion(null);
    setUserAnswer("");
    setEvaluation(null);
  };

  useEffect(() => {
    if (evaluation && answerRef.current) {
      answerRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [evaluation]);

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-2 mb-1">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[10px] font-semibold text-purple-400 uppercase tracking-wider">
            <Sparkles className="w-3 h-3" />
            Ask & Answer
          </span>
        </div>
        <h1 className="text-2xl font-bold text-st-text-primary tracking-tight">Practice Interview Questions</h1>
        <p className="text-sm text-st-text-secondary mt-0.5">Get asked questions, type your answer, and receive AI-powered evaluation</p>
      </motion.div>

      {/* Topic & Difficulty Selection */}
      <Card className="p-5 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <label className="text-xs font-medium text-st-text-muted mb-1.5 block">Topic</label>
            <div className="flex flex-wrap gap-1.5">
              {TOPICS.map(t => (
                <button key={t} onClick={() => { setTopic(t); resetAll(); }}
                  className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                    topic === t ? "bg-st-accent text-black" : "bg-st-bg-elevated text-st-text-secondary hover:text-st-text-primary border border-st-border"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="sm:w-40">
            <label className="text-xs font-medium text-st-text-muted mb-1.5 block">Difficulty</label>
            <div className="flex gap-1.5">
              {DIFFICULTIES.map(d => (
                <button key={d} onClick={() => { setDifficulty(d); resetAll(); }}
                  className={`flex-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors text-center ${
                    difficulty === d ? "bg-st-accent text-black" : "bg-st-bg-elevated text-st-text-secondary hover:text-st-text-primary border border-st-border"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>
        </div>
        <Button onClick={generateQuestion} disabled={loading} className="w-full sm:w-auto">
          {loading ? (
            <>Generating...</>
          ) : question ? (
            <><RefreshCw className="w-4 h-4 mr-2" /> New Question</>
          ) : (
            <><Sparkles className="w-4 h-4 mr-2" /> Generate Question</>
          )}
        </Button>
      </Card>

      {loading && <CardSkeleton />}

      {/* Question Display */}
      <AnimatePresence mode="wait">
        {question && !loading && (
          <motion.div key="question" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Card className={`p-6 border-l-4 ${difficulty === "Expert" ? "border-l-red-500" : difficulty === "Advanced" ? "border-l-orange-500" : difficulty === "Intermediate" ? "border-l-yellow-500" : "border-l-emerald-500"}`}>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-st-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                  <HelpCircle className="w-5 h-5 text-st-accent" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-st-bg-elevated text-st-text-secondary border border-st-border">
                      {question.type}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-semibold"
                      style={{
                        backgroundColor: difficulty === "Expert" ? "#fef2f2" : difficulty === "Advanced" ? "#fff7ed" : difficulty === "Intermediate" ? "#fefce8" : "#f0fdf4",
                        color: difficulty === "Expert" ? "#dc2626" : difficulty === "Advanced" ? "#ea580c" : difficulty === "Intermediate" ? "#ca8a04" : "#16a34a"
                      }}
                    >
                      {difficulty}
                    </span>
                  </div>
                  <h2 className="text-lg font-semibold text-st-text-primary leading-relaxed">{question.question}</h2>
                  {question.topics && (
                    <div className="flex flex-wrap gap-1.5 mt-3">
                      {question.topics.map(t => (
                        <span key={t} className="px-2 py-0.5 rounded-full text-[10px] bg-st-bg-elevated text-st-text-muted border border-st-border">
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </Card>

            {/* Answer Area */}
            <div className="mt-4 space-y-3" ref={answerRef}>
              <label className="text-sm font-medium text-st-text-primary flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-st-accent" />
                Your Answer
              </label>
              <textarea
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Type your answer here... Be thorough and structured for the best evaluation."
                className="w-full bg-st-bg-card border border-st-border rounded-xl p-4 text-st-text-primary focus:outline-none focus:border-st-accent/50 transition-colors min-h-[200px] resize-y text-sm leading-relaxed"
                disabled={!!evaluation}
              />
              {!evaluation ? (
                <div className="flex gap-3">
                  <Button onClick={evaluateAnswer} disabled={evaluating || !userAnswer.trim()}>
                    {evaluating ? (
                      <>Evaluating...</>
                    ) : (
                      <><Send className="w-4 h-4 mr-2" /> Submit Answer</>
                    )}
                  </Button>
                  <Button variant="outline" onClick={generateQuestion} disabled={loading}>
                    <RotateCcw className="w-4 h-4 mr-2" /> Skip
                  </Button>
                </div>
              ) : (
                <Button variant="ghost" onClick={() => { setEvaluation(null); setUserAnswer(""); }}>
                  <RefreshCw className="w-4 h-4 mr-2" /> Try Again
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Evaluation Result */}
      <AnimatePresence>
        {evaluation && (
          <motion.div key="evaluation" initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Score */}
            <Card className="p-6 bg-gradient-to-br from-st-accent/[0.05] to-transparent border-st-accent/15">
              <div className="flex items-center gap-6">
                <div className="relative w-20 h-20">
                  <svg className="w-20 h-20 -rotate-90" viewBox="0 0 72 72">
                    <circle cx="36" cy="36" r="30" fill="none" stroke="var(--color-st-border)" strokeWidth="4" />
                    <circle cx="36" cy="36" r="30" fill="none" stroke="var(--color-st-accent)" strokeWidth="4"
                      strokeDasharray={`${(evaluation.score / 100) * 188.5} 188.5`} strokeLinecap="round" />
                  </svg>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-2xl font-bold text-st-text-primary">{evaluation.score}</span>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-st-text-primary">Evaluation Score</h3>
                  <p className="text-sm text-st-text-secondary">
                    {evaluation.score >= 80 ? "Excellent! You have a strong understanding." :
                     evaluation.score >= 60 ? "Good job! Some areas to improve." :
                     evaluation.score >= 40 ? "Fair attempt. Review the concepts below." :
                     "Needs improvement. Focus on the fundamentals."}
                  </p>
                </div>
              </div>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Strengths */}
              <Card className="p-5 border-emerald-500/20 bg-emerald-500/[0.03]">
                <div className="flex items-center gap-2 mb-3">
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  <h4 className="text-sm font-semibold text-emerald-400">Strengths</h4>
                </div>
                <ul className="space-y-1.5">
                  {evaluation.strengths.map((s, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-st-text-secondary">
                      <span className="text-emerald-400 mt-0.5">+</span>
                      {s}
                    </li>
                  ))}
                  {evaluation.correctConcepts.map((c, i) => (
                    <li key={`cc-${i}`} className="flex items-start gap-2 text-xs text-st-text-secondary">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
                      {c}
                    </li>
                  ))}
                </ul>
              </Card>

              {/* Weaknesses */}
              <Card className="p-5 border-rose-500/20 bg-rose-500/[0.03]">
                <div className="flex items-center gap-2 mb-3">
                  <XCircle className="w-4 h-4 text-rose-400" />
                  <h4 className="text-sm font-semibold text-rose-400">Areas to Improve</h4>
                </div>
                <ul className="space-y-1.5">
                  {evaluation.weaknesses.map((w, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-st-text-secondary">
                      <span className="text-rose-400 mt-0.5">-</span>
                      {w}
                    </li>
                  ))}
                  {evaluation.missingConcepts.map((m, i) => (
                    <li key={`mc-${i}`} className="flex items-start gap-2 text-xs text-st-text-secondary">
                      <TriangleAlert className="w-3 h-3 text-rose-400 mt-0.5 shrink-0" />
                      {m}
                    </li>
                  ))}
                </ul>
              </Card>
            </div>

            {/* Improvement */}
            <Card className="p-5 border-blue-500/20 bg-blue-500/[0.03]">
              <div className="flex items-center gap-2 mb-3">
                <Lightbulb className="w-4 h-4 text-blue-400" />
                <h4 className="text-sm font-semibold text-blue-400">How to Improve</h4>
              </div>
              <p className="text-sm text-st-text-secondary leading-relaxed">{evaluation.improvement}</p>
            </Card>

            {/* Sample Answer */}
            <Card className="p-5 border-purple-500/20 bg-purple-500/[0.03]">
              <div className="flex items-center gap-2 mb-3">
                <BookOpen className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-semibold text-purple-400">Model Answer</h4>
              </div>
              <p className="text-sm text-st-text-secondary leading-relaxed whitespace-pre-wrap">{evaluation.sampleAnswer}</p>
            </Card>

            <div className="flex gap-3">
              <Button onClick={() => { setEvaluation(null); setUserAnswer(""); }} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" /> Answer Again
              </Button>
              <Button onClick={generateQuestion} disabled={loading}>
                <ArrowRight className="w-4 h-4 mr-2" /> Next Question
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* History */}
      {history.length > 0 && (
        <Card className="p-5">
          <button onClick={() => setShowHistory(!showHistory)} className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <BarChart3 className="w-4 h-4 text-st-accent" />
              <h3 className="text-sm font-semibold text-st-text-primary">Practice History ({history.length})</h3>
            </div>
            <ChevronRight className={`w-4 h-4 text-st-text-muted transition-transform ${showHistory ? "rotate-90" : ""}`} />
          </button>
          <AnimatePresence>
            {showHistory && (
              <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                <div className="mt-4 space-y-2">
                  {history.map((h, i) => (
                    <div key={i}>
                      <button onClick={() => setExpandedHistory(expandedHistory === i ? null : i)} className="flex items-center gap-3 p-3 rounded-lg bg-st-bg-elevated border border-st-border hover:border-st-accent/30 transition-colors w-full text-left">
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${
                          h.evaluation.score >= 70 ? "bg-emerald-500/10 text-emerald-400" :
                          h.evaluation.score >= 40 ? "bg-yellow-500/10 text-yellow-400" :
                          "bg-rose-500/10 text-rose-400"}`}>
                          {h.evaluation.score}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-st-text-primary truncate">{h.question.question}</p>
                          <p className="text-[10px] text-st-text-muted">{h.question.topics?.[0] || topic} - {h.question.difficulty}</p>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-st-text-muted shrink-0 transition-transform ${expandedHistory === i ? "rotate-90" : ""}`} />
                      </button>
                      <AnimatePresence>
                        {expandedHistory === i && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                            <div className="ml-11 mt-2 space-y-3 pb-2">
                              <div className="p-3 rounded-lg bg-st-bg-secondary border border-st-border">
                                <p className="text-[10px] font-semibold text-st-text-muted uppercase mb-1.5">Your Answer</p>
                                <p className="text-xs text-st-text-primary leading-relaxed whitespace-pre-wrap">{h.answer}</p>
                              </div>
                              {h.evaluation.strengths.length > 0 && (
                                <div className="p-3 rounded-lg bg-emerald-500/[0.03] border border-emerald-500/20">
                                  <p className="text-[10px] font-semibold text-emerald-400 uppercase mb-1.5">Strengths</p>
                                  <ul className="space-y-0.5">
                                    {h.evaluation.strengths.map((s, si) => (
                                      <li key={si} className="text-xs text-st-text-secondary flex items-start gap-1.5">
                                        <span className="text-emerald-400 mt-0.5">+</span> {s}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              {h.evaluation.weaknesses.length > 0 && (
                                <div className="p-3 rounded-lg bg-rose-500/[0.03] border border-rose-500/20">
                                  <p className="text-[10px] font-semibold text-rose-400 uppercase mb-1.5">Weaknesses</p>
                                  <ul className="space-y-0.5">
                                    {h.evaluation.weaknesses.map((w, wi) => (
                                      <li key={wi} className="text-xs text-st-text-secondary flex items-start gap-1.5">
                                        <span className="text-rose-400 mt-0.5">-</span> {w}
                                      </li>
                                    ))}
                                  </ul>
                                </div>
                              )}
                              <div className="p-3 rounded-lg bg-purple-500/[0.03] border border-purple-500/20">
                                <p className="text-[10px] font-semibold text-purple-400 uppercase mb-1.5">Model Answer</p>
                                <p className="text-xs text-st-text-secondary leading-relaxed whitespace-pre-wrap">{h.evaluation.sampleAnswer}</p>
                              </div>
                              <div className="p-3 rounded-lg bg-blue-500/[0.03] border border-blue-500/20">
                                <p className="text-[10px] font-semibold text-blue-400 uppercase mb-1.5">Improvement</p>
                                <p className="text-xs text-st-text-secondary leading-relaxed">{h.evaluation.improvement}</p>
                              </div>
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>
      )}
    </div>
  );
}
