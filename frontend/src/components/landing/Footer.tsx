"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Footer() {
  return (
    <footer className="border-t border-lp-border bg-lp-bg-card relative z-10">
      <div className="max-w-7xl mx-auto px-6 py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-12 mb-16">
          <div className="col-span-2 lg:col-span-2">
            <Link href="/" className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-lp-accent-blue to-lp-accent-indigo flex items-center justify-center shadow-sm">
                <span className="text-lp-bg-primary font-bold text-xs tracking-tighter">ST</span>
              </div>
              <span className="text-lg font-semibold text-lp-text-primary tracking-tight">StudyTrack</span>
            </Link>
            <p className="text-sm text-lp-text-secondary max-w-sm leading-relaxed font-light">
              Building the next generation of software engineers through systemic mastery and data-driven learning.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-lp-text-primary uppercase tracking-widest mb-6">Platform</h3>
            <ul className="space-y-4">
              <li><Link href="#features" className="text-sm text-lp-text-secondary hover:text-lp-text-primary transition-colors font-light">Features</Link></li>
              <li><Link href="#curriculum" className="text-sm text-lp-text-secondary hover:text-lp-text-primary transition-colors font-light">Curriculum</Link></li>
              <li><Link href="#mastery" className="text-sm text-lp-text-secondary hover:text-lp-text-primary transition-colors font-light">Mastery Analytics</Link></li>
              <li><Link href="#forum" className="text-sm text-lp-text-secondary hover:text-lp-text-primary transition-colors font-light">Community Forum</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-lp-text-primary uppercase tracking-widest mb-6">Resources</h3>
            <ul className="space-y-4">
              <li><Link href="#" className="text-sm text-lp-text-secondary hover:text-lp-text-primary transition-colors font-light">Documentation</Link></li>
              <li><Link href="#" className="text-sm text-lp-text-secondary hover:text-lp-text-primary transition-colors font-light">API Reference</Link></li>
              <li><Link href="#" className="text-sm text-lp-text-secondary hover:text-lp-text-primary transition-colors font-light">Blog</Link></li>
              <li><Link href="#" className="text-sm text-lp-text-secondary hover:text-lp-text-primary transition-colors font-light">Guides</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-lp-text-primary uppercase tracking-widest mb-6">Company</h3>
            <ul className="space-y-4">
              <li><Link href="#" className="text-sm text-lp-text-secondary hover:text-lp-text-primary transition-colors font-light">About Us</Link></li>
              <li><Link href="#" className="text-sm text-lp-text-secondary hover:text-lp-text-primary transition-colors font-light">Careers</Link></li>
              <li><Link href="#" className="text-sm text-lp-text-secondary hover:text-lp-text-primary transition-colors font-light">Privacy Policy</Link></li>
              <li><Link href="#" className="text-sm text-lp-text-secondary hover:text-lp-text-primary transition-colors font-light">Terms of Service</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-lp-border">
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <span className="text-xs text-lp-text-muted font-medium">Toggle dashboard theme</span>
          </div>
          <p className="text-sm text-lp-text-muted font-light">© 2026 StudyTrack Inc. All rights reserved.</p>
          <div className="flex items-center gap-6 text-sm text-lp-text-muted font-light">
            <Link href="#" className="hover:text-lp-text-primary transition-colors">Twitter</Link>
            <Link href="#" className="hover:text-lp-text-primary transition-colors">GitHub</Link>
            <Link href="#" className="hover:text-lp-text-primary transition-colors">LinkedIn</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
