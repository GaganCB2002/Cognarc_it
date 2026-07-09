"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import api from "@/lib/api";
import {
  FileText, Upload, MessageSquare, Sparkles, BookOpen, HelpCircle,
  Brain, Lightbulb, Search, FileSearch, Loader2,
  ExternalLink, AlertCircle
} from "lucide-react";

type PDFDoc = {
  id: string;
  name: string;
  title: string;
  mimeType: string;
  size: number;
  type: string;
  status: string;
  uploadedAt: string;
  publicUrl: string | null;
};

type AIResult = {
  summary?: string;
  keyConcepts?: string[];
  interviewQuestions?: { question: string; answer: string }[];
  flashcards?: { front: string; back: string }[];
  chapterSummaries?: { chapter: string; summary: string }[];
  mindMapData?: { node: string; children: string[] }[];
  mcqs?: { question: string; options: string[]; correctAnswer: number; explanation: string }[];
};

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 3);
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

export default function PDFIntelligencePage() {
  const router = useRouter();
  const [docs, setDocs] = useState<PDFDoc[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDoc, setSelectedDoc] = useState<PDFDoc | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [aiLoading, setAiLoading] = useState<string | null>(null);
  const [aiResult, setAiResult] = useState<AIResult | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatLoading, setChatLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const fetchDocs = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.get<PDFDoc[]>("/upload/my-files");
      const pdfs = data.filter((d) => d.type?.toUpperCase() === "PDF");
      setDocs(pdfs);
      if (pdfs.length > 0 && !selectedDoc) {
        setSelectedDoc(pdfs[0]);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load documents");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocs();
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.type !== "application/pdf") {
      setError("Only PDF files are supported");
      e.target.value = "";
      return;
    }
    setUploading(true);
    setError(null);
    try {
      await api.uploadFile("/upload", file);
      await fetchDocs();
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleAIAction = async (action: string) => {
    if (!selectedDoc) return;
    setAiLoading(action);
    setActiveTab(action);
    setAiResult(null);
    try {
      const fileRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/upload/${selectedDoc.id}/text`,
        { headers: { Authorization: `Bearer ${api.getToken()}` } }
      );
      if (!fileRes.ok) throw new Error("Failed to extract text from document");
      const { text } = await fileRes.json();

      let result: AIResult = {};
      if (action === "summary" || action === "chapter-summaries") {
        const res = await api.post<any>("/ai/summary", { text });
        result = res;
      } else if (action === "quiz") {
        const res = await api.post<any>("/ai/quiz", { text });
        result = { mcqs: res.questions || res.mcqs };
      } else {
        // Use a generic prompt to the agent chat or summary endpoint
        const promptMap: Record<string, string> = {
          "key-concepts": "Extract the key concepts from this text as a JSON array of strings.",
          "interview-questions": "Generate interview questions and answers from this text as JSON array of {question, answer}.",
          flashcards: "Create flashcards from this text as JSON array of {front, back}.",
          "mind-map": "Create a mind map from this text as JSON array of {node, children}.",
        };
        const instruction = promptMap[action] || "Summarize this text.";
        const res = await api.post<any>("/ai/summary", {
          text: `${instruction}\n\n${text.substring(0, 100000)}`,
        });
        result = res;
      }
      setAiResult(result);
    } catch (err: any) {
      setError(err.message || "AI processing failed");
    } finally {
      setAiLoading(null);
    }
  };

  const handleChat = async () => {
    if (!chatInput.trim() || !selectedDoc) return;
    const userMsg = chatInput.trim();
    setChatInput("");
    setChatMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setChatLoading(true);
    try {
      const res = await api.post<any>("/ai/chat", {
        messages: [{ role: "user", content: userMsg }],
        conversationId,
        documentId: selectedDoc.id,
      });
      setConversationId(res.conversationId);
      setChatMessages((prev) => [...prev, { role: "assistant", content: res.reply || "No response generated." }]);
    } catch (err: any) {
      setChatMessages((prev) => [...prev, { role: "assistant", content: `Error: ${err.message}` }]);
    } finally {
      setChatLoading(false);
    }
  };

  const filtered = docs.filter((d) =>
    d.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderAIResult = () => {
    if (aiLoading) {
      return (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-st-accent mr-3" />
          <span className="text-st-text-muted">Analyzing document...</span>
        </div>
      );
    }
    if (!aiResult) return null;

    switch (activeTab) {
      case "summary":
        return (
          <div className="prose prose-sm max-w-none text-st-text-primary">
            <p className="leading-relaxed whitespace-pre-wrap">{aiResult.summary}</p>
          </div>
        );
      case "key-concepts":
        return (
          <div className="flex flex-wrap gap-2">
            {(aiResult.keyConcepts || []).map((c, i) => (
              <Badge key={i} variant="outline" className="text-sm px-3 py-1">{c}</Badge>
            ))}
          </div>
        );
      case "interview-questions":
        return (
          <div className="space-y-4">
            {(aiResult.interviewQuestions || []).map((q, i) => (
              <Card key={i} className="p-4">
                <p className="font-semibold text-st-text-primary mb-2">Q{i + 1}: {q.question}</p>
                <p className="text-st-text-secondary text-sm">{q.answer}</p>
              </Card>
            ))}
          </div>
        );
      case "flashcards":
        return (
          <div className="grid grid-cols-2 gap-3">
            {(aiResult.flashcards || []).map((f, i) => (
              <Card key={i} className="p-4">
                <p className="font-semibold text-st-accent mb-1">{f.front}</p>
                <p className="text-sm text-st-text-secondary">{f.back}</p>
              </Card>
            ))}
          </div>
        );
      case "chapter-summaries":
        return (
          <div className="space-y-4">
            {(aiResult.chapterSummaries || []).map((c, i) => (
              <Card key={i} className="p-4">
                <h4 className="font-semibold text-st-text-primary mb-1">{c.chapter}</h4>
                <p className="text-sm text-st-text-secondary">{c.summary}</p>
              </Card>
            ))}
          </div>
        );
      case "mind-map":
        return (
          <div className="space-y-3">
            {(aiResult.mindMapData || []).map((m, i) => (
              <Card key={i} className="p-4">
                <p className="font-semibold text-st-accent mb-2">{m.node}</p>
                <div className="flex flex-wrap gap-2">
                  {(m.children || []).map((c, j) => (
                    <Badge key={j} variant="outline">{c}</Badge>
                  ))}
                </div>
              </Card>
            ))}
          </div>
        );
      default:
        return (
          <pre className="text-sm text-st-text-secondary whitespace-pre-wrap">
            {JSON.stringify(aiResult, null, 2)}
          </pre>
        );
    }
  };

  const aiFeatures = [
    { key: "summary", icon: BookOpen, title: "Full Summary", desc: "AI-generated comprehensive summary" },
    { key: "key-concepts", icon: Lightbulb, title: "Key Concepts", desc: "Extract main ideas and themes" },
    { key: "interview-questions", icon: HelpCircle, title: "Interview Questions", desc: "Generate practice questions" },
    { key: "flashcards", icon: Brain, title: "Flashcards", desc: "Auto-create study flashcards" },
    { key: "chapter-summaries", icon: FileSearch, title: "Chapter Summaries", desc: "Per-chapter analysis" },
    { key: "mind-map", icon: Sparkles, title: "Mind Map", desc: "Visual concept map generation" },
  ];

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-st-accent uppercase mb-1">Document Intelligence</p>
          <h1 className="text-3xl font-bold text-st-text-primary">PDF Intelligence</h1>
        </div>
        <div className="flex items-center gap-2">
          <input ref={fileInputRef} type="file" onChange={handleUpload} className="hidden" accept=".pdf" />
          <Button variant="primary" size="sm" onClick={() => fileInputRef.current?.click()} disabled={uploading}>
            <Upload className="w-4 h-4 mr-1" />
            {uploading ? "Uploading..." : "Upload PDF"}
          </Button>
        </div>
      </div>

      {error && (
        <Card className="p-3 bg-st-danger/10 border-st-danger/30 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-st-danger shrink-0" />
          <p className="text-sm text-st-danger flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-st-text-muted hover:text-st-text-primary text-xs">Dismiss</button>
        </Card>
      )}

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden">
        {/* Document List */}
        <div className="col-span-3 flex flex-col gap-3 overflow-y-auto">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-st-text-muted" />
            <input type="text" placeholder="Search documents..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-st-bg-elevated border border-st-border rounded-lg text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none focus:border-st-accent/50" />
          </div>
          {loading ? (
            <div className="p-8 text-center text-st-text-muted">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-st-text-muted">No PDFs found. Upload one to get started.</div>
          ) : (
            filtered.map((doc) => (
              <Card key={doc.id} onClick={() => { setSelectedDoc(doc); setAiResult(null); setActiveTab(null); setChatMessages([]); setConversationId(null); }}
                className={`p-4 cursor-pointer transition-all ${selectedDoc?.id === doc.id ? "border-st-accent/50 bg-st-bg-elevated" : "hover:border-st-accent/20"}`}>
                <div className="flex items-start gap-3">
                  <FileText className="w-8 h-8 text-red-400 shrink-0" />
                  <div className="min-w-0">
                    <h4 className="text-sm font-semibold text-st-text-primary truncate">{doc.title}</h4>
                    <p className="text-xs text-st-text-muted mt-0.5">{formatSize(doc.size)}</p>
                    <Badge variant={doc.status === "READY" ? "success" : "warning"} className="mt-2">{doc.status}</Badge>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>

        {/* Main Content */}
        <div className="col-span-9 flex flex-col gap-4 overflow-y-auto">
          {selectedDoc ? (
            <>
              {/* Header */}
              <Card className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <FileText className="w-10 h-10 text-red-400" />
                    <div>
                      <h2 className="text-lg font-bold text-st-text-primary">{selectedDoc.title}</h2>
                      <p className="text-xs text-st-text-muted">{formatSize(selectedDoc.size)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" onClick={() => router.push(`/pdf-intelligence/view/${selectedDoc.id}`)}>
                      <ExternalLink className="w-4 h-4 mr-1" />Open Viewer
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => window.open(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/upload/${selectedDoc.id}`, "_blank")}>
                      <FileText className="w-4 h-4 mr-1" />Download
                    </Button>
                  </div>
                </div>
              </Card>

              {/* AI Features Grid */}
              <div className="grid grid-cols-3 gap-3">
                {aiFeatures.map((feat) => (
                  <button key={feat.key} onClick={() => handleAIAction(feat.key)}
                    disabled={aiLoading !== null}
                    className={`p-4 bg-st-bg-elevated rounded-lg border border-st-border hover:border-st-accent/30 transition-all text-left group ${aiLoading === feat.key ? "opacity-50" : ""}`}>
                    <feat.icon className={`w-5 h-5 text-st-accent mb-2 group-hover:scale-110 transition-transform ${aiLoading === feat.key ? "animate-pulse" : ""}`} />
                    <p className="text-sm font-medium text-st-text-primary">{feat.title}</p>
                    <p className="text-xs text-st-text-muted">{feat.desc}</p>
                  </button>
                ))}
              </div>

              {/* AI Result */}
              {activeTab && (
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-semibold text-st-text-primary">
                      {aiFeatures.find((f) => f.key === activeTab)?.title || "Result"}
                    </h3>
                    <Button variant="ghost" size="sm" onClick={() => { setAiResult(null); setActiveTab(null); }}>Close</Button>
                  </div>
                  {renderAIResult()}
                </Card>
              )}

              {/* Q&A Chat */}
              <Card className="p-4 flex-1 flex flex-col min-h-[200px]">
                <h3 className="text-sm font-semibold text-st-text-primary mb-3 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-st-accent" />Ask about this document
                </h3>
                <div className="flex-1 overflow-y-auto mb-3 space-y-2 max-h-[250px]">
                  {chatMessages.length === 0 ? (
                    <p className="text-sm text-st-text-muted text-center py-6">
                      Ask any question about &ldquo;{selectedDoc.title}&rdquo;
                    </p>
                  ) : (
                    chatMessages.map((msg, i) => (
                      <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        <div className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${msg.role === "user" ? "bg-st-accent text-black" : "bg-st-bg-elevated text-st-text-primary"}`}>
                          {msg.content}
                        </div>
                      </div>
                    ))
                  )}
                  {chatLoading && (
                    <div className="flex justify-start">
                      <div className="bg-st-bg-elevated rounded-lg px-3 py-2 text-sm text-st-text-muted flex items-center gap-2">
                        <Loader2 className="w-3 h-3 animate-spin" />Thinking...
                      </div>
                    </div>
                  )}
                  <div ref={chatEndRef} />
                </div>
                <div className="flex gap-2">
                  <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && handleChat()}
                    placeholder="Ask a question about this document..."
                    className="flex-1 bg-st-bg-elevated border border-st-border rounded-lg px-3 py-2 text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none focus:border-st-accent/50" />
                  <Button variant="primary" size="sm" onClick={handleChat} disabled={chatLoading || !chatInput.trim()}>
                    Ask
                  </Button>
                </div>
              </Card>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto text-st-text-muted opacity-20 mb-4" />
                <p className="text-st-text-muted">Select a document to analyze or upload a new PDF</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
