"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Clock, Target, Zap, CheckCircle, Sparkles } from "lucide-react";

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
  const leftRef = useRef<HTMLDivElement>(null);
  const leftInView = useInView(leftRef, { once: true, margin: "-80px" });
  const rightRef = useRef<HTMLDivElement>(null);
  const rightInView = useInView(rightRef, { once: true, margin: "-80px" });

  return (
    <section id="schedule" className="py-24 md:py-32 relative overflow-hidden bg-lp-bg-secondary/30">
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-lp-accent-sky/20 blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-lp-accent-lavender/15 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          <motion.div
            ref={leftRef}
            initial={{ opacity: 0, x: -30 }}
            animate={leftInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 w-full max-w-lg"
          >
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={leftInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-xs font-semibold text-lp-accent-sky uppercase tracking-[0.15em] mb-4 block"
            >
              Intelligent Planning
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={leftInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-4xl md:text-5xl font-semibold text-lp-text-primary tracking-tight mb-6"
            >
              Smart Schedule That{" "}
              <span className="gradient-text-accent">Adapts</span>
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={leftInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-lp-text-secondary text-lg mb-12 font-light leading-relaxed"
            >
              Our AI-powered scheduler learns your patterns and optimizes your study timetable for maximum retention and minimum burnout.
            </motion.p>

            <div className="space-y-6">
              {scheduleFeatures.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={leftInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                  transition={{ duration: 0.5, delay: 0.3 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="flex gap-5 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-lp-bg-card border border-lp-border/40 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:border-lp-accent/30 transition-all duration-300 shadow-sm">
                    <item.icon size={20} className="text-lp-accent" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-lp-text-primary mb-1">{item.title}</h4>
                    <p className="text-sm text-lp-text-secondary leading-relaxed font-light">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            ref={rightRef}
            initial={{ opacity: 0, x: 30 }}
            animate={rightInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 w-full relative"
          >
            <div className="relative z-10 card-premium rounded-3xl p-8 shadow-lg shadow-lp-text-primary/5">
              <div className="flex items-center justify-between mb-8">
                <div className="flex items-center gap-3">
                  <h3 className="text-lg font-semibold text-lp-text-primary tracking-tight">This Week</h3>
                  <Sparkles size={14} className="text-lp-accent-sky" />
                </div>
                <span className="text-xs font-medium text-lp-text-tertiary bg-lp-bg-tertiary/50 px-3 py-1.5 rounded-full border border-lp-border/30">Week 24</span>
              </div>

              <div className="space-y-3">
                {days.map((d, i) => (
                  <div key={d.day} className="flex items-center gap-4 p-2.5 rounded-xl hover:bg-lp-bg-tertiary/30 transition-colors">
                    <span className="w-10 text-xs font-semibold text-lp-text-tertiary uppercase tracking-wider">{d.day}</span>
                    <div className="flex-1 h-2.5 rounded-full bg-lp-bg-tertiary/50 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={rightInView ? { width: `${d.pct}%` } : { width: 0 }}
                        transition={{ duration: 1, delay: i * 0.08 + 0.3, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full bg-gradient-to-r from-lp-accent-sky to-lp-accent"
                      />
                    </div>
                    <span className="text-xs text-lp-text-secondary w-10 text-right font-medium">{d.hours}h</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-6 border-t border-lp-border/50 flex items-center justify-between">
                <div>
                  <span className="text-xs text-lp-text-tertiary font-medium">Total</span>
                  <p className="text-lg font-semibold text-lp-text-primary">23 hours</p>
                </div>
                <span className="text-xs font-medium text-lp-success bg-lp-success-bg px-3 py-1.5 rounded-full flex items-center gap-1.5">
                  <CheckCircle size={12} /> On track
                </span>
              </div>
            </div>

            <motion.div
              animate={{ y: [8, -8, 8] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-6 -top-6 w-28 h-28 rounded-3xl bg-gradient-to-br from-lp-accent-sky/30 to-lp-accent-lavender/30 blur-3xl -z-10"
            />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
