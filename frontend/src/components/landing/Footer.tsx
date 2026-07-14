"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { Globe, Mail, ArrowUpRight } from "lucide-react";

const footerLinks = {
  Platform: [
    { label: "Features", href: "#features" },
    { label: "Curriculum", href: "#curriculum" },
    { label: "Mastery Analytics", href: "#mastery" },
    { label: "Community Forum", href: "#forum" },
  ],
  Resources: [
    { label: "Documentation", href: "#" },
    { label: "API Reference", href: "#" },
    { label: "Blog", href: "#" },
    { label: "Guides", href: "#" },
  ],
  Company: [
    { label: "About Us", href: "#" },
    { label: "Careers", href: "#" },
    { label: "Privacy Policy", href: "#" },
    { label: "Terms of Service", href: "#" },
  ],
};

const socialLinks = [
  { icon: Globe, href: "#", label: "Twitter" },
  { icon: Globe, href: "#", label: "GitHub" },
  { icon: Globe, href: "#", label: "LinkedIn" },
  { icon: Mail, href: "#", label: "Email" },
];

export function Footer() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <footer ref={ref} className="border-t border-lp-border/40 bg-lp-bg-card relative z-10">
      <div className="max-w-7xl mx-auto px-6 py-16 md:py-20">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-10 md:gap-12 mb-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="col-span-2 lg:col-span-2"
          >
            <Link href="/" className="flex items-center gap-3 mb-5 group">
              <motion.div
                whileHover={{ scale: 1.05, rotate: -3 }}
                className="w-9 h-9 rounded-xl bg-gradient-to-br from-lp-accent to-lp-accent-lavender flex items-center justify-center shadow-md shadow-lp-accent/20"
              >
                <span className="text-white font-bold text-xs tracking-tighter">ST</span>
              </motion.div>
              <span className="text-lg font-semibold text-lp-text-primary tracking-tight">StudyTrack</span>
            </Link>
            <p className="text-sm text-lp-text-secondary max-w-xs leading-relaxed font-light mb-6">
              Building the next generation of software engineers through systemic mastery and data-driven learning.
            </p>
            <div className="flex items-center gap-3">
              {socialLinks.map((social) => (
                <Link
                  key={social.label}
                  href={social.href}
                  className="w-9 h-9 rounded-xl bg-lp-bg-tertiary/50 border border-lp-border/30 flex items-center justify-center hover:bg-lp-accent-soft hover:border-lp-accent/30 transition-all duration-300 group"
                  aria-label={social.label}
                >
                  <social.icon size={14} className="text-lp-text-tertiary group-hover:text-lp-accent transition-colors" />
                </Link>
              ))}
            </div>
          </motion.div>

          {Object.entries(footerLinks).map(([category, links], i) => (
            <motion.div
              key={category}
              initial={{ opacity: 0, y: 20 }}
              animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
              transition={{ duration: 0.6, delay: 0.1 + i * 0.05, ease: [0.16, 1, 0.3, 1] }}
            >
              <h3 className="text-xs font-semibold text-lp-text-primary uppercase tracking-[0.15em] mb-5">
                {category}
              </h3>
              <ul className="space-y-3">
                {links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm text-lp-text-secondary hover:text-lp-text-primary transition-colors font-light inline-flex items-center gap-1 group"
                    >
                      {link.label}
                      <ArrowUpRight size={10} className="opacity-0 -translate-y-1 group-hover:opacity-60 group-hover:translate-y-0 transition-all duration-200" />
                    </Link>
                  </li>
                ))}
              </ul>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : { opacity: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-col md:flex-row items-center justify-between gap-6 pt-8 border-t border-lp-border/30"
        >
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-lp-bg-tertiary/50 border border-lp-border/30">
              <ThemeToggle />
            </div>
            <span className="text-xs text-lp-text-tertiary font-medium">Toggle theme</span>
          </div>
          <p className="text-xs text-lp-text-tertiary font-light">
            &copy; {new Date().getFullYear()} StudyTrack Inc. All rights reserved.
          </p>
        </motion.div>
      </div>
    </footer>
  );
}
