"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { ArrowRight, Sparkles } from "lucide-react";
import dynamic from "next/dynamic";
import { useAuth } from "@/lib/auth-context";

const Hero3D = dynamic(() => import("./Hero3D"), { ssr: false });

export function Hero() {
  const { isAuthenticated } = useAuth();
  const [videoLoaded, setVideoLoaded] = useState(false);

  return (
    <section className="relative min-h-[800px] h-[100svh] w-full flex items-center justify-center overflow-hidden pt-20">
      {/* Background Video */}
      <div className="absolute inset-0 w-full h-full bg-lp-bg-primary">
        <video 
          autoPlay 
          loop 
          muted 
          playsInline 
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoLoaded ? "opacity-20" : "opacity-0"}`}
          onLoadedData={() => setVideoLoaded(true)}
        >
          {/* Placeholder for high-quality background video */}
          <source src="https://cdn.pixabay.com/video/2021/08/04/83896-584742517_large.mp4" type="video/mp4" />
        </video>
        {/* Pastel overlay for readability */}
        <div className="absolute inset-0 bg-lp-bg-primary/80 backdrop-blur-[4px]" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-lp-bg-primary/40 to-lp-bg-primary" />
      </div>

      <Hero3D />

      <div className="relative z-20 max-w-7xl mx-auto px-6 w-full flex flex-col items-center text-center">
        <motion.div 
          initial={{ opacity: 0, y: 30 }} 
          animate={{ opacity: 1, y: 0 }} 
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-lp-border bg-lp-bg-card/40 backdrop-blur-md text-sm font-medium text-lp-text-secondary mb-8 shadow-sm">
            <Sparkles className="w-4 h-4 text-lp-accent-blue" />
            <span>The New Era of Developer Growth</span>
          </div>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
          className="text-5xl sm:text-6xl md:text-8xl font-semibold tracking-tighter text-lp-text-primary leading-[1.05] mb-6 max-w-5xl"
        >
          Master Engineering <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-lp-accent-blue via-lp-accent-sage to-lp-accent-sky">
            Systematically
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="text-lg md:text-2xl text-lp-text-secondary max-w-2xl mx-auto leading-relaxed mb-10 font-light"
        >
          An operating system for your career. Track every milestone, master your craft, and own every skill with AI-driven intelligence.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row items-center gap-4 justify-center"
        >
          {!isAuthenticated ? (
            <>
              <SignUpButton>
                <button className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-medium text-lp-bg-primary bg-lp-text-primary rounded-full overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-lp-text-primary/10">
                  <span className="relative z-10">Start Your Journey</span>
                  <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                  <div className="absolute inset-0 bg-gradient-to-r from-lp-accent-blue/20 via-lp-accent-sage/20 to-lp-accent-sky/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                </button>
              </SignUpButton>
              <Link href="#features">
                <button className="inline-flex items-center justify-center px-8 py-4 text-sm font-medium text-lp-text-primary bg-lp-bg-card/50 backdrop-blur-md rounded-full border border-lp-border hover:bg-lp-bg-card transition-colors duration-300">
                  Watch Demo
                </button>
              </Link>
            </>
          ) : (
            <Link href="/student/dashboard">
              <button className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-medium text-lp-bg-primary bg-lp-text-primary rounded-full overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-lp-text-primary/10">
                <span className="relative z-10">Go to Dashboard</span>
                <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          )}
        </motion.div>
      </div>

      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-10 overflow-hidden mix-blend-soft-light opacity-50">
        <div className="absolute top-[20%] left-[30%] w-[600px] h-[600px] bg-lp-accent-blue/30 rounded-full blur-[120px] animate-pulse" />
        <div className="absolute top-[40%] right-[20%] w-[500px] h-[500px] bg-lp-accent-sky/20 rounded-full blur-[100px] animate-breathe" />
      </div>
      
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 1 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-2"
      >
        <span className="text-xs uppercase tracking-widest text-lp-text-muted/80">Scroll</span>
        <motion.div 
          animate={{ y: [0, 8, 0] }} 
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          className="w-[1px] h-12 bg-gradient-to-b from-lp-text-muted/80 to-transparent" 
        />
      </motion.div>
    </section>
  );
}
