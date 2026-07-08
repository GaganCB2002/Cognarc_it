"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RefreshCw, ArrowLeft, CheckCircle2, ShieldAlert } from "lucide-react";
import api from "@/lib/api";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [captchaKey, setCaptchaKey] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

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


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await api.post("/auth/forgot-password", {
        email,
        captchaKey,
        captchaAnswer,
      });
      setSent(true);
    } catch (err: any) {
      setError(err.message || "failed to send reset link");
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  if (sent) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center mb-4 border border-emerald-500/10">
          <CheckCircle2 className="w-7 h-7 text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-st-text-primary mb-2">check your inbox</h3>
        <p className="text-sm text-st-text-secondary mb-6">
          if an account exists for <strong className="text-st-text-primary">{email}</strong>, we&apos;ve sent a password reset link.
        </p>
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-st-accent hover:text-st-accent-hover">
          <ArrowLeft className="w-4 h-4" /> back to sign in
        </Link>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-st-accent/20 to-st-accent/5 flex items-center justify-center mb-3 border border-st-accent/10">
          <ShieldAlert className="w-6 h-6 text-st-accent" />
        </div>
        <h3 className="text-xl font-semibold text-st-text-primary">forgot password?</h3>
        <p className="text-sm text-st-text-secondary mt-1">enter your email and we&apos;ll send you a reset link.</p>
      </div>

      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input label="email address" id="email" type="email" autoComplete="email" required placeholder="developer@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />

        <div className="rounded-xl border border-st-border/50 bg-st-bg-elevated/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-st-text-muted tracking-wider">security verification</span>
            <div className="flex items-center gap-2">
              <button type="button" onClick={fetchCaptcha} className="text-st-text-muted hover:text-st-accent transition-colors" aria-label="Refresh captcha">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="text-sm font-medium text-st-text-primary mb-3 text-center py-2 bg-st-bg-card rounded-lg border border-st-border/30 font-mono tracking-wider">{captchaQuestion || "Loading..."}</p>
          <input type="text" placeholder="enter the code shown above" autoComplete="off" required value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value)} maxLength={6} className="w-full bg-st-bg-card border border-st-border rounded-lg px-3 py-2 text-sm text-st-text-primary placeholder-st-text-muted focus:outline-none focus:ring-1 focus:ring-st-accent text-center font-mono tracking-[0.3em]" />
        </div>

        {error && <p className="text-sm text-st-danger text-center">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-st-accent to-st-accent-hover text-black border-0 hover:from-st-accent-hover hover:to-st-accent font-bold">
          {loading ? "sending..." : "send reset link"}
        </Button>
      </form>

      <p className="mt-8 text-center text-sm">
        <Link href="/login" className="font-medium text-st-accent hover:text-st-accent-hover inline-flex items-center gap-1.5">
          <ArrowLeft className="w-3.5 h-3.5" /> back to sign in
        </Link>
      </p>
    </div>
  );
}