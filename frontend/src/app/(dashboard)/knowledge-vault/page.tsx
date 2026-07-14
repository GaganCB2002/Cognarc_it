"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import api, { API_URL } from "@/lib/api";
import { UploadModal } from "@/components/dashboard/UploadModal";
import { ImageViewer } from "@/components/dashboard/ImageViewer";
import { VideoViewer } from "@/components/dashboard/VideoViewer";
import { DocumentViewer } from "@/components/dashboard/DocumentViewer";
import {
  Database, Upload, Search, Star, Grid, List, FileText, Video, Image,
  Link2, Code, FolderOpen, Heart, Trash2, ExternalLink,
  Clock, RefreshCw, AlertCircle, Plus, X, Globe,
  Music, Download, Edit3
} from "lucide-react";
import NextImage from "next/image";
import { ActionMenu } from "@/components/crud/ActionMenu";
import { ConfirmDialog } from "@/components/crud/ConfirmDialog";
import { downloadFile, copyLink, shareResource } from "@/components/crud/crudHelpers";
import toast from "react-hot-toast";

type RawUpload = {
  id: string;
  name?: string;
  originalName?: string;
  title?: string;
  mimeType?: string;
  size?: number;
  type?: string;
  status?: string;
  folder?: string | null;
  tags?: string[];
  isFavorite?: boolean;
  resourceId?: string | null;
  publicUrl?: string | null;
  uploadedAt?: string;
  createdAt?: string;
};

type RawResource = {
  id: string;
  title?: string;
  url?: string;
  mimeType?: string;
  fileSize?: number;
  type?: string;
  tags?: string[];
  isFavorite?: boolean;
  isUpload?: boolean;
  createdAt?: string;
};

type FileItem = {
  id: string;
  name: string;
  title: string;
  mimeType: string;
  size: number;
  type: "PDF" | "VIDEO" | "IMAGE" | "LINK" | "CODE" | "OTHER" | "AUDIO";
  status: string;
  folder: string | null;
  tags: string[];
  isFavorite: boolean;
  resourceId: string | null;
  publicUrl: string | null;
  uploadedAt: string;
};

function getFileTypeIcon(type: string) {
  switch (type) {
    case "PDF": return FileText;
    case "VIDEO": return Video;
    case "IMAGE": return Image;
    case "LINK": return Link2;
    case "CODE": return Code;
    case "AUDIO": return Music;
    case "OTHER": return FolderOpen;
    default: return FolderOpen;
  }
}

function getFileTypeColor(type: string) {
  switch (type) {
    case "PDF": return "text-red-400";
    case "VIDEO": return "text-purple-400";
    case "IMAGE": return "text-pink-400";
    case "LINK": return "text-blue-400";
    case "CODE": return "text-emerald-400";
    case "AUDIO": return "text-orange-400";
    default: return "text-st-text-muted";
  }
}

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

