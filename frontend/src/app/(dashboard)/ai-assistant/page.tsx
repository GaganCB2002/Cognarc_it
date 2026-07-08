"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Button } from "@/components/ui/Button";
import { Bot, Send, Sparkles, Code, BookOpen, Target, Plus, Search, Trash2, Loader2 } from "lucide-react";
import api from "@/lib/api";

type Message = { role: "user" | "assistant"; content: string; id?: string };
type Conversation = { id: string; title: string; createdAt: string; updatedAt: string; _count: { messages: number } };

const suggestions = [
  { icon: Code, text: "Explain a concept", desc: "Programming topics & theory" },
  { icon: BookOpen, text: "Summarize a document", desc: "PDFs, papers, or articles" },
  { icon: Target, text: "Interview prep", desc: "Practice technical questions" },
  { icon: Sparkles, text: "Generate code", desc: "Write & debug code snippets" },
];

const projectSuggestions = [
  { icon: Bot, text: "How is auth handled?", desc: "JWT auth flow in the project" },
  { icon: Bot, text: "What API routes exist?", desc: "List all backend endpoints" },
  { icon: Bot, text: "Explain the database schema", desc: "All Prisma models" },
  { icon: Bot, text: "How does the captcha work?", desc: "Captcha system details" },
];

export default function AIAssistantPage() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // Load conversations on mount
  const loadConversations = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.get<Conversation[]>("/ai/conversations");
      setConversations(data);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Load messages when a conversation is selected
  const loadMessages = useCallback(async (convId: string) => {
    try {
      setLoading(true);
      const data = await api.get<{ id: string; messages: { id: string; role: string; content: string; createdAt: string }[] }>(`/ai/conversations/${convId}`);
      setMessages(data.messages.map(m => ({ role: m.role as "user" | "assistant", content: m.content, id: m.id })));
    } catch { setMessages([]); }
    finally { setLoading(false); }
  }, []);

  const selectConversation = (id: string) => {
    setSelectedId(id);
    loadMessages(id);
  };

  const handleNewChat = () => {
    setSelectedId(null);
    setMessages([]);
    setInputValue("");
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    try {
      await api.delete(`/ai/conversations/${id}`);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (selectedId === id) handleNewChat();
    } catch { /* ignore */ }
  };

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || sending) return;

    setInputValue("");
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);

    setSending(true);
    try {
      const res = await api.post<{ reply: string; conversationId: string; messageId: string }>("/ai/chat", {
        messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })),
        conversationId: selectedId || undefined,
      });

      setMessages(prev => [...prev, { role: "assistant", content: res.reply, id: res.messageId }]);
      if (!selectedId || selectedId !== res.conversationId) {
        setSelectedId(res.conversationId);
        loadConversations();
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: "assistant", content: `**Error:** ${err.message || "Failed to get response. Please try again."}` }]);
    }
    finally { setSending(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestion = (text: string) => {
    setInputValue(text);
    textareaRef.current?.focus();
  };

  const filteredConversations = conversations.filter(c => !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const formatDate = (d: string) => {
    const date = new Date(d);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 86400000) return "Today";
    if (diff < 172800000) return "Yesterday";
    return date.toLocaleDateString();
  };

  return (
    <div className="h-full flex gap-6">
      {/* Chat History Sidebar */}
      <div className="w-72 shrink-0 flex flex-col gap-4">
        <Button variant="primary" className="w-full" onClick={handleNewChat}>
          <Plus className="w-4 h-4 mr-2" />New Chat
        </Button>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-st-text-muted" />
          <input type="text" placeholder="Search chats..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-st-bg-elevated border border-st-border rounded-lg text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none focus:border-st-accent/50" />
        </div>
        <div className="flex-1 overflow-y-auto space-y-1">
          {loading && conversations.length === 0 ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-5 h-5 text-st-text-muted animate-spin" />
            </div>
          ) : filteredConversations.length === 0 ? (
            <p className="text-xs text-st-text-muted text-center py-4">No conversations yet</p>
          ) : filteredConversations.map(conv => (
            <button key={conv.id} onClick={() => selectConversation(conv.id)}
              className={`w-full text-left p-3 rounded-lg transition-colors group flex items-center justify-between ${selectedId === conv.id ? "bg-st-bg-elevated border border-st-accent/30" : "hover:bg-st-bg-elevated"}`}>
              <div className="min-w-0">
                <p className="text-sm font-medium text-st-text-primary truncate">{conv.title}</p>
                <p className="text-xs text-st-text-muted">{formatDate(conv.updatedAt)} &middot; {conv._count.messages} msgs</p>
              </div>
              <Trash2 onClick={(e) => handleDelete(e, conv.id)}
                className="w-3 h-3 text-st-text-muted opacity-0 group-hover:opacity-100 shrink-0 hover:text-st-danger cursor-pointer" />
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {loading && selectedId ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-6 h-6 text-st-accent animate-spin" />
          </div>
        ) : messages.length > 0 ? (
          <div className="flex-1 overflow-y-auto space-y-6 pb-6">
            {messages.map((msg, i) => (
              <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-st-accent/10 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-st-accent" />
                  </div>
                )}
                <div className={`max-w-2xl rounded-xl p-4 ${msg.role === "user" ? "bg-st-accent/10 border border-st-accent/20" : "bg-st-bg-elevated border border-st-border"}`}>
                  <div className="text-sm text-st-text-primary whitespace-pre-wrap leading-relaxed [&_strong]:text-st-accent [&_code]:bg-st-bg [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs">{msg.content}</div>
                </div>
              </div>
            ))}
            {sending && (
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-lg bg-st-accent/10 flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4 text-st-accent" />
                </div>
                <div className="max-w-2xl rounded-xl p-4 bg-st-bg-elevated border border-st-border">
                  <Loader2 className="w-4 h-4 text-st-accent animate-spin" />
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-xl">
              <div className="w-16 h-16 rounded-2xl bg-st-accent/10 flex items-center justify-center mx-auto mb-6">
                <Bot className="w-8 h-8 text-st-accent" />
              </div>
              <h2 className="text-2xl font-bold text-st-text-primary mb-2">StudyBot</h2>
              <p className="text-sm text-st-text-secondary mb-6">Project-aware AI assistant. Ask me anything about the codebase, architecture, or how things work.</p>
              <div className="grid grid-cols-2 gap-3 mb-6">
                {suggestions.map((s, i) => (
                  <button key={i} onClick={() => handleSuggestion(s.text)}
                    className="p-4 rounded-xl bg-st-bg-elevated border border-st-border hover:border-st-accent/30 transition-all text-left cursor-pointer">
                    <s.icon className="w-5 h-5 text-st-accent mb-2" />
                    <p className="text-sm font-medium text-st-text-primary">{s.text}</p>
                    <p className="text-xs text-st-text-muted">{s.desc}</p>
                  </button>
                ))}
              </div>
              <div className="border-t border-st-border pt-4">
                <p className="text-xs text-st-text-muted mb-3">Ask about this project:</p>
                <div className="flex flex-wrap gap-2 justify-center">
                  {projectSuggestions.map((s, i) => (
                    <button key={i} onClick={() => handleSuggestion(s.text)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-st-bg-elevated border border-st-border hover:border-st-accent/30 transition-all text-xs text-st-text-secondary cursor-pointer">
                      <s.icon className="w-3 h-3 text-st-accent" />
                      {s.text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-st-border pt-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 bg-st-bg-elevated border border-st-border rounded-xl p-3 focus-within:border-st-accent/50 transition-colors">
              <textarea ref={textareaRef} value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything about the project, coding concepts, or career guidance..."
                className="w-full bg-transparent text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none resize-none" rows={1} />
            </div>
            <Button variant="primary" size="md" className="shrink-0 h-12 w-12 p-0 rounded-xl" onClick={handleSend} disabled={sending || !inputValue.trim()}>
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
          <p className="text-[10px] text-st-text-muted mt-2 text-center">AI knows the full StudyTrack codebase. Answers are powered by Gemini.</p>
        </div>
      </div>
    </div>
  );
}
