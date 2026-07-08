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

  // Listen for external toggle events (from dashboard button)
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
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-st-accent hover:bg-st-accent/90 shadow-lg shadow-st-accent/20 flex items-center justify-center transition-all hover:scale-105 group"
        title="Ask about the project"
      >
        <MessageCircle className="w-6 h-6 text-white" />
        <span className="absolute -top-1 -right-1 w-4 h-4 bg-st-danger rounded-full text-[9px] font-bold text-white flex items-center justify-center animate-pulse">
          AI
        </span>
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[420px] h-[560px] flex flex-col bg-st-bg-primary border border-st-border rounded-2xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-5">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-st-accent/10 border-b border-st-border">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-st-accent/20 flex items-center justify-center">
            <Bot className="w-4 h-4 text-st-accent" />
          </div>
          <div>
            <p className="text-sm font-semibold text-st-text-primary">StudyBot</p>
            <p className="text-[10px] text-st-text-muted">Ask about the project codebase</p>
          </div>
        </div>
        <div className="flex items-center gap-1">
          {messages.length > 0 && (
            <button onClick={handleReset} className="p-1.5 rounded-lg hover:bg-st-bg-elevated transition-colors" title="New conversation">
              <Sparkles className="w-4 h-4 text-st-text-muted" />
            </button>
          )}
          <button onClick={() => setOpen(false)} className="p-1.5 rounded-lg hover:bg-st-bg-elevated transition-colors">
            <X className="w-4 h-4 text-st-text-muted" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-4">
            <div className="w-12 h-12 rounded-2xl bg-st-accent/10 flex items-center justify-center mb-4">
              <Bot className="w-6 h-6 text-st-accent" />
            </div>
            <h3 className="text-base font-bold text-st-text-primary mb-1">Project-Aware AI</h3>
            <p className="text-xs text-st-text-secondary mb-4">
              I have indexed all {">"}100 source files. Ask me anything about the codebase.
            </p>
            <div className="grid grid-cols-2 gap-2 w-full">
              {quickQuestions.map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleQuickQuestion(q.text)}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-st-bg-elevated border border-st-border hover:border-st-accent/30 transition-all text-left text-xs text-st-text-secondary cursor-pointer"
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
              <div key={i} className={`flex gap-2 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-st-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                    <Bot className="w-3.5 h-3.5 text-st-accent" />
                  </div>
                )}
                <div
                  className={`max-w-[85%] rounded-xl px-3.5 py-2.5 ${
                    msg.role === "user"
                      ? "bg-st-accent/10 border border-st-accent/20"
                      : "bg-st-bg-elevated border border-st-border"
                  }`}
                >
                  <div className="text-xs text-st-text-primary whitespace-pre-wrap leading-relaxed [&_strong]:text-st-accent [&_code]:bg-st-bg [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-[10px]">
                    {msg.content}
                  </div>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-2">
                <div className="w-7 h-7 rounded-lg bg-st-accent/10 flex items-center justify-center">
                  <Bot className="w-3.5 h-3.5 text-st-accent" />
                </div>
                <div className="rounded-xl px-3.5 py-2.5 bg-st-bg-elevated border border-st-border">
                  <Loader2 className="w-3.5 h-3.5 text-st-accent animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input */}
      <div className="border-t border-st-border p-3">
        <div className="flex gap-2 items-end">
          <div className="flex-1 bg-st-bg-elevated border border-st-border rounded-xl px-3 py-2 focus-within:border-st-accent/50 transition-colors">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about the project..."
              className="w-full bg-transparent text-xs text-st-text-primary placeholder:text-st-text-muted focus:outline-none resize-none"
              rows={1}
            />
          </div>
          <button
            onClick={handleSend}
            disabled={sending || !input.trim()}
            className="h-9 w-9 rounded-xl bg-st-accent flex items-center justify-center shrink-0 hover:bg-st-accent/90 transition-colors disabled:opacity-40"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 text-white animate-spin" />
            ) : (
              <Send className="w-4 h-4 text-white" />
            )}
          </button>
        </div>
        <p className="text-[9px] text-st-text-muted mt-1.5 text-center">
          Answers use actual source code for accuracy
        </p>
      </div>
    </div>
  );
}
