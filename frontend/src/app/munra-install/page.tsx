"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Download, Zap, Settings, Shield, ArrowLeft,
  CheckCircle
} from "lucide-react";
import { Button } from "@/components/ui/Button";

export default function MunraInstallPage() {
  const steps = [
    {
      icon: Download,
      title: "Download the Extension",
      desc: "Clone the repository or download the extension folder from the project.",
      code: "git clone <repo-url>\ncd frontend/extension/munra"
    },
    {
      icon: Settings,
      title: "Open Chrome Extensions",
      desc: "Navigate to chrome://extensions/ in your Chrome browser.",
      code: "chrome://extensions/"
    },
    {
      icon: Shield,
      title: "Enable Developer Mode",
      desc: "Toggle 'Developer mode' on in the top-right corner of the extensions page.",
    },
    {
      icon: Zap,
      title: "Load Unpacked Extension",
      desc: "Click 'Load unpacked' and select the 'frontend/extension/munra' folder.",
    },
    {
      icon: CheckCircle,
      title: "Verify Installation",
      desc: "You should see the Munra icon in your toolbar. It will automatically track your browsing activity on the landing page.",
    },
  ];

  return (
    <div className="min-h-screen bg-st-bg-primary">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Link href="/" className="inline-flex items-center gap-2 text-sm text-st-text-secondary hover:text-st-accent transition-colors mb-8">
            <ArrowLeft size={16} />
            Back to Home
          </Link>

          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-st-accent to-st-accent-hover flex items-center justify-center shadow-xl shadow-st-accent/20">
              <span className="text-white text-2xl font-bold">M</span>
            </div>
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-st-text-primary">Install Munra</h1>
              <p className="text-st-text-secondary mt-1">Browser extension setup guide</p>
            </div>
          </div>

          <div className="space-y-6 mb-12">
            {steps.map((step, i) => (
              <motion.div
                key={step.title}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className="flex gap-5 p-5 rounded-xl border border-st-border bg-st-bg-card"
              >
                <div className="w-10 h-10 rounded-lg bg-st-accent/10 flex items-center justify-center shrink-0 mt-1">
                  <step.icon size={18} className="text-st-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-6 h-6 rounded-full bg-st-accent/20 text-st-accent text-xs font-bold flex items-center justify-center">{i + 1}</span>
                    <h3 className="font-semibold text-st-text-primary">{step.title}</h3>
                  </div>
                  <p className="text-sm text-st-text-secondary mb-2">{step.desc}</p>
                  {step.code && (
                    <pre className="bg-st-bg-secondary border border-st-border rounded-lg p-3 text-xs text-st-text-muted font-mono overflow-x-auto whitespace-pre-wrap">
                      {step.code}
                    </pre>
                  )}
                </div>
              </motion.div>
            ))}
          </div>

          <div className="text-center p-8 rounded-2xl border border-st-accent/20 bg-gradient-to-br from-st-accent/5 to-transparent">
            <p className="text-st-text-primary font-semibold mb-2">Extension installed?</p>
            <p className="text-sm text-st-text-secondary mb-4">
              Once loaded, the Munra extension will automatically activate when you visit the landing page and track your activity.
            </p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-st-accent to-st-accent-hover text-white border-0 shadow-lg shadow-st-accent/20">
                Go to Landing Page to Test
              </Button>
            </Link>
          </div>

          <div className="mt-8 text-center">
            <p className="text-xs text-st-text-muted">
              For development: the extension is in <code className="text-st-accent">frontend/extension/munra/</code>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
