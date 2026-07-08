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

interface AuthResponse {
  message: string;
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string, captchaKey: string, captchaAnswer: string) => Promise<void>;
  register: (name: string, email: string, password: string, captchaKey: string, captchaAnswer: string) => Promise<void>;
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

  const login = useCallback(async (email: string, password: string, captchaKey: string, captchaAnswer: string) => {
    const res = await api.post<AuthResponse>("/auth/login", { email, password, captchaKey, captchaAnswer });
    api.setToken(res.token);
    setToken(res.token);
    setUser(res.user);
    const dashboardPath = res.user.role === "ADMIN" || res.user.role === "SUPER_ADMIN" ? "/admin" : "/dashboard";
    router.push(dashboardPath);
  }, [router]);

  const register = useCallback(async (name: string, email: string, password: string, captchaKey: string, captchaAnswer: string) => {
    const res = await api.post<AuthResponse>("/auth/register", { name, email, password, captchaKey, captchaAnswer });
    // New users are pending approval — do NOT auto-login
    router.push("/login?registered=true");
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
      login, register, logout, refreshUser,
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