"use client";

import React, { useState, useEffect } from "react";
import { BrainCircuit } from "lucide-react";

const thinkingMessages = [
  "AI is thinking...",
  "Generating response...",
  "Analyzing your question...",
  "Preparing answer...",
  "Searching knowledge base...",
  "Formulating insights...",
];

export function TypingIndicator({ message }: { message?: string }) {
  const [msgIndex, setMsgIndex] = useState(0);

  useEffect(() => {
    if (message) return;
    const interval = setInterval(() => {
      setMsgIndex(prev => (prev + 1) % thinkingMessages.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [message]);

  return (
    <div className="flex items-start gap-3 px-4 py-3" role="status" aria-label="AI is typing">
      <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-st-accent to-st-accent-hover flex items-center justify-center shrink-0 shadow-lg shadow-st-accent/20">
        <BrainCircuit className="w-4 h-4 text-white" />
      </div>
      <div className="flex-1 space-y-2">
        <div className="flex items-center gap-2">
          {[0, 1, 2].map(i => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-st-accent/60"
              style={{ animation: `bounce 1.4s ease-in-out ${i * 0.2}s infinite` }}
            />
          ))}
        </div>
        <p className="text-xs text-st-text-muted">
          {message || thinkingMessages[msgIndex]}
        </p>
      </div>
    </div>
  );
}

export function StreamingText({ text, onComplete }: { text: string; onComplete?: () => void }) {
  const [displayed, setDisplayed] = useState("");
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (idx < text.length) {
      const timer = setTimeout(() => {
        setDisplayed(prev => prev + text[idx]);
        setIdx(prev => prev + 1);
      }, 15 + Math.random() * 20);
      return () => clearTimeout(timer);
    } else {
      onComplete?.();
    }
  }, [idx, text, onComplete]);

  return <span>{displayed}<span className="animate-pulse">|</span></span>;
}

// keyframes injection
if (typeof document !== "undefined") {
  const style = document.createElement("style");
  style.textContent = `
    @keyframes bounce {
      0%, 80%, 100% { transform: scale(0.6); opacity: 0.4; }
      40% { transform: scale(1); opacity: 1; }
    }
  `;
  document.head.appendChild(style);
}
