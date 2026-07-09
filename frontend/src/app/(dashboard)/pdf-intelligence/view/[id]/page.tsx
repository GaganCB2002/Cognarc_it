"use client";

import React, { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import api from "@/lib/api";
import {
  FileText, ArrowLeft, Sparkles, Save, Loader2, Maximize2,
  Minimize2, BookOpen
} from "lucide-react";

import { Worker, Viewer } from '@react-pdf-viewer/core';
import { defaultLayoutPlugin } from '@react-pdf-viewer/default-layout';
import { highlightPlugin, RenderHighlightTargetProps, MessageIcon } from '@react-pdf-viewer/highlight';

import '@react-pdf-viewer/core/lib/styles/index.css';
import '@react-pdf-viewer/default-layout/lib/styles/index.css';
import '@react-pdf-viewer/highlight/lib/styles/index.css';

type PDFDoc = {
  id: string; name: string; title: string; mimeType: string;
  size: number; type: string; status: string;
};

type Note = {
  id: string; title: string; content: string; tags: string[];
  folder: string; isPinned: boolean; updatedAt: string;
};

export default function PDFViewerPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

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
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [pdfData, setPdfData] = useState<Uint8Array | null>(null);

  // Plugins
  const defaultLayoutPluginInstance = defaultLayoutPlugin();
  
  const renderHighlightTarget = (props: RenderHighlightTargetProps) => (
    <div
        style={{
            background: '#eee',
            display: 'flex',
            position: 'absolute',
            left: `${props.selectionRegion.left}%`,
            top: `${props.selectionRegion.top + props.selectionRegion.height}%`,
            transform: 'translate(0, 8px)',
            zIndex: 1,
            padding: '4px',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
        }}
    >
        <Button variant="primary" size="sm" onClick={() => {
            props.toggle();
            setNoteContent(`[Highlighted Text: "${props.selectedText}"]\n\n`);
            setShowNotes(true);
            setNoteTitle(`Highlight Note - ${new Date().toLocaleTimeString()}`);
        }}>
            Add Note
        </Button>
    </div>
  );

  const highlightPluginInstance = highlightPlugin({
      renderHighlightTarget,
  });

  const fetchDoc = async () => {
    try {
      setLoading(true);
      const data = await api.get<any>("/upload/my-files");
      const found = data.find((d: any) => d.id === id);
      if (found) {
        setDoc(found);
      } else {
        setError("Document not found");
      }
      
      // Fetch the actual PDF data
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/upload/${id}`, {
        headers: { Authorization: `Bearer ${api.getToken()}` }
      });
      if (res.ok) {
        const arrayBuffer = await res.arrayBuffer();
        setPdfData(new Uint8Array(arrayBuffer));
      }
    } catch (err: any) {
      setError(err.message || "Failed to load document");
    } finally {
      setLoading(false);
    }
  };

  const fetchNotes = async () => {
    try {
      const res = await api.get<any>("/notes");
      if (res && res.data) setNotes(res.data);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchDoc();
    fetchNotes();
  }, [id]);

  const handleCreateNote = async () => {
    try {
      const res = await api.post<any>("/notes", {
        title: noteTitle || `Notes - ${doc?.title || "PDF"}`,
        content: noteContent || " ",
        tags: ["pdf"],
        folderId: null,
      });
      if (res && res.data) {
        setNotes((prev) => [res.data, ...prev]);
        setSelectedNote(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create note");
    }
  };

  const handleSaveNote = async () => {
    if (!selectedNote) {
      await handleCreateNote();
      return;
    }
    setSaving(true);
    try {
      const res = await api.put<any>(`/notes/${selectedNote.id}`, {
        title: noteTitle,
        content: noteContent,
      });
      if (res && res.data) {
        setNotes((prev) => prev.map((n) => (n.id === selectedNote.id ? res.data : n)));
        setSelectedNote(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to save note");
    } finally {
      setSaving(false);
    }
  };

  const handleSummarizeToNote = async () => {
    setAiLoading(true);
    setAiSummary(null);
    try {
      const fileRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/upload/${id}/text`,
        { headers: { Authorization: `Bearer ${api.getToken()}` } }
      );
      if (!fileRes.ok) throw new Error("Failed to extract text from document");
      const { text } = await fileRes.json();

      const res = await api.post<any>("/ai/summary", { text });
      const summary = res.summary || JSON.stringify(res);

      setAiSummary(summary);
      setNoteTitle(`AI Summary - ${doc?.title || "PDF"}`);
      setNoteContent(summary);
      setShowNotes(true);

      // Auto-save as a note
      const noteRes = await api.post<any>("/notes", {
        title: `AI Summary - ${doc?.title || "PDF"}`,
        content: summary,
        tags: ["pdf", "ai-summary"],
        folderId: null,
      });
      if (noteRes && noteRes.data) {
        setNotes((prev) => [noteRes.data, ...prev]);
        setSelectedNote(noteRes.data);
      }
    } catch (err: any) {
      setError(err.message || "AI summary failed");
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-6 h-6 animate-spin text-st-accent" />
      </div>
    );
  }

  if (error || !doc) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <FileText className="w-12 h-12 mx-auto text-st-text-muted opacity-30 mb-3" />
          <p className="text-st-text-muted">{error || "Document not found"}</p>
          <Button variant="ghost" size="sm" className="mt-4" onClick={() => router.push("/pdf-intelligence")}>
            <ArrowLeft className="w-4 h-4 mr-1" />Back
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className={`flex flex-col ${fullscreen ? "fixed inset-0 z-50 bg-st-bg-primary" : "h-full"}`}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-st-bg-elevated border-b border-st-border shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={() => router.push("/pdf-intelligence")}>
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <FileText className="w-5 h-5 text-red-400" />
          <div>
            <h2 className="text-sm font-semibold text-st-text-primary">{doc.title}</h2>
            <p className="text-[10px] text-st-text-muted">
              {doc.name} &middot; {((doc.size || 0) / 1024 / 1024).toFixed(1)} MB
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setFullscreen(!fullscreen)}>
            {fullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowNotes(!showNotes)}>
            <BookOpen className="w-4 h-4 mr-1" />{showNotes ? "Hide Notes" : "Notes"}
          </Button>
          <Button variant="primary" size="sm" onClick={handleSummarizeToNote} disabled={aiLoading}>
            {aiLoading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Sparkles className="w-4 h-4 mr-1" />}
            {aiLoading ? "Summarizing..." : "AI Summarize to Note"}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex min-h-0 relative">
        {/* PDF Viewer */}
        <div className={`${showNotes ? "w-2/3" : "w-full"} transition-all duration-300 relative h-full bg-gray-100 overflow-hidden`}>
           {pdfData && (
             <Worker workerUrl="https://unpkg.com/pdfjs-dist@3.4.120/build/pdf.worker.min.js">
                <Viewer
                    fileUrl={pdfData}
                    plugins={[
                        defaultLayoutPluginInstance,
                        highlightPluginInstance
                    ]}
                />
             </Worker>
           )}
        </div>

        {/* Notes Panel */}
        {showNotes && (
          <div className="w-1/3 border-l border-st-border flex flex-col bg-st-bg-primary absolute right-0 top-0 bottom-0 z-10 sm:relative">
            <div className="p-3 border-b border-st-border flex items-center justify-between">
              <h3 className="text-sm font-semibold text-st-text-primary">Notes</h3>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => { setSelectedNote(null); setNoteTitle(""); setNoteContent(""); }}>
                  <FileText className="w-3 h-3 mr-1" />New
                </Button>
                <Button variant="primary" size="sm" onClick={handleSaveNote} disabled={saving}>
                  <Save className="w-3 h-3 mr-1" />{saving ? "Saving..." : "Save"}
                </Button>
              </div>
            </div>

            {/* Note list */}
            <div className="flex gap-2 p-2 border-b border-st-border overflow-x-auto">
              {notes.slice(0, 10).map((n) => (
                <button key={n.id} onClick={() => { setSelectedNote(n); setNoteTitle(n.title); setNoteContent(n.content); }}
                  className={`shrink-0 px-2 py-1 rounded text-xs font-medium transition-colors ${selectedNote?.id === n.id ? "bg-st-accent text-black" : "bg-st-bg-elevated text-st-text-secondary hover:text-st-text-primary"}`}>
                  {n.title.substring(0, 20)}...
                </button>
              ))}
            </div>

            {/* Editor */}
            <div className="flex-1 flex flex-col p-3 gap-2 min-h-0">
              <input type="text" value={noteTitle} onChange={(e) => setNoteTitle(e.target.value)}
                placeholder="Note title..."
                className="w-full bg-transparent text-sm font-semibold text-st-text-primary focus:outline-none border-b border-st-border pb-1" />
              <textarea value={noteContent} onChange={(e) => setNoteContent(e.target.value)}
                className="flex-1 bg-st-bg-card border border-st-border rounded-lg p-3 text-sm text-st-text-primary leading-relaxed resize-none focus:outline-none focus:border-st-accent/30 font-mono"
                placeholder="Write your notes here..." />
              {aiSummary && (
                <Card className="p-2 bg-st-accent/5 border-st-accent/20">
                  <p className="text-[10px] text-st-accent font-semibold mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />AI Summary Generated
                  </p>
                  <p className="text-xs text-st-text-secondary line-clamp-3">{aiSummary}</p>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
