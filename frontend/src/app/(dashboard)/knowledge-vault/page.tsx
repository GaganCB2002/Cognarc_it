"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import api from "@/lib/api";
import { UploadModal } from "@/components/dashboard/UploadModal";
import {
  Database, Upload, Search, Star, Grid, List, FileText, Video, Image,
  Link2, Code, FolderOpen, Heart, Trash2, ExternalLink,
  Clock, RefreshCw, AlertCircle, Plus, X
} from "lucide-react";

type FileItem = {
  id: string;
  name: string;
  title: string;
  mimeType: string;
  size: number;
  type: "PDF" | "VIDEO" | "IMAGE" | "LINK" | "CODE" | "OTHER";
  status: string;
  folder: string | null;
  tags: string[];
  isFavorite: boolean;
  resourceId: string | null;
  publicUrl: string | null;
  uploadedAt: string;
};

const typeIcons: Record<string, any> = {
  PDF: FileText, VIDEO: Video, IMAGE: Image, LINK: Link2, CODE: Code, OTHER: FolderOpen,
};
const typeColors: Record<string, string> = {
  PDF: "text-red-400", VIDEO: "text-purple-400", IMAGE: "text-pink-400",
  LINK: "text-blue-400", CODE: "text-emerald-400", OTHER: "text-st-text-muted",
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
  if (days < 30) return `${Math.floor(days / 7)} weeks ago`;
  return date.toLocaleDateString();
}

