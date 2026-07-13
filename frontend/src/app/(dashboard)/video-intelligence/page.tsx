"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import api from "@/lib/api";
import { VideoViewer } from "@/components/dashboard/VideoViewer";
import { ConfirmDialog } from "@/components/crud/ConfirmDialog";
import Image from "next/image";
import {
  Video, Upload, Play, HelpCircle, Sparkles,
  BookOpen, Search, Link2, Loader2, AlertCircle, RefreshCw,
  Trash2, ExternalLink, X, Plus
} from "lucide-react";

type VideoItem = {
  id: string;
  name: string;
  title: string;
  mimeType: string;
  size: number;
  type: string;
  status: string;
  publicUrl: string | null;
  isFavorite: boolean;
  resourceId: string | null;
  uploadedAt: string;
  source: "upload" | "youtube" | "link";
  thumbnail?: string;
  duration?: string;
};

function formatSize(bytes: number): string {
  if (bytes === 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), 3);
  return `${(bytes / Math.pow(1024, i)).toFixed(i > 0 ? 1 : 0)} ${units[i]}`;
}

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return date.toLocaleDateString();
}

function isYouTubeUrl(url: string): { isYt: boolean; videoId?: string } {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/embed\/([a-zA-Z0-9_-]{11})/,
    /youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return { isYt: true, videoId: m[1] };
  }
  return { isYt: false };
}

type RawVideoUpload = {
  id: string;
  name?: string;
  originalName?: string;
  title?: string;
  mimeType?: string;
  size?: number;
  type?: string;
  status?: string;
  isFavorite?: boolean;
  resourceId?: string | null;
  uploadedAt?: string;
  createdAt?: string;
};

type RawVideoResource = {
  id: string;
  title?: string;
  url?: string;
  mimeType?: string;
  size?: number;
  type?: string;
  isFavorite?: boolean;
  isUpload?: boolean;
  createdAt?: string;
};

