"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ChevronRight, Layout, Server, Database, Cloud, Shield } from "lucide-react";

const modules = [
  { id: 1, name: "Foundations", topics: 12, progress: 100, icon: Layout, color: "bg-lp-accent-blue text-blue-700", description: "Computer science fundamentals, data structures, and algorithmic thinking." },
  { id: 2, name: "Frontend Architecture", topics: 18, progress: 85, icon: Layout, color: "bg-lp-accent-sage", text: "text-emerald-700", description: "Modern frameworks, component design, state management, and performance optimization." },
  { id: 3, name: "Backend Engineering", topics: 15, progress: 60, icon: Server, color: "bg-lp-accent-sky", text: "text-sky-700", description: "API design, microservices, databases, caching, and server-side architecture." },
  { id: 4, name: "System Design", topics: 10, progress: 35, icon: Database, color: "bg-lp-accent-lavender", text: "text-purple-700", description: "Distributed systems, scalability patterns, and cloud infrastructure." },
  { id: 5, name: "DevOps & Deployment", topics: 8, progress: 15, icon: Cloud, color: "bg-lp-accent-rose text-rose-700", description: "CI/CD pipelines, containerization, monitoring, and infrastructure as code." },
];

export function Curriculum() {
  return (
    <section id="curriculum" className="py-24 md:py-32 relative bg-lp-bg-primary overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-lp-accent-blue/5 via-transparent to-transparent pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-2xl text-left mb-16"
        >
          <span className="text-xs font-semibold text-lp-accent-blue uppercase tracking-widest mb-4 block">Learning Path</span>
          <h2 className="text-4xl md:text-5xl font-semibold text-lp-text-primary tracking-tight mb-4">
            Structured Curriculum
          </h2>
          <p className="text-lp-text-secondary text-lg font-light leading-relaxed">
            A carefully sequenced progression from core fundamentals to advanced system design, crafted by senior engineers at top tech companies.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {modules.map((mod, i) => (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.1, ease: [0.16, 1, 0.3, 1] }}
              className="group"
            >
              <div className="p-8 rounded-3xl border border-lp-border bg-lp-bg-card hover:shadow-xl hover:-translate-y-1 transition-all duration-300 h-full flex flex-col relative overflow-hidden">
                {/* Subtle background glow on hover */}
                <div className={`absolute -right-10 -top-10 w-40 h-40 rounded-full blur-[50px] ${mod.color} opacity-0 group-hover:opacity-30 transition-opacity duration-500 pointer-events-none`} />
                
                <div className="flex items-center justify-between mb-6">
                  <div className={`w-12 h-12 rounded-2xl ${mod.color} flex items-center justify-center shadow-inner`}>
                    <mod.icon className="w-5 h-5 text-lp-bg-card mix-blend-overlay" />
                  </div>
                  <span className={`text-sm font-semibold ${mod.text}`}>{mod.progress}%</span>
                </div>
                
                <h3 className="text-xl font-semibold text-lp-text-primary mb-3 tracking-tight">{mod.name}</h3>
                <p className="text-sm text-lp-text-secondary leading-relaxed font-light mb-6 flex-1">{mod.description}</p>
                
                <div className="flex flex-col gap-2 mt-auto">
                  <div className="flex justify-between items-center text-xs text-lp-text-muted font-medium">
                    <span>{mod.topics} topics</span>
                    <span>Module {String(i + 1).padStart(2, "0")}</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full bg-lp-bg-secondary overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-1000 ${mod.color}`} style={{ width: `${mod.progress}%` }} />
                  </div>
                </div>
              </div>
            </motion.div>
          ))}

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          >
            <Link href="#features">
              <div className="p-8 rounded-3xl border border-dashed border-lp-border hover:border-lp-accent-blue transition-all duration-300 flex flex-col items-center justify-center text-center h-full bg-lp-bg-secondary/50 hover:bg-lp-bg-card group min-h-[250px]">
                <div className="w-14 h-14 rounded-full bg-lp-bg-card border border-lp-border flex items-center justify-center mb-4 group-hover:scale-110 group-hover:bg-lp-accent-blue transition-all duration-300 shadow-sm">
                  <ChevronRight size={20} className="text-lp-text-secondary group-hover:text-lp-bg-card transition-colors" />
                </div>
                <p className="font-medium text-lp-text-primary mb-1">View Full Curriculum</p>
                <p className="text-sm text-lp-text-muted font-light">52 weeks of structured learning</p>
              </div>
            </Link>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
