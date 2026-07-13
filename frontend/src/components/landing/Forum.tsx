"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SignUpButton } from "@clerk/nextjs";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/lib/auth-context";
import { MessageSquare, Users, Layers, ArrowRight } from "lucide-react";

const cards = [
  { icon: MessageSquare, title: "Technical Discussions", desc: "Dive deep into architecture debates, code reviews, and problem-solving threads with fellow engineers." },
  { icon: Users, title: "Mentorship Program", desc: "Get paired with senior engineers who provide personalized guidance and career advice." },
  { icon: Layers, title: "Study Groups", desc: "Form or join focused study groups tackling the same curriculum modules together." },
];

export function Forum() {
  const { isAuthenticated } = useAuth();

  return (
    <section id="forum" className="py-24 md:py-32 bg-st-bg-secondary/30 relative overflow-hidden">
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-st-accent/5 blur-[120px] rounded-full pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center mb-16"
        >
          <span className="text-xs font-semibold text-st-accent uppercase tracking-widest mb-4 block">Community</span>
          <h2 className="text-3xl md:text-5xl font-bold text-st-text-primary tracking-tight mb-4">
            Learn Together,{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-st-accent to-st-accent-hover">
              Grow Together
            </span>
          </h2>
          <p className="text-st-text-secondary text-lg">
            Join a community of passionate engineers. Share knowledge, get code reviews, and accelerate your growth through collaboration.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-6">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.5, delay: i * 0.08 }}
              whileHover={{ y: -4 }}
              className="group"
            >
              <div className="p-8 rounded-2xl border border-st-border bg-st-bg-card hover:border-st-accent/20 transition-all duration-300 text-center h-full">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-st-accent/20 to-st-accent-hover/10 flex items-center justify-center mx-auto mb-5 group-hover:scale-110 transition-transform duration-300">
                  <card.icon size={26} className="text-st-accent" />
                </div>
                <h3 className="text-lg font-semibold text-st-text-primary mb-2">{card.title}</h3>
                <p className="text-sm text-st-text-secondary leading-relaxed">{card.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-12 text-center"
        >
          {!isAuthenticated ? (
            <SignUpButton>
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" className="px-8 bg-st-accent text-black hover:bg-st-accent-hover border-0 font-medium shadow-lg shadow-st-accent/20">
                  Join the Community <ArrowRight size={16} className="ml-2" />
                </Button>
              </motion.div>
            </SignUpButton>
          ) : (
            <Link href="/student/dashboard">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button size="lg" className="px-8 bg-st-accent text-black hover:bg-st-accent-hover border-0 font-medium shadow-lg shadow-st-accent/20">
                  Go to Dashboard <ArrowRight size={16} className="ml-2" />
                </Button>
              </motion.div>
            </Link>
          )}
        </motion.div>
      </div>
    </section>
  );
}
