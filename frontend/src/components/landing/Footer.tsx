"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

export function Footer() {
  return (
    <footer className="border-t border-st-border bg-st-bg-primary">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
          <div className="col-span-2 md:col-span-1">
            <Link href="/" className="flex items-center gap-2.5 mb-4">
              <div className="w-7 h-7 rounded-lg bg-st-accent flex items-center justify-center">
                <span className="text-white font-bold text-xs">S</span>
              </div>
              <span className="text-base font-semibold text-st-text-primary">StudyTrack</span>
            </Link>
            <p className="text-sm text-st-text-secondary max-w-xs leading-relaxed">
              Building the next generation of software engineers through systemic mastery and data-driven learning.
            </p>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-st-text-muted uppercase tracking-wider mb-4">Platform</h3>
            <ul className="space-y-2.5">
              <li><Link href="#curriculum" className="text-sm text-st-text-secondary hover:text-st-accent transition-colors">Curriculum</Link></li>
              <li><Link href="#schedule" className="text-sm text-st-text-secondary hover:text-st-accent transition-colors">Schedule</Link></li>
              <li><Link href="#mastery" className="text-sm text-st-text-secondary hover:text-st-accent transition-colors">Mastery</Link></li>
              <li><Link href="#forum" className="text-sm text-st-text-secondary hover:text-st-accent transition-colors">Forum</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-st-text-muted uppercase tracking-wider mb-4">Resources</h3>
            <ul className="space-y-2.5">
              <li><Link href="#" className="text-sm text-st-text-secondary hover:text-st-accent transition-colors">Documentation</Link></li>
              <li><Link href="#" className="text-sm text-st-text-secondary hover:text-st-accent transition-colors">API Reference</Link></li>
              <li><Link href="#" className="text-sm text-st-text-secondary hover:text-st-accent transition-colors">Blog</Link></li>
              <li><Link href="#" className="text-sm text-st-text-secondary hover:text-st-accent transition-colors">Community</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="text-xs font-semibold text-st-text-muted uppercase tracking-wider mb-4">Company</h3>
            <ul className="space-y-2.5">
              <li><Link href="#" className="text-sm text-st-text-secondary hover:text-st-accent transition-colors">About</Link></li>
              <li><Link href="#" className="text-sm text-st-text-secondary hover:text-st-accent transition-colors">Careers</Link></li>
              <li><Link href="#" className="text-sm text-st-text-secondary hover:text-st-accent transition-colors">Privacy</Link></li>
              <li><Link href="#" className="text-sm text-st-text-secondary hover:text-st-accent transition-colors">Terms</Link></li>
            </ul>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pt-8 border-t border-st-border">
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="text-xs text-st-text-muted">Toggle theme</span>
          </div>
          <div className="flex items-center gap-6 text-xs text-st-text-muted">
            <Link href="#" className="hover:text-st-accent transition-colors">Privacy Policy</Link>
            <Link href="#" className="hover:text-st-accent transition-colors">Terms of Service</Link>
            <Link href="#" className="hover:text-st-accent transition-colors">Cookie Policy</Link>
          </div>
          <p className="text-xs text-st-text-muted">2026 StudyTrack. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
