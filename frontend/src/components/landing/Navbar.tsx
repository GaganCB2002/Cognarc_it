"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { SignUpButton } from "@clerk/nextjs";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useAuth } from "@/lib/auth-context";
import { cn } from "@/lib/utils";
import { Menu, X } from "lucide-react";

const navLinks = [
  { href: "#features", label: "Features" },
  { href: "#curriculum", label: "Curriculum" },
  { href: "#testimonials", label: "Testimonials" },
  { href: "#pricing", label: "Pricing" },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [hoveredLink, setHoveredLink] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState("");
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const sections = navLinks.map(l => l.href.slice(1));
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveSection(entry.target.id);
        }
      });
    }, { rootMargin: "-40% 0px -55% 0px" });

    sections.forEach((id) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, []);

  const handleNavClick = useCallback((e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    const id = href.slice(1);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setMobileOpen(false);
  }, []);

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
        scrolled
          ? "py-3 bg-lp-bg-primary/75 backdrop-blur-2xl border-b border-lp-border/40 shadow-[0_1px_2px_rgba(26,26,46,0.02)]"
          : "py-5 bg-transparent"
      )}
    >
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-3 group relative z-10">
          <motion.div
            whileHover={{ scale: 1.05, rotate: -3 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
            className="w-9 h-9 rounded-xl bg-gradient-to-br from-lp-accent to-lp-accent-lavender flex items-center justify-center shadow-md shadow-lp-accent/20"
          >
            <span className="text-white font-bold text-sm tracking-tighter">ST</span>
          </motion.div>
          <motion.span
            className="text-xl font-semibold text-lp-text-primary tracking-tight"
            whileHover={{ letterSpacing: "0.02em" }}
            transition={{ duration: 0.3 }}
          >
            StudyTrack
          </motion.span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 bg-lp-bg-card/60 backdrop-blur-md rounded-2xl px-2 py-1.5 border border-lp-border/40 shadow-sm">
          {navLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={(e) => handleNavClick(e, item.href)}
              onMouseEnter={() => setHoveredLink(item.href)}
              onMouseLeave={() => setHoveredLink(null)}
              className={cn(
                "relative px-4 py-1.5 text-sm font-medium transition-colors rounded-xl z-10",
                activeSection === item.href.slice(1)
                  ? "text-lp-accent"
                  : "text-lp-text-secondary hover:text-lp-text-primary"
              )}
            >
              {item.label}
              {hoveredLink === item.href && (
                <motion.div
                  layoutId="nav-hover"
                  className="absolute inset-0 bg-lp-accent-soft rounded-xl -z-10"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              {activeSection === item.href.slice(1) && (
                <motion.div
                  layoutId="nav-active"
                  className="absolute bottom-0 left-3 right-3 h-0.5 bg-lp-accent rounded-full"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4 relative z-10">
          <motion.div whileHover={{ scale: 1.05 }}>
            <ThemeToggle />
          </motion.div>
          {!isAuthenticated ? (
            <>
              <Link href="/login">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="text-sm font-medium text-lp-text-secondary hover:text-lp-text-primary transition-colors px-4 py-2"
                >
                  Sign In
                </motion.button>
              </Link>
              <SignUpButton>
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="px-5 py-2 text-sm font-medium text-white bg-lp-accent rounded-full hover:shadow-lg hover:shadow-lp-accent/20 active:shadow-md transition-all duration-300"
                >
                  Get Started
                </motion.button>
              </SignUpButton>
            </>
          ) : (
            <Link href="/student/dashboard">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="px-5 py-2 text-sm font-medium text-white bg-lp-accent rounded-full hover:shadow-lg hover:shadow-lp-accent/20 transition-all duration-300"
              >
                Dashboard
              </motion.button>
            </Link>
          )}
        </div>

        <motion.button
          onClick={() => setMobileOpen(!mobileOpen)}
          whileTap={{ scale: 0.9 }}
          className="md:hidden relative w-10 h-10 flex items-center justify-center text-lp-text-primary bg-lp-bg-card/60 backdrop-blur-md rounded-xl border border-lp-border/40 z-20"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X size={18} /> : <Menu size={18} />}
        </motion.button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ opacity: 0, y: -12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            className="md:hidden absolute top-full left-4 right-4 mt-2 rounded-2xl border border-lp-border/40 bg-lp-bg-primary/95 backdrop-blur-2xl shadow-xl overflow-hidden"
          >
            <div className="px-4 py-5 flex flex-col gap-3">
              <nav className="flex flex-col gap-1">
                {navLinks.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={(e) => handleNavClick(e, item.href)}
                    className={cn(
                      "px-4 py-3 text-sm font-medium rounded-xl transition-colors",
                      activeSection === item.href.slice(1)
                        ? "text-lp-accent bg-lp-accent-soft"
                        : "text-lp-text-secondary hover:text-lp-text-primary hover:bg-lp-bg-tertiary/50"
                    )}
                  >
                    {item.label}
                  </Link>
                ))}
              </nav>
              <div className="h-px bg-lp-border/50 w-full" />
              <div className="flex flex-col gap-2">
                {!isAuthenticated ? (
                  <>
                    <Link href="/login" onClick={() => setMobileOpen(false)}>
                      <button className="w-full py-3 text-center text-sm font-medium text-lp-text-primary bg-lp-bg-tertiary/50 rounded-xl hover:bg-lp-border/30 transition-colors">
                        Sign In
                      </button>
                    </Link>
                    <SignUpButton>
                      <button className="w-full py-3 text-center text-sm font-medium text-white bg-lp-accent rounded-xl hover:opacity-90 transition-opacity">
                        Get Started
                      </button>
                    </SignUpButton>
                  </>
                ) : (
                  <Link href="/student/dashboard" onClick={() => setMobileOpen(false)}>
                    <button className="w-full py-3 text-center text-sm font-medium text-white bg-lp-accent rounded-xl hover:opacity-90 transition-opacity">
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
