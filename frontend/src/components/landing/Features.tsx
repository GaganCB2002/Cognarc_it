"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion, useInView } from "framer-motion";
import {
  BarChart3, Database, MessageSquare, Target, Sparkles
} from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const featurePanels = [
  {
    id: "f1",
    title: "Mastery Analytics",
    desc: "Real-time progress tracking with detailed insights into your strengths and areas for improvement. Watch your skills grow week over week.",
    icon: BarChart3,
    gradient: "from-lp-accent-sky to-lp-accent",
    features: ["Skill breakdown charts", "Predictive analytics", "Trend history"],
  },
  {
    id: "f2",
    title: "Knowledge Vault",
    desc: "Store and organize all your learning materials — PDFs, videos, code snippets, and more. A personalized database just for you.",
    icon: Database,
    gradient: "from-lp-accent-sage to-lp-accent-lavender",
    features: ["Unlimited storage", "AI-powered search", "Smart categorization"],
  },
  {
    id: "f3",
    title: "AI-Powered Mentorship",
    desc: "Get unblocked instantly with our integrated AI chat. Upload context, paste errors, and receive tailored guidance anytime.",
    icon: MessageSquare,
    gradient: "from-lp-accent-lavender to-lp-accent-peach",
    features: ["Context-aware answers", "Code review assistant", "24/7 availability"],
  },
  {
    id: "f4",
    title: "Goal Tracking",
    desc: "Set weekly targets, track streaks, and maintain momentum with personalized reminders that adapt to your schedule.",
    icon: Target,
    gradient: "from-lp-accent-gold to-lp-accent-peach",
    features: ["Custom milestones", "Streak tracking", "Progress alerts"],
  },
];

export function Features() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-100px" });

  useEffect(() => {
    if (!containerRef.current || !scrollWrapperRef.current || !panelsRef.current) return;

    const panels = gsap.utils.toArray(".feature-panel") as HTMLElement[];
    const totalWidth = panelsRef.current.scrollWidth - window.innerWidth;

    const ctx = gsap.context(() => {
      gsap.to(panels, {
        x: () => -totalWidth,
        ease: "none",
        scrollTrigger: {
          trigger: scrollWrapperRef.current,
          pin: true,
          scrub: 1.2,
          end: () => `+=${totalWidth}`,
          invalidateOnRefresh: true,
        },
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="features" className="relative overflow-hidden py-24" ref={containerRef}>
      <div className="absolute inset-0 bg-gradient-to-b from-lp-bg-primary via-lp-bg-secondary/20 to-lp-bg-primary pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 mb-16 text-center relative z-10">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: 0.5 }}
            className="text-xs font-semibold text-lp-accent uppercase tracking-[0.15em] mb-4 block"
          >
            Product Showcase
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-semibold text-lp-text-primary tracking-tight mb-6"
          >
            Everything You Need to{" "}
            <span className="gradient-text-premium">Excel</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-lp-text-secondary text-lg md:text-xl max-w-2xl mx-auto font-light"
          >
            A complete learning ecosystem with persistent data storage, file management, and real-time synchronization.
          </motion.p>
        </motion.div>
      </div>

      <div ref={scrollWrapperRef} className="h-screen w-full flex items-center overflow-hidden bg-lp-bg-secondary/20 rounded-none md:rounded-3xl md:mx-4 md:w-[calc(100%-2rem)] border-t md:border border-lp-border/30 shadow-inner">
        <div ref={panelsRef} className="flex gap-8 px-8 md:px-32 w-max items-center h-full">
          {featurePanels.map((f, i) => (
            <div key={f.id} className="feature-panel w-[85vw] md:w-[60vw] lg:w-[42vw] flex-shrink-0 flex flex-col gap-8 px-4">
              <div className="flex flex-col gap-4">
                <motion.div
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5 }}
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.gradient} flex items-center justify-center shadow-lg shadow-lp-accent/10`}
                >
                  <f.icon className="w-6 h-6 text-white" />
                </motion.div>
                <h3 className="text-3xl md:text-4xl font-semibold text-lp-text-primary tracking-tight">{f.title}</h3>
                <p className="text-base md:text-lg text-lp-text-secondary font-light max-w-lg">{f.desc}</p>
                <ul className="flex flex-wrap gap-2 mt-2">
                  {f.features.map((feat) => (
                    <li key={feat} className="text-xs font-medium text-lp-text-tertiary bg-lp-bg-card/60 backdrop-blur-sm border border-lp-border/30 px-3 py-1.5 rounded-full">
                      {feat}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="w-full aspect-[4/3] rounded-2xl bg-lp-bg-card border border-lp-border/40 shadow-xl overflow-hidden relative flex flex-col">
                <div className="h-10 bg-lp-bg-tertiary/50 border-b border-lp-border/30 flex items-center px-4 gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full opacity-60" style={{ backgroundColor: '#E8C4B8' }} />
                  <div className="w-2.5 h-2.5 rounded-full opacity-60" style={{ backgroundColor: '#D4A574' }} />
                  <div className="w-2.5 h-2.5 rounded-full opacity-60" style={{ backgroundColor: '#A8C5DA' }} />
                </div>
                <div className="flex-1 bg-gradient-to-br from-lp-bg-card to-lp-bg-tertiary/30 relative overflow-hidden flex items-center justify-center p-6">
                  <div className={`absolute inset-0 opacity-10 bg-gradient-to-br ${f.gradient}`} />
                  <div className="w-full h-full rounded-xl bg-lp-bg-card/80 backdrop-blur-sm border border-lp-border/30 shadow-lg flex flex-col p-4 gap-3 relative z-10">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-lg bg-gradient-to-br opacity-60" style={{
                          background: `linear-gradient(135deg, ${
                            i === 0 ? 'var(--color-lp-accent-sky)' : i === 1 ? 'var(--color-lp-accent-sage)' : i === 2 ? 'var(--color-lp-accent-lavender)' : 'var(--color-lp-accent-gold)'
                          }, transparent)`
                        }} />
                        <span className="text-xs font-medium text-lp-text-tertiary">{f.title}</span>
                      </div>
                      <Sparkles size={12} className="text-lp-accent opacity-50" />
                    </div>
                    <div className="flex-1 grid grid-cols-2 gap-2">
                      <div className="rounded-lg bg-lp-bg-tertiary/30 p-2">
                        <div className="h-1.5 rounded-full bg-lp-accent-sky/40 w-3/4 mb-1.5" />
                        <div className="h-1 rounded-full bg-lp-bg-tertiary/50 w-1/2" />
                      </div>
                      <div className="rounded-lg bg-lp-bg-tertiary/30 p-2">
                        <div className="h-1.5 rounded-full bg-lp-accent-lavender/40 w-2/3 mb-1.5" />
                        <div className="h-1 rounded-full bg-lp-bg-tertiary/50 w-1/2" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
