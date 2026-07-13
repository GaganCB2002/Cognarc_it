"use client";

import { motion } from "framer-motion";
import {
  BookOpen, Calendar, BarChart3, MessageSquare, FileText, Play,
  Target, Users, Trophy, Upload, Database, Shield,
  Image, GitBranch, ChevronRight
} from "lucide-react";
import { Card } from "@/components/ui/Card";

const features = [
  { icon: BookOpen, title: "Structured Curriculum", description: "Industry-vetted learning paths designed by senior engineers to take you from intermediate to expert." },
  { icon: Calendar, title: "Smart Scheduling", description: "AI-powered study planner that adapts to your availability and learning pace." },
  { icon: BarChart3, title: "Mastery Analytics", description: "Real-time progress tracking with detailed insights into your strengths and areas for improvement." },
  { icon: MessageSquare, title: "Community Forum", description: "Collaborate with peers, get mentorship from experts, and participate in technical discussions." },
  { icon: FileText, title: "Resource Library", description: "Store and organize all your learning materials — PDFs, videos, code snippets, and more." },
  { icon: Play, title: "Video Sessions", description: "Recorded and live coding sessions with detailed annotations and timestamped notes." },
  { icon: Target, title: "Goal Tracking", description: "Set weekly targets, track streaks, and maintain momentum with personalized reminders." },
  { icon: Users, title: "Peer Review", description: "Code review workflows and collaborative learning exercises with fellow engineers." },
  { icon: Trophy, title: "Gamification", description: "Earn achievements, maintain streaks, and compete on leaderboards to stay motivated." },
  { icon: Upload, title: "File Management", description: "Upload, preview, and organize images, PDFs, videos, and code files in your personal library." },
  { icon: Database, title: "Personalized Database", description: "Your own learning data store — all notes, resources, sessions, and tasks persisted securely." },
  { icon: Shield, title: "Progress Security", description: "End-to-end encrypted backups of your learning progress and materials." },
];

const storageTypes = [
  { icon: Image, label: "Images", desc: "Screenshots, diagrams" },
  { icon: FileText, label: "PDFs", desc: "eBooks, papers, notes" },
  { icon: Play, label: "Videos", desc: "Lectures, walkthroughs" },
  { icon: GitBranch, label: "Code", desc: "Snippets, projects" },
];

export function Features() {
  return (
    <section id="features" className="py-24 md:py-32 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-st-accent/[0.02] to-transparent pointer-events-none" />
      <div className="max-w-7xl mx-auto px-6 relative">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.6 }}
          className="max-w-2xl mx-auto text-center mb-16"
        >
          <span className="text-xs font-semibold text-st-accent uppercase tracking-widest mb-4 block">Platform Features</span>
          <h2 className="text-3xl md:text-5xl font-bold text-st-text-primary tracking-tight mb-4">
            Everything You Need to{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-st-accent to-st-accent-hover">
              Excel
            </span>
          </h2>
          <p className="text-st-text-secondary text-lg">
            A complete learning ecosystem with persistent data storage, file management, and real-time synchronization across all your devices.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ duration: 0.4, delay: i * 0.03 }}
              whileHover={{ y: -2 }}
              className="group"
            >
              <div className="p-5 rounded-xl border border-st-border bg-st-bg-card hover:border-st-accent/20 transition-all duration-300 h-full">
                <div className="w-9 h-9 rounded-lg bg-st-accent/10 flex items-center justify-center mb-3 group-hover:bg-st-accent/20 transition-colors">
                  <f.icon size={18} className="text-st-accent" />
                </div>
                <h3 className="font-semibold text-st-text-primary text-sm mb-1.5">{f.title}</h3>
                <p className="text-xs text-st-text-secondary leading-relaxed">{f.description}</p>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Persistent Storage Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-16"
        >
          <Card className="p-8 md:p-12 bg-gradient-to-br from-st-accent/[0.04] to-transparent border-st-accent/15 relative overflow-hidden">
            <div className="flex flex-col md:flex-row items-center gap-10">
              <div className="flex-1 text-center md:text-left">
                <div className="flex items-center gap-2 justify-center md:justify-start mb-4">
                  <Database size={18} className="text-st-accent" />
                  <span className="text-xs font-semibold text-st-accent uppercase tracking-wider">Secure Data Layer</span>
                </div>
                <h3 className="text-2xl md:text-3xl font-bold text-st-text-primary mb-4">Persistent Storage for Everything</h3>
                <p className="text-st-text-secondary mb-8 leading-relaxed">
                  All your learning data is securely stored and instantly accessible. Upload images, PDFs, videos, and code files — the platform manages your complete learning repository.
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {storageTypes.map((item) => (
                    <div key={item.label} className="text-center p-4 rounded-xl bg-st-bg-card/60 border border-st-border/50 hover:border-st-accent/20 transition-colors">
                      <item.icon size={20} className="text-st-accent mx-auto mb-2" />
                      <p className="text-xs font-semibold text-st-text-primary">{item.label}</p>
                      <p className="text-[10px] text-st-text-muted mt-0.5">{item.desc}</p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="shrink-0">
                <div className="w-28 h-28 md:w-36 md:h-36 rounded-2xl bg-gradient-to-br from-st-accent/20 to-st-accent-hover/10 border border-st-accent/20 flex items-center justify-center shadow-xl shadow-st-accent/5">
                  <Database size={48} className="text-st-accent" />
                </div>
                <p className="text-xs text-st-text-muted text-center mt-3">Your data, always available</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </section>
  );
}
