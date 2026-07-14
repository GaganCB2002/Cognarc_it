"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import Link from "next/link";
import { Layout, Server, Database, Cloud, Code, ArrowUpRight } from "lucide-react";

const modules = [
  { id: 1, name: "Foundations", topics: 12, progress: 100, icon: Code, description: "Computer science fundamentals, data structures, and algorithmic thinking.", accent: "from-lp-accent-sky to-lp-accent-sky-light" },
  { id: 2, name: "Frontend Architecture", topics: 18, progress: 85, icon: Layout, description: "Modern frameworks, component design, state management, and performance optimization.", accent: "from-lp-accent-sage to-lp-accent-sage-light" },
  { id: 3, name: "Backend Engineering", topics: 15, progress: 60, icon: Server, description: "API design, microservices, databases, caching, and server-side architecture.", accent: "from-lp-accent-lavender to-lp-accent-lavender-light" },
  { id: 4, name: "System Design", topics: 10, progress: 35, icon: Database, description: "Distributed systems, scalability patterns, and cloud infrastructure.", accent: "from-lp-accent-peach to-lp-accent-peach-light" },
  { id: 5, name: "DevOps & Deployment", topics: 8, progress: 15, icon: Cloud, description: "CI/CD pipelines, containerization, monitoring, and infrastructure as code.", accent: "from-lp-accent-indigo to-lp-accent-indigo-light" },
];

function ModuleCard({ mod, index }: { mod: typeof modules[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="group"
    >
      <div className="card-premium rounded-2xl p-6 md:p-8 h-full flex flex-col relative overflow-hidden">
        <div className={`absolute -right-12 -top-12 w-40 h-40 rounded-full blur-[60px] bg-gradient-to-br ${mod.accent} opacity-0 group-hover:opacity-25 transition-opacity duration-500 pointer-events-none`} />

        <div className="flex items-center justify-between mb-5">
          <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${mod.accent} flex items-center justify-center shadow-sm`}>
            <mod.icon className="w-5 h-5 text-white" />
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-lp-text-tertiary uppercase tracking-wider">
              Module {String(index + 1).padStart(2, "0")}
            </span>
            <div className="w-1.5 h-1.5 rounded-full bg-lp-border" />
            <span className="text-xs font-medium text-lp-text-tertiary">{mod.topics} topics</span>
          </div>
        </div>

        <h3 className="text-xl font-semibold text-lp-text-primary mb-2 tracking-tight">{mod.name}</h3>
        <p className="text-sm text-lp-text-secondary leading-relaxed font-light mb-5 flex-1">{mod.description}</p>

        <div className="flex flex-col gap-2 mt-auto">
          <div className="flex justify-between items-center text-xs">
            <span className="font-medium text-lp-text-tertiary">Progress</span>
            <span className="font-semibold text-lp-text-primary">{mod.progress}%</span>
          </div>
          <div className="w-full h-2 rounded-full bg-lp-bg-tertiary/50 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={inView ? { width: `${mod.progress}%` } : { width: 0 }}
              transition={{ duration: 1.2, delay: index * 0.1 + 0.3, ease: [0.16, 1, 0.3, 1] }}
              className={`h-full rounded-full bg-gradient-to-r ${mod.accent}`}
            />
          </div>
        </div>
      </div>
    </motion.div>
  );
}

export function Curriculum() {
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-100px" });
  const ctaRef = useRef<HTMLDivElement>(null);
  const ctaInView = useInView(ctaRef, { once: true, margin: "-80px" });

  return (
    <section id="curriculum" className="py-24 md:py-32 relative overflow-hidden bg-lp-bg-primary">
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-lp-accent-sky/5 rounded-full blur-[200px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-lp-accent-lavender/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mb-16"
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-xs font-semibold text-lp-accent uppercase tracking-[0.15em] mb-4 block"
          >
            Learning Path
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-4xl md:text-5xl lg:text-6xl font-semibold text-lp-text-primary tracking-tight mb-4"
          >
            Structured{" "}
            <span className="gradient-text-accent">Curriculum</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lp-text-secondary text-lg font-light leading-relaxed max-w-2xl"
          >
            A carefully sequenced progression from core fundamentals to advanced system design, crafted by senior engineers at top tech companies.
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod, i) => (
            <ModuleCard key={mod.id} mod={mod} index={i} />
          ))}

          <motion.div
            ref={ctaRef}
            initial={{ opacity: 0, y: 40 }}
            animate={ctaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link href="#features">
              <div className="card-premium rounded-2xl flex flex-col items-center justify-center text-center h-full min-h-[280px] p-8 border-dashed border-lp-border/60 hover:border-lp-accent/30 group cursor-pointer">
                <div className="w-14 h-14 rounded-full bg-lp-accent-soft border border-lp-border/40 flex items-center justify-center mb-5 group-hover:scale-110 group-hover:bg-lp-accent/10 transition-all duration-300">
                  <ArrowUpRight size={22} className="text-lp-accent group-hover:rotate-45 transition-transform duration-300" />
                </div>
                <p className="font-semibold text-lp-text-primary mb-1">View Full Curriculum</p>
                <p className="text-sm text-lp-text-tertiary font-light">52 weeks of structured learning</p>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
