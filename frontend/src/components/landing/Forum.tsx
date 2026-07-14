"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { SignUpButton } from "@clerk/nextjs";
import { useAuth } from "@/lib/auth-context";
import { MessageSquare, Users, Layers, ArrowRight, Sparkles } from "lucide-react";

const cards = [
  { 
    icon: MessageSquare, 
    title: "Technical Discussions", 
    desc: "Dive deep into architecture debates, code reviews, and problem-solving threads with fellow engineers.",
    color: "bg-lp-accent-blue",
    textColor: "text-blue-700"
  },
  { 
    icon: Users, 
    title: "Mentorship Program", 
    desc: "Get paired with senior engineers who provide personalized guidance and career advice.",
    color: "bg-lp-accent-sage",
    textColor: "text-emerald-700"
  },
  { 
    icon: Layers, 
    title: "Study Groups", 
    desc: "Form or join focused study groups tackling the same curriculum modules together.",
    color: "bg-lp-accent-sky",
    textColor: "text-sky-700"
  },
];

export function Forum() {
  const { isAuthenticated } = useAuth();

  return (
    <section id="forum" className="py-24 md:py-32 bg-lp-bg-secondary relative overflow-hidden">
      {/* Decorative Blur */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-lp-accent-blue/20 blur-[150px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-lp-accent-rose/20 blur-[150px] rounded-full pointer-events-none" />
      
      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="max-w-3xl mx-auto text-center mb-20"
        >
          <div className="inline-flex items-center justify-center mb-4">
            <span className="text-xs font-semibold text-lp-accent-blue uppercase tracking-widest px-4 py-1.5 rounded-full bg-lp-accent-blue/10 border border-lp-accent-blue/20">
              Community
            </span>
          </div>
          <h2 className="text-4xl md:text-6xl font-semibold text-lp-text-primary tracking-tight mb-6">
            Learn Together, <br className="hidden md:block" />
            <span className="text-lp-accent-rose text-rose-900">Grow Together</span>
          </h2>
          <p className="text-lp-text-secondary text-lg md:text-xl font-light leading-relaxed">
            Join a community of passionate engineers. Share knowledge, get code reviews, and accelerate your growth through collaboration.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-3 gap-8">
          {cards.map((card, i) => (
            <motion.div
              key={card.title}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.6, delay: i * 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="group"
            >
              <div className="p-8 rounded-3xl border border-lp-border bg-lp-bg-card hover:shadow-xl hover:-translate-y-2 transition-all duration-300 h-full relative overflow-hidden flex flex-col items-center text-center">
                {/* Subtle Hover Glow */}
                <div className={`absolute inset-0 opacity-0 group-hover:opacity-10 bg-gradient-to-br from-transparent to-${card.color} transition-opacity duration-500`} />
                
                <div className={`w-16 h-16 rounded-2xl ${card.color} bg-opacity-20 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300 shadow-inner`}>
                  <card.icon size={28} className={card.textColor} />
                </div>
                
                <h3 className="text-xl font-semibold text-lp-text-primary mb-3 tracking-tight">{card.title}</h3>
                <p className="text-sm text-lp-text-secondary leading-relaxed font-light">{card.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6, delay: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="mt-16 text-center flex justify-center"
        >
          {!isAuthenticated ? (
            <SignUpButton>
              <button className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-medium text-lp-bg-primary bg-lp-text-primary rounded-full overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-lp-text-primary/10">
                <span className="relative z-10">Join the Community</span>
                <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              </button>
            </SignUpButton>
          ) : (
            <Link href="/student/dashboard">
              <button className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-medium text-lp-bg-primary bg-lp-text-primary rounded-full overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-lp-text-primary/10">
                <span className="relative z-10">Go to Dashboard</span>
                <ArrowRight size={16} className="relative z-10 group-hover:translate-x-1 transition-transform" />
              </button>
            </Link>
          )}
        </motion.div>
      </div>
    </section>
  );
}
