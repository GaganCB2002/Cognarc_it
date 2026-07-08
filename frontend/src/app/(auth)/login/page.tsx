"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Mail, Lock, KeyRound, ShieldCheck, RefreshCw, ArrowLeft, Beaker } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";

type Step = "CREDENTIALS" | "OTP";

export default function LoginPage() {
  const { loginStep1, loginStep2 } = useAuth();

  const [step, setStep] = useState<Step>("CREDENTIALS");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [captchaKey, setCaptchaKey] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");

  const [loginData, setLoginData] = useState<{ otpKey: string; userId: string } | null>(null);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpError, setOtpError] = useState("");

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

    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-${index + 1}`);
      nextInput?.focus();
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  const handleStep1 = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!captchaKey || !captchaAnswer) {
        throw new Error("Please solve the captcha");
      }
      const res = await loginStep1(email, password, captchaKey, Number(captchaAnswer));
      setLoginData({ otpKey: res.otpKey, userId: res.userId });
      setStep("OTP");
      setResendCooldown(30);
    } catch (err: any) {
      setError(err.message || "Login failed");
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  const handleStep2 = async (e: React.FormEvent) => {
    e.preventDefault();
    setOtpError("");
    setLoading(true);

    const otpCode = otp.join("");
    if (otpCode.length !== 6) {
      setOtpError("Please enter the full 6-digit code");
      setLoading(false);
      return;
    }

    try {
      await loginStep2(loginData!.userId, loginData!.otpKey, otpCode);
    } catch (err: any) {
      setOtpError(err.message || "Invalid or expired OTP");
      setOtp(["", "", "", "", "", ""]);
      const firstInput = document.getElementById("otp-0");
      firstInput?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendCooldown > 0 || !loginData) return;
    try {
      const res = await api.post<{ otpKey: string }>("/auth/resend-otp", { userId: loginData.userId });
      setLoginData((prev) => prev ? { ...prev, otpKey: res.otpKey } : null);
      setResendCooldown(30);
      setOtp(["", "", "", "", "", ""]);
    } catch (err: any) {
      setOtpError(err.message || "Failed to resend OTP");
    }
  };

  const handleBackToCredentials = () => {
    setStep("CREDENTIALS");
    setOtp(["", "", "", "", "", ""]);
    setOtpError("");
    setLoginData(null);
    fetchCaptcha();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-st-text-primary">
          {step === "CREDENTIALS" ? "Sign in to your account" : "Verify your identity"}
        </h3>
        {process.env.NEXT_PUBLIC_ENABLE_TEST_AUTH === "true" && step === "CREDENTIALS" && (
          <Button type="button" variant="outline" size="sm" onClick={() => { setEmail(process.env.NEXT_PUBLIC_TEST_EMAIL || "test@studytrack.dev"); setPassword(process.env.NEXT_PUBLIC_TEST_PASSWORD || "password123"); }} className="text-xs py-1 h-8 border-st-accent text-st-accent hover:bg-st-accent/10">
            <Beaker size={14} className="mr-1" /> Auto Fill Test
          </Button>
        )}
      </div>

      <AnimatePresence mode="wait">
        {step === "CREDENTIALS" ? (
          <motion.form key="credentials" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.25 }} className="space-y-5" onSubmit={handleStep1}>
            <Input label="Email address" id="email" name="email" type="email" autoComplete="email" required placeholder="developer@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
            <div>
              <Input label="Password" id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
              <div className="flex items-center justify-end mt-2">
                <Link href="/forgot-password" className="text-sm font-medium text-st-accent hover:text-st-accent-hover">Forgot your password?</Link>
              </div>
            </div>

            <div className="rounded-xl border border-st-border/50 bg-st-bg-elevated/50 p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-st-text-muted uppercase tracking-wider">Security Verification</span>
                <button type="button" onClick={fetchCaptcha} className="text-st-text-muted hover:text-st-accent transition-colors" aria-label="Refresh captcha">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-sm font-medium text-st-text-primary mb-3 text-center py-2 bg-st-bg-card rounded-lg border border-st-border/30">{captchaQuestion || "Loading..."}</p>
              <input type="number" placeholder="Your answer" required value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)} className="w-full bg-st-bg-card border border-st-border rounded-lg px-3 py-2 text-sm text-st-text-primary placeholder-st-text-muted focus:outline-none focus:ring-1 focus:ring-st-accent [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" />
            </div>

            {error && <p className="text-sm text-st-danger text-center">{error}</p>}
            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-st-accent to-st-accent-hover text-black border-0 hover:from-st-accent-hover hover:to-st-accent font-bold">
              {loading ? "Verifying..." : "Continue"}
            </Button>
          </motion.form>
        ) : (
          <motion.form key="otp" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 20 }} transition={{ duration: 0.25 }} className="space-y-6" onSubmit={handleStep2}>
            <div className="text-center">
              <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-st-accent/20 to-st-accent/5 flex items-center justify-center mb-4 border border-st-accent/10">
                <ShieldCheck className="w-7 h-7 text-st-accent" />
              </div>
              <p className="text-sm text-st-text-secondary">Enter the 6-digit code sent to</p>
              <p className="text-sm font-semibold text-st-text-primary mt-1">{email}</p>
            </div>

            <div className="flex justify-center gap-2 sm:gap-3">
              {otp.map((digit, i) => (
                <input key={i} id={`otp-${i}`} type="text" inputMode="numeric" maxLength={1} required value={digit} onChange={(e) => handleOtpChange(i, e.target.value)} onKeyDown={(e) => handleOtpKeyDown(i, e)} autoFocus={i === 0} className="w-10 h-12 sm:w-12 sm:h-14 text-center text-lg font-bold bg-st-bg-card border border-st-border rounded-xl text-st-text-primary focus:outline-none focus:ring-2 focus:ring-st-accent focus:border-st-accent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none" aria-label={`OTP digit ${i + 1}`} />
              ))}
            </div>

            <div className="flex items-center justify-between text-sm">
              <button type="button" onClick={handleBackToCredentials} className="flex items-center gap-1.5 text-st-text-secondary hover:text-st-text-primary transition-colors">
                <ArrowLeft className="w-3.5 h-3.5" /> Back
              </button>
              <button type="button" onClick={handleResendOTP} disabled={resendCooldown > 0} className={`flex items-center gap-1.5 transition-colors ${resendCooldown > 0 ? "text-st-text-muted cursor-not-allowed" : "text-st-accent hover:text-st-accent-hover"}`}>
                <RefreshCw className={`w-3.5 h-3.5 ${resendCooldown > 0 ? "animate-spin" : ""}`} />
                {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
              </button>
            </div>

            {otpError && <p className="text-sm text-st-danger text-center">{otpError}</p>}
            <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-st-accent to-st-accent-hover text-black border-0 hover:from-st-accent-hover hover:to-st-accent font-bold">
              {loading ? "Verifying..." : "Verify & Sign in"}
            </Button>
          </motion.form>
        )}
      </AnimatePresence>

      <p className="mt-8 text-center text-xs text-st-text-secondary">
        Not a member?{" "}
        <Link href="/register" className="font-medium text-st-accent hover:text-st-accent-hover">Apply for early access</Link>
      </p>
    </div>
  );
}
