"use client";

import { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { SignUpButton } from "@clerk/nextjs";
import { useAuth } from "@/lib/auth-context";
import { MessageSquare, Users, Layers, ArrowRight } from "lucide-react";

const cards = [
  {
    icon: MessageSquare,
    title: "Technical Discussions",
    desc: "Dive deep into architecture debates, code reviews, and problem-solving threads with fellow engineers.",
    gradient: "from-lp-accent-sky to-lp-accent-sky-light",
  },
  {
    icon: Users,
    title: "Mentorship Program",
    desc: "Get paired with senior engineers who provide personalized guidance and career advice.",
    gradient: "from-lp-accent-sage to-lp-accent-sage-light",
  },
  {
    icon: Layers,
    title: "Study Groups",
    desc: "Form or join focused study groups tackling the same curriculum modules together.",
    gradient: "from-lp-accent-lavender to-lp-accent-lavender-light",
  },
];

function ForumCard({ card, index }: { card: typeof cards[0]; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
      transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
      className="group"
    >
      <div className="card-premium rounded-2xl p-8 h-full flex flex-col items-center text-center relative overflow-hidden">
        <div className={`absolute inset-0 bg-gradient-to-br ${card.gradient} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />

        <div className={`w-16 h-16 rounded-2xl bg-gradient-to-br ${card.gradient} flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-2 transition-transform duration-300 shadow-sm`}>
          <card.icon size={26} className="text-white" />
        </div>

        <h3 className="text-xl font-semibold text-lp-text-primary mb-3 tracking-tight">{card.title}</h3>
        <p className="text-sm text-lp-text-secondary leading-relaxed font-light">{card.desc}</p>
      </div>
    </motion.div>
  );
}

export function Forum() {
  const { isAuthenticated } = useAuth();
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-100px" });
  const ctaRef = useRef<HTMLDivElement>(null);
  const ctaInView = useInView(ctaRef, { once: true, margin: "-50px" });

  return (
    <section id="forum" className="py-24 md:py-32 relative overflow-hidden bg-lp-bg-secondary/30">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-lp-accent-sky/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-lp-accent-peach/20 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto text-center mb-20"
        >
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: 0.5 }}
            className="inline-flex items-center justify-center mb-4"
          >
            <span className="text-xs font-semibold text-lp-accent uppercase tracking-[0.15em] px-4 py-1.5 rounded-full bg-lp-accent-soft border border-lp-accent/20">
              Community
            </span>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-6xl font-semibold text-lp-text-primary tracking-tight mb-6"
          >
            Learn Together,{" "}
            <span className="gradient-text-warm">Grow Together</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 15 }}
            animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
            transition={{ duration: 0.6, delay: 0.15 }}
            className="text-lp-text-secondary text-lg md:text-xl font-light leading-relaxed"
          >
            Join a community of passionate engineers. Share knowledge, get code reviews, and accelerate your growth through collaboration.
          </motion.p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <ForumCard key={card.title} card={card} index={i} />
          ))}
        </div>

        <motion.div
          ref={ctaRef}
          initial={{ opacity: 0, y: 20 }}
          animate={ctaInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
          transition={{ duration: 0.6, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 text-center flex justify-center"
        >
          {!isAuthenticated ? (
            <SignUpButton>
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-medium text-white bg-lp-accent rounded-full overflow-hidden transition-all duration-300 shadow-xl shadow-lp-accent/20 hover:shadow-2xl hover:shadow-lp-accent/30"
              >
                <span className="relative z-10">Join the Community</span>
                <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </SignUpButton>
          ) : (
            <Link href="/student/dashboard">
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-medium text-white bg-lp-accent rounded-full overflow-hidden transition-all duration-300 shadow-xl shadow-lp-accent/20"
              >
                <span className="relative z-10">Go to Dashboard</span>
                <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              </motion.button>
            </Link>
          )}
        </motion.div>
      </div>
    </section>
  );
}
