"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar as CalendarIcon, Check, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/Button";
import toast from "react-hot-toast";

interface SyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function SyncModal({ isOpen, onClose }: SyncModalProps) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [isSynced, setIsSynced] = useState(false);

  const handleSync = (provider: string) => {
    setIsSyncing(true);
    // Simulate an API call
    setTimeout(() => {
      setIsSyncing(false);
      setIsSynced(true);
      toast.success(`Successfully connected to ${provider}!`);
      setTimeout(() => {
        onClose();
        setIsSynced(false);
      }, 1000);
    }, 1500);
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
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-st-bg-primary border border-st-border rounded-xl shadow-2xl z-[111] overflow-hidden"
          >
            <div className="flex justify-between items-center p-6 border-b border-st-border">
              <h2 className="text-xl font-bold text-st-text-primary">Sync External Calendar</h2>
              <button onClick={onClose} className="text-st-text-secondary hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-6">
              <p className="text-st-text-secondary text-sm">
                Connect your external calendars to automatically import your meetings and deep work sessions into StudyTrack.
              </p>

              <div className="space-y-4">
                {/* Google Calendar */}
                <div className="flex items-center justify-between p-4 bg-st-bg-elevated border border-st-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-white rounded-lg">
                      <svg className="w-5 h-5" viewBox="0 0 24 24">
                        <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                        <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                        <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                        <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      </svg>
                    </div>
                    <div>
                      <h3 className="font-bold text-st-text-primary">Google Calendar</h3>
                      <p className="text-xs text-st-text-secondary">Two-way synchronization</p>
                    </div>
                  </div>
                  <Button 
                    variant={isSynced ? "outline" : "primary"}
                    size="sm"
                    disabled={isSyncing || isSynced}
                    onClick={() => handleSync('Google Calendar')}
                  >
                    {isSyncing ? <RefreshCw className="w-4 h-4 animate-spin" /> : (isSynced ? <Check className="w-4 h-4 text-emerald-500" /> : "Connect")}
                  </Button>
                </div>

                {/* Outlook */}
                <div className="flex items-center justify-between p-4 bg-st-bg-elevated border border-st-border rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-[#0078D4] rounded-lg">
                      <CalendarIcon className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-st-text-primary">Outlook Calendar</h3>
                      <p className="text-xs text-st-text-secondary">Import events only</p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm" onClick={() => handleSync('Outlook Calendar')}>
                    Connect
                  </Button>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
