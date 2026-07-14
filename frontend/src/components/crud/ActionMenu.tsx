"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  MoreHorizontal,
  Eye,
  Pencil,
  FileEdit,
  RefreshCw,
  Upload,
  Download,
  Link,
  Share2,
  Copy,
  Trash2,
  Star,
  Archive,
  FileOutput,
} from "lucide-react";

export interface ActionItem {
  id: string;
  label: string;
  icon?: React.ElementType;
  onClick: () => void;
  variant?: "default" | "danger" | "success" | "warning";
  disabled?: boolean;
  divider?: boolean;
}

interface ActionMenuProps {
  actions: ActionItem[];
  align?: "left" | "right";
  className?: string;
  buttonClassName?: string;
  iconSize?: number;
  menuWidth?: string;
  onOpenChange?: (open: boolean) => void;
}

export function ActionMenu({
  actions,
  align = "right",
  className,
  buttonClassName,
  menuWidth = "w-48",
  onOpenChange,
}: ActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    onOpenChange?.(isOpen);
  }, [isOpen, onOpenChange]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === "Escape") setIsOpen(false);
  }, []);

  return (
    <div ref={ref} className={cn("relative inline-block", className)} onKeyDown={handleKeyDown}>
      <button
        onClick={(e) => { e.stopPropagation(); setIsOpen(!isOpen); }}
        className={cn(
          "flex items-center justify-center w-8 h-8 rounded-lg text-st-text-muted hover:text-st-text-primary hover:bg-st-bg-elevated/80 transition-all duration-200",
          isOpen && "bg-st-bg-elevated text-st-text-primary",
          buttonClassName
        )}
        aria-label="Actions"
        aria-haspopup="true"
        aria-expanded={isOpen}
      >
        <MoreHorizontal className="w-4 h-4" />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -4 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -4 }}
            transition={{ duration: 0.12 }}
            className={cn(
              "absolute z-50 mt-1 bg-st-bg-card border border-st-border rounded-xl shadow-xl overflow-hidden p-1",
              align === "right" ? "right-0" : "left-0",
              menuWidth
            )}
          >
            {actions.map((action, i) => {
              const Icon = action.icon as React.ComponentType<{ className?: string; strokeWidth?: number }> | undefined;
              return (
                <React.Fragment key={action.id}>
                  {action.divider && i > 0 && (
                    <div className="mx-2 my-1 h-px bg-st-border" />
                  )}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!action.disabled) {
                        action.onClick();
                        setIsOpen(false);
                      }
                    }}
                    disabled={action.disabled}
                    className={cn(
                      "flex items-center gap-2.5 w-full px-3 py-2 text-xs font-medium rounded-lg transition-colors",
                      action.variant === "danger"
                        ? "text-st-danger hover:bg-st-danger/10"
                        : action.variant === "success"
                          ? "text-st-success hover:bg-st-success/10"
                          : action.variant === "warning"
                            ? "text-st-warning hover:bg-st-warning/10"
                            : "text-st-text-secondary hover:text-st-text-primary hover:bg-st-bg-elevated/80",
                      action.disabled && "opacity-40 cursor-not-allowed"
                    )}
                  >
                    {Icon && <Icon className="w-4 h-4 shrink-0" strokeWidth={1.5} />}
                    {action.label}
                  </button>
                </React.Fragment>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Preset action builders for common CRUD operations
export function useCrudActions(resourceId: string, resourceName: string, options: {
  onView?: () => void;
  onEdit?: () => void;
  onRename?: () => void;
  onReplace?: () => void;
  onReupload?: () => void;
  onDownload?: () => void;
  onCopyLink?: () => void;
  onShare?: () => void;
  onDuplicate?: () => void;
  onToggleFavorite?: () => void;
  onArchive?: () => void;
  onDelete?: () => void;
  onExport?: () => void;
}) {
  const actions: ActionItem[] = [];

  if (options.onView) {
    actions.push({ id: "view", label: "View", icon: Eye, onClick: options.onView });
  }
  if (options.onEdit) {
    actions.push({ id: "edit", label: "Edit", icon: Pencil, onClick: options.onEdit });
  }
  if (options.onRename) {
    actions.push({ id: "rename", label: "Rename", icon: FileEdit, onClick: options.onRename });
  }
  if (options.onReplace) {
    actions.push({ id: "replace", label: "Replace File", icon: RefreshCw, onClick: options.onReplace });
  }
  if (options.onReupload) {
    actions.push({ id: "reupload", label: "Re-upload", icon: Upload, onClick: options.onReupload });
  }
  if (options.onDownload) {
    actions.push({ id: "download", label: "Download", icon: Download, onClick: options.onDownload });
  }
  if (options.onCopyLink) {
    actions.push({ id: "copy-link", label: "Copy Link", icon: Link, onClick: options.onCopyLink });
  }
  if (options.onShare) {
    actions.push({ id: "share", label: "Share", icon: Share2, onClick: options.onShare });
  }
  if (options.onDuplicate) {
    actions.push({ id: "duplicate", label: "Duplicate", icon: Copy, onClick: options.onDuplicate });
  }
  if (options.onExport) {
    actions.push({ id: "export", label: "Export", icon: FileOutput, onClick: options.onExport, divider: true });
  }
  if (options.onToggleFavorite) {
    actions.push({
      id: "favorite", label: "Toggle Favorite", icon: Star, onClick: options.onToggleFavorite, variant: "warning",
    });
  }
  if (options.onArchive) {
    actions.push({ id: "archive", label: "Archive", icon: Archive, onClick: options.onArchive });
  }
  if (options.onDelete) {
    actions.push({
      id: "delete", label: "Delete", icon: Trash2, onClick: options.onDelete, variant: "danger", divider: true,
    });
  }

  return actions;
}
