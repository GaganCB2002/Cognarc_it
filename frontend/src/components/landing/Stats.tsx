"use client";

import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { BookOpen, Users, TrendingUp, Target } from "lucide-react";

function StatItem({ target, suffix, label, icon: Icon }: { target: number; suffix: string; label: string; icon: React.ElementType }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["0 1", "0.4 1"] });
  const count = useTransform(scrollYProgress, [0, 1], [0, target]);

  return (
    <div ref={ref} className="text-center">
      <div className="w-12 h-12 rounded-xl bg-st-accent/10 flex items-center justify-center mx-auto mb-4">
        <Icon size={22} className="text-st-accent" />
      </div>
      <motion.p className="text-3xl md:text-4xl font-bold text-st-text-primary tracking-tight">
        <motion.span>{count}</motion.span>
        <span>{suffix}</span>
      </motion.p>
      <p className="text-sm text-st-text-muted mt-1">{label}</p>
    </div>
  );
}

export function Stats() {
  return (
    <section className="py-16 md:py-20 border-y border-st-border bg-st-bg-secondary/30">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          <StatItem target={200} suffix="+" label="Learning Modules" icon={BookOpen} />
          <StatItem target={2400} suffix="+" label="Active Engineers" icon={Users} />
          <StatItem target={94} suffix="%" label="Completion Rate" icon={TrendingUp} />
          <StatItem target={32} suffix="x" label="Avg. Skill Gain" icon={Target} />
        </div>
      </div>
    </section>
  );
}
