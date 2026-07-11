"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FlowDiagram } from "@/components/interview-hub/FlowDiagram";
import { EmptyState } from "@/components/interview-hub/EmptyState";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Send, Loader2, Sparkles, MessageSquare, Bot, BookOpen, Lightbulb, Link2,
} from "lucide-react";

interface Node {
  id: string;
  label: string;
  type: "start" | "process" | "decision" | "end" | "database";
}

interface Edge {
  from: string;
  to: string;
  label?: string;
}

interface DiagramResponse {
  nodes: Node[];
  edges: Edge[];
  explanations?: Record<string, string>;
  relatedConcepts?: string[];
}

interface QAResponse {
  answer: string;
  explanation: string;
  followUpQuestions?: string[];
  relatedConcepts?: string[];
}

export default function QAFlowPage() {
  const [question, setQuestion] = useState("");
  const [loading, setLoading] = useState(false);
  const [diagram, setDiagram] = useState<DiagramResponse | null>(null);
  const [qaResult, setQaResult] = useState<QAResponse | null>(null);
  const [activeTab, setActiveTab] = useState<"qa" | "diagram">("qa");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async () => {
    const q = question.trim();
    if (!q || loading) return;
    setLoading(true);
    setError(null);
    setDiagram(null);
    setQaResult(null);

    try {
      const [qaData, diagramData] = await Promise.all([
        api.post<{ result: QAResponse }>("/interview/ask", { question: q }).catch(() => null),
        api.post<DiagramResponse>("/interview/diagram", { topic: q }).catch(() => null),
      ]);

      if (qaData?.result) setQaResult(qaData.result);
      if (diagramData) setDiagram(diagramData);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate response");
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const hasContent = qaResult || diagram;

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-st-text-primary tracking-tight">Q&A with Flow Diagrams</h1>
        <p className="text-sm text-st-text-secondary">Ask a question and get an answer with a visual flow diagram</p>
      </motion.div>

      {/* Input */}
      <Card className="p-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-st-text-secondary mb-1.5 block">Your Question</label>
            <input
              type="text"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., How does JWT authentication work?"
              className="w-full px-3 py-2 bg-st-bg-elevated border border-st-border rounded-lg text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none focus:border-st-accent/50"
            />
          </div>
          <Button variant="primary" size="md" className="shrink-0" onClick={handleSubmit} disabled={loading || !question.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? "Generating..." : "Ask"}
          </Button>
        </div>
      </Card>

      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-st-danger text-center">
          {error}
        </motion.p>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-st-accent mx-auto mb-3" />
            <p className="text-sm text-st-text-muted">Generating answer and flow diagram...</p>
          </div>
        </div>
      )}

      {hasContent && !loading && (
        <>
          {/* Tabs */}
          <div className="flex gap-1 bg-st-bg-elevated p-1 rounded-lg w-fit">
            <button
              onClick={() => setActiveTab("qa")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                activeTab === "qa" ? "bg-st-bg-card text-st-text-primary shadow-sm" : "text-st-text-muted hover:text-st-text-primary"
              )}
            >
              <MessageSquare className="w-3.5 h-3.5" /> Q&A
            </button>
            <button
              onClick={() => setActiveTab("diagram")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all",
                activeTab === "diagram" ? "bg-st-bg-card text-st-text-primary shadow-sm" : "text-st-text-muted hover:text-st-text-primary"
              )}
            >
              <Link2 className="w-3.5 h-3.5" /> Flow Diagram
            </button>
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "qa" && qaResult && (
              <motion.div
                key="qa"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <Card className="p-5">
                  <div className="flex items-start gap-3 mb-4">
                    <div className="w-8 h-8 rounded-lg bg-st-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-4 h-4 text-st-accent" />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold text-st-text-primary mb-1">Answer</h3>
                      <p className="text-sm text-st-text-secondary leading-relaxed">{qaResult.answer}</p>
                    </div>
                  </div>

                  {qaResult.explanation && (
                    <div className="mt-3 pt-3 border-t border-st-border/50">
                      <div className="flex items-center gap-1.5 mb-2">
                        <Lightbulb className="w-3.5 h-3.5 text-st-accent" />
                        <span className="text-xs font-semibold text-st-accent">Explanation</span>
                      </div>
                      <p className="text-sm text-st-text-secondary">{qaResult.explanation}</p>
                    </div>
                  )}

                  {qaResult.followUpQuestions && qaResult.followUpQuestions.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-st-border/50">
                      <p className="text-xs font-semibold text-st-accent mb-2">Follow-up Questions</p>
                      <div className="space-y-1">
                        {qaResult.followUpQuestions.map((q, i) => (
                          <p key={i} className="text-sm text-st-text-secondary">&bull; {q}</p>
                        ))}
                      </div>
                    </div>
                  )}

                  {qaResult.relatedConcepts && qaResult.relatedConcepts.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-st-border/50 flex flex-wrap gap-1.5">
                      {qaResult.relatedConcepts.map((concept, i) => (
                        <Badge key={i} variant="outline" className="text-[10px]">{concept}</Badge>
                      ))}
                    </div>
                  )}
                </Card>
              </motion.div>
            )}

            {activeTab === "diagram" && diagram && (
              <motion.div
                key="diagram"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="space-y-4"
              >
                <Card className="p-5">
                  <h3 className="text-sm font-semibold text-st-text-primary mb-4 flex items-center gap-2">
                    <Link2 className="w-4 h-4 text-st-accent" />
                    Flow Diagram
                  </h3>
                  <FlowDiagram nodes={diagram.nodes} edges={diagram.edges} explanations={diagram.explanations} />
                </Card>

                {/* Node explanations as cards */}
                {diagram.explanations && Object.keys(diagram.explanations).length > 0 && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-semibold text-st-text-primary flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-st-accent" />
                      Node Explanations
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {diagram.nodes.map((node) => {
                        const exp = diagram.explanations?.[node.id];
                        if (!exp) return null;
                        return (
                          <Card key={node.id} className="p-3">
                            <Badge variant="outline" className="text-[9px] mb-1">{node.type}</Badge>
                            <p className="text-xs font-medium text-st-text-primary mb-0.5">{node.label}</p>
                            <p className="text-[11px] text-st-text-secondary">{exp}</p>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Related Concepts */}
                {diagram.relatedConcepts && diagram.relatedConcepts.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-st-accent mb-2">Related Concepts</p>
                    <div className="flex flex-wrap gap-1.5">
                      {diagram.relatedConcepts.map((concept, i) => (
                        <Badge key={i} variant="outline" className="text-[10px] flex items-center gap-1">
                          <Sparkles className="w-2 h-2" /> {concept}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}

      {!hasContent && !loading && (
        <EmptyState
          icon={MessageSquare}
          title="Ask a question"
          description="Type a technical question above to get an AI-powered answer with a visual flow diagram"
        />
      )}
    </div>
  );
}
