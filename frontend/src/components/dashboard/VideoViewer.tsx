"use client";

import React, { useState, useRef, useCallback, useEffect } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  X, Play, Pause, Maximize2, Minimize2, Volume2, VolumeX,
  Download, Loader2, FileX, SkipBack, SkipForward,
  PictureInPicture2, AlertTriangle
} from "lucide-react";

interface VideoViewerProps {
  src: string;
  filename: string;
  mimeType?: string;
  onClose: () => void;
}

const SUPPORTED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg", "video/quicktime", "video/x-msvideo"];
const SUPPORTED_EXTS = ["mp4", "webm", "ogg", "mov", "avi"];

export function VideoViewer({ src, filename, mimeType, onClose }: VideoViewerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [muted, setMuted] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showControls, setShowControls] = useState(true);
  const [showSpeedMenu, setShowSpeedMenu] = useState(false);
  const controlsTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const canPlay = mimeType ? SUPPORTED_VIDEO_TYPES.includes(mimeType) : SUPPORTED_EXTS.includes(ext);

  const formatTime = (s: number) => {
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = Math.floor(s % 60);
    if (h > 0) return `${h}:${m.toString().padStart(2, "0")}:${sec.toString().padStart(2, "0")}`;
    return `${m}:${sec.toString().padStart(2, "0")}`;
  };

  const togglePlay = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().catch(() => {});
      setPlaying(true);
    } else {
      videoRef.current.pause();
      setPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (videoRef.current) {
      videoRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = parseFloat(e.target.value);
    setVolume(v);
    setMuted(v === 0);
    if (videoRef.current) videoRef.current.volume = v;
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(!muted);
    }
  };

  const changeSpeed = (rate: number) => {
    setPlaybackRate(rate);
    setShowSpeedMenu(false);
    if (videoRef.current) videoRef.current.playbackRate = rate;
  };

  const toggleFullscreen = async () => {
    if (!document.fullscreenElement) {
      await containerRef.current?.requestFullscreen();
      setIsFullscreen(true);
    } else {
      await document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  const togglePiP = async () => {
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
      } else if (videoRef.current) {
        await videoRef.current.requestPictureInPicture();
      }
    } catch { /* PiP not supported */ }
  };

  const skip = (seconds: number) => {
    if (videoRef.current) {
      videoRef.current.currentTime = Math.max(0, Math.min(videoRef.current.currentTime + seconds, duration));
    }
  };

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = src;
    a.download = filename;
    a.click();
  };

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (e.target instanceof HTMLInputElement) return;
    switch (e.key) {
      case "Escape": if (!document.fullscreenElement) onClose(); break;
      case " ": togglePlay(); e.preventDefault(); break;
      case "ArrowLeft": skip(-5); break;
      case "ArrowRight": skip(5); break;
      case "f": toggleFullscreen(); break;
      case "m": toggleMute(); break;
    }
  }, [togglePlay, toggleFullscreen, toggleMute, onClose]);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  const showControlsTemporarily = () => {
    setShowControls(true);
    if (controlsTimeout.current) clearTimeout(controlsTimeout.current);
    if (playing) {
      controlsTimeout.current = setTimeout(() => setShowControls(false), 3000);
    }
  };

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

  if (error) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center">
        <div className="text-center">
          <FileX className="w-12 h-12 text-red-400 mx-auto mb-3" />
          <p className="text-white/70 text-sm mb-4">{error}</p>
          <Button variant="ghost" size="sm" onClick={onClose} className="text-white/50">
            <X className="w-4 h-4 mr-1" />Close
          </Button>
        </div>
      </div>
    );
  }

  if (!canPlay) {
    return (
      <div className="fixed inset-0 z-[9999] bg-black/90 flex items-center justify-center">
        <div className="text-center max-w-md">
          <AlertTriangle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
          <p className="text-white font-medium mb-1">Video format not supported</p>
          <p className="text-white/50 text-sm mb-4">
            .{ext} files cannot be played in the browser. You can download the file instead.
          </p>
          <div className="flex items-center justify-center gap-2">
            <Button variant="primary" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-1" />Download
            </Button>
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="w-4 h-4 mr-1" />Close
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col" ref={containerRef}>
      {/* Header */}
      <div className={`flex items-center justify-between px-4 py-2 bg-gradient-to-b from-black/80 to-transparent shrink-0 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onMouseEnter={showControlsTemporarily}>
        <div className="flex items-center gap-3">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-5 h-5 text-white" />
          </button>
          <span className="text-sm text-white font-medium truncate max-w-[300px]">{filename}</span>
        </div>
        <div className="flex items-center gap-1">
          {document.pictureInPictureEnabled && (
            <button onClick={togglePiP}
              className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-white/70 hover:text-white">
              <PictureInPicture2 className="w-4 h-4" />
            </button>
          )}
          <button onClick={handleDownload}
            className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-white/70 hover:text-white">
            <Download className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Video */}
      <div className="flex-1 flex items-center justify-center relative"
        onMouseMove={showControlsTemporarily}
        onMouseEnter={showControlsTemporarily}>
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-white/50" />
          </div>
        )}
        <video
          ref={videoRef}
          src={src}
          className="max-w-full max-h-full"
          onClick={togglePlay}
          onLoadedMetadata={() => {
            if (videoRef.current) {
              setDuration(videoRef.current.duration);
              setLoading(false);
              videoRef.current.play().catch(() => {});
              setPlaying(true);
            }
          }}
          onTimeUpdate={() => {
            if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
          }}
          onEnded={() => setPlaying(false)}
          onError={() => {
            setLoading(false);
            setError("Failed to load video. The file may be corrupted or the format is not supported.");
          }}
          onWaiting={() => setLoading(true)}
          onCanPlay={() => setLoading(false)}
        />
        {!playing && !loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30 cursor-pointer" onClick={togglePlay}>
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center hover:bg-white/30 transition-colors backdrop-blur-sm">
              <Play className="w-8 h-8 text-white ml-1" />
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className={`px-4 py-3 bg-gradient-to-t from-black/80 to-transparent shrink-0 transition-opacity duration-300 ${showControls ? "opacity-100" : "opacity-0 pointer-events-none"}`}
        onMouseEnter={showControlsTemporarily}>
        {/* Progress bar */}
        <div className="flex items-center gap-3 mb-2">
          <span className="text-xs text-white/60 font-mono tabular-nums w-12 text-right">{formatTime(currentTime)}</span>
          <input type="range" min={0} max={duration || 0} step={0.1} value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1 rounded-full appearance-none bg-white/20 cursor-pointer
              [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3
              [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white"
            style={{ background: `linear-gradient(to right, #fff ${progress}%, rgba(255,255,255,0.2) ${progress}%)` }} />
          <span className="text-xs text-white/60 font-mono tabular-nums w-12">{formatTime(duration)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1">
            <button onClick={() => skip(-10)}
              className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-white/70 hover:text-white">
              <SkipBack className="w-4 h-4" />
            </button>
            <button onClick={togglePlay}
              className="p-2 rounded-full hover:bg-white/10 transition-colors">
              {playing ? <Pause className="w-5 h-5 text-white" /> : <Play className="w-5 h-5 text-white" />}
            </button>
            <button onClick={() => skip(10)}
              className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-white/70 hover:text-white">
              <SkipForward className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              <button onClick={toggleMute}
                className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-white/70 hover:text-white">
                {muted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
              <input type="range" min={0} max={1} step={0.05} value={muted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-20 h-1 rounded-full appearance-none bg-white/20 cursor-pointer
                  [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-2.5 [&::-webkit-slider-thumb]:h-2.5
                  [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-white" />
            </div>

            <div className="relative">
              <button onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="px-2 py-1 rounded-md hover:bg-white/10 transition-colors text-xs text-white/70 hover:text-white font-mono">
                {playbackRate}x
              </button>
              {showSpeedMenu && (
                <>
                  <div className="fixed inset-0 z-10" onClick={() => setShowSpeedMenu(false)} />
                  <div className="absolute bottom-full right-0 mb-1 z-20 bg-[#1a1a2e] border border-white/10 rounded-lg p-1 shadow-xl">
                    {[0.25, 0.5, 0.75, 1, 1.25, 1.5, 2].map((rate) => (
                      <button key={rate} onClick={() => changeSpeed(rate)}
                        className={`block w-full text-left px-3 py-1.5 rounded text-xs hover:bg-white/10 transition-colors ${playbackRate === rate ? "text-white font-medium" : "text-white/60"}`}>
                        {rate}x
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            <button onClick={toggleFullscreen}
              className="p-1.5 rounded-md hover:bg-white/10 transition-colors text-white/70 hover:text-white">
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
