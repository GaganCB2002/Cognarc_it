"use client";

import React, { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/interview-hub/SearchInput";
import { TopicChip } from "@/components/interview-hub/TopicChip";
import { EmptyState } from "@/components/interview-hub/EmptyState";
import { CardSkeleton } from "@/components/interview-hub/LoadingSkeleton";
import api from "@/lib/api";
import { cn } from "@/lib/utils";
import {
  Bookmark, BookmarkCheck, Trash2, HelpCircle, Code2, MessageSquare, FileText, Star, Search,
} from "lucide-react";

interface SavedItem {
  id: string;
  title: string;
  type: string;
  description?: string;
  savedAt?: string;
  bookmarkedAt?: string;
}

const typeFilters = ["All", "Questions", "MCQs", "Coding", "Chats", "Notes"];

const typeIcons: Record<string, React.ElementType> = {
  Questions: HelpCircle,
  MCQs: Star,
  Coding: Code2,
  Chats: MessageSquare,
  Notes: FileText,
};

export default function SavedPage() {
  const [activeTab, setActiveTab] = useState<"saved" | "bookmarks">("saved");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState("All");
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [bookmarkedItems, setBookmarkedItems] = useState<SavedItem[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const typeParam = selectedType !== "All" ? selectedType.toLowerCase() : undefined;
      if (activeTab === "saved") {
        const params = new URLSearchParams();
        if (typeParam) params.set("itemType", typeParam);
        const data = await api.get<SavedItem[]>(`/interview/saved?${params.toString()}`);
        setSavedItems(data || []);
      } else {
        const params = new URLSearchParams();
        if (typeParam) params.set("itemType", typeParam);
        const data = await api.get<SavedItem[]>(`/interview/bookmarks?${params.toString()}`);
        setBookmarkedItems(data || []);
      }
    } catch {
      if (activeTab === "saved") setSavedItems([]);
      else setBookmarkedItems([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, selectedType]);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const items = activeTab === "saved" ? savedItems : bookmarkedItems;

  const filtered = items.filter(item => {
    const m = !searchQuery || item.title.toLowerCase().includes(searchQuery.toLowerCase()) || item.type.toLowerCase().includes(searchQuery.toLowerCase());
    const t = selectedType === "All" || item.type === selectedType;
    return m && t;
  });

  const handleRemove = async (id: string) => {
    try {
      if (activeTab === "saved") {
        await api.delete(`/interview/saved/${id}`);
        setSavedItems(prev => prev.filter(item => item.id !== id));
      } else {
        await api.post("/interview/bookmarks/toggle", { itemType: "mcq", itemId: id });
        setBookmarkedItems(prev => prev.filter(item => item.id !== id));
      }
    } catch {
      // ignore
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 pb-8">
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-xl font-bold text-st-text-primary tracking-tight">Saved Items & Bookmarks</h1>
        <p className="text-sm text-st-text-secondary">Access your saved and bookmarked content</p>
      </motion.div>

      {/* Tabs */}
      <div className="flex gap-1 p-1 rounded-xl bg-st-bg-elevated w-fit">
        <button
          onClick={() => setActiveTab("saved")}
          className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", activeTab === "saved" ? "bg-st-bg-card text-st-text-primary shadow-sm" : "text-st-text-muted hover:text-st-text-primary")}
        >
          <BookmarkCheck className="w-4 h-4 inline mr-1.5" />
          Saved Items ({savedItems.length})
        </button>
        <button
          onClick={() => setActiveTab("bookmarks")}
          className={cn("px-4 py-2 rounded-lg text-sm font-medium transition-all", activeTab === "bookmarks" ? "bg-st-bg-card text-st-text-primary shadow-sm" : "text-st-text-muted hover:text-st-text-primary")}
        >
          <Bookmark className="w-4 h-4 inline mr-1.5" />
          Bookmarks ({bookmarkedItems.length})
        </button>
      </div>

      <SearchInput
        value={searchQuery}
        onChange={(v) => setSearchQuery(v)}
        placeholder={`Search ${activeTab}...`}
      />

      <div className="flex flex-wrap gap-2">
        {typeFilters.map(type => (
          <TopicChip key={type} label={type} selected={selectedType === type} onClick={() => setSelectedType(type)} />
        ))}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {[1,2,3].map(i => <CardSkeleton key={i} />)}
        </div>
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={Search}
          title={`No ${activeTab} items found`}
          description={searchQuery ? "Try a different search term" : `You haven't ${activeTab === "saved" ? "saved" : "bookmarked"} any items yet`}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {filtered.map((item, i) => {
            const TypeIcon = typeIcons[item.type] || Star;
            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
              >
                <Card className="p-4 card-hover">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-lg bg-st-accent/10 flex items-center justify-center shrink-0">
                        <TypeIcon className="w-5 h-5 text-st-accent" />
                      </div>
                      <div className="min-w-0">
                        <h3 className="text-sm font-medium text-st-text-primary truncate">{item.title}</h3>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[9px]">{item.type}</Badge>
                          <span className="text-[10px] text-st-text-muted">{activeTab === "saved" ? item.savedAt : item.bookmarkedAt}</span>
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-1.5 rounded-lg text-st-text-muted hover:text-st-danger hover:bg-st-danger-bg transition-all shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  {item.description && (
                    <p className="text-xs text-st-text-secondary mt-2 leading-relaxed">{item.description}</p>
                  )}
                </Card>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
