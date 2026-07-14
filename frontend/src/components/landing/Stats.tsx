"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";

function useCountUp(target: number, duration: number = 2000, inView: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!inView) return;
    
    let startTime: number | null = null;
    let animationFrame: number;

    const updateCount = (timestamp: number) => {
      if (!startTime) startTime = timestamp;
      const progress = timestamp - startTime;
      const percentage = Math.min(progress / duration, 1);
      
      // Easing function (easeOutExpo)
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

function StatItem({ target, suffix, label, delay }: { target: number; suffix: string; label: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  const count = useCountUp(target, 2500, inView);

  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
      transition={{ duration: 0.8, delay, ease: [0.16, 1, 0.3, 1] }}
      className="flex flex-col items-center justify-center p-8 relative group"
    >
      {/* Subtle hover background */}
      <div className="absolute inset-0 bg-lp-bg-card/50 opacity-0 group-hover:opacity-100 rounded-3xl transition-opacity duration-500 blur-xl -z-10" />
      
      <p className="text-5xl md:text-7xl font-semibold tracking-tighter text-lp-text-primary mb-2">
        {count}{suffix}
      </p>
      <p className="text-sm md:text-base font-medium text-lp-text-secondary uppercase tracking-widest">
        {label}
      </p>
    </motion.div>
  );
}

export function Stats() {
  return (
    <section className="py-24 md:py-32 relative bg-lp-bg-primary overflow-hidden">
      {/* Decorative gradients */}
      <div className="absolute top-1/2 left-0 w-96 h-96 bg-lp-accent-blue/10 rounded-full blur-[100px] -translate-y-1/2 -translate-x-1/2" />
      <div className="absolute top-1/2 right-0 w-96 h-96 bg-lp-accent-sky/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/2" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 md:gap-4">
          <StatItem target={200} suffix="+" label="Learning Modules" delay={0.1} />
          <StatItem target={2400} suffix="+" label="Active Engineers" delay={0.2} />
          <StatItem target={94} suffix="%" label="Completion Rate" delay={0.3} />
          <StatItem target={32} suffix="x" label="Avg. Skill Gain" delay={0.4} />
        </div>
      </div>
    </section>
  );
}
