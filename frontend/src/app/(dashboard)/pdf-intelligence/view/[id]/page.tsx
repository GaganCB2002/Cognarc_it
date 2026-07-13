"use client";

import React, { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import {
  FileText, ArrowLeft, Sparkles, Save, Loader2, Maximize2,
  Minimize2, Trash2, Palette, Highlighter,
  ChevronDown, Eye, EyeOff, List, StickyNote, Globe, Languages,
  Volume2, VolumeX, Brain, X, Copy, Download, BarChart3,
  Lightbulb, HelpCircle, BookmarkCheck, MessageSquareQuote,
  Clock, Wand2, AlertCircle, RotateCw,
  FileX
} from "lucide-react";

import { ConfirmDialog } from "@/components/crud/ConfirmDialog";
import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { highlightPlugin, RenderHighlightTargetProps, RenderHighlightsProps, HighlightArea } from '@react-pdf-viewer/highlight';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/highlight/lib/styles/index.css';

type PDFDoc = { id: string; name: string; title: string; mimeType: string; size: number; type: string; status: string; };
type Note = { id: string; title: string; content: string; tags: string[]; folder: string; isPinned: boolean; updatedAt: string; };

type ColoredHighlight = {
  content: string;
  highlightAreas: HighlightArea[];
  color: string;
  id: string;
  timestamp: number;
};

const HIGHLIGHT_COLORS = [
  { name: "Yellow", value: "#FFEB3B", css: "rgba(255, 235, 59, 0.45)" },
  { name: "Green", value: "#4CAF50", css: "rgba(76, 175, 80, 0.4)" },
  { name: "Blue", value: "#2196F3", css: "rgba(33, 150, 243, 0.35)" },
  { name: "Light Blue", value: "#03A9F4", css: "rgba(3, 169, 244, 0.3)" },
  { name: "Light Green", value: "#8BC34A", css: "rgba(139, 195, 74, 0.35)" },
  { name: "Pink", value: "#E91E63", css: "rgba(233, 30, 99, 0.3)" },
  { name: "Orange", value: "#FF9800", css: "rgba(255, 152, 0, 0.35)" },
  { name: "Purple", value: "#9C27B0", css: "rgba(156, 39, 176, 0.3)" },
  { name: "Red", value: "#F44336", css: "rgba(244, 67, 54, 0.3)" },
  { name: "Teal", value: "#009688", css: "rgba(0, 150, 136, 0.3)" },
  { name: "Indigo", value: "#3F51B5", css: "rgba(63, 81, 81, 0.3)" },
  { name: "Amber", value: "#FFC107", css: "rgba(255, 193, 7, 0.4)" },
];

const QUICK_ACTIONS = [
  { id: "summary", label: "Summary", icon: Sparkles, color: "text-yellow-400" },
  { id: "key-points", label: "Key Points", icon: Lightbulb, color: "text-blue-400" },
  { id: "flashcards", label: "Flashcards", icon: BookmarkCheck, color: "text-green-400" },
  { id: "quiz", label: "Quiz", icon: HelpCircle, color: "text-purple-400" },
  { id: "mindmap", label: "Mind Map", icon: Brain, color: "text-pink-400" },
  { id: "qna", label: "Q&A", icon: MessageSquareQuote, color: "text-orange-400" },
];

let highlightIdCounter = 0;
function nextHighlightId() { return `hl_${++highlightIdCounter}_${Date.now()}`; }

export default function PDFViewerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const noteTitleRef = useRef("");
  const blobUrlRef = useRef<string | null>(null);

  const [doc, setDoc] = useState<PDFDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullscreen, setFullscreen] = useState(false);
  const [noteContent, setNoteContent] = useState("");
  const [noteTitle, setNoteTitle] = useState("");
  const [saving, setSaving] = useState(false);
  const [notes, setNotes] = useState<Note[]>([]);
  const [selectedNote, setSelectedNote] = useState<Note | null>(null);
  const [showNotes, setShowNotes] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);
  const [pdfLoadError, setPdfLoadError] = useState<string | null>(null);

  const [highlights, setHighlights] = useState<ColoredHighlight[]>([]);
  const [activeColor, setActiveColor] = useState(HIGHLIGHT_COLORS[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [showHighlights, setShowHighlights] = useState(true);
  const [showHighlightList, setShowHighlightList] = useState(false);

  const [speaking, setSpeaking] = useState(false);
  const [explainText, setExplainText] = useState("");
  const [explainResult, setExplainResult] = useState("");
  const [explainLoading, setExplainLoading] = useState(false);

  const [docText, setDocText] = useState<string | null>(null);
  const [showStats, setShowStats] = useState(false);
  const [aiActionLoading, setAiActionLoading] = useState<string | null>(null);
  const [aiActionResult, setAiActionResult] = useState<{ action: string; result: string } | null>(null);

  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useEffect(() => { noteTitleRef.current = noteTitle; }, [noteTitle]);

  const speakText = useCallback((text: string) => {
    if (!window.speechSynthesis) return;
    if (speaking) { window.speechSynthesis.cancel(); setSpeaking(false); return; }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; utterance.pitch = 1;
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    setSpeaking(true);
    window.speechSynthesis.speak(utterance);
  }, [speaking]);

  const searchGoogle = useCallback((text: string) => {
    window.open(`https://www.google.com/search?q=${encodeURIComponent(text)}`, "_blank");
  }, []);

  const translateText = useCallback((text: string) => {
    window.open(`https://translate.google.com/?sl=auto&text=${encodeURIComponent(text)}`, "_blank");
  }, []);

  const copyToClipboard = useCallback(async (text: string) => {
    try { await navigator.clipboard.writeText(text); } catch { /* fallback */ }
  }, []);

  const explainWithGemini = useCallback(async (text: string) => {
    setExplainText(text); setExplainResult(""); setExplainLoading(true);
    try {
      const res = await api.post<{ reply?: string }>("/ai/chat", {
        messages: [{ role: "user", content: `Explain the following text in detail, providing context, key concepts, and significance:\n\n"${text}"` }],
      });
      setExplainResult(res.reply || "No explanation generated.");
    } catch {
      setExplainResult("Failed to get AI explanation. Check your connection and try again.");
    } finally { setExplainLoading(false); }
  }, []);

  const fetchDocText = useCallback(async () => {
    if (docText) return docText;
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "https://cognarc-it-1.onrender.com/api"}/upload/${id}/text`,
        { headers: { Authorization: `Bearer ${api.getToken()}` } }
      );
      if (!res.ok) throw new Error("Failed to extract text");
      const { text } = await res.json();
      setDocText(text);
      return text;
    } catch { return null; }
  }, [id, docText]);

  const apiBase = process.env.NEXT_PUBLIC_API_URL || "https://cognarc-it-1.onrender.com/api";

  const fetchDocBinary = useCallback(async (): Promise<Blob | null> => {
    const token = api.getToken();
    const headers = { Authorization: `Bearer ${token}` };

    const tryEndpoint = async (url: string): Promise<Blob | null> => {
      const res = await fetch(url, { headers });
      if (!res.ok) return null;
      const contentType = res.headers.get("content-type") || "";
      if (contentType.includes("json")) {
        const json = await res.json();
        if (json.url) {
          const fileRes = await fetch(json.url);
          if (fileRes.ok) return fileRes.blob();
        }
        return null;
      }
      const blob = await res.blob();
      if (blob && blob.size > 0 && !contentType.includes("json")) return blob;
      return null;
    };

    const endpoints = [
      `${apiBase}/upload/${id}/download`,
      `${apiBase}/upload/${id}`,
    ];

    for (const ep of endpoints) {
      try {
        const blob = await tryEndpoint(ep);
        if (blob) return blob;
      } catch { /* try next */ }
    }
    return null;
  }, [id, apiBase]);

  const fetchDoc = useCallback(async () => {
    try {
      setLoading(true);
      setPdfLoadError(null);
      setError(null);

      const data = await api.get<PDFDoc[]>("/upload/my-files");
      const found = data.find((d: PDFDoc) => d.id === id);
      if (found) {
        setDoc(found);
      } else {
        setError("Document not found");
        setLoading(false);
        return;
      }

      const blob = await fetchDocBinary();
      if (!blob || blob.size === 0) {
        throw new Error("Could not load PDF file from server");
      }

      const url = URL.createObjectURL(blob);
      blobUrlRef.current = url;
      setPdfUrl(url);
    } catch (err: unknown) {
      console.error("PDF fetch error:", err);
      setPdfLoadError(err instanceof Error ? err.message : "Failed to load PDF");
      setError(err instanceof Error ? err.message : "Failed to load document");
    } finally {
      setLoading(false);
    }
  }, [id, fetchDocBinary]);

  useEffect(() => {
    fetchDoc();
    fetchNotes();
    return () => {
      if (blobUrlRef.current) {
        URL.revokeObjectURL(blobUrlRef.current);
      }
    };
  }, [fetchDoc]);

  const fetchNotes = async () => {
    try {
      const res = await api.get<Note[]>("/notes");
      if (Array.isArray(res)) setNotes(res);
    } catch { /* ignore */ }
  };

  const handleDeleteFile = async () => {
    try {
      await api.delete(`/upload/${id}`);
      router.push("/pdf-intelligence");
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete file");
    }
  };

  const handleDownloadDirect = () => {
    window.open(`${apiBase}/upload/${id}/download`, "_blank");
  };

  const handleCreateNote = async () => {
    try {
      const res = await api.post<{ data: Note }>("/notes", {
        title: noteTitle || `Notes - ${doc?.title || "PDF"}`,
        content: noteContent || " ", tags: ["pdf"], folderId: null,
      });
      if (res && res.data) { setNotes((prev) => [res.data, ...prev]); setSelectedNote(res.data); }
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to create note"); }
  };

  const handleSaveNote = async () => {
    if (!selectedNote) { await handleCreateNote(); return; }
    setSaving(true);
    try {
      const res = await api.put<{ data: Note }>(`/notes/${selectedNote.id}`, { title: noteTitle, content: noteContent });
      if (res && res.data) { setNotes((prev) => prev.map((n) => (n.id === selectedNote.id ? res.data : n))); setSelectedNote(res.data); }
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "Failed to save note"); }
    finally { setSaving(false); }
  };

  const handleSummarizeToNote = async () => {
    setAiLoading(true); setAiSummary(null);
    try {
      const text = await fetchDocText();
      if (!text) throw new Error("Failed to extract text");
      const res = await api.post<{ summary?: string; keyTopics?: string[]; interviewQuestions?: { question: string; answer: string }[]; mcqs?: { question: string; options: string[]; correctAnswer: number; explanation: string }[] }>("/ai/summary", { text });
      let summaryText = res.summary || JSON.stringify(res);
      if (res.keyTopics?.length) summaryText += `\n\n### Key Topics\n- ${res.keyTopics.join('\n- ')}`;
      if (res.interviewQuestions?.length) {
        summaryText += `\n\n### Study Questions\n`;
        res.interviewQuestions.forEach((q: { question: string; answer: string }, i: number) => { summaryText += `**Q${i+1}: ${q.question}**\n*A: ${q.answer}*\n\n`; });
      }
      if (res.mcqs?.length) {
        summaryText += `### Multiple Choice Questions\n`;
        res.mcqs.forEach((q: { question: string; options: string[]; correctAnswer: number; explanation: string }, i: number) => {
          summaryText += `**Q${i+1}: ${q.question}**\n`;
          q.options.forEach((opt: string, oi: number) => { summaryText += `${oi === q.correctAnswer ? '✅' : '⚪'} ${opt}\n`; });
          summaryText += `\n*Explanation: ${q.explanation}*\n\n`;
        });
      }
      setAiSummary(res.summary || "Summary generated.");
      setNoteTitle(`Study Guide - ${doc?.title || "PDF"}`); setNoteContent(summaryText); setShowNotes(true);
      const noteRes = await api.post<{ data: Note }>("/notes", { title: `Study Guide - ${doc?.title || "PDF"}`, content: summaryText, tags: ["pdf", "ai-summary"], folderId: null });
      if (noteRes?.data) { setNotes((prev) => [noteRes.data, ...prev]); setSelectedNote(noteRes.data); }
    } catch (err: unknown) { setError(err instanceof Error ? err.message : "AI summary failed"); }
    finally { setAiLoading(false); }
  };

  const handleQuickAction = async (actionId: string) => {
    const text = await fetchDocText();
    if (!text) { setError("Could not extract document text"); return; }
    setAiActionLoading(actionId); setAiActionResult(null);
    try {
      let res: { summary?: string; mcqs?: { question: string; options: string[]; correctAnswer: number; explanation: string }[]; questions?: { question: string; options: string[]; correctAnswer: number; explanation: string }[]; reply?: string };;
      const promptMap: Record<string, string> = {
        "key-points": "Extract the 10 most important key points from this text as a bulleted list. Be specific and detailed.",
        "flashcards": "Create 10 flashcards from this text. Format as:\n**Front:** term/concept\n**Back:** definition/explanation\n\nSeparate each card with ---",
        "mindmap": "Create a hierarchical mind map from this text showing the main topic, subtopics, and key details. Use indentation (tabs) to show hierarchy.",
        "qna": "Based on this text, create a comprehensive Q&A study guide with the 10 most important questions and detailed answers.",
      };
      if (actionId === "summary") {
        res = await api.post<{ summary?: string }>("/ai/summary", { text });
        setAiActionResult({ action: "Summary", result: res.summary || JSON.stringify(res) });
      } else if (actionId === "quiz") {
        res = await api.post<{ mcqs?: { question: string; options: string[]; correctAnswer: number; explanation: string }[]; questions?: { question: string; options: string[]; correctAnswer: number; explanation: string }[] }>("/ai/quiz", { text });
        const questions = res.mcqs || res.questions || [];
        const qText = questions.map((q: { question: string; options: string[]; correctAnswer: number; explanation: string }, i: number) =>
          `**Q${i+1}: ${q.question}**\n${(q.options || []).map((o: string, oi: number) => `${oi === q.correctAnswer ? '✅' : '⚪'} ${o}`).join('\n')}\n*${q.explanation || ''}*`
        ).join('\n\n');
        setAiActionResult({ action: "Quiz", result: qText || "No questions generated" });
      } else {
        const instruction = promptMap[actionId] || "Summarize this text.";
        res = await api.post<{ reply?: string }>("/ai/chat", { messages: [{ role: "user", content: `${instruction}\n\n${text.substring(0, 100000)}` }] });
        setAiActionResult({ action: QUICK_ACTIONS.find(a => a.id === actionId)?.label || actionId, result: res.reply || "No response" });
      }
    } catch (err: unknown) { setAiActionResult({ action: "Error", result: err instanceof Error ? err.message : "AI action failed" }); }
    finally { setAiActionLoading(null); }
  };

  const exportText = async () => {
    const text = await fetchDocText();
    if (!text) return;
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `${doc?.title || 'document'}.txt`;
    a.click(); URL.revokeObjectURL(url);
  };

  const removeHighlight = (hlId: string) => setHighlights((prev) => prev.filter((h) => h.id !== hlId));
  const [confirmClearHighlights, setConfirmClearHighlights] = useState(false);
  const removeAllHighlights = () => { if (highlights.length > 0) setConfirmClearHighlights(true); };

  const exportHighlightSummary = () => {
    if (highlights.length === 0) return;
    let summary = `# Highlighted Text Summary - ${doc?.title || "PDF"}\n\n`;
    highlights.forEach((h, i) => {
      const colorName = HIGHLIGHT_COLORS.find(c => c.css === h.color)?.name || "Highlighted";
      summary += `**${i+1}. [${colorName}]** "${h.content}"\n\n`;
    });
    setNoteTitle(`Highlight Summary - ${doc?.title || "PDF"}`); setNoteContent(summary); setShowNotes(true);
  };

  const jumpToHighlight = (highlight: ColoredHighlight) => {
    if (highlight.highlightAreas.length > 0) highlightPluginInstance.jumpToHighlightArea(highlight.highlightAreas[0]);
  };

  const handleDownloadPdf = () => {
    if (pdfUrl) {
      const a = document.createElement("a");
      a.href = pdfUrl;
      a.download = doc?.name || "document.pdf";
      a.click();
    }
  };

  const handlePrintPdf = () => {
    if (pdfUrl) {
      const w = window.open(pdfUrl);
      if (w) {
        w.onload = () => { w.print(); };
      }
    }
  };

  const handleOpenInNewTab = () => {
    if (pdfUrl) {
      window.open(pdfUrl, "_blank");
    }
  };

  const renderHighlightTarget = useCallback((props: RenderHighlightTargetProps) => {
    const selText = props.selectedText;
    const currentTitle = noteTitleRef.current;
    return (
      <div style={{
        background: '#1a1a2e', display: 'flex', gap: '3px', position: 'absolute',
        left: `${props.selectionRegion.left}%`, top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
        transform: 'translate(0, 8px)', zIndex: 9999, padding: '5px 6px', borderRadius: '10px',
        boxShadow: '0 4px 20px rgba(0,0,0,0.4)', border: '1px solid #333', alignItems: 'center', flexWrap: 'wrap', maxWidth: '90vw',
      }}>
        {HIGHLIGHT_COLORS.slice(0, 6).map((c) => (
          <button key={c.value} onClick={() => setActiveColor(c)}
            style={{ width: '18px', height: '18px', borderRadius: '50%', background: c.css,
              border: activeColor.value === c.value ? '2px solid #fff' : '2px solid transparent',
              cursor: 'pointer', padding: 0, }}
            title={c.name} />
        ))}
        <div style={{ width: '1px', height: '18px', background: '#333', margin: '0 3px' }} />

        <button onClick={() => {
          const newHl: ColoredHighlight = {
            id: nextHighlightId(), content: selText, highlightAreas: props.highlightAreas,
            color: activeColor.css, timestamp: Date.now(),
          };
          setHighlights((prev) => [...prev, newHl]);
          props.toggle();
          setNoteContent((prev) => prev ? `${prev}\n\n[${activeColor.name}] "${selText}"` : `[${activeColor.name}] "${selText}"`);
          setShowNotes(true);
          if (!currentTitle) setNoteTitle(`Notes - ${doc?.title || "PDF"}`);
        }}
          style={{ background: activeColor.css, border: 'none', borderRadius: '6px', padding: '3px 8px',
            color: '#000', fontWeight: 600, fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}>
          <Highlighter style={{ width: '12px', height: '12px' }} /> Highlight
        </button>

        <div style={{ width: '1px', height: '18px', background: '#333', margin: '0 2px' }} />

        <button onClick={() => copyToClipboard(selText)}
          style={{ background: 'transparent', border: '1px solid #444', borderRadius: '6px', padding: '3px 6px',
            color: '#aaa', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
          title="Copy text">
          <Copy style={{ width: '12px', height: '12px' }} />
        </button>
        <button onClick={() => searchGoogle(selText)}
          style={{ background: 'transparent', border: '1px solid #444', borderRadius: '6px', padding: '3px 6px',
            color: '#aaa', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
          title="Search on Google">
          <Globe style={{ width: '12px', height: '12px' }} />
        </button>
        <button onClick={() => translateText(selText)}
          style={{ background: 'transparent', border: '1px solid #444', borderRadius: '6px', padding: '3px 6px',
            color: '#aaa', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
          title="Translate">
          <Languages style={{ width: '12px', height: '12px' }} />
        </button>
        <button onClick={() => speakText(selText)}
          style={{ background: 'transparent', border: '1px solid #444', borderRadius: '6px', padding: '3px 6px',
            color: speaking ? '#E91E63' : '#aaa', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
          title={speaking ? "Stop" : "Read Aloud"}>
          {speaking ? <VolumeX style={{ width: '12px', height: '12px' }} /> : <Volume2 style={{ width: '12px', height: '12px' }} />}
        </button>
        <button onClick={() => { props.toggle(); explainWithGemini(selText); }}
          style={{ background: '#FFCF7030', border: '1px solid #FFCF7060', borderRadius: '6px', padding: '3px 6px',
            color: '#FFCF70', fontSize: '11px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '3px' }}
          title="Explain with AI">
          <Brain style={{ width: '12px', height: '12px' }} />
        </button>
      </div>
    );
  }, [activeColor, speaking, speakText, searchGoogle, translateText, copyToClipboard, explainWithGemini, doc]);

  const renderHighlights = useCallback((props: RenderHighlightsProps) => (
    <div>
      {highlights.filter(() => showHighlights).map((highlight) => (
        <React.Fragment key={highlight.id}>
          {highlight.highlightAreas.filter((area) => area.pageIndex === props.pageIndex).map((area, idx) => (
            <div key={idx} style={{
              ...props.getCssProperties(area, props.rotation), background: highlight.color,
              position: 'absolute', pointerEvents: 'none', borderRadius: '2px',
            }} />
          ))}
        </React.Fragment>
      ))}
    </div>
  ), [highlights, showHighlights]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-st-bg-primary">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-st-accent mx-auto mb-3" />
          <p className="text-sm text-st-text-muted">Loading PDF viewer...</p>
        </div>
      </div>
    );
  }

  // Error state (document not found or fetch failed)
  if (error && !pdfUrl) {
    return (
      <div className="flex items-center justify-center h-full bg-st-bg-primary">
        <div className="text-center max-w-md">
          <FileX className="w-16 h-16 mx-auto text-red-400/50 mb-4" />
          <h3 className="text-lg font-semibold text-st-text-primary mb-2">Could not load document</h3>
          <p className="text-sm text-st-text-muted mb-4">{error || pdfLoadError}</p>
          <div className="flex flex-col items-center gap-3">
            <div className="flex items-center justify-center gap-2">
              <Button variant="primary" size="sm" onClick={fetchDoc}>
                <RotateCw className="w-4 h-4 mr-1" />Retry
              </Button>
              <Button variant="ghost" size="sm" onClick={() => router.push("/pdf-intelligence")}>
                <ArrowLeft className="w-4 h-4 mr-1" />Back
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={handleDownloadDirect}>
              <Download className="w-4 h-4 mr-1" />Download PDF Directly
            </Button>
          </div>
        </div>
      </div>
    );
  }

  const highlightPluginInstance = highlightPlugin({ renderHighlightTarget, renderHighlights });
  const defaultLayoutPluginInstance = defaultLayoutPlugin();

  const colorCounts = HIGHLIGHT_COLORS.map(c => ({ ...c, count: highlights.filter(h => h.color === c.css).length })).filter(c => c.count > 0);
  const wordCount = docText ? docText.split(/\s+/).length : 0;
  const readingTime = Math.ceil(wordCount / 200);

  return (
    <div className={`flex flex-col ${fullscreen ? "fixed inset-0 z-50 bg-st-bg-primary" : "h-full"}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-st-bg-elevated border-b border-st-border shrink-0 gap-2">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => router.push("/pdf-intelligence")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <FileText className="w-4 h-4 text-red-400" />
          <div className="hidden sm:block">
            <h2 className="text-sm font-semibold text-st-text-primary leading-tight">{doc?.title}</h2>
            <p className="text-[10px] text-st-text-muted leading-tight">
              {doc?.name} &middot; {((doc?.size || 0) / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Color Picker */}
          <div className="relative">
            <button onClick={() => setShowColorPicker(!showColorPicker)}
              className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-st-bg-card transition-colors text-xs text-st-text-secondary">
              <div style={{ width: '14px', height: '14px', borderRadius: '3px', background: activeColor.css }} />
              <Palette className="w-3 h-3" />
            </button>
            {showColorPicker && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowColorPicker(false)} />
                <div className="absolute top-full left-0 mt-1 z-20 bg-[#1a1a2e] border border-st-border rounded-lg p-2 shadow-xl" style={{ width: '190px' }}>
                  <p className="text-[10px] text-st-text-muted mb-1.5 px-1 font-medium">HIGHLIGHT COLOR</p>
                  <div className="grid grid-cols-4 gap-1.5">
                    {HIGHLIGHT_COLORS.map((c) => (
                      <button key={c.value} onClick={() => { setActiveColor(c); setShowColorPicker(false); }}
                        className="flex flex-col items-center gap-0.5 p-1 rounded hover:bg-white/10 transition-colors">
                        <div style={{ width: '24px', height: '24px', borderRadius: '6px', background: c.css, border: activeColor.value === c.value ? '2px solid #fff' : '2px solid transparent' }} />
                        <span className="text-[8px] text-st-text-muted">{c.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>

          <button onClick={() => setShowHighlights(!showHighlights)}
            className={`p-1.5 rounded-md transition-colors ${showHighlights ? 'text-st-accent' : 'text-st-text-muted'}`}
            title={showHighlights ? "Hide Highlights" : "Show Highlights"}>
            {showHighlights ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
          </button>

          {highlights.length > 0 && (
            <>
              <button onClick={() => setShowHighlightList(!showHighlightList)}
                className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-st-bg-card transition-colors text-xs text-st-text-secondary">
                <Highlighter className="w-3 h-3" /> <span>{highlights.length}</span> <ChevronDown className="w-3 h-3" />
              </button>
              <button onClick={exportHighlightSummary} className="p-1.5 rounded-md hover:bg-st-bg-card transition-colors text-st-text-muted hover:text-st-text-primary" title="Export highlights to note">
                <List className="w-3.5 h-3.5" />
              </button>
              <button onClick={removeAllHighlights} className="p-1.5 rounded-md hover:bg-st-bg-card transition-colors text-st-text-muted hover:text-st-danger" title="Remove all highlights">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </>
          )}

          <div className="w-px h-5 bg-st-border mx-1" />

          {/* Quick Actions */}
          <div className="relative">
            <button onClick={() => { setShowQuickActions(!showQuickActions); if (!showQuickActions) fetchDocText(); }}
              className="flex items-center gap-1 px-2 py-1 rounded-md hover:bg-st-bg-card transition-colors text-xs text-st-text-secondary">
              <Wand2 className="w-3 h-3" /> <span className="hidden sm:inline">AI</span> <ChevronDown className="w-3 h-3" />
            </button>
            {showQuickActions && (
              <>
                <div className="fixed inset-0 z-10" onClick={() => setShowQuickActions(false)} />
                <div className="absolute top-full right-0 mt-1 z-20 bg-[#1a1a2e] border border-st-border rounded-lg p-1.5 shadow-xl min-w-[150px]">
                  {QUICK_ACTIONS.map((action) => (
                    <button key={action.id} onClick={() => { setShowQuickActions(false); handleQuickAction(action.id); }}
                      className="flex items-center gap-2 w-full px-2.5 py-2 rounded-md hover:bg-white/5 transition-colors text-xs"
                      disabled={aiActionLoading !== null}>
                      <action.icon className={`w-3.5 h-3.5 ${action.color}`} />
                      <span className="text-st-text-primary">{action.label}</span>
                      {aiActionLoading === action.id && <Loader2 className="w-3 h-3 animate-spin ml-auto text-st-accent" />}
                    </button>
                  ))}
                  <div className="h-px bg-st-border my-1" />
                  <button onClick={() => { setShowQuickActions(false); exportText(); }}
                    className="flex items-center gap-2 w-full px-2.5 py-2 rounded-md hover:bg-white/5 transition-colors text-xs">
                    <Download className="w-3.5 h-3.5 text-st-text-muted" />
                    <span className="text-st-text-primary">Export as .txt</span>
                  </button>
                  <button onClick={() => { setShowQuickActions(false); setShowStats(!showStats); }}
                    className="flex items-center gap-2 w-full px-2.5 py-2 rounded-md hover:bg-white/5 transition-colors text-xs">
                    <BarChart3 className="w-3.5 h-3.5 text-st-text-muted" />
                    <span className="text-st-text-primary">Document Stats</span>
                  </button>
                </div>
              </>
            )}
          </div>

          <Button variant="ghost" size="sm" onClick={handleOpenInNewTab} title="Open in new tab">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
              <polyline points="15 3 21 3 21 9" /><line x1="10" y1="14" x2="21" y2="3" />
            </svg>
          </Button>
          <Button variant="ghost" size="sm" onClick={handleDownloadPdf} title="Download PDF">
            <Download className="w-4 h-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={handlePrintPdf} title="Print PDF">
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6 9 6 2 18 2 18 9" /><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
              <rect x="6" y="14" width="12" height="8" />
            </svg>
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmDelete(true)} title="Delete file">
            <Trash2 className="w-4 h-4 text-st-danger" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setFullscreen(!fullscreen)}>
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowNotes(!showNotes)}>
            <StickyNote className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">{showNotes ? "Hide" : "Notes"}</span>
          </Button>
          <Button variant="primary" size="sm" onClick={handleSummarizeToNote} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
            <span className="hidden sm:inline">{aiLoading ? "Summarizing..." : "Study Guide"}</span>
          </Button>
        </div>
      </div>

      {/* Highlight List Dropdown */}
      {showHighlightList && highlights.length > 0 && (
        <div className="bg-st-bg-elevated border-b border-st-border px-3 py-2 max-h-40 overflow-y-auto">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-semibold text-st-text-muted uppercase tracking-wider">Highlights ({highlights.length})</p>
            <button onClick={() => setShowHighlightList(false)} className="text-[10px] text-st-text-muted hover:text-st-text-primary">Close</button>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {highlights.map((h) => (
              <div key={h.id} onClick={() => jumpToHighlight(h)}
                className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-st-bg-card hover:bg-st-bg-card/80 transition-colors text-xs text-left max-w-[250px] group cursor-pointer">
                <div style={{ width: '10px', height: '10px', borderRadius: '2px', background: h.color, flexShrink: 0 }} />
                <span className="text-st-text-secondary truncate flex-1">{h.content.substring(0, 40)}</span>
                <span onClick={(e) => { e.stopPropagation(); removeHighlight(h.id); }}
                  className="ml-1 opacity-0 group-hover:opacity-100 text-st-text-muted hover:text-st-danger flex-shrink-0 cursor-pointer">
                  <Trash2 className="w-3 h-3" />
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Color count badges */}
      {colorCounts.length > 0 && !showHighlightList && (
        <div className="bg-st-bg-elevated/50 border-b border-st-border px-3 py-1 flex gap-2 items-center">
          {colorCounts.map((c) => (
            <span key={c.value} className="flex items-center gap-1 text-[10px] text-st-text-muted">
              <span style={{ width: '8px', height: '8px', borderRadius: '2px', background: c.css, display: 'inline-block' }} />
              {c.count}
            </span>
          ))}
        </div>
      )}

      {/* Document Stats */}
      {showStats && (
        <div className="bg-st-bg-elevated border-b border-st-border px-3 py-2">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="text-[10px] text-st-text-muted flex items-center gap-1">
              <FileText className="w-3 h-3" /> {wordCount.toLocaleString()} words
            </span>
            <span className="text-[10px] text-st-text-muted flex items-center gap-1">
              <BarChart3 className="w-3 h-3" /> {docText?.length.toLocaleString() || 0} characters
            </span>
            <span className="text-[10px] text-st-text-muted flex items-center gap-1">
              <Clock className="w-3 h-3" /> ~{readingTime} min read
            </span>
            <button onClick={() => setShowStats(false)} className="text-[10px] text-st-text-muted hover:text-st-text-primary ml-auto">Close</button>
          </div>
        </div>
      )}

      {/* Quick AI Action Result */}
      {aiActionResult && (
        <div className="bg-st-bg-elevated border-b border-st-border px-3 py-2 max-h-48 overflow-y-auto">
          <div className="flex items-center justify-between mb-1">
            <p className="text-[10px] font-semibold text-st-accent uppercase tracking-wider flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> {aiActionResult.action}
            </p>
            <div className="flex gap-1">
              <button onClick={() => { setNoteContent(aiActionResult.result); setNoteTitle(`${aiActionResult.action} - ${doc?.title || "PDF"}`); setShowNotes(true); }}
                className="text-[10px] text-st-text-muted hover:text-st-text-primary px-1">Save to Notes</button>
              <button onClick={() => copyToClipboard(aiActionResult.result)} className="text-[10px] text-st-text-muted hover:text-st-text-primary px-1">Copy</button>
              <button onClick={() => setAiActionResult(null)} className="text-[10px] text-st-text-muted hover:text-st-text-primary px-1">Close</button>
            </div>
          </div>
          <p className="text-xs text-st-text-primary whitespace-pre-wrap leading-relaxed">{aiActionResult.result}</p>
        </div>
      )}

      {/* PDF Viewer Error Banner */}
      {pdfLoadError && !pdfUrl && (
        <div className="bg-st-danger/10 border-b border-st-danger/30 px-4 py-3 flex items-center gap-2 flex-wrap">
          <AlertCircle className="w-4 h-4 text-st-danger shrink-0" />
          <p className="text-xs text-st-danger flex-1">{pdfLoadError}</p>
          <div className="flex gap-2">
            <button onClick={fetchDoc} className="text-xs text-st-danger hover:text-st-danger/80 font-medium shrink-0">
              <RotateCw className="w-3 h-3 inline mr-1" />Retry
            </button>
            <button onClick={handleDownloadDirect} className="text-xs text-st-danger/80 hover:text-st-danger font-medium shrink-0 flex items-center gap-1">
              <Download className="w-3 h-3" /> Download
            </button>
          </div>
        </div>
      )}

      <div className="flex-1 flex min-h-0 relative">
        {/* PDF Viewer */}
        <div className={`${showNotes ? "w-2/3" : "w-full"} transition-all duration-300 relative h-full overflow-hidden`}>
          {pdfUrl ? (
            <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
              <Viewer
                fileUrl={pdfUrl}
                plugins={[defaultLayoutPluginInstance, highlightPluginInstance]}
              />
            </Worker>
          ) : pdfLoadError ? (
            <div className="flex items-center justify-center h-full">
              <div className="text-center">
                <FileX className="w-12 h-12 text-st-text-muted opacity-30 mx-auto mb-3" />
                <p className="text-sm text-st-text-muted mb-3">{pdfLoadError}</p>
                <div className="flex flex-col items-center gap-2">
                  <Button variant="primary" size="sm" onClick={fetchDoc}>
                    <RotateCw className="w-4 h-4 mr-1" />Try Again
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleDownloadDirect}>
                    <Download className="w-4 h-4 mr-1" />Download PDF Directly
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-st-accent" />
            </div>
          )}
        </div>

        {/* Notes Panel */}
        {showNotes && (
          <div className="w-1/3 border-l border-st-border flex flex-col bg-st-bg-primary overflow-hidden">
            <div className="p-3 border-b border-st-border flex items-center justify-between shrink-0">
              <h3 className="text-sm font-semibold text-st-text-primary">Notes</h3>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => { setSelectedNote(null); setNoteTitle(""); setNoteContent(""); }}>
                  <FileText className="w-3 h-3 mr-1" />New
                </Button>
                <Button variant="primary" size="sm" onClick={handleSaveNote} disabled={saving}>
                  <Save className="w-3 h-3 mr-1" />{saving ? "..." : "Save"}
                </Button>
              </div>
            </div>

            <div className="flex gap-1.5 p-2 border-b border-st-border overflow-x-auto shrink-0">
              {notes.slice(0, 15).map((n) => (
                <button key={n.id} onClick={() => { setSelectedNote(n); setNoteTitle(n.title); setNoteContent(n.content); }}
                  className={`shrink-0 px-2 py-1 rounded text-[10px] font-medium transition-colors whitespace-nowrap ${selectedNote?.id === n.id ? "bg-st-accent text-black" : "bg-st-bg-elevated text-st-text-secondary hover:text-st-text-primary"}`}>
                  {n.title.substring(0, 18)}{n.title.length > 18 ? ".." : ""}
                </button>
              ))}
            </div>

            <div className="flex-1 flex flex-col p-3 gap-2 min-h-0 overflow-hidden">
              <input type="text" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Note title..." className="w-full bg-transparent text-sm font-semibold text-st-text-primary focus:outline-none border-b border-st-border pb-1 shrink-0" />
              <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)}
                className="flex-1 bg-st-bg-card border border-st-border rounded-lg p-3 text-sm text-st-text-primary leading-relaxed resize-none focus:outline-none focus:border-st-accent/30 font-mono min-h-0"
                placeholder="Write your notes here..." />

              {noteContent && HIGHLIGHT_COLORS.some(c => noteContent.includes(c.name)) && (
                <div className="flex gap-1.5 flex-wrap shrink-0">
                  {HIGHLIGHT_COLORS.filter(c => noteContent.includes(c.name)).map((c) => (
                    <span key={c.value} className="flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] text-st-text-muted" style={{ background: c.css + '20' }}>
                      <span style={{ width: '6px', height: '6px', borderRadius: '2px', background: c.css, display: 'inline-block' }} />
                      {c.name}
                    </span>
                  ))}
                </div>
              )}

              {aiSummary && (
                <Card className="p-2 bg-st-accent/5 border-st-accent/20 shrink-0">
                  <p className="text-[10px] text-st-accent font-semibold mb-1 flex items-center gap-1"><Sparkles className="w-3 h-3" />AI Summary</p>
                  <p className="text-xs text-st-text-secondary line-clamp-3">{aiSummary}</p>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>

      {/* AI Explain Modal */}
      {explainText && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/60" onClick={() => { setExplainText(""); setExplainResult(""); }}>
          <Card className="w-full max-w-lg mx-4 max-h-[80vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between p-4 border-b border-st-border shrink-0">
              <div className="flex items-center gap-2"><Brain className="w-5 h-5 text-st-accent" /><h3 className="font-bold text-st-text-primary text-sm">AI Explanation</h3></div>
              <button onClick={() => { setExplainText(""); setExplainResult(""); }} className="text-st-text-muted hover:text-st-text-primary"><X className="w-5 h-5" /></button>
            </div>
            <div className="p-4 overflow-y-auto flex-1 space-y-4">
              <div className="bg-st-bg-elevated rounded-lg p-3 border border-st-border">
                <p className="text-[10px] text-st-text-muted font-semibold mb-1 uppercase tracking-wider">Selected Text</p>
                <p className="text-sm text-st-text-primary italic">&ldquo;{explainText}&rdquo;</p>
              </div>
              {explainLoading ? (
                <div className="flex items-center justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-st-accent mr-2" /><span className="text-sm text-st-text-muted">Analyzing with Gemini AI...</span></div>
              ) : explainResult ? (
                <div className="bg-st-accent/5 rounded-lg p-3 border border-st-accent/20">
                  <p className="text-[10px] text-st-accent font-semibold mb-2 uppercase tracking-wider flex items-center gap-1"><Sparkles className="w-3 h-3" />Gemini AI Explanation</p>
                  <p className="text-sm text-st-text-primary leading-relaxed whitespace-pre-wrap">{explainResult}</p>
                </div>
              ) : null}
            </div>
            <div className="flex items-center justify-end gap-2 p-3 border-t border-st-border shrink-0">
              <Button variant="ghost" size="sm" onClick={() => { if (explainResult) { setNoteContent((prev) => `${prev ? prev + '\n\n' : ''}--- AI Explanation ---\n"${explainText}"\n\n${explainResult}`); setShowNotes(true); } }} disabled={!explainResult}>
                <Save className="w-3 h-3 mr-1" />Save to Notes
              </Button>
              <Button variant="primary" size="sm" onClick={() => { setExplainText(""); setExplainResult(""); }}>Close</Button>
            </div>
          </Card>
        </div>
      )}

      <ConfirmDialog
        isOpen={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={handleDeleteFile}
        title="Delete File"
        message="Are you sure you want to delete this file permanently? This cannot be undone."
        itemName={doc?.title}
      />

      <ConfirmDialog
        isOpen={confirmClearHighlights}
        onClose={() => setConfirmClearHighlights(false)}
        onConfirm={() => { setHighlights([]); setConfirmClearHighlights(false); }}
        title="Remove Highlights"
        message="Remove all highlights from this document?"
        confirmLabel="Remove All"
        variant="warning"
      />
    </div>
  );
}
