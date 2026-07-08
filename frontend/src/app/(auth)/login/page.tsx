"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RefreshCw, Beaker, ShieldCheck, Home } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";

function LoginForm() {
  const { login } = useAuth();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "true";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [captchaKey, setCaptchaKey] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [captchaTimer, setCaptchaTimer] = useState(15);

  const fetchCaptcha = useCallback(async () => {
    try {
      const res = await api.get<{ key: string; question: string }>("/auth/captcha");
      setCaptchaKey(res.key);
      setCaptchaQuestion(res.question);
      setCaptchaAnswer("");
      setCaptchaTimer(15);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load captcha");
    }
  }, []);

  useEffect(() => {
    fetchCaptcha();
  }, [fetchCaptcha]);

  useEffect(() => {
    if (captchaTimer > 0) {
      const timer = setTimeout(() => setCaptchaTimer((c) => c - 1), 1000);
      return () => clearTimeout(timer);
    } else if (captchaKey) {
      fetchCaptcha();
    }
  }, [captchaTimer, captchaKey, fetchCaptcha]);


  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!captchaKey || !captchaAnswer) {
        throw new Error("please solve the captcha");
      }
      await login(email, password, captchaKey, captchaAnswer);
    } catch (err: any) {
      setError(err.message || "login failed");
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center mb-6">
        <Link href="/" className="p-2 mr-3 rounded-lg hover:bg-st-bg-elevated transition-colors" aria-label="Home">
          <Home className="w-5 h-5 text-st-text-secondary" />
        </Link>
        <h3 className="text-xl font-semibold text-st-text-primary flex-1">sign in to your account</h3>
        <div className="flex gap-2">
          <Button type="button" variant="outline" size="sm" onClick={() => { setEmail("user@studytrack.dev"); setPassword("password123"); }} className="text-xs py-1 h-8 border-st-accent text-st-accent hover:bg-st-accent/10">
            <Beaker size={14} className="mr-1" /> User
          </Button>
          <Button type="button" variant="outline" size="sm" onClick={() => { setEmail("admin@studytrack.dev"); setPassword("password123"); }} className="text-xs py-1 h-8 border-st-accent text-st-accent hover:bg-st-accent/10">
            <ShieldCheck size={14} className="mr-1" /> Admin
          </Button>
        </div>
      </div>

      {justRegistered && (
        <div className="mb-4 p-4 rounded-lg bg-emerald-500/10 border border-emerald-500/30">
          <p className="text-sm text-emerald-400 font-medium">✓ Registration successful!</p>
          <p className="text-xs text-emerald-400/70 mt-1">Your account is ready. Sign in below to get started.</p>
        </div>
      )}

      <motion.form key="credentials" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.25 }} className="space-y-5" onSubmit={handleLogin}>
        <Input label="email address" id="email" name="email" type="email" autoComplete="email" required placeholder="developer@example.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <div>
          <Input label="password" id="password" name="password" type="password" autoComplete="current-password" required placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
          <div className="flex items-center justify-end mt-2">
            <Link href="/forgot-password" className="text-sm font-medium text-st-accent hover:text-st-accent-hover">forgot your password?</Link>
          </div>
        </div>

        <div className="rounded-xl border border-st-border/50 bg-st-bg-elevated/50 p-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-st-text-muted tracking-wider">security verification</span>
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-st-text-muted font-mono">{captchaTimer}s</span>
              <button type="button" onClick={fetchCaptcha} className="text-st-text-muted hover:text-st-accent transition-colors" aria-label="Refresh captcha">
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <p className="text-sm font-medium text-st-text-primary mb-3 text-center py-2 bg-st-bg-card rounded-lg border border-st-border/30 font-mono tracking-wider">{captchaQuestion || "Loading..."}</p>
          <input type="text" placeholder="enter the code shown above" autoComplete="off" required value={captchaAnswer} onChange={(e) => setCaptchaAnswer(e.target.value.toLowerCase())} maxLength={6} className="w-full bg-st-bg-card border border-st-border rounded-lg px-3 py-2 text-sm text-st-text-primary placeholder-st-text-muted focus:outline-none focus:ring-1 focus:ring-st-accent text-center font-mono tracking-[0.3em]" />
        </div>

        {error && <p className="text-sm text-st-danger text-center">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-st-accent to-st-accent-hover text-black border-0 hover:from-st-accent-hover hover:to-st-accent font-bold">
          {loading ? "signing in..." : "continue"}
        </Button>
      </motion.form>

      <p className="mt-8 text-center text-xs text-st-text-secondary">
        not a member?{" "}
        <Link href="/register" className="font-medium text-st-accent hover:text-st-accent-hover">apply for early access</Link>
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-center py-8 text-st-text-muted">Loading...</div>}>
      <LoginForm />
    </Suspense>
  );
}