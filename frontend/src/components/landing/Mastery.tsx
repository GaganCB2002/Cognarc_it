"use client";

import { motion } from "framer-motion";
import { BarChart3, Trophy, Star } from "lucide-react";
import { Card } from "@/components/ui/Card";

const skills = [
  { skill: "System Design", level: 85 },
  { skill: "Algorithms", level: 92 },
  { skill: "Frontend", level: 78 },
  { skill: "Backend", level: 88 },
  { skill: "DevOps", level: 65 },
  { skill: "Databases", level: 72 },
];

const masteryFeatures = [
  { icon: Trophy, title: "Streak System", desc: "Maintain daily learning streaks. The longest streak is 365 days and counting among our top users." },
  { icon: BarChart3, title: "Performance Trends", desc: "Track your progress across all skills with detailed charts and predictive analytics." },
  { icon: Star, title: "Achievement Badges", desc: "Earn badges for milestones — complete modules, maintain streaks, and master skills." },
];

export function Mastery() {
  return (
    <section id="mastery" className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-st-accent/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="flex-1 order-2 lg:order-1 w-full max-w-md"
          >
            <Card className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-semibold text-st-text-primary">Skill Radar</h3>
                <Trophy size={18} className="text-st-warning" />
              </div>
              <div className="space-y-4">
                {skills.map((s) => (
                  <div key={s.skill}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="text-st-text-primary">{s.skill}</span>
                      <span className="text-st-text-muted font-medium">{s.level}%</span>
                    </div>
                    <div className="h-2 rounded-full bg-st-border overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${s.level}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: 0.2, ease: "easeOut" }}
                        className="h-full rounded-full bg-gradient-to-r from-st-accent to-st-accent-hover"
                      />
                    </div>
                  </div>
                ))}
              </div>
              <div className="mt-6 pt-4 border-t border-st-border grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold text-st-text-primary">42</p>
                  <p className="text-xs text-st-text-muted">Day Streak</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-st-accent">156</p>
                  <p className="text-xs text-st-text-muted">Sessions</p>
                </div>
              </div>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="flex-1 order-1 lg:order-2"
          >
            <span className="text-xs font-semibold text-st-accent uppercase tracking-widest mb-4 block">Analytics</span>
            <h2 className="text-3xl md:text-5xl font-bold text-st-text-primary tracking-tight mb-4">
              Track Your{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-st-accent to-st-accent-hover">
                Mastery
              </span>{" "}
              Journey
            </h2>
            <p className="text-st-text-secondary text-lg mb-10 max-w-lg">
              Real-time analytics that show exactly where you stand. Detailed skill breakdowns, streak tracking, and performance trends to keep you moving forward.
            </p>

            <div className="space-y-6">
              {masteryFeatures.map((item, i) => (
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
        </div>
      </div>
    </section>
  );
}
