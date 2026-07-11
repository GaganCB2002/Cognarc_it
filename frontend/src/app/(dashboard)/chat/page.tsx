"use client";

import React, { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Send, Terminal, Bot, User } from "lucide-react";
import api from "@/lib/api";

type Message = {
  role: "user" | "tutor";
  content: string;
};

export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([
    { role: "tutor", content: "System ready. I am your elite Technical Mentor. What concept shall we master today?" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const endOfMessagesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endOfMessagesRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const response = await api.post<{ reply: string }>("/ai/chat", {
        messages: [...messages, userMessage],
      });
      setMessages((prev) => [...prev, { role: "tutor", content: response.reply }]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [...prev, { role: "tutor", content: "[SYSTEM ERROR]: Unable to reach AI core." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col max-w-5xl mx-auto pb-6">
      <h2 className="text-sm font-semibold tracking-widest text-st-text-muted uppercase mb-4 flex items-center gap-2">
        <Terminal className="w-4 h-4" /> AI Mentor Console
      </h2>
      
      <Card className="flex-1 flex flex-col bg-st-bg-elevated border-st-border overflow-hidden">
        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "tutor" && (
                <div className="w-8 h-8 rounded bg-st-accent/10 border border-st-accent/30 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-st-accent" />
                </div>
              )}
              
              <div className={`max-w-[80%] rounded-lg p-4 ${
                msg.role === "user" 
                  ? "bg-st-bg-card border border-st-border text-st-text-primary" 
                  : "bg-transparent text-st-text-primary"
              }`}>
                {msg.role === "tutor" && <p className="text-[10px] font-bold text-st-accent uppercase tracking-widest mb-2">Mentor</p>}
                
                {/* Extremely basic markdown rendering for code blocks just for the scaffold */}
                <div className="text-sm leading-relaxed whitespace-pre-wrap font-sans">
                  {msg.content.split('```').map((part, i) => {
                    if (i % 2 === 1) {
                      const codeLines = part.split('\n');
                      const lang = codeLines[0];
                      const code = codeLines.slice(1).join('\n');
                      return (
                        <div key={i} className="my-3 rounded-md overflow-hidden border border-st-border bg-[#050505]">
                          <div className="px-3 py-1 bg-[#111] text-[10px] text-st-text-muted font-mono uppercase border-b border-st-border">
                            {lang || 'code'}
                          </div>
                          <pre className="p-4 overflow-x-auto text-xs text-[#E5E5E5] font-mono">
                            <code>{code}</code>
                          </pre>
                        </div>
                      );
                    }
                    return <span key={i}>{part}</span>;
                  })}
                </div>
              </div>

              {msg.role === "user" && (
                <div className="w-8 h-8 rounded bg-st-bg-secondary border border-st-border flex items-center justify-center shrink-0">
                  <User className="w-4 h-4 text-st-text-muted" />
                </div>
              )}
            </div>
          ))}
          {loading && (
            <div className="flex gap-4 justify-start">
              <div className="w-8 h-8 rounded bg-st-accent/10 border border-st-accent/30 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 text-st-accent" />
              </div>
              <div className="flex items-center text-sm text-st-text-muted">
                <span className="animate-pulse">Processing context...</span>
              </div>
            </div>
          )}
          <div ref={endOfMessagesRef} />
        </div>

        {/* Input Area */}
        <div className="p-4 border-t border-st-border bg-st-bg-card">
          <form onSubmit={handleSend} className="relative flex items-center">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about architecture, code, or your current curriculum..."
              className="w-full bg-st-bg-secondary border border-st-border rounded-lg pl-4 pr-12 py-3 text-sm text-st-text-primary focus:outline-none focus:border-st-accent transition-colors placeholder:text-st-text-muted"
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="absolute right-2 p-2 rounded-md text-st-accent hover:bg-st-accent/10 disabled:opacity-50 transition-colors"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
          <div className="mt-2 text-center">
            <p className="text-[10px] text-st-text-muted tracking-widest uppercase">
              Data is processed locally or via secure API.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
