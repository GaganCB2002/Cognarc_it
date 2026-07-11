"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AlertTriangle, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
  itemName?: string;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
  variant = "danger",
  isLoading = false,
  itemName,
}: ConfirmDialogProps) {
  const iconColors = {
    danger: "bg-st-danger/10 text-st-danger",
    warning: "bg-st-warning/10 text-st-warning",
    info: "bg-st-info/10 text-st-info",
  };

  const buttonVariant = variant === "danger" ? "danger" as const : "primary" as const;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15 }}
            onClick={(e) => e.stopPropagation()}
          >
            <Card className="w-full max-w-sm p-6 mx-auto">
              <div className="flex items-start gap-4">
                <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center shrink-0", iconColors[variant])}>
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-st-text-primary">{title}</h3>
                  <p className="text-xs text-st-text-secondary mt-1">{message}</p>
                  {itemName && (
                    <p className="text-xs font-medium text-st-text-primary mt-2 truncate bg-st-bg-elevated px-2 py-1 rounded">
                      &ldquo;{itemName}&rdquo;
                    </p>
                  )}
                </div>
                <button onClick={onClose} className="shrink-0 text-st-text-muted hover:text-st-text-primary transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="flex items-center justify-end gap-2 mt-6">
                <Button variant="ghost" size="sm" onClick={onClose} disabled={isLoading}>
                  {cancelLabel}
                </Button>
                <Button variant={buttonVariant} size="sm" onClick={onConfirm} disabled={isLoading}>
                  {isLoading ? (
                    <>Deleting...</>
                  ) : (
                    <><Trash2 className="w-3.5 h-3.5 mr-1" />{confirmLabel}</>
                  )}
                </Button>
              </div>
            </Card>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
