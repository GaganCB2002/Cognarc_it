"use client";

import React from "react";
import { AuthProvider } from "@/lib/auth-context";
import { SessionProvider } from "@/contexts/SessionContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <SessionProvider>
        {children}
      </SessionProvider>
    </AuthProvider>
  );
}