function isValidUrl(str: string): boolean {
  try {
    const url = new URL(str);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function getDomainFromUrl(url: string): string {
  try {
    return new URL(url).hostname.replace("www.", "");
  } catch {
    return url;
  }
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

function getFaviconUrl(url: string): string {
  try {
    const u = new URL(url);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=32`;
  } catch {
    return "";
  }
}

function getFileTypeFromMime(mimeType: string): string {
  if (!mimeType) return "OTHER";
  if (mimeType.startsWith("image/")) return "IMAGE";
  if (mimeType.startsWith("video/")) return "VIDEO";
  if (mimeType.startsWith("audio/")) return "AUDIO";
  if (mimeType === "application/pdf") return "PDF";
  if (mimeType.includes("word") || mimeType.includes("document") && mimeType.includes("officedocument")) return "OTHER";
  if (mimeType.includes("spreadsheet") || mimeType.includes("excel")) return "OTHER";
  if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "OTHER";
  if (mimeType === "text/plain" || mimeType === "text/csv" || mimeType === "application/json") return "OTHER";
  return "OTHER";
}

export default function KnowledgeVaultPage() {
  const router = useRouter();
  const [files, setFiles] = useState<FileItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filter, setFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showUrlModal, setShowUrlModal] = useState(false);
  const [urlInput, setUrlInput] = useState("");
  const [urlType, setUrlType] = useState<"LINK" | "VIDEO">("LINK");
  const [urlTitle, setUrlTitle] = useState("");
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [urlError, setUrlError] = useState<string | null>(null);
  const [addingUrl, setAddingUrl] = useState(false);

  // Viewer states
  const [imageViewer, setImageViewer] = useState<{ src: string; filename: string } | null>(null);
  const [videoViewer, setVideoViewer] = useState<{ src: string; filename: string; mimeType: string } | null>(null);
  const [documentViewer, setDocumentViewer] = useState<{ src: string; filename: string; mimeType: string } | null>(null);

  const [confirmDelete, setConfirmDelete] = useState<FileItem | null>(null);
  const [renameTarget, setRenameTarget] = useState<FileItem | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const BASE = API_URL;

  const fetchFiles = async () => {
    setLoading(true);
    setError(null);
    try {
      const [uploaded, resources] = await Promise.all([
        api.get<RawUpload[]>("/upload/my-files").catch(() => [] as RawUpload[]),
        api.get<RawResource[]>("/resources").catch(() => [] as RawResource[]),
      ]);
      const uploadedFiles: FileItem[] = (uploaded || []).map((r: RawUpload) => ({
        id: r.id,
        name: r.name || r.originalName || "",
        title: r.title || r.originalName || "Untitled",
        mimeType: r.mimeType || "",
        size: r.size || 0,
        type: (r.type || getFileTypeFromMime(r.mimeType || "")) as FileItem["type"],
        status: r.status || "READY",
        folder: r.folder || null,
        tags: r.tags || [],
        isFavorite: r.isFavorite || false,
        resourceId: r.resourceId || null,
        publicUrl: r.publicUrl || null,
        uploadedAt: r.uploadedAt || r.createdAt || new Date().toISOString(),
      }));
      const resourceFiles: FileItem[] = (resources || [])
        .filter((r: RawResource) => !r.isUpload)
        .map((r: RawResource) => ({
          id: r.id,
          name: r.title || r.url || "Untitled",
          title: r.title || r.url || "Untitled",
          mimeType: r.mimeType || "",
          size: r.fileSize || 0,
          type: (r.type || "LINK") as FileItem["type"],
          status: "READY",
          folder: null,
          tags: r.tags || [],
          isFavorite: r.isFavorite || false,
          resourceId: r.id,
          publicUrl: r.url || null,
          uploadedAt: r.createdAt || new Date().toISOString(),
        }));
      setFiles([...uploadedFiles, ...resourceFiles]);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to load files");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleFileClick = (file: FileItem) => {
    if (file.type === "LINK" && file.publicUrl) {
      window.open(file.publicUrl, "_blank", "noopener,noreferrer");
      return;
    }

    if (file.type === "PDF") {
      router.push(`/pdf-intelligence/view/${file.id}`);
      return;
    }

    const fileUrl = file.publicUrl || `${BASE}/upload/${file.id}`;

    if (file.type === "IMAGE" || file.mimeType?.startsWith("image/")) {
      setImageViewer({ src: fileUrl, filename: file.name || file.title });
      return;
    }

    if (file.type === "VIDEO" || file.mimeType?.startsWith("video/")) {
      setVideoViewer({ src: fileUrl, filename: file.name || file.title, mimeType: file.mimeType });
      return;
    }

    if (file.type === "AUDIO" || file.mimeType?.startsWith("audio/")) {
      window.open(fileUrl, "_blank");
      return;
    }

    const nonPreviewExts = ["zip", "rar", "tar", "gz", "7z", "exe", "dmg", "bin"];
    const ext = file.name?.split(".").pop()?.toLowerCase() || "";
    if (nonPreviewExts.includes(ext)) {
      window.open(`${BASE}/upload/${file.id}/download`, "_blank");
      return;
    }

    if (file.type === "OTHER" || file.type === "CODE") {
      setDocumentViewer({
        src: fileUrl,
        filename: file.name || file.title,
        mimeType: file.mimeType || "application/octet-stream",
      });
      return;
    }

    window.open(fileUrl, "_blank");
  };

  const handleAddUrl = async () => {
    setUrlError(null);
    const trimmedUrl = urlInput.trim();
    if (!trimmedUrl) { setUrlError("Please enter a URL"); return; }
    if (!isValidUrl(trimmedUrl)) { setUrlError("Please enter a valid HTTP or HTTPS URL"); return; }
    setAddingUrl(true);
    try {
      await api.post("/resources", {
        title: urlTitle || trimmedUrl,
        type: urlType,
        url: trimmedUrl,
      });
      setShowUrlModal(false);
      setUrlInput("");
      setUrlTitle("");
      setUrlError(null);
      await fetchFiles();
    } catch (err: unknown) {
      setUrlError(err instanceof Error ? err.message : "Failed to add URL");
    } finally {
      setAddingUrl(false);
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    const file = confirmDelete;
    try {
      await api.delete(`/upload/${file.id}`);
      setFiles((prev) => prev.filter((f) => f.id !== file.id));
      toast.success("Deleted successfully");
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setConfirmDelete(null);
    }
  };

  const handleRename = async () => {
    if (!renameTarget || !renameValue.trim()) return;
    try {
      if (renameTarget.resourceId) {
        await api.put(`/resources/${renameTarget.resourceId}`, { title: renameValue.trim() });
      } else {
        await api.patch(`/upload/${renameTarget.id}/metadata`, { title: renameValue.trim() });
      }
      setFiles((prev) =>
        prev.map((f) => (f.id === renameTarget.id ? { ...f, title: renameValue.trim() } : f))
      );
      toast.success("Renamed successfully");
    } catch {
      toast.error("Rename failed");
    } finally {
      setRenameTarget(null);
      setRenameValue("");
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
    } catch (err: unknown) {
      console.error("Toggle favorite error:", err);
    }
  };

  const filtered = files.filter((f) => {
    if (filter !== "ALL" && filter !== "FAVORITES" && f.type !== filter) return false;
    if (filter === "FAVORITES" && !f.isFavorite) return false;
    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      if (!f.name.toLowerCase().includes(q) && !f.title.toLowerCase().includes(q) && !(f.publicUrl || "").toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const stats = [
    { label: "Total Files", value: files.length, icon: Database },
    { label: "PDFs", value: files.filter((f) => f.type === "PDF").length, icon: FileText },
    { label: "Videos", value: files.filter((f) => f.type === "VIDEO").length, icon: Video },
    { label: "Favorites", value: files.filter((f) => f.isFavorite).length, icon: Heart },
  ];

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Image Viewer */}
      {imageViewer && (
        <ImageViewer
          src={imageViewer.src}
          filename={imageViewer.filename}
          onClose={() => setImageViewer(null)}
        />
      )}

      {/* Video Viewer */}
      {videoViewer && (
        <VideoViewer
          src={videoViewer.src}
          filename={videoViewer.filename}
          mimeType={videoViewer.mimeType}
          onClose={() => setVideoViewer(null)}
        />
      )}

      {/* Document Viewer */}
      {documentViewer && (
        <DocumentViewer
          src={documentViewer.src}
          filename={documentViewer.filename}
          mimeType={documentViewer.mimeType}
          onClose={() => setDocumentViewer(null)}
        />
      )}

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
        {["ALL", "PDF", "VIDEO", "IMAGE", "LINK", "FAVORITES"].map((f) => (
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
          </div>
        </div>
      ) : viewMode === "grid" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 flex-1 overflow-y-auto pb-8">
          {filtered.map((file) => {
            const Icon = getFileTypeIcon(file.type);
            const ytInfo = file.publicUrl ? isYouTubeUrl(file.publicUrl) : { isYt: false };
            return (
              <Card key={file.id} onClick={() => handleFileClick(file)} className="p-5 hover:border-st-accent/30 transition-all cursor-pointer group flex flex-col relative">
                {file.type === "LINK" && file.publicUrl && (
                  <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                    <span className="text-[10px] text-st-text-muted bg-st-bg-elevated px-2 py-0.5 rounded-full">
                      {getDomainFromUrl(file.publicUrl)}
                    </span>
                  </div>
                )}
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-lg bg-st-bg-elevated flex items-center justify-center">
                    {file.type === "LINK" && ytInfo.isYt ? (
                      <svg className="w-5 h-5 text-red-500" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    ) : (
                      <Icon className={`w-5 h-5 ${getFileTypeColor(file.type)}`} />
                    )}
                  </div>
                  <ActionMenu
                    actions={[
                      { id: "view", label: "View", icon: ExternalLink, onClick: () => handleFileClick(file) },
                      { id: "download", label: "Download", icon: Download, onClick: () => downloadFile(file.id, file.name) },
                      ...(file.type !== "LINK" ? [{ id: "rename", label: "Rename", icon: Edit3, onClick: () => { setRenameTarget(file); setRenameValue(file.title); } }] : []),
                      { id: "copy-link", label: "Copy Link", icon: Link2, onClick: () => copyLink(file.id) },
                      { id: "share", label: "Share", icon: Heart, onClick: () => shareResource(file.title, `${BASE}/upload/${file.id}`) },
                      { id: "favorite", label: file.isFavorite ? "Unfavorite" : "Favorite", icon: Star, variant: "warning" as const, onClick: () => handleToggleFavorite(file) },
                      { id: "delete", label: "Delete", icon: Trash2, variant: "danger" as const, divider: true, onClick: () => setConfirmDelete(file) },
                    ]}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                </div>

                {/* YouTube thumbnail for LINK type */}
                {file.type === "LINK" && ytInfo.isYt && ytInfo.videoId && (
                  <div className="mb-3 rounded-lg overflow-hidden bg-st-bg-primary aspect-video relative">
                    <NextImage
                      src={`https://img.youtube.com/vi/${ytInfo.videoId}/mqdefault.jpg`}
                      alt={file.title}
                      fill
                      unoptimized
                      className="object-cover"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-10 h-10 rounded-full bg-red-600/80 flex items-center justify-center">
                        <svg className="w-5 h-5 text-white ml-0.5" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M8 5v14l11-7z" />
                        </svg>
                      </div>
                    </div>
                  </div>
                )}

                {/* Favicon for LINK type */}
                {file.type === "LINK" && !ytInfo.isYt && file.publicUrl && (
                  <div className="mb-2 flex items-center gap-2">
                    <NextImage
                      src={getFaviconUrl(file.publicUrl)}
                      alt=""
                      width={16}
                      height={16}
                      unoptimized
                      className="w-4 h-4 rounded"
                      onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                    />
                    <span className="text-[10px] text-st-text-muted truncate">{getDomainFromUrl(file.publicUrl)}</span>
                  </div>
                )}

                <h4 className="font-semibold text-sm text-st-text-primary mb-1 group-hover:text-st-accent transition-colors line-clamp-2">
                  {file.title}
                </h4>
                {file.name !== file.title && (
                  <p className="text-xs text-st-text-muted mb-1 truncate">{file.name}</p>
                )}
                <div className="flex items-center gap-3 text-xs text-st-text-muted mb-3">
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {formatDate(file.uploadedAt)}
                  </span>
                  {file.size > 0 && <span>{formatSize(file.size)}</span>}
                </div>
                <div className="mt-auto flex items-center justify-between">
                  <div className="flex gap-1 flex-wrap">
                    {file.tags.slice(0, 2).map((t) => (
                      <span key={t} className="text-[10px] px-1.5 py-0.5 rounded bg-st-bg-primary text-st-text-muted">{t}</span>
                    ))}
                  </div>
                  {file.type === "LINK" ? (
                    <span className="text-[10px] text-st-text-muted flex items-center gap-1">
                      <ExternalLink className="w-3 h-3" />
                    </span>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">{file.type}</Badge>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card className="p-0 overflow-hidden flex-1">
          <div className="divide-y divide-st-border">
            {filtered.map((file) => {
              const Icon = getFileTypeIcon(file.type);
              const ytInfo = file.publicUrl ? isYouTubeUrl(file.publicUrl) : { isYt: false };
              return (
                <div key={file.id} onClick={() => handleFileClick(file)} className="p-4 flex items-center gap-4 hover:bg-st-bg-elevated transition-colors group cursor-pointer">
                  {file.type === "LINK" && ytInfo.isYt ? (
                    <svg className="w-5 h-5 text-red-500 shrink-0" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                  ) : (
                    <Icon className={`w-5 h-5 ${getFileTypeColor(file.type)} shrink-0`} />
                  )}
                  <div className="flex-1 min-w-0">
                    {file.type === "LINK" && file.publicUrl && (
                      <div className="flex items-center gap-1.5 mb-0.5">
                        {!ytInfo.isYt && (
                          <NextImage src={getFaviconUrl(file.publicUrl)} alt="" width={12} height={12} unoptimized className="w-3 h-3 rounded"
                            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                        )}
                        <span className="text-[10px] text-st-text-muted">{getDomainFromUrl(file.publicUrl)}</span>
                      </div>
                    )}
                    <h4 className="font-medium text-sm text-st-text-primary truncate">{file.title}</h4>
                    <p className="text-xs text-st-text-muted">
                      {file.name !== file.title && <>{file.name} &middot; </>}
                      {file.size > 0 && <>{formatSize(file.size)} &middot; </>}
                      {formatDate(file.uploadedAt)}
                    </p>
                  </div>
                  <ActionMenu
                    actions={[
                      { id: "view", label: "View", icon: ExternalLink, onClick: () => handleFileClick(file) },
                      { id: "download", label: "Download", icon: Download, onClick: () => downloadFile(file.id, file.name) },
                      ...(file.type !== "LINK" ? [{ id: "rename", label: "Rename", icon: Edit3, onClick: () => { setRenameTarget(file); setRenameValue(file.title); } }] : []),
                      { id: "copy-link", label: "Copy Link", icon: Link2, onClick: () => copyLink(file.id) },
                      { id: "share", label: "Share", icon: Heart, onClick: () => shareResource(file.title, `${BASE}/upload/${file.id}`) },
                      { id: "favorite", label: file.isFavorite ? "Unfavorite" : "Favorite", icon: Star, variant: "warning" as const, onClick: () => handleToggleFavorite(file) },
                      { id: "delete", label: "Delete", icon: Trash2, variant: "danger" as const, divider: true, onClick: () => setConfirmDelete(file) },
                    ]}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  />
                  {file.type === "LINK" ? (
                    <span className="text-[10px] text-blue-400 font-medium">LINK</span>
                  ) : (
                    <Badge variant="outline" className="text-[10px]">{file.type}</Badge>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Add URL/Link Modal */}
      {showUrlModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setShowUrlModal(false); setUrlError(null); }}>
          <Card className="w-full max-w-md p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-st-text-primary">Add {urlType === "LINK" ? "Link" : "Video URL"}</h3>
              <button onClick={() => { setShowUrlModal(false); setUrlError(null); }} className="text-st-text-muted hover:text-st-text-primary">
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
                <label className="block text-xs text-st-text-muted mb-1">URL *</label>
                <input type="url" value={urlInput} onChange={(e) => { setUrlInput(e.target.value); setUrlError(null); }}
                  placeholder={urlType === "LINK" ? "https://example.com" : "https://youtube.com/watch?v=..."}
                  className={`w-full px-3 py-2 bg-st-bg-elevated border rounded-lg text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none ${urlError ? "border-st-danger" : "border-st-border focus:border-st-accent/50"}`} />
                {urlError && <p className="text-xs text-st-danger mt-1">{urlError}</p>}
              </div>

              {/* URL preview */}
              {isValidUrl(urlInput) && (
                <div className="bg-st-bg-elevated rounded-lg p-3 border border-st-border flex items-center gap-3">
                  <NextImage src={getFaviconUrl(urlInput)} alt="" width={20} height={20} unoptimized className="w-5 h-5 rounded"
                    onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }} />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs text-st-text-primary truncate font-medium">{urlTitle || urlInput}</p>
                    <p className="text-[10px] text-st-text-muted">{getDomainFromUrl(urlInput)}</p>
                  </div>
                  <Globe className="w-4 h-4 text-st-text-muted shrink-0" />
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button variant="ghost" size="sm" onClick={() => { setShowUrlModal(false); setUrlError(null); }}>Cancel</Button>
                <Button variant="primary" size="sm" onClick={handleAddUrl} disabled={!urlInput.trim() || addingUrl}>
                  {addingUrl ? <RefreshCw className="w-4 h-4 animate-spin mr-1" /> : <Plus className="w-4 h-4 mr-1" />}
                  {addingUrl ? "Adding..." : "Add"}
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

      {/* Confirm Delete Dialog */}
      <ConfirmDialog
        isOpen={!!confirmDelete}
        onClose={() => setConfirmDelete(null)}
        onConfirm={handleDeleteConfirm}
        title="Delete File"
        message="This action cannot be undone. The file will be permanently removed from storage."
        itemName={confirmDelete?.title}
        confirmLabel="Delete"
        variant="danger"
      />

      {/* Rename Modal */}
      {renameTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => { setRenameTarget(null); setRenameValue(""); }}>
          <Card className="w-full max-w-sm p-6 mx-4" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-st-text-primary">Rename File</h3>
              <button onClick={() => { setRenameTarget(null); setRenameValue(""); }} className="text-st-text-muted hover:text-st-text-primary">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div>
              <label className="block text-xs text-st-text-muted mb-1">New Name</label>
              <input
                type="text" value={renameValue} onChange={(e) => setRenameValue(e.target.value)}
                autoFocus
                onKeyDown={(e) => { if (e.key === "Enter") handleRename(); if (e.key === "Escape") { setRenameTarget(null); setRenameValue(""); } }}
                className="w-full px-3 py-2 bg-st-bg-elevated border border-st-border rounded-lg text-sm text-st-text-primary placeholder:text-st-text-muted focus:outline-none focus:border-st-accent/50"
              />
            </div>
            <div className="flex justify-end gap-2 mt-6">
              <Button variant="ghost" size="sm" onClick={() => { setRenameTarget(null); setRenameValue(""); }}>Cancel</Button>
              <Button variant="primary" size="sm" onClick={handleRename} disabled={!renameValue.trim()}>Rename</Button>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
