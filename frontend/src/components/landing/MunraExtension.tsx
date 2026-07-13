"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Zap } from "lucide-react";

export function MunraExtension() {
  const [munraActive, setMunraActive] = useState<boolean | null>(null);

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
    <section className="py-24 md:py-32 bg-st-bg-secondary/30 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-st-accent/[0.02] to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="flex flex-col lg:flex-row items-center gap-12"
        >
          <div className="flex-1 text-center lg:text-left">
            <span className="text-xs font-semibold text-st-accent uppercase tracking-widest mb-4 block">Browser Extension</span>
            <h2 className="text-3xl md:text-5xl font-bold text-st-text-primary tracking-tight mb-4">
              Supercharge with{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-st-accent to-st-accent-hover">
                Munra
              </span>
            </h2>
            <p className="text-st-text-secondary text-lg mb-8 max-w-lg mx-auto lg:mx-0 leading-relaxed">
              Automatically track your browsing activity, sync study sessions, and get real-time productivity insights — directly from your browser.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button
                  size="lg"
                  className="px-8 bg-st-accent text-black hover:bg-st-accent-hover border-0 font-medium shadow-lg shadow-st-accent/20"
                  onClick={() => window.open("/munra-install", "_blank")}
                >
                  <Zap size={16} className="mr-2" />
                  Install Munra
                </Button>
              </motion.div>
              <div className="text-sm text-st-text-muted flex items-center gap-2">
                <span className={`w-2 h-2 rounded-full inline-block ${
                  munraActive === null ? "bg-st-border" : munraActive ? "bg-st-success" : "bg-st-warning"
                }`} />
                <span>
                  {munraActive === null
                    ? "Checking extension..."
                    : munraActive
                      ? "Munra extension is active"
                      : "Munra extension not detected — click Install to add it"}
                </span>
              </div>
            </div>
          </div>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="shrink-0"
          >
            <div className="w-32 h-32 md:w-40 md:h-40 rounded-2xl bg-gradient-to-br from-st-accent to-st-accent-hover flex items-center justify-center shadow-2xl shadow-st-accent/20 relative overflow-hidden">
              <span className="text-white text-5xl md:text-6xl font-bold">M</span>
              <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
