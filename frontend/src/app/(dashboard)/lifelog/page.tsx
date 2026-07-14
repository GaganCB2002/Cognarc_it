"use client";

import React, { useEffect, useState, useCallback } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { api } from "@/lib/api";
import { Search, Download, Clock, MessageSquare, Activity, LogIn, FileText, Database, ChevronLeft, ChevronRight, Loader2, Copy, Check } from "lucide-react";

type LifelogEntry = {
  id: string;
  timestamp: string;
  userId: string;
  type: "TRANSACTION" | "CONVERSATION" | "TRACKING" | "FILE" | "AUTH" | "EXPORT" | "SYSTEM";
  action: string;
  summary: string;
  data: Record<string, unknown>;
};

const TYPE_ICONS: Record<string, React.ElementType> = {
  TRANSACTION: Activity,
  CONVERSATION: MessageSquare,
  TRACKING: Clock,
  FILE: FileText,
  AUTH: LogIn,
  EXPORT: Download,
  SYSTEM: Database,
};

const TYPE_COLORS: Record<string, string> = {
  TRANSACTION: "text-blue-400 bg-blue-400/10 border-blue-400/30",
  CONVERSATION: "text-emerald-400 bg-emerald-400/10 border-emerald-400/30",
  TRACKING: "text-purple-400 bg-purple-400/10 border-purple-400/30",
  FILE: "text-orange-400 bg-orange-400/10 border-orange-400/30",
  AUTH: "text-cyan-400 bg-cyan-400/10 border-cyan-400/30",
  EXPORT: "text-rose-400 bg-rose-400/10 border-rose-400/30",
  SYSTEM: "text-st-text-muted bg-st-bg-primary border-st-border",
};

