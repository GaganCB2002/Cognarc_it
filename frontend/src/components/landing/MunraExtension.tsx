"use client";

import { useEffect, useState, useRef } from "react";
import { motion, useInView } from "framer-motion";
import { Zap } from "lucide-react";

export function MunraExtension() {
  const [munraActive, setMunraActive] = useState<boolean | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true, margin: "-100px" });

  useEffect(() => {
    const check = () => {
      const detected = document.documentElement.getAttribute("data-munra-extension") === "active";
      setMunraActive(detected);
    };
    check();
    const id = setTimeout(check, 2000);
    return () => clearTimeout(id);
  }, []);

  return (
    <section className="py-24 md:py-32 relative overflow-hidden bg-lp-bg-primary" ref={sectionRef}>
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] max-w-4xl bg-gradient-to-r from-lp-accent-sky/10 via-lp-accent-peach/10 to-lp-accent-lavender/10 blur-[120px] rounded-full pointer-events-none" />

      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 40 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="card-premium rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-lp-accent/5 via-transparent to-lp-accent-peach/5 pointer-events-none" />

          <div className="flex flex-col md:flex-row items-center gap-10 relative z-10">
            <div className="flex-1 text-center md:text-left">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="text-xs font-semibold text-lp-accent-peach uppercase tracking-[0.15em] mb-4 block"
              >
                Browser Extension
              </motion.span>
              <motion.h2
                initial={{ opacity: 0, y: 20 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 20 }}
                transition={{ duration: 0.6, delay: 0.15 }}
                className="text-4xl md:text-5xl font-semibold text-lp-text-primary tracking-tight mb-6"
              >
                Supercharge with{" "}
                <span className="gradient-text-warm">Munra</span>
              </motion.h2>
              <motion.p
                initial={{ opacity: 0, y: 15 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-lp-text-secondary text-lg mb-8 font-light leading-relaxed"
              >
                Automatically track your browsing activity, sync study sessions, and get real-time productivity insights — seamlessly integrated.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={inView ? { opacity: 1, y: 0 } : { opacity: 0, y: 15 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center gap-4 justify-center md:justify-start"
              >
                <motion.button
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-medium text-white bg-lp-accent rounded-full overflow-hidden transition-all duration-300 shadow-lg shadow-lp-accent/20 hover:shadow-xl hover:shadow-lp-accent/30"
                  onClick={() => window.open("/munra-install", "_blank")}
                >
                  <Zap size={16} className="relative z-10 group-hover:scale-110 transition-transform" />
                  <span className="relative z-10">Install Munra</span>
                </motion.button>

                <div className="text-xs font-medium text-lp-text-tertiary flex items-center gap-2 bg-lp-bg-tertiary/30 px-4 py-2.5 rounded-full border border-lp-border/30">
                  <span className={`w-2 h-2 rounded-full inline-block ${
                    munraActive === null ? "bg-lp-text-muted" : munraActive ? "bg-lp-success animate-pulse-soft" : "bg-lp-warning"
                  }`} />
                  <span>
                    {munraActive === null
                      ? "Checking extension..."
                      : munraActive
                        ? "Munra is active"
                        : "Not detected"}
                  </span>
                </div>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
              animate={inView ? { opacity: 1, scale: 1, rotate: 0 } : { opacity: 0, scale: 0.9, rotate: -5 }}
              transition={{ duration: 0.8, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="shrink-0"
            >
              <div className="w-36 h-36 md:w-52 md:h-52 rounded-[2rem] bg-gradient-to-br from-lp-accent-peach to-lp-accent flex items-center justify-center shadow-2xl shadow-lp-accent-peach/30 relative overflow-hidden group hover:scale-105 transition-transform duration-500">
                <span className="text-white text-5xl md:text-7xl font-bold drop-shadow-lg group-hover:scale-110 transition-transform duration-500">M</span>
                <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
                <div className="absolute -inset-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent -rotate-45 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
              </div>
            </motion.div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
