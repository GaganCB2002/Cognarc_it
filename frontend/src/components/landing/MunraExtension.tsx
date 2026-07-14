"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
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
    <section className="py-24 md:py-32 bg-lp-bg-primary relative overflow-hidden">
      {/* Decorative Gradients */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[600px] max-w-4xl bg-gradient-to-r from-lp-accent-blue/10 via-lp-accent-rose/10 to-lp-accent-lavender/10 blur-[120px] rounded-full pointer-events-none" />
      
      <div className="max-w-5xl mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="bg-lp-bg-card border border-lp-border rounded-[2.5rem] p-8 md:p-16 shadow-2xl shadow-lp-border/50 relative overflow-hidden flex flex-col md:flex-row items-center gap-12"
        >
          {/* Subtle Background pattern inside card */}
          <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'20\' height=\'20\' viewBox=\'0 0 20 20\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Ccircle cx=\'3\' cy=\'3\' r=\'3\'/%3E%3Ccircle cx=\'13\' cy=\'13\' r=\'3\'/%3E%3C/g%3E%3C/svg%3E")' }} />
          
          <div className="flex-1 text-center md:text-left relative z-10">
            <span className="text-xs font-semibold text-lp-accent-rose uppercase tracking-widest mb-4 block">Browser Extension</span>
            <h2 className="text-4xl md:text-5xl font-semibold text-lp-text-primary tracking-tight mb-6">
              Supercharge with <br /> <span className="text-lp-accent-rose text-rose-700">Munra</span>
            </h2>
            <p className="text-lp-text-secondary text-lg mb-8 font-light leading-relaxed">
              Automatically track your browsing activity, sync study sessions, and get real-time productivity insights — seamlessly integrated.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center gap-5 justify-center md:justify-start">
              <button
                className="group relative inline-flex items-center justify-center gap-2 px-8 py-4 text-sm font-medium text-lp-bg-primary bg-lp-text-primary rounded-full overflow-hidden hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-xl shadow-lp-text-primary/10"
                onClick={() => window.open("/munra-install", "_blank")}
              >
                <Zap size={16} className="relative z-10 text-lp-accent-blue group-hover:scale-110 transition-transform" />
                <span className="relative z-10">Install Munra</span>
              </button>
              
              <div className="text-sm font-medium text-lp-text-secondary flex items-center gap-2 bg-lp-bg-secondary px-4 py-2 rounded-full border border-lp-border">
                <span className={`w-2 h-2 rounded-full inline-block ${
                  munraActive === null ? "bg-lp-text-muted" : munraActive ? "bg-emerald-500 animate-pulse" : "bg-amber-500"
                }`} />
                <span>
                  {munraActive === null
                    ? "Checking extension..."
                    : munraActive
                      ? "Munra is active"
                      : "Not detected"}
                </span>
              </div>
            </div>
          </div>
          
          <motion.div
            initial={{ opacity: 0, scale: 0.9, rotate: -5 }}
            whileInView={{ opacity: 1, scale: 1, rotate: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
            className="shrink-0 relative z-10"
          >
            <div className="w-40 h-40 md:w-56 md:h-56 rounded-[2rem] bg-gradient-to-br from-lp-accent-rose to-lp-accent-blue flex items-center justify-center shadow-2xl shadow-lp-accent-rose/30 relative overflow-hidden group hover:scale-105 transition-transform duration-500">
              <span className="text-white text-6xl md:text-8xl font-bold drop-shadow-lg group-hover:scale-110 transition-transform duration-500">M</span>
              <div className="absolute inset-0 bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
              {/* Glass reflection */}
              <div className="absolute -inset-1/2 bg-gradient-to-r from-transparent via-white/30 to-transparent -rotate-45 translate-x-[-150%] group-hover:translate-x-[150%] transition-transform duration-1000 ease-in-out" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
