"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { ArrowRight, Sparkles, BookOpen, BarChart3, MessageSquare, CheckCircle } from "lucide-react";

function FloatingWidget({ icon: Icon, label, value, color, delay, x, y }: {
  icon: React.ElementType; label: string; value: string; color: string; delay: number; x: number; y: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ delay, duration: 0.7, ease: "easeOut" }}
      className="absolute hidden xl:flex items-center gap-3 px-4 py-3 rounded-xl bg-white dark:bg-st-bg-card shadow-lg border border-st-border/60"
      style={{ left: `${x}%`, top: `${y}%` }}
    >
      <div className={`w-9 h-9 rounded-lg ${color} flex items-center justify-center shadow-sm`}>
        <Icon className="w-4 h-4 text-white" />
      </div>
      <div>
        <p className="text-xs text-st-text-muted">{label}</p>
        <p className="text-sm font-semibold text-st-text-primary">{value}</p>
      </div>
    </motion.div>
  );
}

export function Hero() {
  const { isAuthenticated } = useAuth();
  const [phraseIdx, setPhraseIdx] = useState(0);
  const phrases = ["Track every milestone", "Master your craft", "Own every skill"];

  useEffect(() => {
    const t = setInterval(() => setPhraseIdx(i => (i + 1) % phrases.length), 3000);
    return () => clearInterval(t);
  }, []);

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-24">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/4 -left-40 w-[500px] h-[500px] bg-st-accent/5 rounded-full blur-[150px]" />
        <div className="absolute bottom-1/3 -right-40 w-[500px] h-[500px] bg-st-accent/3 rounded-full blur-[150px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-st-accent/[0.02] rounded-full blur-[200px]" />
      </div>

      <FloatingWidget icon={BookOpen} label="Active Courses" value="12" color="bg-emerald-500" delay={1.0} x={5} y={22} />
      <FloatingWidget icon={BarChart3} label="Hours Tracked" value="247" color="bg-st-accent" delay={1.4} x={78} y={18} />
      <FloatingWidget icon={MessageSquare} label="AI Sessions" value="89" color="bg-violet-500" delay={1.8} x={82} y={62} />

      <div className="max-w-7xl mx-auto px-6 w-full relative">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full border border-st-border bg-white/50 dark:bg-st-bg-card/50 text-xs text-st-text-muted mb-8 backdrop-blur-sm">
              <Sparkles className="w-3 h-3 text-st-accent" />
              Advanced Training Protocol
            </div>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.15, ease: "easeOut" }}
            className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-st-text-primary leading-[1.05] mb-6"
          >
            Master{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-st-accent to-st-accent-hover">
              Software Engineering
            </span>
            <br />
            <span className="text-st-text-primary">Systematically</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
            className="text-lg md:text-xl text-st-text-secondary max-w-2xl mx-auto leading-relaxed mb-4 h-8"
          >
            <span className="relative">
              {phrases.map((p, i) => (
                <span key={p} className={`absolute left-1/2 -translate-x-1/2 whitespace-nowrap transition-all duration-500 ${i === phraseIdx ? "opacity-100" : "opacity-0"}`}>
                  {p}
                </span>
              ))}
            </span>
            <span className="inline-block w-0.5 h-5 bg-st-accent ml-1 animate-pulse" />
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.5, ease: "easeOut" }}
            className="flex flex-col sm:flex-row items-center gap-4 justify-center mt-10"
          >
            {!isAuthenticated ? (
              <>
                <SignUpButton>
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button size="lg" className="text-base px-8 bg-st-accent text-black hover:bg-st-accent-hover border-0 font-medium shadow-lg shadow-st-accent/20">
                      Start Your Journey <ArrowRight size={16} className="ml-2" />
                    </Button>
                  </motion.div>
                </SignUpButton>
                <Link href="#curriculum">
                  <Button variant="outline" size="lg" className="text-base px-8">
                    Explore Curriculum
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/student/dashboard">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button size="lg" className="text-base px-8 bg-st-accent text-black hover:bg-st-accent-hover border-0 font-medium shadow-lg shadow-st-accent/20">
                    Go to Dashboard <ArrowRight size={16} className="ml-2" />
                  </Button>
                </motion.div>
              </Link>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.9 }}
            className="flex items-center justify-center gap-6 mt-10"
          >
            <div className="flex -space-x-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-st-accent to-st-accent-hover border-2 border-white dark:border-st-bg-primary flex items-center justify-center text-xs font-bold text-white shadow-sm">
                  {String.fromCharCode(64 + i)}
                </div>
              ))}
            </div>
            <span className="text-sm text-st-text-secondary">
              <span className="text-st-text-primary font-semibold">2,400+</span> engineers already learning
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 1.1 }}
            className="flex items-center justify-center gap-4 mt-6 text-xs text-st-text-muted"
          >
            {["No credit card required", "Free forever plan", "Cancel anytime"].map(item => (
              <span key={item} className="flex items-center gap-1.5">
                <CheckCircle size={12} className="text-st-accent" />
                {item}
              </span>
            ))}
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="flex flex-col items-center gap-2">
          <span className="text-xs text-st-text-muted/60">Scroll to explore</span>
          <div className="w-5 h-8 rounded-full border-2 border-st-text-muted/30 flex items-start justify-center pt-1.5">
            <div className="w-1 h-2 rounded-full bg-st-text-muted/50" />
          </div>
        </motion.div>
      </motion.div>
    </section>
  );
}
