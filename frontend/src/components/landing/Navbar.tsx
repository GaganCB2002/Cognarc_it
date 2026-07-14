"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#curriculum", label: "Curriculum" },
  { href: "#mastery", label: "Mastery" },
  { href: "#forum", label: "Forum" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "py-3 bg-lp-bg-primary/70 backdrop-blur-2xl border-b border-lp-border/50 shadow-sm"
          : "py-5 bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 group relative z-10">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-lp-accent-blue to-lp-accent-indigo flex items-center justify-center group-hover:scale-105 transition-transform duration-300 shadow-sm">
            <span className="text-lp-bg-primary font-bold text-sm tracking-tighter">ST</span>
          </div>
          <span className="text-xl font-semibold text-lp-text-primary tracking-tight">StudyTrack</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 bg-lp-bg-card/50 backdrop-blur-md rounded-full px-2 py-1.5 border border-lp-border/50 shadow-sm">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onMouseEnter={() => setHoveredLink(item.href)}
              onMouseLeave={() => setHoveredLink(null)}
              className="relative px-4 py-1.5 text-sm font-medium text-lp-text-secondary hover:text-lp-text-primary transition-colors z-10"
            >
              {item.label}
              {hoveredLink === item.href && (
                <motion.div
                  layoutId="nav-hover"
                  className="absolute inset-0 bg-lp-bg-secondary rounded-full -z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4 relative z-10">
          <ThemeToggle />
          {!isAuthenticated ? (
            <>
              <Link href="/login">
                <button className="text-sm font-medium text-lp-text-secondary hover:text-lp-text-primary transition-colors">
                  Sign In
                </button>
              </Link>
              <SignUpButton>
                <button className="px-5 py-2 text-sm font-medium text-lp-bg-primary bg-lp-text-primary rounded-full hover:scale-105 active:scale-95 transition-all shadow-md shadow-lp-text-primary/10">
                  Get Started
                </button>
              </SignUpButton>
            </>
          ) : (
            <Link href="/student/dashboard">
              <button className="px-5 py-2 text-sm font-medium text-lp-bg-primary bg-lp-text-primary rounded-full hover:scale-105 active:scale-95 transition-all shadow-md shadow-lp-text-primary/10">
                Dashboard
              </button>
            </Link>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden relative w-10 h-10 flex items-center justify-center text-lp-text-primary bg-lp-bg-card/50 backdrop-blur-md rounded-full border border-lp-border/50 z-20"
          aria-label="Toggle menu"
        >
          <span className={cn("block w-4 h-px bg-current absolute transition-all duration-300", mobileOpen ? "rotate-45" : "-translate-y-1")} />
          <span className={cn("block w-4 h-px bg-current absolute transition-all duration-300", mobileOpen ? "opacity-0" : "")} />
          <span className={cn("block w-4 h-px bg-current absolute transition-all duration-300", mobileOpen ? "-rotate-45" : "translate-y-1")} />
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="md:hidden absolute top-full left-0 right-0 border-b border-lp-border bg-lp-bg-primary/95 backdrop-blur-2xl shadow-xl overflow-hidden"
          >
            <div className="px-6 py-6 flex flex-col gap-4">
              <nav className="flex flex-col gap-2">
                {navLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="px-4 py-3 text-base font-medium text-lp-text-secondary hover:text-lp-text-primary hover:bg-lp-bg-secondary rounded-xl transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="h-px bg-lp-border w-full" />
              <div className="flex flex-col gap-3">
                {!isAuthenticated ? (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      <button className="w-full py-3 text-center text-sm font-medium text-lp-text-primary bg-lp-bg-secondary rounded-xl hover:bg-lp-border transition-colors">
                        Sign In
                      </button>
                    </Link>
                    <SignUpButton>
                      <button className="w-full py-3 text-center text-sm font-medium text-lp-bg-primary bg-lp-text-primary rounded-xl hover:opacity-90 transition-opacity">
                        Get Started
                      </button>
                    </SignUpButton>
                  </>
                ) : (
                  <Link href="/student/dashboard" onClick={() => setMobileOpen(false)}>
                    <button className="w-full py-3 text-center text-sm font-medium text-lp-bg-primary bg-lp-text-primary rounded-xl hover:opacity-90 transition-opacity">
                      Dashboard
                    </button>
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
