"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { BrainCircuit, BookOpen, Loader2 } from "lucide-react";
import api from "@/lib/api";

export function DocumentIntelPanel({ documentText }: { documentText?: string }) {
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<{ summary?: string; keyTopics?: string[]; quiz?: { id: string; question: string; options: string[] }[] } | null>(null);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const text = documentText || "mock text from pdf";
      const summaryRes = await api.post<{ summary?: string; keyTopics?: string[] }>("/ai/summary", { text });
      const quizRes = await api.post<{ questions?: { question: string; options: string[] }[] }>("/ai/quiz", { text });
      
      setData({
        summary: summaryRes.summary,
        keyTopics: summaryRes.keyTopics,
        quiz: (quizRes.questions || []).map((q, i) => ({ ...q, id: `q-${i}` })),
      });
    } catch (error) {
      console.error("Failed to fetch AI data", error);
    } finally {
      setLoading(false);
    }
  };

  if (!data) {
    return (
      <Card className="bg-st-bg-elevated border-st-border p-8 flex flex-col items-center justify-center text-center h-full min-h-[400px]">
        <BrainCircuit className="w-16 h-16 text-st-border mb-4" />
        <h3 className="text-xl font-medium text-st-text-primary mb-2">Document Intelligence</h3>
        <p className="text-st-text-secondary mb-6 max-w-sm">
          Initialize the neural processor to extract key concepts, generate a summary, and build a spaced-repetition quiz.
        </p>
        <Button onClick={handleAnalyze} disabled={loading} className="w-full max-w-xs">
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            "Analyze Current Module"
          )}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="bg-st-bg-elevated border-st-border flex flex-col h-full min-h-[500px]">
      <div className="p-5 border-b border-st-border flex items-center gap-2">
        <BrainCircuit className="w-5 h-5 text-st-accent" />
        <h3 className="font-semibold text-st-text-primary">AI Synthesis</h3>
      </div>
      
      <div className="p-5 flex-1 overflow-y-auto space-y-8">
        <div>
          <h4 className="text-sm font-semibold tracking-widest text-st-text-muted uppercase mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" /> Executive Summary
          </h4>
          <p className="text-sm text-st-text-primary leading-relaxed bg-st-bg-card p-4 rounded-lg border border-st-border">
            {data.summary}
          </p>
        </div>

        <div>
          <h4 className="text-sm font-semibold tracking-widest text-st-text-muted uppercase mb-3">Core Proficiencies</h4>
          <div className="flex flex-wrap gap-2">
            {data.keyTopics?.map((topic, i) => (
              <span key={i} className="px-3 py-1 bg-st-accent/10 border border-st-accent/20 rounded-full text-xs font-medium text-st-accent">
                {topic}
              </span>
            ))}
          </div>
        </div>

        <div>
          <h4 className="text-sm font-semibold tracking-widest text-st-text-muted uppercase mb-3">Self-Examination</h4>
          <div className="space-y-4">
            {data.quiz?.map((q, i) => (
              <div key={q.id} className="bg-st-bg-card p-4 rounded-lg border border-st-border">
                <p className="font-medium text-sm text-st-text-primary mb-3">
                  <span className="text-st-accent mr-2">Q{i + 1}.</span> {q.question}
                </p>
                <div className="space-y-2 pl-6">
                  {q.options.map((opt: string, optIdx: number) => (
                    <label key={optIdx} className="flex items-center gap-3 text-sm text-st-text-secondary cursor-pointer hover:text-st-text-primary">
                      <input type="radio" name={q.id} className="accent-st-accent" />
                      {opt}
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
}
