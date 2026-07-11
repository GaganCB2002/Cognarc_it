"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { StatsCard } from "@/components/interview-hub/StatsCard";
import { TopicChip } from "@/components/interview-hub/TopicChip";
import { CardSkeleton, ListSkeleton } from "@/components/interview-hub/LoadingSkeleton";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import { useAuth } from "@/lib/auth-context";
import {
  Users, Timer, MessageSquare, RotateCcw,
  ArrowRight, Target, History,
  Brain, TrendingUp, Loader2, FileText,
  BookOpen, Save, Upload, AlertCircle,
  CheckCircle2, BarChart3, ClipboardList, File,
  Sparkles,
} from "lucide-react";

type Screen = "setup" | "interview" | "feedback";
type SetupTab = "profile" | "start";
type InterviewType = "Technical" | "HR" | "Behavioral";

interface QuestionResult {
  question: string;
  answer: string;
  scores: { technical: number; communication: number; confidence: number };
  feedback: string;
}

interface MockStartResponse {
  sessionId: string;
  questions: string[];
}

interface MockAnswerResponse {
  result: QuestionResult;
}

interface MockResultResponse {
  results: QuestionResult[];
  overallFeedback: string;
  averageScore: number;
}

interface SessionHistoryItem {
  id: string;
  type: string;
  score: number;
  createdAt: string;
}

interface NoteItem {
  id: string;
  title?: string;
  content?: string;
  createdAt?: string;
}

interface DocumentItem {
  id: string;
  fileName?: string;
  originalName?: string;
  url?: string;
  createdAt?: string;
}

