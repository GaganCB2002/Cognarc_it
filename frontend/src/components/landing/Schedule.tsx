"use client";

import { motion } from "framer-motion";
import { Clock, Target, Zap, CheckCircle } from "lucide-react";

const scheduleFeatures = [
  { icon: Clock, title: "Adaptive Time Blocking", desc: "Automatically schedules deep work sessions during your peak focus hours based on historical performance data.", color: "bg-lp-accent-lavender", textColor: "text-purple-700" },
  { icon: Target, title: "Spaced Repetition", desc: "Reviews are intelligently spaced to move knowledge from short-term to long-term memory efficiently.", color: "bg-lp-accent-blue text-blue-700" },
  { icon: Zap, title: "Energy-Aware Planning", desc: "Detects mental fatigue patterns and adjusts session intensity to prevent burnout.", color: "bg-lp-accent-sage", textColor: "text-emerald-700" },
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
    <section id="schedule" className="py-24 md:py-32 relative bg-lp-bg-primary overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-lp-accent-sky/20 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          {/* Left Side: Text & Features */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 w-full max-w-lg"
          >
            <span className="text-xs font-semibold text-lp-accent-sky uppercase tracking-widest mb-4 block">Intelligent Planning</span>
            <h2 className="text-4xl md:text-5xl font-semibold text-lp-text-primary tracking-tight mb-6">
              Smart Schedule That <span className="text-lp-accent-sky text-sky-700">Adapts</span>
            </h2>
            <p className="text-lp-text-secondary text-lg mb-12 font-light leading-relaxed">
              Our AI-powered scheduler learns your patterns and optimizes your study timetable for maximum retention and minimum burnout.
            </p>

            <div className="space-y-8">
              {scheduleFeatures.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: 0.2 + (i * 0.1), ease: [0.16, 1, 0.3, 1] }}
                  className="flex gap-5 group"
                >
                  <div className={`w-12 h-12 rounded-2xl ${item.color} bg-opacity-20 flex items-center justify-center shrink-0 group-hover:scale-110 transition-transform duration-300 shadow-sm border border-lp-border/50`}>
                    <item.icon size={20} className={item.textColor} />
                  </div>
                  <div>
                    <h4 className="text-lg font-medium text-lp-text-primary mb-1">{item.title}</h4>
                    <p className="text-sm text-lp-text-secondary leading-relaxed font-light">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          {/* Right Side: Mockup / Visual */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 w-full relative"
          >
            {/* Main Card */}
            <div className="relative z-10 p-8 rounded-3xl border border-lp-border bg-lp-bg-card shadow-2xl shadow-lp-border/50">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-semibold text-lp-text-primary tracking-tight">This Week</h3>
                <span className="text-xs font-medium text-lp-text-secondary bg-lp-bg-secondary px-3 py-1.5 rounded-full border border-lp-border">Week 24</span>
              </div>
              
              <div className="space-y-4">
                {days.map((d, i) => (
                  <div key={d.day} className="flex items-center gap-4 p-3 rounded-2xl hover:bg-lp-bg-secondary/50 transition-colors">
                    <span className="w-10 text-sm font-medium text-lp-text-muted">{d.day}</span>
                    <div className="flex-1 h-3 rounded-full bg-lp-bg-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${d.pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="h-full rounded-full bg-lp-accent-sky"
                      />
                    </div>
                    <span className="text-sm text-lp-text-secondary w-12 text-right font-medium">{d.hours}h</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-lp-border flex items-center justify-between">
                <span className="text-sm text-lp-text-secondary font-medium">
                  Total: <strong className="text-lp-text-primary text-base">23 hours</strong>
                </span>
                <span className="text-sm text-emerald-600 flex items-center gap-1.5 font-medium bg-emerald-50 px-3 py-1.5 rounded-full">
                  <CheckCircle size={14} /> On track
                </span>
              </div>
            </div>

            {/* Decorative Floating Elements */}
            <motion.div 
              animate={{ y: [10, -10, 10] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -left-8 -top-8 w-32 h-32 rounded-3xl bg-gradient-to-tr from-lp-accent-sky to-lp-accent-lavender opacity-30 blur-2xl -z-10"
            />
          </motion.div>
          
        </div>
      </div>
    </section>
  );
}