export default function VideoIntelligencePage() {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlError, setUrlError] = useState<string | null>(null);
  const [addingUrl, setAddingUrl] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState<VideoItem | null>(null);
  const [activeTab, setActiveTab] = useState<"summary" | "notes" | "quiz">("summary");
  const [videoViewer, setVideoViewer] = useState<{ src: string; filename: string; mimeType: string } | null>(null);

  const BASE = process.env.NEXT_PUBLIC_API_URL || "https://cognarc-it-1.onrender.com/api";

  const fetchVideos = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [uploaded, resources] = await Promise.all([
        api.get<RawVideoUpload[]>("/upload/my-files").catch(() => [] as RawVideoUpload[]),
        api.get<RawVideoResource[]>("/resources").catch(() => [] as RawVideoResource[]),
      ]);

      const uploadedVids: VideoItem[] = (uploaded || [])
        .filter((f: RawVideoUpload) => f.mimeType?.startsWith("video/") || f.type === "VIDEO")
        .map((f: RawVideoUpload) => ({
          id: f.id,
          name: f.name || f.originalName || "",
          title: f.title || f.originalName || "Untitled",
          mimeType: f.mimeType || "",
          size: f.size || 0,
          type: "VIDEO",
          status: f.status || "READY",
          publicUrl: null,
          isFavorite: f.isFavorite || false,
          resourceId: f.resourceId ?? null,
          source: "upload" as const,
          uploadedAt: f.uploadedAt || f.createdAt || new Date().toISOString(),
        }));

      const linkVids: VideoItem[] = (resources || [])
        .filter((r: RawVideoResource) => r.type === "VIDEO" && !r.isUpload)
        .map((r: RawVideoResource) => {
          const yt = r.url ? isYouTubeUrl(r.url) : { isYt: false };
          return {
            id: r.id,
            name: r.title || r.url || "",
            title: r.title || r.url || "Untitled",
            mimeType: "",
            size: 0,
            type: "VIDEO",
            status: "READY",
            publicUrl: r.url || null,
            isFavorite: r.isFavorite || false,
            resourceId: r.id,
            source: yt.isYt ? ("youtube" as const) : ("link" as const),
            thumbnail: yt.isYt && yt.videoId ? `https://img.youtube.com/vi/${yt.videoId}/mqdefault.jpg` : undefined,
            uploadedAt: r.createdAt || new Date().toISOString(),
          };
        });

      const all = [...uploadedVids, ...linkVids];
      setVideos(all);
      if (all.length > 0 && !selectedVideo) setSelectedVideo(all[0]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load videos");
    } finally {
      setLoading(false);
    }
  }, [selectedVideo]);

  useEffect(() => { fetchVideos(); }, [fetchVideos]);

  const handleAddUrl = async () => {
    setUrlError(null);
    const trimmed = urlInput.trim();
    if (!trimmed) { setUrlError("Please enter a URL"); return; }
    try {
      new URL(trimmed);
    } catch {
      setUrlError("Please enter a valid URL");
      return;
    }
    setAddingUrl(true);
    try {
      await api.post("/resources", {
        title: trimmed,
        type: "VIDEO",
        url: trimmed,
      });
      setShowUrlModal(false);
      setUrlInput("");
      await fetchVideos();
    } catch (err: unknown) {
      setUrlError(err instanceof Error ? err.message : "Failed to add");
    } finally {
      setAddingUrl(false);
    }
  };

  const handleDelete = async (item: VideoItem, e: React.MouseEvent) => {
    e.stopPropagation();
    setConfirmDelete(item);
  };

  const confirmDeleteVideo = async () => {
    const item = confirmDelete;
    if (!item) return;
    setConfirmDelete(null);
    try {
      if (item.resourceId) {
        await api.delete(`/resources/${item.resourceId}`);
      } else {
        await api.delete(`/upload/${item.id}`);
      }
      setVideos((prev) => {
        const filtered = prev.filter((v) => v.id !== item.id);
        if (selectedVideo?.id === item.id) {
          setSelectedVideo(filtered[0] || null);
        }
        return filtered;
      });
    } catch { /* ignore */ }
  };

  const handlePlayVideo = (item: VideoItem) => {
    if (item.source === "youtube" && item.publicUrl) {
      window.open(item.publicUrl, "_blank", "noopener,noreferrer");
      return;
    }
    if (item.source === "link" && item.publicUrl) {
      window.open(item.publicUrl, "_blank", "noopener,noreferrer");
      return;
    }
    const src = `${BASE}/upload/${item.id}`;
    setVideoViewer({ src, filename: item.name || item.title, mimeType: item.mimeType });
  };

  const filtered = videos.filter((v) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return v.title.toLowerCase().includes(q) || v.name.toLowerCase().includes(q);
  });

  return (
    <div className="h-full flex flex-col gap-6">
      {videoViewer && (
        <VideoViewer
          src={videoViewer.src}
          filename={videoViewer.filename}
          mimeType={videoViewer.mimeType}
          onClose={() => setVideoViewer(null)}
        />
      )}

      <div className="flex justify-between items-center">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-st-accent uppercase mb-1">Video Analysis</p>
          <h1 className="text-3xl font-bold text-st-text-primary">Video Intelligence</h1>
          <p className="text-st-text-secondary text-sm mt-1">
            {videos.length} video{videos.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" size="sm" onClick={() => setShowUrlModal(true)}>
            <Link2 className="w-4 h-4 mr-1" />YouTube URL
          </Button>
          <Button variant="primary" size="sm" onClick={() => document.getElementById("video-upload-input")?.click()}>
            <Upload className="w-4 h-4 mr-1" />Upload Video
          </Button>
          <input id="video-upload-input" type="file" accept="video/*" className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (!file) return;
              try {
                await api.uploadFile("/upload", file);
                await fetchVideos();
              } catch (err: unknown) {
                setError(err instanceof Error ? err.message : "Upload failed");
              }
              e.target.value = "";
            }} />
          <Button variant="ghost" size="sm" onClick={fetchVideos} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {error && (
        <Card className="p-3 bg-st-danger/10 border-st-danger/30 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-st-danger shrink-0" />
          <p className="text-sm text-st-danger flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-st-text-muted hover:text-st-text-primary text-xs">Dismiss</button>
        </Card>
      )}

      <div className="flex-1 grid grid-cols-12 gap-6 min-h-0 overflow-hidden">
        {/* Video List */}
        <div className="col-span-3 flex flex-col gap-3 overflow-y-auto">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-st-text-muted" />
            <input type="text" placeholder="Search videos..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-st-bg-elevated border border-st-border rounded-lg text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none focus:border-st-accent/50" />
          </div>
          {loading && videos.length === 0 ? (
            <div className="p-8 text-center text-st-text-muted">Loading...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-st-text-muted">No videos found</div>
          ) : (
            filtered.map((v) => {
              const ytInfo = v.publicUrl ? isYouTubeUrl(v.publicUrl) : { isYt: false };
              return (
                <Card key={v.id} onClick={() => setSelectedVideo(v)}
                  className={`p-4 cursor-pointer transition-all ${selectedVideo?.id === v.id ? "border-st-accent/50 bg-st-bg-elevated" : "hover:border-st-accent/20"}`}>
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-st-bg-primary rounded-lg flex items-center justify-center shrink-0 relative overflow-hidden">
                      {ytInfo.isYt && ytInfo.videoId ? (
                        <Image src={`https://img.youtube.com/vi/${ytInfo.videoId}/default.jpg`} alt=""
                          fill unoptimized className="object-cover" />
                      ) : (
                        <Play className="w-5 h-5 text-purple-400" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="text-sm font-semibold text-st-text-primary truncate">{v.title}</h4>
                      <div className="flex items-center gap-2 mt-0.5">
                        {v.size > 0 && <span className="text-xs text-st-text-muted">{formatSize(v.size)}</span>}
                        <span className="text-xs text-st-text-muted">{formatDate(v.uploadedAt)}</span>
                        <Badge variant={v.source === "youtube" ? "success" : "outline"} className="text-[9px]">
                          {v.source === "youtube" ? "YT" : v.source === "link" ? "URL" : "File"}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Main Content */}
        <div className="col-span-9 flex flex-col gap-4 overflow-y-auto">
          {selectedVideo ? (
            <>
              {/* Video Player */}
              <Card className="aspect-video bg-st-bg-primary flex items-center justify-center relative overflow-hidden group">
                {selectedVideo.source === "youtube" && selectedVideo.publicUrl ? (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-red-600/80 flex items-center justify-center mx-auto mb-3 hover:bg-red-600 cursor-pointer transition-colors"
                      onClick={() => window.open(selectedVideo.publicUrl!, "_blank", "noopener,noreferrer")}>
                      <Play className="w-8 h-8 text-white ml-1" />
                    </div>
                    <p className="text-sm text-st-text-secondary">Open in YouTube</p>
                    <p className="text-xs text-st-text-muted">{selectedVideo.title}</p>
                  </div>
                ) : selectedVideo.source === "link" && selectedVideo.publicUrl ? (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-st-accent/20 flex items-center justify-center mx-auto mb-3 hover:bg-st-accent/30 cursor-pointer transition-colors"
                      onClick={() => window.open(selectedVideo.publicUrl!, "_blank", "noopener,noreferrer")}>
                      <ExternalLink className="w-8 h-8 text-st-accent" />
                    </div>
                    <p className="text-sm text-st-text-secondary">Open link in new tab</p>
                    <p className="text-xs text-st-text-muted">{selectedVideo.title}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <div className="w-16 h-16 rounded-full bg-st-accent/20 flex items-center justify-center mx-auto mb-3 hover:bg-st-accent/30 cursor-pointer transition-colors"
                      onClick={() => handlePlayVideo(selectedVideo)}>
                      <Play className="w-8 h-8 text-st-accent ml-1" />
                    </div>
                    <p className="text-sm text-st-text-secondary">{selectedVideo.title}</p>
                    <p className="text-xs text-st-text-muted">{formatSize(selectedVideo.size)}</p>
                    <Button variant="primary" size="sm" className="mt-3" onClick={() => handlePlayVideo(selectedVideo)}>
                      <Play className="w-4 h-4 mr-1" />Play Video
                    </Button>
                  </div>
                )}
              </Card>

              {/* Info bar */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <h2 className="text-lg font-bold text-st-text-primary">{selectedVideo.title}</h2>
                  <Badge variant={selectedVideo.source === "youtube" ? "success" : "outline"}>
                    {selectedVideo.source === "youtube" ? "YouTube" : selectedVideo.source === "link" ? "External" : "Uploaded"}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  {selectedVideo.source === "upload" && (
                    <Button variant="ghost" size="sm" onClick={() => handlePlayVideo(selectedVideo)}>
                      <Play className="w-4 h-4 mr-1" />Play
                    </Button>
                  )}
                  <Button variant="ghost" size="sm" onClick={(e) => handleDelete(selectedVideo, e)}>
                    <Trash2 className="w-4 h-4 text-st-text-muted" />
                  </Button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex gap-1 bg-st-bg-elevated p-1 rounded-lg border border-st-border">
                {[
                  { key: "summary", label: "Summary", icon: Sparkles },
                  { key: "notes", label: "Notes", icon: BookOpen },
                  { key: "quiz", label: "Quiz", icon: HelpCircle },
                ].map((tab) => (
                  <button key={tab.key} onClick={() => setActiveTab(tab.key as "summary" | "notes" | "quiz")}
                    className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-colors flex-1 justify-center ${activeTab === tab.key ? "bg-st-accent text-black" : "text-st-text-secondary hover:text-st-text-primary"}`}>
                    <tab.icon className="w-4 h-4" />{tab.label}
                  </button>
                ))}
              </div>

              <Card className="p-6 flex-1">
                {activeTab === "summary" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-st-text-primary">Video Summary</h3>
                    <p className="text-sm text-st-text-secondary leading-relaxed">
                      Video analysis is available for uploaded videos. Upload a video file to get AI-powered summaries,
                      transcripts, and insights.
                    </p>
                  </div>
                )}
                {activeTab === "notes" && (
                  <div className="space-y-3">
                    <h3 className="text-lg font-bold text-st-text-primary">Notes</h3>
                    <p className="text-sm text-st-text-secondary">
                      Take notes while watching. Notes are automatically saved to your workspace.
                    </p>
                  </div>
                )}
                {activeTab === "quiz" && (
                  <div className="space-y-4">
                    <h3 className="text-lg font-bold text-st-text-primary">Practice Quiz</h3>
                    <p className="text-sm text-st-text-secondary">
                      AI-generated quiz questions based on video content will appear here after analysis.
                    </p>
                  </div>
                )}
              </Card>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <Video className="w-16 h-16 text-st-text-muted opacity-20 mx-auto mb-4" />
                <p className="text-st-text-muted">Select a video to start</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Add URL Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowUrlModal(false); setUrlError(null); }}>
          <Card className="w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-st-text-primary">Add Video URL</h3>
              <button onClick={() => { setShowUrlModal(false); setUrlError(null); }} className="text-st-text-muted hover:text-st-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <p className="text-xs text-st-text-muted">Paste a YouTube URL or any video link</p>
              <input type="url" value={urlInput} onChange={(e) => { setUrlInput(e.target.value); setUrlError(null); }}
                placeholder="https://youtube.com/watch?v=..."
                className={`w-full px-3 py-2 bg-st-bg-elevated border rounded-lg text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none ${urlError ? "border-st-danger" : "border-st-border focus:border-st-accent/50"}`} />
              {urlError && <p className="text-xs text-st-danger">{urlError}</p>}
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setShowUrlModal(false); setUrlError(null); }}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={handleAddUrl} disabled={!urlInput.trim() || addingUrl}>
                  {addingUrl ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                  Add
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={confirmDeleteVideo}
        title="Delete Video"
        message="Are you sure you want to delete this video? This action cannot be undone."
        itemName={confirmDelete?.title}
      />
    </div>
  );
}