export default function MockInterviewPage() {
  const { user, refreshUser } = useAuth();

  const [screen, setScreen] = useState<Screen>("setup");
  const [setupTab, setSetupTab] = useState<SetupTab>("profile");

  const [resume, setResume] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaveMsg, setProfileSaveMsg] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const [notes, setNotes] = useState<NoteItem[]>([]);
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingDocs, setLoadingDocs] = useState(false);

  const [interviewType, setInterviewType] = useState<InterviewType>("Technical");
  const [difficulty, setDifficulty] = useState("Intermediate");
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [questions, setQuestions] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [timeLeft, setTimeLeft] = useState(120);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [results, setResults] = useState<QuestionResult[]>([]);
  const [overallFeedback, setOverallFeedback] = useState<string | null>(null);
  const [averageScore, setAverageScore] = useState(0);
  const [showHistory, setShowHistory] = useState(false);
  const [sessionHistory, setSessionHistory] = useState<SessionHistoryItem[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [starting, setStarting] = useState(false);

  const current = questions[currentIndex];
  const progress = questions.length > 0
    ? ((currentIndex + (screen === "feedback" ? questions.length : 0)) / questions.length) * 100
    : 0;

  useEffect(() => {
    if (user?.profile) {
      const p = user.profile as Record<string, string | undefined>;
      if (p.resume) setResume(p.resume);
      if (p.jobDescription) setJobDescription(p.jobDescription);
    }
  }, [user]);

  useEffect(() => {
    if (!isTimerRunning || timeLeft <= 0) return;
    const interval = setInterval(() => setTimeLeft(t => t - 1), 1000);
    return () => clearInterval(interval);
  }, [isTimerRunning, timeLeft]);

  useEffect(() => {
    if (setupTab === "profile") {
      fetchNotes();
      fetchDocuments();
    }
  }, [setupTab]);

  const fetchNotes = async () => {
    setLoadingNotes(true);
    try {
      const data = await api.get<NoteItem[] | { notes?: NoteItem[]; data?: NoteItem[] }>("/notes");
      if (Array.isArray(data)) {
        setNotes(data);
      } else if (data.notes) {
        setNotes(data.notes);
      } else if (data.data) {
        setNotes(data.data);
      } else {
        setNotes([]);
      }
    } catch {
      setNotes([]);
    } finally {
      setLoadingNotes(false);
    }
  };

  const fetchDocuments = async () => {
    setLoadingDocs(true);
    try {
      const data = await api.get<DocumentItem[] | { files?: DocumentItem[]; data?: DocumentItem[] }>("/upload/my-files");
      if (Array.isArray(data)) {
        setDocuments(data);
      } else if (data.files) {
        setDocuments(data.files);
      } else if (data.data) {
        setDocuments(data.data);
      } else {
        setDocuments([]);
      }
    } catch {
      setDocuments([]);
    } finally {
      setLoadingDocs(false);
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    setProfileSaveMsg(null);
    try {
      await api.put("/auth/profile", { resume, jobDescription });
      setProfileSaveMsg({ type: "success", text: "Profile saved successfully!" });
      await refreshUser();
    } catch {
      setProfileSaveMsg({ type: "error", text: "Failed to save profile. Please try again." });
    } finally {
      setSavingProfile(false);
    }
  };

  const hasProfileData = resume.trim().length > 0 && jobDescription.trim().length > 0;

  const fetchHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await api.get<SessionHistoryItem[]>("/interview/conversations?type=mock");
      setSessionHistory(data || []);
    } catch {
      setSessionHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  };

  const startInterview = async () => {
    if (!hasProfileData) return;
    setStarting(true);
    try {
      const data = await api.post<MockStartResponse>("/interview/mock/start", {
        type: interviewType,
        difficulty,
      });
      setSessionId(data.sessionId);
      setQuestions(data.questions || []);
      setCurrentIndex(0);
      setAnswer("");
      setResults([]);
      setOverallFeedback(null);
      setTimeLeft(120);
      setIsTimerRunning(true);
      setScreen("interview");
    } catch {
      // ignore
    } finally {
      setStarting(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answer.trim() && timeLeft > 0) return;
    if (submitting || !sessionId) return;
    setSubmitting(true);
    setIsTimerRunning(false);

    try {
      const data = await api.post<MockAnswerResponse>(`/interview/mock/${sessionId}/answer`, {
        answer: answer.trim() || "(time expired)",
      });
      const result = data.result;
      setResults(prev => [...prev, result]);
      setAnswer("");

      if (currentIndex < questions.length - 1) {
        setCurrentIndex(i => i + 1);
        setTimeLeft(120);
        setIsTimerRunning(true);
      } else {
        const resultData = await api.get<MockResultResponse>(`/interview/mock/${sessionId}/result`);
        setOverallFeedback(resultData.overallFeedback);
        setAverageScore(resultData.averageScore || 0);
        setScreen("feedback");
      }
    } catch {
      // ignore
    } finally {
      setSubmitting(false);
    }
  };

  const handleRetry = () => {
    setScreen("setup");
    setSetupTab("start");
    setShowHistory(false);
    setSessionId(null);
  };

  const renderRingChart = (score: number, size = 120, strokeWidth = 10) => {
    const radius = (size - strokeWidth) / 2;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (score / 100) * circumference;
    const color = score >= 80 ? "#22c55e" : score >= 65 ? "#f59e0b" : "#ef4444";

    return (
      <svg width={size} height={size} className="transform -rotate-90">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="rgb(30 30 40 / 0.5)" strokeWidth={strokeWidth} />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none" stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circumference} strokeDashoffset={offset}
          strokeLinecap="round"
          className="transition-all duration-1000 ease-out"
        />
      </svg>
    );
  };

  if (screen === "setup") {
    return (
      <div className="max-w-3xl mx-auto space-y-6 pb-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl font-bold text-st-text-primary tracking-tight">Mock Interview</h1>
          <p className="text-sm text-st-text-secondary">Practice with AI-powered mock interviews personalized to you</p>
        </motion.div>

        <div className="flex gap-1 p-1 rounded-xl bg-st-bg-elevated border border-st-border">
          <button
            onClick={() => setSetupTab("profile")}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all cursor-pointer",
              setupTab === "profile"
                ? "bg-st-bg-card text-st-text-primary shadow-sm"
                : "text-st-text-muted hover:text-st-text-secondary"
            )}
          >
            <FileText className="w-4 h-4 inline-block mr-2" />
            Profile
          </button>
          <button
            onClick={() => setSetupTab("start")}
            className={cn(
              "flex-1 py-2.5 px-4 rounded-lg text-sm font-medium transition-all cursor-pointer",
              setupTab === "start"
                ? "bg-st-bg-card text-st-text-primary shadow-sm"
                : "text-st-text-muted hover:text-st-text-secondary"
            )}
          >
            <Target className="w-4 h-4 inline-block mr-2" />
            Start Interview
          </button>
        </div>

        <AnimatePresence mode="wait">
          {setupTab === "profile" && (
            <motion.div key="profile" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              <Card className="p-5">
                <h3 className="text-sm font-semibold text-st-text-primary mb-1 flex items-center gap-2">
                  <FileText className="w-4 h-4 text-st-accent" />
                  Your Resume
                </h3>
                <p className="text-xs text-st-text-muted mb-3">Paste your resume in markdown format. This will be used to personalize your interview questions.</p>
                <textarea
                  value={resume}
                  onChange={e => setResume(e.target.value)}
                  placeholder={`Paste your resume here...\n\nExample:\n# John Doe\n## Experience\n- Senior Developer at ACME Corp (2020-present)\n- ...`}
                  className="w-full bg-st-bg-elevated border border-st-border rounded-xl p-4 text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none focus:border-st-accent/50 transition-colors resize-none min-h-[200px] font-mono"
                />
              </Card>

              <Card className="p-5">
                <h3 className="text-sm font-semibold text-st-text-primary mb-1 flex items-center gap-2">
                  <ClipboardList className="w-4 h-4 text-st-accent" />
                  Job Description
                </h3>
                <p className="text-xs text-st-text-muted mb-3">Paste the job description to tailor questions to the role.</p>
                <textarea
                  value={jobDescription}
                  onChange={e => setJobDescription(e.target.value)}
                  placeholder={`Paste the job description here...\n\nExample:\n## Requirements\n- 5+ years experience in React\n- ...`}
                  className="w-full bg-st-bg-elevated border border-st-border rounded-xl p-4 text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none focus:border-st-accent/50 transition-colors resize-none min-h-[200px] font-mono"
                />
              </Card>

              <div className="flex items-center gap-3">
                <Button variant="primary" size="lg" onClick={saveProfile} disabled={savingProfile}>
                  {savingProfile ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
                  {savingProfile ? "Saving..." : "Save Profile"}
                </Button>
                {profileSaveMsg && (
                  <span className={cn("text-xs flex items-center gap-1", profileSaveMsg.type === "success" ? "text-st-success" : "text-st-danger")}>
                    {profileSaveMsg.type === "success" ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertCircle className="w-3.5 h-3.5" />}
                    {profileSaveMsg.text}
                  </span>
                )}
              </div>

              <Card className="p-5">
                <h3 className="text-sm font-semibold text-st-text-primary mb-3 flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-st-accent" />
                  Your Notes
                </h3>
                {loadingNotes ? (
                  <ListSkeleton count={3} />
                ) : notes.length === 0 ? (
                  <p className="text-xs text-st-text-muted">No study notes yet. Create notes in your study space to see them here.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {notes.slice(0, 6).map(note => (
                      <div key={note.id} className="p-3 rounded-lg bg-st-bg-elevated border border-st-border/50 hover:border-st-accent/20 transition-colors">
                        <p className="text-xs font-medium text-st-text-primary truncate">{note.title || "Untitled"}</p>
                        <p className="text-[11px] text-st-text-muted mt-1 line-clamp-2">{note.content || ""}</p>
                      </div>
                    ))}
                  </div>
                )}
              </Card>

              <Card className="p-5">
                <h3 className="text-sm font-semibold text-st-text-primary mb-3 flex items-center gap-2">
                  <Upload className="w-4 h-4 text-st-accent" />
                  Your Documents
                </h3>
                {loadingDocs ? (
                  <ListSkeleton count={3} />
                ) : documents.length === 0 ? (
                  <p className="text-xs text-st-text-muted">No documents uploaded yet.</p>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {documents.slice(0, 6).map(doc => (
                      <div key={doc.id} className="p-3 rounded-lg bg-st-bg-elevated border border-st-border/50 hover:border-st-accent/20 transition-colors flex items-center gap-3">
                        <File className="w-8 h-8 text-st-accent/60 shrink-0" />
                        <div className="min-w-0">
                          <p className="text-xs font-medium text-st-text-primary truncate">{doc.originalName || doc.fileName || "Document"}</p>
                          {doc.createdAt && <p className="text-[10px] text-st-text-muted">{new Date(doc.createdAt).toLocaleDateString()}</p>}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>
          )}

          {setupTab === "start" && (
            <motion.div key="start" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
              {!hasProfileData ? (
                <div className="p-4 rounded-xl bg-st-warning-bg/30 border border-st-warning/30 flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-st-warning shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-st-warning">Resume & Job Description required</p>
                    <p className="text-xs text-st-text-muted mt-1">Please add your resume and job description in the Profile tab first. This helps us personalize questions to your background.</p>
                  </div>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-st-success-bg/20 border border-st-success/30 flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-st-success shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-medium text-st-success">Profile ready</p>
                    <p className="text-xs text-st-text-muted mt-1">Your resume and job description will be used to personalize your interview questions.</p>
                  </div>
                </div>
              )}

              <Card className="p-6">
                <div className="text-center mb-6">
                  <div className="w-16 h-16 rounded-2xl bg-st-accent/10 flex items-center justify-center mx-auto mb-4">
                    <Users className="w-8 h-8 text-st-accent" />
                  </div>
                  <h2 className="text-lg font-semibold text-st-text-primary mb-2">Configure Interview</h2>
                  <p className="text-sm text-st-text-muted">Choose the type and difficulty level</p>
                </div>

                <div className="space-y-4">
                  <div>
                    <p className="text-xs font-medium text-st-text-secondary mb-2">Interview Type</p>
                    <div className="grid grid-cols-3 gap-2">
                      {(["Technical", "HR", "Behavioral"] as const).map(type => (
                        <button
                          key={type}
                          onClick={() => setInterviewType(type)}
                          className={cn(
                            "p-3 rounded-xl border text-center transition-all cursor-pointer",
                            interviewType === type
                              ? "bg-st-accent/10 border-st-accent/30"
                              : "bg-st-bg-elevated border-st-border hover:border-st-accent/30"
                          )}
                        >
                          <Brain className={cn("w-5 h-5 mx-auto mb-1", interviewType === type ? "text-st-accent" : "text-st-text-muted")} />
                          <p className={cn("text-xs font-medium", interviewType === type ? "text-st-accent" : "text-st-text-secondary")}>{type}</p>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-medium text-st-text-secondary mb-2">Difficulty</p>
                    <div className="flex gap-2">
                      {["Beginner", "Intermediate", "Advanced"].map(d => (
                        <TopicChip key={d} label={d} selected={difficulty === d} onClick={() => setDifficulty(d)} />
                      ))}
                    </div>
                  </div>

                  <Button
                    variant="primary"
                    size="lg"
                    className="w-full mt-4"
                    onClick={startInterview}
                    disabled={starting || !hasProfileData}
                  >
                    {starting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Target className="w-4 h-4 mr-2" />}
                    {starting ? "Starting..." : !hasProfileData ? "Add Resume & JD First" : "Start Mock Interview"}
                  </Button>

                  <button
                    onClick={() => { setShowHistory(!showHistory); if (!showHistory) fetchHistory(); }}
                    className="w-full text-center text-xs text-st-text-muted hover:text-st-accent transition-colors mt-2 cursor-pointer"
                  >
                    View session history
                  </button>
                </div>
              </Card>

              <AnimatePresence>
                {showHistory && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                    <Card className="p-4 space-y-2">
                      <h3 className="text-sm font-semibold text-st-text-primary mb-2 flex items-center gap-2">
                        <History className="w-4 h-4 text-st-accent" />
                        Session History
                      </h3>
                      {loadingHistory ? (
                        <CardSkeleton />
                      ) : sessionHistory.length === 0 ? (
                        <p className="text-xs text-st-text-muted">No sessions yet</p>
                      ) : (
                        sessionHistory.map((session, i) => (
                          <div key={session.id || i} className="flex items-center justify-between p-2 rounded-lg bg-st-bg-elevated">
                            <div>
                              <p className="text-sm text-st-text-primary">{session.type}</p>
                              <p className="text-xs text-st-text-muted">{session.createdAt}</p>
                            </div>
                            <Badge variant={session.score >= 80 ? "success" : session.score >= 70 ? "warning" : "danger"}>
                              {session.score}%
                            </Badge>
                          </div>
                        ))
                      )}
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    );
  }

  if (screen === "interview") {
    return (
      <div className="max-w-3xl mx-auto space-y-4 pb-8">
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge variant="outline">Question {currentIndex + 1}/{questions.length}</Badge>
            <Badge variant="outline">{interviewType}</Badge>
          </div>
          <div className="flex items-center gap-1.5">
            <Timer className="w-4 h-4 text-st-accent" />
            <span className={cn(
              "font-mono text-sm font-medium",
              timeLeft <= 15 ? "text-st-danger" : timeLeft <= 30 ? "text-st-warning" : "text-st-text-primary"
            )}>
              {Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}
            </span>
          </div>
        </motion.div>

        <div className="w-full h-1.5 bg-st-bg-elevated rounded-full overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-st-accent to-st-accent-hover transition-all duration-500 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        <Card className="p-6">
          <div className="flex items-start gap-3 mb-4">
            <div className="w-8 h-8 rounded-lg bg-st-accent/10 flex items-center justify-center shrink-0 mt-0.5">
              <MessageSquare className="w-4 h-4 text-st-accent" />
            </div>
            <div>
              <p className="text-xs text-st-text-muted mb-1">Question {currentIndex + 1}</p>
              <h3 className="text-base font-medium text-st-text-primary leading-relaxed">{current}</h3>
            </div>
          </div>

          <textarea
            value={answer}
            onChange={e => setAnswer(e.target.value)}
            placeholder="Type your answer here... Be thorough and structure your response."
            className="w-full bg-st-bg-elevated border border-st-border rounded-xl p-4 text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none focus:border-st-accent/50 transition-colors resize-none min-h-[180px]"
            disabled={submitting}
          />

          <div className="flex items-center justify-between mt-4">
            <div className="flex items-center gap-3">
              <p className="text-xs text-st-text-muted">{answer.length} characters</p>
              {timeLeft <= 15 && (
                <span className="text-xs text-st-danger flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  Time running out!
                </span>
              )}
            </div>
            <Button variant="primary" onClick={handleSubmitAnswer} disabled={(!answer.trim() && timeLeft > 0) || submitting}>
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
              {submitting ? "Evaluating..." : currentIndex < questions.length - 1 ? "Submit & Next" : "Submit & Finish"}
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </div>
        </Card>

        {results.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-4">
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-xs font-semibold text-st-text-secondary flex items-center gap-1.5">
                  <BarChart3 className="w-3.5 h-3.5 text-st-accent" />
                  Previous Answer Score (Q{results.length})
                </h4>
                <Badge variant="outline">
                  {Math.round((results[results.length - 1].scores.technical + results[results.length - 1].scores.communication + results[results.length - 1].scores.confidence) / 3)}%
                </Badge>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: "Technical", value: results[results.length - 1].scores.technical, color: "text-st-accent" },
                  { label: "Communication", value: results[results.length - 1].scores.communication, color: "text-blue-400" },
                  { label: "Confidence", value: results[results.length - 1].scores.confidence, color: "text-emerald-400" },
                ].map(item => (
                  <div key={item.label} className="text-center p-2 rounded-lg bg-st-bg-elevated/50">
                    <div className={cn("text-lg font-bold", item.color)}>{item.value}%</div>
                    <div className="text-[10px] text-st-text-muted">{item.label}</div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        )}
      </div>
    );
  }

  const avgScore = averageScore > 0
    ? averageScore
    : results.length > 0
      ? Math.round(results.reduce((acc, r) => acc + (r.scores.technical + r.scores.communication + r.scores.confidence) / 3, 0) / results.length)
      : 0;

  const techAvg = results.length > 0 ? Math.round(results.reduce((a, r) => a + r.scores.technical, 0) / results.length) : 0;
  const commAvg = results.length > 0 ? Math.round(results.reduce((a, r) => a + r.scores.communication, 0) / results.length) : 0;
  const confAvg = results.length > 0 ? Math.round(results.reduce((a, r) => a + r.scores.confidence, 0) / results.length) : 0;

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
        <Card className="p-6 text-center">
          <div className="relative w-32 h-32 mx-auto mb-4">
            {renderRingChart(avgScore)}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <span className={cn(
                  "text-3xl font-bold",
                  avgScore >= 80 ? "text-st-success" : avgScore >= 65 ? "text-st-warning" : "text-st-danger"
                )}>{avgScore}%</span>
                <p className="text-[10px] text-st-text-muted">Overall</p>
              </div>
            </div>
          </div>

          <h2 className="text-xl font-bold text-st-text-primary mb-1">Interview Complete!</h2>
          <p className="text-sm text-st-text-muted mb-6">Here&apos;s how you performed</p>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <StatsCard icon={Brain} label="Technical" value={`${techAvg}%`} color="text-st-accent" bg="bg-st-accent/10" />
            <StatsCard icon={MessageSquare} label="Communication" value={`${commAvg}%`} color="text-blue-400" bg="bg-blue-500/10" />
            <StatsCard icon={TrendingUp} label="Confidence" value={`${confAvg}%`} color="text-emerald-400" bg="bg-emerald-500/10" />
          </div>

          {overallFeedback && (
            <div className="text-left mb-6 p-4 rounded-xl bg-st-bg-elevated border border-st-border/50">
              <h4 className="text-xs font-semibold text-st-text-secondary mb-2 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-st-accent" />
                Overall Feedback
              </h4>
              <div className="text-sm text-st-text-secondary leading-relaxed [&_strong]:text-st-accent whitespace-pre-wrap">
                {overallFeedback}
              </div>
            </div>
          )}

          <div className="space-y-2 mb-6 text-left">
            <h4 className="text-xs font-semibold text-st-text-secondary mb-2 flex items-center gap-1.5">
              <BarChart3 className="w-3.5 h-3.5 text-st-accent" />
              Question Breakdown
            </h4>
            {results.map((r, i) => {
              const qScore = Math.round((r.scores.technical + r.scores.communication + r.scores.confidence) / 3);
              return (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="p-3 rounded-lg bg-st-bg-elevated/50 border border-st-border/30"
                >
                  <div className="flex items-start justify-between mb-1.5">
                    <p className="text-xs font-medium text-st-text-primary flex-1 mr-2">Q{i + 1}: {r.question}</p>
                    <Badge variant={qScore >= 80 ? "success" : qScore >= 65 ? "warning" : "danger"}>{qScore}%</Badge>
                  </div>
                  <div className="flex gap-3 text-[10px] text-st-text-muted mb-1.5">
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-st-accent" />
                      Tech: {r.scores.technical}%
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-blue-400" />
                      Comm: {r.scores.communication}%
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                      Conf: {r.scores.confidence}%
                    </span>
                  </div>
                  <p className="text-[11px] text-st-text-secondary leading-relaxed">{r.feedback}</p>
                </motion.div>
              );
            })}
          </div>

          <div className="flex gap-3">
            <Button variant="primary" className="flex-1" onClick={handleRetry}>
              <RotateCcw className="w-4 h-4 mr-2" /> Try Again
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => { setShowHistory(true); handleRetry(); }}>
              <History className="w-4 h-4 mr-2" /> History
            </Button>
          </div>
        </Card>
      </motion.div>
    </div>
  );
}
