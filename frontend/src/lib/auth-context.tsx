"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth as useClerkAuth } from "@clerk/nextjs";
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
  const { isSignedIn, getToken: getClerkToken } = useClerkAuth();
  const router = useRouter();
  const exchangedRef = useRef(false);

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

    const exchangeClerkSession = async () => {
      if (exchangedRef.current) return;
      exchangedRef.current = true;

      try {
        let clerkToken = await getClerkToken();
        let retries = 0;
        while (!clerkToken && retries < 10) {
          await new Promise(r => setTimeout(r, 200));
          clerkToken = await getClerkToken();
          retries++;
        }
        if (!clerkToken) {
          if (!cancelled) setIsLoading(false);
          return;
        }

        const res = await api.post<LoginResponse>("/auth/clerk", { token: clerkToken });
        if (cancelled) return;
        api.setToken(res.token, res.refreshToken || null);
        setToken(res.token);
        setUser(res.user);
        writeStoredUser(res.user);
        setUserKey(k => k + 1);
        setIsLoading(false);
      } catch (e) {
        if (cancelled) return;
        clearAuthState();
        api.setToken(null);
        setIsLoading(false);
      }
    };

    const init = async () => {
      if (isSignedIn) {
        await exchangeClerkSession();
      } else {
        const savedToken = localStorage.getItem("accessToken");
        if (savedToken) {
          api.setToken(savedToken);
          setToken(savedToken);
          const savedUser = readStoredUser();
          if (savedUser) setUser(savedUser);

          try {
            const res = await api.get<{ user: User }>("/auth/me");
            if (cancelled) return;
            setUser(res.user);
            writeStoredUser(res.user);
          } catch {
            if (cancelled) return;
            clearAuthState();
            api.setToken(null);
          }
        }
        if (!cancelled) setIsLoading(false);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, getClerkToken]);

  const refreshUser = useCallback(async () => {
    try {
      const res = await api.get<{ user: User }>("/auth/me");
      setUser(res.user);
      writeStoredUser(res.user);
    } catch {
    }
  }, []);

  const login = useCallback(async (_email: string, _code: string, _captchaKey: string, _captchaAnswer: string, _isOtp?: boolean, _isFace?: boolean) => {
    router.push("/login");
  }, [router]);

  const register = useCallback(async (_name: string, _email: string, _password: string, _captchaKey: string, _captchaAnswer: string) => {
    router.push("/register");
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
