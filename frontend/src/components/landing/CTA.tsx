"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { ArrowRight } from "lucide-react";

export function CTA() {
  const { isAuthenticated } = useAuth();

  return (
    <section className="py-24 md:py-32 relative overflow-hidden border-t border-st-border">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-st-accent/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-4xl mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-xs font-semibold text-st-accent uppercase tracking-widest mb-4 block">Get Started</span>
          <h2 className="text-3xl md:text-5xl font-bold text-st-text-primary tracking-tight mb-6">
            Ready to Transform Your{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-st-accent to-st-accent-hover">
              Engineering Career
            </span>
            ?
          </h2>
          <p className="text-lg text-st-text-secondary mb-10 max-w-xl mx-auto leading-relaxed">
            Join thousands of engineers who have accelerated their careers through systematic, structured mastery. Start your journey today.
          </p>
          <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
            {!isAuthenticated ? (
              <>
                <Link href="/register">
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button size="lg" className="text-base px-10 bg-st-accent text-black hover:bg-st-accent-hover border-0 font-medium shadow-lg shadow-st-accent/20">
                      Start Free <ArrowRight size={16} className="ml-2" />
                    </Button>
                  </motion.div>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="text-base px-10">
                    Sign In
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/student/dashboard">
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button size="lg" className="text-base px-10 bg-st-accent text-black hover:bg-st-accent-hover border-0 font-medium shadow-lg shadow-st-accent/20">
                    Go to Dashboard <ArrowRight size={16} className="ml-2" />
                  </Button>
                </motion.div>
              </Link>
            )}
          </div>
          <p className="text-xs text-st-text-muted mt-6">No credit card required. Free tier includes full curriculum access.</p>
        </motion.div>
      </div>
    </section>
  );
}
