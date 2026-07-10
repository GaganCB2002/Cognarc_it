"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Bot, Send, Loader2, X, MessageCircle, Code, BookOpen, Target, Sparkles } from "lucide-react";
import api from "@/lib/api";

type Message = {
  role: "user" | "assistant";
  content: string;
  id?: string;
};

const quickQuestions = [
  { icon: Code, text: "How is auth handled?" },
  { icon: BookOpen, text: "What API routes exist?" },
  { icon: Target, text: "Explain the DB schema" },
  { icon: Sparkles, text: "How does Gemini work?" },
];

export function ChatBotWidget() {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const handler = () => setOpen((v) => !v);
    window.addEventListener("opencode-chatbot-toggle", handler);
    return () => window.removeEventListener("opencode-chatbot-toggle", handler);
  }, []);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    if (open) {
      setTimeout(() => inputRef.current?.focus(), 300);
    }
  }, [open]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;

    setInput("");
    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setSending(true);

    try {
      const res = await api.post<{ reply: string; conversationId: string }>("/ai/query-project", {
        question: text,
        conversationId: conversationId || undefined,
      });

      setConversationId(res.conversationId);
      setMessages((prev) => [...prev, { role: "assistant", content: res.reply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: `**Error:** ${err.message || "Failed to get response."}` },
      ]);
    } finally {
      setSending(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickQuestion = (q: string) => {
    setInput(q);
    inputRef.current?.focus();
  };

  const handleReset = () => {
    setMessages([]);
    setConversationId(null);
    setInput("");
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-12 h-12 rounded-full bg-gradient-to-br from-st-accent to-st-accent-hover shadow-lg shadow-st-accent/25 flex items-center justify-center transition-all duration-200 hover:scale-105 hover:shadow-st-accent/35 group"
        title="Ask about the project"
      >
        <MessageCircle className="w-5 h-5 text-black" />
        <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-st-danger rounded-full text-[8px] font-bold text-white flex items-center justify-center shadow-sm">
          AI
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[400px] h-[540px] flex flex-col bg-gradient-to-b from-st-bg-card to-st-bg-primary border border-st-border/80 rounded-2xl shadow-2xl shadow-black/40 overflow-hidden animate-scale-in">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-st-accent/[0.06] border-b border-st-border/60">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-st-accent/20 to-st-accent/10 flex items-center justify-center">
            <Bot className="w-4 h-4 text-st-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-st-text-primary">StudyBot</p>
            <p className="text-[10px] text-st-text-muted">Project-aware AI assistant</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button onClick={handleReset} className="p-1.5 rounded-lg hover:bg-st-bg-elevated/80 transition-colors" title="New conversation">
              <Sparkles className="w-3.5 h-3.5 text-st-text-muted hover:text-st-accent transition-colors" />
            </button>
          )}
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-st-bg-elevated/80 transition-colors">
            <X className="w-3.5 h-3.5 text-st-text-muted hover:text-st-text-primary transition-colors" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-thin">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-st-accent/[0.08] flex items-center justify-center mb-4">
              <Bot className="w-6 h-6 text-st-accent" />
            </div>
            <h3 className="text-base font-semibold text-st-text-primary mb-1">Project-Aware AI</h3>
            <p className="text-xs text-st-text-secondary leading-relaxed mb-5 max-w-xs">
              I have indexed all source files. Ask me anything about the codebase.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickQuestion(q.text)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-st-bg-elevated/50 border border-st-border/60 hover:border-st-accent/20 hover:bg-st-accent/[0.03] transition-all text-left text-xs text-st-text-muted hover:text-st-text-secondary cursor-pointer"
                >
                  <q.icon className="w-3 h-3 text-st-accent shrink-0" />
                  <span className="line-clamp-1">{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-st-accent/[0.08] flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-st-accent" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 text-sm leading-relaxed ${
                    msg.role === "user"
                      ? "bg-st-accent/10 border border-st-accent/15 text-st-text-primary"
                      : "bg-st-bg-elevated/70 border border-st-border/50 text-st-text-secondary"
                  }`}
                >
                  <div className="text-xs [&_strong]:text-st-accent [&_code]:bg-st-bg [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[10px] [&_code]:font-mono whitespace-pre-wrap">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-2.5">
                <div className="w-7 h-7 rounded-lg bg-st-accent/[0.08] flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-st-accent" />
                </div>
                <div className="rounded-xl px-3.5 py-2.5 bg-st-bg-elevated/70 border border-st-border/50">
                  <Loader2 className="w-3.5 h-3.5 text-st-accent animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-st-border/60 p-3 bg-st-bg-card/50">
        <div className="flex gap-2 items-end">
          <div className="flex-1 bg-st-bg-elevated/60 border border-st-border/70 rounded-xl px-3 py-2 focus-within:border-st-accent/30 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the project..."
              className="w-full bg-transparent text-xs text-st-text-primary placeholder:text-st-text-muted/50 focus:outline-none resize-none leading-relaxed"
              rows={1}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="h-9 w-9 rounded-xl bg-gradient-to-br from-st-accent to-st-accent-hover flex items-center justify-center shrink-0 hover:shadow-lg hover:shadow-st-accent/20 transition-all disabled:opacity-40 disabled:hover:shadow-none"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 text-black animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-black" />
            )}
          </button>
        </div>
        <p className="text-[8px] text-st-text-muted/60 mt-1.5 text-center tracking-wide">
          Answers use actual source code for accuracy
        </p>
      </div>
    </div>
  );
}
