"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Beaker } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAutoFill = () => {
    setEmail(process.env.NEXT_PUBLIC_TEST_EMAIL || "test@studytrack.dev");
    setPassword(process.env.NEXT_PUBLIC_TEST_PASSWORD || "password123");
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await login(email, password);
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-st-text-primary">Sign in to your account</h3>
        {process.env.NEXT_PUBLIC_ENABLE_TEST_AUTH === "true" && (
          <Button 
            type="button"
            variant="outline" 
            size="sm" 
            onClick={handleAutoFill}
            className="text-xs py-1 h-8 border-st-accent text-st-accent hover:bg-st-accent/10"
          >
            <Beaker size={14} className="mr-1" /> Auto Fill Test
          </Button>
        )}
      </div>
      
      <form className="space-y-6" onSubmit={handleLogin}>
        <Input 
          label="Email address"
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          placeholder="developer@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div>
          <Input
            label="Password"
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <div className="flex items-center justify-end mt-2">
            <div className="text-sm">
              <Link href="/forgot-password" className="font-medium text-st-accent hover:text-st-accent-hover">
                Forgot your password?
              </Link>
            </div>
          </div>
        </div>

        {error && <p className="text-sm text-st-danger text-center">{error}</p>}
        <div>
          <Button type="submit" disabled={loading} className="w-full bg-gradient-to-r from-st-accent to-st-accent-hover text-white border-0 hover:from-st-accent-hover hover:to-st-accent">
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </div>
      </form>

      <div className="mt-8">
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-st-border" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-st-bg-card px-2 text-st-text-muted">Or continue with</span>
          </div>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <Button type="button" variant="outline" className="w-full hover:border-st-accent hover:text-st-accent transition-colors">
            <span className="sr-only">Sign in with Google</span>
            Google
          </Button>
          <Button type="button" variant="outline" className="w-full hover:border-st-accent hover:text-st-accent transition-colors">
            <span className="sr-only">Sign in with GitHub</span>
            GitHub
          </Button>
        </div>
      </div>

      <p className="mt-8 text-center text-sm text-st-text-secondary">
        Not a member?{" "}
        <Link href="/register" className="font-medium text-st-accent hover:text-st-accent-hover">
          Apply for early access
        </Link>
      </p>
    </div>
  );
}
