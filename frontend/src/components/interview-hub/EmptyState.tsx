"use client";

import React from "react";
import { Button } from "@/components/ui/Button";
import { Inbox } from "lucide-react";

interface EmptyStateProps {
  icon?: React.ElementType;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ icon: Icon = Inbox, title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="w-16 h-16 rounded-2xl bg-st-bg-elevated flex items-center justify-center mb-4">
        <Icon className="w-8 h-8 text-st-text-muted" />
      </div>
      <h3 className="text-lg font-semibold text-st-text-primary mb-1">{title}</h3>
      {description && <p className="text-sm text-st-text-muted max-w-sm mb-4">{description}</p>}
      {actionLabel && onAction && (
        <Button variant="primary" size="sm" onClick={onAction}>{actionLabel}</Button>
      )}
    </div>
  );
}
