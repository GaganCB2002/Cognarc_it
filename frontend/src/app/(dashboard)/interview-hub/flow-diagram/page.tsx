"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { FlowDiagram } from "@/components/interview-hub/FlowDiagram";
import { EmptyState } from "@/components/interview-hub/EmptyState";
import api from "@/lib/api";
import {
  Send, Loader2, Sparkles, Link2, BookOpen, Lightbulb, RotateCcw,
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

const presetTopics = [
  "Authentication Flow",
  "Binary Search Algorithm",
  "MERN Architecture",
  "JWT Token Flow",
  "REST API Design",
  "CI/CD Pipeline",
  "Database Sharding",
  "OAuth 2.0 Flow",
  "React Component Lifecycle",
  "System Design: URL Shortener",
];

export default function FlowDiagramPage() {
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);
  const [diagram, setDiagram] = useState<DiagramResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const generateDiagram = async (t: string) => {
    const topicStr = t.trim();
    if (!topicStr || loading) return;
    setLoading(true);
    setError(null);
    setDiagram(null);
    try {
      const data = await api.post<DiagramResponse>("/interview/diagram", { topic: topicStr });
      setDiagram(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to generate diagram");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = () => generateDiagram(topic);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePreset = (t: string) => {
    setTopic(t);
    generateDiagram(t);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-st-text-primary tracking-tight">Flow Diagram Generator</h1>
        <p className="text-sm text-st-text-secondary">Generate animated flow diagrams for any technical topic</p>
      </motion.div>

      {/* Input */}
      <Card className="p-4">
        <div className="flex gap-3 items-end">
          <div className="flex-1">
            <label className="text-xs font-medium text-st-text-secondary mb-1.5 block">Topic</label>
            <input
              type="text"
              value={topic}
              onChange={(e) => setTopic(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g., Authentication, Binary Search, MERN Architecture..."
              className="w-full px-3 py-2 bg-st-bg-elevated border border-st-border rounded-lg text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none focus:border-st-accent/50"
            />
          </div>
          <Button variant="primary" size="md" className="shrink-0" onClick={handleSubmit} disabled={loading || !topic.trim()}>
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            {loading ? "Generating..." : "Generate"}
          </Button>
        </div>
      </Card>

      {/* Preset Topics */}
      <div className="flex flex-wrap gap-2">
        {presetTopics.map((t) => (
          <button
            key={t}
            onClick={() => handlePreset(t)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-st-bg-elevated border border-st-border hover:border-st-accent/30 transition-all text-xs text-st-text-secondary cursor-pointer"
          >
            <Sparkles className="w-3 h-3 text-st-accent" />
            {t}
          </button>
        ))}
      </div>

      {error && (
        <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-xs text-st-danger text-center">
          {error}
        </motion.p>
      )}

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <Loader2 className="w-8 h-8 animate-spin text-st-accent mx-auto mb-3" />
            <p className="text-sm text-st-text-muted">Generating flow diagram...</p>
          </div>
        </div>
      )}

      <AnimatePresence mode="wait">
        {diagram && !loading && (
          <motion.div
            key="diagram"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-semibold text-st-text-primary flex items-center gap-2">
                  <Link2 className="w-4 h-4 text-st-accent" />
                  {topic || "Diagram"}
                </h3>
                <Button variant="ghost" size="sm" onClick={() => generateDiagram(topic || "Authentication")}>
                  <RotateCcw className="w-3.5 h-3.5 mr-1" /> Regenerate
                </Button>
              </div>
              <div className="bg-st-bg-primary/50 rounded-xl p-4">
                <FlowDiagram nodes={diagram.nodes} edges={diagram.edges} explanations={diagram.explanations} />
              </div>
            </Card>

            {/* Node Explanations */}
            {diagram.explanations && Object.keys(diagram.explanations).length > 0 && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-st-text-primary flex items-center gap-2">
                  <BookOpen className="w-4 h-4 text-st-accent" />
                  Node Explanations
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {diagram.nodes.map((node) => {
                    const exp = diagram.explanations?.[node.id];
                    if (!exp) return null;
                    return (
                      <motion.div
                        key={node.id}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                      >
                        <Card className="p-3">
                          <div className="flex items-center gap-2 mb-1">
                            <Badge variant="outline" className="text-[9px]">{node.type}</Badge>
                            <span className="text-xs font-medium text-st-text-primary">{node.label}</span>
                          </div>
                          <p className="text-[11px] text-st-text-secondary leading-relaxed">{exp}</p>
                        </Card>
                      </motion.div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Related Concepts */}
            {diagram.relatedConcepts && diagram.relatedConcepts.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-st-accent mb-2 flex items-center gap-1.5">
                  <Lightbulb className="w-3 h-3" /> Related Concepts
                </p>
                <div className="flex flex-wrap gap-1.5">
                  {diagram.relatedConcepts.map((concept, i) => (
                    <Badge key={i} variant="outline" className="text-[10px]">{concept}</Badge>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {!diagram && !loading && (
        <EmptyState
          icon={Link2}
          title="Generate a flow diagram"
          description="Type a topic above or select a preset to generate an animated flow diagram"
        />
      )}
    </div>
  );
}
