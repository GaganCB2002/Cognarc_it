"use client";

import { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SignUpButton } from "@clerk/nextjs";
import { ArrowRight, Play } from "lucide-react";
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
            videoLoaded ? "opacity-70" : "opacity-0"
          )}
          onLoadedData={() => setVideoLoaded(true)}
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-lp-bg-primary/70 via-lp-bg-primary/40 to-lp-bg-primary" />
        <div className="absolute inset-0 bg-gradient-to-r from-lp-accent/5 via-transparent to-lp-accent-secondary/5" />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 w-full flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-lp-border/50 bg-lp-bg-card/80 text-sm font-medium text-lp-text-secondary mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-lp-accent" />
            <span>The New Era of Developer Growth</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1 }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-white leading-[1.05] mb-6 max-w-6xl"
        >
          Master Engineering{" "}
          <span className="text-lp-accent">Systematically</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-lg md:text-xl text-white/80 max-w-2xl mx-auto leading-relaxed mb-10"
        >
          An operating system for your career. Track every milestone, master your craft, and own every skill with AI-driven intelligence.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row items-center gap-4 justify-center"
        >
          {!isAuthenticated ? (
            <>
              <SignUpButton>
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-medium text-white bg-lp-accent rounded-full hover:shadow-lg hover:shadow-lp-accent/20 transition-all duration-300"
                >
                  Start Your Journey
                  <ArrowRight size={16} />
                </motion.button>
              </SignUpButton>
              <Link href="#features">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-medium text-lp-text-primary bg-white/90 rounded-full border border-lp-border/50 hover:bg-white transition-all duration-300"
                >
                  <Play size={16} className="text-lp-accent" />
                  Watch Demo
                </motion.button>
              </Link>
            </>
          ) : (
            <Link href="/student/dashboard">
              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.97 }}
                className="inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-medium text-white bg-lp-accent rounded-full hover:shadow-lg hover:shadow-lp-accent/20 transition-all duration-300"
              >
                Go to Dashboard
                <ArrowRight size={16} />
              </motion.button>
            </Link>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex items-center gap-8 md:gap-12 mt-12"
        >
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <p className="text-2xl md:text-3xl font-bold text-white tracking-tight">
                {stat.value}
              </p>
              <p className="text-xs text-white/60 font-medium uppercase tracking-wider mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
      >
        <span className="text-[10px] uppercase tracking-[0.2em] text-white/40 font-medium">Scroll</span>
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-px h-10 bg-gradient-to-b from-white/40 to-transparent"
        />
      </motion.div>
    </section>
  );
}
