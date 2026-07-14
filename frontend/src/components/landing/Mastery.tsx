"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { BarChart3, Trophy, Star, Award } from "lucide-react";

const skills = [
  { skill: "System Design", level: 85 },
  { skill: "Algorithms", level: 92 },
  { skill: "Frontend", level: 78 },
  { skill: "Backend", level: 88 },
];

const masteryFeatures = [
  { icon: Trophy, title: "Streak System", desc: "Maintain daily learning streaks. The longest streak is 365 days and counting among our top users." },
  { icon: BarChart3, title: "Performance Trends", desc: "Track your progress across all skills with detailed charts and predictive analytics." },
  { icon: Star, title: "Achievement Badges", desc: "Earn badges for milestones \u2014 complete modules, maintain streaks, and master skills." },
];

const skillAccents = ["from-lp-accent-sky", "from-lp-accent-sage", "from-lp-accent-lavender", "from-lp-accent-peach"];

export function Mastery() {
  const leftRef = useRef<HTMLDivElement>(null);
  const leftInView = useInView(leftRef, { once: true, margin: "-80px" });
  const rightRef = useRef<HTMLDivElement>(null);
  const rightInView = useInView(rightRef, { once: true, margin: "-80px" });

  return (
    <section id="mastery" className="py-24 md:py-32 relative overflow-hidden bg-lp-bg-primary">
      <div className="absolute top-0 right-0 w-[700px] h-[700px] bg-lp-accent-lavender/15 blur-[180px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-lp-accent-sage/10 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
          <motion.div
            ref={leftRef}
            initial={{ opacity: 0, x: -30 }}
            animate={leftInView ? { opacity: 1, x: 0 } : { opacity: 0, x: -30 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1 w-full max-w-lg relative"
          >
            <div className="relative z-10 card-premium rounded-3xl p-8 shadow-lg shadow-lp-text-primary/5">
              <div className="flex items-center justify-between mb-8">
                <h3 className="text-lg font-semibold text-lp-text-primary tracking-tight">Skill Radar</h3>
                <div className="w-10 h-10 rounded-xl bg-lp-accent-soft border border-lp-border/40 flex items-center justify-center">
                  <Award size={18} className="text-lp-accent" />
                </div>
              </div>

              <div className="space-y-5">
                {skills.map((s, i) => (
                  <div key={s.skill}>
                    <div className="flex justify-between text-sm mb-2">
                      <span className="text-lp-text-primary font-medium">{s.skill}</span>
                      <span className="text-lp-text-tertiary">{s.level}%</span>
                    </div>
                    <div className="h-2.5 rounded-full bg-lp-bg-tertiary/50 overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={leftInView ? { width: `${s.level}%` } : { width: 0 }}
                        transition={{ duration: 1.2, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
                        className={`h-full rounded-full bg-gradient-to-r ${skillAccents[i]} to-transparent`}
                        style={{
                          background: `linear-gradient(90deg, var(--tw-gradient-stops))`,
                          backgroundImage: `linear-gradient(90deg, 
                            ${i === 0 ? 'var(--color-lp-accent-sky)' : i === 1 ? 'var(--color-lp-accent-sage)' : i === 2 ? 'var(--color-lp-accent-lavender)' : 'var(--color-lp-accent-peach)'}, 
                            ${i === 0 ? 'var(--color-lp-accent)' : i === 1 ? 'var(--color-lp-accent-lavender)' : i === 2 ? 'var(--color-lp-accent)' : 'var(--color-lp-accent-gold)'})`
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-8 pt-6 border-t border-lp-border/50 grid grid-cols-2 gap-4">
                <div className="p-4 rounded-xl bg-lp-bg-tertiary/30 border border-lp-border/30">
                  <p className="text-2xl font-semibold text-lp-text-primary mb-0.5">42</p>
                  <p className="text-[10px] text-lp-text-tertiary uppercase tracking-wider font-medium">Day Streak</p>
                </div>
                <div className="p-4 rounded-xl bg-lp-bg-tertiary/30 border border-lp-border/30">
                  <p className="text-2xl font-semibold text-lp-text-primary mb-0.5">156</p>
                  <p className="text-[10px] text-lp-text-tertiary uppercase tracking-wider font-medium">Sessions</p>
                </div>
              </div>
            </div>

            <motion.div
              animate={{ y: [-8, 8, -8] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute -right-8 -bottom-8 w-24 h-24 rounded-2xl bg-gradient-to-br from-lp-accent-peach/30 to-lp-accent-sky/30 blur-3xl -z-10"
            />
          </motion.div>

          <motion.div
            ref={rightRef}
            initial={{ opacity: 0, x: 30 }}
            animate={rightInView ? { opacity: 1, x: 0 } : { opacity: 0, x: 30 }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="flex-1"
          >
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              animate={rightInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
              transition={{ duration: 0.5, delay: 0.25 }}
              className="text-xs font-semibold text-lp-accent-lavender uppercase tracking-[0.15em] mb-4 block"
            >
              Analytics
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 20 }}
              animate={rightInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-4xl md:text-5xl font-semibold text-lp-text-primary tracking-tight mb-6"
            >
              Track Your{" "}
              <span className="gradient-text-accent">Mastery</span> Journey
            </motion.h2>
            <motion.p
              initial={{ opacity: 0, y: 15 }}
              animate={rightInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
              transition={{ duration: 0.6, delay: 0.35 }}
              className="text-lp-text-secondary text-lg mb-12 font-light leading-relaxed"
            >
              Real-time analytics that show exactly where you stand. Detailed skill breakdowns, streak tracking, and performance trends to keep you moving forward.
            </motion.p>

            <div className="space-y-6">
              {masteryFeatures.map((item, i) => (
                <motion.div
                  key={item.title}
                  initial={{ opacity: 0, y: 15 }}
                  animate={rightInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                  transition={{ duration: 0.5, delay: 0.4 + i * 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="flex gap-5 group"
                >
                  <div className="w-12 h-12 rounded-xl bg-lp-bg-card border border-lp-border/40 flex items-center justify-center shrink-0 group-hover:scale-110 group-hover:border-lp-accent/30 transition-all duration-300 shadow-sm">
                    <item.icon size={20} className="text-lp-accent-lavender" />
                  </div>
                  <div>
                    <h4 className="text-base font-medium text-lp-text-primary mb-1">{item.title}</h4>
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
