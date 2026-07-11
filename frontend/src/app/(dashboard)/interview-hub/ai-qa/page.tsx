"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { TopicChip } from "@/components/interview-hub/TopicChip";
import { CardSkeleton } from "@/components/interview-hub/LoadingSkeleton";
import api from "@/lib/api";
import {
  Bot, Send, Sparkles, MessageSquare, Copy, RotateCcw, Trash2, Loader2, Check, ChevronDown, History,
} from "lucide-react";

interface QAAnswer {
  answer: string;
  explanation: string;
  realWorldExamples: string;
  bestPractices: string;
  commonMistakes: string;
  interviewTips: string;
  followUpQuestions: string[];
  relatedConcepts: string[];
  difficulty: string;
  estimatedFrequency: string;
}

interface AskResponse {
  result: QAAnswer;
  conversationId: string;
}

interface Conversation {
  id: string;
  title: string;
  type: string;
  createdAt: string;
  updatedAt: string;
}

interface ConversationDetail {
  id: string;
  title: string;
  messages: { role: "user" | "assistant"; content: string }[];
}

type Message = { role: "user" | "assistant"; content: string; id?: string; result?: QAAnswer };

const topics = ["Java", "Python", "React", "MERN", "Spring Boot", "SQL", "MongoDB", "Data Structures", "Algorithms", "Machine Learning", "AI", "Cloud", "DevOps", "Networking", "OS", "System Design", "HTML", "CSS", "JavaScript", "Node.js", "Django", "C++", "C#", "Kubernetes", "Docker", "AWS", "Azure", "Git", "GitHub", "Linux"];

const suggestionPrompts: Record<string, string[]> = {
  React: ["Explain React Virtual DOM", "What are React Hooks?", "How does useState work?", "Explain useReducer vs useState", "What is React Fiber?"],
  Java: ["What is JVM architecture?", "Explain multithreading in Java", "What are Java streams?", "How does garbage collection work?", "Explain OOP concepts"],
  Python: ["What are Python decorators?", "Explain list comprehension", "What is GIL in Python?", "How does async/await work?", "Explain generators"],
  SQL: ["Explain JOIN types", "What is normalization?", "How to optimize a slow query?", "What are indexes?", "Explain ACID properties"],
  default: ["Explain a concept", "How does this work?", "Give me an example", "What are best practices?"],
};

