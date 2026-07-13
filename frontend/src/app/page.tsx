"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import {
  BookOpen, Calendar, BarChart3, MessageSquare, CheckCircle,
  ArrowRight, Sparkles, Clock, Target, Users, FileText, Play,
  Image, Upload, Zap, Shield, Layers, GitBranch, Trophy,
  Menu, X, Star, ChevronRight, Database, HardDrive
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "@/components/ui/ThemeToggle";

const curriculumModules = [
  { id: 1, name: "Foundations", topics: 12, progress: 100, color: "#4F6BED", description: "Computer science fundamentals, data structures, and algorithmic thinking." },
  { id: 2, name: "Frontend Architecture", topics: 18, progress: 85, color: "#7C3AED", description: "Modern frameworks, component design, state management, and performance optimization." },
  { id: 3, name: "Backend Engineering", topics: 15, progress: 60, color: "#A855F7", description: "API design, microservices, databases, caching, and server-side architecture." },
  { id: 4, name: "System Design", topics: 10, progress: 35, color: "#EC4899", description: "Distributed systems, scalability patterns, and cloud infrastructure." },
  { id: 5, name: "DevOps & Deployment", topics: 8, progress: 15, color: "#F59E0B", description: "CI/CD pipelines, containerization, monitoring, and infrastructure as code." },
];

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

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [munraActive, setMunraActive] = useState<boolean | null>(null);
  const containerRef = useRef(null);
  const { isAuthenticated } = useAuth();

  // Global scroll progress
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001
  });

  // Hero Parallax
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const y2 = useTransform(scrollY, [0, 1000], [0, -150]);
  const opacity = useTransform(scrollY, [0, 500], [1, 0]);

  // Video Playlist
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [videoMuted, setVideoMuted] = useState(true);
  const backgroundVideos = ["/hero-video.mp4", "/hero-video-2.mp4"];
  const videoRef = useRef<HTMLVideoElement>(null);

  const handleVideoEnded = () => {
    setCurrentVideoIndex((prev) => (prev + 1) % backgroundVideos.length);
  };

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    let cancelled = false;

    const playVideo = async () => {
      try {
        video.load();
        await new Promise<void>((resolve) => {
          if (video.readyState >= 2) { resolve(); return; }
          const onReady = () => { video.removeEventListener('canplay', onReady); resolve(); };
          video.addEventListener('canplay', onReady);
        });
        if (!cancelled) {
          await video.play();
        }
      } catch (e) {
        if (e instanceof DOMException && e.name === 'AbortError') return;
        console.error("Video autoplay failed", e);
      }
    };

    playVideo();

    return () => { cancelled = true; };
  }, [currentVideoIndex]);

  useEffect(() => {
    const check = () => {
      const detected = document.documentElement.getAttribute('data-munra-extension') === 'active';
      setMunraActive(detected);
    };
    check();
    const id = setTimeout(check, 2000);
    return () => clearTimeout(id);
  }, []);

  return (
    <div className="flex flex-col min-h-screen relative" ref={containerRef}>
      {/* Global Scroll Progress */}
      <motion.div 
        className="fixed top-0 left-0 right-0 h-1 bg-st-accent origin-left z-[60]"
        style={{ scaleX }}
      />
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-st-border bg-st-bg-primary/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 group">
            <div className="w-9 h-9 bg-gradient-to-br from-st-accent to-st-accent-hover rounded-lg flex items-center justify-center shadow-lg shadow-st-accent/20 group-hover:shadow-st-accent/40 transition-shadow">
              <span className="font-bold text-white text-lg">S</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-st-text-primary">StudyTrack</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            <Link href="#curriculum" className="text-sm font-medium text-st-text-secondary hover:text-st-text-primary transition-colors">Curriculum</Link>
            <Link href="#schedule" className="text-sm font-medium text-st-text-secondary hover:text-st-text-primary transition-colors">Schedule</Link>
            <Link href="#mastery" className="text-sm font-medium text-st-text-secondary hover:text-st-text-primary transition-colors">Mastery</Link>
            <Link href="#forum" className="text-sm font-medium text-st-text-secondary hover:text-st-text-primary transition-colors">Forum</Link>
            <Link href="#features" className="text-sm font-medium text-st-text-secondary hover:text-st-text-primary transition-colors">Features</Link>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            {!isAuthenticated && (
              <>
                <Link href="/login">
                  <Button variant="ghost" className="text-sm">Sign In</Button>
                </Link>
                <Link href="/register">
                  <Button className="text-sm bg-gradient-to-r from-st-accent to-st-accent-hover hover:from-st-accent-hover hover:to-st-accent text-white border-0">
                    Get Started Free
                  </Button>
                </Link>
              </>
            )}
            {isAuthenticated && (
              <>
                <Link href="/dashboard">
                  <Button variant="ghost" className="text-sm">Go to Dashboard</Button>
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden text-st-text-primary" onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-st-border bg-st-bg-secondary px-6 py-4 space-y-4">
            <nav className="flex flex-col gap-3">
              <Link href="#curriculum" className="text-st-text-secondary hover:text-st-text-primary py-2" onClick={() => setMobileMenuOpen(false)}>Curriculum</Link>
              <Link href="#schedule" className="text-st-text-secondary hover:text-st-text-primary py-2" onClick={() => setMobileMenuOpen(false)}>Schedule</Link>
              <Link href="#mastery" className="text-st-text-secondary hover:text-st-text-primary py-2" onClick={() => setMobileMenuOpen(false)}>Mastery</Link>
              <Link href="#forum" className="text-st-text-secondary hover:text-st-text-primary py-2" onClick={() => setMobileMenuOpen(false)}>Forum</Link>
              <Link href="#features" className="text-st-text-secondary hover:text-st-text-primary py-2" onClick={() => setMobileMenuOpen(false)}>Features</Link>
            </nav>
            <div className="flex items-center gap-2 pt-2 border-t border-st-border">
              <ThemeToggle />
            </div>
            <div className="flex flex-col gap-3 pt-2">
              {!isAuthenticated && (
                <>
                  <Link href="/login">
                    <Button variant="ghost" className="w-full">Sign In</Button>
                  </Link>
                  <Link href="/register">
                    <Button className="w-full bg-gradient-to-r from-st-accent to-st-accent-hover text-white border-0">Get Started Free</Button>
                  </Link>
                </>
              )}
              {isAuthenticated && (
                <>
                  <Link href="/dashboard">
                    <Button variant="ghost" className="w-full">Go to Dashboard</Button>
                  </Link>
                </>
              )}
            </div>
          </div>
        )}
      </header>

      <main className="flex-1 pt-20">
        {/* Hero Section */}
        <section className="relative overflow-hidden min-h-[90vh] flex items-center">
          {/* Background Video */}
          <div className="absolute inset-0 z-0">
            <video 
              ref={videoRef}
              autoPlay 
              muted={videoMuted}
              playsInline 
              onEnded={handleVideoEnded}
              className="w-full h-full object-cover opacity-100 transition-opacity duration-1000"
            >
              <source src={backgroundVideos[currentVideoIndex]} type="video/mp4" />
            </video>
            <button
              onClick={() => {
                setVideoMuted(prev => !prev);
                if (videoRef.current) videoRef.current.muted = !videoMuted;
              }}
              className="absolute top-6 right-6 z-20 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 flex items-center justify-center transition-colors border border-white/10"
              aria-label={videoMuted ? "Unmute video" : "Mute video"}
            >
              {videoMuted ? (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><line x1="23" y1="9" x2="17" y2="15"/><line x1="17" y1="9" x2="23" y2="15"/></svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>
              )}
            </button>
            <div className="absolute inset-0 bg-st-bg-primary/50 pointer-events-none" />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-st-bg-primary/20 to-st-bg-primary pointer-events-none" />
          </div>

          <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-st-accent/10 blur-[150px] rounded-full pointer-events-none z-0" />
          <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-st-accent/10 blur-[120px] rounded-full pointer-events-none z-0" />

          <div className="relative z-10 max-w-7xl mx-auto px-6 pt-24 pb-32 md:pt-32 md:pb-40 w-full">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <motion.div 
                className="flex-1 text-center lg:text-left"
                style={{ y: y1, opacity }}
              >
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-st-accent/30 bg-st-accent/10 mb-8">
                  <Sparkles size={14} className="text-st-accent" />
                  <span className="text-xs font-semibold text-st-accent uppercase tracking-widest">Advanced Training Protocol</span>
                </div>

                <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-tight mb-6">
                  Master <span className="text-transparent bg-clip-text bg-gradient-to-r from-st-accent via-st-accent-hover to-st-accent">Software Engineering</span>
                  <br />
                  <span className="text-st-text-primary">Systematically</span>
                </h1>

                <p className="text-lg md:text-xl text-st-text-secondary max-w-2xl mx-auto lg:mx-0 leading-relaxed mb-10">
                  A high-fidelity learning operating system designed for deep work, technical rigor, and accelerated career growth. Track every milestone, own every skill.
                </p>

                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                  {!isAuthenticated && (
                    <Link href="/register" >
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button size="lg" className="text-base px-8 bg-gradient-to-r from-st-accent to-st-accent-hover hover:from-st-accent-hover hover:to-st-accent text-white border-0 shadow-xl shadow-st-accent/20">
                          Start Your Journey <ArrowRight size={18} className="ml-2" />
                        </Button>
                      </motion.div>
                    </Link>
                  )}
                  {isAuthenticated && (
                    <Link href="/dashboard">
                      <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        <Button size="lg" className="text-base px-8 bg-gradient-to-r from-st-accent to-st-accent-hover hover:from-st-accent-hover hover:to-st-accent text-white border-0 shadow-xl shadow-st-accent/20">
                          Go to Dashboard <ArrowRight size={18} className="ml-2" />
                        </Button>
                      </motion.div>
                    </Link>
                  )}
                  <Link href="#curriculum">
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" size="lg" className="text-base px-8 border-st-border hover:border-st-accent/50">
                        Explore Curriculum
                      </Button>
                    </motion.div>
                  </Link>
                </div>

                <div className="flex items-center gap-6 mt-12 justify-center lg:justify-start">
                  <div className="flex -space-x-2">
                    {[1,2,3,4].map((i) => (
                      <div key={i} className="w-8 h-8 rounded-full bg-gradient-to-br from-st-accent to-st-accent-hover border-2 border-st-bg-primary flex items-center justify-center text-[10px] font-bold text-white">
                        {String.fromCharCode(64 + i)}
                      </div>
                    ))}
                  </div>
                  <div className="text-sm text-st-text-secondary">
                    <span className="text-st-text-primary font-semibold">2,400+</span> engineers already learning
                  </div>
                </div>
              </motion.div>

              {/* Terminal Visual */}
              <motion.div 
                className="flex-1 w-full max-w-lg"
                style={{ y: y2, opacity }}
              >
                <div className="rounded-2xl border border-st-border/50 bg-st-bg-secondary/70 backdrop-blur-xl p-6 shadow-2xl relative overflow-hidden">
                  <div className="flex items-center gap-2 mb-6">
                    <div className="w-3 h-3 rounded-full bg-st-danger/80"></div>
                    <div className="w-3 h-3 rounded-full bg-st-warning/80"></div>
                    <div className="w-3 h-3 rounded-full bg-st-success/80"></div>
                    <span className="ml-3 text-xs text-st-text-muted font-mono">~/studytrack/senior_track</span>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm">
                      <span className="text-st-success">$</span>
                      <span className="text-st-text-primary">./start-mastery --track senior</span>
                    </div>
                    <div className="text-sm text-st-text-muted font-mono space-y-1 pl-4">
                      <p>{'>'} Loading curriculum... <span className="text-st-success">done</span></p>
                      <p>{'>'} Analyzing skill gaps... <span className="text-st-success">done</span></p>
                      <p>{'>'} Generating study plan... <span className="text-st-accent">in progress</span></p>
                      <motion.p 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: [0, 1, 0, 1] }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        className="font-bold"
                      >
                        {'>'} Ready. Your first session: <span className="text-st-accent">System Design — Caching</span>
                      </motion.p>
                    </div>

                    <div className="mt-6 grid grid-cols-3 gap-3">
                      <motion.div whileHover={{ scale: 1.05 }} className="p-3 rounded-lg bg-st-bg-card border border-st-border">
                        <p className="text-st-text-muted text-[10px] uppercase tracking-wider mb-1">Mastery</p>
                        <p className="text-xl font-bold text-st-accent">87%</p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} className="p-3 rounded-lg bg-st-bg-card border border-st-border">
                        <p className="text-st-text-muted text-[10px] uppercase tracking-wider mb-1">Streak</p>
                        <p className="text-xl font-bold text-st-text-primary">42d</p>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.05 }} className="p-3 rounded-lg bg-st-bg-card border border-st-border">
                        <p className="text-st-text-muted text-[10px] uppercase tracking-wider mb-1">Sessions</p>
                        <p className="text-xl font-bold text-st-text-primary">156</p>
                      </motion.div>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Stats Bar */}
        <section className="border-y border-st-border bg-st-bg-secondary/50 overflow-hidden">
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-7xl mx-auto px-6 py-12"
          >
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {[
                { label: "Learning Modules", value: "200+" },
                { label: "Active Engineers", value: "2,400+" },
                { label: "Completion Rate", value: "94%" },
                { label: "Avg. Skill Gain", value: "3.2x" },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <p className="text-3xl md:text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-st-accent to-st-accent-hover">{stat.value}</p>
                  <p className="text-sm text-st-text-muted mt-1">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>
        </section>

        {/* Curriculum Section */}
        <section id="curriculum" className="py-24 md:py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-st-accent/[0.02] to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 relative">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-st-accent/30 bg-st-accent/10 mb-4">
                <BookOpen size={14} className="text-st-accent" />
                <span className="text-xs font-semibold text-st-accent uppercase tracking-wider">Learning Path</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-st-text-primary mb-4">
                Structured <span className="text-transparent bg-clip-text bg-gradient-to-r from-st-accent to-st-accent-hover">Curriculum</span>
              </h2>
              <p className="text-st-text-secondary max-w-2xl mx-auto text-lg">
                A carefully sequenced progression from core fundamentals to advanced system design, designed by senior engineers at top tech companies.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {curriculumModules.map((module, index) => (
                <motion.div 
                  key={module.id}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: index * 0.1 }}
                  whileHover={{ y: -10, rotateX: 2, rotateY: -2, zIndex: 10 }}
                >
                  <Card className="p-6 hover:border-st-accent/30 transition-all duration-300 group h-full cursor-pointer hover:shadow-2xl hover:shadow-st-accent/10 bg-st-bg-card/80 backdrop-blur-sm">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-bold"
                        style={{ backgroundColor: `${module.color}20`, color: module.color }}>
                        {String(index + 1).padStart(2, '0')}
                      </div>
                      <span className="text-sm font-medium" style={{ color: module.color }}>{module.progress}%</span>
                    </div>
                    <h3 className="text-lg font-semibold text-st-text-primary mb-2">{module.name}</h3>
                    <p className="text-sm text-st-text-secondary mb-4">{module.description}</p>
                    <div className="flex items-center justify-between mt-auto">
                      <span className="text-xs text-st-text-muted">{module.topics} topics</span>
                      <div className="w-24 h-1.5 rounded-full bg-st-border overflow-hidden">
                        <div className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                          style={{ width: `${module.progress}%`, backgroundColor: module.color }} />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
              <motion.div
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: 0.5 }}
                whileHover={{ scale: 1.02 }}
              >
                <Card className="p-6 border-dashed border-st-border hover:border-st-accent/30 transition-all duration-300 flex flex-col items-center justify-center text-center min-h-[200px] h-full group cursor-pointer bg-transparent">
                  <div className="w-12 h-12 rounded-full bg-st-accent/10 flex items-center justify-center mb-3 group-hover:bg-st-accent/20 transition-colors">
                    <ChevronRight size={20} className="text-st-accent" />
                  </div>
                  <p className="text-sm font-medium text-st-accent">View Full Curriculum</p>
                  <p className="text-xs text-st-text-muted mt-1">52 weeks of structured learning</p>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Schedule Section */}
        <section id="schedule" className="py-24 md:py-32 bg-st-bg-secondary/30 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className="flex-1"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-st-accent/30 bg-st-accent/10 mb-4">
                  <Calendar size={14} className="text-st-accent" />
                  <span className="text-xs font-semibold text-st-accent uppercase tracking-wider">Intelligent Planning</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-st-text-primary mb-4">
                  Smart <span className="text-transparent bg-clip-text bg-gradient-to-r from-st-accent to-st-accent-hover">Schedule</span> That Adapts
                </h2>
                <p className="text-st-text-secondary text-lg mb-8 max-w-lg">
                  Our AI-powered scheduler learns your patterns and optimizes your study timetable for maximum retention and minimum burnout.
                </p>

                <div className="space-y-6">
                  {[
                    { icon: Clock, title: "Adaptive Time Blocking", desc: "Automatically schedules deep work sessions during your peak focus hours based on historical performance data." },
                    { icon: Target, title: "Spaced Repetition", desc: "Reviews are intelligently spaced to move knowledge from short-term to long-term memory efficiently." },
                    { icon: Zap, title: "Energy-Aware Planning", desc: "Detects mental fatigue patterns and adjusts session intensity to prevent burnout." },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4">
                      <div className="w-10 h-10 rounded-lg bg-st-accent/10 flex items-center justify-center shrink-0">
                        <item.icon size={18} className="text-st-accent" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-st-text-primary">{item.title}</h4>
                        <p className="text-sm text-st-text-secondary">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex-1 w-full max-w-md"
              >
                <Card className="p-6 overflow-hidden">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-st-text-primary">This Week</h3>
                    <span className="text-xs text-st-text-muted">Week 24</span>
                  </div>
                  <div className="space-y-3">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, i) => (
                      <div key={day} className="flex items-center gap-4 p-2 rounded-lg hover:bg-st-bg-card transition-colors">
                        <span className="w-8 text-xs font-medium text-st-text-muted">{day}</span>
                        <div className="flex-1 h-2 rounded-full bg-st-border overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-st-accent to-st-accent-hover"
                            style={{ width: `${[80, 100, 60, 90, 75, 50, 30][i]}%` }} />
                        </div>
                        <span className="text-xs text-st-text-muted w-12 text-right">{[4, 5, 3, 4.5, 3.5, 2, 1][i]}h</span>
                      </div>
                    ))}
                  </div>
                  <div className="mt-6 pt-4 border-t border-st-border flex justify-between items-center">
                    <span className="text-sm text-st-text-muted">Total: <strong className="text-st-text-primary">23 hours</strong></span>
                    <span className="text-xs text-st-success flex items-center gap-1"><CheckCircle size={12} /> On track</span>
                  </div>
                </Card>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Mastery Section */}
        <section id="mastery" className="py-24 md:py-32 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <div className="flex flex-col lg:flex-row items-center gap-16">
              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6 }}
                className="flex-1 order-2 lg:order-1 w-full max-w-md"
              >
                <Card className="p-6">
                  <div className="flex items-center justify-between mb-6">
                    <h3 className="font-semibold text-st-text-primary">Skill Radar</h3>
                    <Trophy size={18} className="text-st-warning" />
                  </div>

                  <div className="space-y-4">
                    {[
                      { skill: "System Design", level: 85 },
                      { skill: "Algorithms", level: 92 },
                      { skill: "Frontend", level: 78 },
                      { skill: "Backend", level: 88 },
                      { skill: "DevOps", level: 65 },
                      { skill: "Databases", level: 72 },
                    ].map((item) => (
                      <div key={item.skill}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-st-text-primary">{item.skill}</span>
                          <span className="text-st-text-muted">{item.level}%</span>
                        </div>
                        <div className="h-2 rounded-full bg-st-border overflow-hidden">
                          <div className="h-full rounded-full bg-gradient-to-r from-st-accent to-st-accent-hover transition-all duration-500"
                            style={{ width: `${item.level}%` }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 pt-4 border-t border-st-border">
                    <div className="grid grid-cols-2 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-st-text-primary">42</p>
                        <p className="text-xs text-st-text-muted">Day Streak</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-st-accent">156</p>
                        <p className="text-xs text-st-text-muted">Sessions</p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 50 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="flex-1 order-1 lg:order-2"
              >
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-st-accent/30 bg-st-accent/10 mb-4">
                  <BarChart3 size={14} className="text-st-accent" />
                  <span className="text-xs font-semibold text-st-accent uppercase tracking-wider">Analytics</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-st-text-primary mb-4">
                  Track Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-st-accent to-st-accent-hover">Mastery</span> Journey
                </h2>
                <p className="text-st-text-secondary text-lg mb-8 max-w-lg">
                  Real-time analytics that show exactly where you stand. Detailed skill breakdowns, streak tracking, and performance trends to keep you moving forward.
                </p>

                <div className="space-y-6">
                  {[
                    { icon: Trophy, title: "Streak System", desc: "Maintain daily learning streaks. The longest streak is 365 days and counting among our top users." },
                    { icon: BarChart3, title: "Performance Trends", desc: "Track your progress across all skills with detailed charts and predictive analytics." },
                    { icon: Star, title: "Achievement Badges", desc: "Earn badges for milestones — complete modules, maintain streaks, and master skills." },
                  ].map((item) => (
                    <div key={item.title} className="flex gap-4">
                      <div className="w-10 h-10 rounded-lg bg-st-accent/10 flex items-center justify-center shrink-0">
                        <item.icon size={18} className="text-st-accent" />
                      </div>
                      <div>
                        <h4 className="font-semibold text-st-text-primary">{item.title}</h4>
                        <p className="text-sm text-st-text-secondary">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Forum Section */}
        <section id="forum" className="py-24 md:py-32 bg-st-bg-secondary/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-st-accent/5 blur-[120px] rounded-full pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 relative">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-st-accent/30 bg-st-accent/10 mb-4">
                <MessageSquare size={14} className="text-st-accent" />
                <span className="text-xs font-semibold text-st-accent uppercase tracking-wider">Community</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-st-text-primary mb-4">
                Learn Together, <span className="text-transparent bg-clip-text bg-gradient-to-r from-st-accent to-st-accent-hover">Grow Together</span>
              </h2>
              <p className="text-st-text-secondary max-w-2xl mx-auto text-lg">
                Join a community of passionate engineers. Share knowledge, get code reviews, and accelerate your growth through collaboration.
              </p>
            </motion.div>

            <div className="grid md:grid-cols-3 gap-8">
              {[
                { icon: MessageSquare, title: "Technical Discussions", desc: "Dive deep into architecture debates, code reviews, and problem-solving threads with fellow engineers." },
                { icon: Users, title: "Mentorship Program", desc: "Get paired with senior engineers who provide personalized guidance and career advice." },
                { icon: Layers, title: "Study Groups", desc: "Form or join focused study groups tackling the same curriculum modules together." }
              ].map((card, i) => (
                <motion.div 
                  key={card.title}
                  initial={{ opacity: 0, y: 50 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  whileHover={{ y: -10, scale: 1.02 }}
                >
                  <Card className="p-6 text-center hover:border-st-accent/30 transition-all duration-300 group h-full">
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-st-accent/20 to-st-accent-hover/20 flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                      <card.icon size={28} className="text-st-accent" />
                    </div>
                    <h3 className="text-lg font-semibold text-st-text-primary mb-2">{card.title}</h3>
                    <p className="text-sm text-st-text-secondary">{card.desc}</p>
                  </Card>
                </motion.div>
              ))}
            </div>

            <div className="mt-12 text-center">
              {!isAuthenticated && (
                <Link href="/register" >
                  <Button size="lg" className="bg-gradient-to-r from-st-accent to-st-accent-hover text-white border-0 shadow-xl shadow-st-accent/20">
                    Join the Community <ArrowRight size={18} className="ml-2" />
                  </Button>
                </Link>
              )}
              {isAuthenticated && (
                <Link href="/dashboard">
                  <Button size="lg" className="bg-gradient-to-r from-st-accent to-st-accent-hover text-white border-0 shadow-xl shadow-st-accent/20">
                    Go to Dashboard <ArrowRight size={18} className="ml-2" />
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </section>

        {/* Features / Project Details Section */}
        <section id="features" className="py-24 md:py-32 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="text-center mb-16"
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-st-accent/30 bg-st-accent/10 mb-4">
                <HardDrive size={14} className="text-st-accent" />
                <span className="text-xs font-semibold text-st-accent uppercase tracking-wider">Platform Features</span>
              </div>
              <h2 className="text-3xl md:text-5xl font-bold text-st-text-primary mb-4">
                Everything You Need to <span className="text-transparent bg-clip-text bg-gradient-to-r from-st-accent to-st-accent-hover">Excel</span>
              </h2>
              <p className="text-st-text-secondary max-w-2xl mx-auto text-lg">
                A complete learning ecosystem with persistent data storage, file management, and real-time synchronization across all your devices.
              </p>
            </motion.div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {features.map((feature, i) => (
                <motion.div 
                  key={feature.title}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ duration: 0.4, delay: i * 0.05 }}
                  whileHover={{ y: -5, scale: 1.03 }}
                >
                  <Card className="p-5 hover:border-st-accent/30 transition-all duration-300 group h-full cursor-default">
                    <div className="w-10 h-10 rounded-lg bg-st-accent/10 flex items-center justify-center mb-4 group-hover:bg-st-accent/20 transition-colors">
                      <feature.icon size={20} className="text-st-accent" />
                    </div>
                    <h3 className="font-semibold text-st-text-primary mb-2 text-sm">{feature.title}</h3>
                    <p className="text-xs text-st-text-secondary leading-relaxed">{feature.description}</p>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Data Storage Section */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Card className="mt-16 p-8 md:p-12 bg-gradient-to-br from-st-accent/5 via-st-accent-hover/5 to-transparent border-st-accent/20 relative overflow-hidden group">
                <motion.div 
                  className="absolute inset-0 bg-st-accent/5" 
                  initial={{ x: "-100%" }}
                  whileHover={{ x: "100%" }}
                  transition={{ duration: 1.5, ease: "easeInOut" }}
                />
                <div className="flex flex-col md:flex-row items-center gap-8 relative z-10">
                  <div className="flex-1 text-center md:text-left">
                    <div className="flex items-center gap-2 justify-center md:justify-start mb-4">
                      <Database size={20} className="text-st-accent" />
                      <span className="text-sm font-semibold text-st-accent uppercase tracking-wider">Secure Data Layer</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-bold text-st-text-primary mb-4">
                      Persistent Storage for Everything
                    </h3>
                    <p className="text-st-text-secondary mb-6">
                      All your learning data is securely stored and instantly accessible. Upload images, PDFs, videos, and code files — the platform manages your complete learning repository.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { icon: Image, label: "Images", desc: "Screenshots, diagrams" },
                        { icon: FileText, label: "PDFs", desc: "eBooks, papers, notes" },
                        { icon: Play, label: "Videos", desc: "Lectures, walkthroughs" },
                        { icon: GitBranch, label: "Code", desc: "Snippets, projects" },
                      ].map((item, _) => (
                        <motion.div 
                          key={item.label} 
                          whileHover={{ scale: 1.05 }}
                          className="text-center p-3 rounded-lg bg-st-bg-card/50 border border-st-border/50 cursor-default"
                        >
                          <item.icon size={20} className="text-st-accent mx-auto mb-1" />
                          <p className="text-xs font-semibold text-st-text-primary">{item.label}</p>
                          <p className="text-[10px] text-st-text-muted">{item.desc}</p>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  <motion.div 
                    whileHover={{ rotate: 5, scale: 1.1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 10 }}
                    className="md:w-64 text-center cursor-default"
                  >
                    <div className="w-32 h-32 rounded-2xl bg-gradient-to-br from-st-accent/20 to-st-accent-hover/20 border border-st-accent/20 flex items-center justify-center mx-auto shadow-2xl shadow-st-accent/10">
                      <Database size={48} className="text-st-accent" />
                    </div>
                    <p className="text-sm text-st-text-muted mt-4">Your data, always available</p>
                  </motion.div>
                </div>
              </Card>
            </motion.div>
          </div>
        </section>

        {/* Munra Extension Section */}
        <section className="py-24 md:py-32 bg-st-bg-secondary/30 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-st-accent/[0.02] to-transparent pointer-events-none" />
          <div className="max-w-7xl mx-auto px-6 relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="flex flex-col lg:flex-row items-center gap-12"
            >
              <div className="flex-1 text-center lg:text-left">
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-st-accent/30 bg-st-accent/10 mb-4">
                  <Zap size={14} className="text-st-accent" />
                  <span className="text-xs font-semibold text-st-accent uppercase tracking-wider">Browser Extension</span>
                </div>
                <h2 className="text-3xl md:text-5xl font-bold text-st-text-primary mb-4">
                  Supercharge with <span className="text-transparent bg-clip-text bg-gradient-to-r from-st-accent to-st-accent-hover">Munra</span>
                </h2>
                <p className="text-st-text-secondary text-lg mb-6 max-w-lg mx-auto lg:mx-0">
                  Automatically track your browsing activity, sync study sessions, and get real-time productivity insights — directly from your browser.
                </p>
                <div className="flex flex-col sm:flex-row items-center gap-4 justify-center lg:justify-start">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-st-accent to-st-accent-hover text-white border-0 shadow-xl shadow-st-accent/20"
                      onClick={() => {
                        window.open("/munra-install", "_blank");
                      }}
                    >
                      <Zap size={16} className="mr-2" />
                      Install Munra
                    </Button>
                  </motion.div>
                  <div id="munra-status" className="text-sm text-st-text-muted flex items-center gap-2">
                    <span className={`w-2 h-2 rounded-full inline-block ${munraActive === null ? 'bg-st-border' : munraActive ? 'bg-st-success' : 'bg-st-warning'}`} />
                    <span>{munraActive === null ? 'Checking extension...' : munraActive ? 'Munra extension is active' : 'Munra extension not detected — click Install to add it'}</span>
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

        {/* CTA Section */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-st-accent/[0.03] to-transparent pointer-events-none" />
          <motion.div 
            initial={{ opacity: 0, y: 50 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="max-w-4xl mx-auto px-6 text-center relative"
          >
            <h2 className="text-3xl md:text-5xl font-bold text-st-text-primary mb-6">
              Ready to Transform Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-st-accent to-st-accent-hover">Engineering Career</span>?
            </h2>
            <p className="text-st-text-secondary text-lg mb-10 max-w-2xl mx-auto">
              Join thousands of engineers who have accelerated their careers through systematic, structured mastery. Start your journey today.
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 justify-center">
              {!isAuthenticated && (
                <>
                  <Link href="/register" >
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button size="lg" className="text-base px-10 bg-gradient-to-r from-st-accent to-st-accent-hover hover:from-st-accent-hover hover:to-st-accent text-white border-0 shadow-2xl shadow-st-accent/20">
                        Start Free <ArrowRight size={18} className="ml-2" />
                      </Button>
                    </motion.div>
                  </Link>
                  <Link href="/login" >
                    <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                      <Button variant="outline" size="lg" className="text-base px-10">
                        Sign In
                      </Button>
                    </motion.div>
                  </Link>
                </>
              )}
              {isAuthenticated && (
                <Link href="/dashboard">
                  <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                    <Button size="lg" className="text-base px-10 bg-gradient-to-r from-st-accent to-st-accent-hover hover:from-st-accent-hover hover:to-st-accent text-white border-0 shadow-2xl shadow-st-accent/20">
                      Go to Dashboard <ArrowRight size={18} className="ml-2" />
                    </Button>
                  </motion.div>
                </Link>
              )}
            </div>
            <p className="text-xs text-st-text-muted mt-6">No credit card required. Free tier includes full curriculum access.</p>
          </motion.div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-st-border bg-st-bg-secondary">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
            <div className="col-span-2 md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-st-accent to-st-accent-hover rounded-lg flex items-center justify-center">
                  <span className="font-bold text-white text-sm">S</span>
                </div>
                <span className="text-lg font-bold text-st-text-primary">StudyTrack</span>
              </Link>
              <p className="text-sm text-st-text-secondary max-w-xs">
                Building the next generation of software engineers through systemic mastery and data-driven learning.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-st-text-primary mb-4 uppercase tracking-wider">Platform</h4>
              <ul className="space-y-2 text-sm text-st-text-secondary">
                <li><Link href="#curriculum" className="hover:text-st-accent transition-colors">Curriculum</Link></li>
                <li><Link href="#schedule" className="hover:text-st-accent transition-colors">Schedule</Link></li>
                <li><Link href="#mastery" className="hover:text-st-accent transition-colors">Mastery</Link></li>
                <li><Link href="#forum" className="hover:text-st-accent transition-colors">Forum</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-st-text-primary mb-4 uppercase tracking-wider">Resources</h4>
              <ul className="space-y-2 text-sm text-st-text-secondary">
                <li><Link href="#" className="hover:text-st-accent transition-colors">Documentation</Link></li>
                <li><Link href="#" className="hover:text-st-accent transition-colors">API Reference</Link></li>
                <li><Link href="#" className="hover:text-st-accent transition-colors">Blog</Link></li>
                <li><Link href="#" className="hover:text-st-accent transition-colors">Community</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-st-text-primary mb-4 uppercase tracking-wider">Company</h4>
              <ul className="space-y-2 text-sm text-st-text-secondary">
                <li><Link href="#" className="hover:text-st-accent transition-colors">About</Link></li>
                <li><Link href="#" className="hover:text-st-accent transition-colors">Careers</Link></li>
                <li><Link href="#" className="hover:text-st-accent transition-colors">Privacy</Link></li>
                <li><Link href="#" className="hover:text-st-accent transition-colors">Terms</Link></li>
              </ul>
            </div>
          </div>

          <div className="pt-8 border-t border-st-border flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-xs text-st-text-muted"> 2026 StudyTrack. All rights reserved.</p>
            <div className="flex gap-6 text-xs text-st-text-muted">
              <Link href="#" className="hover:text-st-accent transition-colors">Privacy Policy</Link>
              <Link href="#" className="hover:text-st-accent transition-colors">Terms of Service</Link>
              <Link href="#" className="hover:text-st-accent transition-colors">Cookie Policy</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
