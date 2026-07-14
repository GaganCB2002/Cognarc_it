"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { SignUpButton } from "@clerk/nextjs";
import { useAuth } from "@/lib/auth-context";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTA() {
  const { isAuthenticated } = useAuth();
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <section className="py-32 md:py-48 relative overflow-hidden bg-lp-bg-primary" ref={ref}>
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-lp-accent/5 to-lp-accent-peach/5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[900px] bg-gradient-to-r from-lp-accent/10 via-lp-accent-sky/10 to-lp-accent-gold/10 rounded-full blur-[200px] pointer-events-none" />

      <motion.div
        animate={{
          scale: [1, 1.02, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-1/3 left-1/4 w-64 h-64 rounded-full bg-lp-accent/10 blur-[100px] pointer-events-none"
      />
      <motion.div
        animate={{
          scale: [1, 1.03, 1],
          opacity: [0.2, 0.4, 0.2],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut", delay: 1 }}
        className="absolute bottom-1/3 right-1/4 w-64 h-64 rounded-full bg-lp-accent-gold/10 blur-[100px] pointer-events-none"
      />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          animate={inView ? { opacity: 1, y: 0, scale: 1 } : { opacity: 0, y: 40, scale: 0.95 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="inline-flex items-center gap-2 text-xs font-semibold text-lp-accent uppercase tracking-[0.15em] mb-6 px-4 py-1.5 rounded-full bg-lp-accent-soft border border-lp-accent/20"
          >
            <Sparkles size={12} />
            Get Started
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-5xl md:text-7xl lg:text-8xl font-semibold text-lp-text-primary tracking-tighter mb-8 leading-[1.1]"
          >
            Ready to Transform Your{" "}
            <span className="gradient-text-premium">Engineering Career?</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="text-lg md:text-xl text-lp-text-secondary mb-12 max-w-2xl mx-auto font-light leading-relaxed"
          >
            Join thousands of engineers who have accelerated their careers through systematic, structured mastery. Start your journey today.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="flex flex-col sm:flex-row items-center gap-5 justify-center"
          >
            {!isAuthenticated ? (
              <>
                <SignUpButton>
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="group relative inline-flex items-center justify-center gap-2 px-10 py-5 text-base font-medium text-white bg-lp-accent rounded-full overflow-hidden transition-all duration-300 shadow-2xl shadow-lp-accent/30 hover:shadow-3xl hover:shadow-lp-accent/40"
                  >
                    <span className="relative z-10">Start Free Trial</span>
                    <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-r from-white/10 via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </motion.button>
                </SignUpButton>
                <Link href="/login">
                  <motion.button
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className="inline-flex items-center justify-center gap-2 px-10 py-5 text-base font-medium text-lp-text-primary bg-lp-bg-card/60 backdrop-blur-md rounded-full border border-lp-border/40 hover:bg-lp-bg-card hover:border-lp-accent/30 hover:shadow-lg transition-all duration-300"
                  >
                    Sign In
                    <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                  </motion.button>
                </Link>
              </>
            ) : (
              <Link href="/student/dashboard">
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative inline-flex items-center justify-center gap-2 px-10 py-5 text-base font-medium text-white bg-lp-accent rounded-full overflow-hidden transition-all duration-300 shadow-2xl shadow-lp-accent/30"
                >
                  <span className="relative z-10">Go to Dashboard</span>
                  <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              </Link>
            )}
          </motion.div>
          <motion.p
            initial={{ opacity: 0 }}
            animate={inView ? { opacity: 1 } : { opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-xs text-lp-text-tertiary mt-6 font-light"
          >
            No credit card required. Free tier includes full curriculum access.
          </motion.p>
        </motion.div>
      </div>
    </section>
  );
}
