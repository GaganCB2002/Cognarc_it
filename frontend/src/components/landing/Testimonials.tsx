"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { Star, Quote } from "lucide-react";

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
  {
    name: "Emily Wang",
    role: "Staff Software Engineer",
    company: "Linear",
    content: "The attention to detail on this platform is unmatched. Tracking my progress feels effortless, and the integrated AI has saved me hundreds of hours.",
    rating: 5,
  },
];

const companyColors: Record<string, string> = {
  Stripe: "from-lp-accent-sky to-lp-accent-sky-light",
  Vercel: "from-lp-accent-sage to-lp-accent-sage-light",
  Figma: "from-lp-accent-lavender to-lp-accent-lavender-light",
  GitHub: "from-lp-accent-peach to-lp-accent-peach-light",
  Linear: "from-lp-accent-indigo to-lp-accent-indigo-light",
};

export function Testimonials() {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const headerRef = useRef<HTMLDivElement>(null);
  const headerInView = useInView(headerRef, { once: true, margin: "-100px" });

  useEffect(() => {
    const timer = setInterval(() => {
      setDirection(1);
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const goTo = (index: number) => {
    setDirection(index > current ? 1 : -1);
    setCurrent(index);
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <section id="testimonials" className="py-24 md:py-32 relative overflow-hidden bg-lp-bg-secondary/20">
      <div className="absolute top-0 left-0 w-[400px] h-[400px] bg-lp-accent-sky/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 right-0 w-[400px] h-[400px] bg-lp-accent-lavender/20 blur-[150px] rounded-full pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          ref={headerRef}
          initial={{ opacity: 0, y: 30 }}
          animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 30 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-16"
        >
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
            transition={{ duration: 0.5 }}
            className="text-xs font-semibold text-lp-accent uppercase tracking-[0.15em] mb-4 block"
          >
            Testimonials
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={headerInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-4xl md:text-5xl font-semibold text-lp-text-primary tracking-tight mb-4"
          >
            Trusted by engineers at{" "}
            <span className="gradient-text-premium">top companies</span>
          </motion.h2>
        </motion.div>

        <div className="max-w-4xl mx-auto">
          <div className="relative min-h-[320px] md:min-h-[280px] flex items-center justify-center">
            <AnimatePresence mode="wait" custom={direction}>
              <motion.div
                key={current}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="card-premium rounded-3xl p-8 md:p-10 w-full"
              >
                <div className="flex flex-col md:flex-row items-start gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-1 mb-4">
                      {Array.from({ length: testimonials[current].rating }).map((_, j) => (
                        <Star key={j} size={14} className="fill-lp-accent-gold text-lp-accent-gold" />
                      ))}
                    </div>
                    <Quote size={24} className="text-lp-accent/20 mb-3" />
                    <blockquote className="text-lg md:text-xl text-lp-text-primary leading-relaxed mb-6 font-light">
                      &ldquo;{testimonials[current].content}&rdquo;
                    </blockquote>
                    <div>
                      <p className="font-semibold text-lp-text-primary">{testimonials[current].name}</p>
                      <p className="text-sm text-lp-text-tertiary">
                        {testimonials[current].role}
                        <span className="mx-1.5 text-lp-border">•</span>
                        <span className="text-lp-accent">{testimonials[current].company}</span>
                      </p>
                    </div>
                  </div>
                  <div className={`w-20 h-20 md:w-24 md:h-24 rounded-2xl bg-gradient-to-br ${companyColors[testimonials[current].company] || "from-lp-accent to-lp-accent-lavender"} flex items-center justify-center shrink-0 shadow-lg`}>
                    <span className="text-white text-2xl md:text-3xl font-bold">
                      {testimonials[current].name.charAt(0)}
                    </span>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>

          <div className="flex items-center justify-center gap-3 mt-8">
            {testimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => goTo(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === current
                    ? "w-8 h-2 bg-lp-accent"
                    : "w-2 h-2 bg-lp-border hover:bg-lp-text-tertiary"
                }`}
                aria-label={`Go to testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
