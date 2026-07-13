"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import api from "@/lib/api";
import Link from "next/link";
import { Eye, EyeOff, Loader2 } from "lucide-react";

export function LoginForm() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [captchaKey, setCaptchaKey] = useState("");
  const [captchaQuestion, setCaptchaQuestion] = useState("");
  const [captchaAnswer, setCaptchaAnswer] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchCaptcha = useCallback(async () => {
    try {
      const res = await api.get<{ key: string; question: string }>("/auth/captcha");
      setCaptchaKey(res.key);
      setCaptchaQuestion(res.question);
    } catch {
      setError("Failed to load captcha");
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
      await login(email, password, captchaKey, captchaAnswer);
    } catch (err: any) {
      setError(err?.message || "Login failed");
      fetchCaptcha();
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-sm mx-auto">
      {error && (
        <div className="p-3 rounded-lg bg-st-danger/10 border border-st-danger/20 text-st-danger text-sm">{error}</div>
      )}
      <div>
        <label className="block text-sm font-medium text-st-text-secondary mb-1.5">Email</label>
        <input
          type="email"
          value={email}
          onChange={e => setEmail(e.target.value)}
          required
          className="w-full px-3 py-2.5 bg-st-bg-elevated/50 border border-st-border/60 text-st-text-primary rounded-lg focus:border-st-accent/30 focus:ring-2 focus:ring-st-accent/20 transition-all outline-none text-sm"
          placeholder="you@example.com"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-st-text-secondary mb-1.5">Password</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={e => setPassword(e.target.value)}
            required
            className="w-full px-3 py-2.5 bg-st-bg-elevated/50 border border-st-border/60 text-st-text-primary rounded-lg focus:border-st-accent/30 focus:ring-2 focus:ring-st-accent/20 transition-all outline-none text-sm pr-10"
            placeholder="Enter your password"
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-st-text-muted hover:text-st-text-secondary">
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>
      </div>
      <div>
        <label className="block text-sm font-medium text-st-text-secondary mb-1.5">Captcha: {captchaQuestion}</label>
        <input
          type="text"
          value={captchaAnswer}
          onChange={e => setCaptchaAnswer(e.target.value)}
          required
          className="w-full px-3 py-2.5 bg-st-bg-elevated/50 border border-st-border/60 text-st-text-primary rounded-lg focus:border-st-accent/30 focus:ring-2 focus:ring-st-accent/20 transition-all outline-none text-sm"
          placeholder="Enter captcha answer"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full py-2.5 bg-gradient-to-b from-st-accent to-st-accent-hover hover:from-st-accent-hover hover:to-st-accent text-black font-semibold rounded-lg shadow-lg shadow-st-accent/15 hover:shadow-st-accent/25 transition-all disabled:opacity-50 text-sm flex items-center justify-center gap-2"
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin" />}
        {loading ? "Signing in..." : "Sign In"}
      </button>
      <p className="text-center text-sm text-st-text-muted">
        Don't have an account?{" "}
        <Link href="/register" className="text-st-accent hover:text-st-accent-hover transition-colors font-medium">Sign up</Link>
      </p>
      <p className="text-center">
        <Link href="/forgot-password" className="text-xs text-st-accent hover:text-st-accent-hover transition-colors">Forgot password?</Link>
      </p>
    </form>
  );
}
