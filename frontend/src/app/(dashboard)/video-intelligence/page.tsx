"use client";

import React, { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Video, Upload, Play, Clock, FileText, HelpCircle, Sparkles, BookOpen, Search, Link2 } from "lucide-react";

type VideoItem = { id: string; title: string; duration: string; source: "upload" | "youtube"; thumbnail: string; status: "analyzed" | "processing"; createdAt: string };

const mockVideos: VideoItem[] = [
  { id: "1", title: "MIT 6.824 Distributed Systems Lecture 6", duration: "1h 20m", source: "youtube", thumbnail: "", status: "analyzed", createdAt: "1 week ago" },
  { id: "2", title: "React Server Components Deep Dive", duration: "45m", source: "youtube", thumbnail: "", status: "analyzed", createdAt: "3 days ago" },
  { id: "3", title: "Docker Compose Masterclass", duration: "2h 10m", source: "upload", thumbnail: "", status: "processing", createdAt: "1 day ago" },
];

export default function VideoIntelligencePage() {
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(mockVideos[0]);
  const [activeTab, setActiveTab] = useState<"transcript" | "summary" | "notes" | "quiz">("summary");

  const tabs = [
    { key: "transcript", label: "Transcript", icon: FileText },
    { key: "summary", label: "Summary", icon: Sparkles },
    { key: "notes", label: "Notes", icon: BookOpen },
    { key: "quiz", label: "Quiz", icon: HelpCircle },
  ];

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex justify-between items-center">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-st-accent uppercase mb-1">Video Analysis</p>
          <h1 className="text-3xl font-bold text-st-text-primary">Video Intelligence</h1>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm"><Link2 className="w-4 h-4 mr-1" />YouTube URL</Button>
          <Button variant="primary" size="sm"><Upload className="w-4 h-4 mr-1" />Upload Video</Button>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden">
        {/* Video List */}
        <div className="col-span-3 flex flex-col gap-3 overflow-y-auto">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-st-text-muted" />
            <input type="text" placeholder="Search videos..."
              className="w-full pl-9 pr-4 py-2 bg-st-bg-elevated border border-st-border rounded-lg text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none focus:border-st-accent/50" />
          </div>
          {mockVideos.map(v => (
            <Card key={v.id} onClick={() => setSelectedVideo(v)}
              className={`p-4 cursor-pointer transition-all ${selectedVideo?.id === v.id ? "border-st-accent/50 bg-st-bg-elevated" : "hover:border-st-accent/20"}`}>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-st-bg-primary rounded-lg flex items-center justify-center shrink-0">
                  <Play className="w-5 h-5 text-purple-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-sm font-semibold text-st-text-primary truncate">{v.title}</h4>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-st-text-muted flex items-center gap-1"><Clock className="w-3 h-3" />{v.duration}</span>
                    <Badge variant={v.status === "analyzed" ? "success" : "warning"}>{v.status}</Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>

        {/* Main Content */}
        <div className="col-span-9 flex flex-col gap-4 overflow-y-auto">
          {selectedVideo ? (
            <>
              {/* Video Player Placeholder */}
              <Card className="aspect-video bg-st-bg-primary flex items-center justify-center relative overflow-hidden">
                <div className="text-center">
                  <div className="w-16 h-16 rounded-full bg-st-accent/20 flex items-center justify-center mx-auto mb-3 hover:bg-st-accent/30 cursor-pointer transition-colors">
                    <Play className="w-8 h-8 text-st-accent ml-1" />
                  </div>
                  <p className="text-sm text-st-text-secondary">{selectedVideo.title}</p>
                  <p className="text-xs text-st-text-muted">{selectedVideo.duration}</p>
                </div>
              </Card>

              {/* Analysis Tabs */}
              <div className="flex gap-1 bg-st-bg-elevated p-1 rounded-lg border border-st-border">
                {tabs.map(tab => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key as any)}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${activeTab === tab.key ? "bg-st-accent text-black" : "text-st-text-secondary hover:text-st-text-primary"}`}>
                    <tab.icon className="w-4 h-4" />{tab.label}
                  </button>
                ))}
              </div>

              <Card className="p-6 flex-1">
                {activeTab === "summary" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-st-text-primary">AI-Generated Summary</h3>
                    <p className="text-sm text-st-text-secondary leading-relaxed">This lecture covers the fundamentals of distributed consensus algorithms, particularly focusing on Raft. The key topics include leader election, log replication, and safety guarantees. The instructor emphasizes the practical implications of the FLP impossibility result and how modern systems work around it.</p>
                    <div className="space-y-2">
                      <h4 className="text-sm font-semibold text-st-text-primary">Key Timestamps</h4>
                      {[
                        { time: "0:00", topic: "Introduction to Consensus" },
                        { time: "12:30", topic: "Raft Leader Election" },
                        { time: "35:00", topic: "Log Replication" },
                        { time: "55:00", topic: "Safety Properties" },
                        { time: "1:05:00", topic: "Q&A Session" },
                      ].map((ts, i) => (
                        <div key={i} className="flex items-center gap-3 p-2 rounded hover:bg-st-bg-elevated cursor-pointer transition-colors">
                          <span className="text-xs font-mono text-st-accent w-16">{ts.time}</span>
                          <span className="text-sm text-st-text-primary">{ts.topic}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {activeTab === "transcript" && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-st-text-primary">Transcript</h3>
                    <p className="text-sm text-st-text-secondary leading-relaxed">Today we&apos;re going to talk about consensus algorithms. In particular, we&apos;re going to focus on the Raft consensus algorithm, which was designed to be easier to understand than Paxos...</p>
                  </div>
                )}
                {activeTab === "notes" && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-st-text-primary">Auto-Generated Notes</h3>
                    <ul className="space-y-2 text-sm text-st-text-secondary">
                      <li className="flex gap-2"><span className="text-st-accent">•</span>Raft divides consensus into three sub-problems: leader election, log replication, and safety</li>
                      <li className="flex gap-2"><span className="text-st-accent">•</span>Leader election uses randomized timeouts to prevent split votes</li>
                      <li className="flex gap-2"><span className="text-st-accent">•</span>Log entries are committed only when replicated on a majority of servers</li>
                    </ul>
                  </div>
                )}
                {activeTab === "quiz" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-st-text-primary">Practice Quiz</h3>
                    {["What are the three sub-problems that Raft divides consensus into?", "How does Raft prevent split votes during leader election?", "When is a log entry considered committed?"].map((q, i) => (
                      <Card key={i} className="p-4 hover:border-st-accent/30 cursor-pointer transition-all">
                        <div className="flex items-center gap-3">
                          <span className="text-st-accent font-mono text-sm font-bold">Q{i + 1}</span>
                          <p className="text-sm text-st-text-primary">{q}</p>
                        </div>
                      </Card>
                    ))}
                  </div>
                )}
              </Card>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center"><p className="text-st-text-muted">Select a video to analyze</p></div>
          )}
        </div>
      </div>
    </div>
  );
}
