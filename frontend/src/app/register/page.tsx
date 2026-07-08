"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { BookOpen, UserCog, ShieldCheck, ArrowLeft, RefreshCw, Mail } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";

type Step = "FORM" | "OTP" | "SUCCESS";

export default function RegisterPage() {
  const { register, verifyEmail } = useAuth();

  const [step, setStep] = useState<Step>("FORM");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("Learner");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [captchaKey, setCaptchaKey] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState("");
  const [registerData, setRegisterData] = useState<{ otpKey: string; userId: string } | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);

  const fetchCaptcha = useCallback(async () => {
    try {
      const res = await api.get<{ key: string; question: string }>("/auth/captcha");
      setCaptchaKey(res.key);
      setCaptchaQuestion(res.question);
      setCaptchaAnswer("");
    } catch {
      setError("Failed to load captcha. Please refresh.");
    }
  }, []);

  useEffect(() => {
    fetchCaptcha();
  }, [fetchCaptcha]);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

  const handleOtpChange = (index: number, value: string) => {
    if (value && !/^\d$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) document.getElementById(`reg-otp-${index + 1}`)?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      document.getElementById(`reg-otp-${index - 1}`)?.focus();
    }
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await register(name, email, password, captchaKey, Number(captchaAnswer));
      setRegisterData({ otpKey: res.otpKey, userId: res.userId });
      setStep("OTP");
      setResendCooldown(30);
    } catch (err: any) {
      setError(err.message || "Registration failed");
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    setLoading(true);
    const otpCode = otp.join("");
    if (otpCode.length !== 6) { setOtpError("Enter the full 6-digit code"); setLoading(false); return; }
    try {
      await verifyEmail(registerData!.userId, registerData!.otpKey, otpCode);
      setStep("SUCCESS");
    } catch (err: any) {
      setOtpError(err.message || "Invalid OTP");
      setOtp(["", "", "", "", "", ""]);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || !registerData) return;
    try {
      const res = await api.post<{ otpKey: string }>("/auth/resend-otp", { userId: registerData.userId });
      setRegisterData((prev) => prev ? { ...prev, otpKey: res.otpKey } : null);
      setResendCooldown(30);
      setOtp(["", "", "", "", "", ""]);
    } catch { }
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
          <AnimatePresence mode="wait">
            {step === "FORM" && (
              <motion.div key="form" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }}>
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
                    <Input label="SECURE KEY" id="password" type="password" autoComplete="new-password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-st-bg-primary" />
                  </div>
                  <div className="rounded-xl border border-st-border/50 bg-st-bg-elevated/50 p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-semibold text-st-text-muted uppercase tracking-wider">Security Verification</span>
                      <button type="button" onClick={fetchCaptcha} className="text-st-text-muted hover:text-st-accent transition-colors"><RefreshCw className="w-3.5 h-3.5" /></button>
                    </div>
                    <p className="text-sm font-medium text-st-text-primary mb-3 text-center py-2 bg-st-bg-card rounded-lg border border-st-border/30">{captchaQuestion || "Loading..."}</p>
                    <input type="number" placeholder="Your answer" required value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)} className="w-full bg-st-bg-card border border-st-border rounded-lg px-3 py-2 text-sm text-st-text-primary placeholder-st-text-muted focus:outline-none focus:ring-1 focus:ring-st-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
                  </div>
                  {error && <p className="text-sm text-st-danger text-center">{error}</p>}
                  <div className="pt-4 border-t border-st-border">
                    <Button type="submit" size="lg" disabled={loading} className="w-full tracking-wider font-semibold">{loading ? "Initializing..." : "INITIALIZE PROFILE"}</Button>
                  </div>
                </form>
                <p className="mt-8 text-center text-sm text-st-text-secondary">
                  Already part of the ecosystem?{" "}
                  <Link href="/login" className="font-medium text-st-accent hover:text-st-accent-hover">Resume Session</Link>
                </p>
              </motion.div>
            )}

            {step === "OTP" && (
              <motion.div key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }}>
                <div className="text-center mb-8">
                  <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-st-accent/20 to-st-accent/5 flex items-center justify-center mb-4 border border-st-accent/10">
                    <ShieldCheck className="w-7 h-7 text-st-accent" />
                  </div>
                  <h2 className="text-2xl font-bold text-st-text-primary mb-2">Verify your email</h2>
                  <p className="text-sm text-st-text-secondary">Enter the 6-digit code sent to <strong className="text-st-text-primary">{email}</strong></p>
                </div>
                <form onSubmit={handleVerifyOTP} className="space-y-6">
                  <div className="flex justify-center gap-2 sm:gap-3">
                    {otp.map((digit, i) => (
                      <input key={i} id={`reg-otp-${i}`} type="text" inputMode="numeric" maxLength={1} required value={digit} onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)} autoFocus={i === 0} className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg font-bold bg-st-bg-card border border-st-border rounded-xl text-st-text-primary focus:outline-none focus:ring-2 focus:ring-st-accent focus:border-st-accent transition-all [appearance:textfield]" aria-label={`OTP digit ${i + 1}`} />
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <button type="button" onClick={() => { setStep("FORM"); setOtpError(""); fetchCaptcha(); }} className="flex items-center gap-1.5 text-st-text-secondary hover:text-st-text-primary"><ArrowLeft className="w-3.5 h-3.5" /> Back</button>
                    <button type="button" onClick={handleResendOTP} disabled={resendCooldown > 0} className={`flex items-center gap-1.5 ${resendCooldown > 0 ? "text-st-text-muted cursor-not-allowed" : "text-st-accent hover:text-st-accent-hover"}`}>
                      <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? "animate-spin" : ""}`} />{resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                    </button>
                  </div>
                  {otpError && <p className="text-sm text-st-danger text-center">{otpError}</p>}
                  <Button type="submit" disabled={loading} className="w-full tracking-wider font-semibold">{loading ? "Verifying..." : "VERIFY & ACTIVATE"}</Button>
                </form>
              </motion.div>
            )}

            {step === "SUCCESS" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-8">
                <div className="w-16 h-16 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center mb-4 border border-emerald-500/10">
                  <Mail className="w-8 h-8 text-emerald-400" />
                </div>
                <h2 className="text-2xl font-bold text-st-text-primary mb-2">Welcome to StudyTrack</h2>
                <p className="text-sm text-st-text-secondary mb-4">Your account is active. Redirecting to your dashboard...</p>
                <div className="w-8 h-8 mx-auto border-2 border-st-accent border-t-transparent rounded-full animate-spin" />
              </motion.div>
            )}
          </AnimatePresence>
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
