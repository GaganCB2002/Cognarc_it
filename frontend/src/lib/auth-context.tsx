"use client";

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from "react";
import { useRouter } from "next/navigation";
import { useAuth as useClerkAuth, useClerk, useUser } from "@clerk/nextjs";
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



interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  userKey: number;
  login: () => Promise<void>;
  register: () => Promise<void>;
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

function writeStoredUser(user: User | null) {
  if (typeof window === "undefined") return;
  if (user) {
    localStorage.setItem(AUTH_USER_STORAGE_KEY, JSON.stringify(user));
  } else {
    localStorage.removeItem(AUTH_USER_STORAGE_KEY);
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [userKey, setUserKey] = useState(0);
  const { isSignedIn, getToken: getClerkToken } = useClerkAuth();
  const { user: clerkUser, isLoaded: isClerkUserLoaded } = useUser();
  const { signOut } = useClerk();
  const router = useRouter();

  // Create our internal User object from Clerk's user object
  const user: User | null = useMemo(() => clerkUser ? {
    id: clerkUser.id,
    email: clerkUser.primaryEmailAddress?.emailAddress || "",
    name: clerkUser.fullName || clerkUser.firstName || "User",
    avatar: clerkUser.imageUrl,
    role: "STUDENT",
    profile: {}
  } : null, [clerkUser]);

  const isAuthenticated = !!token;

  useEffect(() => {
    let cancelled = false;

    const clearAuthState = () => {
      setToken(null);
      clearAllLocalData();
      setUserKey(k => k + 1);
    };

    api.setOnUnauthorized(() => {
      clearAuthState();
      api.setToken(null);
    });

    const init = async () => {
      if (isSignedIn) {
        try {
          const clerkToken = await getClerkToken();
          if (cancelled) return;
          if (clerkToken) {
            api.setToken(clerkToken, null);
            setToken(clerkToken);
            writeStoredUser(user);

            // Record this login event in Supabase (fire-and-forget)
            api.post("/login/record", {}).catch(() => {});
          } else {
            clearAuthState();
          }
        } catch {
          if (!cancelled) clearAuthState();
        }
      } else if (isClerkUserLoaded) {
        clearAuthState();
        api.setToken(null);
      }
      
      if (!cancelled) {
        setIsLoading(!isClerkUserLoaded);
        setUserKey(k => k + 1);
      }
    };

    init();

    return () => {
      cancelled = true;
    };
  }, [isSignedIn, isClerkUserLoaded, getClerkToken, user]);

  const refreshUser = useCallback(async () => {
    // Relying on Clerk for user state, no need to manually fetch
  }, []);

  const login = useCallback(async () => {
    router.push("/login");
  }, [router]);

  const register = useCallback(async () => {
    router.push("/register");
  }, [router]);

  const logout = useCallback(async () => {
    try {
      await signOut();
    } catch {
    }
    api.setToken(null);
    setToken(null);
    clearAllLocalData();
    setUserKey(k => k + 1);
    window.location.replace("/");
  }, [signOut]);

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
