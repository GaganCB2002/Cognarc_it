"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";

interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  role?: string;
  emailVerified?: string;
  profile?: {
    bio?: string;
    targetRole?: string;
    currentLevel?: string;
    weeklyHours?: number;
    timezone?: string;
    skills?: any;
    careerGoals?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
  };
  settings?: any;
}

interface LoginStep1Response {
  message: string;
  otpKey: string;
  userId: string;
}

interface LoginStep2Response {
  message: string;
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  loginStep1: (email: string, password: string, captchaKey: string, captchaAnswer: number) => Promise<LoginStep1Response>;
  loginStep2: (userId: string, otpKey: string, otp: string) => Promise<void>;
  register: (name: string, email: string, password: string, captchaKey: string, captchaAnswer: number) => Promise<LoginStep1Response>;
  verifyEmail: (userId: string, otpKey: string, otp: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  const isAuthenticated = !!token && !!user;

  useEffect(() => {
    api.setOnUnauthorized(() => {
      setToken(null);
      setUser(null);
      router.push("/login");
    });

    const savedToken = localStorage.getItem("token");
    if (savedToken) {
      api.setToken(savedToken);
      setToken(savedToken);
      api.get<{ user: User }>("/auth/me").then((res) => {
        setUser(res.user);
      }).catch(() => {
        localStorage.removeItem("token");
        api.setToken(null);
        setToken(null);
      }).finally(() => {
        setIsLoading(false);
      });
    } else {
      setIsLoading(false);
    }
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get<{ user: User }>("/auth/me");
      setUser(res.user);
    } catch {
    }
  }, []);

  const loginStep1 = useCallback(async (email: string, password: string, captchaKey: string, captchaAnswer: number) => {
    return api.post<LoginStep1Response>("/auth/login", { email, password, captchaKey, captchaAnswer });
  }, []);

  const loginStep2 = useCallback(async (userId: string, otpKey: string, otp: string) => {
    const res = await api.post<LoginStep2Response>("/auth/login/verify", { userId, otpKey, otp });
    api.setToken(res.token);
    setToken(res.token);
    setUser(res.user);
    router.push("/curriculum");
  }, [router]);

  const register = useCallback(async (name: string, email: string, password: string, captchaKey: string, captchaAnswer: number) => {
    return api.post<LoginStep1Response>("/auth/register", { name, email, password, captchaKey, captchaAnswer });
  }, []);

  const verifyEmail = useCallback(async (userId: string, otpKey: string, otp: string) => {
    const res = await api.post<LoginStep2Response>("/auth/register/verify", { userId, otpKey, otp });
    api.setToken(res.token);
    setToken(res.token);
    setUser(res.user);
    router.push("/curriculum");
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await api.post("/auth/logout");
    } catch {
    }
    api.setToken(null);
    setToken(null);
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{
      user, token, isLoading, isAuthenticated,
      loginStep1, loginStep2, register, verifyEmail, logout, refreshUser,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
