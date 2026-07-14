"use client";

import { useState, useRef, useCallback } from "react";
import Link from "next/link";
import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import type { MotionValue } from "framer-motion";
import { SignUpButton } from "@clerk/nextjs";
import { ArrowRight, Play, Sparkles, Shield, Zap, BarChart3, Users } from "lucide-react";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const Hero3D = dynamic(() => import("./Hero3D"), { ssr: false });

const floatingCardData = [
  { icon: BarChart3, label: "92% Skill Gain", gradient: "from-lp-accent-sky to-lp-accent-sky-light", x: -15, y: 10, delay: 0 },
  { icon: Shield, label: "Track Record", gradient: "from-lp-accent-sage to-lp-accent-sage-light", x: 20, y: -15, delay: 0.3 },
  { icon: Users, label: "2.4k+ Engineers", gradient: "from-lp-accent-lavender to-lp-accent-lavender-light", x: -10, y: -20, delay: 0.6 },
  { icon: Zap, label: "AI-Powered", gradient: "from-lp-accent-gold to-lp-accent-gold-light", x: 15, y: 15, delay: 0.9 },
];

const stats = [
  { value: "200+", label: "Learning Modules" },
  { value: "94%", label: "Completion Rate" },
  { value: "32x", label: "Skill Gain" },
];

function FloatingCard({ card, springX, springY }: { card: typeof floatingCardData[0]; springX: MotionValue<number>; springY: MotionValue<number> }) {
  const cardX = useTransform(springX, [-20, 20], [card.x * 0.3, -card.x * 0.3]);
  const cardY = useTransform(springY, [-20, 20], [card.y * 0.3, -card.y * 0.3]);
  const CardIcon = card.icon;

  return (
    <motion.div
      className="absolute"
      style={{ left: `${50 + card.x}%`, top: `${50 + card.y}%` }}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.8,
        delay: 1 + card.delay,
        ease: [0.16, 1, 0.3, 1],
      }}
    >
      <motion.div
        animate={{ y: [0, -6, 0] }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
          delay: card.delay * 2,
        }}
        style={{ x: cardX, y: cardY }}
        className="flex items-center gap-2.5 px-4 py-2.5 rounded-2xl bg-lp-bg-card/80 backdrop-blur-md border border-lp-border/50 shadow-lg shadow-lp-text-primary/5"
      >
        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${card.gradient} flex items-center justify-center`}>
          <CardIcon className="w-4 h-4 text-lp-text-primary" />
        </div>
        <span className="text-sm font-medium text-lp-text-primary whitespace-nowrap">{card.label}</span>
      </motion.div>
    </motion.div>
  );
}

export function Hero() {
  const { isAuthenticated } = useAuth();
  const [videoLoaded, setVideoLoaded] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const sectionRef = useRef<HTMLDivElement>(null);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  const springX = useSpring(mouseX, { stiffness: 100, damping: 30 });
  const springY = useSpring(mouseY, { stiffness: 100, damping: 30 });

  const glowX = useTransform(springX, [-20, 20], [-10, 10]);
  const glowY = useTransform(springY, [-20, 20], [-10, 10]);
  const glowX2 = useTransform(springX, [-20, 20], [10, -10]);
  const glowY2 = useTransform(springY, [-20, 20], [10, -10]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const rect = sectionRef.current?.getBoundingClientRect();
    if (!rect) return;
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    mouseX.set(x * 20);
    mouseY.set(y * 20);
    setMousePosition({ x: e.clientX, y: e.clientY });
  }, [mouseX, mouseY]);

  return (
    <section
      ref={sectionRef}
      onMouseMove={handleMouseMove}
      className="relative min-h-[900px] h-[100svh] w-full flex items-center justify-center overflow-hidden pt-20 bg-lp-bg-primary"
    >
      <div className="absolute inset-0 w-full h-full bg-lp-bg-primary">
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          className={cn(
            "absolute inset-0 w-full h-full object-cover transition-all duration-1500",
            videoLoaded ? "opacity-60" : "opacity-0"
          )}
          onLoadedData={() => setVideoLoaded(true)}
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-gradient-to-b from-lp-bg-primary/70 via-lp-bg-primary/40 to-lp-bg-primary" />
        <div className="absolute inset-0 bg-gradient-to-r from-lp-accent/10 via-transparent to-lp-accent-gold/10" />
      </div>

      <div className="absolute inset-0 w-full h-full pointer-events-none overflow-hidden">
        <motion.div
          className="absolute top-[15%] left-[10%] w-[500px] h-[500px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, var(--color-lp-accent-lavender) 0%, transparent 70%)",
            x: glowX, y: glowY,
          }}
        />
        <motion.div
          className="absolute bottom-[20%] right-[10%] w-[400px] h-[400px] rounded-full opacity-20"
          style={{
            background: "radial-gradient(circle, var(--color-lp-accent-sky) 0%, transparent 70%)",
            x: glowX2, y: glowY2,
          }}
        />
      </div>

      <Hero3D />

      <div className="absolute inset-0 pointer-events-none z-10">
        <div
          className="cursor-glow"
          style={{
            left: mousePosition.x,
            top: mousePosition.y,
            opacity: videoLoaded ? 1 : 0,
          }}
        />
      </div>

      <div className="relative z-20 max-w-7xl mx-auto px-6 w-full flex flex-col items-center text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
        >
          <motion.div
            whileHover={{ scale: 1.02 }}
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-lp-border/60 bg-lp-bg-card/50 backdrop-blur-md text-sm font-medium text-lp-text-secondary mb-8 shadow-sm group cursor-default"
          >
            <Sparkles className="w-3.5 h-3.5 text-lp-accent-gold" />
            <span>The New Era of Developer Growth</span>
            <span className="w-1.5 h-1.5 rounded-full bg-lp-accent-sage animate-pulse-soft" />
          </motion.div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-semibold tracking-tight text-lp-text-primary leading-[1.05] mb-6 max-w-6xl"
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
              <p className="text-2xl md:text-3xl font-semibold text-lp-text-primary tracking-tight">
                {stat.value}
              </p>
              <p className="text-xs text-lp-text-tertiary font-medium uppercase tracking-wider mt-1">
                {stat.label}
              </p>
            </div>
          ))}
        </motion.div>
      </div>

      <div className="absolute inset-0 pointer-events-none z-10 hidden lg:block">
        {floatingCardData.map((card) => (
          <FloatingCard key={card.label} card={card} springX={springX} springY={springY} />
        ))}
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
