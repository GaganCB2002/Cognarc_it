"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar as CalendarIcon, Clock, AlignLeft, Tag } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface NewEventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: any) => void;
}

export function NewEventModal({ isOpen, onClose, onSave }: NewEventModalProps) {
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [type, setType] = useState("learning");
  const [notes, setNotes] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !date || !startTime || !endTime) return;

    const startDateTime = new Date(`${date}T${startTime}`);
    const endDateTime = new Date(`${date}T${endTime}`);

    onSave({
      title,
      start: startDateTime,
      end: endDateTime,
      type,
      notes,
    });
    
    // Reset form
    setTitle("");
    setDate("");
    setStartTime("");
    setEndTime("");
    setType("learning");
    setNotes("");
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-[110]"
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-lg bg-st-bg-primary border border-st-border rounded-xl shadow-2xl z-[111] overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 border-b border-st-border">
              <h2 className="text-xl font-bold text-st-text-primary">Create New Event</h2>
              <button onClick={onClose} className="text-st-text-secondary hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="space-y-1">
                <label className="text-sm font-medium text-st-text-secondary flex items-center gap-2">
                  <Tag className="w-4 h-4" /> Event Title
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-st-bg-elevated border border-st-border rounded-lg p-2.5 text-st-text-primary focus:outline-none focus:border-st-accent transition-colors"
                  placeholder="e.g. Deep Work Session"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-st-text-secondary flex items-center gap-2">
                    <CalendarIcon className="w-4 h-4" /> Date
                  </label>
                  <input
                    type="date"
                    required
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="w-full bg-st-bg-elevated border border-st-border rounded-lg p-2.5 text-st-text-primary focus:outline-none focus:border-st-accent transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-st-text-secondary flex items-center gap-2">
                    <Tag className="w-4 h-4" /> Type
                  </label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                    className="w-full bg-st-bg-elevated border border-st-border rounded-lg p-2.5 text-st-text-primary focus:outline-none focus:border-st-accent transition-colors"
                  >
                    <option value="learning">Learning</option>
                    <option value="coding">Coding</option>
                    <option value="meeting">Meeting</option>
                    <option value="task">Task</option>
                    <option value="other">Other</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-sm font-medium text-st-text-secondary flex items-center gap-2">
                    <Clock className="w-4 h-4" /> Start Time
                  </label>
                  <input
                    type="time"
                    required
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    className="w-full bg-st-bg-elevated border border-st-border rounded-lg p-2.5 text-st-text-primary focus:outline-none focus:border-st-accent transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-sm font-medium text-st-text-secondary flex items-center gap-2">
                    <Clock className="w-4 h-4" /> End Time
                  </label>
                  <input
                    type="time"
                    required
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    className="w-full bg-st-bg-elevated border border-st-border rounded-lg p-2.5 text-st-text-primary focus:outline-none focus:border-st-accent transition-colors"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-sm font-medium text-st-text-secondary flex items-center gap-2">
                  <AlignLeft className="w-4 h-4" /> Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full bg-st-bg-elevated border border-st-border rounded-lg p-2.5 text-st-text-primary focus:outline-none focus:border-st-accent transition-colors min-h-[100px] resize-none"
                  placeholder="Details, goals, or topics..."
                />
              </div>

              <div className="pt-4 flex justify-end gap-3 border-t border-st-border">
                <Button type="button" variant="outline" onClick={onClose}>
                  Cancel
                </Button>
                <Button type="submit" variant="primary">
                  Save Event
                </Button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
