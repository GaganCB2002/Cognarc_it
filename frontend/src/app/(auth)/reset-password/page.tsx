"use client";

import { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { KeyRound, CheckCircle2, AlertTriangle, Loader2 } from "lucide-react";
import api from "@/lib/api";

function ResetPasswordForm() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const token = searchParams.get("token");
  const email = searchParams.get("email");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [invalid, setInvalid] = useState(false);

  useEffect(() => {
    if (!token || !email) setInvalid(true);
  }, [token, email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    if (password.length < 8) { setError("Password must be at least 8 characters"); setLoading(false); return; }
    if (password !== confirmPassword) { setError("Passwords do not match"); setLoading(false); return; }
    try {
      await api.post("/auth/reset-password", { token, email, password });
      setSuccess(true);
      setTimeout(() => router.push("/login"), 3000);
    } catch (err: any) {
      setError(err.message || "Failed to reset password");
    } finally {
      setLoading(false);
    }
  };

  if (invalid) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center mb-4 border border-red-500/10">
          <AlertTriangle className="w-7 h-7 text-red-400" />
        </div>
        <h3 className="text-lg font-semibold text-st-text-primary mb-2">Invalid reset link</h3>
        <p className="text-sm text-st-text-secondary mb-6">This link is invalid or expired. Please request a new one.</p>
        <Link href="/forgot-password" className="inline-flex items-center gap-2 text-sm font-medium text-st-accent hover:text-st-accent-hover">Request new reset link</Link>
      </motion.div>
    );
  }

  if (success) {
    return (
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center py-4">
        <div className="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-500/5 flex items-center justify-center mb-4 border border-emerald-500/10">
          <CheckCircle2 className="w-7 h-7 text-emerald-400" />
        </div>
        <h3 className="text-lg font-semibold text-st-text-primary mb-2">Password reset successful</h3>
        <p className="text-sm text-st-text-secondary mb-6">Redirecting you to sign in...</p>
        <Link href="/login" className="inline-flex items-center gap-2 text-sm font-medium text-st-accent hover:text-st-accent-hover">Sign in now</Link>
      </motion.div>
    );
  }

  return (
    <div>
      <div className="text-center mb-6">
        <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-st-accent/20 to-st-accent/5 flex items-center justify-center mb-3 border border-st-accent/10">
          <KeyRound className="w-6 h-6 text-st-accent" />
        </div>
        <h3 className="text-xl font-semibold text-st-text-primary">Set new password</h3>
        <p className="text-sm text-st-text-secondary mt-1">Enter your new password for <strong className="text-st-text-primary">{email || ""}</strong></p>
      </div>
      <form className="space-y-5" onSubmit={handleSubmit}>
        <Input label="New password" id="password" type="password" autoComplete="new-password" required placeholder="Min. 8 characters" value={password} onChange={(e) => setPassword(e.target.value)} minLength={8} />
        <Input label="Confirm new password" id="confirmPassword" type="password" autoComplete="new-password" required placeholder="Re-enter new password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
        {error && <p className="text-sm text-st-danger text-center">{error}</p>}
        <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-st-accent to-st-accent-hover text-black border-0 hover:from-st-accent-hover hover:to-st-accent font-bold">
          {loading ? "Resetting..." : "Reset password"}
        </Button>
      </form>
      <p className="mt-8 text-center text-sm"><Link href="/login" className="font-medium text-st-accent hover:text-st-accent-hover">Back to sign in</Link></p>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-6 h-6 animate-spin text-st-accent" />
      </div>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
