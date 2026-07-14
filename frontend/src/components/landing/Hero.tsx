"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SignUpButton } from "@clerk/nextjs";
import { ArrowRight, Play, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const stats = [
  { value: "200+", label: "Learning Modules" },
  { value: "94%", label: "Completion Rate" },
  { value: "32x", label: "Skill Gain" },
];

export function Hero() {
  const { isAuthenticated } = useAuth();
  const [videoLoaded, setVideoLoaded] = useState(false);

  return (
    <section className="relative min-h-[900px] h-[100svh] w-full flex items-center justify-center overflow-hidden pt-20 bg-lp-bg-primary">
      <div className="absolute inset-0 w-full h-full">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="auto"
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-opacity duration-1000",
            videoLoaded ? "opacity-80" : "opacity-0"
          )}
          onLoadedData={() => setVideoLoaded(true)}
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-lp-bg-primary/60 via-lp-bg-primary/30 to-lp-bg-primary" />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 w-full flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-lp-border/60 bg-lp-bg-card/50 backdrop-blur-md text-sm font-medium text-lp-text-secondary mb-8 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-lp-accent-gold" />
            <span>The New Era of Developer Growth</span>
            <span className="w-1.5 h-1.5 rounded-full bg-lp-accent-sage animate-pulse-soft" />
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-white leading-[1.05] mb-6 max-w-6xl"
        >
          Master Engineering{" "}
          <span className="gradient-text-premium animate-gradient inline-block">
            Systematically
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-xl text-lp-text-secondary max-w-2xl mx-auto leading-relaxed mb-10 font-light"
        >
          An operating system for your career. Track every milestone, master your craft, and own every skill with AI-driven intelligence.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center gap-4 justify-center"
        >
          {!isAuthenticated ? (
            <>
              <SignUpButton>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-medium text-white bg-lp-accent rounded-full overflow-hidden transition-all duration-300 shadow-xl shadow-lp-accent/20 hover:shadow-2xl hover:shadow-lp-accent/30"
                >
                  <span className="relative z-10">Start Your Journey</span>
                  <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </motion.button>
              </SignUpButton>
              <Link href="#features">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-medium text-lp-text-primary bg-lp-bg-card/60 backdrop-blur-md rounded-full border border-lp-border/50 hover:bg-lp-bg-card hover:shadow-lg hover:shadow-lp-border/20 transition-all duration-300"
                >
                  <Play size={16} className="text-lp-accent-gold" />
                  Watch Demo
                </motion.button>
              </Link>
            </>
          ) : (
            <Link href="/student/dashboard">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-medium text-white bg-lp-accent rounded-full overflow-hidden transition-all duration-300 shadow-xl shadow-lp-accent/20"
              >
                <span className="relative z-10">Go to Dashboard</span>
                <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-8 md:gap-12 mt-12"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl md:text-3xl font-semibold text-white tracking-tight">
                {stat.value}
              </p>
              <p className="text-xs text-lp-text-tertiary font-medium uppercase tracking-wider mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.8, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase tracking-[0.2em] text-lp-text-muted/60 font-medium">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-10 bg-gradient-to-b from-lp-text-muted/60 to-transparent"
        />
      </motion.div>
    </section>
  );
}
