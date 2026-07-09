"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BookOpen, UserCog, RefreshCw } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { generateCaptchaChallenge } from "@/lib/captcha";

export default function RegisterPage() {
  const { register } = useAuth();

  const [step] = useState<"FORM" | "SUCCESS">("FORM");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Learner");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [captchaKey, setCaptchaKey] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaTimer, setCaptchaTimer] = useState(300);
  const [showCaptcha, setShowCaptcha] = useState(false);
  const [captchaLoading, setCaptchaLoading] = useState(false);
  const captchaLoadingRef = useRef(false);
  const getErrorMessage = (err: unknown, fallback: string) => {
    if (err instanceof Error) return err.message;
    return fallback;
  };

  const fetchCaptcha = useCallback(async () => {
    if (captchaLoadingRef.current) return;
    captchaLoadingRef.current = true;
    setCaptchaLoading(true);
    try {
      const challenge = generateCaptchaChallenge();
      setCaptchaKey(challenge.key);
      setCaptchaQuestion(challenge.question);
      setCaptchaAnswer("");
      setCaptchaTimer(300);
      setError("");
    } catch (err) {
      setCaptchaKey("");
      setCaptchaQuestion("");
      setError(getErrorMessage(err, "Failed to load captcha. Please refresh."));
    } finally {
      captchaLoadingRef.current = false;
      setCaptchaLoading(false);
    }
  }, []);

  const handleRequireCaptcha = () => {
    if (!showCaptcha) setShowCaptcha(true);
    if (!captchaKey) {
      fetchCaptcha();
    }
  };

  useEffect(() => {
    if (captchaTimer > 0) {
      const timer = setTimeout(() => setCaptchaTimer((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (captchaKey) {
      fetchCaptcha();
    }
  }, [captchaTimer, captchaKey, fetchCaptcha]);


  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await register(name, email, password, captchaKey, captchaAnswer);
    } catch (err: unknown) {
      setError(getErrorMessage(err, "registration failed"));
      handleRequireCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-st-bg-primary">
      <div className="hidden lg:flex w-1/2 flex-col justify-center px-16 relative overflow-hidden border-r border-st-border">
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-st-accent/20 blur-[120px] rounded-full"></div>
          <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <line x1="10%" y1="20%" x2="40%" y2="50%" stroke="#D4A043" strokeWidth="1" strokeOpacity="0.3" />
            <line x1="40%" y1="50%" x2="80%" y2="30%" stroke="#D4A043" strokeWidth="1" strokeOpacity="0.3" />
            <line x1="40%" y1="50%" x2="30%" y2="80%" stroke="#D4A043" strokeWidth="1" strokeOpacity="0.3" />
            <circle cx="10%" cy="20%" r="4" fill="#D4A043" fillOpacity="0.5" />
            <circle cx="40%" cy="50%" r="6" fill="#D4A043" fillOpacity="0.8" />
            <circle cx="80%" cy="30%" r="4" fill="#D4A043" fillOpacity="0.5" />
            <circle cx="30%" cy="80%" r="4" fill="#D4A043" fillOpacity="0.5" />
          </svg>
        </div>
        <div className="relative z-10 max-w-lg">
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-st-text-primary tracking-tight">StudyTrack</h2>
          </div>
          <div className="space-y-6">
            <h3 className="text-sm font-semibold tracking-widest text-st-accent uppercase">Deep Work Ecosystem</h3>
            <h1 className="text-5xl font-bold tracking-tight text-st-text-primary leading-tight">
              Unlock the power of <br /><span className="text-st-accent italic">Focused Intelligence.</span>
            </h1>
            <p className="text-lg text-st-text-secondary leading-relaxed">
              Join 20,000+ scholar-practitioners mastering complex domains through rigorous mental models and structured feedback loops.
            </p>
          </div>
          <div className="mt-16 flex items-center gap-16 border-t border-st-border pt-8">
            <div>
              <p className="text-3xl font-bold text-st-accent mb-1">85%</p>
              <p className="text-sm text-st-text-secondary">Focus Retention</p>
            </div>
            <div className="w-px h-12 bg-st-border"></div>
            <div>
              <p className="text-3xl font-bold text-st-text-primary mb-1">2.4x</p>
              <p className="text-sm text-st-text-secondary">Learning Speed</p>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full lg:w-1/2 flex flex-col justify-center px-8 sm:px-16 xl:px-24 py-12 relative bg-st-bg-secondary">
        <div className="max-w-md w-full mx-auto">
          {step === "FORM" && (
            <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }}>
              <div className="mb-10">
                <h2 className="text-3xl font-bold text-st-text-primary mb-2">Begin Your Journey</h2>
                <p className="text-st-text-secondary text-sm">Create your scholar-practitioner identity.</p>
              </div>
              <form className="space-y-8" onSubmit={handleSignUp}>
                <div className="space-y-3">
                  <label className="text-xs font-semibold tracking-widest text-st-text-muted uppercase">I Am A:</label>
                  <div className="grid grid-cols-2 gap-4">
                    <button type="button" onClick={() => setRole("Learner")} className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all ${role === "Learner" ? "border-st-accent bg-st-bg-card text-st-text-primary" : "border-st-border bg-st-bg-card text-st-text-secondary hover:border-st-text-muted"}`}>
                      <BookOpen className="w-6 h-6 text-st-accent mb-3" /><span className="text-sm font-medium">Learner</span>
                    </button>
                    <button type="button" onClick={() => setRole("Mentor")} className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 transition-all ${role === "Mentor" ? "border-st-accent bg-st-bg-card text-st-text-primary" : "border-st-border bg-st-bg-card text-st-text-secondary hover:border-st-text-muted"}`}>
                      <UserCog className="w-6 h-6 mb-3" /><span className="text-sm font-medium">Mentor</span>
                    </button>
                  </div>
                </div>
                <div className="space-y-5">
                  <Input label="FULL NAME" id="name" type="text" autoComplete="name" required placeholder="E.g. Alan Turing" value={name} onChange={(e) => setName(e.target.value)} className="bg-st-bg-primary uppercase-placeholder" />
                  <Input label="ACADEMIC EMAIL" id="email" type="email" autoComplete="email" required placeholder="name@university.edu" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-st-bg-primary" />
                  <Input label="SECURE KEY" id="password" type="password" autoComplete="new-password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} onFocus={handleRequireCaptcha} className="bg-st-bg-primary" />
                </div>
                <AnimatePresence>
                  {showCaptcha && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
                      <div className="rounded-xl border border-st-border/50 bg-st-bg-elevated/50 p-4">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-xs font-semibold text-st-text-muted tracking-wider">security verification</span>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-st-text-muted font-mono">{Math.floor(captchaTimer / 60)}m {captchaTimer % 60}s</span>
                            <button type="button" onClick={fetchCaptcha} disabled={captchaLoading} className="text-st-text-muted hover:text-st-accent transition-colors disabled:opacity-50"><RefreshCw className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                        <p className="text-sm font-medium text-st-text-primary mb-3 text-center py-2 bg-st-bg-card rounded-lg border border-st-border/30 font-mono tracking-wider">{captchaQuestion || "Loading..."}</p>
                        <input type="text" placeholder="enter the code shown above" autoComplete="off" required value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)} maxLength={10} className="w-full bg-st-bg-card border border-st-border rounded-lg px-3 py-2 text-sm text-st-text-primary placeholder-st-text-muted focus:outline-none focus:ring-1 focus:ring-st-accent text-center font-mono tracking-wider" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
                {error && <p className="text-sm text-st-danger text-center">{error}</p>}
                <div className="pt-4 border-t border-st-border">
                  <Button type="submit" size="lg" disabled={loading} className="w-full tracking-wider font-semibold">{loading ? "initializing..." : "create account"}</Button>
                </div>
              </form>
              <p className="mt-8 text-center text-sm text-st-text-secondary">
                Already part of the ecosystem?{" "}
                <Link href="/login" className="font-medium text-st-accent hover:text-st-accent-hover">Resume Session</Link>
              </p>
            </motion.div>
          )}
        </div>

        <div className="absolute bottom-8 left-8 right-8 flex justify-between items-end border-t border-st-border/50 pt-4">
          <div className="text-xs font-mono text-st-text-muted">ST_VER: 4.0.1</div>
          <div className="flex flex-col items-end gap-2">
            <div className="flex items-center gap-2 px-3 py-1.5 rounded border border-st-border bg-st-bg-primary/50 backdrop-blur-sm">
              <div className="w-2 h-2 rounded-full bg-st-accent animate-pulse"></div>
              <span className="text-xs font-mono text-st-accent tracking-wider">SYSTEM READY</span>
            </div>
            <div className="flex gap-4 text-xs text-st-text-muted">
              <Link href="#" className="hover:text-st-text-primary">Privacy</Link>
              <Link href="#" className="hover:text-st-text-primary">Terms</Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
