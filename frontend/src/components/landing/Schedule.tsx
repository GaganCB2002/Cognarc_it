"use client";

import { motion } from "framer-motion";
import { Clock, Target, Zap, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";

const scheduleFeatures = [
  { icon: Clock, title: "Adaptive Time Blocking", desc: "Automatically schedules deep work sessions during your peak focus hours based on historical performance data." },
  { icon: Target, title: "Spaced Repetition", desc: "Reviews are intelligently spaced to move knowledge from short-term to long-term memory efficiently." },
  { icon: Zap, title: "Energy-Aware Planning", desc: "Detects mental fatigue patterns and adjusts session intensity to prevent burnout." },
];

const days = [
  { day: "Mon", hours: 4, pct: 80 },
  { day: "Tue", hours: 5, pct: 100 },
  { day: "Wed", hours: 3, pct: 60 },
  { day: "Thu", hours: 4.5, pct: 90 },
  { day: "Fri", hours: 3.5, pct: 75 },
  { day: "Sat", hours: 2, pct: 50 },
  { day: "Sun", hours: 1, pct: 30 },
];

export function Schedule() {
  return (
    <section id="schedule" className="py-24 md:py-32 bg-st-bg-secondary/30 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-st-accent/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="flex-1"
          >
            <span className="text-xs font-semibold text-st-accent uppercase tracking-widest mb-4 block">Intelligent Planning</span>
            <h2 className="text-3xl md:text-5xl font-bold text-st-text-primary tracking-tight mb-4">
              Smart Schedule{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-st-accent to-st-accent-hover">
                That Adapts
              </span>
            </h2>
            <p className="text-st-text-secondary text-lg mb-10 max-w-lg">
              Our AI-powered scheduler learns your patterns and optimizes your study timetable for maximum retention and minimum burnout.
            </p>

            <div className="space-y-6">
              {scheduleFeatures.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: 0.1 * i }}
                  className="flex gap-4 group"
                >
                  <div className="w-10 h-10 rounded-xl bg-st-accent/10 flex items-center justify-center shrink-0 group-hover:bg-st-accent/20 transition-colors">
                    <item.icon size={18} className="text-st-accent" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-st-text-primary">{item.title}</h4>
                    <p className="text-sm text-st-text-secondary leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 w-full max-w-md"
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-st-text-primary">This Week</h3>
                <span className="text-xs text-st-text-muted bg-st-bg-elevated/50 px-2 py-1 rounded-md">Week 24</span>
              </div>
              <div className="space-y-3">
                {days.map((d) => (
                  <div key={d.day} className="flex items-center gap-4 p-2 rounded-lg hover:bg-st-bg-elevated/30 transition-colors">
                    <span className="w-8 text-xs font-medium text-st-text-muted">{d.day}</span>
                    <div className="flex-1 h-2 rounded-full bg-st-border overflow-hidden">
                      <div className="h-full rounded-full bg-gradient-to-r from-st-accent to-st-accent-hover transition-all"
                        style={{ width: `${d.pct}%` }} />
                    </div>
                    <span className="text-xs text-st-text-muted w-12 text-right font-medium">{d.hours}h</span>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-st-border flex items-center justify-between">
                <span className="text-sm text-st-text-muted">
                  Total: <strong className="text-st-text-primary">23 hours</strong>
                </span>
                <span className="text-xs text-st-success flex items-center gap-1">
                  <CheckCircle size={12} /> On track
                </span>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
