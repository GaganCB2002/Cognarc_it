"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { TrendingUp, Users, CheckCircle, Target } from "lucide-react";

function useCountUp(target: number, duration: number, inView: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    let startTime: number | null = null;
    let animationFrame: number;
    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      const ease = percentage === 1 ? 1 : 1 - Math.pow(2, -10 * percentage);
      setCount(Math.floor(target * ease));
      if (progress < duration) {
        animationFrame = requestAnimationFrame(updateCount);
      }
    };
    animationFrame = requestAnimationFrame(updateCount);
    return () => cancelAnimationFrame(animationFrame);
  }, [target, duration, inView]);

  return count;
}

const statsData = [
  { target: 200, suffix: "+", label: "Learning Modules", icon: Target, description: "Comprehensive curriculum paths", accent: "bg-lp-accent-sky/20 text-lp-accent-sky" },
  { target: 2400, suffix: "+", label: "Active Engineers", icon: Users, description: "Growing community daily", accent: "bg-lp-accent-sage/20 text-lp-accent-sage" },
  { target: 94, suffix: "%", label: "Completion Rate", icon: CheckCircle, description: "Industry-leading retention", accent: "bg-lp-accent-lavender/20 text-lp-accent-lavender" },
  { target: 32, suffix: "x", label: "Avg. Skill Gain", icon: TrendingUp, description: "Measurable career growth", accent: "bg-lp-accent-gold/20 text-lp-accent-gold" },
];

function StatItem({ stat, index, inView }: { stat: typeof statsData[0]; index: number; inView: boolean }) {
  const count = useCountUp(stat.target, 2500, inView);
  const StatIcon = stat.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="group relative"
    >
      <div className="card-premium rounded-2xl p-6 md:p-8 text-center relative overflow-hidden">
        <div className={`absolute -right-10 -top-10 w-32 h-32 rounded-full blur-[60px] opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none ${stat.accent.split(" ")[0]}`} />

        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm border border-lp-border/30 ${stat.accent}`}>
          <StatIcon className="w-5 h-5" />
        </div>

        <p className="text-4xl md:text-5xl font-semibold text-lp-text-primary tracking-tight mb-1">
          {count}{stat.suffix}
        </p>
        <p className="text-sm font-medium text-lp-text-secondary mb-1">{stat.label}</p>
        <p className="text-xs text-lp-text-tertiary font-light">{stat.description}</p>
      </div>
    </motion.div>
  );
}

export function Stats() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });

  return (
    <section ref={sectionRef} className="py-20 md:py-28 relative overflow-hidden bg-lp-bg-primary">
      <div className="absolute inset-0 bg-gradient-to-b from-lp-bg-secondary/30 via-transparent to-lp-bg-secondary/30 pointer-events-none" />
      <div className="absolute top-1/2 left-1/4 w-[600px] h-[600px] bg-lp-accent-lavender/10 rounded-full blur-[150px] -translate-y-1/2 pointer-events-none" />
      <div className="absolute top-1/2 right-1/4 w-[500px] h-[500px] bg-lp-accent-sky/10 rounded-full blur-[150px] -translate-y-1/2 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 md:gap-8">
          {statsData.map((stat, i) => (
            <StatItem key={stat.label} stat={stat} index={i} inView={inView} />
          ))}
        </div>
      </div>
    </section>
  );
}
