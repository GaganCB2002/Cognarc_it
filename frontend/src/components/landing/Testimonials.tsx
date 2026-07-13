"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  company: string;
  content: string;
  rating: number;
}

const testimonials: Testimonial[] = [
  {
    name: "Sarah Chen",
    role: "Senior Frontend Engineer",
    company: "Stripe",
    content: "StudyTrack transformed how I approach learning. The structured curriculum and AI scheduling helped me master React deeply in just 8 weeks.",
    rating: 5,
  },
  {
    name: "Marcus Johnson",
    role: "Backend Developer",
    company: "Vercel",
    content: "The interview hub is incredible. Practiced with it for two weeks and nailed my system design interview. The AI feedback is scarily accurate.",
    rating: 5,
  },
  {
    name: "Priya Patel",
    role: "Full Stack Engineer",
    company: "Figma",
    content: "I love how the platform adapts to my pace. The analytics showed I was spending too much time on topics I already knew. Game changer.",
    rating: 5,
  },
  {
    name: "Alex Rivera",
    role: "DevOps Engineer",
    company: "GitHub",
    content: "Finally, a learning platform built for engineers who actually build things. The knowledge vault with AI search is my favorite feature.",
    rating: 5,
  },
];

export function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);

  const next = useCallback(() => {
    setDirection(1);
    setCurrent((i) => (i + 1) % testimonials.length);
  }, []);

  const prev = useCallback(() => {
    setDirection(-1);
    setCurrent((i) => (i - 1 + testimonials.length) % testimonials.length);
  }, []);

  useEffect(() => {
    const interval = setInterval(next, 5000);
    return () => clearInterval(interval);
  }, [next]);

  const t = testimonials[current];

  const variants = {
    enter: (dir: number) => ({ x: dir > 0 ? 200 : -200, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -200 : 200, opacity: 0 }),
  };

  return (
    <section id="testimonials" className="py-24 md:py-32">
      <div className="max-w-7xl mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <span className="text-xs font-semibold text-st-accent uppercase tracking-widest mb-4 block">Testimonials</span>
          <h2 className="text-3xl md:text-5xl font-bold text-st-text-primary tracking-tight mb-4">
            Trusted by engineers at{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-st-accent to-st-accent-hover">
              top companies
            </span>
          </h2>
        </motion.div>

        <div className="max-w-2xl mx-auto">
          <div className="relative min-h-[240px] flex items-center justify-center">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.35, ease: "easeInOut" }}
                className="text-center w-full"
              >
                <div className="flex justify-center gap-1 mb-6">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} size={18} className="fill-st-accent text-st-accent" />
                  ))}
                </div>
                <blockquote className="text-lg md:text-xl text-st-text-primary leading-relaxed mb-8 italic">
                  &ldquo;{t.content}&rdquo;
                </blockquote>
                <div>
                  <p className="font-semibold text-st-text-primary">{t.name}</p>
                  <p className="text-sm text-st-text-muted">
                    {t.role} at {t.company}
                  </p>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-4 mt-8">
            <button
              onClick={prev}
              className="w-10 h-10 rounded-full border border-st-border flex items-center justify-center text-st-text-secondary hover:text-st-text-primary hover:border-st-accent/30 transition-colors"
              aria-label="Previous testimonial"
            >
              <ChevronLeft size={18} />
            </button>
            <div className="flex gap-2">
              {testimonials.map((_, i) => (
                <button
                  key={i}
                  onClick={() => { setDirection(i > current ? 1 : -1); setCurrent(i); }}
                  className={`w-2 h-2 rounded-full transition-all duration-300 ${i === current ? "bg-st-accent w-6" : "bg-st-border"}`}
                  aria-label={`Go to testimonial ${i + 1}`}
                />
              ))}
            </div>
            <button
              onClick={next}
              className="w-10 h-10 rounded-full border border-st-border flex items-center justify-center text-st-text-secondary hover:text-st-text-primary hover:border-st-accent/30 transition-colors"
              aria-label="Next testimonial"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
