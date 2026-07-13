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
    skills?: unknown;
    careerGoals?: string;
    githubUrl?: string;
    linkedinUrl?: string;
    portfolioUrl?: string;
  };
  settings?: unknown;
}

interface LoginResponse {
  message: string;
  token: string;
  refreshToken?: string;
  user: User;
}

interface RegisterResponse {
  message: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userKey: number;
  login: (email: string, code: string, captchaKey: string, captchaAnswer: string, isOtp?: boolean, isFace?: boolean) => Promise<void>;
  register: (name: string, email: string, password: string, captchaKey: string, captchaAnswer: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const AUTH_USER_STORAGE_KEY = "authUser";

function clearAllLocalData() {
  if (typeof window === "undefined") return;
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem(AUTH_USER_STORAGE_KEY);
}

function readStoredUser(): User | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(AUTH_USER_STORAGE_KEY);
    return raw ? JSON.parse(raw) as User : null;
  } catch {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
    return null;
  }
}

function writeStoredUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userKey, setUserKey] = useState(0);
  const router = useRouter();

  const isAuthenticated = !!token;

  useEffect(() => {
    let cancelled = false;

    const clearAuthState = () => {
      setToken(null);
      setUser(null);
      writeStoredUser(null);
      clearAllLocalData();
      setUserKey(k => k + 1);
    };

    api.setOnUnauthorized(() => {
      clearAuthState();
      api.setToken(null);
    });

    const savedToken = localStorage.getItem("accessToken");
    const savedRefreshToken = localStorage.getItem("refreshToken");
    if (savedToken) {
      api.setToken(savedToken, savedRefreshToken);
      setToken(savedToken);
      const savedUser = readStoredUser();
      if (savedUser) setUser(savedUser);

      void api.get<{ user: User }>("/auth/me").then((res) => {
        if (cancelled) return;
        setUser(res.user);
        writeStoredUser(res.user);
        setIsLoading(false);
      }).catch(() => {
        if (cancelled) return;
        clearAuthState();
        api.setToken(null);
        setIsLoading(false);
      });
      return;
    }

    setIsLoading(false);

    return () => {
      cancelled = true;
    };
  }, [router]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get<{ user: User }>("/auth/me");
      setUser(res.user);
      writeStoredUser(res.user);
    } catch {
    }
  }, []);

  const login = useCallback(async (email: string, code: string, captchaKey: string, captchaAnswer: string, isOtp?: boolean, isFace?: boolean) => {
    clearAllLocalData();
    let res: LoginResponse;
    if (isFace) {
      res = await api.post<LoginResponse>("/auth/face-login", { email, faceImage: code, captchaKey, captchaAnswer });
    } else if (isOtp) {
      res = await api.post<LoginResponse>("/auth/verify-otp", { email, otp: code, captchaKey, captchaAnswer });
    } else {
      res = await api.post<LoginResponse>("/auth/login", { email, password: code, captchaKey, captchaAnswer });
    }
    api.setToken(res.token, res.refreshToken || null);
    setToken(res.token);
    setUser(res.user);
    writeStoredUser(res.user);
    setUserKey(k => k + 1);
    const role = res.user.role ? res.user.role.toLowerCase().replace(/_/g, '-') : 'student';
    const dashboardPath = `/${role}/dashboard`;
    router.push(dashboardPath);
  }, [router]);

  const register = useCallback(async (name: string, email: string, password: string, captchaKey: string, captchaAnswer: string) => {
    await api.post<RegisterResponse>("/auth/register", { name, email, password, captchaKey, captchaAnswer });
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
    writeStoredUser(null);
    clearAllLocalData();
    setUserKey(k => k + 1);
    window.location.replace("/");
  }, []);

  return (
    <AuthContext.Provider value={{
      user, token, isLoading, isAuthenticated, userKey,
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
