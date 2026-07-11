"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatsCard } from "@/components/interview-hub/StatsCard";
import { TopicChip } from "@/components/interview-hub/TopicChip";

import { Loader2 } from "lucide-react";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  HelpCircle, CheckCircle2, XCircle, Timer, RotateCcw, Bookmark, BookmarkCheck,
  BarChart3, Clock, ChevronRight, ArrowRight, Target, Calendar, Bell, History,
} from "lucide-react";

type Screen = "start" | "quiz" | "result";

interface MCQ {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  category: string;
  difficulty: string;
}

const categories = ["Technical", "Aptitude", "Logical", "Verbal", "HR"];
const difficulties = ["Beginner", "Intermediate", "Advanced"];

export default function MCQPage() {
  const [screen, setScreen] = useState<Screen>("start");
  const [selectedCategory, setSelectedCategory] = useState("Technical");
  const [selectedDifficulty, setSelectedDifficulty] = useState("Intermediate");
  const [questions, setQuestions] = useState<MCQ[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, number>>({});
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [showExplanation, setShowExplanation] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [quizActive, setQuizActive] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Retake schedule state
  const [retakeScheduled, setRetakeScheduled] = useState<{ date: string; category: string; difficulty: string } | null>(null);
  const [retakeCountdown, setRetakeCountdown] = useState<string>("");
  const [retakeHistory, setRetakeHistory] = useState<{ date: string; category: string; difficulty: string; score: number }[]>([]);
  const [showRetakeReminder, setShowRetakeReminder] = useState(false);
  const [showRetakeHistory, setShowRetakeHistory] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("mcqRetakeSchedule");
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setRetakeScheduled(parsed);
      } catch {}
    }
    const storedHistory = localStorage.getItem("mcqRetakeHistory");
    if (storedHistory) {
      try {
        setRetakeHistory(JSON.parse(storedHistory));
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!retakeScheduled) return;
    const interval = setInterval(() => {
      const target = new Date(retakeScheduled.date).getTime();
      const now = Date.now();
      const diff = target - now;
      if (diff <= 0) {
        setRetakeCountdown("Ready to retake!");
        setShowRetakeReminder(true);
        clearInterval(interval);
      } else {
        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
        const mins = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
        setRetakeCountdown(`${days}d ${hours}h ${mins}m`);
      }
    }, 60000);
    return () => clearInterval(interval);
  }, [retakeScheduled]);

  useEffect(() => {
    if (showRetakeReminder) {
      const timer = setTimeout(() => setShowRetakeReminder(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [showRetakeReminder]);

  const scheduleRetake = async () => {
    const retakeDate = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000);
    const schedule = {
      date: retakeDate.toISOString(),
      category: selectedCategory,
      difficulty: selectedDifficulty,
    };
    setRetakeScheduled(schedule);
    localStorage.setItem("mcqRetakeSchedule", JSON.stringify(schedule));
    try {
      await api.post("/interview/schedule-retake", {
        date: schedule.date,
        category: schedule.category,
        difficulty: schedule.difficulty,
      }).catch(() => {});
    } catch {}
    // Add to retake history
    const newEntry = {
      date: new Date().toISOString(),
      category: selectedCategory,
      difficulty: selectedDifficulty,
      score: pct,
    };
    const updatedHistory = [...retakeHistory, newEntry];
    setRetakeHistory(updatedHistory);
    localStorage.setItem("mcqRetakeHistory", JSON.stringify(updatedHistory));
  };

  const current = questions[currentIndex];
  const isAnswered = selectedAnswers[current?.id] !== undefined;
  const isCorrect = isAnswered && selectedAnswers[current?.id] === current?.correctIndex;
  const correctCount = Object.entries(selectedAnswers).filter(([qId, ans]) => {
    const q = questions.find(q => q.id === qId);
    return q && ans === q.correctIndex;
  }).length;
  const timeTaken = questions.reduce((acc) => acc + 30, 0) - timeLeft + (questions.length - currentIndex - 1) * 30;

  useEffect(() => {
    if (!quizActive || !current) return;
    if (isAnswered) return;
    const interval = setInterval(() => {
      setTimeLeft(t => {
        if (t <= 1) {
          setSelectedAnswers(prev => ({ ...prev, [current.id]: -1 }));
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [quizActive, current?.id, isAnswered, current]);

  const startQuiz = async () => {
    setGenerating(true);
    setError(null);
    try {
      const data = await api.post<{ mcqs: MCQ[] }>("/interview/mcq/generate", {
        category: selectedCategory,
        difficulty: selectedDifficulty,
        count: 10,
      });
      const mcqs = data.mcqs || [];
      const shuffled = [...mcqs].sort(() => Math.random() - 0.5).slice(0, 10);
      setQuestions(shuffled);
      setCurrentIndex(0);
      setSelectedAnswers({});
      setShowExplanation(false);
      setTimeLeft(30);
      setQuizActive(true);
      setScreen("quiz");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate MCQs");
    } finally {
      setGenerating(false);
    }
  };

  const handleAnswer = (optionIndex: number) => {
    if (isAnswered || !current) return;
    setSelectedAnswers(prev => ({ ...prev, [current.id]: optionIndex }));
    setShowExplanation(true);
    api.post("/interview/mcq/attempt", { mcqId: current.id, selectedAnswer: optionIndex, timeTaken: 30 - timeLeft }).catch(() => {});
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(i => i + 1);
      setShowExplanation(false);
      setTimeLeft(30);
    } else {
      setScreen("result");
      setQuizActive(false);
    }
  };

  const toggleBookmark = async (id: string) => {
    try {
      await api.post("/interview/bookmarks/toggle", { itemType: "mcq", itemId: id });
      setBookmarkedIds(prev => {
        const next = new Set(prev);
        if (next.has(id)) next.delete(id); else next.add(id);
        return next;
      });
    } catch {
      // ignore
    }
  };

  const handleRetry = () => {
    setScreen("start");
    setQuizActive(false);
    setError(null);
  };

  // Start screen
  if (screen === "start") {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold text-st-text-primary tracking-tight">MCQ Practice</h1>
          <p className="text-sm text-st-text-secondary">Test your knowledge with multiple choice questions</p>
        </motion.div>

        <Card className="p-6">
          <div className="text-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-st-accent/10 flex items-center justify-center mx-auto mb-4">
              <HelpCircle className="w-8 h-8 text-st-accent" />
            </div>
            <h2 className="text-lg font-semibold text-st-text-primary mb-2">Configure Your Quiz</h2>
            <p className="text-sm text-st-text-muted">Select category and difficulty level</p>
          </div>

          <div className="space-y-4">
            <div>
              <p className="text-xs font-medium text-st-text-secondary mb-2">Category</p>
              <div className="flex flex-wrap gap-2">
                {categories.map(cat => (
                  <TopicChip key={cat} label={cat} selected={selectedCategory === cat} onClick={() => setSelectedCategory(cat)} />
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs font-medium text-st-text-secondary mb-2">Difficulty</p>
              <div className="flex flex-wrap gap-2">
                {difficulties.map(diff => (
                  <TopicChip key={diff} label={diff} selected={selectedDifficulty === diff} onClick={() => setSelectedDifficulty(diff)} />
                ))}
              </div>
            </div>
            {error && (
              <p className="text-xs text-st-danger text-center">{error}</p>
            )}
            <Button variant="primary" size="lg" className="w-full mt-4" onClick={startQuiz} disabled={generating}>
              {generating ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Target className="w-4 h-4 mr-2" />}
              {generating ? "Generating..." : "Start Practice"}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Quiz screen
  if (screen === "quiz" && current) {
    return (
      <div className="max-w-3xl mx-auto space-y-4 pb-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Question {currentIndex + 1}/{questions.length}</Badge>
            <Badge variant={current.difficulty === "Advanced" ? "danger" : current.difficulty === "Intermediate" ? "warning" : "success"}>{current.difficulty}</Badge>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-sm">
              <Timer className="w-4 h-4 text-st-accent" />
              <span className={`font-mono font-medium ${timeLeft <= 5 ? "text-st-danger" : "text-st-text-primary"}`}>{timeLeft}s</span>
            </div>
            <button onClick={() => toggleBookmark(current.id)} className="p-1.5 rounded-lg hover:bg-st-bg-elevated transition-colors">
              {bookmarkedIds.has(current.id) ? (
                <BookmarkCheck className="w-4 h-4 text-st-accent" />
              ) : (
                <Bookmark className="w-4 h-4 text-st-text-muted" />
              )}
            </button>
          </div>
        </motion.div>

        {/* Progress bar */}
        <div className="w-full h-1 bg-st-bg-elevated rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-st-accent transition-all duration-300" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }} />
        </div>

        <Card className="p-6">
          <h3 className="text-base font-medium text-st-text-primary mb-4 leading-relaxed">{current.question}</h3>
          <div className="space-y-2">
            {current.options.map((option, idx) => {
              const letter = String.fromCharCode(65 + idx);
              let optionState: "default" | "selected" | "correct" | "wrong" = "default";
              if (isAnswered) {
                if (idx === current.correctIndex) optionState = "correct";
                else if (idx === selectedAnswers[current.id]) optionState = "wrong";
                else if (selectedAnswers[current.id] === -1 && idx === current.correctIndex) optionState = "correct";
              } else if (selectedAnswers[current.id] === idx) {
                optionState = "selected";
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswer(idx)}
                  disabled={isAnswered}
                  className={cn(
                    "w-full text-left p-3.5 rounded-xl border transition-all flex items-center gap-3",
                    optionState === "default" && "bg-st-bg-elevated/50 border-st-border hover:border-st-accent/30 hover:bg-st-bg-elevated cursor-pointer",
                    optionState === "selected" && "bg-st-accent/10 border-st-accent/30",
                    optionState === "correct" && "bg-st-success-bg border-st-success/30",
                    optionState === "wrong" && "bg-st-danger-bg border-st-danger/30",
                    isAnswered && "cursor-default"
                  )}
                >
                  <span className={cn(
                    "w-7 h-7 rounded-lg flex items-center justify-center text-xs font-medium shrink-0",
                    optionState === "default" && "bg-st-bg-card text-st-text-secondary",
                    optionState === "selected" && "bg-st-accent/20 text-st-accent",
                    optionState === "correct" && "bg-st-success/20 text-st-success",
                    optionState === "wrong" && "bg-st-danger/20 text-st-danger",
                  )}>{letter}</span>
                  <span className={cn(
                    "text-sm",
                    optionState === "correct" && "text-st-success",
                    optionState === "wrong" && "text-st-danger",
                    (optionState === "selected" || optionState === "default") && "text-st-text-primary"
                  )}>{option}</span>
                  {optionState === "correct" && <CheckCircle2 className="w-4 h-4 text-st-success ml-auto shrink-0" />}
                  {optionState === "wrong" && <XCircle className="w-4 h-4 text-st-danger ml-auto shrink-0" />}
                </button>
              );
            })}
          </div>

          <AnimatePresence>
            {showExplanation && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden"
              >
                <div className={cn("p-3 rounded-xl mt-3 text-sm leading-relaxed", isCorrect ? "bg-st-success-bg border border-st-success/20 text-st-success" : "bg-st-danger-bg border border-st-danger/20 text-st-danger")}>
                  <p className="font-medium mb-1">{isCorrect ? "Correct!" : selectedAnswers[current.id] === -1 ? "Time's up!" : "Incorrect"}</p>
                  <p className="text-st-text-secondary">{current.explanation}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </Card>

        {isAnswered && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Button variant="primary" className="w-full" onClick={handleNext}>
              {currentIndex < questions.length - 1 ? "Next Question" : "See Results"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </motion.div>
        )}
      </div>
    );
  }

  // Result screen
  const pct = questions.length > 0 ? Math.round((correctCount / questions.length) * 100) : 0;
  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Retake Reminder Notification */}
      <AnimatePresence>
        {showRetakeReminder && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-st-accent/10 border border-st-accent/20 rounded-xl p-4 flex items-center gap-3"
          >
            <Bell className="w-5 h-5 text-st-accent shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-st-text-primary">Retake Ready!</p>
              <p className="text-xs text-st-text-secondary">Your scheduled retake is due. Start a new quiz to refresh your knowledge.</p>
            </div>
            <Button variant="primary" size="sm" onClick={() => { setShowRetakeReminder(false); handleRetry(); }}>
              Start Retake
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="p-6 text-center">
          <div className={cn(
            "w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4",
            pct >= 80 ? "bg-st-success-bg" : pct >= 60 ? "bg-st-warning-bg" : "bg-st-danger-bg"
          )}>
            <span className={cn(
              "text-3xl font-bold",
              pct >= 80 ? "text-st-success" : pct >= 60 ? "text-st-warning" : "text-st-danger"
            )}>{pct}%</span>
          </div>
          <h2 className="text-xl font-bold text-st-text-primary mb-1">Quiz Complete!</h2>
          <p className="text-sm text-st-text-muted mb-4">Here&apos;s how you performed</p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatsCard icon={CheckCircle2} label="Correct" value={`${correctCount}/${questions.length}`} color="text-st-success" bg="bg-st-success-bg" />
            <StatsCard icon={XCircle} label="Incorrect" value={`${questions.length - correctCount}`} color="text-st-danger" bg="bg-st-danger-bg" />
            <StatsCard icon={Clock} label="Time" value={`${Math.floor(timeTaken / 60)}m ${timeTaken % 60}s`} color="text-st-accent" bg="bg-st-accent/10" />
          </div>

          {/* Schedule Retake */}
          <div className="mb-4 p-3 rounded-lg bg-st-bg-elevated/50 border border-st-border">
            {retakeScheduled ? (
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-st-accent" />
                  <div className="text-left">
                    <p className="text-xs font-medium text-st-text-primary">Retake Scheduled</p>
                    <p className="text-[10px] text-st-text-muted">Next retake in {retakeCountdown}</p>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => {
                  localStorage.removeItem("mcqRetakeSchedule");
                  setRetakeScheduled(null);
                }}>
                  Clear
                </Button>
              </div>
            ) : (
              <Button variant="outline" size="sm" className="w-full" onClick={scheduleRetake}>
                <Calendar className="w-4 h-4 mr-1.5" />
                Schedule Retake in 15 Days
              </Button>
            )}
          </div>

          <div className="space-y-2 mb-6">
            {questions.map((q) => {
              const ans = selectedAnswers[q.id];
              const correct = ans === q.correctIndex;
              return (
                <div key={q.id} className="flex items-center gap-3 p-2 rounded-lg bg-st-bg-elevated/50 text-left">
                  <div className={cn("w-6 h-6 rounded-lg flex items-center justify-center shrink-0", correct ? "bg-st-success-bg" : "bg-st-danger-bg")}>
                    {correct ? <CheckCircle2 className="w-3 h-3 text-st-success" /> : <XCircle className="w-3 h-3 text-st-danger" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-st-text-primary truncate">{q.question}</p>
                    <p className="text-[10px] text-st-text-muted">Correct: {q.options[q.correctIndex]}</p>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <Button variant="primary" className="flex-1" onClick={handleRetry}>
              <RotateCcw className="w-4 h-4 mr-2" /> Retry Now
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => setScreen("start")}>
              <BarChart3 className="w-4 h-4 mr-2" /> New Quiz
            </Button>
          </div>

          {/* Retake History */}
          {retakeHistory.length > 0 && (
            <div className="mt-4 pt-4 border-t border-st-border/50">
              <button
                onClick={() => setShowRetakeHistory(!showRetakeHistory)}
                className="flex items-center gap-2 text-xs font-medium text-st-text-secondary hover:text-st-text-primary transition-colors mx-auto"
              >
                <History className="w-3.5 h-3.5" />
                Retake History ({retakeHistory.length})
                <ChevronRight className={cn("w-3 h-3 transition-transform", showRetakeHistory && "rotate-90")} />
              </button>
              <AnimatePresence>
                {showRetakeHistory && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden mt-2"
                  >
                    <div className="space-y-1.5">
                      {retakeHistory.slice().reverse().map((entry, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-st-bg-elevated/50 text-xs">
                          <div className="flex items-center gap-2">
                            <span className="text-st-text-primary font-medium">{entry.score}%</span>
                            <span className="text-st-text-muted">{entry.category}</span>
                            <Badge variant="outline" className="text-[9px]">{entry.difficulty}</Badge>
                          </div>
                          <span className="text-st-text-muted text-[10px]">{new Date(entry.date).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </Card>
      </motion.div>
    </div>
  );
}
