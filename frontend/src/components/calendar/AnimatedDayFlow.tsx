"use client";

import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { format } from "date-fns";
import { X, Clock, PlayCircle, BookOpen, MonitorPlay, CheckSquare, Target, Pencil, Trash2 } from "lucide-react";

type FlowEvent = {
  id: string;
  title: string;
  start: string | Date;
  end?: string | Date;
  type: string;
  color?: string;
  notes?: string;
};

interface AnimatedDayFlowProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date | null;
  events: FlowEvent[];
  onEdit?: (event: FlowEvent) => void;
  onDelete?: (eventId: string) => void;
}

export function AnimatedDayFlow({ isOpen, onClose, date, events, onEdit, onDelete }: AnimatedDayFlowProps) {
  const [expandedId, setExpandedId] = React.useState<string | null>(null);

  // Sort events chronologically
  const sortedEvents = [...events].sort((a, b) => new Date(a.start).getTime() - new Date(b.start).getTime());

  const getEventIcon = (type: string) => {
    switch (type?.toLowerCase()) {
      case "learning":
      case "reading":
        return <BookOpen className="w-5 h-5 text-emerald-500" />;
      case "coding":
        return <MonitorPlay className="w-5 h-5 text-purple-500" />;
      case "meeting":
        return <PlayCircle className="w-5 h-5 text-amber-500" />;
      case "task":
      case "quiz":
        return <CheckSquare className="w-5 h-5 text-rose-500" />;
      default:
        return <Target className="w-5 h-5 text-blue-500" />;
    }
  };

  const getEventColor = (event: FlowEvent) => {
    if (event.color) {
      return { backgroundColor: event.color + "30", borderColor: event.color };
    }
    const c: Record<string, string> = {
      learning: "#10b981", reading: "#10b981",
      coding: "#8b5cf6",
      meeting: "#f59e0b",
      task: "#f43f5e", quiz: "#f43f5e",
    };
    const col = c[event.type?.toLowerCase()] || "#3b82f6";
    return { backgroundColor: col + "30", borderColor: col };
  };

  return (
    <AnimatePresence>
      {isOpen && date && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[100]"
          />

          {/* Side Panel */}
          <motion.div
            initial={{ x: "100%", opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: "100%", opacity: 0 }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-st-bg-primary border-l border-st-border z-[101] shadow-2xl overflow-y-auto"
          >
            <div className="p-6 sticky top-0 bg-st-bg-primary border-b border-st-border z-10 flex justify-between items-center shadow-sm">
              <div>
                <h2 className="text-2xl font-bold text-st-text-primary">
                  {format(date, "EEEE")}
                </h2>
                <p className="text-st-text-secondary text-sm">
                  {format(date, "MMMM d, yyyy")}
                </p>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-full hover:bg-st-bg-elevated transition-colors text-st-text-secondary hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {sortedEvents.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center opacity-50">
                  <div className="w-16 h-16 bg-st-bg-elevated rounded-full flex items-center justify-center mb-4">
                    <Clock className="w-8 h-8 text-st-text-muted" />
                  </div>
                  <p className="text-lg font-medium text-st-text-primary">No events scheduled</p>
                  <p className="text-sm text-st-text-secondary">Take a break or plan something new.</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Vertical Timeline Line */}
                  <div className="absolute left-6 top-0 bottom-0 w-px bg-st-border" />

                  <div className="space-y-8">
                    {sortedEvents.map((event, index) => {
                      const isExpanded = expandedId === (event.id || index.toString());
                      
                      return (
                        <motion.div
                          key={event.id || index}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                          className="relative pl-16 pr-4"
                        >
                          {/* Timeline Dot */}
                          <div
                            className="absolute left-5 top-4 w-3 h-3 rounded-full transform -translate-x-1/2 shadow-lg"
                            style={{ backgroundColor: event.color || "#818CF8" }}
                          />
  
                          {/* Event Card */}
                          <div 
                            onClick={() => setExpandedId(isExpanded ? null : (event.id || index.toString()))}
                            className={`p-4 rounded-xl border bg-st-bg-elevated border-st-border shadow-md transition-all cursor-pointer hover:border-st-accent ${isExpanded ? 'ring-1 ring-st-accent' : ''}`}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg" style={getEventColor(event)}>
                                  {getEventIcon(event.type)}
                                </div>
                                <h3 className="font-bold text-st-text-primary text-lg">{event.title}</h3>
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-2 text-sm text-st-text-secondary mt-3">
                              <Clock className="w-4 h-4" />
                              <span>
                                {format(new Date(event.start), "h:mm a")} -{" "}
                                {format(new Date(event.end || event.start), "h:mm a")}
                              </span>
                            </div>
                            
                            <AnimatePresence>
                              {isExpanded && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: "auto", opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden"
                                >
                                  <div className="mt-4 pt-4 border-t border-st-border space-y-3">
                                    {event.notes ? (
                                      <div className="text-sm text-st-text-secondary leading-relaxed whitespace-pre-wrap">
                                        {event.notes}
                                      </div>
                                    ) : (
                                      <p className="text-sm text-st-text-muted italic">No additional details provided.</p>
                                    )}
                                    
                                    <div className="flex gap-2 mt-2">
                                      <span className="px-2 py-1 text-xs font-medium bg-st-bg-primary rounded text-st-text-secondary border border-st-border">
                                        Type: {event.type?.toUpperCase() || 'GENERAL'}
                                      </span>
                                    </div>
                                    <div className="flex gap-2">
                                      {onEdit && (
                                        <button onClick={(e) => { e.stopPropagation(); onEdit(event); }}
                                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-st-bg-primary rounded text-st-text-secondary border border-st-border hover:border-st-accent/30 transition-colors">
                                          <Pencil className="w-3 h-3" /> Edit
                                        </button>
                                      )}
                                      {onDelete && (
                                        <button onClick={(e) => { e.stopPropagation(); if (confirm('Delete this event?')) onDelete(event.id); }}
                                          className="flex items-center gap-1 px-2 py-1 text-xs font-medium bg-st-danger/10 rounded text-st-danger border border-st-danger/20 hover:bg-st-danger/20 transition-colors">
                                          <Trash2 className="w-3 h-3" /> Delete
                                        </button>
                                      )}
                                    </div>
                                  </div>
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
