"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, BookOpen } from "lucide-react";

const modules = [
  { id: 1, name: "Foundations", topics: 12, progress: 100, color: "#4F6BED", description: "Computer science fundamentals, data structures, and algorithmic thinking." },
  { id: 2, name: "Frontend Architecture", topics: 18, progress: 85, color: "#7C3AED", description: "Modern frameworks, component design, state management, and performance optimization." },
  { id: 3, name: "Backend Engineering", topics: 15, progress: 60, color: "#A855F7", description: "API design, microservices, databases, caching, and server-side architecture." },
  { id: 4, name: "System Design", topics: 10, progress: 35, color: "#EC4899", description: "Distributed systems, scalability patterns, and cloud infrastructure." },
  { id: 5, name: "DevOps & Deployment", topics: 8, progress: 15, color: "#F59E0B", description: "CI/CD pipelines, containerization, monitoring, and infrastructure as code." },
];

export function Curriculum() {
  return (
    <section id="curriculum" className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-st-accent/[0.02] to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center mb-16"
        >
          <span className="text-xs font-semibold text-st-accent uppercase tracking-widest mb-4 block">Learning Path</span>
          <h2 className="text-3xl md:text-5xl font-bold text-st-text-primary tracking-tight mb-4">
            Structured{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-st-accent to-st-accent-hover">
              Curriculum
            </span>
          </h2>
          <p className="text-st-text-secondary text-lg">
            A carefully sequenced progression from core fundamentals to advanced system design, crafted by senior engineers at top tech companies.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {modules.map((mod, i) => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="group"
            >
              <div className="p-6 rounded-2xl border border-st-border bg-st-bg-card hover:border-st-accent/20 transition-all duration-300 h-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-sm font-bold"
                    style={{ backgroundColor: `${mod.color}18`, color: mod.color }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <span className="text-sm font-semibold" style={{ color: mod.color }}>{mod.progress}%</span>
                </div>
                <h3 className="text-lg font-semibold text-st-text-primary mb-2">{mod.name}</h3>
                <p className="text-sm text-st-text-secondary leading-relaxed mb-4">{mod.description}</p>
                <div className="flex items-center justify-between mt-auto pt-2 border-t border-st-border/50">
                  <span className="text-xs text-st-text-muted">{mod.topics} topics</span>
                  <div className="flex-1 max-w-[120px] h-1.5 rounded-full bg-st-border overflow-hidden ml-4">
                    <div className="h-full rounded-full transition-all duration-700"
                      style={{ width: `${mod.progress}%`, backgroundColor: mod.color }} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.5, delay: 0.5 }}
            whileHover={{ y: -4 }}
          >
            <Link href="#features">
              <div className="p-6 rounded-2xl border border-dashed border-st-border hover:border-st-accent/30 transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[200px] h-full bg-st-bg-card/30 hover:bg-st-bg-card/60">
                <div className="w-12 h-12 rounded-full bg-st-accent/10 flex items-center justify-center mb-3 group-hover:bg-st-accent/20 transition-colors">
                  <ChevronRight size={20} className="text-st-accent" />
                </div>
                <p className="text-sm font-medium text-st-accent">View Full Curriculum</p>
                <p className="text-xs text-st-text-muted mt-1">52 weeks of structured learning</p>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