export default function LifelogPage() {
  const [entries, setEntries] = useState<LifelogEntry[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(0);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [dbInfo, setDbInfo] = useState<{ dates: string[]; totalSizeBytes: number } | null>(null);
  const PAGE_SIZE = 50;

  const fetchEntries = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (typeFilter) params.set("type", typeFilter);
      params.set("limit", String(PAGE_SIZE));
      params.set("offset", String(page * PAGE_SIZE));

      const res = await api.get<{ success: boolean; entries: LifelogEntry[]; total: number }>(`/lifelog?${params}`);
      if (res.success) {
        setEntries(res.entries);
        setTotal(res.total);
      }
    } catch (err) {
      console.error("Failed to fetch lifelog:", err);
    } finally {
      setLoading(false);
    }
  }, [typeFilter, page]);

  const fetchDbInfo = useCallback(async () => {
    try {
      const res = await api.get<{ success: boolean; dates: string[]; totalSizeBytes: number }>("/lifelog/dates");
      if (res.success) setDbInfo(res);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    fetchEntries();
    fetchDbInfo();
  }, [fetchEntries, fetchDbInfo]);

  const filtered = searchQuery
    ? entries.filter(e =>
        e.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
        JSON.stringify(e.data).toLowerCase().includes(searchQuery.toLowerCase())
      )
    : entries;

  const totalPages = Math.ceil(total / PAGE_SIZE);

  const copyToClipboard = async (entry: LifelogEntry) => {
    const text = JSON.stringify(entry, null, 2);
    await navigator.clipboard.writeText(text);
    setCopiedId(entry.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-8">
      <div>
        <p className="text-[10px] font-bold tracking-widest text-st-accent uppercase mb-1">Data Archive</p>
        <h1 className="text-3xl font-bold text-st-text-primary">Lifelog</h1>
        <p className="text-sm text-st-text-muted mt-1">
          Every transaction, conversation, and event is automatically saved as JSON. This data persists forever.
        </p>
      </div>

      {/* Info Cards */}
      {dbInfo && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <Database className="w-5 h-5 text-st-accent mb-2" />
            <p className="text-xs text-st-text-muted">Total Entries</p>
            <p className="text-xl font-bold text-st-text-primary">{total.toLocaleString()}</p>
          </Card>
          <Card className="p-4">
            <Clock className="w-5 h-5 text-blue-400 mb-2" />
            <p className="text-xs text-st-text-muted">Days Recorded</p>
            <p className="text-xl font-bold text-st-text-primary">{dbInfo.dates.length}</p>
          </Card>
          <Card className="p-4">
            <FileText className="w-5 h-5 text-purple-400 mb-2" />
            <p className="text-xs text-st-text-muted">Archive Size</p>
            <p className="text-xl font-bold text-st-text-primary">{formatBytes(dbInfo.totalSizeBytes)}</p>
          </Card>
          <Card className="p-4">
            <Download className="w-5 h-5 text-emerald-400 mb-2" />
            <p className="text-xs text-st-text-muted">Lifelong Storage</p>
            <p className="text-xl font-bold text-st-text-primary">✓ Active</p>
          </Card>
        </div>
      )}

      {/* Filters */}
      <Card className="p-4">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-st-text-muted" />
            <input
              type="text"
              placeholder="Search entries..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-st-bg-primary border border-st-border rounded-lg text-sm text-st-text-primary placeholder-st-text-muted focus:outline-none focus:border-st-accent"
            />
          </div>
          <select
            value={typeFilter}
            onChange={(e) => { setTypeFilter(e.target.value); setPage(0); }}
            className="px-3 py-2 bg-st-bg-primary border border-st-border rounded-lg text-sm text-st-text-primary focus:outline-none focus:border-st-accent"
          >
            <option value="">All Types</option>
            <option value="TRANSACTION">Transactions</option>
            <option value="CONVERSATION">Conversations</option>
            <option value="TRACKING">Tracking</option>
            <option value="AUTH">Auth</option>
            <option value="FILE">Files</option>
            <option value="EXPORT">Exports</option>
            <option value="SYSTEM">System</option>
          </select>
          <span className="text-xs text-st-text-muted">
            Showing {filtered.length} of {total} entries
          </span>
        </div>
      </Card>

      {/* Entries */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-st-accent" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-st-text-muted">
          <Database className="w-16 h-16 mb-4 opacity-20" />
          <h3 className="text-xl font-bold mb-2">No Entries Found</h3>
          <p className="text-sm">Start using StudyTrack to generate lifelog entries.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((entry) => {
            const Icon = (TYPE_ICONS[entry.type] || Database) as React.ComponentType<{ className?: string }>;
            const colorClass = TYPE_COLORS[entry.type] || TYPE_COLORS.SYSTEM;
            const isExpanded = expandedId === entry.id;

            return (
              <Card
                key={entry.id}
                className="p-4 cursor-pointer hover:border-st-accent/30 transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : entry.id)}
              >
                <div className="flex items-start gap-4">
                  <div className={`p-2 rounded-lg ${colorClass} shrink-0`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider border ${colorClass}`}>
                        {entry.type}
                      </span>
                      <span className="text-xs text-st-text-muted font-mono">
                        {new Date(entry.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-st-text-primary truncate">{entry.summary}</p>
                    <p className="text-[11px] text-st-text-muted font-mono mt-0.5">{entry.action}</p>
                  </div>
                  <button
                    onClick={(e) => { e.stopPropagation(); copyToClipboard(entry); }}
                    className="p-1.5 rounded hover:bg-st-bg-primary text-st-text-muted hover:text-st-accent transition-colors shrink-0"
                    title="Copy as JSON"
                  >
                    {copiedId === entry.id ? <Check className="w-4 h-4 text-st-accent" /> : <Copy className="w-4 h-4" />}
                  </button>
                </div>

                {isExpanded && (
                  <div className="mt-3 pt-3 border-t border-st-border">
                    <pre className="text-xs text-st-text-secondary font-mono bg-st-bg-primary p-3 rounded-lg overflow-x-auto max-h-96 overflow-y-auto whitespace-pre-wrap break-all">
                      {JSON.stringify(entry, null, 2)}
                    </pre>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-4">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.max(0, p - 1))}
            disabled={page === 0}
          >
            <ChevronLeft className="w-4 h-4" /> Previous
          </Button>
          <span className="text-sm text-st-text-muted">
            Page {page + 1} of {totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
            disabled={page >= totalPages - 1}
          >
            Next <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      )}

      {/* Footer info */}
      <Card className="p-4 border-st-accent/10">
        <div className="flex items-start gap-3 text-xs text-st-text-muted">
          <Database className="w-4 h-4 text-st-accent shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-st-text-secondary mb-1">About the Lifelog</p>
            <p>Every API request, AI conversation, tracking session, and auth event is automatically saved as a JSON entry in your personal lifelog archive. Files are stored as JSON Lines (<code>.jsonl</code>) in the <code>lifelogs/</code> directory, one file per day. This data is never deleted — it persists for life.</p>
          </div>
        </div>
      </Card>
    </div>
  );
}
