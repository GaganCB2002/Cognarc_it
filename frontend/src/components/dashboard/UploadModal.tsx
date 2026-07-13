"use client";

import React, { useState, useRef } from "react";
import Image from "next/image";
import {
  X, Upload, FileText, Video as VideoIcon,
  RefreshCw, Trash2, CheckCircle, AlertTriangle, HelpCircle, Loader2
} from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import api from "@/lib/api";
import toast from "react-hot-toast";

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUploadSuccess: () => void;
}

interface UploadQueueItem {
  id: string;
  file: File;
  progress: number;
  speed: string;
  status: "pending" | "uploading" | "success" | "error" | "cancelled";
  errorMsg?: string;
  previewUrl?: string;
}

export function UploadModal({ isOpen, onClose, onUploadSuccess }: UploadModalProps) {
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const allPreviewUrls = useRef<Set<string>>(new Set());

  // Revoke all preview URLs on unmount
  React.useEffect(() => {
    const urls = allPreviewUrls.current;
    return () => { urls.forEach(u => URL.revokeObjectURL(u)); };
  }, []);

  if (!isOpen) return null;

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addFilesToQueue(Array.from(e.dataTransfer.files));
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addFilesToQueue(Array.from(e.target.files));
    }
  };

  const addFilesToQueue = (newFiles: File[]) => {
    const maxSize = 100 * 1024 * 1024; // 100MB
    const items = newFiles
      .filter(file => {
        if (file.size > maxSize) { toast.error(`${file.name} exceeds 100MB limit`); return false; }
        return true;
      })
      .map(file => {
        const url = URL.createObjectURL(file);
        allPreviewUrls.current.add(url);
        return {
          id: Math.random().toString(36).substr(2, 9),
          file,
          progress: 0,
          speed: "0 KB/s",
          status: "pending" as const,
          previewUrl: url,
        };
      });
    setQueue(prev => [...prev, ...items]);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removeFile = (id: string) => {
    setQueue(prev => {
      const item = prev.find(f => f.id === id);
      if (item?.previewUrl) { URL.revokeObjectURL(item.previewUrl); allPreviewUrls.current.delete(item.previewUrl); }
      return prev.filter(f => f.id !== id);
    });
  };

  const handleClose = () => {
    allPreviewUrls.current.forEach(u => URL.revokeObjectURL(u));
    allPreviewUrls.current.clear();
    onClose();
  };

  const cancelUpload = (id: string) => {
    setQueue(prev =>
      prev.map(item =>
        item.id === id ? { ...item, status: "cancelled", progress: 0, speed: "0 KB/s" } : item
      )
    );
  };

  const startUpload = async (item: UploadQueueItem) => {
    const formData = new FormData();
    formData.append("file", item.file);

    setQueue(prev =>
      prev.map(q => q.id === item.id ? { ...q, status: "uploading", errorMsg: undefined } : q)
    );

    try {
      await api.post('/upload', formData);
      setQueue(prev =>
        prev.map(q => q.id === item.id ? { ...q, status: "success", progress: 100 } : q)
      );
      onUploadSuccess();
    } catch (err: unknown) {
      const errorMsg = err instanceof Error ? err.message : "Upload failed";
      setQueue(prev =>
        prev.map(q => q.id === item.id ? { ...q, status: "error", errorMsg } : q)
      );
    }
  };

  const uploadAll = () => {
    queue.forEach(item => {
      if (item.status === "pending" || item.status === "cancelled" || item.status === "error") {
        startUpload(item);
      }
    });
  };

  const retryUpload = (id: string) => {
    const item = queue.find(q => q.id === id);
    if (item) {
      startUpload(item);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return "0 B";
    const k = 1024;
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const renderPreview = (item: UploadQueueItem) => {
    const { file, previewUrl } = item;
    if (!previewUrl) return null;

    if (file.type.startsWith("image/")) {
      return (
        <div className="relative w-10 h-10 rounded-lg overflow-hidden bg-st-bg-elevated flex items-center justify-center">
          <Image src={previewUrl} alt={file.name} fill unoptimized className="object-cover" />
        </div>
      );
    }

    if (file.type.startsWith("video/")) {
      return (
        <div className="relative w-10 h-10 rounded-lg bg-st-bg-elevated flex items-center justify-center">
          <VideoIcon className="w-5 h-5 text-purple-400" />
        </div>
      );
    }

    if (file.type === "application/pdf") {
      return (
        <div className="relative w-10 h-10 rounded-lg bg-st-bg-elevated flex items-center justify-center">
          <FileText className="w-5 h-5 text-red-400" />
        </div>
      );
    }

    return (
      <div className="relative w-10 h-10 rounded-lg bg-st-bg-elevated flex items-center justify-center">
        <HelpCircle className="w-5 h-5 text-st-text-muted" />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
      <Card className="w-full max-w-2xl flex flex-col max-h-[85vh] overflow-hidden shadow-2xl shadow-black/40 border-st-border/80">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-st-border/60">
          <div>
            <h2 className="text-lg font-semibold text-st-text-primary tracking-tight">Upload Files</h2>
            <p className="text-xs text-st-text-muted mt-0.5">Files are organized automatically in storage</p>
          </div>
          <button onClick={handleClose} className="p-1.5 rounded-lg hover:bg-st-bg-elevated transition-colors">
            <X className="w-4 h-4 text-st-text-muted hover:text-st-text-primary transition-colors" />
          </button>
        </div>

        {/* Drop Zone */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center gap-3 ${
              dragActive 
                ? "border-st-accent/40 bg-st-accent/[0.04]" 
                : "border-st-border hover:border-st-border-light bg-st-bg-card/30 hover:bg-st-bg-elevated/30"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInput}
              multiple
              accept="image/*,video/*,application/pdf,application/zip,application/vnd.openxmlformats-officedocument.*,application/msword,application/vnd.ms-excel,text/*"
              className="hidden"
            />
            <div className={`p-3 rounded-full transition-colors ${dragActive ? 'bg-st-accent/10 text-st-accent' : 'bg-st-bg-elevated text-st-text-muted'}`}>
              <Upload className="w-6 h-6" />
            </div>
            <div>
              <p className="font-medium text-sm text-st-text-secondary">
                {dragActive ? 'Drop files here' : 'Drag & drop files here, or '}
                <span className="text-st-accent hover:text-st-accent-hover transition-colors underline underline-offset-2">browse</span>
              </p>
              <p className="text-xs text-st-text-muted/60 mt-1">Supports images, videos, PDFs, zip, Excel, Word up to 100MB</p>
            </div>
          </div>

          {/* Queue List */}
          {queue.length > 0 && (
            <div className="flex flex-col gap-2 mt-1">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-semibold text-st-text-muted uppercase tracking-wider">Upload Queue ({queue.length})</span>
                <button onClick={() => setQueue([])} className="text-[10px] text-st-text-muted hover:text-st-danger transition-colors">Clear</button>
              </div>

              <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto pr-1 scrollbar-thin">
                {queue.map(item => (
                  <div key={item.id} className="p-3 bg-st-bg-elevated/40 border border-st-border/60 rounded-xl flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {renderPreview(item)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-medium text-st-text-primary truncate">{item.file.name}</p>
                          <span className="text-[10px] text-st-text-muted shrink-0">{formatBytes(item.file.size)}</span>
                        </div>

                        <div className="mt-2 flex items-center gap-2">
                          <div className="w-full bg-st-bg-elevated rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 rounded-full ${
                                item.status === "success" ? "bg-st-success" :
                                item.status === "error" ? "bg-st-danger" :
                                item.status === "cancelled" ? "bg-st-text-muted" : "bg-st-accent"
                              }`}
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-st-text-muted shrink-0 w-8 text-right tabular-nums">{item.progress}%</span>
                        </div>

                        <div className="flex justify-between items-center mt-1">
                          {item.status === "uploading" && (
                            <span className="text-[10px] text-st-text-muted flex items-center gap-1">
                              <Loader2 className="w-2.5 h-2.5 animate-spin text-st-accent" /> {item.speed}
                            </span>
                          )}
                          {item.status === "success" && (
                            <span className="text-[10px] text-st-success flex items-center gap-1">
                              <CheckCircle className="w-2.5 h-2.5" /> Uploaded successfully
                            </span>
                          )}
                          {item.status === "error" && (
                            <span className="text-[10px] text-st-danger flex items-center gap-1">
                              <AlertTriangle className="w-2.5 h-2.5" /> {item.errorMsg || "Upload failed"}
                            </span>
                          )}
                          {item.status === "cancelled" && (
                            <span className="text-[10px] text-st-text-muted">Cancelled</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      {item.status === "uploading" && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0"
                          onClick={() => cancelUpload(item.id)}
                        >
                          <X className="w-3.5 h-3.5 text-st-text-muted" />
                        </Button>
                      )}
                      {(item.status === "pending" || item.status === "cancelled" || item.status === "error") && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-7 w-7 p-0"
                          onClick={() => retryUpload(item.id)}
                        >
                          <RefreshCw className="w-3.5 h-3.5 text-st-accent" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-7 w-7 p-0"
                        onClick={() => removeFile(item.id)}
                      >
                        <Trash2 className="w-3.5 h-3.5 text-st-text-muted hover:text-st-danger transition-colors" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-st-border/60 bg-st-bg-card/30 flex justify-end gap-3">
          <Button variant="outline" size="sm" onClick={handleClose}>
            Close
          </Button>
          <Button 
            size="sm"
            onClick={uploadAll}
            disabled={queue.length === 0 || queue.every(f => f.status === "success" || f.status === "uploading")}
          >
            Upload Queue
          </Button>
        </div>
      </Card>
    </div>
  );
}
