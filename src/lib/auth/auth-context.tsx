"use client";

import * as React from "react";

import type { Role, User } from "@/lib/data/types";
import { DEMO_PASSWORD, USERS } from "@/lib/data/users";

const STORAGE_KEY = "hrd.session";

interface AuthContextValue {
  user: User | null;
  role: Role | null;
  isAdmin: boolean;
  hydrated: boolean;
  login: (email: string, password: string) => Promise<{ ok: true; user: User } | { ok: false; error: string }>;
  logout: () => void;
  switchRole: (role: Role) => void;
  changePassword: (current: string, next: string) => Promise<{ ok: boolean; error?: string }>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as { userId: string };
        const found = USERS.find((u) => u.id === parsed.userId) ?? null;
        setUser(found);
      }
    } catch {
      // ignore corrupted storage
    } finally {
      setHydrated(true);
    }
  }, []);

  const persist = React.useCallback((u: User | null) => {
    try {
      if (u) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify({ userId: u.id }));
        window.localStorage.setItem("hrd.accessToken", `mock-jwt-${u.id}`);
      } else {
        window.localStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem("hrd.accessToken");
      }
    } catch {
      // storage may be unavailable
    }
  }, []);

  const login = React.useCallback<AuthContextValue["login"]>(
    async (email, password) => {
      await wait(650); // simulate the Keycloak token round-trip
      const found = USERS.find((u) => u.email.toLowerCase() === email.trim().toLowerCase());
      if (!found || password !== DEMO_PASSWORD) {
        return { ok: false, error: "Invalid email or password." };
      }
      setUser(found);
      persist(found);
      return { ok: true, user: found };
    },
    [persist]
  );

  const logout = React.useCallback(() => {
    setUser(null);
    persist(null);
  }, [persist]);

  const switchRole = React.useCallback(
    (role: Role) => {
      const next = USERS.find((u) => u.role === role) ?? null;
      setUser(next);
      persist(next);
    },
    [persist]
  );

  const changePassword = React.useCallback<AuthContextValue["changePassword"]>(async (current) => {
    await wait(500);
    if (current !== DEMO_PASSWORD) return { ok: false, error: "Current password is incorrect." };
    return { ok: true };
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      role: user?.role ?? null,
      isAdmin: user?.role === "ADMIN",
      hydrated,
      login,
      logout,
      switchRole,
      changePassword,
    }),
    [user, hydrated, login, logout, switchRole, changePassword]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
