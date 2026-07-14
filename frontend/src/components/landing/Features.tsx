"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motion } from "framer-motion";
import { 
  BarChart3, Database, MessageSquare, Target, 
  BookOpen, Calendar, Users, Trophy
} from "lucide-react";
import { Card } from "@/components/ui/Card";

gsap.registerPlugin(ScrollTrigger);

const featurePanels = [
  {
    id: "f1",
    title: "Mastery Analytics",
    desc: "Real-time progress tracking with detailed insights into your strengths and areas for improvement. Watch your skills grow week over week.",
    icon: BarChart3,
    color: "from-lp-accent-blue to-lp-accent-indigo",
    mockup: "dashboard-mockup"
  },
  {
    id: "f2",
    title: "Knowledge Vault",
    desc: "Store and organize all your learning materials — PDFs, videos, code snippets, and more. A personalized database just for you.",
    icon: Database,
    color: "from-lp-accent-sky to-lp-accent-indigo",
    mockup: "vault-mockup"
  },
  {
    id: "f3",
    title: "AI-Powered Mentorship",
    desc: "Get unblocked instantly with our integrated AI chat. Upload context, paste errors, and receive tailored guidance anytime.",
    icon: MessageSquare,
    color: "from-lp-accent-sage to-emerald-200",
    mockup: "chat-mockup"
  },
  {
    id: "f4",
    title: "Goal Tracking",
    desc: "Set weekly targets, track streaks, and maintain momentum with personalized reminders that adapt to your schedule.",
    icon: Target,
    color: "from-lp-accent-lavender to-purple-200",
    mockup: "goals-mockup"
  }
];

export function Features() {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const panelsRef = useRef<HTMLDivElement>(null);

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
          scrub: 1,
          end: () => `+=${totalWidth}`,
          invalidateOnRefresh: true,
        }
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <section id="features" className="relative bg-lp-bg-primary py-24" ref={containerRef}>
      
      <div className="max-w-7xl mx-auto px-6 mb-16 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <span className="text-xs font-semibold text-lp-accent-blue uppercase tracking-widest mb-4 block">Product Showcase</span>
          <h2 className="text-4xl md:text-6xl font-semibold text-lp-text-primary tracking-tight mb-6">
            Everything You Need to <span className="text-lp-accent-sage">Excel</span>
          </h2>
          <p className="text-lp-text-secondary text-lg md:text-xl max-w-2xl mx-auto font-light">
            A complete learning ecosystem with persistent data storage, file management, and real-time synchronization.
          </p>
        </motion.div>
      </div>

      {/* Horizontal Scroll Section */}
      <div ref={scrollWrapperRef} className="h-screen w-full flex items-center overflow-hidden bg-lp-bg-secondary rounded-3xl mx-4 sm:mx-8 shadow-inner border border-lp-border/50">
        <div ref={panelsRef} className="flex gap-8 px-12 md:px-32 w-max items-center h-full">
          {featurePanels.map((f, i) => (
            <div key={f.id} className="feature-panel w-[85vw] md:w-[60vw] lg:w-[45vw] flex-shrink-0 flex flex-col gap-8">
              
              {/* Text Content */}
              <div className="flex flex-col gap-4">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-lg`}>
                  <f.icon className="w-6 h-6 text-lp-bg-primary" />
                </div>
                <h3 className="text-3xl md:text-4xl font-semibold text-lp-text-primary tracking-tight">{f.title}</h3>
                <p className="text-lg text-lp-text-secondary font-light max-w-md">{f.desc}</p>
              </div>

              {/* Mockup Window */}
              <div className="w-full aspect-[4/3] rounded-2xl bg-lp-bg-card border border-lp-border shadow-2xl overflow-hidden relative flex flex-col">
                <div className="h-10 bg-lp-bg-secondary border-b border-lp-border flex items-center px-4 gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-400" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400" />
                  <div className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <div className="flex-1 bg-lp-bg-primary relative overflow-hidden flex items-center justify-center">
                  <div className={`absolute inset-0 opacity-20 bg-gradient-to-br ${f.color}`} />
                  {/* Abstract Representation of the Feature */}
                  <motion.div 
                    initial={{ scale: 0.8, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.2 }}
                    className="w-1/2 h-1/2 bg-white rounded-xl shadow-lg border border-lp-border flex items-center justify-center relative z-10"
                  >
                    <f.icon className="w-16 h-16 text-lp-text-muted/30" />
                  </motion.div>
                </div>
              </div>

            </div>
          ))}
        </div>
      </div>

    </section>
  );
}
