import React, { useState, useRef, useEffect } from "react";
import { 
  X, Upload, FileText, Image as ImageIcon, Video as VideoIcon, 
  RefreshCw, Play, Trash2, CheckCircle, AlertTriangle, HelpCircle, Loader2
} from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import api from "@/lib/api";

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
}

export function UploadModal({ isOpen, onClose, onUploadSuccess }: UploadModalProps) {
  const [queue, setQueue] = useState<UploadQueueItem[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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
    const items = newFiles.map(file => ({
      id: Math.random().toString(36).substr(2, 9),
      file,
      progress: 0,
      speed: "0 KB/s",
      status: "pending" as const,
    }));
    setQueue(prev => [...prev, ...items]);
  };

  const   removeFile = (id: string) => {
    setQueue(prev => prev.filter(f => f.id !== id));
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
    } catch (err: any) {
      const errorMsg = err.message || "Upload failed";
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
    const { file } = item;
    const url = URL.createObjectURL(file);

    if (file.type.startsWith("image/")) {
      return (
        <div className="relative w-12 h-12 rounded overflow-hidden bg-zinc-800 flex items-center justify-center">
          <img src={url} alt={file.name} className="object-cover w-full h-full" />
        </div>
      );
    }

    if (file.type.startsWith("video/")) {
      return (
        <div className="relative w-12 h-12 rounded overflow-hidden bg-zinc-800 flex items-center justify-center">
          <VideoIcon className="w-6 h-6 text-purple-400" />
        </div>
      );
    }

    if (file.type === "application/pdf") {
      return (
        <div className="relative w-12 h-12 rounded bg-zinc-800 flex items-center justify-center">
          <FileText className="w-6 h-6 text-red-400" />
        </div>
      );
    }

    return (
      <div className="relative w-12 h-12 rounded bg-zinc-800 flex items-center justify-center">
        <HelpCircle className="w-6 h-6 text-zinc-400" />
      </div>
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <Card className="w-full max-w-2xl bg-zinc-950 border-zinc-800 text-white rounded-xl shadow-2xl flex flex-col max-h-[85vh] overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-zinc-800/80">
          <div>
            <h2 className="text-xl font-semibold tracking-tight">Upload Files to Google Drive</h2>
            <p className="text-xs text-zinc-400 mt-1">Files are organized automatically inside Google Drive folders</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-zinc-800 rounded transition">
            <X className="w-5 h-5 text-zinc-400 hover:text-white" />
          </button>
        </div>

        {/* Drop Zone */}
        <div className="p-5 overflow-y-auto flex-1 flex flex-col gap-4">
          <div
            onDragEnter={handleDrag}
            onDragOver={handleDrag}
            onDragLeave={handleDrag}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition flex flex-col items-center justify-center gap-3 ${
              dragActive 
                ? "border-primary bg-primary/10" 
                : "border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-900/60"
            }`}
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileInput}
              multiple
              className="hidden"
            />
            <div className="p-3 bg-zinc-800/60 rounded-full text-zinc-400 border border-zinc-700/50">
              <Upload className="w-7 h-7" />
            </div>
            <div>
              <p className="font-medium text-sm text-zinc-200">Drag & Drop files here, or <span className="text-blue-400 underline">browse</span></p>
              <p className="text-xs text-zinc-500 mt-1.5">Supports images, videos, PDFs, zip, Excel, Word up to 100MB</p>
            </div>
          </div>

          {/* Queue List */}
          {queue.length > 0 && (
            <div className="flex flex-col gap-2 mt-2">
              <div className="flex justify-between items-center px-1">
                <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Upload Queue ({queue.length})</span>
                <button onClick={() => setQueue([])} className="text-xs text-zinc-500 hover:text-red-400 transition">Clear Queue</button>
              </div>

              <div className="flex flex-col gap-2 max-h-[30vh] overflow-y-auto pr-1">
                {queue.map(item => (
                  <div key={item.id} className="p-3 bg-zinc-900/80 border border-zinc-800/60 rounded-lg flex items-center justify-between gap-4">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      {renderPreview(item)}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <p className="text-sm font-medium text-zinc-200 truncate">{item.file.name}</p>
                          <span className="text-[10px] text-zinc-500 shrink-0">{formatBytes(item.file.size)}</span>
                        </div>

                        {/* Progress Bar */}
                        <div className="mt-2 flex items-center gap-2">
                          <div className="w-full bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                            <div 
                              className={`h-full transition-all duration-300 ${
                                item.status === "success" ? "bg-emerald-500" :
                                item.status === "error" ? "bg-rose-500" :
                                item.status === "cancelled" ? "bg-zinc-600" : "bg-blue-500"
                              }`}
                              style={{ width: `${item.progress}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-semibold text-zinc-400 shrink-0 w-8 text-right">{item.progress}%</span>
                        </div>

                        {/* Speed & Error Details */}
                        <div className="flex justify-between items-center mt-1">
                          {item.status === "uploading" && (
                            <span className="text-[10px] text-zinc-400 flex items-center gap-1">
                              <Loader2 className="w-3 h-3 animate-spin text-blue-400" /> {item.speed}
                            </span>
                          )}
                          {item.status === "success" && (
                            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
                              <CheckCircle className="w-3 h-3" /> Uploaded to Drive
                            </span>
                          )}
                          {item.status === "error" && (
                            <span className="text-[10px] text-rose-400 flex items-center gap-1">
                              <AlertTriangle className="w-3 h-3" /> {item.errorMsg || "Upload failed"}
                            </span>
                          )}
                          {item.status === "cancelled" && (
                            <span className="text-[10px] text-zinc-500">Cancelled</span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1">
                      {item.status === "uploading" && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-zinc-800"
                          onClick={() => cancelUpload(item.id)}
                        >
                          <X className="w-4 h-4 text-zinc-400 hover:text-white" />
                        </Button>
                      )}
                      {(item.status === "pending" || item.status === "cancelled" || item.status === "error") && (
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 hover:bg-zinc-800"
                          onClick={() => retryUpload(item.id)}
                        >
                          <RefreshCw className="w-4 h-4 text-blue-400" />
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-8 w-8 p-0 hover:bg-zinc-800"
                        onClick={() => removeFile(item.id)}
                      >
                        <Trash2 className="w-4 h-4 text-zinc-500 hover:text-red-400" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/20 flex justify-end gap-3">
          <Button variant="outline" className="border-zinc-800 hover:bg-zinc-900" onClick={onClose}>
            Close
          </Button>
          <Button 
            className="bg-blue-600 hover:bg-blue-700 text-white" 
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