export default function KnowledgeVaultPage() {
  const router = useRouter();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [uploading, setUploading] = useState(false);
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlType, setUrlType] = useState<"LINK" | "VIDEO">("LINK");
  const [urlTitle, setUrlTitle] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const [uploaded, resources] = await Promise.all([
        api.get<any[]>("/upload/my-files"),
        api.get<any[]>("/resources"),
      ]);
      const resourceFiles: FileItem[] = (resources || [])
        .filter((r: any) => !r.isUpload)
        .map((r: any) => ({
          id: r.id,
          name: r.title,
          title: r.title,
          mimeType: "",
          size: 0,
          type: r.type,
          status: "READY",
          folder: null,
          tags: r.tags || [],
          isFavorite: r.isFavorite || false,
          resourceId: r.id,
          publicUrl: r.url || null,
          uploadedAt: r.createdAt,
        }));
      setFiles([...(uploaded || []), ...resourceFiles]);
    } catch (err: any) {
      setError(err.message || "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    try {
      await api.uploadFile("/upload", file);
      await fetchFiles();
    } catch (err: any) {
      setError(err.message || "Upload failed");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  const handleDelete = async (file: FileItem) => {
    if (!confirm("Delete this file permanently?")) return;
    try {
      if (file.resourceId) {
        await api.delete(`/resources/${file.resourceId}`);
      } else {
        await api.delete(`/upload/${file.id}`);
      }
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
    } catch (err: any) {
      setError(err.message || "Delete failed");
    }
  };

  const BASE = process.env.NEXT_PUBLIC_API_URL || "https://cognarc-it-1.onrender.com/api";
  const handleFileClick = (file: FileItem) => {
    if (file.type === "PDF") {
      router.push(`/pdf-intelligence/view/${file.id}`);
    } else if (file.publicUrl) {
      window.open(file.publicUrl, "_blank");
    } else {
      window.open(`${BASE}/upload/${file.id}`, "_blank");
    }
  };

  const handleAddUrl = async () => {
    if (!urlInput.trim()) return;
    try {
      await api.post("/resources", {
        title: urlTitle || urlInput,
        type: urlType,
        url: urlInput,
      });
      setShowUrlModal(false);
      setUrlInput("");
      setUrlTitle("");
      await fetchFiles();
    } catch (err: any) {
      setError(err.message || "Failed to add URL");
    }
  };

  const handleToggleFavorite = async (file: FileItem) => {
    try {
      if (file.resourceId) {
        await api.put(`/resources/${file.resourceId}`, { isFavorite: !file.isFavorite });
      } else {
        await api.patch(`/upload/${file.id}/metadata`, { isFavorite: !file.isFavorite });
      }
      setFiles((prev) =>
        prev.map((f) => (f.id === file.id ? { ...f, isFavorite: !f.isFavorite } : f))
      );
    } catch (err: any) {
      console.error("Toggle favorite error:", err);
    }
  };

  const filtered = files.filter((f) => {
    if (filter !== "ALL" && filter !== "FAVORITES" && f.type !== filter) return false;
    if (filter === "FAVORITES" && !f.isFavorite) return false;
    if (searchQuery && !f.name.toLowerCase().includes(searchQuery.toLowerCase()) && !f.title.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const stats = [
    { label: "Total Files", value: files.length, icon: Database },
    { label: "PDFs", value: files.filter((f) => f.type === "PDF").length, icon: FileText },
    { label: "Videos", value: files.filter((f) => f.type === "VIDEO").length, icon: Video },
    { label: "Favorites", value: files.filter((f) => f.isFavorite).length, icon: Heart },
  ];

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <p className="text-[10px] font-bold tracking-widest text-st-accent uppercase mb-1">
            Your Personal Document Library
          </p>
          <h1 className="text-3xl font-bold text-st-text-primary">Knowledge Vault</h1>
          <p className="text-st-text-secondary text-sm mt-1">
            {files.length} file{files.length !== 1 ? "s" : ""} stored securely — accessible anytime, anywhere
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-st-text-muted" />
            <input
              type="text" placeholder="Search your files..."
              value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 bg-st-bg-elevated border border-st-border rounded-lg text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none focus:border-st-accent/50 w-56 md:w-64"
            />
          </div>
          <div className="flex bg-st-bg-elevated rounded-lg border border-st-border overflow-hidden">
            <button onClick={() => setViewMode("grid")} className={`p-2 ${viewMode === "grid" ? "bg-st-accent/10 text-st-accent" : "text-st-text-muted"}`}>
              <Grid className="w-4 h-4" />
            </button>
            <button onClick={() => setViewMode("list")} className={`p-2 ${viewMode === "list" ? "bg-st-accent/10 text-st-accent" : "text-st-text-muted"}`}>
              <List className="w-4 h-4" />
            </button>
          </div>
          <Button variant="primary" size="sm" onClick={() => setShowUploadModal(true)}>
            <Upload className="w-4 h-4 mr-1" />
            Upload
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setShowUrlModal(true)}>
            <Link2 className="w-4 h-4 mr-1" />Add Link
          </Button>
          <Button variant="ghost" size="sm" onClick={fetchFiles} disabled={loading}>
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <Card className="p-3 bg-st-danger/10 border-st-danger/30 flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-st-danger shrink-0" />
          <p className="text-sm text-st-danger flex-1">{error}</p>
          <button onClick={() => setError(null)} className="text-st-text-muted hover:text-st-text-primary text-xs">Dismiss</button>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s, i) => (
          <Card key={i} className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-st-bg-elevated flex items-center justify-center">
              <s.icon className="w-5 h-5 text-st-accent" />
            </div>
            <div>
              <p className="text-xs text-st-text-muted">{s.label}</p>
              <p className="text-xl font-bold text-st-text-primary">{s.value}</p>
            </div>
          </Card>
        ))}
      </div>

      {/* Filter Tabs */}
      <div className="flex gap-2 flex-wrap">
        {["ALL", "PDF", "VIDEO", "IMAGE", "FAVORITES"].map((f) => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium transition-colors ${
              filter === f
                ? "bg-st-accent text-black"
                : "bg-st-bg-elevated text-st-text-secondary hover:text-st-text-primary border border-st-border"
            }`}
          >
            {f === "ALL" ? "All" : f === "FAVORITES" ? "⭐ Favorites" : f}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading && files.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="w-8 h-8 animate-spin text-st-accent mx-auto mb-3" />
            <p className="text-st-text-secondary">Loading your documents...</p>
          </div>
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center max-w-md">
            <FolderOpen className="w-12 h-12 text-st-text-muted mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-st-text-primary mb-2">
              {searchQuery || filter !== "ALL" ? "No matching files" : "Your vault is empty"}
            </h3>
            <p className="text-st-text-secondary text-sm mb-4">
              {searchQuery || filter !== "ALL"
                ? "Try a different search or filter"
                : "Upload your first document — PDFs, videos, and images are supported."}
            </p>
            {!searchQuery && filter === "ALL" && (
              <Button variant="primary" onClick={() => fileInputRef.current?.click()}>
                <Upload className="w-4 h-4 mr-1" /> Upload Your First File
              </Button>
            )}
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-1 overflow-y-auto pb-8">
          {filtered.map((file) => {
            const Icon = typeIcons[file.type] || FolderOpen;
            return (
              <Card key={file.id} onClick={() => handleFileClick(file)} className="p-5 hover:border-st-accent/30 transition-all cursor-pointer group flex flex-col relative">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-st-bg-elevated flex items-center justify-center">
                    <Icon className={`w-5 h-5 ${typeColors[file.type] || "text-st-text-muted"}`} />
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); handleToggleFavorite(file); }}>
                      <Star className={`w-4 h-4 ${file.isFavorite ? "fill-st-accent text-st-accent" : "text-st-text-muted"}`} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(file); }} className="hover:text-st-danger transition-colors">
                      <Trash2 className="w-4 h-4 text-st-text-muted" />
                    </button>
                  </div>
                </div>
                <h4 className="font-semibold text-sm text-st-text-primary mb-1 group-hover:text-st-accent transition-colors line-clamp-2">
                  {file.title}
                </h4>
                <p className="text-xs text-st-text-muted mb-1 truncate">{file.name}</p>
                <div className="flex items-center gap-3 text-xs text-st-text-muted mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDate(file.uploadedAt)}
                  </span>
                  <span>{formatSize(file.size)}</span>
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {file.tags.slice(0, 2).map((t) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-st-bg-primary text-st-text-muted">{t}</span>
                    ))}
                  </div>
                  <Badge variant="outline" className="text-[10px]">{file.type}</Badge>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-0 overflow-hidden flex-1">
          <div className="divide-y divide-st-border">
            {filtered.map((file) => {
              const Icon = typeIcons[file.type] || FolderOpen;
              return (
                <div key={file.id} onClick={() => handleFileClick(file)} className="p-4 flex items-center gap-4 hover:bg-st-bg-elevated transition-colors group cursor-pointer">
                  <Icon className={`w-5 h-5 ${typeColors[file.type] || "text-st-text-muted"} shrink-0`} />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-sm text-st-text-primary truncate">{file.title}</h4>
                    <p className="text-xs text-st-text-muted">
                      {file.name} &middot; {formatSize(file.size)} &middot; {formatDate(file.uploadedAt)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); handleToggleFavorite(file); }}>
                      <Star className={`w-4 h-4 ${file.isFavorite ? "fill-st-accent text-st-accent" : "text-st-text-muted hover:text-st-accent"}`} />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); window.open(`${BASE}/upload/${file.id}`, "_blank"); }}>
                      <ExternalLink className="w-4 h-4 text-st-text-muted hover:text-st-accent" />
                    </button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(file); }}>
                      <Trash2 className="w-4 h-4 text-st-text-muted hover:text-st-danger" />
                    </button>
                  </div>
                  <Badge variant="outline" className="text-[10px]">{file.type}</Badge>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Add URL/Link Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowUrlModal(false)}>
          <Card className="w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-st-text-primary">Add {urlType === "LINK" ? "Link" : "Video URL"}</h3>
              <button onClick={() => setShowUrlModal(false)} className="text-st-text-muted hover:text-st-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                <button onClick={() => setUrlType("LINK")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${urlType === "LINK" ? "bg-st-accent text-black" : "bg-st-bg-elevated text-st-text-secondary"}`}>
                  <Link2 className="w-4 h-4 inline mr-1" />Link
                </button>
                <button onClick={() => setUrlType("VIDEO")} className={`flex-1 py-2 rounded-lg text-sm font-medium transition-colors ${urlType === "VIDEO" ? "bg-st-accent text-black" : "bg-st-bg-elevated text-st-text-secondary"}`}>
                  <Video className="w-4 h-4 inline mr-1" />Video
                </button>
              </div>
              <div>
                <label className="block text-xs text-st-text-muted mb-1">Title (optional)</label>
                <input type="text" value={urlTitle} onChange={(e) => setUrlTitle(e.target.value)}
                  placeholder={urlType === "LINK" ? "My Link" : "My Video"}
                  className="w-full px-3 py-2 bg-st-bg-elevated border border-st-border rounded-lg text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none focus:border-st-accent/50" />
              </div>
              <div>
                <label className="block text-xs text-st-text-muted mb-1">URL</label>
                <input type="url" value={urlInput} onChange={(e) => setUrlInput(e.target.value)}
                  placeholder={urlType === "LINK" ? "https://example.com" : "https://youtube.com/watch?v=..."}
                  className="w-full px-3 py-2 bg-st-bg-elevated border border-st-border rounded-lg text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none focus:border-st-accent/50" />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => setShowUrlModal(false)}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={handleAddUrl} disabled={!urlInput.trim()}>
                  <Plus className="w-4 h-4 mr-1" />Add
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
      {/* Upload Modal */}
      <UploadModal 
        isOpen={showUploadModal} 
        onClose={() => setShowUploadModal(false)} 
        onUploadSuccess={fetchFiles} 
      />
    </div>
  );
}
