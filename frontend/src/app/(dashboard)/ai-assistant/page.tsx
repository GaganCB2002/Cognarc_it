"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Bot, Send, Sparkles, Code, BookOpen, Target, MessageSquare, Plus, Search, Trash2 } from "lucide-react";

type Message = { role: "user" | "assistant"; content: string; timestamp: string };
type Chat = { id: string; title: string; messages: Message[]; createdAt: string };

const mockChats: Chat[] = [
  { id: "1", title: "Explain CAP Theorem", messages: [
    { role: "user", content: "Can you explain the CAP theorem in distributed systems?", timestamp: "2:30 PM" },
    { role: "assistant", content: "The CAP theorem states that a distributed data store can only provide two of the following three guarantees simultaneously:\n\n**Consistency (C):** Every read receives the most recent write or an error.\n\n**Availability (A):** Every request receives a non-error response, without guarantee it contains the most recent write.\n\n**Partition tolerance (P):** The system continues to operate despite network partitions.\n\nIn practice, since network partitions are inevitable in distributed systems, you must choose between CP (consistency + partition tolerance) and AP (availability + partition tolerance).\n\n**Examples:**\n- CP: MongoDB, HBase, Redis\n- AP: Cassandra, DynamoDB, CouchDB", timestamp: "2:30 PM" },
  ], createdAt: "Today" },
  { id: "2", title: "Debug React Hydration Error", messages: [
    { role: "user", content: "I'm getting a hydration mismatch error in Next.js", timestamp: "Yesterday" },
    { role: "assistant", content: "Hydration errors occur when the server-rendered HTML doesn't match what React expects on the client. Common causes include:\n\n1. Using `Date.now()` or `Math.random()` during render\n2. Browser-only APIs like `window` or `localStorage`\n3. Conditional rendering based on client state\n\nFix: Wrap client-only code in `useEffect` or use `suppressHydrationWarning`.", timestamp: "Yesterday" },
  ], createdAt: "Yesterday" },
  { id: "3", title: "Interview Prep: System Design", messages: [], createdAt: "3 days ago" },
];

const suggestions = [
  { icon: Code, text: "Explain a concept", desc: "Programming topics & theory" },
  { icon: BookOpen, text: "Summarize a document", desc: "PDFs, papers, or articles" },
  { icon: Target, text: "Interview prep", desc: "Practice technical questions" },
  { icon: Sparkles, text: "Generate code", desc: "Write & debug code snippets" },
];

export default function AIAssistantPage() {
  const [selectedChat, setSelectedChat] = useState<Chat>(mockChats[0]);
  const [inputValue, setInputValue] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const filteredChats = mockChats.filter(c => !searchQuery || c.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="h-full flex gap-6">
      {/* Chat History Sidebar */}
      <div className="w-72 shrink-0 flex flex-col gap-4">
        <Button variant="primary" className="w-full"><Plus className="w-4 h-4 mr-2" />New Chat</Button>
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-st-text-muted" />
          <input type="text" placeholder="Search chats..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-st-bg-elevated border border-st-border rounded-lg text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none focus:border-st-accent/50" />
        </div>
        <div className="flex-1 overflow-y-auto space-y-1">
          {filteredChats.map(chat => (
            <button key={chat.id} onClick={() => setSelectedChat(chat)}
              className={`w-full text-left p-3 rounded-lg transition-colors group flex items-center justify-between ${selectedChat.id === chat.id ? "bg-st-bg-elevated border border-st-accent/30" : "hover:bg-st-bg-elevated"}`}>
              <div className="min-w-0">
                <p className="text-sm font-medium text-st-text-primary truncate">{chat.title}</p>
                <p className="text-xs text-st-text-muted">{chat.createdAt}</p>
              </div>
              <Trash2 className="w-3 h-3 text-st-text-muted opacity-0 group-hover:opacity-100 shrink-0 hover:text-st-danger" />
            </button>
          ))}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {selectedChat.messages.length > 0 ? (
          <>
            <div className="flex-1 overflow-y-auto space-y-6 pb-6">
              {selectedChat.messages.map((msg, i) => (
                <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : ""}`}>
                  {msg.role === "assistant" && (
                    <div className="w-8 h-8 rounded-lg bg-st-accent/10 flex items-center justify-center shrink-0">
                      <Bot className="w-4 h-4 text-st-accent" />
                    </div>
                  )}
                  <div className={`max-w-2xl rounded-xl p-4 ${msg.role === "user" ? "bg-st-accent/10 border border-st-accent/20" : "bg-st-bg-elevated border border-st-border"}`}>
                    <p className="text-sm text-st-text-primary whitespace-pre-wrap leading-relaxed">{msg.content}</p>
                    <p className="text-[10px] text-st-text-muted mt-2">{msg.timestamp}</p>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-st-accent/10 flex items-center justify-center mx-auto mb-6">
                <Bot className="w-8 h-8 text-st-accent" />
              </div>
              <h2 className="text-2xl font-bold text-st-text-primary mb-2">AI Assistant</h2>
              <p className="text-sm text-st-text-secondary mb-8">Your personal AI tutor for learning, coding, and career guidance.</p>
              <div className="grid grid-cols-2 gap-3">
                {suggestions.map((s, i) => (
                  <Card key={i} className="p-4 cursor-pointer hover:border-st-accent/30 transition-all text-left">
                    <s.icon className="w-5 h-5 text-st-accent mb-2" />
                    <p className="text-sm font-medium text-st-text-primary">{s.text}</p>
                    <p className="text-xs text-st-text-muted">{s.desc}</p>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Input */}
        <div className="border-t border-st-border pt-4">
          <div className="flex gap-3 items-end">
            <div className="flex-1 bg-st-bg-elevated border border-st-border rounded-xl p-3 focus-within:border-st-accent/50 transition-colors">
              <textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)}
                placeholder="Ask anything about programming, concepts, or career guidance..."
                className="w-full bg-transparent text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none resize-none" rows={1} />
            </div>
            <Button variant="primary" size="md" className="shrink-0 h-12 w-12 p-0 rounded-xl">
              <Send className="w-5 h-5" />
            </Button>
          </div>
          <p className="text-[10px] text-st-text-muted mt-2 text-center">AI can make mistakes. Verify important information.</p>
        </div>
      </div>
    </div>
  );
}
