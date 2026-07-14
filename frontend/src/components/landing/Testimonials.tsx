"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Star } from "lucide-react";
import { gsap } from "gsap";

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
  }
];

export function Testimonials() {
  const marqueeRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    if (!marqueeRef.current) return;
    
    // Simple GSAP infinite marquee
    const marquee = marqueeRef.current;
    
    const tween = gsap.to(marquee, {
      xPercent: -50,
      repeat: -1,
      duration: 30,
      ease: "linear",
    }).totalProgress(0.5);

    const handleMouseEnter = () => tween.timeScale(0.1);
    const handleMouseLeave = () => tween.timeScale(1);

    marquee.addEventListener("mouseenter", handleMouseEnter);
    marquee.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      tween.kill();
      marquee.removeEventListener("mouseenter", handleMouseEnter);
      marquee.removeEventListener("mouseleave", handleMouseLeave);
    };
  }, []);

  return (
    <section id="testimonials" className="py-24 md:py-32 overflow-hidden bg-lp-bg-secondary relative">
      {/* Soft gradients for the edges to fade out the marquee */}
      <div className="absolute top-0 bottom-0 left-0 w-32 bg-gradient-to-r from-lp-bg-secondary to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 bottom-0 right-0 w-32 bg-gradient-to-l from-lp-bg-secondary to-transparent z-10 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10 mb-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <span className="text-xs font-semibold text-lp-accent-blue uppercase tracking-widest mb-4 block">Testimonials</span>
          <h2 className="text-4xl md:text-5xl font-semibold text-lp-text-primary tracking-tight mb-4">
            Trusted by engineers at top companies
          </h2>
        </motion.div>
      </div>

      <div className="w-full relative flex">
        <div ref={marqueeRef} className="flex gap-6 px-3 w-max">
          {/* Double the array for seamless looping */}
          {[...testimonials, ...testimonials].map((t, i) => (
            <div 
              key={i} 
              className="w-[350px] md:w-[450px] p-8 rounded-3xl bg-lp-bg-card border border-lp-border/50 shadow-sm hover:shadow-xl hover:-translate-y-2 transition-all duration-300 group cursor-default"
            >
              <div className="flex justify-between items-start mb-6">
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, j) => (
                    <Star key={j} size={16} className="fill-lp-accent-blue text-lp-accent-blue" />
                  ))}
                </div>
                <div className="w-10 h-10 rounded-full bg-lp-bg-secondary border border-lp-border flex items-center justify-center text-sm font-semibold text-lp-text-secondary group-hover:scale-110 transition-transform">
                  {t.name.charAt(0)}
                </div>
              </div>
              <blockquote className="text-lg text-lp-text-primary leading-relaxed mb-8">
                "{t.content}"
              </blockquote>
              <div className="mt-auto">
                <p className="font-semibold text-lp-text-primary">{t.name}</p>
                <p className="text-sm text-lp-text-secondary">
                  {t.role} <span className="mx-1 text-lp-border">•</span> {t.company}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
