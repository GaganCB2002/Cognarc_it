"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { DifficultyBadge } from "./DifficultyBadge";
import { cn } from "@/lib/utils";
import { Bookmark, ChevronDown, ChevronUp, Building2, BarChart3 } from "lucide-react";

interface Question {
  id: string;
  question: string;
  answer: string;
  explanation?: string;
  difficulty: string;
  tags: string[];
  company?: string;
  frequency?: number;
  category?: string;
  similar?: { question: string; difficulty: string }[];
}

interface QuestionCardProps {
  question: Question;
  onSave?: (id: string) => void;
  isSaved?: boolean;
  className?: string;
}

export function QuestionCard({ question, onSave, isSaved, className }: QuestionCardProps) {
  const [expanded, setExpanded] = useState(false);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("card-hover", className)}
    >
      <Card
        className={cn(
          "p-4 cursor-pointer transition-all duration-200",
          expanded ? "border-st-accent/20" : ""
        )}
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex justify-between items-start gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <DifficultyBadge level={question.difficulty} />
              {question.tags.slice(0, 3).map((tag) => (
                <Badge key={tag} variant="outline" className="text-[10px]">{tag}</Badge>
              ))}
            </div>
            <p className="text-sm font-medium text-st-text-primary leading-relaxed">{question.question}</p>
            <div className="flex items-center gap-3 mt-2 text-xs text-st-text-muted">
              {question.company && (
                <span className="flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  {question.company}
                </span>
              )}
              {question.frequency && (
                <span className="flex items-center gap-1">
                  <BarChart3 className="w-3 h-3" />
                  Asked {question.frequency}x
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            {onSave && (
              <button
                onClick={(e) => { e.stopPropagation(); onSave(question.id); }}
                className={cn("p-1.5 rounded-lg transition-colors", isSaved ? "text-st-accent" : "text-st-text-muted hover:text-st-accent")}
              >
                <Bookmark className="w-4 h-4" fill={isSaved ? "currentColor" : "none"} />
              </button>
            )}
            {expanded ? <ChevronUp className="w-4 h-4 text-st-text-muted" /> : <ChevronDown className="w-4 h-4 text-st-text-muted" />}
          </div>
        </div>

        <AnimatePresence>
          {expanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              <div className="border-t border-st-border mt-3 pt-3 space-y-3">
                <div>
                  <p className="text-xs font-semibold text-st-accent mb-1">Answer</p>
                  <p className="text-sm text-st-text-secondary leading-relaxed">{question.answer}</p>
                </div>
                {question.explanation && (
                  <div>
                    <p className="text-xs font-semibold text-st-accent mb-1">Explanation</p>
                    <p className="text-sm text-st-text-secondary leading-relaxed">{question.explanation}</p>
                  </div>
                )}
                {question.similar && question.similar.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-st-accent mb-2">Similar Questions</p>
                    <div className="space-y-2">
                      {question.similar.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-st-bg-elevated">
                          <span className="text-xs text-st-text-secondary">{s.question}</span>
                          <DifficultyBadge level={s.difficulty} className="text-[10px]" />
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </Card>
    </motion.div>
  );
}
