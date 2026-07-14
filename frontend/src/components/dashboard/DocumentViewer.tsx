"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/Button";
import {
  X, FileText, Download, ExternalLink, Loader2, AlertCircle,
  FileSpreadsheet, Presentation, File, FileArchive
} from "lucide-react";

interface DocumentViewerProps {
  src: string;
  filename: string;
  mimeType: string;
  onClose: () => void;
}

const OFFICE_VIEWER_URL = "https://docs.google.com/viewer?embedded=true&url=";

const MIME_TO_ICON: Record<string, React.ElementType> = {
  "application/msword": FileText,
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": FileText,
  "application/vnd.ms-excel": FileSpreadsheet,
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": FileSpreadsheet,
  "application/vnd.ms-powerpoint": Presentation,
  "application/vnd.openxmlformats-officedocument.presentationml.presentation": Presentation,
  "text/plain": FileText,
  "text/csv": FileSpreadsheet,
  "application/json": File,
  "application/pdf": FileText,
};

const TEXT_BASED_TYPES = ["text/plain", "text/csv", "application/json"];
const OFFICE_TYPES = [
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
];

export function DocumentViewer({ src, filename, mimeType, onClose }: DocumentViewerProps) {
  const [renderError, setRenderError] = useState(false);
  const [textContent, setTextContent] = useState<string | null>(null);
  const [textLoading, setTextLoading] = useState(false);

  const Icon = (MIME_TO_ICON[mimeType] || FileArchive) as React.ComponentType<{ className?: string }>;
  const ext = filename.split(".").pop()?.toLowerCase() || "";
  const canPreview = OFFICE_TYPES.includes(mimeType) || TEXT_BASED_TYPES.includes(mimeType) || mimeType === "application/pdf";
  const isTextBased = TEXT_BASED_TYPES.includes(mimeType);
  const isOfficeDoc = OFFICE_TYPES.includes(mimeType);

  const handleDownload = () => {
    const a = document.createElement("a");
    a.href = src;
    a.download = filename;
    a.click();
  };

  const loadTextContent = async () => {
    setTextLoading(true);
    try {
      const res = await fetch(src);
      if (!res.ok) throw new Error("Failed to fetch");
      const text = await res.text();
      setTextContent(text);
    } catch {
      setRenderError(true);
    } finally {
      setTextLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[9999] bg-black/90 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2 bg-black/50 backdrop-blur-sm shrink-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-white/10 transition-colors shrink-0">
            <X className="w-5 h-5 text-white" />
          </button>
          <Icon className="w-5 h-5 text-white/70 shrink-0" />
          <span className="text-sm text-white font-medium truncate">{filename}</span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button variant="ghost" size="sm" onClick={handleDownload} className="text-white/70 hover:text-white">
            <Download className="w-4 h-4 mr-1" />Download
          </Button>
          {isOfficeDoc && (
            <Button variant="ghost" size="sm" onClick={() => window.open(src, "_blank")} className="text-white/70 hover:text-white">
              <ExternalLink className="w-4 h-4 mr-1" />Open
            </Button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex items-center justify-center overflow-hidden bg-[#1a1a2e]">
        {!canPreview && (
          <div className="text-center p-8">
            <Icon className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <h3 className="text-white font-medium mb-2">Preview not available</h3>
            <p className="text-white/50 text-sm mb-4 max-w-md">
              {ext.toUpperCase()} files cannot be previewed in the browser. Download the file to view it.
            </p>
            <Button variant="primary" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-1" />Download {filename}
            </Button>
          </div>
        )}

        {isTextBased && !textContent && !renderError && (
          <div className="text-center">
            {textLoading ? (
              <div className="flex items-center gap-2 text-white/50">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Loading document...</span>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={loadTextContent} className="text-white/70">
                <FileText className="w-4 h-4 mr-2" />View as text
              </Button>
            )}
          </div>
        )}

        {isTextBased && textContent && (
          <pre className="w-full h-full overflow-auto p-6 text-sm text-white/80 font-mono leading-relaxed whitespace-pre-wrap">
            {textContent}
          </pre>
        )}

        {isOfficeDoc && !renderError && (
          <iframe
            src={`${OFFICE_VIEWER_URL}${encodeURIComponent(src)}`}
            className="w-full h-full border-0"
            title={filename}
            onError={() => setRenderError(true)}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        )}

        {renderError && (
          <div className="text-center p-8">
            <AlertCircle className="w-12 h-12 text-yellow-400 mx-auto mb-3" />
            <h3 className="text-white font-medium mb-1">Preview failed</h3>
            <p className="text-white/50 text-sm mb-4">The document could not be rendered. Try downloading instead.</p>
            <Button variant="primary" size="sm" onClick={handleDownload}>
              <Download className="w-4 h-4 mr-1" />Download
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
