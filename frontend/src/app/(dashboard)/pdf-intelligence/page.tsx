"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { FileText, Upload, MessageSquare, Sparkles, BookOpen, HelpCircle, Brain, Lightbulb, Search, ChevronRight, FileSearch } from "lucide-react";

type PDFDoc = { id: string; title: string; pages: number; size: string; uploadedAt: string; status: "analyzed" | "processing" | "pending" };

const mockDocs: PDFDoc[] = [
  { id: "1", title: "Designing Data-Intensive Applications", pages: 562, size: "24MB", uploadedAt: "2 days ago", status: "analyzed" },
  { id: "2", title: "Clean Architecture", pages: 404, size: "12MB", uploadedAt: "1 week ago", status: "analyzed" },
  { id: "3", title: "Kubernetes in Action", pages: 592, size: "18MB", uploadedAt: "2 weeks ago", status: "processing" },
];

export default function PDFIntelligencePage() {
  const [selectedDoc, setSelectedDoc] = useState<PDFDoc | null>(mockDocs[0]);
  const [chatInput, setChatInput] = useState("");

  const aiFeatures = [
    { icon: BookOpen, title: "Full Summary", desc: "AI-generated comprehensive summary" },
    { icon: Lightbulb, title: "Key Concepts", desc: "Extract main ideas and themes" },
    { icon: HelpCircle, title: "Interview Questions", desc: "Generate practice questions" },
    { icon: Brain, title: "Flashcards", desc: "Auto-create study flashcards" },
    { icon: FileSearch, title: "Chapter Summaries", desc: "Per-chapter analysis" },
    { icon: Sparkles, title: "Mind Map", desc: "Visual concept map generation" },
  ];

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-st-accent uppercase mb-1">Document Intelligence</p>
          <h1 className="text-3xl font-bold text-st-text-primary">PDF Intelligence</h1>
        </div>
        <Button variant="primary" size="sm"><Upload className="w-4 h-4 mr-1" />Upload PDF</Button>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden">
        {/* Document List */}
        <div className="col-span-3 flex flex-col gap-3 overflow-y-auto">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-st-text-muted" />
            <input type="text" placeholder="Search documents..."
              className="w-full pl-9 pr-4 py-2 bg-st-bg-elevated border border-st-border rounded-lg text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none focus:border-st-accent/50" />
          </div>
          {mockDocs.map(doc => (
            <Card key={doc.id} onClick={() => setSelectedDoc(doc)}
              className={`p-4 cursor-pointer transition-all ${selectedDoc?.id === doc.id ? "border-st-accent/50 bg-st-bg-elevated" : "hover:border-st-accent/20"}`}>
              <div className="flex items-start gap-3">
                <FileText className="w-8 h-8 text-red-400 shrink-0" />
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-st-text-primary truncate">{doc.title}</h4>
                  <p className="text-xs text-st-text-muted mt-0.5">{doc.pages} pages · {doc.size}</p>
                  <Badge variant={doc.status === "analyzed" ? "success" : doc.status === "processing" ? "warning" : "outline"} className="mt-2">
                    {doc.status}
                  </Badge>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="col-span-9 flex flex-col gap-6 overflow-y-auto">
          {selectedDoc ? (
            <>
              <Card className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h2 className="text-xl font-bold text-st-text-primary">{selectedDoc.title}</h2>
                    <p className="text-sm text-st-text-muted">{selectedDoc.pages} pages · Uploaded {selectedDoc.uploadedAt}</p>
                  </div>
                  <Badge variant={selectedDoc.status === "analyzed" ? "success" : "warning"}>{selectedDoc.status}</Badge>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {aiFeatures.map((feat, i) => (
                    <button key={i} className="p-4 bg-st-bg-elevated rounded-lg border border-st-border hover:border-st-accent/30 transition-all text-left group">
                      <feat.icon className="w-5 h-5 text-st-accent mb-2 group-hover:scale-110 transition-transform" />
                      <p className="text-sm font-medium text-st-text-primary">{feat.title}</p>
                      <p className="text-xs text-st-text-muted">{feat.desc}</p>
                    </button>
                  ))}
                </div>
              </Card>

              {/* Q&A Chat */}
              <Card className="p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-bold text-st-text-primary mb-4 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5 text-st-accent" />Ask about this document
                </h3>
                <div className="flex-1 flex items-center justify-center text-st-text-muted mb-4">
                  <p className="text-sm">Ask any question about &quot;{selectedDoc.title}&quot; and get AI-powered answers.</p>
                </div>
                <div className="flex gap-3">
                  <input type="text" value={chatInput} onChange={(e) => setChatInput(e.target.value)}
                    placeholder="What are the key takeaways from chapter 3?"
                    className="flex-1 bg-st-bg-elevated border border-st-border rounded-lg px-4 py-2 text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none focus:border-st-accent/50" />
                  <Button variant="primary" size="md">Ask AI</Button>
                </div>
              </Card>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <FileText className="w-16 h-16 mx-auto text-st-text-muted opacity-20 mb-4" />
                <p className="text-st-text-muted">Select a document to analyze</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
