"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SignInButton, SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "#curriculum", label: "Curriculum" },
  { href: "#schedule", label: "Schedule" },
  { href: "#mastery", label: "Mastery" },
  { href: "#forum", label: "Forum" },
  { href: "#features", label: "Features" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "bg-st-bg-primary/80 backdrop-blur-xl border-b border-st-border"
          : "bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-xl bg-st-accent flex items-center justify-center group-hover:scale-105 transition-transform">
            <span className="text-white font-bold text-sm">S</span>
          </div>
          <span className="text-lg font-semibold text-st-text-primary tracking-tight">StudyTrack</span>
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="text-sm text-st-text-secondary hover:text-st-text-primary transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-3">
          <ThemeToggle />
          {!isAuthenticated ? (
            <>
              <SignInButton>
                <Button variant="ghost" size="sm" className="text-sm">
                  Sign In
                </Button>
              </SignInButton>
              <SignUpButton>
                <Button size="sm" className="text-sm bg-st-accent text-black hover:bg-st-accent-hover border-0 font-medium">
                  Get Started
                </Button>
              </SignUpButton>
            </>
          ) : (
            <Link href="/student/dashboard">
              <Button variant="ghost" size="sm" className="text-sm">
                Dashboard
              </Button>
            </Link>
          )}
        </div>

        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="md:hidden relative w-9 h-9 flex items-center justify-center text-st-text-secondary"
          aria-label="Toggle menu"
        >
          <span className={cn(
            "block w-5 h-px bg-current absolute transition-all duration-200",
            mobileOpen ? "rotate-45" : "-translate-y-1.5"
          )} />
          <span className={cn(
            "block w-5 h-px bg-current absolute transition-all duration-200",
            mobileOpen ? "opacity-0" : ""
          )} />
          <span className={cn(
            "block w-5 h-px bg-current absolute transition-all duration-200",
            mobileOpen ? "-rotate-45" : "translate-y-1.5"
          )} />
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden border-t border-st-border bg-st-bg-primary/95 backdrop-blur-xl overflow-hidden"
          >
            <div className="px-6 py-4 space-y-3">
              <nav className="flex flex-col gap-1">
                {navLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setMobileOpen(false)}
                    className="px-3 py-2 text-sm text-st-text-secondary hover:text-st-text-primary hover:bg-st-bg-elevated/50 rounded-lg transition-colors"
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="pt-2 border-t border-st-border flex items-center gap-3 px-3">
                <ThemeToggle />
                <span className="text-xs text-st-text-muted">Toggle theme</span>
              </div>
              <div className="flex flex-col gap-2 pt-1">
                {!isAuthenticated ? (
                  <>
                    <SignInButton>
                      <Button variant="ghost" className="w-full text-sm">Sign In</Button>
                    </SignInButton>
                    <SignUpButton>
                      <Button className="w-full bg-st-accent text-black border-0 text-sm">Get Started</Button>
                    </SignUpButton>
                  </>
                ) : (
                  <Link href="/student/dashboard" onClick={() => setMobileOpen(false)}>
                    <Button variant="ghost" className="w-full text-sm">Dashboard</Button>
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
