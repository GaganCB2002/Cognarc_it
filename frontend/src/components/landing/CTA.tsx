"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { useAuth } from "@/lib/auth-context";
import { ArrowRight } from "lucide-react";

export function CTA() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="py-32 md:py-48 relative overflow-hidden bg-lp-bg-primary">
      {/* Decorative Gradients */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent to-lp-accent-blue/5 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-gradient-to-r from-lp-accent-blue/20 via-lp-accent-sage/20 to-lp-accent-sky/20 rounded-full blur-[150px] animate-pulse pointer-events-none" />

      <div className="max-w-4xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40, scale: 0.95 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center"
        >
          <span className="text-xs font-semibold text-lp-accent-blue uppercase tracking-widest mb-6 block">Get Started</span>
          <h2 className="text-5xl md:text-7xl font-semibold text-lp-text-primary tracking-tighter mb-8 leading-[1.1]">
            Ready to Transform Your <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-lp-accent-blue via-lp-accent-sage to-lp-accent-sky">
              Engineering Career?
            </span>
          </h2>
          <p className="text-xl text-lp-text-secondary mb-12 max-w-2xl mx-auto font-light leading-relaxed">
            Join thousands of engineers who have accelerated their careers through systematic, structured mastery. Start your journey today.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
            {!isAuthenticated ? (
              <>
                <SignUpButton>
                  <button className="group relative inline-flex items-center justify-center gap-2 px-10 py-5 text-base font-medium text-lp-bg-primary bg-lp-text-primary rounded-full overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-2xl shadow-lp-text-primary/20">
                    <span className="relative z-10">Start Free Trial</span>
                    <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                    <div className="absolute inset-0 bg-gradient-to-r from-lp-accent-blue/30 via-lp-accent-sage/30 to-lp-accent-sky/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </button>
                </SignUpButton>
                <Link href="/login">
                  <button className="inline-flex items-center justify-center px-10 py-5 text-base font-medium text-lp-text-primary bg-transparent rounded-full border border-lp-border hover:bg-lp-bg-secondary transition-colors duration-300">
                    Sign In
                  </button>
                </Link>
              </>
            ) : (
              <Link href="/student/dashboard">
                <button className="group relative inline-flex items-center justify-center gap-2 px-10 py-5 text-base font-medium text-lp-bg-primary bg-lp-text-primary rounded-full overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-2xl shadow-lp-text-primary/20">
                  <span className="relative z-10">Go to Dashboard</span>
                  <ArrowRight size={18} className="relative z-10 group-hover:translate-x-1 transition-transform" />
                </button>
              </Link>
            )}
          </div>
          <p className="text-sm text-lp-text-muted mt-8 font-light">No credit card required. Free tier includes full curriculum access.</p>
        </motion.div>
      </div>
    </section>
  );
}
