"use client";

import React, { useState, useCallback, useEffect, useRef } from "react";
import Image from "next/image";
import {
  X, ZoomIn, ZoomOut, RotateCw, Maximize2, Minimize2,
  Download, Share2, Loader2,
  FileX
} from "lucide-react";

interface ImageViewerProps {
  src: string;
  filename: string;
  onClose: () => void;
}

const SUPPORTED_FORMATS = ["jpg", "jpeg", "png", "gif", "svg", "webp", "bmp", "ico"];

const ZOOM_LEVELS = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 2, 3, 4, 5];

export function ImageViewer({ src, filename, onClose }: ImageViewerProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [naturalSize, setNaturalSize] = useState({ w: 0, h: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const currentZoomIndex = ZOOM_LEVELS.reduce((prev, curr, idx) =>
    Math.abs(curr - zoom) < Math.abs(ZOOM_LEVELS[prev] - zoom) ? idx : prev, 0
  );

  const zoomIn = useCallback(() => {
    const next = Math.min(currentZoomIndex + 1, ZOOM_LEVELS.length - 1);
    setZoom(ZOOM_LEVELS[next]);
  }, [currentZoomIndex]);

  const zoomOut = useCallback(() => {
    const prev = Math.max(currentZoomIndex - 1, 0);
    setZoom(ZOOM_LEVELS[prev]);
  }, [currentZoomIndex]);

  const fitToScreen = () => {
    if (!imgRef.current || !containerRef.current) return;
    const container = containerRef.current.getBoundingClientRect();
    const img = imgRef.current;
    const wRatio = (container.width - 40) / img.naturalWidth;
    const hRatio = (container.height - 40) / img.naturalHeight;
    setZoom(Math.min(wRatio, hRatio, 1));
  };

  const rotate = useCallback(() => setRotation((r) => (r + 90) % 360), []);

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const handleDownload = async () => {
    try {
      const res = await fetch(src);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      window.open(src, "_blank");
    }
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        const res = await fetch(src);
        const blob = await res.blob();
        const file = new File([blob], filename, { type: blob.type });
        await navigator.share({ files: [file], title: filename });
      } catch { /* user cancelled */ }
    }
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.key === "Escape") onClose();
    if (e.key === "+" || e.key === "=") zoomIn();
    if (e.key === "-") zoomOut();
    if (e.key === "r") rotate();
  }, [zoomIn, zoomOut, rotate, onClose]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const isSupported = SUPPORTED_FORMATS.includes(ext);

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col" ref={containerRef}>
      {/* Toolbar */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
          <span className="text-sm text-white font-medium truncate max-w-[300px]">{filename}</span>
          {naturalSize.w > 0 && (
            <span className="text-xs text-white/50 hidden sm:inline">
              {naturalSize.w} x {naturalSize.h}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <div className="flex items-center gap-0.5 mr-2 bg-white/10 rounded-lg p-0.5">
            <button onClick={zoomOut} disabled={zoom <= ZOOM_LEVELS[0]}
              className="p-1.5 rounded-md hover:bg-white/10 transition-colors disabled:opacity-30">
              <ZoomOut className="w-4 h-4 text-white" />
            </button>
            <span className="text-xs text-white/80 w-12 text-center font-mono tabular-nums">
              {Math.round(zoom * 100)}%
            </span>
            <button onClick={zoomIn} disabled={zoom >= ZOOM_LEVELS[ZOOM_LEVELS.length - 1]}
              className="p-1.5 rounded-md hover:bg-white/10 transition-colors disabled:opacity-30">
              <ZoomIn className="w-4 h-4 text-white" />
            </button>
          </div>
          <button onClick={fitToScreen}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-white/70 hover:text-white">
            <Maximize2 className="w-4 h-4" />
          </button>
          <button onClick={rotate}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-white/70 hover:text-white">
            <RotateCw className="w-4 h-4" />
          </button>
          <button onClick={toggleFullscreen}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-white/70 hover:text-white">
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
          <button onClick={handleDownload}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-white/70 hover:text-white">
            <Download className="w-4 h-4" />
          </button>
          {typeof navigator !== "undefined" && typeof navigator.share === "function" && (
            <button onClick={handleShare}
              className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-white/70 hover:text-white">
              <Share2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center overflow-hidden p-4 relative">
        {loading && (
          <div className="flex items-center gap-3 text-white/60">
            <Loader2 className="w-5 h-5 animate-spin" />
            <span className="text-sm">Loading image...</span>
          </div>
        )}
        {error && (
          <div className="text-center">
            <FileX className="w-12 h-12 text-red-400 mx-auto mb-3" />
            <p className="text-white/70 text-sm">{error}</p>
          </div>
        )}
        <Image
          src={src}
          alt={filename}
          fill
          unoptimized
          sizes="100vw"
          onLoad={(e) => {
            setLoading(false);
            setError(null);
            const img = e.target as HTMLImageElement;
            setNaturalSize({ w: img.naturalWidth, h: img.naturalHeight });
            imgRef.current = img;
          }}
          onError={() => {
            setLoading(false);
            if (!isSupported) {
              setError(`Unsupported image format: .${ext}. Try downloading the file instead.`);
            } else {
              setError("Failed to load image. The file may be corrupted or inaccessible.");
            }
          }}
          className="object-contain transition-transform duration-200"
          style={{
            transform: `scale(${zoom}) rotate(${rotation}deg)`,
            display: loading || error ? "none" : "block",
          }}
          draggable={false}
        />
      </div>
    </div>
  );
}
