"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { SearchInput } from "@/components/interview-hub/SearchInput";
import { TopicChip } from "@/components/interview-hub/TopicChip";
import { EmptyState } from "@/components/interview-hub/EmptyState";
import { ListSkeleton } from "@/components/interview-hub/LoadingSkeleton";
import api from "@/lib/api";
import {
  Clock, HelpCircle, Code2, Users, Trash2,
  Calendar, ChevronRight, Search,
} from "lucide-react";

interface HistoryItem {
  id: string;
  title: string;
  type: string;
  timestamp: string;
  score?: number;
}

const typeFilters = ["All", "Questions", "MCQs", "Coding", "Interviews"];

const datePresets = ["All Time", "Today", "This Week", "This Month", "Last 3 Months"];

const typeIcons: Record<string, React.ElementType> = {
  Questions: HelpCircle,
  MCQs: Clock,
  Coding: Code2,
  Interviews: Users,
};

export default function HistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [selectedDateRange, setSelectedDateRange] = useState("All Time");
  const [showFilters, setShowFilters] = useState(false);
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (searchQuery) params.set("q", searchQuery);
      params.set("type", selectedType === "All" ? "all" : selectedType.toLowerCase());
      if (selectedDateRange !== "All Time") params.set("dateRange", selectedDateRange.toLowerCase().replace(/\s+/g, ""));
      const data = await api.get<HistoryItem[]>(`/interview/search?${params.toString()}`);
      setItems(data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedType, selectedDateRange]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  const handleClearHistory = async () => {
    try {
      await api.delete("/interview/conversations");
      setItems([]);
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-xl font-bold text-st-text-primary tracking-tight">Activity History</h1>
          <p className="text-sm text-st-text-secondary">Track your interview preparation journey</p>
        </div>
        {items.length > 0 && (
          <Button variant="ghost" size="sm" onClick={handleClearHistory} className="text-st-danger hover:bg-st-danger-bg">
            <Trash2 className="w-4 h-4 mr-1.5" /> Clear History
          </Button>
        )}
      </motion.div>

      <div className="flex flex-col sm:flex-row gap-3">
        <SearchInput
          value={searchQuery}
          onChange={(v) => setSearchQuery(v)}
          placeholder="Search history..."
          className="flex-1"
          onFilterClick={() => setShowFilters(!showFilters)}
        />
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-wrap gap-2">
        {typeFilters.map(type => (
          <TopicChip key={type} label={type} selected={selectedType === type} onClick={() => setSelectedType(type)} />
        ))}
      </motion.div>

      <motion.div
        initial={{ height: 0, opacity: 0 }}
        animate={{ height: showFilters ? "auto" : 0, opacity: showFilters ? 1 : 0 }}
        className="overflow-hidden"
      >
        <div className="flex flex-wrap gap-2 py-2">
          <span className="text-xs text-st-text-muted flex items-center gap-1"><Calendar className="w-3 h-3" /> Date:</span>
          {datePresets.map(d => (
            <TopicChip key={d} label={d} selected={selectedDateRange === d} onClick={() => setSelectedDateRange(d)} />
          ))}
        </div>
      </motion.div>

      {loading ? (
        <ListSkeleton count={5} />
      ) : items.length === 0 ? (
        <EmptyState icon={Search} title="No history found" description="Your activity will appear here as you practice" />
      ) : (
        <div className="space-y-1">
          {items.map((item, i) => {
            const TypeIcon = typeIcons[item.type] || Clock;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.015 }}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-st-bg-elevated/50 transition-colors"
              >
                <div className="w-8 h-8 rounded-lg bg-st-accent/10 flex items-center justify-center shrink-0">
                  <TypeIcon className="w-4 h-4 text-st-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="text-sm text-st-text-primary truncate">{item.title}</p>
                    {item.score !== undefined && (
                      <Badge variant={item.score >= 80 ? "success" : item.score >= 65 ? "warning" : "danger"} className="text-[9px] shrink-0">
                        {item.score}%
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-st-text-muted">{item.timestamp}</p>
                </div>
                <ChevronRight className="w-3.5 h-3.5 text-st-text-muted shrink-0" />
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