export default function AIQAPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [selectedTopic, setSelectedTopic] = useState("");
  const [sending, setSending] = useState(false);
  const [showTopicDropdown, setShowTopicDropdown] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowTopicDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const fetchConversations = async () => {
    setLoadingConversations(true);
    try {
      const data = await api.get<Conversation[]>("/interview/conversations?type=qa");
      setConversations(data);
    } catch {
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => { fetchConversations(); }, []);

  const loadConversation = async (id: string) => {
    try {
      const data = await api.get<ConversationDetail>(`/interview/conversations/${id}`);
      setConversationId(data.id);
      setMessages(data.messages);
      setShowHistory(false);
    } catch {
      // ignore
    }
  };

  const deleteConversation = async (id: string) => {
    try {
      await api.delete(`/interview/conversations/${id}`);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (conversationId === id) {
        setConversationId(null);
        setMessages([]);
      }
    } catch {
      // ignore
    }
  };

  const handleSend = async () => {
    const text = inputValue.trim();
    if (!text || sending) return;

    setInputValue("");
    const userMsg: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);

    setSending(true);
    try {
      const history = messages.map(m => ({ role: m.role, content: m.content }));
      const res = await api.post<AskResponse>("/interview/ask", {
        question: text,
        conversationId: conversationId || undefined,
        history,
      });
      const assistantMsg: Message = {
        role: "assistant",
        content: res.result.answer,
        id: res.conversationId,
        result: res.result,
      };
      setMessages(prev => [...prev, assistantMsg]);
      setConversationId(res.conversationId);
      fetchConversations();
    } catch (err: unknown) {
      setMessages(prev => [...prev, { role: "assistant", content: `**Error:** ${err instanceof Error ? err.message : "Failed to get response. Please try again."}` }]);
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

  const handleCopy = async (content: string, id: string) => {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    } catch { /* ignore */ }
  };

  const handleRegenerate = async () => {
    if (messages.length < 2) return;
    const lastUserMsg = [...messages].reverse().find(m => m.role === "user");
    if (!lastUserMsg) return;
    setMessages(prev => prev.slice(0, -1));
    setInputValue(lastUserMsg.content);
  };

  const handleClear = () => {
    setMessages([]);
    setInputValue("");
    setConversationId(null);
  };

  const handleTopicSelect = (topic: string) => {
    setSelectedTopic(topic);
    setShowTopicDropdown(false);
  };

  const handleSuggestion = (text: string) => {
    setInputValue(text);
    textareaRef.current?.focus();
  };

  const prompts = selectedTopic ? suggestionPrompts[selectedTopic] || suggestionPrompts.default : suggestionPrompts.default;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-4">
        <div>
          <h1 className="text-xl font-bold text-st-text-primary tracking-tight">AI Question & Answer</h1>
          <p className="text-sm text-st-text-secondary">Ask interview questions and get detailed answers</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setShowHistory(!showHistory); if (!showHistory) fetchConversations(); }}
            className="flex items-center gap-2 px-3 py-2 rounded-lg bg-st-bg-elevated border border-st-border text-sm text-st-text-primary hover:border-st-accent/30 transition-all"
          >
            <History className="w-4 h-4 text-st-accent" />
            History
          </button>
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setShowTopicDropdown(!showTopicDropdown)}
              className="flex items-center gap-2 px-3 py-2 rounded-lg bg-st-bg-elevated border border-st-border text-sm text-st-text-primary hover:border-st-accent/30 transition-all"
            >
              <Sparkles className="w-4 h-4 text-st-accent" />
              {selectedTopic || "Select Topic"}
              <ChevronDown className="w-3 h-3 text-st-text-muted" />
            </button>
            <AnimatePresence>
              {showTopicDropdown && (
                <motion.div
                  initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }}
                  className="absolute right-0 top-full mt-1 w-56 max-h-72 overflow-y-auto bg-st-bg-elevated border border-st-border rounded-xl shadow-xl z-50 p-1"
                >
                  <button onClick={() => handleTopicSelect("")} className="w-full text-left px-3 py-2 text-sm text-st-text-secondary hover:bg-st-bg-card rounded-lg">All Topics</button>
                  <div className="border-t border-st-border my-1" />
                  {topics.map((topic) => (
                    <button
                      key={topic}
                      onClick={() => handleTopicSelect(topic)}
                      className={`w-full text-left px-3 py-2 text-sm rounded-lg transition-colors ${selectedTopic === topic ? "bg-st-accent/10 text-st-accent" : "text-st-text-secondary hover:bg-st-bg-card"}`}
                    >
                      {topic}
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          {messages.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClear}>
              <Trash2 className="w-4 h-4 mr-1" /> Clear
            </Button>
          )}
        </div>
      </motion.div>

      {/* Topic Chips */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2 mb-4">
        {topics.slice(0, 12).map((topic) => (
          <TopicChip key={topic} label={topic} selected={selectedTopic === topic} onClick={() => handleTopicSelect(topic)} />
        ))}
        {topics.length > 12 && (
          <TopicChip label={`+${topics.length - 12} more`} onClick={() => setShowTopicDropdown(true)} />
        )}
      </motion.div>

      {/* History Panel */}
      <AnimatePresence>
        {showHistory && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="bg-st-bg-elevated border border-st-border rounded-xl p-4 space-y-2 max-h-60 overflow-y-auto">
              <h3 className="text-sm font-semibold text-st-text-primary mb-2">Conversation History</h3>
              {loadingConversations ? (
                <div className="space-y-2">{[1,2,3].map(i => <CardSkeleton key={i} />)}</div>
              ) : conversations.length === 0 ? (
                <p className="text-xs text-st-text-muted">No conversations yet</p>
              ) : (
                conversations.map((conv) => (
                  <div key={conv.id} className="flex items-center justify-between p-2 rounded-lg bg-st-bg-card hover:bg-st-bg-elevated transition-colors">
                    <button
                      onClick={() => loadConversation(conv.id)}
                      className="flex-1 text-left min-w-0"
                    >
                      <p className="text-sm text-st-text-primary truncate">{conv.title || "Untitled"}</p>
                      <p className="text-xs text-st-text-muted">{conv.createdAt}</p>
                    </button>
                    <button
                      onClick={() => deleteConversation(conv.id)}
                      className="p-1.5 rounded-lg text-st-text-muted hover:text-st-danger hover:bg-st-danger-bg transition-all shrink-0 ml-2"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-h-0">
        {messages.length > 0 ? (
          <div className="flex-1 overflow-y-auto space-y-4 pb-4">
            {messages.map((msg, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-8 h-8 rounded-lg bg-st-accent/10 flex items-center justify-center shrink-0 mt-1">
                    <Bot className="w-4 h-4 text-st-accent" />
                  </div>
                )}
                <div className={`max-w-2xl rounded-xl p-4 relative group ${msg.role === "user" ? "bg-st-accent/10 border border-st-accent/20" : "bg-st-bg-elevated border border-st-border"}`}>
                  <div className="text-sm text-st-text-primary whitespace-pre-wrap leading-relaxed [&_strong]:text-st-accent [&_code]:bg-st-bg [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs">
                    {msg.content}
                  </div>
                  {msg.role === "assistant" && msg.result && (
                    <div className="mt-3 pt-3 border-t border-st-border/50 space-y-3">
                      {msg.result.explanation && (
                        <div>
                          <p className="text-xs font-semibold text-st-accent mb-1">Explanation</p>
                          <p className="text-sm text-st-text-secondary">{msg.result.explanation}</p>
                        </div>
                      )}
                      {msg.result.realWorldExamples && (
                        <div>
                          <p className="text-xs font-semibold text-st-accent mb-1">Real World Examples</p>
                          <p className="text-sm text-st-text-secondary">{msg.result.realWorldExamples}</p>
                        </div>
                      )}
                      {msg.result.bestPractices && (
                        <div>
                          <p className="text-xs font-semibold text-st-accent mb-1">Best Practices</p>
                          <p className="text-sm text-st-text-secondary">{msg.result.bestPractices}</p>
                        </div>
                      )}
                      {msg.result.commonMistakes && (
                        <div>
                          <p className="text-xs font-semibold text-st-accent mb-1">Common Mistakes</p>
                          <p className="text-sm text-st-text-secondary">{msg.result.commonMistakes}</p>
                        </div>
                      )}
                      {msg.result.interviewTips && (
                        <div>
                          <p className="text-xs font-semibold text-st-accent mb-1">Interview Tips</p>
                          <p className="text-sm text-st-text-secondary">{msg.result.interviewTips}</p>
                        </div>
                      )}
                      {msg.result.followUpQuestions && msg.result.followUpQuestions.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-st-accent mb-1">Follow-up Questions</p>
                          <div className="space-y-1">
                            {msg.result.followUpQuestions.map((q, idx) => (
                              <p key={idx} className="text-sm text-st-text-secondary">&bull; {q}</p>
                            ))}
                          </div>
                        </div>
                      )}
                      {msg.result.relatedConcepts && msg.result.relatedConcepts.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {msg.result.relatedConcepts.map((concept, idx) => (
                            <Badge key={idx} variant="outline" className="text-[10px]">{concept}</Badge>
                          ))}
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-[10px] text-st-text-muted">
                        {msg.result.difficulty && <span>Difficulty: {msg.result.difficulty}</span>}
                        {msg.result.estimatedFrequency && <span>&middot; Asked: {msg.result.estimatedFrequency}</span>}
                      </div>
                    </div>
                  )}
                  {msg.role === "assistant" && (
                    <div className="flex items-center gap-1 mt-2 pt-2 border-t border-st-border/50 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleCopy(msg.content, msg.id || String(i))}
                        className="flex items-center gap-1 px-2 py-1 rounded text-xs text-st-text-muted hover:text-st-accent hover:bg-st-bg-card transition-colors"
                      >
                        {copiedId === (msg.id || String(i)) ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                        {copiedId === (msg.id || String(i)) ? "Copied" : "Copy"}
                      </button>
                      {i === messages.length - 1 && (
                        <button
                          onClick={handleRegenerate}
                          className="flex items-center gap-1 px-2 py-1 rounded text-xs text-st-text-muted hover:text-st-accent hover:bg-st-bg-card transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" /> Regenerate
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </motion.div>
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
                <MessageSquare className="w-8 h-8 text-st-accent" />
              </div>
              <h2 className="text-2xl font-bold text-st-text-primary mb-2">Interview Q&A</h2>
              <p className="text-sm text-st-text-secondary mb-6">Select a topic and ask interview questions. Get expert-level answers with explanations.</p>
              {selectedTopic && (
                <div className="mb-4">
                  <Badge variant="default" className="mb-3">
                    <Sparkles className="w-3 h-3 mr-1" />
                    Suggested questions for {selectedTopic}
                  </Badge>
                  <div className="flex flex-wrap gap-2 justify-center">
                    {prompts.map((prompt, i) => (
                      <button
                        key={i}
                        onClick={() => handleSuggestion(prompt)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-st-bg-elevated border border-st-border hover:border-st-accent/30 transition-all text-xs text-st-text-secondary cursor-pointer"
                      >
                        <Sparkles className="w-3 h-3 text-st-accent" />
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {!selectedTopic && (
                <p className="text-xs text-st-text-muted">Select a topic above or type any interview question below</p>
              )}
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-st-border pt-4 mt-auto">
          <div className="flex gap-3 items-end">
            <div className="flex-1 bg-st-bg-elevated border border-st-border rounded-xl p-3 focus-within:border-st-accent/50 transition-colors">
              <textarea
                ref={textareaRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask an interview question..."
                className="w-full bg-transparent text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none resize-none"
                rows={1}
              />
            </div>
            <Button variant="primary" size="md" className="shrink-0 h-12 w-12 p-0 rounded-xl" onClick={handleSend} disabled={sending || !inputValue.trim()}>
              {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
