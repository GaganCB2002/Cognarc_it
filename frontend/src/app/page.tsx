"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  BookOpen, Calendar, BarChart3, MessageSquare,
  ArrowRight, Menu, X, ChevronRight, Database
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const features = [
  { icon: BookOpen, title: "Structured Curriculum", description: "Industry-vetted learning paths designed by senior engineers to take you from intermediate to expert." },
  { icon: Calendar, title: "Smart Scheduling", description: "AI-powered study planner that adapts to your availability and learning pace." },
  { icon: BarChart3, title: "Mastery Analytics", description: "Real-time progress tracking with detailed insights into your strengths and areas for improvement." },
  { icon: MessageSquare, title: "Community Forum", description: "Collaborate with peers, get mentorship from experts, and participate in technical discussions." },
];

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  return (
    <div className="flex flex-col min-h-screen">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-st-border bg-st-bg-primary/90 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-8 h-8 bg-st-accent rounded-lg flex items-center justify-center">
              <span className="font-bold text-white text-sm">S</span>
            </div>
            <span className="text-lg font-semibold text-st-text-primary">StudyTrack</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="#features" className="text-sm text-st-text-secondary hover:text-st-text-primary transition-colors">Features</Link>
            <Link href="#about" className="text-sm text-st-text-secondary hover:text-st-text-primary transition-colors">About</Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {!isAuthenticated ? (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-sm">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button className="text-sm bg-st-accent text-black hover:bg-st-accent-hover border-0 font-medium">
                    Get Started
                  </Button>
                </Link>
              </>
            ) : (
              <Link href="/dashboard">
                <Button variant="ghost" className="text-sm">Dashboard</Button>
              </Link>
            )}
          </div>

          <button className="md:hidden text-st-text-primary" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-st-border bg-st-bg-primary px-6 py-4 space-y-3">
            <nav className="flex flex-col gap-2">
              <Link href="#features" className="text-st-text-secondary py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>Features</Link>
              <Link href="#about" className="text-st-text-secondary py-2 text-sm" onClick={() => setMobileMenuOpen(false)}>About</Link>
            </nav>
            <div className="pt-2 border-t border-st-border flex gap-2">
              <ThemeToggle />
            </div>
            <div className="flex flex-col gap-2 pt-2">
              {!isAuthenticated ? (
                <>
                  <Link href="/login"><Button variant="ghost" className="w-full text-sm">Sign In</Button></Link>
                  <Link href="/register"><Button className="w-full bg-st-accent text-black text-sm border-0">Get Started</Button></Link>
                </>
              ) : (
                <Link href="/dashboard"><Button variant="ghost" className="w-full text-sm">Dashboard</Button></Link>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative pt-32 pb-24 md:pt-40 md:pb-32 overflow-hidden">
          <div className="absolute top-1/3 left-1/4 w-[500px] h-[500px] bg-st-accent/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 relative">
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: "easeOut" }}
              className="max-w-3xl mx-auto text-center"
            >
              <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-st-text-primary leading-tight mb-6">
                Master{" "}
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-st-accent to-st-accent-hover">
                  Software Engineering
                </span>
                <br />
                Systematically
              </h1>
              <p className="text-lg text-st-text-secondary max-w-2xl mx-auto leading-relaxed mb-10">
                A learning platform designed for deep work and technical rigor.
                Track every milestone, own every skill.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                {!isAuthenticated ? (
                  <>
                    <Link href="/register">
                      <Button size="lg" className="text-base px-8 bg-st-accent text-black hover:bg-st-accent-hover border-0 font-medium">
                        Start Learning <ArrowRight size={16} className="ml-2" />
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="outline" size="lg" className="text-base px-8">
                        Sign In
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Link href="/dashboard">
                    <Button size="lg" className="text-base px-8 bg-st-accent text-black hover:bg-st-accent-hover border-0 font-medium">
                      Go to Dashboard <ArrowRight size={16} className="ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Grid */}
        <section id="features" className="py-20 md:py-28 border-t border-st-border">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="text-center mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-st-text-primary mb-4">
                Everything you need to level up
              </h2>
              <p className="text-st-text-secondary max-w-xl mx-auto">
                A complete learning ecosystem designed for engineers who want to master their craft.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {features.map((feature, i) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                >
                  <Card className="p-6 h-full">
                    <div className="w-10 h-10 rounded-lg bg-st-accent/10 flex items-center justify-center mb-4">
                      <feature.icon size={20} className="text-st-accent" />
                    </div>
                    <h3 className="font-semibold text-st-text-primary mb-2">{feature.title}</h3>
                    <p className="text-sm text-st-text-secondary leading-relaxed">{feature.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* About / CTA Section */}
        <section id="about" className="py-20 md:py-28 bg-st-bg-secondary/30 border-t border-st-border">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="max-w-2xl mx-auto text-center"
            >
              <h2 className="text-3xl md:text-4xl font-bold text-st-text-primary mb-4">
                Ready to transform your career?
              </h2>
              <p className="text-st-text-secondary mb-8">
                Join engineers who are systematically mastering software engineering through structured learning paths and data-driven progress tracking.
              </p>
              <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
                {!isAuthenticated ? (
                  <>
                    <Link href="/register">
                      <Button size="lg" className="px-8 bg-st-accent text-black hover:bg-st-accent-hover border-0 font-medium">
                        Get Started Free <ArrowRight size={16} className="ml-2" />
                      </Button>
                    </Link>
                    <Link href="/login">
                      <Button variant="outline" size="lg" className="px-8">
                        Sign In
                      </Button>
                    </Link>
                  </>
                ) : (
                  <Link href="/dashboard">
                    <Button size="lg" className="px-8 bg-st-accent text-black hover:bg-st-accent-hover border-0 font-medium">
                      Go to Dashboard <ArrowRight size={16} className="ml-2" />
                    </Button>
                  </Link>
                )}
              </div>
            </motion.div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-st-border bg-st-bg-primary">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-7 h-7 bg-st-accent rounded flex items-center justify-center">
                <span className="font-bold text-white text-xs">S</span>
              </div>
              <span className="text-sm font-semibold text-st-text-primary">StudyTrack</span>
            </div>
            <p className="text-xs text-st-text-muted">2026 StudyTrack. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
