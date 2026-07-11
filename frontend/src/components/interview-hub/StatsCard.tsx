"use client";

import React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatsCardProps {
  icon: React.ElementType;
  label: string;
  value: string | number;
  trend?: { value: number; isUp: boolean };
  color?: string;
  bg?: string;
  className?: string;
  onClick?: () => void;
}

export function StatsCard({ icon: Icon, label, value, trend, color = "text-st-accent", bg = "bg-st-accent/10", className, onClick }: StatsCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn("rounded-xl border border-st-border bg-gradient-to-b from-st-bg-card to-st-bg-elevated/80 p-4 hover:border-st-border-light transition-all duration-200", onClick && "cursor-pointer", className)}
      onClick={onClick}
    >
      <div className="flex items-center gap-3">
        <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", bg)}>
          <Icon className={cn("w-5 h-5", color)} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs font-medium text-st-text-muted">{label}</p>
          <div className="flex items-baseline gap-2">
            <h3 className="text-2xl font-bold text-st-text-primary tracking-tight">{value}</h3>
            {trend && (
              <span className={cn("text-xs font-medium flex items-center gap-0.5", trend.isUp ? "text-st-success" : "text-st-danger")}>
                {trend.isUp ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                {trend.value}%
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
