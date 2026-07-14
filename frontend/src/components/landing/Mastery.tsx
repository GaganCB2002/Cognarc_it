"use client";

import { motion } from "framer-motion";
import { BarChart3, Trophy, Star } from "lucide-react";

const skills = [
  { skill: "System Design", level: 85, color: "bg-lp-accent-blue" },
  { skill: "Algorithms", level: 92, color: "bg-lp-accent-sage" },
  { skill: "Frontend", level: 78, color: "bg-lp-accent-sky" },
  { skill: "Backend", level: 88, color: "bg-lp-accent-lavender" },
];

const masteryFeatures = [
  { icon: Trophy, title: "Streak System", desc: "Maintain daily learning streaks. The longest streak is 365 days and counting among our top users.", color: "bg-lp-accent-blue", textColor: "text-blue-600" },
  { icon: BarChart3, title: "Performance Trends", desc: "Track your progress across all skills with detailed charts and predictive analytics.", color: "bg-lp-accent-sky", textColor: "text-sky-600" },
  { icon: Star, title: "Achievement Badges", desc: "Earn badges for milestones — complete modules, maintain streaks, and master skills.", color: "bg-lp-accent-rose", textColor: "text-rose-600" },
];

export function Mastery() {
  return (
    <section id="mastery" className="py-24 md:py-32 relative bg-lp-bg-secondary overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-lp-accent-lavender/20 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          
          {/* Left Side: Mockup / Visual */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 w-full max-w-lg relative"
          >
            {/* Main Card */}
            <div className="relative z-10 p-8 rounded-3xl border border-lp-border bg-lp-bg-card shadow-2xl shadow-lp-border/50">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-xl font-semibold text-lp-text-primary tracking-tight">Skill Radar</h3>
                <div className="w-10 h-10 rounded-full bg-lp-accent-blue/20 flex items-center justify-center">
                  <Trophy size={18} className="text-blue-600" />
                </div>
              </div>
              
              <div className="space-y-6">
                {skills.map((s, i) => (
                  <div key={s.skill}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-lp-text-primary font-medium">{s.skill}</span>
                      <span className="text-lp-text-secondary">{s.level}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-lp-bg-secondary overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        whileInView={{ width: `${s.level}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1.2, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                        className={`h-full rounded-full ${s.color}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              <div className="mt-8 pt-6 border-t border-lp-border grid grid-cols-2 gap-6 text-center">
                <div className="p-4 rounded-2xl bg-lp-bg-secondary/50 border border-lp-border">
                  <p className="text-3xl font-semibold text-lp-text-primary mb-1">42</p>
                  <p className="text-xs text-lp-text-muted uppercase tracking-wider font-medium">Day Streak</p>
                </div>
                <div className="p-4 rounded-2xl bg-lp-bg-secondary/50 border border-lp-border">
                  <p className="text-3xl font-semibold text-lp-text-primary mb-1">156</p>
                  <p className="text-xs text-lp-text-muted uppercase tracking-wider font-medium">Sessions</p>
                </div>
              </div>
            </div>

            {/* Decorative Floating Elements */}
            <motion.div 
              animate={{ y: [-10, 10, -10] }} 
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-8 -bottom-8 w-24 h-24 rounded-2xl bg-gradient-to-br from-lp-accent-rose to-lp-accent-blue opacity-30 blur-2xl -z-10"
            />
          </motion.div>

          {/* Right Side: Text & Features */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1"
          >
            <span className="text-xs font-semibold text-lp-accent-lavender uppercase tracking-widest mb-4 block">Analytics</span>
            <h2 className="text-4xl md:text-5xl font-semibold text-lp-text-primary tracking-tight mb-6">
              Track Your <span className="text-lp-accent-lavender text-purple-700">Mastery</span> Journey
            </h2>
            <p className="text-lp-text-secondary text-lg mb-12 font-light leading-relaxed">
              Real-time analytics that show exactly where you stand. Detailed skill breakdowns, streak tracking, and performance trends to keep you moving forward.
            </p>

            <div className="space-y-8">
              {masteryFeatures.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: 0.3 + (i * 0.1), ease: [0.16, 1, 0.3, 1] }}
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
          
        </div>
      </div>
    </section>
  );
}
